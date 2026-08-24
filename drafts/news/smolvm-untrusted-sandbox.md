---
itemId: nh7950k7cgyz7ywhfeammzy86n8d12sz
url: https://simonwillison.net/2026/Aug/19/smolmachines-untrusted-sandbox/
headline: smolmachines / smolvm as a sandbox for untrusted Python & JavaScript
topic: Security and privacy
---

Simon Willison tested `smolvm` 1.8.3 as a hardware-isolated sandbox for untrusted Python and JavaScript transformations. It targets applications that execute user-provided code while limiting network access, files, CPU, memory, runtime, and storage. Offline images, controlled mounts, quotas, timeouts, and `--unprivileged` worked in his tests. Cold starts took about 0.6 to 1.5 seconds, while warm executions took about 50 milliseconds.
