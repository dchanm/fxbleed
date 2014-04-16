document.querySelector('input#autoClearCookies').addEventListener('change', function() {
  self.port.emit("changeSettings", { name: "autoClearCookies", value: this.checked });
});

document.querySelector('input#addonEnabled').addEventListener('change', function() {
  self.port.emit("changeSettings", { name: "addonEnabled", value: this.checked });
});

self.port.on("siteStatus", function(status) {
  // Header div is hidden to start, since there's nothing to show until the
  // user navigates to a page. Show it now.
  var headerDiv = document.querySelector('div#header');
  if (headerDiv.className === "hidden" ) {
    headerDiv.className = "";
  }

  var statusP = document.querySelector('div#header p#status');
  if (status.response === undefined) {
    statusP.innerHTML = '<img src="progress.gif" />';
    headerDiv.className = "unknown";
  } else if (status.response.error === true) {
    statusP.textContent = "An error occurred";
    headerDiv.className = 'error';
  } else {
    if (status.response.vulnerable === true) {
      statusP.textContent = "Vulnerable!";
      headerDiv.className = "vulnerable";
    } else {
      statusP.textContent = "Not vulnerable";
      headerDiv.className = "notVulnerable";
    }
  }

  var hostP = document.querySelector('div#header p#host');
  hostP.textContent = status.host;
});
