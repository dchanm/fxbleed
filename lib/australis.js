// this hasn't been tested yet
var { ToggleButton } = require("sdk/ui/button/toggle");
var prefs = require("sdk/simple-prefs").prefs;

var button = ToggleButton({
    id: "FXBleed-toggle",
    label: "Widget to toggle FXBleed server checks",
    icon: {
      "16": self.data.url("heartbleed-16.png"),
      "32": self.data.url("heartbleed-32.png"),
      "64": self.data.url("heartbleed-64.png"),
    },
    checked: prefs.enabled,
    onClick: function() {
      prefs.enabled = !prefs.enabled;
    } 
  });
