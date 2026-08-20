# Fetching the latest posts of an X profile, free, in 2026

Date: 2026-08-19. Ticket: alp82/aistack#179 (news pipeline, owner-paste lane).

Question: the owner pastes a screen name. A Convex action must return recent post IDs plus
preview text. Rendering then uses the official free oEmbed endpoint
([publish.x.com/oembed](https://publish.x.com/oembed)), which a live probe confirmed today
(HTTP 200 for `?url=https://x.com/AnthropicAI/status/2089842387845804246`). Volume is tiny:
a few owner pastes per week, plus a daily refresh of a handful of profiles. All probes below
ran live from this container on 2026-08-19, with both curl and Node v24.19.0 `fetch`
(undici). The client matters: Convex actions run on a Node runtime, and several sources
answer curl and Node differently from the same IP. Each section states both results.

## Summary table

| Candidate | From curl | From Node fetch | Auth | Verdict for Convex |
|---|---|---|---|---|
| `api.fxtwitter.com/2/profile/:name/statuses` | 200, 12 posts + cursor | 200, same body | None | Primary |
| `syndication.twitter.com/srv/timeline-profile/screen-name/:name` | 200 after 429 retries, 20 posts | 429 every time | None | Blocked for Node |
| nitter.net `/:name/rss` | 200, 12 fresh items | 200 with empty body | None | Blocked for Node |
| xcancel.com `/:name/rss` | 200 with feed-reader UA | Placeholder "not whitelisted" feed | Email whitelisting | Human decision |
| `cdn.syndication.twimg.com/tweet-result` | 200, single post | 200, same body | None, computed token | Enrichment |
| `cdn.syndication.twimg.com/timeline/profile` | 200 with empty body (dead) | - | - | Dead |
| RSSHub `/twitter/user/:name` | Demo dead | - | Real X account cookie | Skip |
| Official X API v2 | Works | Works | Paid credits | Not free |
| openrss.org `/x.com/:name` | 503 today | - | None | Skip |
| `publish.x.com/oembed` (render step) | 200 | 200 | None | Keep |

## 1. FxTwitter (FxEmbed) API: the strongest free option

The [FxEmbed project](https://github.com/FixTweet/FxTwitter) (MIT license, about 4,000
commits, active in 2026) runs a public JSON API. The
[API reference](https://docs.fxembed.com/api/introduction) documents
`GET https://api.fxtwitter.com/2/profile/{handle}/statuses`, plus `/2/profile/{handle}`,
`/2/status/{id}`, `/2/thread/{id}` and more. Documented rate limit: 1,000 requests per
minute per IP. No auth.

Live probe: `curl https://api.fxtwitter.com/2/profile/AnthropicAI/statuses` returned
HTTP 200 in one attempt, 41.8 KB of clean JSON. The same request from Node v24 `fetch` also
returned 200 with the same body, so it works from a Convex action.
Shape: `{code, results, cursor}`.
Each result carries `id`, `text`, `created_at`, `created_timestamp`, `url`, `author`,
`media`, `likes`, `reposts`, `replies`, `views`, and a `replying_to` object when the post
is a reply. The probe returned 12 statuses, the newest from 2026-08-18 22:30 UTC, which
was the latest AnthropicAI post at probe time. The `cursor` object (`top`, `bottom`)
supports pagination. Self-thread replies are included and are marked by `replying_to`.
The profile endpoint `GET /2/profile/AnthropicAI` also returned 200 with follower counts
and the numeric user ID.

Stability: FxTwitter has served Discord and Telegram embeds since 2020 and survived every
X lockdown wave, including the July 2023 guest-token shutdown that killed anonymous Nitter.
It is still a third party that proxies X data without permission, so it can break or be
blocked at any time.

## 2. Syndication timeline page: works from curl, blocked for Node clients

`https://syndication.twitter.com/srv/timeline-profile/screen-name/AnthropicAI` is the
backend of the old "embedded timeline" widget. It is not documented anywhere by X.

Observed behavior today, from curl:

1. Cold calls returned HTTP 429 with the body `Rate limit exceeded` (20 bytes). Two calls
   25 seconds apart both got 429.
2. After a 90 second wait, the same call returned HTTP 200 with a 94.7 KB Next.js HTML page.
3. Once warm, three follow-up calls within a minute all returned 200, including one with the
   default curl User-Agent. A different profile (`OpenAI`, 145 KB) also returned 200 at once.

The decisive finding came from interleaving clients on the same container IP with identical
User-Agent headers. curl got HTTP 200 every time. Node v24 `fetch` (undici) got HTTP 429
`Rate limit exceeded` every time, in the same seconds. The main session reproduced the same
split with `node:https`. So the 429 does not discriminate on request rate, IP, or User-Agent.
It discriminates on the TLS or HTTP/2 client fingerprint. The earlier "429 then 200" pattern
was this same filter plus edge caching, not a rate window.

Consequence: Convex actions run on a Node runtime and cannot shell out to curl, so this
endpoint would answer 429 to a Convex collector constantly. It is not viable as the
collector's fetch path. It stays useful for manual diagnosis from a shell, and as a data
point: X actively defends this endpoint against non-browser clients, which raises both the
reliability risk and the ToS concern for anything built on it.

Response shape: the JSON in `<script id="__NEXT_DATA__">` carries
`props.pageProps.timeline.entries`, an array of `{type: "tweet", content: {tweet}}`. The
probe returned 20 entries for AnthropicAI, all `type: "tweet"`, 13 of them self-thread
replies (marked by `in_reply_to_status_id_str`), zero retweets in this sample. Each tweet
has `id_str`, `created_at`, `full_text`, `permalink`, `user`, and engagement counts. The
newest entry matched the latest real post (2026-08-18 22:30 UTC), so freshness is good.
Depth is about 20 to 100 entries and varies by profile.

Stability: this endpoint has existed for years and has been rediscovered repeatedly
(for example in [community threads](https://github.com/zedeus/nitter/issues/919) after the
2023 API shutdown). X has throttled it before and owes it to nobody.

## 3. cdn.syndication.twimg.com/tweet-result: single post JSON, token is derivable

`GET https://cdn.syndication.twimg.com/tweet-result?id={id}&token={token}&lang=en` returns
one post as JSON. Vercel's [react-tweet](https://github.com/vercel/react-tweet) library uses
it in production. The token formula, from
[`fetch-tweet.ts`](https://github.com/vercel/react-tweet/blob/main/packages/react-tweet/src/api/fetch-tweet.ts):

```ts
function getToken(id: string) {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(6 ** 2)          // base 36
    .replace(/(0+|\.)/g, '')
}
```

Live verification: for id `2089842395722678689` the formula yields `52dflu7196h`, and the
call returned HTTP 200 with 8.4 KB of JSON (`id_str`, `text`, `created_at`, `user`,
`entities`, `conversation_count`, `parent`). Node v24 `fetch` got the same 200 and the same
body, so unlike its sibling timeline endpoint, this one does not fingerprint-block Node
today. The `Number()` precision loss does not matter because the token only needs to match
what the same formula produces server-side.

This endpoint needs the post ID first, so it complements the timeline sources. It is a good
enrichment path if oEmbed ever lacks a field. It is also undocumented.

## 4. cdn.syndication.twimg.com/timeline/profile: dead

`GET https://cdn.syndication.twimg.com/timeline/profile?screen_name=AnthropicAI` returned
HTTP 200 with a zero-byte body today. Confirmed dead. Do not build on it.

## 5. Nitter in 2026: alive again, RSS works on a few instances

The [nitter repo](https://github.com/zedeus/nitter) is maintained. Its README states:
"Running a Nitter instance now requires real accounts, since Twitter removed the previous
methods." Self-hosting means feeding it session tokens from real X accounts, which risks
those accounts. Not worth it at this volume.

Public instances, per the [status.d420.de](https://status.d420.de/) health API (10 instances
up today, probed via `api/v1/instances`):

- `https://nitter.net/AnthropicAI/rss`: from curl, HTTP 200, 12 items, newest from
  2026-08-18 22:30 UTC. Fresh and correct. Item links carry the status ID
  (`https://nitter.net/AnthropicAI/status/2089842395722678689#m`), so post IDs fall out of
  the `<link>` field. From Node v24 `fetch`, the same URL returned HTTP 200 with an EMPTY
  body and no content-type header, with both a feed-reader and a browser User-Agent. Another
  client fingerprint filter. Not usable from a Convex action today.
- `https://xcancel.com/AnthropicAI/rss`: 302 to `rss.xcancel.com`, which returns HTTP 400
  ("This URL only works inside an RSS client") for a browser User-Agent but HTTP 200 with a
  fresh feed for a curl request with a feed-reader User-Agent such as `FreshRSS/1.24.1`.
  From Node `fetch` with that same User-Agent, it returned a valid RSS document whose only
  content is "RSS reader not yet whitelisted!" plus a client ID and an instruction to email
  `rss [AT] xcancel [DOT] com` for whitelisting. So xcancel also fingerprints the client,
  but it offers a documented manual path to get a specific client approved.
- `https://nitter.poast.org/AnthropicAI/rss`: HTTP 403 today despite the status page listing
  it with RSS on.

Nitter RSS looks fine from a shell and fails from Node, which is where a Convex action
lives. The one workable route is the xcancel whitelist request, and that is a human action
with an external dependency. Instances also rotate, die, and add anti-bot walls, so hard
coding one hostname is the failure mode. RSS depth is about 12 to 20 items.

## 6. Official X API v2: no free read path in 2026

The [official docs](https://docs.x.com/x-api/introduction) state the X API now uses
"pay-per-usage pricing. No subscriptions". The
[pricing page](https://docs.x.com/x-api/getting-started/pricing) lists "Posts: Read" at
$0.005 per resource and "User: Read" at $0.010 per resource, capped at 3 million post reads
per month, with credits purchased upfront. The old Free tier (write-only since 2023) and the
Basic ($200/mo) and Pro ($5,000/mo) subscriptions are gone for new signups. Third-party
summaries agree ([sorsa.io](https://api.sorsa.io/blog/twitter-api-pricing-2026),
[postproxy.dev](https://postproxy.dev/blog/x-api-pricing-2026/)).

At our volume the paid API would cost cents per month, but it requires a developer account,
a credit card, and key management. That is a product decision for the X research lane, not a
default.

## 7. Other paths probed or considered

- **RSSHub** (`/twitter/user/:id`): the
  [route source](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/twitter/user.ts)
  declares `TWITTER_AUTH_TOKEN` (a real logged-in account cookie) as required config, per
  [issue #16184](https://github.com/DIYgod/RSSHub/issues/16184). The public demo
  `rsshub.app/twitter/user/AnthropicAI` returned a Cloudflare 302 that lands on a Google 404
  today. Self-hosting RSSHub has the same account-risk problem as Nitter. Skip.
- **openrss.org**: `https://openrss.org/feed/x.com/AnthropicAI` returned HTTP 503 today,
  even with a feed-reader User-Agent. Not reliable.
- **Search engine caches and web archives**: too stale and too unstructured for "latest
  posts". Not pursued.
- **Paid scraper APIs** (Bright Data, Apify, socialdata.tools and similar): they exist and
  work, but they are paid, so they are out of scope for this question. Mention only.

## Terms-of-service posture

The [X Terms of Service](https://x.com/en/tos) state that "crawling or scraping the Services
in any form, for any purpose without our prior written consent is expressly prohibited" and
forbid access "by any means (automated or otherwise) other than through our currently
available, published interfaces." Every unofficial path above (syndication endpoints,
FxTwitter, Nitter) reads data X serves publicly but outside its published interfaces, so
each one sits against that clause. The oEmbed endpoint is the exception: it is a documented,
published interface.

Known enforcement: X has enforced by technical means (rate limits, endpoint shutdowns, the
July 2023 guest-token removal) far more than by legal ones. The client fingerprint filter we
measured on the syndication timeline is active technical enforcement in 2026: it passes
browsers and curl and refuses Node HTTP stacks from the same IP. An endpoint X defends that
specifically is one X does not want programs to read, which sharpens both the reliability
risk and the ToS posture of building on it. Its lawsuit against a mass
scraper, X Corp. v. Bright Data, was dismissed in May 2024. The court held that X failed to
state a claim over access to public data and that contract claims over copying public posts
were preempted by the Copyright Act
([National Law Review](https://natlawreview.com/article/x-corp-loses-battle-over-public-data-access),
[Morrison Foerster](https://www.mofo.com/resources/insights/240604-california-federal-court-holds-x-s-claims)).
For a tool that reads a handful of public profiles a day, the practical risk is breakage,
not a letter. The design consequence is architectural: treat every unofficial source as a
component that can vanish overnight, and keep the fetched data (IDs plus short previews)
minimal. This is a description of documented positions, not legal advice.

## Recommendation

The Node fingerprint findings cut the free field down hard. From a Convex action, exactly
one free profile-to-posts source worked in every probe: the FxTwitter API. The syndication
timeline and nitter.net both fingerprint-block Node clients, and xcancel gates them behind
manual whitelisting.

Ranked shortlist for the Convex collector action:

1. **Primary: FxTwitter statuses.** `GET https://api.fxtwitter.com/2/profile/{name}/statuses`.
   Clean JSON, no auth, no HTML parsing, generous documented rate limit, and verified to
   return the full body to Node v24 `fetch`. Map `results[].id`, `results[].text`,
   `results[].created_timestamp`, and `results[].replying_to` (to filter or mark replies).
2. **Fallback inside the action: none for now, fail honestly.** When FxTwitter fails, return
   a typed error and show the owner a clear "source unavailable, try again later" state. A
   single free dependency is a real risk, so record every failure with status and body
   length to make a breakage visible on day one.
3. **Fallback candidates that need a human decision first:** ask xcancel to whitelist our
   collector fingerprint by email (free, small external dependency), pay the official X API
   per read (cents per month at this volume, but an account, a card, and a ToS
   relationship), or host a tiny curl-based proxy outside Convex to reach the syndication
   page and Nitter RSS (works today, but it builds on an endpoint X actively defends).
   These belong to the X research lane.

Request pattern for the action:

- Send a stable, honest User-Agent such as `aistack-news/1.0`. FxTwitter answered every
  probe without any UA games.
- Retry policy: on 429 or 5xx from FxTwitter, retry twice with short waits (2 and 10
  seconds). Do not port the syndication backoff numbers here. That endpoint's 429 was a
  fingerprint verdict, not a rate window, and no amount of waiting changes a fingerprint.
- Timeout each fetch at 10 seconds so a dead upstream cannot stall the action.
- Validate before trusting: a response counts as good only if it parses, `code` is 200, and
  `results` is a non-empty array for a profile that has posts. The dead
  `cdn.syndication.twimg.com/timeline/profile` endpoint (HTTP 200, empty body) and
  nitter.net from Node (HTTP 200, empty body) both prove that HTTP 200 alone means nothing.

Caching guidance:

- Cache per screen name in Convex with the fetch time. Serve the cache for repeat pastes
  within 10 to 15 minutes. The daily collector refresh needs no tighter freshness.
- Store post IDs, preview text, `created_at`, and the source that produced them. Rendering
  stays on oEmbed, which is official and already proven.
- Never hammer on failure. One failed attempt per profile per run, then wait for the next
  scheduled run.

Keep behind the X research lane or a human decision:

- Paying for the official X API (cheap at this volume, but a real account, card, and ToS
  relationship).
- Emailing xcancel for RSS whitelisting of our collector client.
- Hosting any curl-fingerprint proxy to reach the syndication page or nitter.net from
  Convex.
- Self-hosting Nitter or RSSHub, because both now consume real X account sessions.
- Any volume increase beyond a handful of profiles per day, which changes both the ToS
  posture and the rate-limit math.
- Whether replies and reposts belong in the news feed. Both timeline sources include
  self-thread replies, and the data marks them, so this is a product filter, not a fetch
  problem.

## Sources

- FxEmbed repo: https://github.com/FixTweet/FxTwitter
- FxEmbed API reference: https://docs.fxembed.com/api/introduction
- react-tweet token code: https://github.com/vercel/react-tweet/blob/main/packages/react-tweet/src/api/fetch-tweet.ts
- Nitter repo and README: https://github.com/zedeus/nitter
- Nitter instance health: https://status.d420.de/
- RSSHub twitter route source: https://github.com/DIYgod/RSSHub/blob/master/lib/routes/twitter/user.ts
- RSSHub auth-token issue: https://github.com/DIYgod/RSSHub/issues/16184
- X API introduction: https://docs.x.com/x-api/introduction
- X API pricing: https://docs.x.com/x-api/getting-started/pricing
- X API pricing summaries: https://api.sorsa.io/blog/twitter-api-pricing-2026 and https://postproxy.dev/blog/x-api-pricing-2026/
- X Terms of Service: https://x.com/en/tos
- X Corp. v. Bright Data dismissal: https://natlawreview.com/article/x-corp-loses-battle-over-public-data-access and https://www.mofo.com/resources/insights/240604-california-federal-court-holds-x-s-claims
- Syndication endpoint community history: https://github.com/zedeus/nitter/issues/919
- oEmbed endpoint: https://publish.x.com/oembed
