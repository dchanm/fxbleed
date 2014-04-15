"use strict";

let storage = require("sdk/simple-storage").storage;

exports.initStorage = function() {
  // Add-on persistent settings
  if (!storage.settings) {
    storage.settings = {
      autoClearCookies: false,
      addonEnabled: true
    };
  }

  // Cache vulnerable sites
  if (!storage.responses) {
    storage.responses = {};
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

exports.cacheResponse = function(domain, response) {
  storage.responses[domain] = {
    "response": response,
    "vulnerable": response.code == 0
  };
}

exports.getResponse = function(domain) {
  return storage.responses[domain];
}

exports.isVulnerable = function(domain) {
  if (! storage.responses.hasOwnProperty(domain)) {
    return undefined;
  }
  return storage.responses[domain].vulnerable;
}
