# AI Stack usage analytics — engagement & curation drop-off (2026-07-15)

Ticket: https://github.com/alp82/aistack/issues/5 (part of the direction/USP map, #3)

**Sources.** Full prod Convex snapshot (self-hosted, exported 2026-07-15, incl. better-auth component tables) + PostHog EU project `AI Stack` (autocapture pageviews, all time since 2026-01). Each finding is tagged with how hard it should push the identity/USP decision (#7): **[strong]** / **[medium]** / **[weak]**.

---

## The funnel (Convex, prod)

```
121 auth users
 → 98 created a creator profile
 → 80 created a stack (78 published)
 → 28 ever edited it again >1 day later   (35%)
 → 15 stacks touched in the last 30 days
```

1. **[medium] Top-of-funnel is alive.** Signups are steady, not dead: Jan 12, Mar 34, Apr 24, May 21, Jun 22, Jul 7 (half-month). People keep finding the site and going all the way to a published stack — the leak is *after* publish, not before.
2. **[strong] It's a one-shot product today.** 89 of 112 users with sessions have exactly **one session ever**. Only ~17 non-owner users ever came back on a later day. 51 users' last session is ≥90 days old; 8 were active in the last week (one of whom is the owner, who alone holds 31 of 177 sessions). Create → leave is the dominant lifecycle.
3. **[strong] The shipping USP has zero adoption.** The CLI `collect`/`create` loop ("carry your AI config"): **1** resource row, **1** resource link, **4** CLI tokens, **1** CLI session — *all owner-owned*. Nobody but the owner has ever used the config-carry feature. Caveat: it was never promoted and had known bugs (`TASKS.md`), so this is "no demand evidence", not "proven no demand" — but the burden of proof has clearly flipped.
4. **[strong] Profile curation was never possible — not neglected.** `bio`, `personalPages`, `projectPages`, `discordUserId`: 0% filled across all 98 creators — because **no mutation accepts them and no edit UI exists** (they're only ever written as empty). The "users don't curate their profiles" premise partially dissolves into a product gap. Avatar (70%) and xHandle (54%) are populated only because OAuth/signup imports them. The consultant/marketplace identity has therefore never been tested: the surface it needs isn't there.
5. **[medium] Stack curation is shallow where it's optional.** Required-ish fields are filled (description 78/80, cost 80/80 — server-computed); optional depth is not: per-tool "how I use it" notes on **8 of 277** tool subscriptions (3%), models on 25/80 stacks, bundles on 2, accent preset on 3 (shipped a month ago). The owner has marked 42/80 stacks (52%) `isLowQuality`. The median stack has 2 tools. People fill in what the form demands, then stop.
6. **[medium] Contribution willingness is real but small.** 28 of 98 tools in the catalog are user-submitted (people add their tool when it's missing), 13 non-owner users cast 46 upvotes on 26 stacks (zero self-votes), 2 tool edit suggestions (both approved), projects added on 16 stacks (33 projects) — the best uptake of any optional feature. All 42 stack flags are the owner's own moderation, not community signal.

## Traffic (PostHog, all time)

7. **[strong] Traffic is promo-spike-driven with no organic engine.** Monthly uniques: Mar **685** (launch), Apr 249, May **619**, Jun 323, Jul **84** (15 days). Between pushes it decays to ~10-20 visitors/day. Referrers all-time: direct 1401, X/t.co 197, Threads 111, daily.dev 101, Reddit ~150, **Google 93** — SEO is effectively zero, so nothing replenishes traffic when the owner stops posting. Last 30 days: 217 visitors, 329 sessions, 31% bounce, 4m27s avg session — small, but visitors who arrive do engage.
8. **[medium] Visitors browse people, not the directory.** Home 1615 uniques → `/stacks` browse 379 (23%) → `/tools` 273. Individual stack pages of *known people* out-pull the browse page (owner's stack 599 — the link he shares; orcdev 107; a long tail of 15-50-visitor stack pages). The stack page works as a **shareable identity artifact**; the directory is secondary.
9. **[medium] The signup step is not the leak.** `/signin` had 154 unique visitors all-time → 121 registered users (~79%). Landing→signin is where visitors drop, not signin→signup. Combined with #1: acquisition converts fine once interest exists; the missing piece is a reason to *return*.

## What we cannot know (named blind spots)

- **No custom events** — autocapture only. Invisible: in-app feature usage (editor steps, filters, search), stack-view counts per stack (beyond pageview paths), what returners actually do, CLI funnel (install → login → collect), compare behavior.
- **Session-table caveat:** better-auth may purge expired sessions, so old return-visits could be undercounted; direction (overwhelmingly single-session) is robust, exact numbers aren't.
- **No cohort retention** — with pageview-only data we can't compute D7/D30 retention per signup cohort.

**Instrumentation verdict:** yes, worth doing, but it's execution-map work, not a decision blocker for this map — ~6 custom events (`stack_view`, `stack_edit_save`, `browse_filter_used`, `upvote`, `signup_completed`, `cli_collect`) plus per-stack view counters would answer the retention questions this analysis can't. Park it for the execution map's P-list.

## Net push on the identity decision (#7)

- **Away from** CLI-config-carry as the lead USP (zero non-owner adoption, unpromoted and buggy though it was).
- **Toward** identities that give a *reason to return*: nothing on the site changes between visits today (no content, no activity, no stats) and both data sources independently show one-shot usage.
- **The share-my-stack identity artifact is the one thing organically working** — people publish, share once, and their pages get visited. Whatever identity wins should amplify that loop rather than replace it.
- **Consultant/marketplace is untested, not disproven** — its prerequisite surfaces (bio, pages, contact) never existed.
- **Community/contribution energy exists at small scale** (tools submitted, upvotes, projects) and is currently capped by having nowhere to go.
