# AI Stack — Direction

*The canonical product direction, produced by the [wayfinder map #3](https://github.com/alp82/aistack/issues/3) (closed 2026-07-22). Every bet links back to the ticket that decided it. Future execution maps amend this doc.*

## USP

> **See what real builders use every day, and what they spend on it.**

Why us:

> **You get the full picture: what they run, what they pay, and how they put it together.**

Decided in [#11](https://github.com/alp82/aistack/issues/11). The live hero carries this promise, and the subline's rewrite to measured-from-real-usage shipped with auto-sync ([#47](https://github.com/alp82/aistack/issues/47), 2026-07-30).

## Identity: one position, three faces

Decided in [#7](https://github.com/alp82/aistack/issues/7). Spine: *real builders' real, **measured**, working AI setups.* Primary audience: the **builder/creator**.

1. **Measured artifact provenance leads the spoken USP** — auto-captured tools, skills, costs, and session usage: "what people measurably run, not what they claim." The moat single-author editorial (aicoolies) and anonymous atom directories (skills.sh) structurally can't fake.
2. **The living person-centric stack page is the surface people live on** — moving real-time stats kill the no-reason-to-return problem and deliver direct value to the creator.
3. **Learning-hub underneath as the return flywheel** — aggregate spend/usage derived from the creator graph, plus a curated whole-AI-world weekly digest as top-of-funnel distribution. Distribution, not part of the USP.

Consultant marketplace: **parked** (P3), as a measured "available for hire" affordance — parked, not rejected.

### Auto-sync (the core mechanism)

The evidence engine behind face 1, decided in [#8](https://github.com/alp82/aistack/issues/8) and [#13](https://github.com/alp82/aistack/issues/13): a **Claude-Code-first Skill** that analyzes transcripts **locally**, computes usage-share + recency + cost **deterministically** (measured, not claimed; an LLM only drafts qualitative what-for notes), and sends **only user-approved derived aggregates** through an explicit local approve-gate into an editable web draft. Capture-not-carry: the old CLI's config-carry job is retired. Atomic unit: the `(user, tool)` pair; the stack is a derived rollup. Pluggable per-agent adapter seam; Claude Code is the beachhead.

Channel mix, decided 2026-07-31 in [#56](https://github.com/alp82/aistack/issues/56): the terminal command `npx @use-aistack/cli sync` is the primary surface. The in-session MCP+Skill flow is an opt-in convenience, offered once after a successful sync and installed via `aistack connect claude`. Auto-sync (the fast-follow) is silent background re-sync under one standing, revocable opt-in — no session greetings, no per-send dialogs; frequency is configurable, **default once per day** (amended 2026-08-01 at the [map #60](https://github.com/alp82/aistack/issues/60) charting; [#56](https://github.com/alp82/aistack/issues/56) sketched weekly). Fail-closed name filtering is what makes the unattended repeat sync safe: it can only refresh data the user already approved.

## Roadmap

### P0 — the USP gate (strictly sequenced)

1. **Profile-first decoupling migration** ([#16](https://github.com/alp82/aistack/issues/16)) — **SHIPPED 2026-07-24** ([map #20](https://github.com/alp82/aistack/issues/20)). Decouple the person (profile) from the stack (an artifact on the profile), N stacks per profile. Fixes the live identity confusions (self-promo "stacks", stack image/name doubling as profile image/name). **Must land before auto-sync** — capture keys to a stack, and decoupling afterwards would force a second migration of captured data.
2. **Auto-sync** ([#8](https://github.com/alp82/aistack/issues/8), [#13](https://github.com/alp82/aistack/issues/13)) — **SHIPPED 2026-07-30** ([map #29](https://github.com/alp82/aistack/issues/29)): living stacks 1/1 on prod after the first real sync ([#53](https://github.com/alp82/aistack/issues/53)). The Skill above. P0 capture set: inventory + usage-share + recency + cost + one-line authored what-for. Skills/MCP invocation counts are the first extension after.

P0 is deliberately two items, and both have shipped. The channel-mix thread (#54/#55/#56) resolved terminal-first and [map #29](https://github.com/alp82/aistack/issues/29) is closed; its follow-up ledger stays the canonical hand-off list. The sync follow-ups (background re-sync, credential hardening, Codex as the second harness, two external-user live tests) are charted as [map #60](https://github.com/alp82/aistack/issues/60) and run **before** P1.

### P1 — one map, after map #60

Reordered 2026-08-01 at the [map #60](https://github.com/alp82/aistack/issues/60) charting: the weekly digest moved to P2 (not ready), and the remaining four items fold into **one map**, charted after map #60 ships. It also takes the minimal event instrumentation ([#5](https://github.com/alp82/aistack/issues/5)).

1. **Owner-private view analytics** ([#14](https://github.com/alp82/aistack/issues/14)) — rides the profile-first migration as a profile-level surface. Private creator dashboard of own page/stack views — motivates publishing and sharing; not a public number.
2. **Live stack-page stats** ([#15](https://github.com/alp82/aistack/issues/15)) — auto-sync-gated. The living-page payoff: the moment capture ships, pages visibly move.
3. **Aggregate spend/usage surface** ([#15](https://github.com/alp82/aistack/issues/15)) — auto-sync-gated. Cross-creator spend/usage charts; absorbs the aggregate inventory chart (build the shell early, launch when usage-share + cost make it non-sparse) and ships public + linkable + structured-data-ready as the citable source.
4. **Follow + activity feed** ([#14](https://github.com/alp82/aistack/issues/14)) — auto-sync-gated *and* needs churn data accumulated over time, so structurally last despite being the strongest return trigger. Per-person "what builders are adopting/dropping this week"; carries basic creator contactability.

### P2 — demand-driven, unordered

- **Weekly digest** ([#17](https://github.com/alp82/aistack/issues/17)) — moved from P1 head on 2026-08-01 (not ready yet). Auto-sync-independent, so it can start any time demand justifies it. The only bet that manufactures *new* audience. Semi-automatic pipeline (owner sources → cron collector → bits inbox → compose UI); every issue a public on-site archive page (linkable, freshness/AEO signal) with email as push.
- **Per-tool what-for** ([#16](https://github.com/alp82/aistack/issues/16)) — field already ships; auto-sync drafts into it.
- **Projects** ([#16](https://github.com/alp82/aistack/issues/16)) — the stale-resistant *authored* credibility anchor; the human counterweight to the measured face.
- **Threaded comments** ([#18](https://github.com/alp82/aistack/issues/18)) — after profile-first and follow+feed, so threads attach to final entity shapes and reuse notification plumbing.
- **Discord bot** ([#18](https://github.com/alp82/aistack/issues/18)) — distribution, not discussion: `/aistack` slash command posts a stack-card embed in any server. After profile-first.
- **Programmatic price-comparison pages** ([#17](https://github.com/alp82/aistack/issues/17)) — auto-sync-gated: "listed price vs what builders actually pay."
- **Skills provenance surface** ([#17](https://github.com/alp82/aistack/issues/17)) — gated on the skills/MCP invocation-count extension: resources enriched with used-by-N / invoked-X.
- **Profile integrations** ([#19](https://github.com/alp82/aistack/issues/19)) — cursor and further harnesses via the adapter seam; external sources (openusage, vendor dashboards) after auto-sync's own cost extraction shows its gaps. **Codex pulled forward** into [map #60](https://github.com/alp82/aistack/issues/60) on 2026-08-01 as the seam-proving second harness.

### P3 — parked, not rejected

- Stack categories ([#16](https://github.com/alp82/aistack/issues/16))
- Messaging / expert-connect ([#18](https://github.com/alp82/aistack/issues/18), [#19](https://github.com/alp82/aistack/issues/19))
- One-way Discord webhooks ([#18](https://github.com/alp82/aistack/issues/18))
- Monetization model ([#19](https://github.com/alp82/aistack/issues/19)) — only price-honesty-compatible variants when traffic exists: labeled passive affiliate links, or a user-pays pro tier
- Consultant "available for hire" badge ([#19](https://github.com/alp82/aistack/issues/19)) — credible only after auto-sync proves the setup
- Stack-export off-ramp ([#19](https://github.com/alp82/aistack/issues/19)) — the USP is measured usage, which doesn't export; prefer linking to rulesync-style tools

## Success signals

**North star: living stacks — stacks auto-synced within the last 7 days.** The USP made measurable; countable straight from Convex once auto-sync lands. Every bet either creates living stacks (P0), makes them visible (live stats, aggregate surface), or turns them into return visits (digest, feed).

| Bet | Signal |
|---|---|
| Profile-first migration | none — prerequisite, done-or-not |
| Auto-sync | first approve-and-sends (**first: 2026-07-30**); **repeat sync in a later week** (the direct staleness-treadmill test, still open) |
| Weekly digest | new signups attributable to digest issues |
| View analytics | creators who view their dashboard, then edit/share |
| Live stack-page stats | creator return visits to their own stack page |
| Aggregate spend/usage surface | external referrals/citations to the spend page |
| Follow + activity feed | feed-driven return sessions |

P2/P3 bets define their signal when promoted — no upfront fake precision. Signals ride the ~6-event instrumentation handed to the execution map (today: PostHog autocapture + Convex DB only).

## Non-goals

**Standing constraints** — permanent; violating one breaks the USP:

1. **Never sell placement or ranking.** Sponsored money never affects what surfaces where. ([#19](https://github.com/alp82/aistack/issues/19))
2. **Raw data never leaves the machine.** Transcripts, prompts, paths, repo names stay local; only user-approved derived aggregates are sent. ([#8](https://github.com/alp82/aistack/issues/8), [#13](https://github.com/alp82/aistack/issues/13))

**Scope non-goals** — this roadmap won't do these; a future map could revisit:

3. Editorial comparison content at volume — no 553-page fight with aicoolies; hand-written tables ride the staleness treadmill. ([#17](https://github.com/alp82/aistack/issues/17))
4. Two-way Discord sync — superseded by native comments. ([#18](https://github.com/alp82/aistack/issues/18))
5. Reddit as a built surface — stays a manual channel. ([#18](https://github.com/alp82/aistack/issues/18))
6. CLI config-carry as a product — retired; dotfiles/git own that job. ([#8](https://github.com/alp82/aistack/issues/8))

Absence from this list is not endorsement, and P3 parking is not rejection: consultant marketplace and monetization are parked, not non-goals.

## Execution-map hand-offs

Parked work the follow-up *execution* map inherits:

- **Minimal event instrumentation** — ~6 custom events + per-stack view counters (from the [analytics ticket #5](https://github.com/alp82/aistack/issues/5)).
- **aicoolies counter-moves, remainder** — tool↔stack↔person cross-link surfaces ("N stacks use this" + avatars); llms.txt + Graveyard-style freshness/AEO signals (from [#9](https://github.com/alp82/aistack/issues/9)). The third counter-move (aggregate spend page) graduated into P1.
- **Hero subline swap** — DONE 2026-07-30 ([#47](https://github.com/alp82/aistack/issues/47)).
- **Auto-sync build details** deferred by [#13](https://github.com/alp82/aistack/issues/13) — mostly closed by [map #29](https://github.com/alp82/aistack/issues/29): wire format ([#33](https://github.com/alp82/aistack/issues/33)), review UI (the reconcile page, [#43](https://github.com/alp82/aistack/issues/43)). Background auto-resync (reshaped by [#56](https://github.com/alp82/aistack/issues/56) — silent, no session prompts, daily default) and the adapter interface shape are now charted in [map #60](https://github.com/alp82/aistack/issues/60). Still open: zero-install web upload (undecided).
