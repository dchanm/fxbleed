"use strict";

let storage = require("sdk/simple-storage").storage;

exports.initStorage = function() {
  // Add-on persistent settings
  if (!storage.settings) {
    storage.settings = {
      autoClearCookies: true
    };
  }
}

exports.changeSettings = function(name, value) {
  console.log("in changeSettings, name=" + name + ", value=" + value);
  storage.settings[name] = value;
}

exports.getSettings = function(name) {
  console.log(" in getSettings, name=" + name);
  return storage.settings[name];
}
