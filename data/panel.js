document.querySelector('input#autoClearCookies').addEventListener('change', function() {
  self.port.emit("changeSettings", { name: "autoClearCookies", value: this.checked });
});

document.querySelector('input#addonEnabled').addEventListener('change', function() {
  self.port.emit("changeSettings", { name: "addonEnabled", value: this.checked });
});

self.port.on("siteStatus", function(status) {
  //var headerDiv = document.querySelector('div#header');
  var statusP = document.querySelector('div#header p#status');
  if (status.vulnerable === true) {
    statusP.textContent = "vulnerable";
    statusP.className = "vulnerable";
  } else if (status.vulnerable === false) {
    statusP.textContent = "not vulnerable";
    statusP.className = "notVulnerable";
  } else {
    statusP.innerHTML = '<img src="progress.gif" />';
    statusP.className = "unknown";
  }

  var hostP = document.querySelector('div#header p#host');
  hostP.textContent = status.host;
});
