# The Claude blog lane reads on the Node runtime

A scraper registry entry may carry `runtime: 'node'`. That source reads through
`internal.newsFetch.fetchText`, a `"use node"` action, instead of fetching on the default
Convex runtime. Every other source reads in place.

`claude-blog` is the only entry that carries it, and a test pins that count. A source
earns the flag by failing without it, because the hop costs a Node process per read.

Why: the default runtime got `HTTP 502` from `claude.com` on every poll since the lane was
seeded, while `curl` got 200 from this machine, from the prod host, and from inside the
backend container. Header shape moved nothing, and `www.anthropic.com/sitemap.xml`
answered both clients, so it was never a blanket block.

Two readings fit the evidence, and neither is proved. The first is framing:
[convex-backend issue 497](https://github.com/get-convex/convex-backend/issues/497) shipped
a body-less HTTP/2 mis-framing that strict origins reject, fixed on 2026-06-26.
`claude.com/sitemap.xml` answers `cf-cache-status: DYNAMIC` with `cache-control: private,
no-cache`, so Cloudflare reaches the Webflow origin on every read, while
`www.anthropic.com/sitemap.xml` answers `x-nextjs-cache: HIT` and never involves a strict
origin. The status is 502, and Cloudflare bot blocks answer 403 or 503. The second reading
is the client fingerprint: the runtime hands every fetch to Rust `reqwest` with stock
OpenSSL, and JS cannot reach that TLS connector
([issue 331](https://github.com/get-convex/convex-backend/issues/331)).

Node's undici shares neither fault. It returned 200 and 1,477,904 bytes for the sitemap,
matching `curl` byte for byte, and 200 with real titles on the article pages. So this is
the one fix that holds under both readings.

The self-hosted image runs it. `Dockerfile.backend` copies Node in with the comment
"required for running Node.js actions in the backend", and `local_backend` spawns a
`LocalNodeExecutor` child process rather than calling AWS Lambda. No second container and
no extra configuration.

Two alternatives were rejected. A fixed proxy endpoint on the webapp carries the sitemap
only, and `runUrlSet` also reads every article page for its real headline and publish date,
so items would land with slug-derived headlines. Third-party mirrors all answer today, and
every one is a free anonymous service reading a document `claude.com/robots.txt` already
lets us read ourselves.

`websitemain.claude.com` serves the identical sitemap from the Webflow origin and is NOT
used. Its `robots.txt` is `Disallow: /`, and it points every crawler back at the canonical
host.

Decided in [alp82/aistack#262](https://github.com/alp82/aistack/issues/262), researched in
[`docs/research/claude-blog-fetch-route-2026-08.md`](../research/claude-blog-fetch-route-2026-08.md).
