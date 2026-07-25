# Send-channel spike — observed results

Fill this in while running `README.md`. It becomes the resolution comment on
[Task: spike the two send channels head to head, and pick one](https://github.com/alp82/aistack/issues/35).

**Claude Code version:** _(claude --version)_
**Date:**
**Terminal:**

Every "prompt appeared" question takes one of **three** values: **yes / no / void**. Use
**void** whenever the round's precondition failed — a void is a re-run, a "no" is a finding
about Claude Code. Recording a void as a "no" is the single way this spike produces a
confidently wrong answer.

## Preconditions

- `node mcp/summary.mjs` run before Round 1 (fixture regenerated): **yes / no**
- `/mcp` shows `aistackspike` **connected** with **3 tools**: **yes / no**
  → if no, Rounds 1 and 3 are **void**; do not fill them in.
- `claude mcp list` printed the absolute server path with no `Missing environment variables`
  warning: **yes / no**

---

## Round 1 — candidate A (MCP + `requiresUserInteraction`), `bypassPermissions`

### 1A — body text in tool `description`

- Prompt appeared: **yes / no / void**
- Markers visible: `SPIKE-MARKER-TITLE` □ · `SPIKE-MARKER-ANNOTATION-TITLE` □ · `SPIKE-MARKER-SUMMARY-END` □
- Summary rendered in full / truncated at (quote the last line you could read):
- "Don't ask again" offered: **yes / no**
- Dialog height (approx lines):
- `!! TOOL EXECUTED: publish_desc` in `spike-mcp.log`: **yes / no**
- Notes:

### 1B — body text in tool *input*

- Prompt appeared: **yes / no / void**
- Markers visible: `SPIKE-MARKER-SUMMARY-END` □
- Input rendered as: pretty-printed JSON / raw JSON / summarized / not shown
- Truncated at (quote the last line you could read):
- "Don't ask again" offered: **yes / no**
- `!! TOOL EXECUTED: publish_input` in `spike-mcp.log`: **yes / no**
- Notes:

1A and 1B carry byte-identical body text, so the two truncation points are directly
comparable. If they are not identical, precondition 1 was skipped → both are **void**.

### 1C — control, no `_meta` marker

- Prompt appeared: **yes / no / void** _(expected: no)_
- `!! TOOL EXECUTED: publish_ungated` in `spike-mcp.log`: **yes / no**
- Notes:

`publish_ungated` differs from `publish_desc` only in `name` and the absent `_meta`. A prompt
here means the marker is **not** what produces the dialog and the whole Round 1 reading shifts.

**Answer to question 2 — can the consent dialog carry our own body text?**

> _(description / input / neither / both; and whether one beat suffices or a separate
> review surface is needed before the call)_

**Where does the approved text come from, for the variant that won?**

> _(1A: the server derives the description from the payload it holds. 1B: the model supplies
> `humanSummary` and `payload` as two independent arguments and the server never derives one
> from the other — so what the user approves is model-authored text, not the bytes that go
> out. The real aggregate is computed from transcripts containing web fetches, file contents
> and tool output, i.e. attacker-reachable text, so 1B's shape permits a benign summary
> alongside a different payload. If 1B wins on rendering, record it, but the shipped design
> must still compute the summary server-side from the bytes it will send.)_

---

## Round 2 — candidate B (CLI via Bash), same session

Each binary was run in its own separate Bash call: **yes / no**
_(if no, 2A and 2B are both **void** — one command line satisfies both gates at once.)_

### 2A — explicit `ask` rule — also the proof `.claude/settings.json` loaded

- Prompt appeared: **yes / no / void**
- Verbatim `cmd=` line from `spike-hook.log` for this turn:
- That command starts with one of the rules in `.claude/settings.json`
  (`./bin/publish-ruleask`, `bin/publish-ruleask`, absolute path): **yes / no**
  → if **no**, this is a rule miss, not a bypass: mark 2A **void**.
- What the dialog showed:
- "Don't ask again" offered: **yes / no**

→ **If 2A did not prompt, stop and do not fill in 2B.** A silent 2A cannot be told apart from
a settings file that was never read.

### 2B — `PreToolUse` hook returning `ask` ← load-bearing

- Prompt appeared: **yes / no / void**
- If no: denied / silently allowed / hook not fired at all
- Verbatim `cmd=` line from `spike-hook.log` for this turn:
- `-> returning permissionDecision:"ask"` present in `spike-hook.log`: **yes / no**
  → if **no**, the hook never reached its decision; this is not an answer to question 1.
- `SPIKE-MARKER-HOOK-REASON` visible in the dialog: **yes / no** — truncated at:
- reported `permission_mode` in `spike-hook.log`:
- `spike-cli.log` shows `!! CLI EXECUTED`: **yes / no**

### 2C — control, ungated

- Prompt appeared: **yes / no** _(expected: no)_
- `!! CLI EXECUTED`: **yes / no**

### 2D — non-canonical spellings of the same binaries

| invocation | gate fired? | `cmd=` as logged |
|---|---|---|
| `bash -c './bin/publish-ruleask publish'` | | |
| `$PWD/bin/publish-ruleask publish` | | |
| `bash -c './bin/publish-hookask publish'` | | |

A miss is a **finding about candidate B**: both gates match on model-authored command text,
not on the process being launched, so "gated" in 2A/2B may mean "gated against one spelling".
Carry any miss into the decision below — do not patch it with more rules.

**Answer to question 1 — does a hook-returned `ask` prompt interactively under bypass?**

> _(yes / no, and what it did instead)_

---

## Round 3 — fail-closed modes

`claude mcp get aistackspike` did **not** say "Pending approval" before the headless run:
**yes / no** → if no, the headless row is **void**.

| case | expected | observed (deny / sent / **tool unavailable**) |
|---|---|---|
| `dontAsk` + 1A (MCP marker) | deny | |
| `dontAsk` + 2B (hook ask) | deny | |
| headless `-p` + bypass + 1A | deny | |

"Tool unavailable" — the model reports no such tool, or `spike-mcp.log` gained no frames for
that run — is a **void**, not a fail-closed pass. Project-scoped `.mcp.json` servers do not
auto-connect until they have been trusted interactively.

---

## Round 4 — `async: true` Stop hook

- Wall-clock time you quit the session:
- `session=` id of the block you are reading:
- `started` line present for that session: **yes / no** _(if `session=unknown`: **void**)_
- Last `tick` offset logged for that session:
- `completed` line for that session: **yes / no**

Reading:

- `completed` → async hooks **outlive** the session.
- ticks continue past your quit time then stop, no `completed` → survived teardown, killed
  later; note the last offset.
- ticks stop at your quit time, no `completed` → **killed at teardown**.
- `session=unknown` → **void**, hook input never arrived.

- Verdict:
- Notes:

---

## Decision

**Channel picked:** _(A — local stdio MCP · B — bundled CLI via Bash)_

**Why:**

**What it costs:** _(node runtime in the plugin? version floor? gate lives in user config?
gate keyed on command text rather than on the process — see 2D?)_

**What it changes downstream:** _(effect on [#41](https://github.com/alp82/aistack/issues/41)
— one-beat gate vs. separate review surface — and on
[#36](https://github.com/alp82/aistack/issues/36))_

**Constraint carried into the build regardless of channel:** the summary the user approves
must be derived server-side from the exact bytes that will be sent, never accepted as a
caller-supplied argument alongside them.
