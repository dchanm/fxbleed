"use strict";

const system = require("sdk/system");
const FXBleed = require("./FXBleed");
const prefs = require("sdk/simple-prefs");
const { URL } = require("sdk/url");

require("sdk/tabs").on("ready", check);

// Australis changes addon-sdk UI API
// See https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/ui
// https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/widget
const isAustralis = require("sdk/system/xul-app")
                    .versionInRange(system.version, "29.0");

const ui = isAustralis ? require("./australis.js") : require("./ui.js");

let isActive = prefs.prefs.enabled;

prefs.on("enabled", function(prefName) {
  isActive = prefs.prefs[prefName];
});

function check(tab) {
  let url = URL(tab.url);
  //only check https tabs
  if (!isActive || url.scheme !== "https") {
    return;
  }

  if (FXBleed.HOSTNAME_CACHE[url.host] === true) {
    console.log("Cache hit");
    ui.notify(url.host);
  } else {
    FXBleed.connect(url);
  }
}
