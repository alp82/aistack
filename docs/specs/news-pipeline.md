# News pipeline spec

Decided on [#162](https://github.com/alp82/aistack/issues/162), part of
[map #159](https://github.com/alp82/aistack/issues/159). Source facts come from
[docs/research/news-sources-2026-08.md](https://github.com/alp82/aistack/blob/research/news-sources/docs/research/news-sources-2026-08.md)
([#163](https://github.com/alp82/aistack/issues/163)). Terms are defined in
[CONTEXT.md](../../CONTEXT.md). Written 2026-08-18.

## Verdict

**Build.** The pipeline is line 1 of the missing list in
[DIRECTION.md](../../DIRECTION.md). Users said a return needs a push, and the newsletter
is that push. A follow-up build map owns the execution.

## The product

One item stream, two projections. The newsletter pushes a weekly email. The knowledge
base lets visitors pull items by topic. The pipeline that fills the stream is the real
product. The newsletter ships first. The knowledge base starts as the archive of the
same items and gets its own surface after a prototype settles its publish flow.

## Sourcing

The collector runs on a schedule and writes new items to the inbox. Nothing reaches the
public from collection alone.

Collection phases:

1. **Feed polling and releases.** One generic RSS/Atom poller covers vendor blogs
   (OpenAI, Google), Substack, Ghost and Buttondown newsletters, personal blogs,
   YouTube channel feeds, and aicrier as a discovery signal. GitHub `releases.atom`
   covers claude-code, codex, gemini-cli, opencode, and pi. Free, no auth.
2. **Hacker News and X.** HN through the Algolia `search_by_date` API with keyword and
   points filters (free, 10,000 requests per hour). X through owner-pasted post links,
   rendered with the free oEmbed endpoint. Automatic X discovery stays out until a
   non-paid path is found or a budget is set. A research lane explores non-paid
   programmatic X fetching.
3. **Scrapers and Reddit.** Sitemap-diff scrapers for anthropic.com/news and
   claude.com/blog. A page-diff scraper for the Gemini API changelog (CC-BY 4.0,
   re-servable with attribution). Reddit only after a written commercial agreement,
   and with the required deletion sync.

Manual intake: the owner pastes URLs into the quick-add form. `KNOWLEDGE-BASE.md` stays
a private capture file with no automated connection to the pipeline. Its section
headings seed the first topic list.

Re-serving policy, from the research:

| Content class | What we store and show |
|---|---|
| CC-BY 4.0 (Gemini API changelog) | full text with attribution |
| MIT/Apache release notes (codex, gemini-cli, opencode, pi) | full text with attribution and license notice |
| Unlicensed release notes (claude-code) | summary in our own words plus link |
| Blog and newsletter posts | headline, date, link, own summary, short quotes only |
| HN | titles and links, comment excerpts with a link back |
| X posts | IDs and official oEmbed embeds only |

## Curation

Semi-automatic, as [#17](https://github.com/alp82/aistack/issues/17) locked for the
digest. The machine collects and drafts. The owner decides.

1. The collector stores each new item with its headline, link, date, and source.
2. A drafting run writes a summary in our own words and one topic per item (see
   Drafting). An item can sit in the inbox without a draft.
3. The owner works the inbox: edit the summary, confirm or change the topic, then
   approve or discard.
4. Approve moves the item to the stream. The stream is still private.
5. Each projection has its own publish act. The newsletter publishes per issue send.
   The knowledge base publish flow is decided in its prototype.

The topic list is flat and owner-managed, and it will evolve. One topic per item.

## Drafting

Decided on [#205](https://github.com/alp82/aistack/issues/205). The backend holds no
LLM call and no API key. A drafting skill in this repo runs in the owner's Claude
session, on the owner's subscription. The owner picks the model per session.

- **Input**: the full linked page, fetched by a less expensive explorer subagent.
- **Topic**: the skill picks from the owner-managed list. It may propose a new topic,
  and it can ask the owner in the session when it has a good candidate.
- **Output**: one draft file per item in the repo. The owner reviews and merges them.
  An apply script on the server writes merged drafts into the inbox rows and clears
  the applied files. It runs through `scripts/convex-prod.sh`, like migrations.
- **Trigger**: the owner runs the skill by hand. A local Claude schedule can run it
  weekly before compose. A cloud schedule cannot reach prod over ssh, so it is out.
- **Retries**: the skill handles retries inside the run.
- **Failure**: the run ends with a per-item report, like the broadcast sender. A
  failed item stays in the inbox without a draft, and the next run re-attempts it.
  Drafting never blocks collection.

## The newsletter

- **Cadence**: weekly, sent Sunday. A thin week skips. Skip beats bad content.
- **Compose**: prototype first. The compose flow is: pick approved items, order them,
  edit summaries, write an intro, preview the render, test-send, send. A prototype of
  the compose UI decides whether that UI ships, or whether issues stay code-based like
  the sync broadcast.
- **Archive**: every sent issue gets a public page under `/news`.
- **Audience**: members and waitlist, subscribed by default (opt-out). A public
  subscribe page takes newcomers.
- **Preferences**: unsubscribe is per email category, not global. Two categories:
  newsletter and important updates. Transactional mail has no toggle. This replaces
  the current global unsubscribe.
- **Send**: the existing Resend machinery in `convex/email.ts`, extended from one-off
  broadcasts to composed issues.

## The knowledge base

A public pull view under `/news`, grouped by topic. It reads the same stream. Its
publish flow (per item, per batch, or something else) and its page shape are decided in
a prototype ticket on the build map, not here.

## Machinery

- **Tables**: sources, news items (inbox state, stream state, topic, summary,
  license class), issues, email preferences.
- **Collector**: a Convex cron per collection tier, writing to the inbox. Feed polling
  uses a normal browser user agent and follows redirects.
- **Drafting**: the repo skill in the owner's Claude session, plus the apply script
  (see Drafting). The backend holds no LLM code.
- **Admin surfaces**: inbox page, quick-add form, compose UI.
- **Public surfaces**: `/news` with the issue archive and the knowledge base view, plus
  the subscribe page and the preferences page.
- **Send**: extend `convex/email.ts`. Per-category unsubscribe replaces the global
  list.

## Build order

1. Tables, feed poller, GitHub releases collector, inbox, quick-add.
2. Drafting skill and apply script, topic list, compose prototype and its
   ship-or-not verdict, archive
   pages, subscribe and preference pages, first Sunday send.
3. HN Algolia collector, X paste-and-embed lane.
4. Knowledge base prototype, then its build. Anthropic scrapers. The X research
   verdict decides the X lane.

Reddit stays deferred until the commercial agreement question is settled. The compose
prototype, the knowledge base prototype, and the X research all live on the pipeline
build map.

## Deferred and out of scope

- The compose UI as a shipped surface. Its prototype decides ship or code-based.
- Automatic X discovery through the paid API. Deferred until a budget decision.
- Reddit ingestion. Deferred, needs a written agreement plus deletion sync.
- Automated import of `KNOWLEDGE-BASE.md`. Ruled out, manual paste only.
- The knowledge base publish flow and page shape. Deferred to its prototype.
