"use strict";

const { Cc, Ci, Cu } = require("chrome");
const tabs = require("sdk/tabs");
const URL = require("sdk/url").URL;
const { search } = require("sdk/places/history");
const pageMod = require("sdk/page-mod");
const { data } = require("sdk/self");
const fileIO = require("sdk/io/file");
const { checkDomain } = require("./check.js");
let storage = require("./storage.js");
var Request = require("sdk/request").Request;
const { promised } = require('sdk/core/promise');

let vulnerableList = null;

function loadVulnerableList() {
  // If the list is already loaded, don't reload it
  if (vulnerableList !== null) {
    return;
  }
  let vulnerableListUrl = data.url("vulnerable.json");
  Request({
    url: vulnerableListUrl,
    overrideMimeType: "application/json",
    onComplete: function(response) {
      vulnerableList = response.json;
    }
  }).get();
}

function wasVulnerable(domain) {
  // Unfortunately, the masstest list doesn't include common subdomains, some
  // of which are automatically redirected to (e.g. yahoo.com --> www.yahoo.com)
  // TODO: this is not perfect. It assumes that all subdomains of a vulnerable
  // domain were also vulnerable, which is not necessarily true.
  for (let i = 0; i < vulnerableList.length; i++) {
    let currentDomainRe = new RegExp(vulnerableList[i] + "$");
    if (domain.match(currentDomainRe)) {
      return true;
    }
  }
  return storage.wasVulnerable(domain);
}

// XXX: this is recursive, and I'm worried about the stack getting too deep if
// there are a lot of domains in the historyList. Other option would be to use
// async.js with series.
function checkHistory(worker, historyList, index) {
  if (index >= historyList.length) {
    // the scan is finished, remove the progress indicator
    worker.port.emit("scanFinished", {});
    return;
  }
  let domain = historyList[index];
  checkDomain(domain, function callback(response) {
    storage.cacheResponse(domain, response.json);
    worker.port.emit("checkResult", {
      "domain": domain,
      "code": response.json.code,
      "wasVulnerable": wasVulnerable(domain)
    });
    checkHistory(worker, historyList, index+1);
  });
}

function doHistoryCheck(worker) {
  // To keep the list reasonable, only scan the last 3 months of history.
  // TODO: allow the user to control this
  let threeMonthsAgo = Date.now() - (1000*60*60*24*7*4*3);
  search(
    { from: threeMonthsAgo }, // An empty query object returns all history (wat)
    {
      "sort": "visitCount",
      "count": 1000 // TODO tune (abitrary), or use from: date in the query
    }
  ).on("end", function (results) {
    // TODO: fix JANK
    console.log("the jank has begun! with " + results.length + " history items to scan");
    let historySet = {};
    results.forEach(function(result) {
      let resultUri = URL(result.url);
      if (resultUri.scheme != "https") {
        return;
      }
      //if (! historySet.hasOwnProperty(resultUri.host)) {
      historySet[resultUri.host] = true;
      //}
    });
    console.log(historySet); // DEBUG
    checkHistory(worker, Object.keys(historySet), 0);
  });
}

function getTab(url) {
  for each(let tab in tabs) {
    if (tab.url === url) {
      return tab;
    }
  }
}

function startHistoryScan() {
  let checkPageUrl = data.url("historyCheck.html");
  let pmod = null;

  // If the history scan page is already open, leave it open/switch to it
  let tab = getTab(checkPageUrl);
  if (tab) {
    tab.reload();
    tab.activate();
    tab.window.activate();
  } else {
    tabs.open(checkPageUrl);
    // Attach the content script and start the check
    pmod = pageMod.PageMod({
      include: checkPageUrl,
      contentScriptFile: data.url("historyCheck.js"),
      onAttach: function(worker) {
        promised(loadVulnerableList)().then(function success() {
          doHistoryCheck(worker);
        }, function failure() {
          console.log("An error occurred in loadVulnerableList");
        });
      }
    });

    // HACK: we just opened the tab, so it must be the active tab
    // getTab doesn't work yet, it's too soon (url is still about:blank)
    tab = tabs.activeTab;
    tab.on('close', function() {
      console.log("destroying pagemod");
      pmod.destroy();
    });
  }
}

exports.startHistoryScan = startHistoryScan;
