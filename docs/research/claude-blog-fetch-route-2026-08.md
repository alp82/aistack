# Reaching claude.com/blog from the Convex runtime

Date: 2026-08-24. Ticket: alp82/aistack#262. Map: alp82/aistack#198.

The `claude-blog` scraper in `convex/newsScrapers.ts` fetches
`https://claude.com/sitemap.xml`. Every poll since seeding returned `HTTP 502`.
The lane has never collected an item.

Earlier work established the shape of the fault. `curl` returns 200 from this
container, from the prod host, and from inside the `aistack-backend-1`
container. Header shape does not move it. `www.anthropic.com/sitemap.xml`
answers both `curl` and the Convex runtime, so this is not a blanket Cloudflare
block. The remaining difference is the client fingerprint the Convex runtime
presents.

This report answers five questions. Each claim is marked VERIFIED when a live
fetch or a fetched document proves it. Anything else is marked INFERENCE.

The research also turned up a likely root cause that changes the framing. The
502 is not a fingerprint block. Read "The 502 is real, and Convex may be the one
causing it" before costing any of the options.

## Verdict

**Run the five-minute check first, then ship the Node action.**

### The check, before any code

Read the build date of the running `convex-backend` image on the prod box:

```sh
docker inspect --format '{{.Created}}' ghcr.io/get-convex/convex-backend:latest
```

If that date is earlier than 2026-06-27, the running backend carries a known,
fixed Convex bug that produces exactly this failure. See the root-cause section.
`docker compose pull backend && docker compose up -d backend` may repair the
lane with no code change at all. The check costs one command, and it names which
fault you are fixing. Nobody in this session could read that date, because this
container has no `ssh` binary.

### The thing to ship

Move the `claude-blog` fetch into a `"use node"` Convex action, so it runs on
undici instead of the Convex V8 runtime. Ship this whichever way the check goes.
It is the one option that works under both explanations of the 502.

Three facts decide it.

1. The self-hosted image already runs Node actions. VERIFIED. The published
   `Dockerfile.backend` installs Node on purpose, and `local_backend` wires a
   `LocalNodeExecutor` that spawns `node` as a child process.
2. Node's undici `fetch` reaches `claude.com`. VERIFIED. From this container,
   Node 24.19.0 returned `HTTP 200` and 1,477,904 bytes, the same byte count
   `curl` returns.
3. The lane needs more than the sitemap. VERIFIED by reading
   `convex/newsScrapers.ts`. `runUrlSet` also calls `fetchText` on every
   `https://claude.com/blog/<slug>` article page, to read the real headline and
   publish date. Node's undici returned `HTTP 200` and a real `<title>` on three
   sampled article pages, using the scraper's own headers.

Point 3 is what separates the winner from the runner-up. A fixed proxy endpoint
carries the sitemap only. Article reads would keep failing. Every Claude item
would then land with a slug-derived headline and a sitemap update date, instead
of its real title and publish date. The Node action fixes the sitemap read and the article
reads in one change, because `fetchText` is the single choke point.

The change is small. Add one `"use node"` file exporting an internal action that
takes a URL and returns text. Give the registry entry a runtime flag. Route
`fetchText` through `ctx.runAction` for flagged sources. Nothing else moves.
`convex.json` already declares `"node": { "externalPackages": ["*"] }`, so the
project is configured for Node actions today.

**Runner-up: a fixed endpoint on the Nitro webapp.** A route on `aistack.to`
that fetches one hard-coded URL and returns the body. No URL parameter, so no
SSRF surface. Take this if the Node action fails its post-deploy probe. It costs
one route, and it needs a second route or a small allowlist to cover article
pages as well.

**What nobody in this session can prove.** Node 22 undici inside the prod
`convex-backend` container is not the same process as Node 24 undici in this
container. Both use undici over OpenSSL, so the TLS fingerprint should match.
That is INFERENCE.

The cheapest verification costs one deploy. Add the `"use node"` file, push to
`main`, wait for `.github/workflows/deploy-convex.yml`, then run the probe
action through `scripts/convex-prod.sh run`. A returned byte count settles it.
If Node actions themselves fail to start, the error names the Node version, and
that is a different failure from a 502.

## The 502 is real, and Convex may be the one causing it

This section corrects a premise. It is the most useful finding in the report.

### Convex never invents a 502

VERIFIED from source. A repo-wide search of `get-convex/convex-backend` for
`BAD_GATEWAY`, `Bad Gateway`, and `502` returns nothing outside a box-drawing
character in a CLI table. The `ErrorCode` to HTTP status map in
`crates/errors/src/lib.rs` covers 400, 401, 403, 404, 408, 409, 421, 425, 429,
500, and 503. It has no 502.

`ProxiedFetchClient::fetch` in `crates/common/src/http/fetch.rs` intercepts one
status only, 407, which is its own SSRF proxy refusing a private address. Every
other status is copied verbatim into the JS `Response`.

A transport failure surfaces differently. `crates/isolate/src/environment/action/fetch.rs`
turns it into a thrown error:

> `Err(e) => ErrorMetadata::bad_request("FetchFailed", format!("{e:#}")).into(),`

The scraper's `fetchText` throws `HTTP ${res.status}` when `res.ok` is false. So
`HTTP 502` in the source row means Cloudflare answered 502 and Convex relayed
it. Cloudflare answers 502 when it cannot get a valid response from the origin.
Its bot blocks answer 403 or 503.

### Convex shipped an HTTP/2 framing bug that strict origins reject

VERIFIED. Issue
[#497](https://github.com/get-convex/convex-backend/issues/497), "fetch()
incorrectly frames body-less HTTP/2, causing errors with strict servers", opened
2026-06-26 and closed the same day. The reporter's `nghttp2` dump shows Convex
sending a body-less GET as a HEADERS frame with `flags=0x04` (END_HEADERS only)
followed by a separate empty DATA frame.

The fix comment is in `crates/common/src/http/fetch.rs` today:

> `// by streaming_body) reports is_end_stream() == false, so hyper omits`
> `// END_STREAM from the HTTP/2 HEADERS frame and closes the stream with a`
> `// trailing empty DATA frame -- which strict servers reject`
> `// (https://github.com/get-convex/convex-backend/issues/497).`

Commit `5761ffeb4b02e04287c72196b100ee86265e091b`, "Fix HTTP/2 mis-framing of
body-less fetch requests", is dated 2026-06-26T23:51:02Z. VERIFIED from the
GitHub commits API. Every `convex-backend` release published from 2026-06-27
onward carries it.

### Why this fits the evidence better than a fingerprint block

INFERENCE, but every piece is verified.

- `curl` gets 200 because `curl` frames a body-less GET correctly.
- `claude.com/sitemap.xml` answers `cf-cache-status: DYNAMIC` with
  `cache-control: private, no-cache`, so Cloudflare reaches the Webflow origin
  on every request. A strict origin rejecting a malformed frame produces a 502
  at the edge.
- `www.anthropic.com/sitemap.xml` answers `x-nextjs-cache: HIT` and `via: 1.1
  google`. It is served from cache, so no strict origin is involved, and the
  same malformed request succeeds.
- Header shape does not move `claude.com`, which is what earlier work found. A
  framing fault is invisible to header changes.
- The status is 502, not 403 or 503. Cloudflare bot management does not answer
  502.

### What is still unknown

The build date of the running image. `docker-compose.yml` pins
`image: ghcr.io/get-convex/convex-backend:latest`, which is not a version.
`http://10.0.0.20:3210/version` is reachable from this container and returns the
literal string `unknown`, so the running backend reports no release version.
VERIFIED by fetching it. Only the operator can read the image date.

The `claude-blog` scraper landed on 2026-08-23 in commit `5d337c9`. So the lane
has failed for about a day, and no failure predates the upstream fix.

### No one else has reported this

VERIFIED by search, and worth stating plainly. There is no documented report of
Cloudflare or a similar bot filter blocking the Convex runtime's `fetch` while
`curl` from the same machine succeeds. Searches covered `get-convex/convex-backend`
issues in all states for `cloudflare`, `403`, `blocked`, `bot`, `user-agent`,
`TLS fingerprint`, `fetch fails`, and `502`, plus `get-convex/convex-js`,
`stack.convex.dev`, and `docs.convex.dev`. The repo has zero discussions. Issue
#497 is the closest documented case, and it is a framing fault, not a
fingerprint fault.

## 1. Alternative source, official

**There is no Anthropic-published, machine-readable index of `claude.com/blog`
served from a host other than `claude.com`.** VERIFIED by probing every
candidate listed here.

### robots.txt declares two sitemaps, both on claude.com

`https://claude.com/robots.txt` returned `HTTP 200`, 107 bytes, `text/plain`.
The whole file:

```
User-Agent: *
Sitemap: https://claude.com/sitemap.xml
Sitemap: https://claude.com/docs/sitemap.xml
Allow: /
```

Two things follow. `claude.com` allows every crawler on every path, so reading
the blog is within its stated policy. And the only declared sitemaps both sit on
`claude.com`.

`https://claude.com/docs/sitemap.xml` returned `HTTP 200`, 30,209 bytes,
`text/xml`. It lists 216 URLs. Zero of them contain `/blog/`. VERIFIED by
counting. It covers `claude.com/docs/...` only.

### The blog page declares no feed

`https://claude.com/blog` returned `HTTP 200`, 813,616 bytes. Its `<head>`
carries seven `<link rel="alternate">` tags. All seven are `hreflang` locale
alternates:

```html
<link rel="alternate" hrefLang="x-default" href="https://claude.com/blog"/>
<link rel="alternate" hrefLang="ja-JP" href="https://claude.com/ja/blog"/>
```

A case-insensitive search of the full page for `rss`, `atom`, or `feed` returned
nothing. VERIFIED.

### Neighbouring sitemap paths all 404

`sitemap_index.xml`, `sitemap-index.xml`, and `blog/sitemap.xml` each returned
`HTTP 404` with the site's HTML error page. VERIFIED.

### /rss and /feed redirect to a challenge page

`https://claude.com/rss` returned `HTTP 302` to `https://claude.ai/rss`.
`https://claude.com/feed` returned `HTTP 302` to `https://claude.ai/feed`.

Both targets returned `HTTP 403` with a Cloudflare interstitial. The body opens
`<title>Just a moment...</title>` and loads `challenges.cloudflare.com`. This is
a managed challenge, not a feed. `claude.ai/rss.xml` behaves the same way.
VERIFIED.

### The docs hosts do not cover the blog

`docs.claude.com/robots.txt` returned `HTTP 301` to
`https://platform.claude.com/robots.txt`. `docs.anthropic.com/robots.txt`
returned `HTTP 301` to `https://platform.claude.com/docs/robots.txt`. Both docs
hostnames now land on `platform.claude.com`.

`https://platform.claude.com/sitemap.xml` returned `HTTP 200`, 350,374 bytes,
`application/xml`. It lists 2,913 URLs. Zero contain `claude.com/blog/`.
VERIFIED by counting. The API release notes at
`https://platform.claude.com/docs/en/release-notes/overview` returned `HTTP 200`,
but they are API changelog entries, not blog posts.

### anthropic.com has no /blog path

`https://anthropic.com/blog` returned `HTTP 301` to
`https://www.anthropic.com/blog`, which returned `HTTP 307` to
`https://www.anthropic.com/news`. That news index is what the existing
`anthropic-news` scraper already reads. Earlier work established that
`www.anthropic.com/sitemap.xml` contains zero `claude.com` URLs.

### The one real find: the Webflow origin hostname

`claude.com/blog` is a Webflow site. The `Set-Cookie` header on
`https://claude.com/sitemap.xml` scopes a cookie to
`Domain=websitemain.claude.com`. That hostname answers.

`https://websitemain.claude.com/sitemap.xml` returned `HTTP 200`, 1,734,439
bytes, `application/rss+xml`. It resolves to `cdn.webflow.com`
(`2620:cb:2000::1`) and carries `x-wf-region: us-east-1` and
`cf-cache-status: HIT`. The canonical host answers `cf-cache-status: DYNAMIC`
with `cache-control: private, no-cache`, so it hits an origin on every request
while the Webflow hostname serves from cache. VERIFIED.

The blog slug sets are identical. Both hosts list 221 distinct blog slugs, and a
`diff` of the two sorted slug lists is empty. VERIFIED.

**Do not use it.** `https://websitemain.claude.com/robots.txt` returned
`HTTP 200`, and it reads:

```
User-Agent: *
Disallow: /
Sitemap: https://claude.com/sitemap.xml
Sitemap: https://claude.com/docs/sitemap.xml
```

The hostname forbids crawling and points every crawler at the canonical host.
Reading it on a cron would break a stated policy, and it would do so to obtain
content the canonical host explicitly allows. The hostname is also a Webflow
naming artifact with no published contract. Anthropic can rename the Webflow
site at any time.

Record it as evidence, not as a source. It shows the 502 is bound to the
`claude.com` hostname and its Cloudflare configuration, not to the content or to
Webflow.

## 2. Alternative source, third party

Four mirrors answer today without a signup. None of them is a sound production
dependency.

### r.jina.ai

`https://r.jina.ai/https://claude.com/sitemap.xml` returned `HTTP 200`,
359,194 bytes, `text/plain`. VERIFIED. The payload contains 221 distinct
`https://claude.com/blog/<slug>` URLs, which matches the canonical sitemap
exactly.

It does not return XML. The default output is Markdown, and it rewrites the
document:

```
Title: Sitemap

URL Source: https://claude.com/sitemap.xml

Markdown Content:
[https://claude.com/ja](https://claude.com/ja)

2026-08-20T17:15:39.229Z
```

`x-respond-with: html` returned `HTTP 200` and 465,160 bytes of reconstructed
HTML anchors. Neither form is the sitemap XML that `parseSitemap` reads, so the
lane would need a second parser.

The unauthenticated response carries `x-ratelimit-limit: 20, 20;w=60`. Twenty
requests a minute covers a cron easily. Jina AI runs the service, it is free
today, and it has no published service agreement for the anonymous tier.

### api.allorigins.win

`https://api.allorigins.win/raw?url=https%3A%2F%2Fclaude.com%2Fsitemap.xml`
returned `HTTP 200`, 238,112 bytes, `application/rss+xml`. VERIFIED. The body
opens with `<?xml version="1.0" encoding="UTF-8"?><urlset ...`, so it is the real
sitemap XML and `parseSitemap` would read it unchanged.

This is the best-formed third-party result. It is still a free, anonymous,
single-maintainer CORS proxy with no service agreement, no documented rate
limit, and no authentication. A lane built on it can lose its source without
notice, and nothing about the response would warn you first.

Note the size gap. The proxy returned 238,112 bytes where the origin returns
1,477,904. That is a compression artifact reported by `curl` rather than
truncation, but it was not verified byte for byte against the origin.

### Google News RSS

`https://news.google.com/rss/search?q=site:claude.com/blog&hl=en-US&gl=US&ceid=US:en`
returned `HTTP 200`, 101,341 bytes, `application/xml`, with 100 `<item>`
elements. VERIFIED. Items are current. The newest `pubDate` is
`Mon, 24 Aug 2026 15:00:11 GMT`, and every `<source url>` is
`https://claude.com`.

Titles match real posts, for example "The AI-Native SDLC playbook" and
"Anthropic's approach to teaching and learning AI". The problem is the links.
Every `<link>` is an opaque `https://news.google.com/rss/articles/CBMi...`
redirect. Zero `claude.com/blog/` URLs appear anywhere in the payload. The
scraper keys items by canonical URL, so the lane would need a redirect
resolution step for every item. Google publishes no contract for this endpoint.

### openrss.org

`https://openrss.org/claude.com/blog` returned `HTTP 200` and 203,823 bytes of
`text/html`, both with a normal user agent and with a feed-reader user agent.
VERIFIED. The HTML does contain 15 current `claude.com/blog` slugs, including
`agent-identity-access-model` and `computer-use-skills-api-files-api`. It never
served a feed content type on this path, so a lane would be scraping their HTML
page rather than consuming a feed.

### Probed and rejected

`corsproxy.io` returned `HTTP 403` with
`{"error":"Server-side requests are not allowed on your plan..."}`.
`api.codetabs.com` returned `HTTP 522`. `rsshub.app/anthropic/news` returned
`HTTP 403` with this text, which disqualifies the public instance by its own
statement:

> Due to cost considerations, we will gradually restrict access to rsshub.app
> for some feed readers. Please note that rsshub.app is intended for testing
> purposes only and should not be used as a production RSS source.

`rss.app` and `politepol.com` both require an account to generate a feed. Not
probed for output, because the signup gate already rules them out under the
stated constraint.

### Judgment

None of these belongs in a production lane. Every one is a free anonymous
service run by someone else, reading a source we are allowed to read ourselves.
Each adds a second party that can disappear, start charging, or begin returning
stale data without an error. `allorigins` is the only one whose output the
existing parser accepts unchanged, and that makes it the emergency fallback, not
the plan.

## 3. Node actions on self-hosted Convex

**Yes. The `ghcr.io/get-convex/convex-backend:latest` image runs `"use node"`
actions.** It does not use AWS Lambda. It spawns a Node child process inside the
same container. VERIFIED from the published source.

### The image installs Node deliberately

`https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker-build/Dockerfile.backend`:

> `# Install Node.js and npm, required for running Node.js actions in the backend`
>
> `COPY --from=build /usr/bin/node /usr/bin/node`
>
> `COPY --from=build /usr/bin/npm /usr/bin/npm`

### The backend wires a local executor, not Lambda

`https://raw.githubusercontent.com/get-convex/convex-backend/main/crates/local_backend/src/lib.rs`:

> `let node_executor = Arc::new(LocalNodeExecutor::new(node_process_timeout).await?);`

`local_backend` is the crate the Docker image builds. The executor writes a
bundled `local.cjs` to a temp directory, spawns `node local.cjs`, and talks HTTP
over a Unix domain socket, per
`https://raw.githubusercontent.com/get-convex/convex-backend/main/crates/node_executor/src/local.rs`:

> `let (source, source_map) = node_executor_file("local.cjs").expect("local.cjs not generated!");`

The repo carries both implementations. `npm-packages/node-executor/src/` holds
`aws_lambda.ts` and `local.ts`. A comment in `build_deps.ts` names the split:

> `// file: is used for local backends that are using local node rather than lambda to execute.`

### The compose file exposes Node-action knobs

`https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml`:

> `- NODE_ACTION_USER_TIMEOUT_SECS`
>
> `- APPLICATION_MAX_CONCURRENT_NODE_ACTIONS=${APPLICATION_MAX_CONCURRENT_NODE_ACTIONS:-16}`

It defines two services, `backend` and `dashboard`. There is no node-executor
service, which matches the child-process design.

### The changelog treats it as shipped

`https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/CHANGELOG.md`:

> `- Speed up Node actions by 50x. No more cold starts on every request.`
>
> `- Fix node actions bug affecting multiple concurrent requests with local node executor`

### The docs confirm it, with one restriction

`https://docs.convex.dev/functions/runtimes`:

> "Note: This configuration is not supported when running the self-hosted Convex
> backend. The node version that is specified in the .nvmrc will be used
> instead."

The restriction is version choice only. It confirms that Node actions run.

### Users run them on this exact image

`https://github.com/get-convex/convex-backend/issues/427` reports a Node action
fault on `ghcr.io/get-convex/convex-backend:latest`, with `Node inside the
backend container: v20.19.5`. Issues 492 and 519 are two more self-hosted Node
action reports. Issue 519 runs `node.externalPackages` with `sharp` and three
other native packages.

### What the operator needs

Nothing mandatory. VERIFIED from the compose file and `run_backend.sh`. No
second container, no executor URL, no AWS credentials.

Three practical notes.

- `run_backend.sh` sets `TMPDIR=${TMPDIR:-"$DATA_DIR/tmp"}`, so source packages
  land on the `data` volume. Issue 519 reports 74 MB of `external_deps/` for
  four packages. A `"use node"` file with no imports installs nothing.
- `convex.json` in this repo already sets
  `"node": { "externalPackages": ["*"] }`. VERIFIED by reading the file.
- The one deploy-time refusal in `local.rs` names a missing Node version:

  > `"Deployment is not configured to deploy \"use node\" actions. Node.js v20, 22, or 24 is not installed."`

  The official image installs Node from the convex-backend repo's own `.nvmrc`,
  so it satisfies that check.

The `self-hosted/README.md` never mentions Node actions. Its Limitations section
says only that "Self-hosted Convex supports all the free-tier features of the
cloud-hosted product." That silence is why the question arises. The Dockerfile,
the Rust wiring, and three self-hosted bug reports settle it.

## 4. The Convex runtime's fetch

### What it runs on

**The Rust `reqwest` crate 0.12, over `hyper` and `h2`, with `native-tls` bound
to a statically linked OpenSSL 3.2.1.** Not rustls. VERIFIED from source at
commit `bc3349b6cc67bc228830213c7e8460e905373f85`.

The isolate hands every fetch to a `FetchClient`
(`crates/isolate/src/environment/action/fetch.rs`). `local_backend`, the crate
the Docker image builds, constructs a `ProxiedFetchClient`
(`crates/local_backend/src/lib.rs`):

> `let fetch_client = Arc::new(ProxiedFetchClient::new(`
> `    config.convex_http_proxy.clone(),`
> `    config.name(),`
> `    reqwest::redirect::Policy::none(),`
> `));`

reqwest does not follow redirects. The redirect loop lives in JS, in
`npm-packages/udf-runtime/src/26_fetch.ts`.

The TLS connector in `crates/common/src/http/fetch.rs` is four lines, and it
sets nothing but ALPN:

> `static TLS_CONNECTOR: LazyLock<native_tls::TlsConnector> = LazyLock::new(|| {`
> `    let mut tls = native_tls::TlsConnector::builder();`
> `    tls.request_alpns(&["h2", "http/1.1"]);`
> `    tls.build().expect("failed to build TLS connector")`
> `});`

The client builder sets the default user agent and pins that connector:

> `.user_agent("Convex/1.0")`
> `.use_preconfigured_tls(TLS_CONNECTOR.clone());`

The workspace `Cargo.toml` requests `native-tls-alpn` and `native-tls-vendored`
on reqwest. `Cargo.lock` resolves that onto `openssl-src 300.2.3+3.2.1`. So the
handshake is stock OpenSSL 3.2.1 defaults plus one ALPN extension, and it does
not depend on the host distro. The exact JA3 or JA4 string was not computed, so
treat any specific fingerprint claim as INFERENCE.

HTTP/2 is negotiated in practice. The `nghttp2` dump in issue #497 reads
`The negotiated protocol: h2`, and it shows the whole request the server sees:

> `recv (stream_id=1) accept: application/json`
> `recv (stream_id=1) user-agent: Convex/1.0`
> `recv (stream_id=1) accept-encoding: gzip`

Three headers, one of them developer-set. No `accept-language`, no `sec-fetch-*`,
`accept-encoding: gzip` only. Developer headers are applied after the builder
default, so setting `user-agent` in the action does replace `Convex/1.0`. The
TLS connector is not reachable from JS, as issue
[#331](https://github.com/get-convex/convex-backend/issues/331) records.

One more shared-infrastructure note. `https://docs.convex.dev/production/networking`
says of Convex Cloud egress addresses:

> "These IP addresses are shared across all Convex deployments in a region, not
> just yours."

That does not apply here. This deployment is self-hosted, so it egresses from
the owner's own Hetzner address.

### Documented Cloudflare blocks

None. See "No one else has reported this" for the searches run.

### Why undici is the answer either way

Node's undici `fetch` reaches `claude.com` where the Convex runtime does not.
From this container, Node 24.19.0 returned:

```
undici fetch status: 200 bytes: 1477904 ct: application/rss+xml
distinct blog slugs: 221
```

That byte count matches what `curl` returns. So undici is a client `claude.com`
accepts.

Article pages answer undici too. Three sampled posts returned `HTTP 200` with
real titles, using the scraper's exact headers:

| URL | Status | Bytes | `<title>` |
| --- | --- | --- | --- |
| `https://claude.com/blog/1m-context-ga` | 200 | 567,713 | "1M context is now generally available for Opus 4.6 and Sonne..." |
| `https://claude.com/blog/agent-identity-access-model` | 200 | 545,422 | "Agent identity: a new access model for autonomous, team-wide..." |
| `https://claude.com/blog/computer-use-skills-api-files-api` | 200 | 547,455 | "Build production agents with computer use, the Skills API, a..." |

This is the fact the verdict rests on. It is VERIFIED from this container and
INFERENCE for the prod container, because the Node versions differ.

## 5. Routed fetch, the shapes worth costing

### (a) A fixed endpoint on the Nitro webapp

**Build.** One route file under `src/routes/`, next to
`api.icons.from-url.tsx`. It takes no URL parameter. It fetches one hard-coded
`https://claude.com/sitemap.xml`, and it returns the body with the upstream
content type. No SSRF surface, because there is no attacker-controlled URL.
Add a timeout and a small response cap. The registry entry for `claude-blog`
points at the new route instead of `claude.com`.

**Cost beyond the route.** The sitemap is not the whole lane. `runUrlSet` calls
`fetchText` on every `https://claude.com/blog/<slug>` article page. A fixed
endpoint covers one URL, so article reads keep failing. The scraper survives
that, because it catches the article error and falls back to a slug-derived
headline and the sitemap `lastmod`. The item quality drops. To recover it, add a
second route with a `claude.com/blog/` prefix allowlist, which reintroduces a
URL parameter and a guard to review.

**Failure mode.** The webapp becomes a dependency of the collector. If the Nitro
process is down or mid-deploy, the lane records an error and retries on the next
cron. That is tolerable, because the collector already tolerates a missed run.
The subtler failure is a silent one. A route that returns an HTML error page
with `HTTP 200` would make `parseSitemap` see zero URLs, and `runUrlSet` throws
`the page listed no articles` on an empty list. So this failure surfaces as an
error, not as silence.

**Verification.** Nobody in this session can prove the Convex runtime reaches
`aistack.to`. The cheapest check after deploy is to run the scraper once through
`scripts/convex-prod.sh run` and read `lastError` on the `claude-blog`
`newsSources` row.

### (b) A Cloudflare Worker

**Build.** A single `fetch` handler, roughly twenty lines, deployed with
`wrangler` to a `workers.dev` subdomain. Free tier covers a cron easily.

**Cost.** It creates a second deploy surface outside this repo and outside
`.github/workflows/deploy-convex.yml`. Nothing in the repo would break if the
Worker were deleted, and nothing in the repo would tell you it had been. The
project has one deploy path today. Adding a second one for a single HTTP GET is
out of proportion.

**Failure mode.** A Cloudflare account change, an expired token, or a forgotten
Worker takes the lane down with no signal in this repo.

**Verification.** Same limit as (a). Nobody here can prove the Convex runtime
reaches `workers.dev`. Run the scraper once after deploy and read `lastError`.

**One unknown worth naming.** A Worker fetching `claude.com` is Cloudflare
fetching Cloudflare. Those subrequests can take an internal path, which may
behave differently from a public request. Not verified.

### (c) r.jina.ai as a read-through proxy

**Probed live.** `https://r.jina.ai/https://claude.com/sitemap.xml` returned
`HTTP 200`, 359,194 bytes, `text/plain; charset=utf-8`, in 1.9 seconds. The
payload holds all 221 blog slugs. Rate limit headers read
`x-ratelimit-limit: 20, 20;w=60` and `x-ratelimit-remaining: 18`.

**Build.** Change one URL in the registry, then write a new parser. The output
is Markdown, not sitemap XML, so `parseSitemap` cannot read it. The
`x-respond-with: html` variant returns reconstructed anchors, which is a
different parse again, not the original document.

**Failure mode.** A third party rewrites the document between the source and the
lane. A rendering change on their side silently changes the parse. The anonymous
tier can start requiring a key at any time. Rate limiting returns an error the
lane can see, which is the one honest failure in the list.

**Judgment.** Reject. It adds a parser, a second party, and a reformatting step,
to read a document `claude.com` already serves us on request.

## Everything probed

| URL | Status | Content type | Bytes / note |
| --- | --- | --- | --- |
| `https://claude.com/sitemap.xml` (curl) | 200 | `application/rss+xml` | 1,477,904 |
| `https://claude.com/sitemap.xml` (Node undici) | 200 | `application/rss+xml` | 1,477,904, 221 blog slugs |
| `https://claude.com/robots.txt` | 200 | `text/plain` | 107, `Allow: /` |
| `https://claude.com/docs/sitemap.xml` | 200 | `text/xml` | 30,209, 216 locs, 0 blog |
| `https://claude.com/sitemap_index.xml` | 404 | `text/html` | error page |
| `https://claude.com/sitemap-index.xml` | 404 | `text/html` | error page |
| `https://claude.com/blog/sitemap.xml` | 404 | `text/html` | error page |
| `https://claude.com/blog` | 200 | `text/html` | 813,616, no feed link |
| `https://claude.com/blog/rss` | 404 | `text/html` | error page |
| `https://claude.com/blog/feed` | 404 | `text/html` | error page |
| `https://claude.com/rss` | 302 | | to `https://claude.ai/rss` |
| `https://claude.com/feed` | 302 | | to `https://claude.ai/feed` |
| `https://claude.ai/rss` | 403 | `text/html` | Cloudflare challenge |
| `https://claude.ai/rss.xml` | 403 | `text/html` | Cloudflare challenge |
| `https://claude.ai/feed` | 403 | `text/html` | Cloudflare challenge |
| `https://claude.com/blog/1m-context-ga` (Node undici) | 200 | `text/html` | 567,713, real title |
| `https://claude.com/blog/agent-identity-access-model` (Node undici) | 200 | `text/html` | 545,422, real title |
| `https://claude.com/blog/computer-use-skills-api-files-api` (Node undici) | 200 | `text/html` | 547,455, real title |
| `https://websitemain.claude.com/sitemap.xml` | 200 | `application/rss+xml` | 1,734,439, 221 blog slugs |
| `https://websitemain.claude.com/robots.txt` | 200 | `text/plain` | 110, `Disallow: /` |
| `https://www.anthropic.com/robots.txt` | 200 | `text/plain` | 71 |
| `https://www.anthropic.com/blog` | 307 | `text/html` | to `/news` |
| `https://anthropic.com/blog` | 301 | `text/html` | to `www.anthropic.com/blog` |
| `https://docs.claude.com/robots.txt` | 301 | `text/html` | to `platform.claude.com` |
| `https://docs.anthropic.com/robots.txt` | 301 | `text/html` | to `platform.claude.com/docs` |
| `https://platform.claude.com/robots.txt` | 200 | `text/plain` | 138 |
| `https://platform.claude.com/sitemap.xml` | 200 | `application/xml` | 350,374, 2,913 locs, 0 blog |
| `https://platform.claude.com/docs/en/release-notes/overview` | 200 | `text/html` | 1,701,603, API notes only |
| `https://r.jina.ai/https://claude.com/sitemap.xml` | 200 | `text/plain` | 359,194, Markdown, 221 slugs |
| `https://r.jina.ai/...` with `x-respond-with: html` | 200 | `text/plain` | 465,160, anchors |
| `https://api.allorigins.win/raw?url=...sitemap.xml` | 200 | `application/rss+xml` | 238,112, real XML |
| `https://corsproxy.io/?url=...sitemap.xml` | 403 | `application/json` | plan required |
| `https://api.codetabs.com/v1/proxy?quest=...` | 522 | `text/plain` | origin timeout |
| `https://rsshub.app/anthropic/news` | 403 | `text/plain` | testing only, self-host advised |
| `https://openrss.org/claude.com/blog` | 200 | `text/html` | 203,823, 15 blog slugs, no feed type |
| `https://news.google.com/rss/search?q=site:claude.com/blog` | 200 | `application/xml` | 101,341, 100 items, opaque links |
| `https://rss.app/rss-feed?url=...` | 200 | `text/html` | signup page |
| `https://politepol.com/en/` | 301 | `text/html` | signup service |
| `http://10.0.0.20:3210/version` | 200 | `text/plain` | 7 bytes, `unknown` |
| `http://10.0.0.20:3210/instance_name` | 200 | | prod backend reachable |
| `https://aistack.to/` | 200 | | webapp reachable |

All probes ran from this container on 2026-08-24. `curl` unless the row says
Node undici. Node undici probes ran on Node 24.19.0.

## Primary sources

- [Convex runtimes documentation](https://docs.convex.dev/functions/runtimes)
- [Convex networking documentation](https://docs.convex.dev/production/networking)
- [Issue 497, body-less HTTP/2 mis-framing](https://github.com/get-convex/convex-backend/issues/497)
- [The commit that fixed issue 497](https://github.com/get-convex/convex-backend/commit/5761ffeb4b02e04287c72196b100ee86265e091b)
- [Issue 331, no TLS hook in fetch](https://github.com/get-convex/convex-backend/issues/331)
- [convex-backend proxied fetch client](https://raw.githubusercontent.com/get-convex/convex-backend/main/crates/common/src/http/fetch.rs)
- [convex-backend self-hosted Dockerfile](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker-build/Dockerfile.backend)
- [convex-backend local node executor](https://raw.githubusercontent.com/get-convex/convex-backend/main/crates/node_executor/src/local.rs)
- [convex-backend local_backend wiring](https://raw.githubusercontent.com/get-convex/convex-backend/main/crates/local_backend/src/lib.rs)
- [convex-backend self-hosted compose file](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml)
- [convex-backend self-hosted changelog](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/CHANGELOG.md)
- [Self-hosted node action fault report 427](https://github.com/get-convex/convex-backend/issues/427)
- [Self-hosted node action fault report 519](https://github.com/get-convex/convex-backend/issues/519)
- [claude.com robots.txt](https://claude.com/robots.txt)
- [websitemain.claude.com robots.txt](https://websitemain.claude.com/robots.txt)
- [platform.claude.com sitemap](https://platform.claude.com/sitemap.xml)
- [FxTwitter collector report](fxtwitter-production-collector-2026-08.md), the
  same method applied to the X lane
