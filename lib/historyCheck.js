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

function loadVulnerableSet() {
  const filename = "vulnerable.txt";
}

function wasVulnerable(domain) {
  return false;
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
  // TODO: limit to recent history. past few months?
  // TODO: this needs to be done async. I'm concerned it could jank the
  // browser, especially for users with a lot of history.
  search(
    {}, // An empty query object returns all history (wat)
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
  let checkPage = data.url("historyCheck.html");
  tabs.open(checkPage);
  // Attach the content script and start the check
  // XXX: will this get garbage collected?
  pageMod.PageMod({
    include: checkPage,
    contentScriptFile: data.url("historyCheck.js"),
    onAttach: function(worker) {
      doHistoryCheck(worker);
      // worker.port.emit
      // worker.port.on
      // XXX: might not need this
    }
  });
}

exports.startHistoryScan = startHistoryScan;
