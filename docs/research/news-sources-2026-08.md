# Collectible news sources for a semi-automatic AI-tooling pipeline

Research for [#163](https://github.com/alp82/aistack/issues/163), part of
[#159](https://github.com/alp82/aistack/issues/159), blocking
[#162](https://github.com/alp82/aistack/issues/162). Written 2026-08-17.

For each source type: access path (RSS/Atom, API, scrape), cost, rate limits, and
terms-of-service constraints on re-serving content. Feed URLs marked "verified" were
fetched live on 2026-08-17 and returned a current feed. ToS readings are our own
risk assessment against the cited pages, not legal advice.

## Headline findings

- Almost the whole vendor surface is coverable with plain feed polling: 10 of 12
  vendor surfaces have a working RSS/Atom feed, at zero cost and no auth. Only the
  two Anthropic blogs (anthropic.com/news, claude.com/blog) need a scraper.
- GitHub `releases.atom` is the workhorse: no auth, no documented rate limit, and
  the entries carry full release-note bodies. Claude Code, Codex, Gemini CLI,
  opencode, and pi are all covered by it.
- Hacker News is the friendliest aggregator: free, no auth, Algolia gives
  date-windowed search at 10,000 requests/hour, and the official Firebase API
  documents "no rate limit".
- Reddit is usable free at 100 QPM with mandatory OAuth, but a monetized product
  needs a written commercial agreement, and stored content carries a
  deletion-sync obligation.
- X/Twitter API is pay-per-use in 2026 (about $0.005 per post read) and its terms
  limit redistribution to IDs and official embeds. Scraping and nitter are not
  viable. The free oEmbed endpoint covers rendering individual known posts.
- Safe default posture for everything: store link, headline, date, and a summary
  in our own words. Full-text re-serving is only clearly licensed for CC-BY and
  Apache/MIT sources (Gemini API changelog, codex, gemini-cli, opencode, pi
  release notes).

## 1. Vendor changelogs and blogs

### Anthropic

- **anthropic.com/news**: no feed. `anthropic.com/rss.xml` and
  `anthropic.com/news/rss.xml` 404, and the page head advertises no alternate
  feed link. `robots.txt` is `Allow: /` with a sitemap
  (`https://www.anthropic.com/sitemap.xml`), so the practical path is diffing the
  sitemap or the /news listing page. No published rate limits.
- **claude.com/blog**: same situation. No feed (404s confirmed), robots allows
  all, sitemap at `https://claude.com/sitemap.xml`. Scrape and diff.
- ToS: Anthropic's [Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
  prohibit crawling and automated access, but scope themselves to Claude.ai and
  consumer products, not the marketing site. No separate website terms were found
  on the legal index. Gray area: headline plus link plus own summary is low risk,
  full-text republication is not licensed.
- **Claude Code changelog**: the docs release-notes page now just redirects to
  the GitHub CHANGELOG.md, so the repo is the single source. Three verified paths:
  - `https://github.com/anthropics/claude-code/releases.atom` (entries carry the
    release notes)
  - `https://github.com/anthropics/claude-code/commits/main/CHANGELOG.md.atom`
    (fires on every changelog edit)
  - `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`
    (plain markdown, easy to diff)
  The claude-code repo has NO license file (GitHub API reports `license: None`),
  so the changelog text is all-rights-reserved Anthropic content. Summarize and
  link, do not republish wholesale.

### OpenAI

- **openai.com/news**: real RSS, verified: `https://openai.com/news/rss.xml`
  (the historical `openai.com/blog/rss.xml` 307-redirects there). The site sits
  behind Cloudflare and blocks some non-browser fetchers, so poll with a normal
  UA at modest frequency.
- **developers.openai.com**: RSS, verified: `https://developers.openai.com/rss.xml`
  (advertised in the blog page head; note it mixes blog and "learn" content;
  `/blog/rss.xml` itself 404s).
- **Codex changelog**: `developers.openai.com/codex/changelog` exists but exposes
  no feed. Better: `https://github.com/openai/codex/releases.atom` (verified).
  The repo is Apache-2.0, so release-note text can be reproduced with attribution
  and license notice.
- ToS: [OpenAI Terms of Use](https://openai.com/policies/row-terms-of-use/)
  prohibit programmatic extraction from "the Services" (defined around
  ChatGPT-style products, not the marketing site). Publishing an RSS feed signals
  syndication intent for headlines and links; full text is not licensed.

### Google

- **blog.google**: RSS, verified: `https://blog.google/rss/` (all posts) and
  per-vertical `https://blog.google/technology/ai/rss/`. Follow redirects and
  send a browser UA.
- **Google Developers Blog**: RSS, verified:
  `https://developers.googleblog.com/feeds/posts/default`
  (`/rss.xml` 404s).
- **Gemini API changelog** (`ai.google.dev/gemini-api/docs/changelog`): no feed,
  scrape/diff the page. Upside: the page footer licenses the content under
  CC-BY 4.0 (verified on the page), so this source can be re-served nearly
  verbatim with attribution.
- **Gemini CLI**: `https://github.com/google-gemini/gemini-cli/releases.atom`
  (verified). Repo is Apache-2.0.
- ToS: [Google ToS](https://policies.google.com/terms) allow automated access as
  long as robots.txt is respected; content itself stays copyrighted except where
  CC-licensed as above.

### Harness vendors (opencode, pi)

- **opencode**: canonical repo is `anomalyco/opencode` (`sst/opencode`
  301-redirects there). `https://github.com/anomalyco/opencode/releases.atom`
  verified, very high release cadence. `opencode.ai/changelog` has no feed and
  itself links to the GitHub releases page. No CHANGELOG.md in the repo. License
  MIT: full release-note text reusable with the license notice.
- **pi**: canonical repo is `https://github.com/earendil-works/pi`
  (`badlogic/pi-mono` redirects there; `jal-co/jalco-pi-mono` is an archived
  third-party repo, not pi's home).
  `https://github.com/earendil-works/pi/releases.atom` verified, release bodies
  carry structured markdown feature notes. License MIT.

## 2. Hacker News

### Official Firebase API

- Base `https://hacker-news.firebaseio.com/v0/`: `/item/<id>.json`,
  `/user/<u>.json`, `/maxitem.json`, `/topstories.json`, `/newstories.json`,
  `/beststories.json`, `/askstories.json`, `/showstories.json`,
  `/jobstories.json`, `/updates.json`.
- No auth, free, and the [README](https://github.com/HackerNews/API) states
  verbatim "There is currently no rate limit."
- The API repo is MIT (docs and samples; that is not an explicit content license
  for posts and comments). No search or filtering: it is an id-walk API.

### Algolia HN Search API

- `GET https://hn.algolia.com/api/v1/search?query=...` (relevance),
  `search_by_date` (newest first), `items/:id` (full nested comment tree),
  `users/:username`.
- Params: `tags` (story, comment, show_hn, ask_hn, front_page, `author_:X`,
  `story_:ID`; ANDed, OR with parentheses), `numericFilters` on `created_at_i`,
  `points`, `num_comments`, plus paging. Time-window polling is directly
  supported: `search_by_date?tags=story&numericFilters=created_at_i>X,created_at_i<Y`.
- No auth, free. Documented limit (from the docs source in
  [algolia/hn-search](https://github.com/algolia/hn-search)): "We are limiting
  the number of API requests from a single IP to 10,000 per hour."

### Reuse of HN content

- [YC Terms](https://www.ycombinator.com/legal/): users retain ownership of
  their content and license it to YC, not to third parties. The same terms
  prohibit scraping YC sites, but YC publishes the data through the official API
  and tolerates the Algolia mirror, so API use is clearly sanctioned; scraping
  news.ycombinator.com directly is not.
- Practical read: titles and links are facts plus URLs, low risk to re-serve.
  Comment text is user-copyrighted with no explicit third-party grant: quote
  short excerpts and link back, do not mirror.

## 3. Reddit

- Terms: [Data API Terms](https://www.redditinc.com/policies/data-api-terms)
  (last revised July 20, 2026). Key clauses:
  - License is display-only: copy and display User Content "solely as necessary"
    to run your app, no modification except formatting.
  - Explicit ban on using content to train ML/AI models without rightsholder
    permission.
  - No deriving revenue from the API without express written approval; commercial
    use needs a separate agreement (no public price list; the reported 2023
    figure of $0.24 per 1,000 calls could not be verified on a live Reddit page).
  - On termination: delete cached content and anything derived from it.
- Rate limits (Reddit Data API wiki, Nov 2025 revision verified via Wayback,
  live page is Cloudflare-gated): free tier 100 QPM per OAuth client id,
  averaged over 10 minutes, tracked via `X-Ratelimit-*` headers. Unauthenticated
  traffic is blocked outright now (the old 10 QPM anonymous tier is gone).
  OAuth registration and a descriptive User-Agent
  (`<platform>:<app ID>:<version> (by /u/<user>)`) are mandatory.
- Deletion sync: content deleted on Reddit must be removed from our store,
  including author-identifying fields; Reddit recommends routinely deleting
  stored data within 48 hours.
- Practical read: a non-commercial aggregator that links out and displays
  content unmodified fits the free tier. aistack is arguably commercial, so a
  Reddit ingest would technically need Reddit's written approval, plus a
  deletion-sync job. Treat Reddit as a low-priority source.

## 4. X / Twitter

- Pricing ([docs.x.com pricing](https://docs.x.com/x-api/getting-started/pricing)):
  subscription tiers are effectively gone in 2026; the API is pay-per-use with
  upfront credits. Post reads $0.005, user lookups $0.010, post writes $0.015.
  Pay-per-use is capped at 3M post reads per monthly cycle. Basic ($200/mo) and
  Pro ($5,000/mo) plans were migrated to pay-per-use after June 2026; the free
  tier is discontinued for new signups. Enterprise pricing unpublished.
  Cost sketch: 10,000 post reads/month is about $50.
- Redistribution ([developer policy](https://docs.x.com/developer-terms/policy)):
  third-party distribution is limited to Post IDs, DM IDs, and User IDs (max
  1.5M Post IDs per entity per 30 days). Re-serving full post text in our own
  feed is not permitted; the compliant pattern is storing IDs and rendering via
  official embeds.
- Free path for individual known posts: the oEmbed endpoint
  `https://publish.x.com/oembed?url=...` works unauthenticated (verified via
  curl; it 402'd through a datacenter proxy, so call it from our own server).
  Returns author, URL, and an embeddable HTML blockquote with the full post
  text, designed for republication. Single-URL only, no search or timelines.
- Scraping and nitter: X ToS prohibit scraping; nitter shut down as a project in
  February 2024 and surviving instances are unreliable and ToS-violating. Not a
  pipeline input. The undocumented `cdn.syndication.twimg.com/tweet-result`
  endpoint responds today but can vanish anytime.

## 5. GitHub releases and repo feeds

- Per-repo Atom feeds, all verified unauthenticated:
  - `/releases.atom`: title, timestamp, link, author, and full release-note HTML
    body. The richest single feed type for this pipeline.
  - `/commits/<branch>.atom` and `/commits/<branch>/<path>.atom`: per-commit
    entries, useful for changelog files.
  - `/tags.atom`: tag names only, less useful.
  Feeds are served by the web tier: no auth, no documented rate limit (heavy
  scraping reportedly gets 429s; polling dozens of repos hourly is fine). Free.
- REST API (`GET /repos/{owner}/{repo}/releases`), per
  [GitHub rate limit docs](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api):
  60/hour unauthenticated, 5,000/hour with a token (plus secondary limits:
  900 points/minute, 100 concurrent). Gives structured Markdown bodies instead
  of pre-rendered HTML. Free.
- ToS ([GitHub ToS](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)):
  users own their content; the terms state they "do not restrict lawful access
  to or use of the contents of public repositories by third parties". Release
  notes belong to the repo authors, so reuse follows the repo license: for
  MIT/Apache repos quoting is safe with attribution, for unlicensed repos
  (claude-code) summarize and link.

## 6. Newsletters as sources

- Prefer feeds over mailboxes: the major platforms all publish RSS.
  - **Substack**: `PUBLICATION.substack.com/feed`, works on custom domains too
    (verified `latent.space/feed`, `oneusefulthing.substack.com/feed`). Free
    posts arrive with full HTML; paid posts are truncated.
  - **Buttondown**: `buttondown.com/USERNAME/rss` (verified, full HTML content).
  - **Ghost**: built-in `/rss/` on every site (verified `404media.co/rss/`);
    member-only posts truncated.
- Mailbox path, when a newsletter has no web version: subscribe a receiving
  address and parse inbound mail. Since the stack already uses Resend, Resend
  inbound is the natural fit: point a receiving domain at Resend, get an
  `email.received` webhook (a Convex HTTP action as target), then fetch the
  parsed body via the Receiving API (the webhook itself carries only
  sender/recipient/subject). Docs:
  [Resend receiving](https://resend.com/docs/dashboard/receiving/introduction).
  An IMAP poller on any mailbox is the vendor-neutral fallback.
- Legal: newsletter text is ordinary copyrighted content. Summarizing with
  attribution and a link is standard aggregator practice (facts are not
  copyrightable, expression is); keep quotes short, never republish full text.

## 7. Categories from KNOWLEDGE-BASE.md

- **aicrier.com** (the "news" entry): a curated AI developer news aggregator
  with ranked picks. It has an undiscoverable but working feed:
  `https://aicrier.com/feed.xml` and `https://aicrier.com/rss.xml` both return
  RSS 2.0 with title, permalink, pubDate, summary, and category per item. No
  public API. Since it is itself an aggregator, use it as a discovery signal and
  link to the underlying sources, do not re-serve its content.
- **GitHub repos** (stacks, skills, orchestrators, memory tools: the bulk of the
  file): covered by section 5. `releases.atom` for release-driven projects,
  `commits/main.atom` for repos without releases.
- **Personal dev blogs** (addyosmani.com, mitchellh.com, lucumr.pocoo.org,
  simonwillison.net spot-checked): all four have live feeds
  (`addyosmani.com/rss.xml`, `mitchellh.com/feed.xml`,
  `lucumr.pocoo.org/feed.atom`, `simonwillison.net/atom/everything/`). Feeds are
  near-universal on this category; a feed-autodiscovery step
  (`<link rel="alternate">` in the page head) handles the rest.
- **Substack newsletters** (hannahstulberg, aihero.dev, latent.space,
  sebastianraschka): section 6, `/feed` works on subdomains and custom domains.
- **YouTube links**: channel RSS still works without any key:
  `https://www.youtube.com/feeds/videos.xml?channel_id=UC...` (verified; Atom
  with title, link, published, description, thumbnail, view count for the ~15
  most recent videos). The Data API v3 has a 10,000 unit/day default quota and
  ToS strings attached (30-day data refresh, attribution, no derived metric
  databases); the keyless RSS avoids the API ToS entirely for new-video
  detection. Link out to YouTube for playback.
- **x.com links** (many entries are `x.com/.../status/...`): section 4. Render
  via the free oEmbed endpoint; no API subscription needed for individual known
  posts. New-post discovery on X requires the paid API.
- **asciinema.org**: no site-wide or explore feed found (all candidate paths
  404). Treat as manual links; casts embed via the standard embed script.
- **Product sites without feeds** (skills.sh, browse.sh, ui.sh, and the long
  tool-directory tail): scrape-or-manual territory. Most are marketing pages
  with no changelog; the pragmatic path is manual curation, with per-site
  sitemap or page diffing only for the few that matter.

## Recommended collection tiers

1. **Feed polling (build first)**: GitHub `releases.atom` for harnesses and
   tools, vendor blog RSS (OpenAI, Google), Substack/Ghost/Buttondown feeds,
   personal blog feeds, YouTube channel RSS, aicrier as a discovery signal.
   One generic RSS/Atom poller covers all of it, free, no auth.
2. **Targeted APIs**: HN Algolia `search_by_date` with keyword and points
   filters (free, 10k/hour). This is the one aggregator worth automating early.
3. **Scrapers (small, two targets)**: anthropic.com/news and claude.com/blog
   via sitemap diffing; Gemini API changelog page diffing (CC-BY, re-servable).
4. **Deferred or manual**: Reddit (commercial-agreement question plus
   deletion-sync burden), X discovery (paid), newsletters without web versions
   (Resend inbound when one actually matters).

## Re-serving policy summary

| Content class | What we may store and show |
|---|---|
| CC-BY 4.0 (Gemini API changelog) | full text with attribution |
| MIT/Apache release notes (codex, gemini-cli, opencode, pi) | full text with attribution and license notice |
| Unlicensed release notes (claude-code) | summary in our own words plus link |
| Blog and newsletter posts | headline, date, link, own summary; short quotes only |
| HN | titles and links freely; comment excerpts with link back |
| Reddit | display-unmodified only, free tier is non-commercial, deletion sync required |
| X posts | IDs and official embeds only; oEmbed HTML is meant for republication |
| YouTube via Data API | 30-day refresh window, attribution required; keyless RSS avoids this |

Verification gaps: Reddit's commercial pricing and X Enterprise pricing are
third-party figures only; the Reddit help wiki was verified via a Wayback
snapshot of the November 2025 revision because the live page blocks fetchers;
Anthropic website-scraping permission is a gray area with no explicit website
terms found.
