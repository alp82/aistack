# News runbook

How the news pipeline is operated, week to week. One page, in the order the work
happens.

This is the **procedure**. For the design behind it, read
[docs/specs/news-pipeline.md](specs/news-pipeline.md): the sourcing phases, the
re-serving policy table, and why there are two projections over one item stream.
The vocabulary used here is defined in [CONTEXT.md](../CONTEXT.md).

Two decisions shape everything below, and neither is revisited here:

- **Drafting runs in the owner's Claude session**, on the owner's subscription.
  The backend holds no LLM call and no API key
  ([ADR-0003](adr/0003-news-drafting-in-the-owner-session.md)).
- **Issues are code.** The compose prototype ruled out a compose page, so an
  issue is authored in a pull request
  ([#202](https://github.com/alp82/aistack/issues/202)).

The other decisions that bind this pipeline are
[ADR-0004](adr/0004-a-hacker-news-story-joins-the-item-a-feed-collected.md) (a
Hacker News story joins the item a feed already collected) and
[ADR-0005](adr/0005-the-x-profile-lane-is-owner-triggered-only.md) (the X profile
lane is owner-triggered only).

## The week at a glance

| When | What | Who |
|---|---|---|
| Continuously | The collectors fill the inbox | The crons |
| Any day | Draft the summaries, work the inbox | Owner, with `/news-draft` |
| Before a send | Author the issue in code | Owner, in a pull request |
| Sunday | Prepare, preview, test, send | Owner |

A thin week skips. Skip beats bad content.

## 1. Collection, unattended

Three crons fill the inbox. Nothing they collect is public: an item lands in the
inbox and stays private until the owner approves it AND a projection publishes
it.

| Cron | Schedule (UTC) | Lane |
|---|---|---|
| `news-collect` | every 6 hours | Feeds, newsletters, YouTube, GitHub `releases.atom` |
| `news-collect-hn` | 06:00 daily | Hacker News, re-reading the last 48 hours |
| `news-scrape` | `30 */6 * * *` | The seven vendors that publish no feed |

Hacker News is daily rather than six-hourly because points settle over about two
days. Every run re-reads the trailing window, which is what catches the
overnight climber. The scrapers run on the feed lane's schedule, offset by 30
minutes so the two runs do not open their connections together.

**Two facts that surprise people:**

- **A new source collects forward, never backward.** `collectFrom` is set to the
  moment the source row is created, so the first poll skips everything older.
  Without that floor one new source floods the inbox with years of posts: the
  OpenAI feed alone serves over 1100 archive items. To backfill on purpose, move
  `collectFrom` back on the source row.
- **A scraper's first run adds nothing.** It seeds its baseline instead, which
  is the whole newness test. Items start arriving on the second run.

The seven scraper sources register themselves on the first `news-scrape` run.
The feed sources and the Hacker News source come from migrations
(`20260823_news_phase1_sources`, `20260823_news_hn_lane`); nothing else creates
them, so an empty `newsSources` table means those never ran.

Adding a source by hand: the admin News tab, Sources view.

## 2. The inbox

`/admin?tab=news`, Inbox view. The inbox is the source digest: one closed box
per source, biggest group first, with a verdict on every row. It is worked, not
read.

- **Quick-add** takes a URL in the sticky bar at the top. Pasting an X post link
  stores the official embed; pasting an X profile link only offers a pick list,
  and nothing is stored until a post is picked.
- **A failing source shows a red banner** with the name, the error, how long it
  has been failing, and a retry button. One transient HTTP error is normal; a
  source failing for days needs its URL checked.

Approve moves an item to the item stream. **The stream is still private.** Each
projection has its own publish act.

## 3. Drafting

The machine collects and drafts. The owner decides.

```sh
/news-draft                              # the skill: reads the inbox, writes drafts/news/*.md
node scripts/news-drafts.ts list         # the same read, on its own
node scripts/news-drafts.ts apply        # write the merged drafts into prod
node scripts/news-drafts.ts apply --dry-run
```

The order is: run the skill, review and merge `drafts/news/*.md`, then apply.
Apply deletes each file it wrote and leaves every file it skipped. A row whose
summary the owner already typed is skipped, never overwritten.

The skill writes one summary in our own words and picks one topic per item. The
topic list starts empty and grows one topic at a time, so early runs propose new
topics. `KNOWLEDGE-BASE.md` stays a private capture file and seeds nothing.

Drafting never blocks collection. An item can sit in the inbox without a
summary, and the next run re-attempts it.

## 4. Authoring an issue

One issue is one entry in [`src/newsletter/issues.ts`](../src/newsletter/issues.ts):

```ts
{
  number: 2,
  slug: 'issue-2',
  subject: 'The subject line, as it lands in an inbox',
  preview: 'The grey preheader line after the subject.',
  intro: 'One short paragraph, in your voice.',
  itemUrls: [ /* the items, IN SEND ORDER */ ],
}
```

**The summaries are not there.** They live on the item rows, where the drafting
skill writes them and the inbox edits them, and both projections read them from
there. That is safe only because a sent issue is never edited.

Items are named by URL, and the join runs through the same `newsUrlKey` the
collector dedupes with, so a tracking parameter or a trailing slash does not
break it.

The order is the composition. There are no sections.

## 5. Sending

Deploy first. The Convex functions must exist on prod before any of this runs,
and deploys go through GitHub Actions on a push to `main`.

```sh
node scripts/newsletter.ts list             # authored issues, and their state on prod
node scripts/newsletter.ts prepare issue-2  # resolve the URLs into the draft row
node scripts/newsletter.ts preview issue-2  # the exact send HTML, to a local file
node scripts/newsletter.ts test issue-2 --to you@example.com
node scripts/newsletter.ts send issue-2 --yes
```

The same four acts sit in the admin News tab, under Newsletter. Send there asks
for a typed confirmation.

**`prepare` is the checklist.** It is idempotent and it names every authored URL
that is missing, still in the inbox, or still undrafted, so the loop is: prepare,
work the inbox, prepare again. Run it until it reports every item resolved.

**A sent issue is never edited.** `prepare` refuses a sent issue and a second
send is refused. That is what lets the archive page and the copy in someone's
inbox read the same summary off the same item row.

The audience is the waitlist, the registered members, and the public
subscribers, minus every address that turned the newsletter category off.

**A real send also publishes the ready item stream to the knowledge base.**
The publication includes every approved, summarized, grouped item that has not
appeared there before. Issue membership does not limit the publication. A test
send changes nothing, and a skipped week publishes nothing.

An approved item without a summary or topic stays private. The next drafting
run includes that item again. A later real send publishes the item after the
draft is ready.

## 6. After the send

The issue appears at `/news/<slug>` and in the archive at `/news`. The same send
adds the ready item stream to the topic index at `/news`. Issue links
point at the main page by default, with one quieter read-in-browser link to the
issue's own archive page, which is why that page carries the neighbours and the
full issue list ([#203](https://github.com/alp82/aistack/issues/203)).

The five newest published items sit above the topic cards. Each topic page lives
at `/news/topics/<slug>`. Thin releases share one release strip on their topic
page. The page shows X embeds as static allow-listed markup and never loads the
X widget script.

## Public surfaces

| Path | What |
|---|---|
| `/news` | The knowledge topic index, the archive of sent issues, and the subscribe form |
| `/news/topics/<slug>` | One knowledge topic with its published items |
| `/news/<slug>` | One sent issue. A draft issue 404s |
| `/subscribe` | The public subscribe page, for the newcomer who is neither a member nor on the waitlist |
| `/email/preferences?token=...` | Both email categories for one address. No login: the token is the one every send already carries |

Unsubscribe is per category, never global. The two categories are the newsletter
and important updates. Transactional mail has no toggle.

## Running anything against prod

Every command here reaches prod through `scripts/convex-prod.sh`, like
migrations: the Convex CLI runs on the server over ssh, and the admin key is
minted there per call. **Never point the local Convex CLI at prod.**

The functions these scripts call are internal, because an admin key carries no
user identity and the public news functions check `isAdmin`.

## When something looks wrong

| Symptom | Likely cause |
|---|---|
| The inbox is empty and stays empty | No source rows. Check the Sources view; the seeding migrations may never have run |
| A newly added source collects nothing | `collectFrom` is the moment it was added. It collects forward only |
| A new scraper adds nothing on its first run | It seeded its baseline. Items arrive on the second run |
| One source shows a red banner | Read the error in the banner and press retry. Days of failures means the URL moved |
| `prepare` reports items as `inbox` | They are collected but not approved. Draft them, then approve them |
| `prepare` reports items as not collected | Quick-add the URL, or wait for the lane that covers it |
| `send` refuses | The issue is already sent, has no items, or has no subject |
