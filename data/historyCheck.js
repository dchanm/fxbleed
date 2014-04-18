console.log("attached historyCheck.js");

self.port.on("checkResult", function(result) {
  console.log("got result for " + result.domain + ": " + result.code);
  var resultLi = document.createElement("li");

  // TODO: Do I need to sanitize this input (since I'm inserting it into the
  // document)? Potential attack: try to go to <script>doBadStuff()</script>,
  // then open the history scan.
  // TODO: basic templating, should build these from an object
  resultLi.innerHTML = '<a href="https://' + result.domain + '">' + result.domain + '</a>';

  let divId = null;
  switch(result.code) {
    case 0:
      divId = "vulnerable";
      break;
    case 1:
      if (result.wasVulnerable) {
        divId = "wasVulnerable";
      } else {
        divId = "notVulnerable";
      }
      break;
    case 2:
      divId = "error";
      break;
  }

  var resultsList = document.querySelector('div#' + divId + " ol");
  resultsList.appendChild(resultLi);
});

self.port.on("scanFinished", function () {
  var progressIndicator = document.querySelector("img#progress");
  progressIndicator.parentNode.removeChild(progressIndicator);

  var finishedP = document.createElement("p");
  finishedP.textContent = "Done!";
  finishedP.className = "center";
  var infoDiv = document.querySelector("div#info");
  infoDiv.appendChild(finishedP);
});
