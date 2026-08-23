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
product. The newsletter ships first. The knowledge base is the topic index over
the same items.

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
3. **Scrapers and Reddit.** Seven vendors that publish no feed, built in
   [#210](https://github.com/alp82/aistack/issues/210) from the nine the prototype
   proved. Sitemap scrapers for anthropic.com/news, claude.com/blog,
   nousresearch.com and the DeepSeek news docs. A link scraper for the Kimi blog.
   Page scrapers for the Gemini API changelog (CC-BY 4.0, re-servable with
   attribution) and the xAI API release notes. OpenAI and pi need no scraper,
   because the feed lane already reads their RSS and their releases feed. Reddit
   only after a written commercial agreement, and with the required deletion sync.

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
5. Each projection has its own publish act. One real issue send publishes the
   newsletter and every ready approved item in the knowledge base.

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

Built in [#233](https://github.com/alp82/aistack/issues/233) as
`.claude/skills/news-draft`, `scripts/news-drafts.ts` (`list` and `apply`), and
the internal Convex functions in `convex/newsDrafting.ts`.

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

Built in [#201](https://github.com/alp82/aistack/issues/201). The compose prototype ruled
the compose UI out, so an issue is authored in `src/newsletter/issues.ts` and driven by
`convex/newsletter.ts`, `scripts/newsletter.ts`, and the admin Newsletter view. The shared
send loop moved to `convex/lib/mailer.ts`, which the broadcasts and the issues both use.
The public surfaces are `/news`, `/news/<slug>`, `/subscribe`, and `/email/preferences`.
The audience gained a third list, `newsletterSubscribers`, for the newcomer who is neither
a member nor on the waitlist.

## The knowledge base

The public pull view starts at `/news`. It shows the five newest published items,
then one card per owner-managed topic. Each topic has a page under
`/news/topics/<slug>`.

A real newsletter send publishes every approved item that has a summary and a
topic, including items outside that issue. A test send changes nothing. A skipped
week publishes nothing. An incomplete approved item stays private and returns to
the next drafting run.

The page applies the re-serving policy before data leaves Convex. Thin release
notes under 120 characters, or notes that contain only a compare link, share one
release strip per topic. An X item returns only our summary and an allow-listed
static embed. The page never loads the X widget script.

## Machinery

- **Tables**: sources, news items (inbox state, stream state, topic, summary,
  license class), issues, email preferences, scraper baselines.
- **Collector**: a Convex cron per collection tier, writing to the inbox. Feed polling
  uses a normal browser user agent and follows redirects. The scraper cron runs on the
  same six hours, offset by 30 minutes, and sends an honest bot user agent instead: a
  faked browser breaks the Gemini changelog with a redirect loop.
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
