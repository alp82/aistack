# Deterministic workflow extraction by harness

Research for [Research: deterministic workflow extractability per harness](https://github.com/alp82/aistack/issues/165).
This ticket belongs to [Wayfinder: Three explorations - news pipeline, workflow surface, Discord bot](https://github.com/alp82/aistack/issues/159).
Written 2026-08-18.

This report reads the CLI adapter code at commit `3c3ad68`. It also reads the adapter tests and prior local transcript studies.

## Answer

The local files can support a measured workflow layer without an LLM.

Claude Code and opencode record explicit skill, agent, MCP, session, and tool facts. Codex records tool and MCP facts.

Pi records tools and a branch-aware session tree. Pi has no distinct skill, agent, or MCP invocation record.

All four harnesses can support numeric session patterns. The current aggregate drops event order and per-session event groups.

An LLM can draft a workflow description from approved aggregates. It cannot turn an absent or unverified marker into a measured fact.

This report uses three status terms:

| Status | Meaning |
| --- | --- |
| Extracted | The current analyzer computes the fact. |
| Available | The same input contains the fact, but the current aggregate drops it. |
| Unsupported | The current input contract has no stable marker for the fact. |

## Harness matrix

| Harness | Skills | Agents | MCP | Session shape | Tool sequence | Deterministic habits |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Code | Extracted by `Skill.input.skill` | Extracted by `Agent` or `Task` type | Extracted from `mcp__server__tool` | Available as a record tree and nested agent files | Available with branch and call identifiers | Counts, shares, transitions, co-use, timing, and branch rates |
| Codex | Unsupported | Unsupported | Extracted from calls and `config.toml` | Extracted as one rollout per session | Available in rollout order | Tool transitions, turn sizes, timing, and MCP use |
| opencode | Extracted by `skill.state.input.name` | Extracted by `task.state.input.subagent_type` | Extracted from calls and `opencode.json` | Extracted as parent and child sessions | Available after a new ordered query | Counts, shares, child-session rates, timing, and ordered patterns |
| Pi | Unsupported | Unsupported | Unsupported | Available as an `id` and `parentId` tree | Available with branch-aware deduplication | Tool transitions, branch rates, compaction rates, and timing |

## Claude Code

The adapter reads recursive JSONL files under the configured project roots. It includes nested agent files.
[Scanner](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/claude/scan.ts#L27-L60)

The analyzer gets session identifiers, timestamps, versions, project counts, models, tokens, and sidechain status.
[Analyzer](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/claude/analyzer.ts#L105-L174)

Tool blocks give explicit calls. Special branches get skill names, agent types, and MCP server names.
[Tool extraction](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/claude/analyzer.ts#L383-L430)

User records also give explicit slash-command markers.
[Slash commands](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/claude/analyzer.ts#L432-L455)

The records contain `uuid`, `parentUuid`, tool-result links, timestamps, and agent identifiers. These fields support a branch-aware event graph.
[Local transcript study](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/docs/research/claude-code-transcripts-2026-07.md#L69-L95)

Deterministic facts can include these measures:

- Skill, agent, MCP, tool, and slash-command calls per session.
- Tool transitions and fixed-length tool sequences per branch.
- Skill-to-tool, agent-to-tool, and MCP-to-tool transitions.
- Main-thread and agent model shares.
- Session duration, turn counts, tool error rates, branches, and activity times.

Calls in one assistant response can run together. A reducer must store them as one batch unless completion records prove an order.

Claude records observed MCP calls. The adapter does not read Claude MCP configuration for unused server inventory.

## Codex

The adapter reads session rollouts under `$CODEX_HOME/sessions`. It excludes prompt history and archived sessions.
[Scanner](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/codex/scan.ts#L29-L48)

The analyzer gets session metadata, turn models, timestamps, tokens, and response items.
[Analyzer](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/codex/analyzer.ts#L51-L137)

Function calls and custom tool calls give explicit tool names. The first `__` separates an MCP server from its tool.
[Tool extraction](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/codex/analyzer.ts#L183-L225)

The adapter also reads configured MCP server names from `config.toml`.
[MCP configuration](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/codex/scan.ts#L307-L324)

A rollout keeps response items in file order. A local reducer can compute tool transitions, call spacing, and turn-level tool counts.

The repository does not prove stable skill or agent invocation markers. It also states that slash commands do not reach rollouts.
[Adapter contract](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/codex/adapter.ts#L15-L26)

An LLM cannot fix this gap. Codex skill and agent facts need new format evidence before the product can measure them.

## opencode

The adapter reads `opencode.db` and channel databases. It also reads MCP configuration from `opencode.json`.
[Database discovery](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/opencode/scan.ts#L41-L69)
[MCP configuration](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/opencode/scan.ts#L329-L361)

Named queries get session identifiers, parent sessions, versions, models, providers, timestamps, tokens, and working directories.
[Message queries](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/opencode/scan.ts#L173-L256)

Tool queries get call identifiers, skill names, and agent types. Configured server prefixes identify MCP calls.
[Tool extraction](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/opencode/analyzer.ts#L193-L281)

A non-null `session.parent_id` marks a child session. This supports exact parent-child counts and child-session token shares.

The current tool query has no `ORDER BY`. It also omits the session, message, timestamp, and v2 sequence columns.
[Current query](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/opencode/scan.ts#L258-L305)

The same database has these columns. A new named query can group calls without loading outputs or prompt text.
[Test schema](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/opencode/scan.test.ts#L34-L44)

The v1 query needs a tested tie rule before it can claim a total order. The v2 table has a `seq` column.

## Pi

The adapter reads strict session JSONL files under the configured Pi session root. It does not read credentials or settings.
[Scanner](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/pi/scan.ts#L44-L71)

The analyzer gets session identifiers, models, timestamps, usage, compactions, summaries, and tool content.
[Analyzer](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/pi/analyzer.ts#L68-L178)

Tool calls have explicit names and identifiers. User shell commands remain separate from model tool calls.
[Tool extraction](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/pi/analyzer.ts#L241-L275)

Entries form a tree through `id` and `parentId`. Fork and clone copies keep identifiers, so sequence work needs cross-file deduplication.
[Pi format study](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/docs/research/harness-adapters-2026-08.md#L102-L108)
[Deduplication](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/pi/analyzer.ts#L180-L224)

Pi has no distinct skill, agent, or MCP call surface. Extension tools remain plain tool names.
[Adapter contract](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/pi/adapter.ts#L17-L33)

A model can inject a prompt template without a stable invocation marker. Prompt-text inference would be private and heuristic.

## Prototype metric audit

The prototype proposes twelve metric boxes and eight extra candidates.
[Prototype pool](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/prototypes/workflow-surface/index.html#L420-L456)

`C` means Claude Code. `X` means Codex. `O` means opencode. `P` means Pi.

| Prototype label | Reach | Exact local fact | Verdict and safe label |
| --- | --- | --- | --- |
| Merges passed a human review gate first | C, X, O | Matched gate call before a matched merge command | Proxy. Use “matched gate call preceded matched merge command.” |
| Projects run in parallel | C, X, O, P | Overlapping recorded session spans across local project keys | Proxy. Idle time can overlap. Use “overlapping project session spans.” |
| Commits land during an hour range | C, X, O, P | Matched successful commit commands by transcript time | Overstated. Actual commit time needs Git history, which adapters do not read. |
| Longest unbroken agent turn | C, limited X, O, P | Direct Claude turn duration or harness-specific message span | Mixed. Use “longest recorded turn duration” only where the harness records it. |
| Build streaks start from a wayfinder map | C, O | Explicit skill call before a locally defined build sequence | Proxy. Publish the rule identifier and support count. |
| Grillings include domain modeling | C, O | Two explicit skill names in one session | Exact co-use. It does not prove one skill caused the other. |
| Widest subagent fan-out | C, O | Maximum overlapping child-session spans | Proxy for simultaneous work. X is unverified. P has no agent surface. |
| Test runs this window | C, X, O, P | Shell calls that match a versioned local test-command rule | Overstated. Use “matched test command calls.” |
| Edited lines are TypeScript | C, X, O, P | Edit requests for TypeScript paths, or requested patch lines | Overstated. Tool requests do not prove final repository lines. |
| Turns end with a question | C, X, O | A known question tool is the last tool in a defined turn | Exact for the tool marker. It excludes questions in normal text. |
| Harnesses syncing | C, X, O, P | Detected harness payload count | Exact. The current stage already has this fact. |
| Web searches per active day | C, X, O | Recorded web-search calls divided by recorded active days | Exact for recorded calls. P has no built-in web-search tool. |

### Extra candidates

| Candidate | Reach | Verdict and safe label |
| --- | --- | --- |
| Plan-mode share | C | Exact for sessions with explicit mode records. Other harnesses need separate definitions. |
| Permission-mode changes | C, X | Exact for recorded mode or approval-policy changes. Coverage differs by harness version. |
| Context resets per day | X, P, version-dependent C | Split clear events from compaction events. “Context reset” combines different actions. |
| Effort settings | C, X | Exact where the record has the field. Treat absent fields as unknown. |
| Thinking share | C, X, O, P | Define response share or token share. The available token meaning differs by harness. |
| Lines added and removed | None as an exact cross-harness fact | Requested patches are proxies. Exact repository deltas need another local source. |
| Commit count per session | C, X, O, P | Matched successful commit commands are proxies. Exact commits need Git history and correlation. |
| Model switches inside a session | C, X, O, P | Exact from response models, turn contexts, message models, or model-change entries. |

Three other prototype surfaces need careful labels:

- Phase anatomy needs a versioned local taxonomy with an `unknown` class. Phase names are classifications, not record fields.
- Model routing by main thread and agent is exact for Claude Code and opencode. Codex and Pi cannot support it.
- A weekday and hour matrix can show recorded activity. It cannot claim productive work time or commit time.

## Habits and the LLM boundary

A habit becomes deterministic only after the product fixes its rule and denominator.

Examples include tool transitions, repeated fixed-length sequences, skill co-use, branch rates, and activity-time distributions.

Each published habit needs a rule identifier, support count, denominator, window, harness coverage, and an `unknown` bucket.

An LLM can draft these parts:

- A short workflow description from approved facts.
- Names for repeated structural patterns.
- A readable explanation of model routing or tool mix.
- Candidate interpretations for unusual changes.

An LLM cannot measure these parts:

- User intent or the reason for a tool choice.
- Whether a shell command means testing, research, debugging, or deployment without a fixed rule.
- Whether two sessions share one goal.
- Workflow quality, effectiveness, preference strength, or causality.
- Any skill or agent invocation that the harness does not mark.

The product must label LLM text as a draft. The measured facts must remain available beside that draft.

## Local data and consent

The current aggregate stores counts and sets. It does not store event order or per-session event groups.
[Aggregate](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/shared/aggregate.ts#L96-L153)

The current payload ships activity totals, model aggregates, approved name shares, coverage, and excluded-token counts.
[Payload](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/shared/payload.ts#L383-L427)

The name filter runs before the send. Unapproved names remain local, while the payload reports only withheld-name counts.
[Name filter](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/harness/shared/payload.ts#L142-L172)

New workflow extraction must keep these items local:

- Prompt text, response text, reasoning text, tool arguments, and tool output.
- Commands, paths, repository names, session identifiers, and exact timestamps.
- Full event sequences and per-session event graphs.
- Unapproved skill, agent, MCP, command, and extension names.

Only user-approved aggregates can leave the machine. A cloud LLM needs two separate consent stages:

1. Show the exact derived facts and approved names that the cloud LLM will receive.
2. After the draft returns, show the exact public payload with the draft and its supporting facts.

The first approval permits drafting. It does not permit public publication.

The second approval permits publication to AI Stack. A local LLM skips the first transfer approval, but publication still needs approval.

The publish action must send the staged bytes that the user approved.
[Staged send](https://github.com/alp82/aistack/blob/3c3ad6823ea029c745b2198967b4585c2f199ff7/packages/cli/src/sync/stage.ts#L1-L15)

## Recommended boundary

Build one local event reducer per harness. Keep its event graph in memory and emit versioned aggregates only.

Use explicit markers first. Use fixed classifiers for proxy metrics, and publish each classifier version with its result.

Keep unsupported facts absent. Do not use an LLM to fill a missing measurement.

Add workflow fields only through a new closed payload schema. Apply the existing name filter and staged approval to every new field.
