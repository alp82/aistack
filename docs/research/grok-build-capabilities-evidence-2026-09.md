# Grok Build workflow, inventory, and auto-sync evidence

Investigated 2026-09-08 for [Establish Grok Build workflow, inventory, and auto-sync capabilities](https://github.com/alp82/aistack/issues/365). This report resolves the evidence investigation, not the product or collection decisions. No private sessions, hook installation, Grok login, or backend writes were used.

Upstream evidence is pinned to xAI's `grok-build` revision `75810042ca2762aa0b0fa17864f3f68823ccbea5`. AI Stack integration observations use revision `71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08`. Sources were read from the first-party checkout and the official GitHub page. Implementation proposals below are identified as recommendations rather than upstream guarantees.

## Conclusion

A native adapter can support historical activity, session timing, model usage, thinking tokens, tool-based workflow, and configured inventory. Delegation and skills require careful persisted-event joins. Context is a real limitation: Grok's per-response usage notification is forwarded live but is not persisted through its actual producer path. Turn aggregates cannot reconstruct the existing per-call context histogram or first-call decomposition. Auto-sync can use native hooks, but an immediate Stop callback races usage persistence. [Usage shape][usage], [notification schema][notifications], [buffered producer][turn], [buffered consumer][updates]

The strongest planning boundary is a historical adapter plus optional prospective capabilities chosen explicitly in the collection decision. Do not advertise every row simply because Grok has a similarly named event. AI Stack computes its own phases and requires combinable daily atoms and sufficient coverage. [AI Stack daily wire][daily], [phase rules][phases]

## Capability matrix

“Supported” means an evidenced source is sufficient in principle; it does not mean an adapter or real-session test exists. “Conditional” means omit the reading unless the needed join, provenance, and completeness are established. “Unavailable” applies to historical native files inspected here.

| Existing family | Status and evidence | Adapter requirement or limitation |
| --- | --- | --- |
| When work happens | Supported: timestamped `events.jsonl` has turn/tool events; persisted ACP updates also carry timestamps. [Event writer][event-log], [event types][events], [disk envelope][storage] | Choose one activity event stream. Do not count streaming text chunks as independent actions or count the same tool in both streams. |
| Session starts and parallel projects | Supported with conditional lineage handling: session information plus timestamps and workspace data support local session and project identities. [Storage and copying][storage] | Resumes, forks, child sessions, and copied history must follow the collection identity decision. CWDs remain local for Git extraction. |
| Late-night commits, lines changed, languages | Supported through AI Stack's existing Git extraction from windowed session working directories. [Local workflow extraction][extract] | These are Git facts. Missing repositories produce missing Git evidence; Grok tool success does not establish a commit. |
| Session length, phases, playbook | Conditional: tool ACP updates contain raw input, call IDs and canonical tool metadata; telemetry has tool timing and outcomes. [Tool emission][tool-calls], [event types][events] | Normalize native read/search/edit/terminal/question tools into phase rules. Shell arguments distinguish verification and `gh pr merge`. Use existing waiting/idle rules, unknown-time gate, per-session histograms and median split; Grok `PhaseChanged` describes runtime states, not AI Stack scout/build/verify/handoff. |
| Models used | Supported total routing from per-turn `modelUsage`; conditional main/subagent split. [Usage file][usage], [subagent schema][notifications] | Parent totals can contain child usage. Never assign all parent totals to main and add child totals again. Unknown allocation remains unavailable. |
| Subagents | Conditional: persisted notification variants identify parent, child, attempt, spawn/finish, model, and tool-call counts. [Subagent schema][notifications] | Join spawn/finish and child records, distinguish resumes/attempts, handle unfinished children and gaps. Width requires actual overlapping lifetimes. `tokens_used` is context usage, not a billing ledger. Parent and child tool counts cannot both count the same calls. |
| Effort levels | Conditional, limited: `ModelChanged` can carry effective `reasoning_effort`, but the event schema does not give every response an effort field. [Notification schema][notifications], [event types][events] | Do not use today's config or final session effort for old turns. Only emit with a verified effective-state timeline and correct response denominator. Otherwise leave absent. |
| Thinking tokens | Supported where reported: usage rows carry `reasoningTokens` and output. [Usage file][usage], [usage projection][notifications] | Reasoning is a subset of output. Missing upstream usage must not become measured zero or an invented thinking count. |
| Turn length | Supported for recent complete records: `TurnCompleted.elapsed_ms` is durable and optional on older files; paired turn-start/end timestamps are an alternative with coverage checks. [Notification schema][notifications], [event types][events] | Keep turn wall time distinct from accumulated API time; exclude missing pairs rather than fabricate durations. |
| Questions asked | Conditional: native `ask_user_question` is a concrete interaction marker; pending/resolved interaction notifications themselves are explicitly live-only. [Notification schema][notifications], [tool emission][tool-calls] | Map actual persisted tool identity and clarify what counts as a turn ending in a question under existing rules. Do not scan prose for question marks or count every permission request as a question-back turn. |
| Web searches | Conditional: native `web_search` and hosted tools can be observed as tool calls. [Tool dispatcher][tool-dispatch], [event types][events] | Preserve attempted versus executed/failed distinctions, account for hosted variants, deduplicate tool-start/completion records. Empty evidence is not a supported zero until tool coverage is established. |
| Skills and MCP kit | Conditional observed usage plus supported configured inventory. MCP telemetry gives server/tool/call IDs; native Skill calls have tool arguments; compatible and plugin skills have distinct origins. [Event types][events], [tool emission][tool-calls], [skills guide][skills] | A configured skill or connected MCP server is not use. Slash-invoked/injected skills need separate evidence and fixtures; do not infer activation merely from `AvailableCommandsUpdate` or a discovered `SKILL.md`. |
| Context histograms, first-call harness/instructions, maximum context | Unavailable historically from the inspected standard paths: `ResponseCompleted` contains per-call usage, but `turn.rs` sends it through `send_buffered_xai_update`, whose xAI branch forwards to the gateway without persistence. [Producer][turn], [consumer][updates] | `usage.json` sums calls per turn. Dividing by `modelCalls`, reading final token utilization, or treating the whole turn as a call would invent the histogram and first-call facts. Prospective capture is a separate collection option. |
| Compactions and context-window size | Partial evidence: compaction checkpoints exist and subagent progress has context-window fields. [Notification schema][notifications] | Compaction counts alone do not establish per-call Context support. Do not create a populated Context block with fake zero histograms. An observed window value must retain its actual session/model scope. |

This covers every current fixed row, plus the separate Context surface. AI Stack's row builder suppresses unavailable measurements, keeps a fixed order, and exposes coverage. Adding a harness name alone does not make these measurements available. [Row registry][rows], [daily wire][daily]

## Inventory: configuration, availability, and observed use

MCP configuration can come from user and project Grok TOML, Claude, Cursor, standard `.mcp.json`, and plugins. Project discovery walks CWD to Git root; compatibility switches, disabled servers, source priority and folder trust affect effective availability. `grok mcp list` describes configuration, while `McpToolCallStarted/Completed` establish observed invocation. Connection/discovery events establish availability, not invocation. Read only names and safe provenance for measured inventory; never include credential files, headers, environment secrets, URLs with credentials, or raw MCP output in aggregate payloads. [MCP guide][mcp], [MCP events][events]

Skills include native `.grok/skills`, `.grok/commands`, `.agents`, compatibility directories, configured extra paths, and plugins. Name precedence, disabled/ignore lists and folder trust matter. A scan should distinguish configured presence from effective availability and measured invocation, retain source provenance, and deduplicate aliases of the same component. Plugin skills can use qualified names. [Skills guide][skills], [slash-command projection][slash]

Plugins bundle skills, agents, hooks and MCP servers. Installed, enabled and trusted are separate states; marketplaces list available packages rather than installed usage. `grok plugin list --json` is a potential inventory seam; `--available` broadens it and must not be interpreted as installed inventory. Component attribution needs a verified manifest/source mapping; a bare tool call does not prove which plugin owned it. [Plugin guide][plugins]

For instructions, memory, commands, hooks and agents, native configuration discovery provides a possible authored-resource collection path. That is separate from measured inventory and must keep AI Stack's resource preview/consent behavior. Do not dump the whole Grok home merely to maximize support. The measured workflow wire explicitly keeps local paths, timestamps, arguments and session keys off the server. [Workflow extraction][extract], [plugin guide][plugins], [skills guide][skills]

## Auto-sync evidence and recommended boundaries

Native hook events include SessionStart/End, prompt submission, pre/post tool execution and failures, permission denial, Stop/StopFailure/StopCancelled, Notification, subagent start/stop, and pre/post compaction. `SubagentEnd` aliases SubagentStop. Common payload metadata includes session, workspace, timestamp and prompt identity where applicable. Source merging and canonicalization are implemented in the hook system. [Event names][hook-events], [hook discovery][hook-discovery]

A dedicated global JSON file in Grok's hooks directory is the recommended ownership boundary for installation. The global source is trusted; project trust grants cover more than hooks, including MCP/LSP, instructions and skills, so installation should not grant project trust. Preserve all user hook sources and disable/remove only the exact AI Stack-owned source. Reload or restart is needed for newly written hooks; runtime disable state also matters. [Hook trust][hook-trust], [hook discovery][hook-discovery], [hook guide][hooks]

Grok imports compatible Claude and Cursor hooks by default. AI Stack already installs a Claude SessionStart command, so Grok may execute that existing source even before native support lands. Equivalent definitions can be deduplicated upstream, but different wrappers or event choices need not deduplicate. AI Stack's global frequency/permission checks mitigate repeated runs, but they do not remove the need to handle imported sources, consent state and installation provenance. Do not disable the user's compatibility settings to solve this. [Hook discovery][hook-discovery], [AI Stack existing hook][local-hook], [auto-sync opt-in][optin]

Do not assume Claude's `async: true` has identical semantics in Grok: Grok's parsed hook handler/spec does not expose that option. Hook command execution has its own timeout and shell routing. A proposed native launcher needs bounded runtime and explicit process handling. Unix uses `sh -c` for shell commands; Windows selects a Windows shell and rewrites some variable syntax. Test macOS/Linux and Windows independently, including spaces in executable paths and PowerShell/cmd behavior. A POSIX `&` wrapper is not a universal Windows launch strategy. [Hook config][hook-config], [command runner][runner]

The key race is established directly in code: `run_stop_gate` occurs in `turn.rs` before turn-end reporting and before `persist_live_usage`. The latter enqueues `PersistenceMsg::UsageTurn`; awaiting that function does not mean the file has been written. Stop can also cause continuations. Failure/cancel reporting precedes the same persist call. SessionEnd additionally dispatches a Stop-shaped observation. An immediate callback read therefore cannot guarantee inclusion of the final completed turn. [Turn ordering][turn], [session teardown][teardown]

Recommended trigger decision: retain SessionStart as catch-up, and choose explicitly whether fresher completed-turn publication merits a detached/coalesced readiness retry. SessionStart naturally misses the current session until a later trigger. Stop alone misses cancelled/error sessions and may repeat before a true terminal state. SessionEnd is not guaranteed after a crash. No fixed sleep is a proof of persistence. Use bounded rereads of terminal record/usage state and leave uncertain work eligible for later catch-up; preserve revocation and offline behavior. This is a recommendation, not a claimed upstream durable-hook contract. [Turn ordering][turn], [existing start-trigger rationale][local-hook]

Avoid invoking a Grok agent from its hook. A read-only filesystem collector does not create a new Grok session; an agent launch could trigger more hooks and work. Keep all hook stdout empty and do not return block/additional-context directives, which can restart model work. Deduplicate triggers at the machine/session/prompt level where available and retain AI Stack's account consent and global throttle as the final publication gate. [Stop behavior][hooks], [auto-sync ownership][optin]

## Integration and fixture requirements

AI Stack currently enumerates four harnesses in the shared rules and owns a per-harness handoff marker map. Adapter registration must travel with labels, rule coverage, the actual-usage share display and sync support copy. Auto-sync reconciliation currently implements Claude/Codex installations. The Grok native tool catalog identity needs verification against real catalog rows at execution time, after the mandated database mirror; this investigation does not assume that row already exists. [Harness types][harness-types], [phase rules][phases], [auto-sync opt-in][optin], [workflow copy][copy], [share display][share], [sync page][sync-page]

Required synthetic fixtures and owner-run checks before claiming complete support:

1. Persisted tool metadata and raw input for read/search/edit/shell/verification/merge/question/web/Skill/MCP. Include failures, rewrites, malformed arguments, unknown tools and duplicate updates. Assert aggregate wire contains no prompts, paths, URLs, raw arguments or output.
2. UTC day boundaries, resume, fork, worktrees, missing repository, truncated JSONL, missing events, copied updates, deleted parent, old records without elapsed time and mixed versions. Assert daily replace semantics and unchanged totals on repeat sync.
3. Nested/concurrent/resumed/unfinished subagents, child context versus billing tokens, child usage folded into parent, duplicate finish notifications and missing child files. Assert no double count and no invented width or routing split.
4. Multiple model calls per turn, reasoning as an output subset, partial/missing usage, model switches, missing effort timeline, and compaction. Assert Context stays absent for historical files lacking per-call data.
5. Configured but unused skills/MCP/plugins, disabled/trust-blocked sources, native and compatibility duplicates, plugin-qualified names, shadowing, custom paths and secret-bearing configs. Assert configured presence never inflates observed counts.
6. Hook install twice, user hook coexistence, import from Claude/Cursor, malformed source, disable/reload/remove, uninstall twice, relocated home, no package cache/network, permission revocation and auto-sync disabled.
7. Stop before persistence, repeated stop gates, delayed writes beyond initial retry, cancellation, API error, child completion, SessionEnd, concurrent sessions, crash and next-start catch-up. Assert no model-continuation loop, no permanently skipped terminal turn and no cross-server credential mistake.
8. Owner-run Linux/macOS/Windows smoke checks for the actual Grok release, hook reload and launcher completion. These remain empirical acceptance work, not facts established by reading source.

## Evidence links

[usage]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/usage_file.rs

[notifications]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/extensions/notification.rs

[turn]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/acp_session_impl/turn.rs

[updates]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/acp_session_impl/updates.rs

[event-log]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-session-events/src/log.rs

[events]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-session-events/src/types.rs

[storage]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/storage/mod.rs

[tool-calls]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/acp_session_impl/tool_calls.rs

[tool-dispatch]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/acp_session_impl/tool_dispatch.rs

[skills]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-pager/docs/user-guide/08-skills.md

[mcp]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-pager/docs/user-guide/07-mcp-servers.md

[plugins]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-pager/docs/user-guide/09-plugins.md

[hooks]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-pager/docs/user-guide/10-hooks.md

[slash]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/slash_commands.rs

[hook-events]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-hooks/src/event.rs

[hook-discovery]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-hooks/src/discovery.rs

[hook-trust]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-hooks/src/trust.rs

[hook-config]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-hooks/src/config.rs

[runner]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-hooks/src/runner/command.rs

[teardown]: https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/acp_session_impl/run_loop.rs

[daily]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/packages/workflow-rules/src/daily.ts

[phases]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/packages/workflow-rules/src/phaseRules.ts

[extract]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/packages/cli/src/workflow/extract.ts

[rows]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/packages/workflow-rules/src/workflowRows.ts

[local-hook]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/packages/cli/src/autosync/hook.ts

[optin]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/packages/cli/src/autosync/optin.ts

[harness-types]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/packages/workflow-rules/src/types.ts

[copy]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/src/features/workflow/copy.ts

[share]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/src/features/usage/HarnessShareRows.tsx

[sync-page]: https://github.com/alp82/aistack/blob/71cf6fdc98fecbb1f180b7e3c3dc07fb4eee9d08/src/routes/sync.tsx
