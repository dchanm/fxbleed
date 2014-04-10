  document.querySelector('input#autoClearCookies').addEventListener('change', function() {
    self.port.emit("changeSettings", { name: "autoClearCookies", value: this.checked });
  });
