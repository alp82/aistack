# Measured workflow and Stats surface spec

The current web contract is [Lock the Stats cut list and build spec](https://github.com/alp82/aistack/issues/466#issuecomment-5747486474),
shipped through [Map: Stats section redesign](https://github.com/alp82/aistack/issues/462).
It supersedes the earlier podium and tabbed Actual Usage presentations. Terms live in
[CONTEXT.md](../../CONTEXT.md); aggregation boundaries live in
[ADR-0009](../adr/0009-a-workflow-reading-is-one-machines.md). Updated 2026-09-20.

## The product

Stats shows measured AI tool usage on the public stack page. It remains the Actual
Usage section in `src/features/usage`, with the existing measured anchor. Each block
answers one question with near-zero prose. Fixed local rules produce the measurements;
no LLM writes readings, and raw transcripts stay on the machine.

## Layout and detail

Desktop is flat and always visible, with no tabs, accordion, group labels or axis.
The block order is fixed; neither fit nor a reader control ranks it. Side-by-side
pairs are layout only. A block must make sense before its detail layer is opened.

| Order | Block | Desktop | Phone |
| --- | --- | --- | --- |
| 1 | Token/cost headline | Token history and cost with pricing coverage and sources | Compact in/out/cached header; cost row opens pricing sources |
| 2 | Tiles | Active days, sessions, cache hits, run by subagents, median session | Compact boxed grid, no empty placeholder |
| 3 | Models | Existing colored full-width bars and previous-period notches; half-height subagent routing beneath | Four initial models; separate controls for remaining models and routing |
| 4 | Harnesses and Context per call | Harness pie with previous-period ring beside visible context waffles | Compact harness strip and visible waffles |
| 5 | Skills | Call-share plates | Chips |
| 6 | MCP servers | Call-share plates | Chips |
| 7 | Subagent types | Count columns | Count chips |
| 8 | The week | Activity heatmap with session-start marginal | Weekday/hour activity marginals and an hourly heatmap disclosure |
| 9 | Lines changed | Additions/removals over dated readings | Short mirrored bars |
| 10 | Where the time goes and Languages | Phase strip with shorter/longer tracks on hover; thin language strip | Compact phase and language strips, no phase-track disclosure |

Missing measurements disappear. Harnesses needs more than one measured harness; a
single-harness stack can still show Context. Empty inventory categories and categories
with no permitted names render no block. Missing Git dates leave gaps, not fabricated
zero readings. A stack without measurements gets the existing owner or visitor empty
state. A legacy whole-window reading remains approximate and has no previous comparison.

Desktop detail uses hover. Phone disclosures are independent and remain usable at
320px and 390px. Context stays visible on both. Desktop phase detail requires eligible
shorter/longer tracks; the compact phase mix can exist without them. All charts come
from `src/features/charts`, server-render SVG marks, use square geometry and follow the
validated palette rules in AGENTS.md.

The section order remains Actual Usage, Projects, Tools, Guide. Only rendered sections
receive a position number; the navigation keeps the usage token headline.

## Window and automatic scope

`measured.getUsageByStackSlug` supplies fixed `30d` usage and
`workflow.getStatsByStackSlug` supplies the web workflow projection. The route prefetches
both for initial rendering. An explicit null live query replaces its loader snapshot.
There is no window selector, machine selector, machine name or partial-coverage label.

Current dates are today minus 29 through today UTC. Previous dates are today minus 59
through today minus 30. Existing 7d/24h APIs and other consumers remain unchanged.
Inventory remains window-free.

Usage totals combine machines. Web routing, context, activity, session starts, phase
time and median-session histograms combine session atoms across machines before
shares or medians are derived. Never average stored shares or medians. Context reuses
the context-only fold and deterministic logged-window evidence ordering used by Discord.
Activity and session starts share the newest available current-window published UTC
offset, with stable ties. The UI labels local time when known and UTC otherwise.
Activity cells count events; the session-start marginal counts starts.

Git remains a single-source reading. Select the newest published eligible machine with
current-window commit or changed-line evidence, with deterministic machine/date/row ties.
Both Lines changed and Languages fold that machine's days. A source without Git evidence
cannot displace it. No source means no Git reading. These blocks do not claim exact
all-machine totals: the wire has no commit identities for cross-machine deduplication.

Inventory uses the latest reading per machine/harness, retaining the legacy untagged
source eviction. Combine absolute call counts and category denominators, including
withheld contributions, before computing percentages. Share-only older readings retain
permitted names and known count subtotals, but incomplete numerators or denominators
produce no combined percentage. Known subtotals carry a lower-bound sign. A zero
denominator also has no percentage. Withheld name counts are source-local counts and
claim no globally unique total. Withheld names never enter the public projection.

## Tiles and comparisons

The five candidates are active days, sessions, cache hits, run by subagents and median
session. A missing reading leaves no placeholder. Existing first-four-tile comparisons,
model notches, harness comparisons and per-harness session counts remain available.
No prior reading means no comparison, not an invented zero baseline.

The median-session tile prints the histogram bucket range, for example `16-32 min`,
for measured time excluding waiting and idle. It needs at least 20 measured sessions
and preserves upstream phase measurement gates. It does not require five sessions on
each side of the shorter/longer track split. Current and previous ranges use the same
all-machine evidence policy. Print an available previous range rather than a percentage
change derived from a midpoint or bucket edge.

## Consent and cut list

`publishWorkflow` gates CLI extraction and the Stats query, including already stored
evidence. `publishCost` independently gates dollars. Cost retains its lower-bound
presentation, covered token share and price-table sources. Stored numbers imply no
consent. Published-name filters and withheld denominators remain in effect.

Remove from both the default page and its details: thinking share, late-night commits,
turn length, parallel projects, project workspaces, web searches per day, effort levels,
lines-per-commit dots and subagent fan-out records. Thinking/output counters mix provider
semantics and cannot yield one accurate thinking percentage. Session start hour survives
only in the heatmap marginal; there is no separate histogram or duplicate Models tab.

The former scan rows, podium, template prose, receipt cards and per-row owner controls
are absent from Stats. The old tab/accordion/topic/grid presentation is removed.
Shared rules, server workflow rows, schemas and stored atoms survive for other consumers.
The retained phase projection still depends on the lead's phase-share derivation.

## Retained measurement rules and history

The remaining sections document extraction rules and earlier projections that continue
to inform server consumers. Historical presentation descriptions do not override the
current Stats contract above.

## Retained fit calculation

Fit is coverage times surprise ([#175](https://github.com/alp82/aistack/issues/175)).
Coverage is the share of synced harnesses the metric counts, and a Git metric counts
them all. Surprise is the distance from the typical band that the versioned rule
declares.

**Fit stays in the API as a number nothing ranks by**
([#277](https://github.com/alp82/aistack/issues/277)). The rotation limit, the
challenger margin, the fit line and the swap-per-day rule are gone
([#285](https://github.com/alp82/aistack/issues/285)): the order on the page is fixed,
and there is no server state beside the days (pins and hides were dropped in #303).

Every row is computed on the server, over the folded window. The CLI ships atoms and no
values (see "The wire"), so a rule change is a server deploy and needs no re-sync.

## Phase extraction and retained playbook

The public phase set is **scout, build, verify, handoff**, plus a visible unknown
(round 3). The anatomy prototype used orient and gate for the first and last phase,
and this spec renames them. Scout is reading and searching before the change. Handoff
is the exchange at a blocking human gate.

Versioned rule sets classify recorded tool events, first match wins
([#186](https://github.com/alp82/aistack/issues/186)). Each event owns the gap to the
next event, capped at 5 minutes. The wait at a blocking handoff call is excluded from
measured session time. The original anatomy prototype displayed waiting separately;
Stats has no waiting toggle. A rule-set bump reclassifies old sessions from
local raw records at the next sync. A session whose raw records are gone keeps its old
aggregate, and its recorded rule version remains available to consumers.

**The shipping rule set is `phase-rules/v1`**, and it is the set the extraction proof
arrived at, not the one this spec first described
([#196](https://github.com/alp82/aistack/issues/196)). The two earlier drafts, marker
rules alone and marker rules plus guessed command heads, both failed on real history:
72% and 49% of measured time unknown, and verify at 0% across 464 sessions. The
version counter starts at v1 with the corrected rules, because no stored aggregate
carries a rule tag yet and a bump should mean a real change. `phase-rules/v1` holds
five rule families:

1. **Tool identity markers.** Read and search tools are scout, edit tools are build,
   review skills are verify, and a blocking ask is handoff. The forge stage markers
   ride here as named rules where the harness records the skill call, matched on the
   last segment so the plugin-namespaced spelling `forge:crossfire` counts too. Forge
   is build and crossfire is verify.
2. **Chain-segment command rules.** 85% of recorded shell commands hold a chain or a
   pipe, so a whole-string prefix match reads only the first command and misses the
   rest. A command splits on `&&`, `||`, `;`, and `|`; each segment classifies on its
   own; the strongest phase in the chain wins, ordered verify, handoff, build, scout.
   Leading environment assignments, a bare `cd`, and a `git -C <path>` prefix
   normalize away before matching.
3. **Measured head lists.** Every head comes from real history rather than from a
   guess. The first draft listed `pnpm test` and `vitest`, which appear 12 times in
   the owner's history, and missed `npx vitest`, `node --test`, `npx tsc`, `npx biome`
   and `npm test`, which appear over 700 times between them. That single mistake is
   what put verify at zero.
4. **Flag-aware rules for dual-use commands.** A head alone files these wrong.
   2,374 of 2,733 `sed` calls are `sed -n`, a read, and only 199 of 7,758 `echo` calls
   redirect to a file. `sed`, `echo`, `printf`, and `cat` classify on the flag: in
   place or redirected is build, everything else is scout.
5. **Plan bookkeeping inherits.** A todo or task tool carries no information about the
   work, so it takes the phase of the event before it rather than a fixed phase of its
   own.

**A harness ships the playbook only when the rules leave 20% or less of its measured
time unknown.** The gate is per harness, so one unreadable harness holds back its own
playbook and not the rest of the section. On the owner's history Claude Code sits at
6% and Codex at 11%, and opencode at 28% is held back, because most of its recorded
events are calls into an MCP browser server that no fixed head list can enumerate.

**Handoff markers are per adapter, not one global list.** Claude Code records
`AskUserQuestion` and `ExitPlanMode`, Codex records `request_user_input`, and opencode
records `question`. Each adapter names its own.

Verify keeps the purple chart slot from the anatomy prototype. It is a validated
palette slot, and a green verify would read as a pass mark the data does not claim.

The retained playbook calculation produces two measured shipping tracks and receipt
cards. Stats renders the phase mix with a visible unknown segment and exposes eligible
tracks only as desktop hover detail. Receipt cards and the prose lead are historical
presentation, not part of Stats.

**The tracks split on the median measured session** (`playbook-rules/v1`, built in
[#215](https://github.com/alp82/aistack/issues/215)). Nothing on the wire records what a
session was for, so "quick fix" and "feature work" would be labels no rule computed, and
the two tracks are named the shorter sessions and the longer ones. The playbook withholds
itself below 20 sessions, the same floor the lead carries, and when the split leaves one
track under five sessions. **A receipt card's head names both sides and claims no
direction**: which side is larger is the reading's answer, and a card ships only when both
sides clear the same five-session floor.

**The proof ran** ([#196](https://github.com/alp82/aistack/issues/196),
`prototypes/phase-extraction/`). Across 464 real sessions on three harnesses,
`phase-rules/v1` leaves **7% of measured time unknown** with no LLM anywhere. The
residual is a long tail and not one missing rule: no single family passes 2% of
measured time, and the largest are interpreter runs, MCP server calls, and subagent
dispatch. Those stay unknown on purpose, because a `python3 -c` can as easily inspect
data as rewrite a file, and guessing would cost more truth than it buys.

The unknown bucket therefore ships as a real number on the page, not as an
embarrassment to hide.

## Historical template lead

Stats does not render this prose. The retained server derivation still supplies its
phase-share projection. The selected-window and annotation rules below describe the
earlier workflow surface only.

Locked in [#220](https://github.com/alp82/aistack/issues/220). Five figures in four
lines, versioned as `lead-templates/v1`:

```
142 sessions · 3 harnesses · last 30 days
Most measured time in these sessions goes to scout (64%), then build (18%).

verify in 40% of sessions · handoff in 62% of sessions · most start around 23:00 local

7% of measured time unclassified · phase-rules/v1
```

**The sessions are the subject, never the person.** Every classified event is a tool
call the harness made, so scout at 64% is mostly the agent reading. A sentence with no
subject lets a reader supply one, and on a profile page they supply the person. "These
sessions" is the only subject the data supports.

The rules that produce those four lines:

- **Scope first, then the mix.** The reader learns what they are looking at before the
  first share. The window is the one the reader selected, 30 days by default, named
  in the scope line, and the count covers every synced harness including one held back
  by the playbook gate.
- **Numbers only.** No sentence names what the shape means. A takeaway is a claim no
  rule computed, and drafting one is what [ADR-0002](../adr/0002-no-llm-in-the-workflow-surface.md)
  rules out.
- **The mix names the top two phases**, using the phase names from
  [CONTEXT.md](../../CONTEXT.md) rather than plain-word glosses. Renaming in prose
  would put a second vocabulary next to a chart that uses the first.
- **A close top two gets its own form.** Within 10 points, print "Scout (34%) and build
  (33%) take similar shares of measured time." The threshold is a named constant in
  `lead-templates/v1`, so a bump can move it. Ranking a one-point gap invents a winner.
- **No comparison against a typical band.** A comparison implies a population, and prod
  has four living stacks.
- **Verify, handoff, and rhythm print as one mono stat line**, not as three more
  sentences. Three metric cells would give them the weight of the token headline.
- **The handoff figure is a session share, and the wait is dropped.** A raw event count
  has no denominator, and the median wait measures how fast the human answered, which
  is the one figure in the lead that is about the person rather than the work.
- **Two `?` markers, no more.** One on the first phase name, opening one card that
  defines all four phases; one on "measured time", which a reader would otherwise take
  for wall-clock time. Six dashed underlines in a short paragraph read as a minefield.
- **The small print holds the unknown share and the rule id, and nothing else.**

**The lead does not print below 20 sessions, and it does not print when no harness
passes the playbook gate.** A four-session stack would say "most measured time goes to
scout (67%)", which is true and meaningless. The session count in the scope line only
warns a reader who stops to do the arithmetic. When the lead is withheld, the rest of
the section still renders.

## Extraction and sources

One local event reducer per harness. The event graph stays in memory, and only
versioned aggregates leave the reducer. Explicit markers first, fixed classifiers for
proxy metrics, and every classifier publishes its version with its result. The retained
workflow rows carry source coverage and rule identifiers. Stats preserves
measurement gates and omits missing readings; it adds no partial-coverage label.

Harness reach per the research: Claude Code and opencode record skills, agents, and
MCP. Codex records tools and MCP only. Pi records tools and a session tree only.

Local Git history is a source for commit and line facts within the selected machine
([#174](https://github.com/alp82/aistack/issues/174)). The CLI reads Git history only
for working directories that windowed sessions touched. Repository names stay local
under the name filter. Only aggregate counts and line totals ship.

Two fixed rules decide which of those lines count, and both moved to v2 in
[#278](https://github.com/alp82/aistack/issues/278).

`test-files/v2` and `file-types/v2` first drop every changed line under a path a
machine owns: a dependency tree, a build output directory, a directory of captured
tool output, or a dependency lockfile. Those lines leave the reading in both halves,
because withholding keeps a line in the denominator and a line nobody wrote belongs in
neither. One accidental commit of a package store is otherwise enough to bury a whole
month of authored work: on the first real reading it carried 6.85 million of 7.46
million changed lines.

`file-types/v2` then names only an approved extension. A path with no extension is not
a coding language, so `Dockerfile`, `LICENSE` and `.gitignore` are withheld by type
while their lines stay in the denominator. The v1 rule ranked them together as
`(none)`, which read as the leading language of a TypeScript repository.

`file-types/v3` counts no line for a file over 1 MB. The CLI reads with Git's
`core.bigFileThreshold` at that size, so such a blob is binary to Git and its record
reads `-` on both sides, like an image: no line in either half. Nobody writes a
megabyte of source by hand; what reaches that size is a dump, a rotated log, or a
generated table, and diffing those was 19 of the 20 seconds one monorepo cost the
scan. The commit still counts, and a small file in the same commit still counts its
lines. The CLI also reads each repository once, however many of its worktrees the
sessions touched; the fold is unchanged, since the reducer already kept one entry per
commit hash.

## The wire

**Superseded on 2026-08-28** ([ADR-0010](../adr/0010-the-cli-ships-only-the-days-the-server-lacks.md),
[ADR-0011](../adr/0011-measured-data-is-days-plus-a-live-inventory.md)). The rules of
`workflow-aggregates/v2` below still describe the workflow block; the row it rides on
changed.

- **One measured day, two blocks.** The CLI ships `measured-days/v1`: one row per UTC
  date `{ date, usage?, workflow? }`. `usage` holds per-harness combinable atoms (sessions
  started, hashed project keys, per-model token sums with exact dollars priced at ingest,
  subagent tokens, excluded tokens). `workflow` is the `WorkflowDay` of that date. The
  server folds a range at read time; shares, active days and dollars come out of the fold.
- **Diff-only sync.** The server answers `GET /api/cli/sync-manifest` with the dates it
  holds for the machine, each with a content fingerprint, plus the retention (400 days).
  The CLI publishes only dates that are missing or whose fingerprint differs; today always
  resends. An old client sends its full window and the server accepts it by replace, so the
  backend deploys first and the CLI release follows.
- **One row per (stack, machine, date), replaced per date, never pruned server-side.**
  The 400-day figure is the CLI send window and the page read cap only.
- **Inventory is not on the day.** One `measuredInventory` row per (stack, machine,
  harness), replaced on every sync, carries the window-free sets and the last sync time.
- **Consent is two bits read at both ends.** `publishWorkflow` off: the CLI omits the
  workflow block and the server returns null for that half. `publishCost` off: the CLI
  omits dollars and the server strips them.

The original `workflow-aggregates/v2` rules ([#285](https://github.com/alp82/aistack/issues/285)):

- **A day carries counts, sums, maxes, and bucket histograms, and nothing else.** No
  share, no median, no mean. Session lengths and turn durations travel as
  `log-buckets/v1` histograms, tokens per model as sums, events per (weekday, hour) cell
  as counts, fan-out as a max. A session belongs to the UTC day it started; an event
  cell and a web search belong to the day of the event; a commit belongs to the day of
  its author time.
- **The server folds days into a window and computes every row there.** A median is a
  median over daily values (parallel projects) or over buckets (session length, turn
  duration). Bands stay in the versioned rules on the server.
- **The phase gate is a window judgment.** A harness that leaves more than 20% of its
  measured time unclassified over the sync window ships every day without its phase
  block, so no window can fold a playbook the gate refused.

## The gate, and no LLM

The existing staged-bytes gate extends to the workflow section: the staged `bodyJson`
is what a publish transmits, and the gate summary derives from those exact bytes.
Auto-sync ships the workflow section under the same standing permissions as the rest
of the payload. The Context reading ([#358](https://github.com/alp82/aistack/issues/358),
the `context` block of `workflow-aggregates/v3`) is covered by the same `publishWorkflow`
gate, since it reveals how full the owner's context runs: the CLI omits it with the rest
of the workflow block, and the read returns null for days already stored.

**The surface ships without an LLM.** It keeps only data a fixed rule can compute,
because an AI step at the sync would scare people off the sync (round 2). Nothing to
draft means nothing to edit. Owner prose lives in the Guide section.
[ADR-0002](../adr/0002-no-llm-in-the-workflow-surface.md) records the rule and
supersedes ADR-0001.

## Historical v1 scope

- The owner mirror, the local coaching view from the anatomy prototype, parks for a
  later map (round 3).
- The stat components for the four wire-bump items. The data ships, the display waits.

## Release acceptance

Verify rich and sparse deployed stacks at desktop, 390px and 320px, with no horizontal
overflow before or after phone disclosures. Check deployed readings, missing data,
consent and name withholding, cost coverage and sources, retained details, and absence
of selectors and cut metrics. Keep server aggregation tests for unequal weights,
duplicate Git histories, missing inventory counts, absent/zero prior values, consent
and unbalanced median histograms. Deployment uses GitHub Actions; no CLI release or
new extraction is required by this redesign.
