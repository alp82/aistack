'use node'

/**
 * The Node-runtime read of the scraper lane (#262, map #198).
 *
 * WHY A SECOND RUNTIME EXISTS FOR ONE HTTP GET
 *
 * `claude.com/sitemap.xml` answered `HTTP 502` on every poll of the
 * `claude-blog` scraper, while `curl` answered 200 from this machine, from the
 * prod host, and from inside the backend container itself. Header shape moved
 * nothing. `www.anthropic.com/sitemap.xml` answered both clients, so it was
 * never a blanket block.
 *
 * The difference is the client, not the request. Two readings fit:
 *
 *   1. FRAMING. convex-backend issue #497, "fetch() incorrectly frames
 *      body-less HTTP/2, causing errors with strict servers", was fixed on
 *      2026-06-26. `claude.com/sitemap.xml` answers `cf-cache-status: DYNAMIC`
 *      with `cache-control: private, no-cache`, so Cloudflare reaches the
 *      Webflow origin on every read. `www.anthropic.com/sitemap.xml` answers
 *      `x-nextjs-cache: HIT`, so no strict origin is involved. A malformed
 *      frame reaching an origin is a 502 at the edge, which is the status we
 *      saw. Cloudflare bot blocks answer 403 or 503, not 502.
 *   2. FINGERPRINT. The default runtime hands every fetch to Rust `reqwest`
 *      over `hyper`, with stock OpenSSL and one ALPN extension. JS cannot reach
 *      that TLS connector (issue #331), so the lane cannot reshape it.
 *
 * Node's `fetch` is undici, which shares neither fault. It returned 200 and
 * 1,477,904 bytes for the sitemap, matching `curl` byte for byte, and 200 with
 * real titles on the article pages. So this module is the one fix that holds
 * under both readings.
 *
 * The self-hosted image runs this. `Dockerfile.backend` copies Node in with the
 * comment "required for running Node.js actions in the backend", and
 * `local_backend` spawns a `LocalNodeExecutor` child process rather than
 * calling AWS Lambda. No second container and no extra configuration.
 *
 * This module holds ONE action and imports nothing outside the repo, so it
 * installs no external packages on the data volume.
 */

import { v } from 'convex/values'
import { internalAction } from './_generated/server'
import { SCRAPER_FETCH_TIMEOUT_MS, SCRAPER_HEADERS } from './lib/scrapers'

/**
 * Read one URL on Node and return its body.
 *
 * Deliberately identical to `fetchText` in `convex/newsScrapers.ts`: the same
 * headers, the same timeout, the same `HTTP <status>` error. Only the runtime
 * differs, so a routed source fails the same way an unrouted one does and the
 * Sources view reads the same either way.
 */
export const fetchText = internalAction({
  args: { url: v.string() },
  handler: async (_ctx, args): Promise<string> => {
    const res = await fetch(args.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(SCRAPER_FETCH_TIMEOUT_MS),
      headers: SCRAPER_HEADERS,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  },
})
