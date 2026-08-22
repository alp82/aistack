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
  measured numbers, versioned with the rules. An absent measurement drops its
  sentence. The phase-extraction prototype proves the form on real data.
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
([#186](https://github.com/alp82/aistack/issues/186)). `phase-rules/v1` reads tool
identity markers. `phase-rules/v2` adds fixed command-head rules, and it adds the
forge stage markers as named rules where the harness records them, for example a
`forge` or `crossfire` skill call (round 3). Each event owns the gap to the next
event, capped at 5 minutes. The wait at a blocking handoff call renders as a striped
waiting slice behind a toggle. A rule-set bump reclassifies old sessions from local
raw records at the next sync. A session whose raw records are gone keeps its old
aggregate, and the page shows a mixed-version tag.

Verify keeps the purple chart slot from the anatomy prototype. It is a validated
palette slot, and a green verify would read as a pass mark the data does not claim.

The public phase surface is the playbook: two measured shipping tracks with median
figures, plus receipt cards that pair a habit with its measured payoff. The unknown
bucket never hides. The derivation prints as small print: phase definitions, the
unknown share, the two toggles.

**Proof on real data rides a new prototype.** Before the build starts, a prototype
extracts the phases from real chat histories with the versioned rules alone, no LLM.
A failed proof revises this section, per the map's prototype rule.

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
