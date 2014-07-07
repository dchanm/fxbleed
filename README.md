Based off Jamie Hoyle's ChromeBleed extension
https://chrome.google.com/webstore/detail/chromebleed/eeoekjnjgppnaegdjbcafdggilajhpic

<strike>The extension uses a Mozilla-operated instance of Filippo Valsora's endpoint
from http://filippo.io/Heartbleed/</strike>

Due to abuse reports from our endpoint hosting provider, which have switched to
the non-invasive "local probe" method. Our testing showed that this was
equivalent to the results from Valdora's endpoint. It also has the benefit of
being non-invasive, because it uses passive fingerprinting to target the fixed
versions of OpenSSL (instead of trying to perform the Heartbleed attack).

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

### What is "automatically clear cookies"?

A vulnerable site can leak the contents of memory to attackers, including
credentials (username, password) during login as well as the session cookies
of a logged-in user, which can be used to impersonate them. If you are
concerned about this information being leaked, checking this box will
automatically clear cookies on requests made to secure sites. Note that this
will automatically cause you to be "logged out" of such sites, and you will
need to login again. You should check the panel before doing so to make sure
that the site is not vulnerable to Heartbleed. This, by the way, is a great
opportunity to reset your password if you haven't already!

This feature is off by default because it interferes with normal browsing.
Rather than block all secure requests until we can determine their
vulnerability status, we clear cookies on all secure requests and let the user
choose what to do next based on the panel once it updates.

## When should you change your password?

1. A site was vulnerable to Heartbleed
2. It's been patched.

   If you reset your password before the site is patched, it
   can be compromised by active attackers using Heartbleed.

3. Their SSL keys have been rotated, and their certificates revoked.

   If their private keys were stolen using Heartbleed, then:

   1. Any communication to the site can be decrypted until the
      keys and certificates are rotated.
   2. The site can be impersonated by an attacker until the certificate is
      revoked, so you could be giving your new credentials to an impostor.

How do we make a decision for each of these cases?

1. Use the [masstest lists][].
2. Check if the site is currently vulnerable:
    a. Use an external [check server][].
    b. Use dchan's [non-intrusive fingerprint][].
3. Compare current fingerprint and issue date with data from SSL Observatory (?)
    a. problem: that's an enormous amount of data, and I'm not sure if it's
    recent enough (link of the site says it's from August 2010).

[masstest lists]: https://github.com/musalbas/heartbleed-masstest#630-of-the-top-10000-sites-appeared-vulnerable-on-april-8-1600-utc
[check server]: http://filippo.io/Heartbleed/
[non-intrusive fingerprint]: https://blog.mozilla.org/security/2014/04/12/testing-for-heartbleed-vulnerability-without-exploiting-the-server/
