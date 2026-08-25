# Measured workflow surface spec

Decided on [#166](https://github.com/alp82/aistack/issues/166), part of
[map #159](https://github.com/alp82/aistack/issues/159). Extraction facts come from
[docs/research/deterministic-workflow-extractability-2026-08.md](../research/deterministic-workflow-extractability-2026-08.md)
([#165](https://github.com/alp82/aistack/issues/165)). The surface itself was settled by
five merged prototypes: [#164](https://github.com/alp82/aistack/issues/164),
[#175](https://github.com/alp82/aistack/issues/175),
[#186](https://github.com/alp82/aistack/issues/186),
[#191](https://github.com/alp82/aistack/issues/191),
[#193](https://github.com/alp82/aistack/issues/193). Terms are defined in
[CONTEXT.md](../../CONTEXT.md). Written 2026-08-22.

## Verdict

**Build.** Every prototype landed, the extraction research proves the deterministic
core, and only execution remains. A follow-up build map owns it, charted through
[Task: chart the next maps](https://github.com/alp82/aistack/issues/169).

## The product

A measured Workflow section on the stack page. It shows how the person works: the
metrics, the components, and the phase playbook, every number computed by a fixed
local rule. The surface uses no LLM anywhere, so every fact and every sentence is
deterministic. Raw transcripts never leave the machine.

## The section

The composition is the podium ([#191](https://github.com/alp82/aistack/issues/191),
`prototypes/workflow-composition/index.html`):

- The section opens with a deterministic template lead: fixed sentence forms over
  measured numbers, versioned as `lead-templates/v1`. An absent measurement drops its
  sentence. The forms hold on real data
  ([#196](https://github.com/alp82/aistack/issues/196)), and the wording is locked in
  [#220](https://github.com/alp82/aistack/issues/220). See "The template lead" for the
  forms. Start hours are stored in UTC and rendered in the OWNER's local time, labeled
  as such. The reader's own clock would show a stranger's habit at the wrong hour and
  describe nobody.
- One fit-ranked row set: nine pool metrics and seven components, sixteen rows.
- The top three rows by fit render as one horizontal band. A tap extends a box below
  the band.
- Thin rows follow in fit order. Rows under fit 0.40 wait behind one expander row.
- The owner can pin or hide any row, and that override wins over both thresholds.
- A row ships when its measurement exists. A missing measurement stays absent, so no
  separate first-ship list exists.

The seven components ([#175](https://github.com/alp82/aistack/issues/175)): the phase
playbook, model routing (main loop against subagents), the kit (skills and MCP
servers), delegation (fan-out record, session record, main-to-subagent ratio), the Git
Ledger (removals in red, per-commit sizes as a log-scale dot strip), coding languages
(changed lines by file type), and the week/time heatmap with per-cell popups.

On the stack page the section is titled Workflow under `// measured`, position 04 in
the settled order: Actual Usage 01, Projects 02, Tools 03, Workflow 04, Guide 05
([#193](https://github.com/alp82/aistack/issues/193)).

## Fit and rotation

Fit is coverage times surprise ([#175](https://github.com/alp82/aistack/issues/175)).
Coverage is the share of synced harnesses the metric counts, and a Git metric counts
them all. Surprise is the distance from the typical band that the versioned metric rule
declares. Ties break on movement against the prior window. A fact a fixed block or
another section shows is excluded from the slots.

Fit recomputes at every sync. A challenger takes a highlight slot only with a fit win
of 25% or more. At most one slot swaps per sync day. An incumbent leaves at once when
the owner removes it, when its coverage drops, or when its signal goes stale.

Fit splits between the machine and the server. The CLI ships value, coverage, band,
and rule id per row, and stays the only source of measured values. The server computes
fit, applies the rotation limit, and applies the owner pins and hides, because the
swap history and the owner overrides are server state.

## Phases

The public phase set is **scout, build, verify, handoff**, plus a visible unknown
(round 3). The anatomy prototype used orient and gate for the first and last phase,
and this spec renames them. Scout is reading and searching before the change. Handoff
is the exchange at a blocking human gate.

Versioned rule sets classify recorded tool events, first match wins
([#186](https://github.com/alp82/aistack/issues/186)). Each event owns the gap to the
next event, capped at 5 minutes. The wait at a blocking handoff call renders as a
striped waiting slice behind a toggle. A rule-set bump reclassifies old sessions from
local raw records at the next sync. A session whose raw records are gone keeps its old
aggregate, and the page shows a mixed-version tag.

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

The public phase surface is the playbook: two measured shipping tracks with median
figures, plus receipt cards that pair a habit with its measured payoff. The unknown
bucket never hides: it prints as small print under the lead, with the rule id.

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

## The template lead

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
  first share. The window is the payload's own rolling 30 days, named in the scope
  line, and the count covers every synced harness including one held back by the
  playbook gate.
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
proxy metrics, and every classifier publishes its version with its result. A metric
that only some harnesses record carries a coverage tag. A proxy metric names its rule.
Unsupported facts stay absent.

Harness reach per the research: Claude Code and opencode record skills, agents, and
MCP. Codex records tools and MCP only. Pi records tools and a session tree only.

Local Git history is a source and makes commit and line facts exact
([#174](https://github.com/alp82/aistack/issues/174)). The CLI reads Git history only
for working directories that windowed sessions touched. Repository names stay local
under the name filter. Only aggregate counts and line totals ship.

## The wire

One new closed workflow section on the existing sync body. Every field is additive and
optional, so old clients keep working and publish no workflow section. Each metric
carries its rule id and rule version. The name filter and the staged approval apply to
every new field.

Consent is one `publishWorkflow` opt-out bit that mirrors `publishCost` field for
field: default on, applied client-side. Off means the workflow section is absent from
the payload, so nothing exists to reveal server-side. The gate names the switch before
the first upload.

The four pending wire-bump items from the map #121 fog ride this same wire change:
`cliVersion`, the cacheWrite split, absolute tool counts, and `ResourceInput.scope`.
The CLI collects and ships them from the start, and no UI shows them yet. New stat
components pick them up later (rounds 2 and 3).

## The gate, and no LLM

The existing staged-bytes gate extends to the workflow section: the staged `bodyJson`
is what a publish transmits, and the gate summary derives from those exact bytes.
Auto-sync ships the workflow section under the same standing permissions as the rest
of the payload.

**The surface ships without an LLM.** It keeps only data a fixed rule can compute,
because an AI step at the sync would scare people off the sync (round 2). Nothing to
draft means nothing to edit: the owner controls on the web are pin and hide per row.
Owner prose lives in the Guide section.
[ADR-0002](../adr/0002-no-llm-in-the-workflow-surface.md) records the rule and
supersedes ADR-0001.

## Out of v1

- The owner mirror, the local coaching view from the anatomy prototype, parks for a
  later map (round 3).
- The stat components for the four wire-bump items. The data ships, the display waits.

## Hand-off

The build map rides [Task: chart the next maps](https://github.com/alp82/aistack/issues/169).
