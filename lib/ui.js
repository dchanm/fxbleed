"use strict";

var self = require("sdk/self");
var prefs = require("sdk/simple-prefs").prefs;
var enabledIcon = self.data.url("heartbleed-16.png");
var disabledIcon = self.data.url("Red-dot-5px.png");
const storage = require("./storage.js");

let panel = require("sdk/panel").Panel({
  width:320,
  height:200,
  contentURL: self.data.url("panel.html"),
  contentScriptFile: self.data.url("panel.js")
});

panel.port.on("changeSettings", function(setting) {
  storage.changeSettings(setting.name, setting.value);
});

var widget = require("sdk/widget").Widget({
  id: "FXBleed-toggle",
  label: "Widget to toggle FXBleed server checks",
  contentURL: self.data.url("heartbleed-16.png"),
  onClick: function() {
    prefs.enabled = !prefs.enabled;
    updateIcon();
  },
  panel: panel,
});

updateIcon();

function updateIcon() {
  widget.contentURL = prefs.enabled ? enabledIcon : disabledIcon;
}

exports.panel = panel;
