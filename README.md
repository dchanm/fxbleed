Based off Jamie Hoyle's ChromeBleed extension
https://chrome.google.com/webstore/detail/chromebleed/eeoekjnjgppnaegdjbcafdggilajhpic

The extension uses a Mozilla-operated instance of Filippo Valsora's endpoint
from http://filippo.io/Heartbleed/

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
