const self = require("sdk/self");
const prefs = require("sdk/simple-prefs").prefs;
const enabledIcon = self.data.url("heartbleed-16.png");
const icon = self.data.url("heartbleed-64.png");
const disabledIcon = self.data.url("Red-dot-5px.png");
const notifications = require("sdk/notifications");

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

function notify(host) {
    notifications.notify({
      title: "This site is vulnerable!",
      text: "The domain " + host + " is vulnerable to the Heartbleed SSL bug.",
      iconURL: icon,
    });
}

exports.notify = notify;
