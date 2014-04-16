"use strict";

var Request = require("sdk/request").Request;
let storage = require("./storage.js");

// Mozilla-operated instance of Filippo Valsorda's heartbleed check service,
// with some improvements: https://github.com/jrconlin/Heartbleed
let server = "http://heartbleed.prod.mozaws.net/bleed/";

exports.checkDomain = function(domain, callback) {
  Request({
    url: server + domain,
    overrideMimeType: "application/json",
    onComplete: function(response) {
      if (response.json === null) {
        // This will happen if the request times out, or there is an error
        // on the server.
        //
        // Fakes an endpoint response object to communicate an error in
        // connecting to the server
        storage.cacheResponse(domain, {
          "code": 2,
          "error": "No response from check server"
        });
      } else {
        // 0 = vulnerable, 1 = not vulnerable, 2 = error
        console.log("response for " + domain + ": " + response.json.code);
        storage.cacheResponse(domain, response.json);
      }

      if (callback !== null) {
        callback(response);
      }
    }
  }).get();
}
