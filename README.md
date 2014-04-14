Based off Jamie Hoyle's ChromeBleed extension
https://chrome.google.com/webstore/detail/chromebleed/eeoekjnjgppnaegdjbcafdggilajhpic

The extension uses Filippo Valsorda's API endpoint from
http://filippo.io/Heartbleed/

## FAQ

### How do I can I enable / disable the add-on?

The add-on is disabled by default and can be toggled by clicking the icon in the add-on bar. A red-dot signifies that scanning is disabled. The HeartBleed icon signifies that scanning is enabled.

### How does the add-on work?

When you visit a HTTPS site, the add-on will send a request to Filippo Valsorda's API endpoint. The hostname + port (if applicable) are sent. The result is then cached in a JS object. Future visits to the same hostname + port will result in the cached value being returned. Exiting Firefox clears this cache 

### What happens when I visit a vulnerable site?

A Firefox notification is generated and displayed on your desktop informing you of the vulnerable domain.

### What information does the add-on store?

The add-on contains a preference to track its enabled/disabled state. Nothing else is persisted to disk

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
