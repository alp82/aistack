# AI Stack — Direction

*The durable product direction, produced by the [wayfinder map #3](https://github.com/alp82/aistack/issues/3) (closed 2026-07-22). Every bet links back to the ticket that decided it.*

*Slimmed 2026-08-03 at the [map #76](https://github.com/alp82/aistack/issues/76) charting. **Wayfinder maps own roadmap sequencing and the hand-off ledger** — the last ticket of every map charts the next map and carries everything it inherits. This doc keeps only what outlives any single map: the USP, the identity, the standing constraints, the success signals, and the parking lot. Amend it when a durable tenet changes, not when a map reorders work.*

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

The evidence engine behind face 1, decided in [#8](https://github.com/alp82/aistack/issues/8) and [#13](https://github.com/alp82/aistack/issues/13): a terminal command that analyzes transcripts **locally**, computes usage-share + recency + cost **deterministically** (measured, not claimed; an LLM only drafts qualitative what-for notes), and sends **only user-approved derived aggregates** through an explicit local approve-gate into an editable web draft. Capture-not-carry: the old CLI's config-carry job is retired. Atomic unit: the `(user, tool)` pair; the stack is a derived rollup. A pluggable per-harness adapter seam carries Claude Code and Codex, and each harness publishes its own snapshots.

Channel mix, decided 2026-07-31 in [#56](https://github.com/alp82/aistack/issues/56): the terminal command `npx @use-aistack/cli sync` is the primary surface. The in-session MCP+Skill flow is an opt-in convenience, offered once after a successful sync and installed via `aistack connect claude`. Background re-sync is silent, under one standing revocable opt-in — no session greetings, no per-send dialogs; frequency is configurable, **default once per day**. Fail-closed name filtering is what makes the unattended repeat sync safe: it can only refresh data the user already approved.

## Where the work is

The live map is always the open issue labelled `wayfinder:map`. Shipped so far:

- **Profile-first decoupling** ([map #20](https://github.com/alp82/aistack/issues/20), 2026-07-24) — the person (profile) decoupled from the stack, N stacks per profile.
- **Auto-sync** ([map #29](https://github.com/alp82/aistack/issues/29), 2026-07-30) — first living stack on prod.
- **Sync follow-ups and Codex** ([map #60](https://github.com/alp82/aistack/issues/60), 2026-08-03) — silent background re-sync, credential and secret hardening, Codex as the second harness behind the adapter seam, two external-user live tests passed.

## Parking lot

Nothing here is scheduled. A bet leaves the parking lot when a map picks it up.

### P2 — demand-driven, unordered

- **Weekly digest** ([#17](https://github.com/alp82/aistack/issues/17)) — the only bet that manufactures *new* audience. Semi-automatic pipeline (owner sources → cron collector → bits inbox → compose UI); every issue a public on-site archive page (linkable, freshness/AEO signal) with email as push.
- **Follow + notifications** ([#14](https://github.com/alp82/aistack/issues/14)) — moved here 2026-08-03 at the [map #76](https://github.com/alp82/aistack/issues/76) charting, as one bundle: the follow graph, the "following" filter on the activity feed, and email or push on followed-person activity. The **global** activity feed does not need any of it and ships in map #76.
- **Per-tool what-for** ([#16](https://github.com/alp82/aistack/issues/16)) — field already ships; auto-sync drafts into it. Carries the LLM-drafted notes ruled out of v1 by [#34](https://github.com/alp82/aistack/issues/34).
- **Skills and MCP invocation counts** — the wire format publishes *shares* precisely to leave this headroom unspent ([#33](https://github.com/alp82/aistack/issues/33)).
- **Projects** ([#16](https://github.com/alp82/aistack/issues/16)) — the stale-resistant *authored* credibility anchor; the human counterweight to the measured face.
- **Threaded comments** ([#18](https://github.com/alp82/aistack/issues/18)) — after follow + notifications, so threads attach to final entity shapes and reuse notification plumbing.
- **Discord bot** ([#18](https://github.com/alp82/aistack/issues/18)) — distribution, not discussion: `/aistack` posts a stack-card embed in any server.
- **Programmatic price-comparison pages** ([#17](https://github.com/alp82/aistack/issues/17)) — "listed price vs what builders actually pay."
- **Skills provenance surface** ([#17](https://github.com/alp82/aistack/issues/17)) — gated on the invocation-count extension: resources enriched with used-by-N / invoked-X.
- **Profile integrations** ([#19](https://github.com/alp82/aistack/issues/19)) — cursor and further harnesses via the adapter seam; external sources (openusage, vendor dashboards) after auto-sync's own cost extraction shows its gaps.

### P3 — parked, not rejected

- Stack categories ([#16](https://github.com/alp82/aistack/issues/16))
- Messaging / expert-connect ([#18](https://github.com/alp82/aistack/issues/18), [#19](https://github.com/alp82/aistack/issues/19))
- One-way Discord webhooks ([#18](https://github.com/alp82/aistack/issues/18))
- Monetization model ([#19](https://github.com/alp82/aistack/issues/19)) — only price-honesty-compatible variants when traffic exists: labeled passive affiliate links, or a user-pays pro tier
- Consultant "available for hire" badge ([#19](https://github.com/alp82/aistack/issues/19)) — credible only after auto-sync proves the setup
- Stack-export off-ramp ([#19](https://github.com/alp82/aistack/issues/19)) — the USP is measured usage, which doesn't export; prefer linking to rulesync-style tools

## Success signals

**North star: living stacks — stacks auto-synced within the last 7 days.** The USP made measurable; countable straight from Convex. Every bet either creates living stacks, makes them visible (live stats, aggregate surface), or turns them into return visits (feed, digest).

| Bet | Signal |
|---|---|
| Auto-sync | first approve-and-sends (**first: 2026-07-30**); repeat sync in a later week — the direct staleness-treadmill test |
| Live stack-page stats | creator return visits to their own stack page |
| Aggregate spend/usage surface | external referrals/citations to the spend page |
| View analytics | creators who view their dashboard, then edit/share |
| Activity feed | feed-driven return sessions |
| Weekly digest | new signups attributable to digest issues |

Parked bets define their signal when a map picks them up — no upfront fake precision.

## Non-goals

**Standing constraints** — permanent; violating one breaks the USP:

1. **Never sell placement or ranking.** Sponsored money never affects what surfaces where. ([#19](https://github.com/alp82/aistack/issues/19))
2. **Raw data never leaves the machine.** Transcripts, prompts, paths, repo names stay local; only user-approved derived aggregates are sent. ([#8](https://github.com/alp82/aistack/issues/8), [#13](https://github.com/alp82/aistack/issues/13))
3. **Positive claims only.** No surface may say a listed thing went unused until the adapter seam covers every harness the user runs. ([#40](https://github.com/alp82/aistack/issues/40))

**Scope non-goals** — this roadmap won't do these; a future map could revisit:

4. Editorial comparison content at volume — no 553-page fight with aicoolies; hand-written tables ride the staleness treadmill. ([#17](https://github.com/alp82/aistack/issues/17))
5. Two-way Discord sync — superseded by native comments. ([#18](https://github.com/alp82/aistack/issues/18))
6. Reddit as a built surface — stays a manual channel. ([#18](https://github.com/alp82/aistack/issues/18))
7. CLI config-carry as a product — retired; dotfiles/git own that job. ([#8](https://github.com/alp82/aistack/issues/8))

Absence from this list is not endorsement, and P3 parking is not rejection: consultant marketplace and monetization are parked, not non-goals.
