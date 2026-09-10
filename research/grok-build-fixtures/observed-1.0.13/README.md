# Observed Grok Build 1.0.13 session

Owner-authorized capture on 2026-09-08 from `grok 1.0.13 (5e9a58528b76) [stable]`, Linux x86_64. The selected recording was stable across the capture reads. The owner described the session as running; its persisted records already contained a terminal turn with `stop_reason: rate_limit` and `elapsed_ms: 151589`. This does not imply the interactive process had exited.

## Material difference from the planning source

This installation rejects `grok help usage` with exit 2 and `unrecognized subcommand 'usage'`. `grok usage --help` displays top-level help. We did not invoke `grok usage <session-id>`, because an unsupported command might be interpreted as a prompt. No `usage.json` exists in the selected session directory, even after a terminal record was persisted.

Instead, `updates.jsonl` holds `_x.ai/session/update` with `params.update.sessionUpdate: turn_completed`, a prompt identifier, elapsed time, and a usage object with per-model breakdown. It is a candidate historical usage source for this release. This invalidates treating the newer usage-file format as the only available released format. It does not prove sidecars never exist in any other recording or later version.

Public GitHub lookup of the binary's build prefix `5e9a58528b76` returned HTTP 422. The research source pin `75810042ca2762aa0b0fa17864f3f68823ccbea5` is not established as this binary's source.

## Checks performed

- One persisted turn start, one turn end and one `turn_completed` update.
- The terminal usage reports 613759 input tokens, 5082 output tokens and 618841 total tokens. Per-model totals agree; the recorded model is `grok-4.6`.
- Cached read tokens (527360) are within input tokens; reasoning tokens (1930) are within output tokens. These are subsets, not extra tokens to add to the total.
- `modelCalls` and `numTurns` both equal 14 beside one user turn. This sample directly rules out interpreting `numTurns` as the number of user turns.
- All 30 tool-call identifiers in `updates.jsonl` join exactly to 30 tool completions in `events.jsonl`. Native tool names observed: `search_tool`, `read_file`, `grep`, `list_dir`, and `run_terminal_command`.
- Persisted hook event names include `session_start`, `user_prompt_submit`, `pre_tool_use`, `post_tool_use` and `stop_failure`. This does not identify hook source ownership, import behavior, or validate an AI Stack launcher.
- JSON parsing, aggregate arithmetic, model sums, identifier joins, excluded-field checks and no-em-dash checks passed on the retained pack.

The public source's `PromptUsage::from` maps `num_turns` from `ledger.main_loop_model_calls`. `snapshot_prompt_usage_marked` reads a prompt ledger, and the turn-end emitter persists `TurnCompleted`. These are corroborating source clues, not a proof that this release behaves identically on multiple prompts or resume. See [notification projection](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/extensions/notification.rs), [prompt snapshot](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/acp_session_impl/turn.rs), and [durable emitter](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/acp_session_impl/turn_end.rs).

## Sanitization

This is a transformed observation, separate from the wholly constructed cases in the parent directory. All retained identifiers are replaced consistently. Timestamps are shifted by a common whole-day offset, preserving durations and UTC-day relationships. Workspace and prompt text are artificial. Raw tool inputs/outputs, transcript text, account identifiers, hook names/output, configured component names and reported dollar amounts are omitted. `provenance.json` lists raw and retained event counts; these files are intentionally incomplete projections, not full replayable native sessions. Originals were not modified.

## Remaining gaps

A second completed prompt in the same session and a resumed/forked pair are needed to distinguish per-prompt versus cumulative counters and copied terminal identities empirically. No subagents, restored sessions, provider switches, custom aliases, missing usage, successful completion, or historical date movement are qualified by this capture. Argument-dependent workflow proxies require suitable sanitized argument fixtures. There are no platform launcher, hook-installation or publication checks.

The fixture task remains open. A separate decision must set support and source precedence for released event-based usage versus newer sidecars, prevent counting both when both exist, and define timestamp/catch-up behavior for the selected source. Previously settled consent, partial coverage, and SessionStart policy remain in force.
