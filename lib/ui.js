"use strict";

const { Cc, Ci, Cu } = require("chrome");
var URL = require("sdk/url").URL;
var self = require("sdk/self");
var enabledIcon = self.data.url("heartbleed-16.png");
var disabledIcon = self.data.url("Red-dot-5px.png");
const storage = require("./storage.js");
const tabs = require("sdk/tabs");
const { isPrivate } = require("sdk/private-browsing");

let panel = require("sdk/panel").Panel({
  width:260,
  height:180,
  contentURL: self.data.url("panel.html"),
  contentScriptFile: self.data.url("panel.js"),
  onShow: handleOnShow
});

function handleOnShow() {
  // Communicate the status of the active tab to the content script
  let activeTabURL = URL(tabs.activeTab.url);
  let response = null;

  if (activeTabURL.scheme === "https" && !isPrivate(tabs.activeTab)) {
    response = storage.getResponse(activeTabURL.host);
  }

  panel.port.emit("siteStatus", {
    "host": activeTabURL.host,
    "response": response
  });
}

panel.port.on("changeSettings", function(setting) {
  storage.changeSettings(setting.name, setting.value);
});

var widget = require("sdk/widget").Widget({
  id: "FXBleed-toggle",
  label: "Widget to toggle FXBleed server checks",
  contentURL: self.data.url("heartbleed-16.png"),
  panel: panel,
});

exports.panel = panel;
exports.updatePanel = handleOnShow;
