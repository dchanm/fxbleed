"use strict";

const { Cc, Ci, Cu } = require("chrome");
var URL = require("sdk/url").URL;
var self = require("sdk/self");
const storage = require("./storage.js");
const tabs = require("sdk/tabs");
const { isPrivate } = require("sdk/private-browsing");
const { startHistoryScan } = require("./historyCheck.js");
const notifications = require("sdk/notifications");

const FXBleed = require("./FXBleed");

const icon = self.data.url("heartbleed-64.png");

let panel = require("sdk/panel").Panel({
  width:280,
  height:200,
  contentURL: self.data.url("panel.html"),
  contentScriptFile: self.data.url("panel.js"),
  onShow: handleOnShow
});

function handleOnShow() {
  // Communicate the status of the active tab to the content script
  let activeTabURL = URL(tabs.activeTab.url);
  let response = null;

  let response = undefined;
  if (activeTabURL.scheme === "https" && !isPrivate(tabs.activeTab)) {
    if (FXBleed.HOSTNAME_CACHE.hasOwnProperty(activeTabURL.host)) {
      response = FXBleed.HOSTNAME_CACHE[activeTabURL.host];
    }
  }

  panel.port.emit("siteStatus", {
    "host": activeTabURL.host,
    "response": response
  });
}

panel.port.on("changeSettings", function(setting) {
  storage.changeSettings(setting.name, setting.value);
});

panel.port.on("startHistoryScan", function() {
  startHistoryScan();
  // Hide the panel so people focus on the new page
  panel.hide();
});

var widget = require("sdk/widget").Widget({
  id: "FXBleed-toggle",
  label: "Widget to toggle FXBleed server checks",
  contentURL: self.data.url("heartbleed-16.png"),
  panel: panel,
});

function notify(host) {
    notifications.notify({
      title: "This site is vulnerable!",
      text: "The domain " + host + " is vulnerable to the Heartbleed SSL bug.",
      iconURL: icon,
    });
}

exports.notify = notify;
exports.panel = panel;
exports.updatePanel = handleOnShow;
