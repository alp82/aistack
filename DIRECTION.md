# AI Stack - Direction

*Rebuilt from scratch 2026-08-17 by [#160](https://github.com/alp82/aistack/issues/160) on [map #159](https://github.com/alp82/aistack/issues/159). The USP is unchanged. Below it: what users said, then what is missing, in priority order. Wayfinder maps own the sequencing and the detail. Finished work lives in the maps that shipped it.*

## USP

> **See what real builders use every day, and what they spend on it.**

Why us:

> **You get the full picture: what they run, what they pay, and how they put it together.**

Decided in [#11](https://github.com/alp82/aistack/issues/11).

## What users said

Sources: nine interviews in July 2026 ([#4](https://github.com/alp82/aistack/issues/4), [transcripts](docs/research/user-interviews-2026-07/findings.md)), two live sync tests ([#68](https://github.com/alp82/aistack/issues/68), [#69](https://github.com/alp82/aistack/issues/69)), two direct reports ([#1](https://github.com/alp82/aistack/issues/1), [#50](https://github.com/alp82/aistack/issues/50)), and prod behavior. The 2026-08-17 broadcast to 177 addresses was read in [#161](https://github.com/alp82/aistack/issues/161): it drove one day of traffic, it moved no signup baseline, and it cost no unsubscribes.

1. **Manual curation dies on the staleness treadmill.** Tools change weekly and stacks go stale in days. Maintenance costs more than it returns. Users asked for auto-sync unprompted. It shipped and it is the product spine.
2. **A bare tool list is a commodity.** Most builders run the same few models and harnesses. Users named the real differentiators: usage ratios, real cost, and the things people build.
3. **Passive browsing loses to the feed.** Heavy users stay current on X and do not return to browse stacks. A return needs a push: a digest, a notification, a number that moves.
4. **Creators and consumers want different value.** Creators want a shareable brand page with live proof. Consumers want discovery: what prolific builders adopt and drop.
5. **The measured path works, and almost nobody walks it.** Both live testers synced without help. On prod, 96 stacks exist and 5 have ever synced. No one has examined the cause.

Secondary asks on record: follow and notifications, view analytics (shipped), a personal versus work stack split, more categories, and project-to-stack advice with expert connect.

### Who said what

Interviews ([#4](https://github.com/alp82/aistack/issues/4), full quotes in the [transcripts](docs/research/user-interviews-2026-07/findings.md)):

- **Will** (AI DevX engineer, returner): asked unprompted for auto-sync from transcripts, and for a weekly tooling-trends digest.
- **zacksiri** (returner): everyone runs the same tools. The interesting part is what people build with them.
- **François Best** (dormant): the stack went stale at once, and the site solves no felt problem. Wants OpenUsage-style direct value.
- **Mark** (churned): X covers the stay-current need. Wants a personal versus work split and more categories. Possibly outside the target audience.
- **maddada** (skeptic): "heh interesting", no recurring need. The GitHub stack image only decorates a profile.
- **OrcDev** (dormant creator): wants a shareable brand page and shareable aggregate tech charts. Also gave landing-page notes.
- **Justin** (dormant): wants a Kit-style page with referrals, and a CLI that audits used tools automatically.
- **ShadowArcanist** (returner): wants a follow feed for tool adoption and removal, and view analytics as motivation to stay fresh.
- **Jay** (returner): low signal. The site is fine as it stands.

Live tests and reports:

- **OrcDev** ([#68](https://github.com/alp82/aistack/issues/68), Claude Code): completed onboarding alone. The test machine surfaced the missing gpt-5.6 prices and the unknown-model bucket.
- **GVASTE** ([#69](https://github.com/alp82/aistack/issues/69), Codex): reported the unpriced gpt-5.6 family and identified foreign models inside the Codex sessions folder.
- **A grok build and Cursor user** ([map #60](https://github.com/alp82/aistack/issues/60)): hit the no-supported-harness dead end. The first demand for a third adapter.
- **Abhash-Chakraborty** ([#1](https://github.com/alp82/aistack/issues/1)) and **impuls666** ([#50](https://github.com/alp82/aistack/issues/50)): direct bug reports, both fixed.

## What is missing

Headlines only. Detail lives on [map #159](https://github.com/alp82/aistack/issues/159) and its successors.

1. **The news pipeline.** Built and live, and not launched. One item stream with two views: the newsletter pushes by week, the knowledge base pulls by topic. All 22 sources collect, both projections render, and issue 1 is authored. The public surfaces stay closed behind `NEWS_IS_PUBLIC` until the owner sends. Shipped on [map #198](https://github.com/alp82/aistack/issues/198).
2. **The measured workflow surface.** Built and live. The CLI ships one day of combinable atoms per UTC date behind the approve gate, the server folds a 30-day, 7-day, or 24-hour window at read time, and the stack page shows the section at 04 in a fixed editorial order with a picture on every row. No LLM anywhere. Prod holds its first daily reading from CLI 0.9.0. Shipped on [map #200](https://github.com/alp82/aistack/issues/200).
3. **The Discord bot.** Spec locked in [`docs/specs/discord-bot.md`](docs/specs/discord-bot.md). Building on [map #199](https://github.com/alp82/aistack/issues/199).
4. **The sync funnel.** 101 stacks, 6 ever synced, 4 living on 2026-08-22. The loudest unexplained number the product has. No map has looked at it.
5. **Announce projects and accent colors.** Both shipped and stay unannounced. The pipeline build shipped the important-updates category, so the channel exists now. The send is still owed.
6. **Auto-sync triggers for opencode and Pi.** A machine with only these harnesses gets no background sync.
7. **The chat-app blind spot.** Claude and ChatGPT are the two most-listed tools, and no adapter can measure a chat app.
8. **More harnesses.** github-copilot is the largest unmeasured harness. Cursor needs a hook route. Both need a flat-fee cost model.
9. **Follow and notifications.** The follow graph, the following filter on the feed, and pushes on followed activity.
10. **Community and depth surfaces.** Threaded comments, per-tool what-for notes, price-comparison pages, skills provenance.
11. **Parked bets.** Monetization, the consultant badge, stack categories, messaging, stack export. A map picks one up when demand shows.

## Standing constraints

Permanent. Violating one breaks the USP.

1. **Never sell placement or ranking.** Sponsored money never affects what surfaces where. ([#19](https://github.com/alp82/aistack/issues/19))
2. **Raw data never leaves the machine.** The CLI sends only user-approved derived aggregates. ([#8](https://github.com/alp82/aistack/issues/8), [#13](https://github.com/alp82/aistack/issues/13))
3. **Positive claims only.** No surface says a listed thing went unused until the adapter seam covers every harness the user runs. ([#40](https://github.com/alp82/aistack/issues/40))
