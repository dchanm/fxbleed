"use strict";

let storage = require("sdk/simple-storage").storage;
const self = require("sdk/self");
const { setInterval } = require("sdk/timers");
const { checkDomain } = require("./check.js");

exports.initStorage = function() {
  if (storage.version &&
      Number(storage.version) < Number(self.version)) {
    // Dumb fix: to avoid conflicts due to changes in the persistent data
    // structures, clear the addon's storage when it is upgraded.
    // TODO: something better
    console.log("clearing storage due to upgrade");
    clearStorage();
  }

  console.log("initializing storage");

  if (!storage.version) {
    storage.version = self.version;
  }

  // Initialize persistent settings
  if (!storage.settings) {
    storage.settings = {
      autoClearCookies: false,
      notificationsEnabled: true
    };
  }

  // Initialize cache of check results
  if (!storage.responses) {
    storage.responses = {};
  }

  // Update cached responses on startup
  updateCachedResponses();
  // And every 30 minutes after that
  setInterval(updateCachedResponses, 30 * 60 * 1000);
}

function clearStorage() {
  delete storage.version;
  delete storage.settings;
  delete storage.responses;
}

function updateCachedResponse(index, domains) {
  if (index >= domains.length) {
    return;
  }
  let domain = domains[index];
  console.log("Updating cached response for", domain);
  checkDomain(domain, function callback(response) {
    cacheResponse(domain, response.json);
    updateCachedResponse(index+1, domains);
  });
}

function updateCachedResponses() {
  let domains = Object.keys(storage.responses);
  if (domains.length > 0) {
    console.log("Updating cached responses...");
    // start chained update (one at a time)
    updateCachedResponse(0, domains);
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

function cacheResponse(domain, response) {
  // response = { code: Number, data: String, error: String }
  // response.code: 0 = vulnerable, 1 = not vulnerable, 2 = error
  storage.responses[domain] = {
    "vulnerable": response.code == 0,
    "error": response.code == 2,
    "errorMsg": response.error // useful for debugging
  };
}
exports.cacheResponse = cacheResponse;

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
