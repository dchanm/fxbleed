/*
document.querySelector('input#autoClearCookies').addEventListener('change', function() {
  self.port.emit("changeSettings", { name: "autoClearCookies", value: this.checked });
});
*/

document.querySelector('input#notificationsEnabled').addEventListener('change', function() {
  self.port.emit("changeSettings", { name: "notificationsEnabled", value: this.checked });
});

/*
document.querySelector('button#startHistoryScan').addEventListener('click', function() {
  self.port.emit("startHistoryScan", {});
});
*/

self.port.on("siteStatus", function(status) {
  // Header div is hidden to start, since there's nothing to show until the
  // user navigates to a page. Show it now.
  var headerDiv = document.querySelector('div#header');
  if (status.response === null) {
    // The active tab is not relevant to Heartbleed. Hide the status div.
    headerDiv.className = "hidden";
    return;
  } else {
    headerDiv.className = "";
  }

  // from FXBleed.js, bleh
  const SITE_SAFE = 1;
  const SITE_VULN = 2;
  const SITE_ERR  = 3;

  var statusP = document.querySelector('div#header p#status');
  if (status.response === undefined) {
    statusP.innerHTML = '<img src="progress.gif" />';
    headerDiv.className = "unknown";
  } else if (status.response === SITE_ERR) {
    statusP.innerHTML = '<p>An error occurred.</p><p class="small">This does not mean the site is vulnerable. For more information, <a target="_blank" href="https://filippo.io/Heartbleed/faq.html#wentwrong">click here</a></p>';
    headerDiv.className = 'error';
  } else {
    if (status.response === SITE_VULN) {
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
