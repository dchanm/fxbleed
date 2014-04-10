"use strict";

var { ToggleButton } = require("sdk/ui/button/toggle");
let { panel } = require("./ui.js");

var button = ToggleButton({
  id: "FXBleed-toggle",
  label: "Widget to toggle FXBleed server checks",
  icon: {
    "16": self.data.url("heartbleed-16.png"),
    "32": self.data.url("heartbleed-32.png"),
    "64": self.data.url("heartbleed-64.png"),
  },
  onChange: handleOnChange,
});

function handleOnChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
  }
};
