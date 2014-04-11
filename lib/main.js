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

require("sdk/tabs").on("ready", checkBleed);

// Australis changes addon-sdk UI API
// See https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/ui
// https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/widget
var isAustralis = require("sdk/system/xul-app")
                    .versionInRange(system.version, "29.0");


var ui = isAustralis ? require("./australis.js") : require("./ui.js");

var server = "http://bleed-1161785939.us-east-1.elb.amazonaws.com/bleed/";

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
    //autoClearCookies(domain);

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
          console.log("response: " + response.json.code);
         switch (response.json.code) {
           // vulnerable
           case 0:
             storage.cacheSiteStatus(domain, true);
             notifyVulnerable(domain);
             break;
           // not vulnerable
           case 1:
             storage.cacheSiteStatus(domain, false);
             break;
           // error, ignore
           default:
             break;
         }
        }
      }).get();
    }
  } catch (e) {
    console.log(e);
  }
}
