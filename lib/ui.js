var self = require("sdk/self");
var prefs = require("sdk/simple-prefs").prefs;
var enabledIcon = self.data.url("heartbleed-16.png");
var disabledIcon = self.data.url("Red-dot-5px.png");

var widget = require("sdk/widget").Widget({
  id: "FXBleed-toggle",
  label: "Widget to toggle FXBleed server checks",
  contentURL: self.data.url("heartbleed-16.png"),
  onClick: function() {
    prefs.enabled = !prefs.enabled;
    updateIcon();
  }
});

updateIcon();

function updateIcon() {
  widget.contentURL = prefs.enabled ? enabledIcon : disabledIcon;
}
