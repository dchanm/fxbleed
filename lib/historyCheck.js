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

let vulnerableSet = {};

function loadVulnerableSet() {
  let vulnerableListUrl = data.url("vulnerable.json");
  Request({
    url: vulnerableListUrl,
    overrideMimeType: "application/json",
    onComplete: function(response) {
      // Compile Array of once-vulnerable domains into a map for faster
      // lookups
      response.json.forEach(function (domain) {
        vulnerableSet[domain] = true;
      });
    }
  }).get();
}

function wasVulnerable(domain) {
  // TODO: check cache of vulnerable sites that the addon has seen so we
  // aren't only covering the Alexa Top 10,000
  return vulnerableSet.hasOwnProperty(domain);
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
  // TODO: Make sure this doesn't jank the browser, especially for users with
  // a lot of history.

  // To keep the list reasonable, only scan the last 3 months of history.
  // TODO: allow the user to control this
  let threeMonthsAgo = Date.now() - (1000*60*60*24*7*4*3);
  search(
    { from: threeMonthsAgo }, // An empty query object returns all history (wat)
    {
      "sort": "visitCount",
      "count": 100 // TODO tune (abitrary), or use from: date in the query
    }
  ).on("end", function (results) {
    let historySet = {};
    results.forEach(function(result) {
      let resultUri = URL(result.url);
      if (resultUri.scheme != "https") {
        return;
      }
      if (! historySet.hasOwnProperty(resultUri.host)) {
        historySet[resultUri.host] = true;
      }
    });
    console.log(historySet); // DEBUG
    checkHistory(worker, Object.keys(historySet), 0);
  });
}

function startHistoryScan() {
  promised(loadVulnerableSet)().then(function success() {
    let checkPage = data.url("historyCheck.html");
    tabs.open(checkPage);
    // Attach the content script and start the check
    pageMod.PageMod({
      include: checkPage,
      contentScriptFile: data.url("historyCheck.js"),
      onAttach: function(worker) {
        doHistoryCheck(worker);
      }
    });
  }, function failure() {
    console.log("An error occurred in loadVulnerableSet");
  });
}

exports.startHistoryScan = startHistoryScan;
