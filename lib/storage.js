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
  // response = { code: Number, data: String, error: String }
  // response.code: 0 = vulnerable, 1 = not vulnerable, 2 = error
  storage.responses[domain] = {
    "vulnerable": response.code == 0,
    "error": response.code == 2,
    "errorMsg": response.error // useful for debugging
  };
}

exports.getResponse = function(domain) {
  if (! storage.responses.hasOwnProperty(domain)) {
    return undefined;
  }
  return storage.responses[domain];
}

// Think I can get rid of this
exports.isVulnerable = function(domain) {
  if (! storage.responses.hasOwnProperty(domain)) {
    return undefined;
  }
  return storage.responses[domain].vulnerable;
}
