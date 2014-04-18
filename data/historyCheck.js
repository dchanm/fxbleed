console.log("ran historyCheck.js");

self.port.on("checkResult", function(result) {
  console.log("got result for " + result.domain + ": " + result.code);
  var resultLi = document.createElement("li");

  // TODO: Do I need to sanitize this input (since I'm inserting it into the
  // document)? Potential attack: try to go to <script>doBadStuff()</script>,
  // then open the history scan.
  resultLi.innerHTML = '<a href="' + result.domain + '">' + result.domain + '</a>';
  switch(result.code) {
    case 0:
      resultLi.className = 'vulnerable';
      break;
    case 1:
      resultLi.className = 'notVulnerable';
      break;
    case 2:
      resultLi.className = 'error';
      break;
  }

  var resultsList = document.querySelector('ol#results');
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
