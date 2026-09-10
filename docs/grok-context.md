# Grok context measurements

The CLI reads `shell.turn.inference_done` entries from
`$GROK_HOME/logs/unified.jsonl` (default `~/.grok/logs/unified.jsonl`). Each
entry reports one inference's `prompt_tokens`, including its cached tokens.
Turn totals in `usage.json` still own usage and cost accounting.

This source supplements the historical adapter. The earlier Grok investigation
correctly identified that `ResponseCompleted` notifications are not persisted,
but missed the separate numeric inference log.

Only entries for discovered local sessions are collected. AI Stack retains a
numeric projection under `~/.config/aistack/grok-context/<root-hash>/`, in dated
append files: a deduplication ID, session ID, timestamp, and prompt token count.
No log text, prompts, URLs, or response content is copied into this cache or
published. Duplicate entries fold once. Captures expire after 400 days; scanning
a shorter display window does not shorten that retention. Cache read/write
failures defer measured-day publication through the existing incomplete-scan gate.

Grok trims its unified log at 5 MiB. The page therefore labels these as retained
calls and says some calls may be missing. Calls that rotated out before an AI
Stack scan cannot be recovered. Removing the local AI Stack cache also removes
its retained history. This is a sample of recorded calls, not proof of complete
session coverage.

The log does not establish a first-call harness/instructions split. The map shows
the median and p90 total call sizes and labels the split unavailable. Its window
comes from the measured model's catalog row. If no catalog window is known, or
a call exceeds that window, the page shows the numeric reading without a grid.
Grok never inherits Claude Code's window tiers. The existing `publishWorkflow`
gate continues to control publication and public reads.

Deploy the backend and web changes before releasing the CLI. After updating the
CLI, the owner runs an ordinary sync. No new hook, launcher, API credential,
upstream patch, or schema migration is required. The map needs at least one
retained main-session inference entry; older Grok versions without that log
entry still show no reading.

## Evidence

Verified against xAI's source revision
`37949780c144e37df692e3d669051a21fec24f20`:

- [Per-call inference log producer](https://github.com/xai-org/grok-build/blob/37949780c144e37df692e3d669051a21fec24f20/crates/codegen/xai-grok-shell/src/session/acp_session_impl/turn.rs#L3140).
- [Local log envelope, path, and rotation](https://github.com/xai-org/grok-build/blob/37949780c144e37df692e3d669051a21fec24f20/crates/codegen/xai-grok-telemetry/src/unified_log.rs).

Validation uses source-shaped log fixtures through the real scanner and reducer,
backend query tests, and the rendered context component. A live Grok sync with
the updated CLI remains an owner-run release check.
