document.querySelector('input#autoClearCookies').addEventListener('change', function() {
  self.port.emit("changeSettings", { name: "autoClearCookies", value: this.checked });
});

document.querySelector('input#addonEnabled').addEventListener('change', function() {
  self.port.emit("changeSettings", { name: "addonEnabled", value: this.checked });
});

self.port.on("siteStatus", function(status) {
  var statusSpan = document.querySelector('div#header span#status');
  if (status.vulnerable === true) {
    statusSpan.textContent = "vulnerable";
  } else if (status.vulnerable === false) {
    statusSpan.textContent = "not vulnerable";
  } else {
    statusSpan.textContent = "unknown";
  }

  var hostSpan = document.querySelector('div#header span#host');
  hostSpan.textContent = status.host;
});
