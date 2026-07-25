# Send-channel spike — run sheet

Harness for [Task: spike the two send channels head to head, and pick one](https://github.com/alp82/aistack/issues/35)
(wayfinder map [Execute P0.2 — auto-sync v1](https://github.com/alp82/aistack/issues/29)).

Nothing here sends anything anywhere. Every "publish" prints and logs.

## What this answers

The two facts the docs could not settle, both from
[the capability research #31](https://github.com/alp82/aistack/issues/31):

1. **Does a `PreToolUse` hook returning `permissionDecision: "ask"` render as a real
   interactive prompt under `--permission-mode bypassPermissions`?** Load-bearing for
   candidate B — if it resolves to a denial (or is skipped) instead of prompting, B's
   gate has a hole in exactly the mode where it matters.
2. **Can a `requiresUserInteraction` MCP prompt carry our own body text?** If the
   aggregate renders *inside* the consent dialog the approve step is one beat; if not,
   it needs a separate review surface first. Shapes
   [the Skill build #41](https://github.com/alp82/aistack/issues/41) either way.

Plus, while the harness is open: whether an `async: true` hook outlives the session,
and the observed version floor.

## The failure mode this run sheet is built against

**A null you cannot attribute.** "No prompt appeared" has at least four causes, and only
one of them is an answer:

| what you'd see | what it might actually be | how this sheet rules it out |
|---|---|---|
| Round 1 silent | the MCP server never connected | `/mcp` precondition below — hard stop |
| Round 2A silent | `.claude/settings.json` never loaded | 2A is the load-check; if it is silent, **stop** |
| Round 2A silent | the model typed a command spelling no rule matches | cross-check `cmd=` in `spike-hook.log` |
| Round 3 headless "deny" | the tool was never available to deny | `claude mcp get` precondition + a third outcome value |
| Round 4 no `completed` | the hook was killed at teardown, or timed out | per-second ticks + recorded quit time |

Every round below tells you which observations are void rather than negative. Prefer
recording "void" over recording a "no".

## Layout

| path | role |
|---|---|
| `mcp/publish-server.mjs` | candidate A — zero-dep stdio MCP server, 3 tools |
| `mcp/summary.mjs` | the aggregate rendering, shared by both A variants; run it to regenerate the fixture |
| `.mcp.json` | registers the server project-scoped, by **absolute path** |
| `bin/publish-ruleask` | candidate B — gated by an explicit `ask` **rule** |
| `bin/publish-hookask` | candidate B — gated by a `PreToolUse` **hook** returning `ask` |
| `bin/publish-nogate` | **control** — no rule, no hook |
| `hooks/pre-tool-use-ask.mjs` | the hook; returns `ask` only for `publish-hookask` |
| `hooks/stop-async-probe.mjs` | `async: true` Stop hook, ticks for 20s then writes |
| `.claude/settings.json` | the `ask` rules + both hooks |
| `fixtures/payload.json` | realistic wire payload, [#33](https://github.com/alp82/aistack/issues/33) shape |
| `fixtures/summary.txt` | the same aggregate rendered for a human — **generated**, see preconditions |

The three binaries are deliberately **non-prefix-colliding**: Bash permission rules are
prefix matches, so `publish-ruleask` must not be a prefix of the other two or one rule
would silently gate all three and the comparison would be worthless.

`.mcp.json` uses an absolute path on purpose. `${CLAUDE_PROJECT_DIR}` is **not** expanded
in `.mcp.json` — it exists only in the environment of hook subprocesses — so the `${...}`
form is handed to `node` literally, the server exits `MODULE_NOT_FOUND`, and every Round 1
result becomes a null that reads exactly like "Claude Code ignored `requiresUserInteraction`".
`$CLAUDE_PROJECT_DIR` in the **hook** commands in `.claude/settings.json` does expand and is
correct as written. If you moved this repo, update the path in `.mcp.json` first.

Marker strings to look for in any prompt: `SPIKE-MARKER-TITLE`,
`SPIKE-MARKER-ANNOTATION-TITLE`, `SPIKE-MARKER-SUMMARY-END`, `SPIKE-MARKER-HOOK-REASON`,
`SPIKE-MARKER-CLI-STDOUT-BEGIN`.

## Preconditions — do not skip, each one voids a whole round

Everything runs from **this directory** so the project-scoped `.mcp.json` and
`.claude/settings.json` apply and the repo's real settings stay untouched.

```sh
cd .prototypes/send-channel-spike
node mcp/summary.mjs            # 1. regenerate fixtures/summary.txt from payload.json
claude --version                # 2. record it in RESULTS.md
claude --permission-mode bypassPermissions
```

1. **Regenerate the fixture.** `fixtures/summary.txt` is a build artifact. 1A reads its body
   text live from `buildSummary()`; 1B reads it from this file. If the file is stale the two
   variants are compared on *different text* and any truncation finding is wrong.
2. **Note the version** — it is the observed floor for everything below.
3. **Trust the MCP server** at first launch, then run `/mcp` and confirm `aistackspike` shows
   **connected** with **3 tools**.
   → If it does not, **Round 1 is void — stop.** Do not record a "no prompt" for 1A/1B/1C.
   Fix the launch first: `claude mcp list` from this directory must print the absolute
   `node /…/mcp/publish-server.mjs` line with no `Missing environment variables` warning.
4. **Keep the three binaries' names out of every other command you type.** The `PreToolUse`
   matcher is an unscoped `"Bash"` and the hook decides on a substring, so `grep -r
   publish-hookask .` would itself raise an `ask` you would then misread as the gate under
   test firing.

### Round 1 — candidate A, MCP + `requiresUserInteraction`, under bypass

Paste each prompt, then record what you saw.

**1A — body text in the tool `description`**

> Call the aistackspike publish_desc tool with confirm set to true.

**1B — body text in the tool *input***

> Read fixtures/summary.txt and fixtures/payload.json, then call the aistackspike
> publish_input tool passing summary.txt's contents verbatim as humanSummary and
> payload.json's parsed contents as payload.

**1C — control, no `_meta` marker**

> Call the aistackspike publish_ungated tool with confirm set to true.

`publish_ungated` is a byte-for-byte clone of `publish_desc` — same title, same annotations,
same description, same input schema. It differs in its `name` and in the **absence of
`_meta["anthropic/requiresUserInteraction"]`**, and nothing else. So if 1C prompts, the marker
is not what produces the prompt. Tell the two apart in the dialog by the tool name, not by the
marker strings — they are identical on purpose.

For each, record:

- Did a prompt appear at all? (1C under bypass is expected to run silently.)
- **Which marker strings were visible in the dialog**, verbatim.
- Was the full multi-line summary rendered, or truncated — and *where*?
- Was a "don't ask again" / "always allow" option offered?
- Roughly how many terminal lines did the dialog occupy?

1A and 1B carry **byte-identical** body text (same `buildSummary()` output, no headline
prefix on the description), so a truncation point in 1A and one in 1B are directly comparable
line for line. If they are not identical, you skipped precondition 1.

A screenshot per prompt is worth more than prose here; drop them beside this file as
`shot-1a.png` etc.

### Round 2 — candidate B, CLI via Bash, same bypass session

**Run each of these as its own separate prompt and its own separate Bash call.** One combined
command line would satisfy both the `ask` rule prefix and the hook's `publish-hookask`
substring test at the same time, and the rule-vs-hook separation — the whole point of the
round — would be destroyed.

**2A — explicit `ask` rule.** This doubles as the proof that `.claude/settings.json` was
loaded at all.

> Run ./bin/publish-ruleask publish

→ **If 2A does not prompt, stop.** 2B's result is then uninterpretable: you cannot tell a
hook that failed to gate from a settings file that was never read. Before recording a "no"
for 2A, open `spike-hook.log` and check the `cmd=` line for that turn: the command the model
actually emitted must start with one of the rule prefixes in `.claude/settings.json`
(`./bin/publish-ruleask`, `bin/publish-ruleask`, or the absolute path). If it starts with
something else, that is a **rule miss, not a bypass** — record the exact command line and
treat 2A as void.

**2B — `PreToolUse` hook returning `ask`** ← *the load-bearing question*

> Run ./bin/publish-hookask publish

**2C — control, ungated**

> Run ./bin/publish-nogate publish

**2D — the same gates, non-canonical spellings.** Both gates key on the *command text*, not on
the process being launched, so Round 2 as run above only tells you "gated against the one
spelling we tried". Run each of these as its own Bash call and record whether the gate still
fired:

> Run bash -c './bin/publish-ruleask publish'

> Run $PWD/bin/publish-ruleask publish

> Run bash -c './bin/publish-hookask publish'

A miss here is a real finding about candidate B, not a harness fault — record it, do not
"fix" it by adding more rules.

Record for each: prompt or no prompt; whether `SPIKE-MARKER-HOOK-REASON` appeared in
2B's dialog (i.e. can the hook's reason carry the aggregate?); whether the dialog shows
the raw command line or something richer; whether a "don't ask again" was offered; and the
verbatim `cmd=` line from `spike-hook.log`.

Expected-but-must-be-seen: 2C runs with no prompt. That is candidate B's hole made
concrete — under bypass, an ungated send is silent.

### Round 3 — the modes that should fail closed

Quit, relaunch as `claude --permission-mode dontAsk`, and repeat 1A and 2B. Both should
**deny**, not send.

Then, **before** the headless run, confirm the server is still trusted:

```sh
claude mcp get aistackspike
```

If that says **Pending approval**, the headless run below cannot reach the tool and its
"deny" means nothing. Re-approve interactively first.

```sh
claude -p "Call the aistackspike publish_desc tool with confirm set to true." \
  --permission-mode bypassPermissions
```

Expected to deny. Record which of three things happened — `deny` / `sent` / **`tool
unavailable`** (the model reports no such tool, or `spike-mcp.log` gained no `tools/list`
frame for this run). "Tool unavailable" is not a fail-closed result; it is a void one.

### Round 4 — the `async: true` probe

The Stop hook fires on every turn and ticks once a second for 20s. To make the result
attributable you need the probe still ticking when you quit:

1. Send one last trivial prompt.
2. **Quit within ~10s of that turn finishing**, and write down the wall-clock time you quit.
3. Wait ~30s, then read the log:

```sh
cat spike-async.log
```

Read it like this, for the `session=` id of the session you just quit (find it in the
`started` line of the last block):

- a `completed` line for that session → **async hooks outlive the session.**
- ticks that continue past your recorded quit time, then stop with no `completed` → the
  process survived teardown but was killed later; note the last tick offset.
- ticks that stop *at* your quit time, no `completed` → **killed at teardown.** This is the
  only reading that supports "async hooks do not outlive the session".
- `session=unknown` on the `started` line → hook input never arrived; **Round 4 is void.**

### Teardown

Once `RESULTS.md` is filled in, either delete this directory or strip `.claude/settings.json`
and `.mcp.json` from it. Both are live config: leaving them in a tracked directory means any
future `cd .prototypes/send-channel-spike && claude` runs an always-on Bash hook and spawns a
stdio MCP server that nobody remembers wiring up.

Before committing anything here, confirm `git status` shows no `spike-*.log` — the local
`.gitignore` covers them, and `spike-hook.log` records gated Bash command lines verbatim.

## Evidence the harness collects on its own

| file | written by |
|---|---|
| `spike-mcp.log` | every JSON-RPC frame, plus a `!! TOOL EXECUTED` line per real call |
| `spike-hook.log` | every `PreToolUse` firing incl. reported `permission_mode`; verbatim command line for the three spike binaries, redacted to a length for everything else |
| `spike-cli.log` | `!! CLI EXECUTED` per run, with TTY status |
| `spike-async.log` | Stop-hook `started` / `tick` / `completed`, each tagged with `session_id` |

These are the ground truth for "did it actually run", independent of what the dialog
appeared to say. Record the answers in `RESULTS.md`.

## Already settled without a human

Running `bin/publish-nogate` directly under the Bash tool reports
`stdout is a TTY: false   stdin is a TTY: false` — confirming
[#31](https://github.com/alp82/aistack/issues/31)'s claim that a Bash-launched CLI
structurally cannot prompt. Under candidate B the consent must come from the harness
*before* the process starts; the CLI can never be the gate itself.

Also settled by reading the 2.1.220 binary, so you do not re-derive it: config-based
`async: true` hooks are backgrounded `detached` and killed after the hook's `timeout`
seconds (`.claude/settings.json` sets **120**; the default is 600). The probe's 20s delay is
far inside that, so a missing `completed` line is never a timeout artefact. `asyncTimeout` is
**not** a settings key — it belongs to a hook's stdout response — and adding it to
`settings.json` would be silently stripped.
