Based off Jamie Hoyle's ChromeBleed extension
https://chrome.google.com/webstore/detail/chromebleed/eeoekjnjgppnaegdjbcafdggilajhpic

The extension uses a Mozilla-operated instance of Filippo Valsora's endpoint
from http://filippo.io/Heartbleed/

## Try it out

1. Visit https://encrypted.google.com. It is not vulnerable to Heartbleed, so
   you will not see a notification. If you open the Heartbleed panel, you will
   see a green label that says it is not vulnerable.
2. Visit https://cloudflarechallenge.com. This site is (intentionally)
   vulnerable to Heartbleed. You will see a notification that the site you're
   on is vulnerable, and the panel will display a red warning label.

## FAQ

### How do I can I enable / disable the add-on?

The add-on is enabled by default. You can click the addon icon, a Heartbleed
logo, in the Toolbar or Add-on bar, and uncheck "Enable Heartbleed
Notifications" to disable scanning.

### How does the add-on work?

When you visit a HTTPS site, the add-on will send a request to the Mozilla-operated API endpoint. The hostname + port (if applicable) are sent. The result is then cached locally in a JS object. Future visits to the same hostname + port will result in the cached value being returned. This cache is persisted to disk. This design both improves performance and minimizes privacy leakage.

### What happens when I visit a vulnerable site?

A Firefox notification is generated and displayed on your desktop informing you of the vulnerable domain. You can also open the Heartbleed panel to view the status of the site you're currently on.

### What information does the add-on store?

The add-on stores a preferences and a cache of the status of visited sites.

### What happens if I'm using Private Browsing?

The addon ignores all requests made in Private Browsing windows. Note that as
a result, you will not receive notifications if you visit vulnerable sites in
a private browsing window.
