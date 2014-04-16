"use strict";

const { Cc, Ci, Cu } = require("chrome");
const tabs = require("sdk/tabs");
const URL = require("sdk/url").URL;
const { search } = require("sdk/places/history");
const pageMod = require("sdk/page-mod");
const { data } = require("sdk/self");

function checkHistorySet(worker, historySet) {
}

function doHistoryCheck(worker) {
  // An empty query object returns all history
  // TODO: limit to recent history. past few months?
  // TODO: this needs to be done async. I'm concerned it could jank the
  // browser, especially for users with a lot of history.
  search({}).on("end", function (results) {
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
    checkHistorySet(worker, historySet);
  });
}

function startHistoryCheck() {
  let checkPage = data.url("history-check.html");
  tabs.open(checkPage);
  // Attach the content script and start the check
  // XXX: will this get garbage collected?
  pageMod.PageMod({
    include: checkPage,
    contentScriptFile: data.url("history-check.js"),
    onAttach: function(worker) {
      doHistoryCheck(worker);
      // worker.port.emit
      // worker.port.on
      // XXX: might not need this
    }
  });
}

exports.startHistoryCheck = startHistoryCheck;
