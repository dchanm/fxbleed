self.port.on("checkResult", function(result) {
  console.log("got result for " + result.domain + ": " + result.code);
  var resultLi = document.createElement("li");

  // TODO: Do I need to sanitize this input (since I'm inserting it into the
  // document)? Potential attack: try to go to <script>doBadStuff()</script>,
  // then open the history scan.
  // TODO: basic templating, should build these from an object
  resultLi.innerHTML = '<a href="' + result.domain + '">' + result.domain + '</a>';
  switch(result.code) {
    case 0:
      resultLi.className = 'vulnerable';
      resultLi.innerHTML += '<span class="explanation">Vulnerable!</span>';
      break;
    case 1:
      if (result.wasVulnerable) {
        resultLi.className = 'notVulnerable wasVulnerable';
        resultLi.innerHTML += '<span class="explanation">This site was vulnerable, but is now fixed.<br>Consider changing your password!</span>';
      } else {
        resultLi.className = 'notVulnerable';
        resultLi.innerHTML += '<span class="explanation">Not vulnerable</span>';
      }
      break;
    case 2:
      resultLi.className = 'error';
      resultLi.innerHTML += '<span class="explanation">An error occurred checking this site (<a href="https://filippo.io/Heartbleed/faq.html#wentwrong">learn more</a>)</span>';
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
