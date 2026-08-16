# Send-channel spike - observed results

Fill this in while running `README.md`. It becomes the resolution comment on
[Task: spike the two send channels head to head, and pick one](https://github.com/alp82/aistack/issues/35).

**Claude Code version:** 2.1.220 _(node v24.15.0)_
**Date:** 2026-07-26
**Terminal:**

Every "prompt appeared" question takes one of **three** values: **yes / no / void**. Use
**void** whenever the round's precondition failed - a void is a re-run, a "no" is a finding
about Claude Code. Recording a void as a "no" is the single way this spike produces a
confidently wrong answer.

## Preconditions

- `node mcp/summary.mjs` run before Round 1 (fixture regenerated): **yes** - re-run
  2026-07-26, output byte-identical to the committed file, so nothing was stale.
- `/mcp` shows `aistackspike` **connected** with **3 tools**: **yes / no**
  → if no, Rounds 1 and 3 are **void**; do not fill them in.
- `claude mcp list` printed the absolute server path with no `Missing environment variables`
  warning: **yes / no**

Checked without a human on 2026-07-26 (so a null in Round 1 is attributable):

- The absolute paths in `.mcp.json` and `.claude/settings.json` still match this
  checkout - the repo has not moved.
- A direct `initialize` + `tools/list` handshake against `mcp/publish-server.mjs` returns
  the three tools, with `_meta: {"anthropic/requiresUserInteraction": true}` on
  `publish_desc` and `publish_input` and **absent** on `publish_ungated`. The server and
  the marker are therefore not the cause of any missing dialog.
- `spike-*.log` deleted, so every line in them belongs to the human run.

---

## Round 1 - candidate A (MCP + `requiresUserInteraction`), `bypassPermissions`

### 1A - body text in tool `description`

- Prompt appeared: **yes** - a real dialog, under `bypassPermissions`. Screenshot
  `shot-1a-dialog.png`.
- Markers visible: `SPIKE-MARKER-TITLE` ✗ · `SPIKE-MARKER-ANNOTATION-TITLE` ✓ ·
  `SPIKE-MARKER-SUMMARY-END` ✗
- Summary **truncated after two lines**. Last readable text:
  `Destination:  stack "alps-daily-driver" on aistack.to (bound to this machine's token)…`
  - that is source line 3 of 26, with the blank line 2 collapsed. The trailing `…` is the
  client's own ellipsis. Roughly **110 of 961 description characters survive**.
- "Don't ask again" offered: **yes** - option 2, scoped to this tool in this directory.
- Dialog height (approx lines): **~12**, of which 3 are body text.
- `!! TOOL EXECUTED: publish_desc` in `spike-mcp.log`: **yes**
- Notes: the header line reads
  `aistackspike - SPIKE-MARKER-ANNOTATION-TITLE (desc variant)(confirm: true) (MCP)`.
  Both `title` and `annotations.title` were set on this tool and **`annotations.title` is
  the one that renders** - the top-level `title` never appeared. The rendered arguments are
  the real ones (`confirm: true`), so the header is argument-bearing, not just a name.

### 1B - body text in tool *input*

- Prompt appeared: **yes**. Screenshot `shot-1b-dialog.png`.
- Markers visible: `SPIKE-MARKER-SUMMARY-END` ✓ - **nothing was truncated**.
- Input rendered as: **raw JSON on one wrapped line**, inline in the header, with `\n`
  printed as a literal escape rather than a line break. Both arguments render - the whole
  26-line `humanSummary` *and* the entire payload object, every model row, every inventory
  name, the coverage block.
- Truncated at: not truncated. The full `humanSummary` and full `payload` both appear.
- "Don't ask again" offered: **yes** - same option 2, same directory scope.
- `!! TOOL EXECUTED: publish_input` in `spike-mcp.log`: **yes**
- Notes: the dialog is **~30 lines** and dominated by unformatted JSON. The 84-character
  description renders too, on its own line under the arguments
  (`Publish the approved measured-usage aggregate. The exact bytes are in the arguments.`).
  So the description is not *replaced* by the input - the two stack, and it is the
  description alone that gets cut at two lines.

1A and 1B carry byte-identical body text, so the two truncation points are directly
comparable. If they are not identical, precondition 1 was skipped → both are **void**.

### 1C - control, no `_meta` marker

- Prompt appeared: **no** - ran silently, as expected. Screenshot `shot-1c.png`.
- `!! TOOL EXECUTED: publish_ungated` in `spike-mcp.log`: **yes**
- Notes: `publish_ungated` is byte-identical to `publish_desc` in title, annotations,
  description and schema, and differs only in its name and the absent `_meta`. It ran with
  no dialog while `publish_desc` raised one. **`requiresUserInteraction` is therefore the
  thing producing the gate**, and it holds under `bypassPermissions`. This is the single
  most load-bearing confirmation in Round 1: candidate A's gate is real and it ships in our
  code, not the user's config.

`publish_ungated` differs from `publish_desc` only in `name` and the absent `_meta`. A prompt
here means the marker is **not** what produces the dialog and the whole Round 1 reading shifts.

**Answer to question 2 - can the consent dialog carry our own body text?**

> **Both channels render, but only the input channel renders in full - and that is the
> channel we do not control.**
>
> The `description` is rendered and then cut after two lines, so a server-authored
> disclosure cannot reach the user. The *input* is rendered whole, with no truncation at
> ~4KB, so a one-beat approve gate carrying the entire aggregate **is** achievable - but
> the input is model-authored by construction.
>
> So neither channel alone gives a trustworthy one-beat gate, and the two failure modes are
> opposite: the server-authored text is trustworthy and invisible, the visible text is
> untrustworthy. The build must close the gap rather than pick a side - see the constraint
> at the bottom of this file, and 1D below.

**New finding, not on the run sheet: the dialog offers "don't ask again".**

> Both 1A and 1B offered `Yes, and don't ask again for <tool> commands in
> /home/alp/dev/projects/aistack/aistack-web/.prototypes/send-channel-spike`. Candidate A
> was chosen on the claim that its gate "cannot be defeated by an allow rule". If that
> option persists and suppresses the next call, the gate is one click from gone and A's
> advantage over B is much narrower than [#31](https://github.com/alp82/aistack/issues/31)
> assumed. If `requiresUserInteraction` re-prompts anyway, the option is cosmetic and the
> claim stands. **Untested - this is 1D and it must be run before the channel is picked.**

### 1D - does "don't ask again" defeat `requiresUserInteraction`?

- Approved 1A with option 2 ("Yes, and don't ask again"): **yes**
- Second `publish_desc` call in the same session prompted again: **no** - the owner reports
  being asked once and never again.
- Where the grant was written: **not** the spike directory the dialog named. It landed in
  the **repo-root** `.claude/settings.local.json`, as two bare entries in `permissions.allow`
  - `mcp__aistackspike__publish_desc` and `mcp__aistackspike__publish_input` - with no
  directory qualifier of any kind. The dialog said "commands in
  `…/.prototypes/send-channel-spike`"; the stored rule is project-wide. **The grant is
  broader than the sentence the user agreed to.**
- Verdict: **the gate is one click from gone, permanently and across sessions.**

This overturns the premise candidate A was selected on.
[#31](https://github.com/alp82/aistack/issues/31) concluded that `requiresUserInteraction`
"cannot be defeated by an allow rule" - it survives *permission modes*, which is what was
actually tested, but a plain allow entry does defeat it, and the client offers to write that
entry inside the gate itself. A publish gate that a single click disables for all future
syncs cannot carry the [#13](https://github.com/alp82/aistack/issues/13) tenet *passive
analysis, never passive publish*: consent to publish this window is not consent to publish
every future window, because the contents differ.

Removed from `.claude/settings.local.json` after recording, or Round 3 would have been void.

### 1E - MCP elicitation, the gate the client cannot allow away

The `initialize` frame records `!! CLIENT CAPABILITIES: {"elicitation":{}} (elicitation
DECLARED)` - Claude Code 2.1.220 supports server-initiated elicitation. `publish_elicit` was
added to the harness after Round 1 and carries **no `_meta` gate**, so 1C's result makes any
dialog it raises attributable to the elicitation alone. Verified against a stub client:
`accept` executes, `decline` does not.

- Prompt appeared: **yes** - headed `MCP server "aistackspike" requests your input`.
  Screenshot `shot-1e-dialog.png`.
- `SPIKE-MARKER-SUMMARY-END` visible - did the server's own text render in full where the
  description was cut at two lines: **yes, and this is the striking part.** The whole
  26-line aggregate rendered with its line breaks intact - headline, destination, window,
  harness, all three model rows with shares and dollars, all five inventory categories, the
  withheld line, the activity block. Compare 1A, where the identical text was cut after two
  lines. **Server-authored text renders in full through elicitation and nowhere else.**
- "Don't ask again" offered: **no** - no such option, because this is not a tool call and
  no permission rule names it.
- **But it could not be answered.** No control was reachable and the keyboard did nothing.
  The call hung for **79 seconds** (`!! ELICITATION REQUESTED` 22:02:53.781 →
  `!! ELICITATION REPLY` 22:04:12.628) until the owner pressed ESC.
- `!! ELICITATION REPLY: action=…` in `spike-mcp.log`: **`action=cancel approved=false`**,
  with **no** `!! TOOL EXECUTED` line. Screenshot `shot-1e-cancel.png`.
- Fail-closed: **yes.** An unanswered gate refused the publish rather than proceeding. The
  `confirm: true` the model passed as a tool argument counted for nothing - consent came
  from the elicitation or not at all, which is exactly the property the design wants.

So elicitation has every property the other three surfaces lack, and one disqualifying
defect: **in 2.1.220 the owner could not say yes.** Whether that is the client's form
handling or the 26-line message pushing the control out of the viewport is what 1F isolates.

### 1F - same gate, one-line message

`publish_elicit_short` changes exactly one variable: a 124-character single-line message
instead of the 961-character 26-line one. Same boolean schema, same tool shape, no `_meta`.
Verified against a stub client. If it is answerable, the cause is length and the aggregate
must be surfaced somewhere other than the elicitation body. If it is not, elicitation cannot
carry consent in this version at all.

- Prompt appeared: **yes**. Screenshot `shot-1f-dialog.png`.
- `SPIKE-MARKER-SHORT-END` visible: **yes** - the one-line message rendered whole.
- **The form rendered this time.** The checkbox row
  `❯ * SPIKE-MARKER-ELICIT-FIELD - publish this aggregate?: ☐` appeared with its
  description under it, an `Accept` / `Decline` row, and a footer reading
  `Esc to cancel · ↑/↓ to navigate · Backspace to unset · Space to toggle`.
- Answerable - could you accept it: **no.** Space, the arrow keys and enter all did
  nothing. ESC was the only key with any effect.
- `!! ELICITATION REPLY: action=…`: **`cancel`**, `approved=false`, no `!! TOOL EXECUTED`.

**So message length was not the cause.** The widget renders, advertises its own key
bindings, and then ignores them. This is the second trial and the second unanswerable
dialog. It is not the terminal either: the same terminal answered every
`requiresUserInteraction` dialog in Round 1 and the hook dialog in 2D with arrow keys and
enter. The defect is specific to the elicitation form in Claude Code 2.1.220.

Fail-closed held a second time, which is worth stating plainly: **at both message lengths,
an unanswerable gate refused the publish.** The mechanism's safety property is sound. Only
its ability to say yes is missing.

### 1G - same gate, enum field instead of boolean

`publish_elicit_enum` changes only the field type: a required string with
`enum: ['publish', 'cancel']`, which renders as a select list rather than a checkbox. It
separates *elicitation is unusable in 2.1.220* from *the boolean widget is unusable*. Stub
verified on three paths - `decision: publish` executes, `decision: cancel` does **not**
execute even though the action is `accept` (the value carries the consent, not the action),
and the original boolean tool still behaves.

This is the last elicitation probe. If the select list is also dead, elicitation cannot
carry consent in this version and the decision goes to the hook.

- Prompt appeared: **yes**. Screenshots `shot-1g-*.png`.
- Answerable - could you pick `publish` and confirm: **yes.** The arrow keys navigated, the
  list expanded, `publish` selected, `Accept` confirmed.
- `!! ELICITATION REPLY:` **`action=accept approved=true`**, `decision` returned.
- `!! TOOL EXECUTED: publish_elicit_enum` present: **yes**.

**So elicitation is usable in 2.1.220 - with a select list, not a checkbox.** Same client,
same terminal, same message, same session: the boolean widget ignored every key and the
enum widget accepted all of them. The difference is the field type and nothing else. The
mechanism was never the problem.

**Interaction cost, recorded because it lands on
[#41](https://github.com/alp82/aistack/issues/41):** the select list needs `→` to expand
before the options are visible, then `↑/↓` to pick, then `Accept`. The owner called the
expand step unnecessary, and it is - for a two-option question the field reads `not set`
until the user discovers a keystroke the footer mentions only as `→ to expand`. Three
keystrokes where a checkbox would have been one. The one-keystroke version is the widget
that does not work. Build against the enum and treat the expand step as the price.

### 1H - full message + enum, the combination the design wants

1E showed the whole 26-line aggregate with a dead checkbox. 1G showed a working select list
with a one-line message. Neither showed both, so *can the one-beat gate carry the entire
aggregate* is still open. `publish_elicit_full` is that pairing and nothing else. Stub
verified across all four elicitation variants.

- Prompt appeared and rendered all 26 lines: **yes**. Screenshot `shot-1h-stuck.png`.
- Still answerable with the long message above it: **only after zooming the terminal out.**
  At the owner's normal font size the message filled the viewport and the `Accept` row sat
  below the fold, unreachable - indistinguishable, from the user's seat, from the dead
  checkbox in 1E. The owner's words: *"that worked but needed a lot of space."*
- `!! ELICITATION REPLY:` **`action=TIMED OUT approved=false`** - requested 22:29:00.296,
  gave up 22:31:00.395, exactly the harness's **120 s** limit. The accept arrived after the
  server had already stopped waiting, so **nothing published**. Screenshot
  `shot-1h-timeout.png`.

**Three findings, and they reshape the gate rather than the channel.**

1. **The widget was never the problem at length - the viewport was.** A 26-line message
   plus a form does not fit a normal terminal, and Claude Code does not bring the control
   into view. A first-time user meets a consent dialog with no visible way to say yes.
2. **A human answering a 26-line dialog can take longer than two minutes.** Reading, zooming
   out, expanding the list, picking, accepting - 1G took 92 seconds with a *one-line*
   message. Any server-side timeout must be generous, and the build should not have one
   shorter than several minutes.
3. **Fail-closed held a fourth time, under the failure mode most likely to be got wrong.**
   The timeout published nothing. An implementation that treated "no answer yet" as "proceed"
   would have sent here, and the user would have believed they approved it.

**So the aggregate does not go inside the gate.** The elicitation message must be short
enough to fit beside its own controls. The full summary is printed by the Skill *before* the
call, where it is ordinary scrollable transcript output with no viewport trap, and the gate
restates the one line that matters. This is the two-beat shape - arrived at not because the
dialog cannot render the text, but because a dialog that renders it cannot be answered.

**Where does the approved text come from, for the variant that won?**

> _(1A: the server derives the description from the payload it holds. 1B: the model supplies
> `humanSummary` and `payload` as two independent arguments and the server never derives one
> from the other - so what the user approves is model-authored text, not the bytes that go
> out. The real aggregate is computed from transcripts containing web fetches, file contents
> and tool output, i.e. attacker-reachable text, so 1B's shape permits a benign summary
> alongside a different payload. If 1B wins on rendering, record it, but the shipped design
> must still compute the summary server-side from the bytes it will send.)_

---

## Round 2 - candidate B (CLI via Bash), same session

Each binary was run in its own separate Bash call: **yes** - three separate turns, confirmed
by three separate `cmd=` lines in `spike-hook.log`.

**Read this round through the latency, not through the narration.** The session driving the
harness reported "neither gate prompted", inferred from `mode=bypassPermissions` in the hook
log. That inference is wrong, and the logs disprove it. `spike-hook.log` records when the
gate was evaluated and `spike-cli.log` records when the binary actually ran. The same binary,
on the same machine, in the same session:

| round | hook fired | binary ran | gap | reading |
|---|---|---|---|---|
| 2A `ruleask` | 21:56:14.564 | 21:56:17.658 | **3,094 ms** | a human answered a dialog |
| 2B `hookask` | 21:57:21.501 | 21:57:43.757 | **22,256 ms** | a human answered a dialog |
| 2C `nogate` | 21:58:38.624 | 21:58:38.679 | **55 ms** | nothing intervened |

55 ms is the cost of spawning the process. Three seconds and twenty-two seconds are not.
The owner watching the screen reported a prompt for 2A and 2B and none for 2C, and the
timestamps agree with the owner. An agent cannot see the dialog, so a claim of "no prompt"
sourced from a log is not an observation - it is the failure mode this run sheet was built
against, arriving from the opposite direction.

### 2A - explicit `ask` rule - also the proof `.claude/settings.json` loaded

- Prompt appeared: **yes** - 3.1 s gap, owner confirmed. Screenshot `shot-2a.png`.
- Verbatim `cmd=` line from `spike-hook.log` for this turn:
  `cmd=./bin/publish-ruleask publish`
- That command starts with one of the rules in `.claude/settings.json`
  (`./bin/publish-ruleask`, `bin/publish-ruleask`, absolute path): **yes** - it is the
  literal `./bin/publish-ruleask` rule. Not a rule miss.
- What the dialog showed: the Bash command line only. Nothing of the payload - not the
  destination stack, not the window, not the dollar figures, not the withheld counts.
- "Don't ask again" offered: **yes**

**So an explicit `ask` rule does survive `bypassPermissions`**, which the permission-modes
doc claims and this round confirms. `.claude/settings.json` loaded, so 2B is readable.

→ **If 2A did not prompt, stop and do not fill in 2B.** A silent 2A cannot be told apart from
a settings file that was never read.

### 2B - `PreToolUse` hook returning `ask` ← load-bearing

- Prompt appeared: **yes** - 22.3 s gap, owner confirmed. Screenshot `shot-2b.png`.
- Verbatim `cmd=` line from `spike-hook.log` for this turn:
  `cmd=./bin/publish-hookask publish`
- `-> returning permissionDecision:"ask"` present in `spike-hook.log`: **yes**, at
  21:57:21.501, immediately before the 22 s gap.
- reported `permission_mode` in `spike-hook.log`: **`bypassPermissions`** on every line.
- `spike-cli.log` shows `!! CLI EXECUTED`: **yes**, at 21:57:43.757 - so the prompt was
  approved, not denied.
- **Two prompts fired in this turn, not one.** At 21:57:17.466 the hook also returned `ask`
  for `cat ./bin/publish-hookask; …` - the agent reading the binary tripped the same gate
  as running it, four seconds earlier. That is precondition 4 of the run sheet happening
  live, and it is also a finding in its own right (see 2E).

### 2C - control, ungated

- Prompt appeared: **no**, as expected. 55 ms from hook to execution. Screenshot
  `shot-2c.png`.
- `!! CLI EXECUTED`: **yes** - `variant=nogate tty=no stdinTty=no`.
- This is candidate B's hole made concrete: under bypass an ungated send is silent, and the
  binary has no way to know it should have been gated. All three runs report
  `tty=no stdinTty=no`, so the CLI can never be the gate itself.

### 2E - the gate matches command *text*, not the process

Not on the original sheet; forced by the double prompt in 2B. The hook matcher is
`command.includes('publish-hookask')`, so `cat ./bin/publish-hookask` raised a consent
dialog for **reading a file**. The rule half has the same shape: it is a prefix match on a
model-authored string.

Both of candidate B's gates therefore key on how the command happens to be spelled. That
cuts both ways - a false prompt for `cat`, and a missed prompt for any spelling the rule
does not anticipate. 2D below is what measures the miss direction, and it is the one
remaining question that can still change the channel choice.

### 2D - non-canonical spellings of the same binaries

| invocation | hook → exec | gate fired? | `cmd=` as logged |
|---|---|---|---|
| `bash -c './bin/publish-ruleask publish'` | 22:04:57.297 → .354 = **57 ms** | **no - evaded** | `bash -c './bin/publish-ruleask publish'` |
| `$PWD/bin/publish-ruleask publish` | 22:07:05.780 → .830 = **50 ms** | **no - evaded** | `$PWD/bin/publish-ruleask publish` |
| `bash -c './bin/publish-hookask publish'` | 22:08:18.015 → 22:09:13.624 = **55.6 s** | **yes - held** | `bash -c './bin/publish-hookask publish'` |

**The rule gate falls to both spellings; the hook gate survives both.** The rule is a
*prefix* match, so wrapping the command in `bash -c` puts `bash` at the front and nothing
matches, and `$PWD/bin/…` is matched *before* the shell expands it. The hook uses
`command.includes('publish-hookask')`, a substring test, which catches both. Two 50 ms runs
against one 55.6 s run, same binary, same session - the timing is unambiguous, and 2A's
3.1 s prompt (where the spelling *did* match the prefix) is what makes this a clean
comparison rather than a mode artifact.

Substring is more robust than prefix, not robust. `publish-hook''ask`, a variable holding
the path, or any `$(…)` that resolves after the check would all execute the same file and
miss the test. **Both of candidate B's gates read a model-authored string, and the set of
strings that run one binary is unbounded.** This is structural: it cannot be patched with
more rules, and the 2E false positive is the same defect seen from the other side.

**One thing the hook gate does better than anything else measured here.** Its dialog
(`shot-2d-bashc-hook-dialog.png`) rendered the hook's own `reason` in full -
`SPIKE-MARKER-HOOK-REASON - publish 30d measured usage to stack "alps-daily-driver". 3
models, 5 built-in tools, 2 MCP servers, 3 skills; 12 names withheld. $5,407.59
API-equivalent. No transcripts, prompts, paths or repo names leave this machine.` - and it
offered **only `1. Yes` / `2. No`, with no "don't ask again"**. So the hook carries
server-authored consent text that the user cannot permanently silence, which is precisely
what the MCP `requiresUserInteraction` dialog failed at in 1A and 1D.

**Answer to question 1 - does a hook-returned `ask` prompt interactively under bypass?**

> **Yes.** Under `--permission-mode bypassPermissions`, a `PreToolUse` hook returning
> `permissionDecision: "ask"` rendered a real interactive dialog, and the binary ran only
> after the owner answered it - 22.3 s after the hook returned, against 55 ms for the
> ungated control. An explicit `ask` **rule** does the same (2A, 3.1 s).
>
> This closes the question [#31](https://github.com/alp82/aistack/issues/31) left open, and
> it **removes candidate B's disqualifying defect**. B's gate is not inert under bypass. The
> case against B now rests entirely on what 2D measures: both of its gates match on
> model-authored command text rather than on the process being launched.

---

## Round 3 - fail-closed modes

`claude mcp get aistackspike` said **"⏸ Pending approval"** before the headless run, so by
the run sheet's own rule the row should have been void. It was not: the headless process
connected anyway and `spike-mcp.log` gained a full frame set for it, including
`!! CLIENT CAPABILITIES`. The precondition is recorded as failed and the row as **valid on
the evidence in the log**, which is stronger than the precondition it was standing in for.

| case | expected | observed |
|---|---|---|
| `dontAsk` + 1A (MCP marker) | deny | **not run** - see below |
| `dontAsk` + 2B (hook ask) | deny | **not run** - see below |
| headless `-p` + bypass + `publish_elicit_full` | deny | **fail-closed, immediately** |

**The headless row is the one that matters, and it passed cleanly.**
`!! ELICITATION REQUESTED` at 22:22:01.991, `!! ELICITATION REPLY: action=cancel
approved=false` at 22:22:01.995 - **4 milliseconds**, no `!! TOOL EXECUTED`. The client
declares `elicitation` in a headless session and then auto-cancels every request, so the
gate does not hang waiting for a person and does not need the harness's 120 s timeout to
protect it. The model's `confirm: true` argument again counted for nothing.

That is a better result than the "deny" the sheet expected. A denial is the client refusing
a tool; this is our own code declining to publish because consent never arrived. **The
fail-closed property belongs to the design rather than to the permission system.**

The two `dontAsk` rows were dropped deliberately, not skipped. They were written to test
`requiresUserInteraction` and the hook `ask`, and 1D and 2D removed both from the running.
Re-running them would measure mechanisms the decision no longer rests on.

---

## Round 4 - `async: true` Stop hook - **not run, deliberately**

Round 4 exists to inform the `SessionEnd` opt-in auto-analyze, which
[the wire-format grilling #33](https://github.com/alp82/aistack/issues/33) **ruled out of
this map** as a fast-follow. It cannot change the channel choice, and the harness has
already settled the part that was in doubt by reading the 2.1.220 binary: config-based
`async: true` hooks are backgrounded `detached` and killed after the hook's `timeout`
seconds. Carried to the fast-follow rather than measured here.

## Round 4 (original sheet)

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

**Channel picked: A - the local stdio MCP server. But not with the gate the ticket proposed.**

The gate is **`elicitation/create` with an enum field**, not
`_meta["anthropic/requiresUserInteraction"]`. The spike killed the marker as a consent
mechanism and found a better one in the same channel.

**Why:**

1. **The gate sits on the code path, not on the spelling of a request.** This is the
   structural argument and it is what eliminates candidate B. Both of B's gates read a
   model-authored string: the `ask` rule is a prefix match that `bash -c '…'` and
   `$PWD/bin/…` both walked past in ~50 ms, and the hook's substring test caught those two
   but would miss `publish-hook''ask` or any variable holding the path. The set of strings
   that launch one binary is unbounded, so no list of rules closes it. An elicitation raised
   *inside* the call cannot be spelled around, because by then the code is already running.
2. **The user cannot silence it.** 1D is the finding that removed A's original design: one
   "don't ask again" click permanently defeats `requiresUserInteraction`, and the entry it
   writes is broader than the dialog's own sentence. An elicitation is not a tool call, so
   no permission rule names it and no dialog offers to write one. Measured: the hook dialog
   also offers no "don't ask again", but the hook loses on point 1.
3. **It is the only surface that renders our own text in full.** 1E showed all 26 lines,
   formatted, where 1A cut the identical string after two. That closes the gap the ticket
   called "materially different UX either way" - and it closes it on the *trustworthy* side.
   1B could render everything too, but only as a model-authored argument.
4. **It fails closed everywhere it was measured**, and by our own logic rather than the
   permission system's: ESC and an unanswerable widget both produced `cancel` with no
   execution, and a headless run auto-cancelled in 4 ms. In every case the model's
   `confirm: true` argument counted for nothing.

**What it costs:**

- **A node runtime bundled in the plugin.** Unchanged from candidate A's original price.
- **The enum widget, and only the enum widget.** The boolean checkbox renders, advertises
  `Space to toggle`, and ignores every key except ESC - twice, at both message lengths, in a
  terminal that answered every other dialog in this spike. This is a client defect in
  2.1.220 that the build routes around rather than fixes. **A `boolean` field in a shipped
  elicitation would be an unanswerable gate.**
- **Three keystrokes, not one.** The select list needs `→` to expand before its options are
  visible, then `↑/↓`, then `Accept`. The owner called the expand step unnecessary. It is
  the price of using the widget that works.
- **A version floor, of an unknown height.** `requiresUserInteraction`'s documented
  2.1.199+ floor no longer applies, but elicitation has its own. Observed working on
  2.1.220. Not pinned, and not worth pinning while the done-bar is owner-only - it bites
  external installs, which are fog.
- **Trust state is unresolved for a bundled server.** `claude mcp get` reported the
  project-scoped `.mcp.json` server as "⏸ Pending approval" even after interactive
  approval, and the headless run connected anyway. A plugin-bundled server has a different
  trust story that this spike did not measure.

**What it changes downstream:**

- **[#41](https://github.com/alp82/aistack/issues/41) gets a two-beat gate, and 1H is why.**
  The server scans, builds the payload, derives the summary **from those exact bytes**,
  **prints the full summary to the transcript**, then raises a **short** elicitation naming
  the destination, the window, the dollar figure and the withheld count - and sends only on
  `decision: publish`. The ticket framed this as "one beat if the dialog can carry the
  aggregate". The dialog *can* render it and then cannot be answered at a normal terminal
  size, so the answer is two beats for a reason the ticket did not anticipate. The Skill
  stays thin: it triggers and displays, it does not decide.
- **No server-side timeout under several minutes.** 120 s expired while the owner was
  answering. Fail-closed made that safe, but a gate that gives up while the user is reading
  it is a gate they will stop trusting.
- **[#36](https://github.com/alp82/aistack/issues/36) is unblocked and narrowed.** The token
  never passes through the model or a command line - the server reads it and makes the HTTPS
  call itself.
- **One locked decision now needs revisiting.**
  [#42](https://github.com/alp82/aistack/issues/42) put the per-name opt-in ticks *at the
  approve gate*, default-off with each name rendered. An elicitation schema takes primitive
  fields only, so twelve withheld names means twelve select lists, each needing expand and
  pick - and the one-keystroke widget that would make this bearable is the broken one. The
  gate can *report* the withheld count. It cannot practically collect the ticks. Graduated
  as its own ticket rather than settled here.

**Constraint carried into the build regardless of channel:** the summary the user approves
must be derived server-side from the exact bytes that will be sent, never accepted as a
caller-supplied argument alongside them. The spike strengthened this from a caution into a
demonstrated property - 1B's shape lets a model pass a benign summary beside a different
payload, and the elicitation shape makes that impossible by construction.

**Constraint carried into the build regardless of channel:** the summary the user approves
must be derived server-side from the exact bytes that will be sent, never accepted as a
caller-supplied argument alongside them.
