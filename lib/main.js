"use strict";

var system = require("sdk/system");
var Request = require("sdk/request").Request;
var URL = require("sdk/url").URL;
var Notifications = require("sdk/notifications");
var self = require("sdk/self");
var icon = self.data.url("heartbleed-64.png");
const { hasCookies, clearCookiesForHost } = require("./cookieUtils.js");

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

// Mozilla-operated instance of Filippo Valsorda's heartbleed check service,
// with some improvements: https://github.com/jrconlin/Heartbleed
var server = "http://heartbleed.prod.mozaws.net/bleed/";

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
    } else if (isVulnerable === undefined &&
               // ignore private browsing tabs
               !require("sdk/private-browsing").isPrivate(tab)) {
      Request({
        url: server + domain,
        overrideMimeType: "application/json",
        onComplete: function(response) {
          // 0 = vulnerable, 1 = not vulnerable, 2 = error
          if (response.json.code === 0) {
            notifyVulnerable(domain);
          }
          storage.cacheResponse(domain, response.json);
          // Update the panel UX if panel is open when result comes in
          if (tab.id == tabs.activeTab.id) {
            ui.panel.port.emit("siteStatus", {
              host: domain,
              response: storage.getResponse(domain)
            });
          }
        }
      }).get();
    }
  } catch (e) {
    console.log(e);
  }
}
