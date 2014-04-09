var Request = require("sdk/request").Request;
var URL = require("sdk/url").URL;
var Notifications = require("sdk/notifications");
var icon = require("sdk/self").data.url("heartbleed-64.png");

require("sdk/tabs").on("ready", checkBleed);

var server = "http://bleed-1161785939.us-east-1.elb.amazonaws.com/bleed/";
var vulnerable = {};

function notify(domain) {
    Notifications.notify({
      title: 'This site is vulnerable!',
      text: 'The domain ' + domain + ' is vulnerable to the Heartbleed SSL bug.',
      iconURL: icon,
    });
}

function checkBleed(tab) {
  try {
    // not using host since I'm unsure if the endpoint differentiates
    // based on port
    var domain = URL(tab.url).hostname;

    if (vulnerable[domain]) {
      notify(domain);
    }

    var xhr = Request({
      url: server + domain,
      overrideMimeType: "application/json",
      onComplete: function(response) {
       if (response.json.code === 0) {
         vulnerable[domain] = true; 
         notify(domain); 
       }
      }
    });

    xhr.get();
  } catch (e) {
    console.log(e);
  }
}
