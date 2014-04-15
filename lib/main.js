"use strict";

const { Cc, Ci, Cu } = require("chrome");
var system = require("sdk/system");
var URL = require("sdk/url").URL;
var Notifications = require("sdk/notifications");
var self = require("sdk/self");
var icon = self.data.url("heartbleed-64.png");
const { hasCookies, clearCookiesForHost } = require("./cookieUtils.js");
const { isPrivate } = require("sdk/private-browsing");
const { checkDomain } = require("./check.js");
const { data } = require("sdk/self");
const pageMod = require("sdk/page-mod");
let { search } = require("sdk/places/history");

Cu.import("resource://services-common/utils.js");
let makeURI = CommonUtils.makeURI;

let storage = require("./storage.js");
storage.initStorage();

const tabs = require("sdk/tabs");
tabs.on("ready", checkBleed);

// Australis changes addon-sdk UI API
// See https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/ui
// https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/widget
var isAustralis = require("sdk/system/xul-app")
                    .versionInRange(system.version, "29.0");


var ui = isAustralis ? require("./australis.js") : require("./ui.js");

function notifyVulnerable(domain) {
  Notifications.notify({
    title: 'This site is vulnerable!',
    text: 'The domain ' + domain + ' is vulnerable to the Heartbleed SSL bug.',
    iconURL: icon,
  });
}

function notifyClearedCookies(domain) {
  Notifications.notify({
    title: "Cookies cleared automatially",
    // TODO: refine this language
    text: "We automatically cleared your cookies for " + domain + " to protect you from the Heartbleed SSL bug.",
    iconURL: icon
  });
}

function autoClearCookies(domain) {
  if (storage.getSettings("autoClearCookies") === false ) {
    console.log("not auto clearing cookies");
    return;
  }
  console.log('auto clearing cookies');

  let isVulnerable = storage.isVulnerable(domain);
  let vulnerableOrUnknown = isVulnerable === true || isVulnerable === undefined;

  if (vulnerableOrUnknown && hasCookies(domain)) {
    // Clear the cookies to avoid them potentially being compromised
    clearCookiesForHost(domain);
    notifyClearedCookies(domain);
  }
}

function checkBleed(tab) {
  if (!storage.getSettings("addonEnabled")) {
    return;
  }

  try {
    var url = URL(tab.url);
    var domain = url.host;

    // only check https tabs
    if (url.scheme !== "https") {
      return;
    }

    // Automatically clear cookies for vulnerable or unknown sites
    autoClearCookies(domain);

    let isVulnerable = storage.isVulnerable(domain);
    if (isVulnerable === true) {
      notifyVulnerable(domain);
    } else if (isVulnerable === undefined && !isPrivate(tab)) {
      checkDomain(domain, function callback(response) {
        storage.cacheResponse(domain, response.json);
        // 0 = vulnerable, 1 = not vulnerable, 2 = error
        if (response.json.code === 0) {
          notifyVulnerable(domain);
        }

        // Update the panel UX if panel is open when result comes in
        if (tab.id == tabs.activeTab.id) {
          ui.updatePanel();
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
}

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
      let resultUri = makeURI(result.url);
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

exports.main = function(options, callbacks) {
  // Auto-check the user's history and display results in a tab after install
  /* Comment out to debug, need history but this won't get triggered because
  * we're reusing the profile. */
  if (options.loadReason === "install") {
    startHistoryCheck();
  }
  // startHistoryCheck();
}
