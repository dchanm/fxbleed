console.log("ran history-check.js");

self.port.on("historyCheckSiteUpdate", function(update) {
  console.log("contents cript got historyCheckSiteUpdate, update=", update);
});
