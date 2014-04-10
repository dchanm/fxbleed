var system = require("sdk/system");
var URL = require("sdk/url").URL;
var Notifications = require("sdk/notifications");
var self = require("sdk/self");
var icon = self.data.url("heartbleed-64.png");
var prefs = require("sdk/simple-prefs");
var FXBleed = require("./FXBleed");

require("sdk/tabs").on("ready", checkBleed);
require("sdk/preferences/service").set("dom.mozTCPSocket.enabled", true);

var utils = require('sdk/window/utils');

// Australis changes addon-sdk UI API
// See https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/ui
// https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/widget
var isAustralis = require("sdk/system/xul-app")
                    .versionInRange(system.version, "29.0");


var ui = isAustralis ? require("./australis.js") : require("./ui.js");
var isActive = prefs.prefs.enabled;

prefs.on("enabled", function(prefName) {
  isActive = prefs.prefs[prefName];
});

var HOSTNAME_CACHE = {};

function notify(host) {
    Notifications.notify({
      title: 'This site is vulnerable!',
      text: 'The domain ' + host + ' is vulnerable to the Heartbleed SSL bug.',
      iconURL: icon,
    });
}

function checkBleed(tab) {
  if (!isActive) {
    return;
  }

  try {
    var url = URL(tab.url);
    
    //only check https tabs
    if (url.scheme !== "https") {
      return;
    }

    if (HOSTNAME_CACHE[url.host] === true) {
      notify(url.host);
    } else {
      console.log("Testing " + url.host);
      FXBleed.connect(url.hostname, url.port || 443);
    }
  } catch (e) {
    console.log(e.name);
  }
}
