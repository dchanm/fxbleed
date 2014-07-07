"use strict";

const { Cc, Ci, Cu } = require("chrome");
var system = require("sdk/system");
var URL = require("sdk/url").URL;
var Notifications = require("sdk/notifications");
var self = require("sdk/self");
const pageMod = require("sdk/page-mod");
var icon = self.data.url("heartbleed-64.png");
const { hasCookies, clearCookiesForHost } = require("./cookieUtils.js");
const { isPrivate } = require("sdk/private-browsing");
const { checkDomain } = require("./check.js");
const { data } = require("sdk/self");
const { startHistoryScan } = require("./historyCheck.js");
const FXBleed = require("./FXBleed");

let storage = require("./storage.js");
storage.initStorage();

const tabs = require("sdk/tabs");
//tabs.on("ready", checkBleed);
tabs.on("ready", check);

// Australis changes addon-sdk UI API
// See https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/ui
// https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/widget
const isAustralis = require("sdk/system/xul-app")
                    .versionInRange(system.version, "29.0");

const ui = isAustralis ? require("./australis.js") : require("./ui.js");

function notifyVulnerable(domain) {
  if (! storage.getSettings("notificationsEnabled")) {
    return;
  }
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

/* This is the check bleed function that uses the client probe */
function check(tab) {
  let url = URL(tab.url);
  // only check https tabs
  if (url.scheme === "https") {
    if (FXBleed.HOSTNAME_CACHE.hasOwnProperty(url.host)) {
      if (FXBleed.HOSTNAME_CACHE[url.host] === FXBleed.SITE_VULN) {
        //console.log("Cache hit");
        ui.notify(url.host);
      }
    } else {
      FXBleed.connect(url);
    }
  }
}

/* This is the checkBleed function that uses the remote service */
function checkBleed(tab) {
  try {
    var url = URL(tab.url);
    var domain = url.host;

    // only check https tabs
    if (url.scheme !== "https") {
      return;
    }

    // Automatically clear cookies for vulnerable or unknown sites
    //autoClearCookies(domain);

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

exports.main = function(options, callbacks) {
  if (options.loadReason === "install") {
    let firstRunPage = data.url("firstRun.html")
    tabs.open(firstRunPage);
    pageMod.PageMod({
      include: firstRunPage,
      contentScriptFile: data.url("firstRun.js"),
      onAttach: function(worker) {
        worker.port.on("startHistoryScan", function() {
          startHistoryScan();
        });
      }
    });
  }
}
