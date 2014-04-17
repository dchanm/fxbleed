console.log("ran historyCheck.js");

self.port.on("historyCheckSiteUpdate", function(update) {
  console.log("contents cript got historyCheckSiteUpdate, update=", update);
});
