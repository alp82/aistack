# Codex CLI session-log anatomy + hook mechanism — primary-source research

Research for the Codex harness (issue #65, wayfinder map #60). Question: what do Codex CLI
session logs contain, can the deterministic P0 extraction (inventory, usage-share, recency,
cost from tokens) run against them, and what mechanism can carry the silent daily loop?

Method: direct inspection of `~/.codex` on this machine (structure only — no conversation
content reproduced), plus source reading of `openai/codex` at tag **rust-v0.146.0** and the
official docs. Date: 2026-08-01.

**Local evidence base:** `codex-cli 0.146.0` installed; session files from 2026-04 through
2026-07 with `session_meta.cli_version` values 0.125.0–0.145.0. Claims marked "(observed)"
come from these files. Source permalinks pin tag `rust-v0.146.0`.

---

## 1. Location and format

**Path (observed + source):** `~/.codex/sessions/YYYY/MM/DD/rollout-<YYYY-MM-DDThh-mm-ss>-<uuid>.jsonl`

- `sessions` and `archived_sessions` subdirs of `$CODEX_HOME` (default `~/.codex`):
  [`codex-rs/rollout/src/lib.rs` L25–26](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/lib.rs#L25-L26).
- Filename timestamp format `%Y-%m-%dT%H-%M-%S`:
  [`codex-rs/rollout/src/metadata.rs` L385](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/metadata.rs#L385).
- The uuid in the filename is the session/thread id (UUIDv7 — time-ordered; observed, and
  it equals `session_meta.payload.id`).
- **Rollouts can be zstd-compressed to `.jsonl.zst`.** The reader handles both plain and
  compressed files: [`codex-rs/rollout/src/compression.rs` L18, L43](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/compression.rs#L18).
  No `.zst` files exist locally yet, but the adapter glob must include them.

**Line envelope (observed):** every line is `{"timestamp": "<ISO-8601 Z>", "type": "<tag>", "payload": {...}}`.

**Line types** — the `RolloutItem` enum, serde-tagged `type`/`payload`, snake_case
([`codex-rs/protocol/src/protocol.rs` L3184–3199](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/protocol/src/protocol.rs#L3184-L3199)):

| `type` | payload |
|---|---|
| `session_meta` | first line: `id`/`session_id`, `timestamp`, `cwd`, `originator` (`codex-tui`, `codex_exec`), `cli_version`, `source` (`cli`/`exec`), `model_provider`, `base_instructions`, git info (observed) |
| `response_item` | one Responses-API item (`ResponseItem` enum, see §4) |
| `turn_context` | per-turn settings incl. `model`, `effort`, `cwd`, `approval_policy`, `sandbox_policy`, `turn_id` (observed) |
| `event_msg` | UI events incl. `token_count`, `user_message`, `agent_message`, `task_started`, `task_complete`, `exec_command_end` (observed; see §2) |
| `compacted` | context-window compaction record |
| `world_state` | world-state snapshot/patch |
| `inter_agent_communication`(+`_metadata`) | multi-agent delivery records |

**Adjacent files (observed):** `~/.codex/session_index.jsonl` (one line per session:
`{id, thread_name, updated_at}`) and `~/.codex/history.jsonl` (cross-session user prompts:
`{session_id, ts, text}` — contains raw prompt text, do not upload).

## 2. Usage/token records and dedup semantics

**Record:** `event_msg` with `payload.type == "token_count"` (observed). Payload:

```json
{"type":"token_count",
 "info": {
   "total_token_usage": {"input_tokens":..., "cached_input_tokens":..., "cache_write_input_tokens":..., "output_tokens":..., "reasoning_output_tokens":..., "total_tokens":...},
   "last_token_usage":  {... same fields ...},
   "model_context_window": 258400},
 "rate_limits": {"primary": {"used_percent":..., "window_minutes":10080, "resets_at":...}, "plan_type":"plus", ...}}
```

Struct definitions: `TokenUsage` and `TokenUsageInfo`,
[`codex-rs/protocol/src/protocol.rs` L2056–2079](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/protocol/src/protocol.rs#L2056-L2079).

**Semantics — pinned in source:**

- `last_token_usage` is the **per-model-response delta**. `total_token_usage` is the running
  session sum: `append_last_usage` does `total.add_assign(last); last_token_usage = last`
  ([protocol.rs L2108–2111](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/protocol/src/protocol.rs#L2108-L2111)).
- **The cumulative gotcha exists, inverted from Claude Code.** Claude Code logs per-message
  usage that can repeat across snapshot lines. Codex logs a *cumulative* total on every
  `token_count` line. Naive `sum(total_token_usage)` over a session's 20+ token_count lines
  overcounts by orders of magnitude (observed: a session whose real total is ~1.5M sums to
  ~10M+). **Rule: per session, either take the LAST `token_count` line's
  `total_token_usage`, or sum `last_token_usage` across lines. Prefer summing
  `last_token_usage` — cost needs the per-response cached/non-cached split anyway.**
- `cached_input_tokens` is a **subset** of `input_tokens`:
  `non_cached_input = input_tokens - cached_input`
  ([protocol.rs L2220–2226](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/protocol/src/protocol.rs#L2220-L2226)).
  So cumulative `input_tokens` re-counts the cached prefix on every turn — another reason
  cost must come from per-response deltas, priced cached vs non-cached.
- `reasoning_output_tokens` is a subset of `output_tokens` per Responses-API usage
  semantics (`output_tokens_details.reasoning_tokens`); do not add it on top.
- **Caveats to verify in the grilling:** (a) `fill_to_context_window`
  ([protocol.rs L2113+](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/protocol/src/protocol.rs#L2113))
  can overwrite `total_token_usage` with a synthetic value — one more reason to avoid the
  "last total" variant. (b) Forked sessions copy prior `RolloutItem` history into a new file
  (`Forked(Vec<RolloutItem>)`, [protocol.rs L2552](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/protocol/src/protocol.rs#L2552));
  whether copied history includes past `token_count` events (→ cross-file double count)
  needs an empirical check. Resumed sessions append to the same file (observed: one file
  per session id).

## 3. Model ids

The model id is **per turn**, in `turn_context.payload.model` (observed). It is the vendor
slug. Observed locally across sessions: `gpt-5.5`, `gpt-5.4`, `gpt-5.3-codex`,
`gpt-5.3-codex-spark`. The local model catalog cache (`~/.codex/models_cache.json`) also
lists `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.4-mini`, `codex-auto-review`
as `slug` values ("Model slug (e.g., \"gpt-5\")":
[`codex-rs/protocol/src/openai_models.rs` L207, L371](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/protocol/src/openai_models.rs#L370-L371)).

`token_count` events carry **no model field** — attribute each usage delta to the model of
the nearest preceding `turn_context`. `session_meta` has no model either. `turn_context`
also carries `effort` (reasoning effort, e.g. `xhigh`) — useful signal, free to capture.

## 4. Tool, MCP, and skill surfaces

`response_item` payloads are `ResponseItem` variants
([`codex-rs/protocol/src/models.rs` L799+](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/protocol/src/models.rs#L799)):
`message`, `reasoning`, `function_call` / `function_call_output`, `local_shell_call`,
`custom_tool_call`, `web_search_call`, `tool_search_call`, etc.

- **Built-in tools** appear as `function_call` with `name` (observed names: `exec_command`,
  `write_stdin`, `request_user_input`; older sessions also show `web_search_call` items and
  `event_msg` types `exec_command_end`, `patch_apply_end`, `web_search_end`).
- **MCP tools** are exposed to the model as `<server>__<tool>` —
  `MCP_TOOL_NAME_DELIMITER = "__"`
  ([`codex-rs/codex-mcp/src/tools.rs` L225](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/codex-mcp/src/tools.rs#L225)) —
  so MCP calls land in the rollout as `function_call` items with that qualified name
  (plus an optional `namespace` field on the item). Over-long names get a sha1 hash suffix
  (same file, L236–243). Split on the first `__` to recover the server name.
  MCP servers are configured in `~/.codex/config.toml` (`[mcp_servers.*]`) — config is a
  second, static inventory source alongside log observation.
- **Skills exist in Codex** (`~/.codex/skills/`, docs:
  <https://developers.openai.com/codex/skills>; the models catalog has
  `include_skills_usage_instructions`). How a skill invocation surfaces in the rollout is
  **unverified** — no skill use in the local corpus. Flag for the grilling; do not promise
  skill inventory for Codex v1.

## 5. Pricing sources

- Official page: <https://platform.openai.com/docs/pricing> (redirects to
  <https://developers.openai.com/api/docs/pricing>). Fetched 2026-08-01: gpt-5.5
  $5.00 / $0.50 cached / $30.00 output per 1M (<272K context); gpt-5.4 $2.50 / $0.25 /
  $15.00; gpt-5.4-mini $0.75 / $0.075 / $4.50. Cached input is consistently **10% of
  input**. Long-context (>272K) tiers price differently — note `model_context_window`
  258400 observed, so standard tier applies today.
- **No official machine-readable pricing source exists** (the page is HTML only;
  `models_cache.json` carries no price fields). Same situation as Anthropic → the aistack
  models catalog stays the pricing source of truth, extended with OpenAI slugs.
- Cost formula per response: `non_cached_input × in_price + cached_input × in_price × 0.1
  + output_tokens × out_price` (reasoning tokens are inside `output_tokens`).
- **ChatGPT-plan sign-in:** `~/.codex/auth.json` has `auth_mode: "chatgpt"` (observed);
  `token_count.rate_limits` carries `plan_type` (`"plus"`) and percent-of-window usage,
  not dollars. The rollout format is the same regardless of auth mode. Plan usage has no
  per-token dollar cost — cost is imputed API-equivalent, exactly like Claude
  subscription usage. `rate_limits.used_percent` is an honest extra signal if wanted.

## 6. Hook mechanism — the silent-loop verdict

**Codex has a Claude-style hooks system today** (shipped, gated by `[features] hooks = true`
in `config.toml`; enabled by default in recent releases — observed active on 0.146.0).
Docs: <https://developers.openai.com/codex/hooks>. Config crate:
[`codex-rs/config/src/hook_config.rs`](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/config/src/hook_config.rs).

- **Events** (`HookEventName`,
  [schema/typescript/v2/HookEventName.ts](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/app-server-protocol/schema/typescript/v2/HookEventName.ts)):
  `preToolUse`, `permissionRequest`, `postToolUse`, `preCompact`, `postCompact`,
  **`sessionStart`**, `sessionEnd`, `userPromptSubmit`, `subagentStart`, `subagentStop`, `stop`.
- **File:** `~/.codex/hooks.json` (observed in use locally; also repo-level
  `.codex/hooks.json`, TOML form, and plugin hooks). Shape mirrors Claude Code:
  `{"hooks": {"SessionStart": [{"matcher": "startup|resume", "hooks": [{"type": "command", "command": "...", "timeout": 600}]}]}}`.
  `SessionStart` matchers: `startup|resume|clear|compact` (docs +
  [`codex-rs/hooks/src/events/session_start.rs`](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/hooks/src/events/session_start.rs)).
  Hook stdin JSON includes `session_id`, `cwd`, `hook_event_name`, `model`,
  `transcript_path`, `permission_mode` (docs).
- **`async` is parsed but NOT honored** — the field exists in `HookHandlerConfig`
  ([hook_config.rs L149+](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/config/src/hook_config.rs#L149)),
  but the runner spawns and **awaits** the process with a timeout and `kill_on_drop`
  ([`codex-rs/hooks/src/engine/command_runner.rs` L66, L103–104](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/hooks/src/engine/command_runner.rs#L103-L104)),
  and the docs state async hooks are unsupported. **The hook command must background
  itself**: spawn the real work detached (`setsid`/`nohup`, fds redirected), exit 0
  immediately. `kill_on_drop` kills only the hook process, not a properly detached child.
- **Trust gate:** each hook's sha256 is pinned as `trusted_hash` under `[hooks.state]` in
  `config.toml` (observed). An untrusted or changed hook does not run; the user reviews via
  the `/hooks` command in Codex (docs). **Programmatic install therefore needs a user
  step:** write the hook, then tell the user to open Codex and trust it via `/hooks`.
  This is real onboarding friction Claude Code does not have.
- **`sessionEnd` is unusable for us:** default timeout 1 s, max 3 s (docs) — consistent
  with our SessionStart-over-SessionEnd choice for Claude Code anyway.
- **Fallback if hooks are disabled:** the legacy `notify` config still exists — an external
  program invoked after each turn with an `agent-turn-complete` JSON payload
  ([`codex-rs/hooks/src/legacy_notify.rs`](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/hooks/src/legacy_notify.rs)).
  It fires per turn, not per session start, but a throttled wrapper could carry the daily
  loop. OS schedulers (cron/systemd/launchd) remain the last resort. Neither should be v1.

## Implications for the aistack adapter

1. **Glob:** `~/.codex/sessions/**/*.jsonl` **and** `**/*.jsonl.zst` (zstd), honoring
   `$CODEX_HOME`. Skip `archived_sessions` or include it deliberately. Never touch
   `history.jsonl` (raw prompts).
2. **Parse:** lines `{timestamp, type, payload}`. Needed types: `session_meta` (session id,
   cwd, cli_version, originator), `turn_context` (model, effort), `event_msg` /
   `token_count` (usage), `response_item` / `function_call` (tool + MCP inventory).
3. **Usage dedup rule:** sum `info.last_token_usage` per session; never sum
   `total_token_usage` (cumulative). Attribute each delta to the nearest preceding
   `turn_context.model`. Open check: forked-session history replay.
4. **Cost:** `non_cached_input × in + cached × in/10 + output × out`; catalog needs OpenAI
   slugs (`gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex`, `gpt-5.6-*`); no
   machine-readable vendor price feed; plan usage = imputed cost (plan type available in
   `rate_limits.plan_type`).
5. **Recency:** filename timestamp or `session_meta.timestamp`; UUIDv7 ids are
   time-ordered.
6. **Inventory:** built-in tool names from `function_call.name`; MCP = names containing
   `__` (split on first occurrence → server); static MCP list from `config.toml`
   `[mcp_servers]`; skills surface unverified — defer.
7. **Silent loop verdict: `SessionStart` command hook in `~/.codex/hooks.json`, with a
   self-backgrounding command** (no honored `async` flag), plus a one-time user trust step
   via `/hooks`. Enable/disable must edit `hooks.json` and respect the trust-hash
   re-review on every edit.
