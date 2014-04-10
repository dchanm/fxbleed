  document.querySelector('input#autoClearCookies').addEventListener('change', function() {
    self.port.emit("changeSettings", { name: "autoClearCookies", value: this.checked });
  });

  document.querySelector('input#addonEnabled').addEventListener('change', function() {
    self.port.emit("changeSettings", { name: "addonEnabled", value: this.checked });
  });
