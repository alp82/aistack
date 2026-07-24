# Claude Code transcripts as a metrics source — primary-source research

Research for auto-sync v1 (issue #30, wayfinder map #29). Question: what do `~/.claude`
transcripts actually contain, and how does prior art turn that into usage/cost numbers —
so a local analyzer can compute the P0 capture set (tool inventory, usage-share, recency,
cost) deterministically and honestly?

Method: direct inspection of local transcripts on this machine (structure only, via
`jq`/`grep` over field names — no content values reproduced here), plus source reading of
ccusage (Rust rewrite) and OpenUsage (Go). Date: 2026-07-24.

**Local evidence base:** ~3,200 JSONL files across 22 project directories, Claude Code
`version` field range **2.1.185 – 2.1.218** (files dated ~2026-06-24 through 2026-07-24).
Claims marked "(observed)" mean observed in these local files within that version range;
older formats are covered only via prior-art source code and flagged as such.

---

## 1. Transcript anatomy

### 1.1 Where sessions live

- Root: `~/.claude/projects/` (observed). ccusage additionally supports
  `$XDG_CONFIG_HOME/claude/projects` (i.e. `~/.config/claude/projects`) and a
  `CLAUDE_CONFIG_DIR` env var accepting one or more comma-separated config dirs
  ([paths.rs](https://github.com/ryoppippi/ccusage), `rust/crates/ccusage/src/adapter/claude/paths.rs`,
  and `rust/crates/ccusage/src/adapter/claude/README.md`).
- One directory per project, named by **munging the working directory path**: `/` and `.`
  become `-` (e.g. a cwd of `/home/<u>/dev/<proj>` becomes `-home-<u>-dev-<proj>`)
  (observed). The directory name is therefore itself a filesystem path in disguise —
  privacy-sensitive.
- Inside a project dir (observed):
  - `<sessionId>.jsonl` — the main session transcript (`sessionId` is a UUID).
  - `<sessionId>/subagents/agent-<hex>.jsonl` — one transcript per subagent (Task/Agent
    tool) launched by that session. Subagent records carry an extra `agentId` field and
    `isSidechain: true` on assistant records.
- ccusage's adapter also documents a legacy nested shape
  `projects/{project}/{sessionId}/{file}.jsonl` and scans recursively to catch both
  (adapter README). Analyzer implication: **scan recursively for `*.jsonl`**, don't
  assume flat layout.
- Malformed lines occur in the wild; both prior-art tools skip unparseable lines
  (ccusage adapter README: "Malformed JSONL lines are skipped during parsing").

### 1.2 Record types

Each line is one JSON object with a `type` discriminator. Types observed locally:

| type | meaning | frequency notes |
|---|---|---|
| `user` | user message or tool_result carrier | every session |
| `assistant` | one API response (the usage-bearing record) | every session |
| `system` | harness events; `subtype` discriminates | every session |
| `attachment` | injected context (hook output, reminders, listings) | common |
| `ai-title` | model-generated session title | common |
| `last-prompt` | cached last user prompt (`lastPrompt`, `leafUuid`) | common |
| `mode` | permission-mode change marker | common |
| `file-history-snapshot` / `file-history-delta` | file checkpointing bookkeeping | common |
| `queue-operation` | queued-message operations | occasional |

`system.subtype` values observed across all local files: `turn_duration` (has
`durationMs`, `messageCount`), `stop_hook_summary` (hook run info), `local_command`
(slash-command echo), `informational`, `scheduled_task_fire`, `agents_killed`,
`bridge_status`.

Not observed locally but documented in prior art for older versions: a `summary` record
type (compaction summaries). Zero `"type":"summary"` hits across all ~3,200 local files
(observed) — treat as version-dependent; do not rely on it.

### 1.3 Common envelope fields (per record)

Observed on `user`/`assistant`/`system` records:

- `uuid` — record id; `parentUuid` — previous record in the thread (linked-list
  threading; `null` at session start). Enables reconstructing turn structure and
  detecting branches (e.g. after edits/rewinds).
- `sessionId` — the session UUID (matches filename). A duplicated snake_case
  `session_id` also appears on some records (observed; redundant).
- `timestamp` — ISO-8601 UTC with milliseconds (e.g. `2026-07-24T00:29:42.472Z`).
- `type`, `userType` (observed value: `external`), `entrypoint` (observed value: `cli`),
  `isSidechain` (bool; `true` in subagent files), `version` (Claude Code version string),
  `cwd` (absolute working directory — **privacy-sensitive**), `gitBranch` (branch name —
  privacy-sensitive-ish).

Assistant-record extras (observed): `requestId` (per-API-call id, dedup key), `message`
(the API message), `effort` (e.g. reasoning-effort setting), and occasional attribution
fields `attributionSkill` / `attributionPlugin` / `attributionAgent` — these attribute a
response to the skill/plugin/agent context that produced it (recent additions; presence
varies across 2.1.x, do not assume).

User-record extras (observed): `promptId`, `isMeta` (harness-injected pseudo-user
messages), `toolUseResult` (structured tool result payload), `sourceToolUseID` /
`sourceToolAssistantUUID` (links a tool_result back to its tool_use), and on newer
versions `origin`, `permissionMode`, `promptSource`.

Subagent-file extras (observed): `agentId` on every record.

### 1.4 The assistant `message` object (usage bearer)

`message` keys observed: `id` (API message id, dedup key), `model`, `role`, `content[]`,
`stop_reason`, `stop_sequence`, `stop_details`, `diagnostics`, `usage`.

`message.usage` keys observed (all assistant records in the local version range):

- `input_tokens`, `output_tokens` — non-cached input / output.
- `cache_creation_input_tokens` — total cache-write tokens.
- `cache_read_input_tokens` — cache-hit tokens.
- `cache_creation` — object breaking writes down by TTL:
  `{ ephemeral_5m_input_tokens, ephemeral_1h_input_tokens }`.
- `service_tier` (observed value: `standard`), `speed` (observed value: `standard`;
  ccusage also handles a `fast` value with a per-model price multiplier), `inference_geo`.
- `server_tool_use` — `{ web_search_requests, web_fetch_requests }` counters.
- `iterations[]` — sub-records for multi-iteration responses; each has its own `type`
  (observed: `message`) and its own token-usage keys. ccusage's adapter README documents
  an `advisor_message` iteration type carrying its own model, priced separately.

`message.model` is present on **every** assistant record (observed). Model ids seen
locally: `claude-fable-5`, `claude-opus-4-8`, `claude-sonnet-5`, `claude-sonnet-4-6`,
`claude-haiku-4-5-20251001` — i.e. both dateless aliases and date-suffixed ids occur, so
normalization is required for pricing lookup.

**`costUSD` is absent from all local transcripts** (0 of ~3,200 files contain the key;
observed). Older Claude Code versions wrote a pre-computed `costUSD` per assistant record
— ccusage's `display`/`auto` cost modes exist precisely because of this drift
(https://ccusage.com/guide/cost-modes). A 2026-era analyzer must compute cost from tokens;
it cannot rely on the field.

### 1.5 Tool invocations

- Assistant `message.content[]` blocks have `type` ∈ {`text`, `thinking`, `tool_use`}
  (observed). A `tool_use` block carries `id`, `name`, `input`.
- The matching result arrives as a `user` record whose `message.content[]` contains
  `tool_result` blocks (plus the envelope-level `toolUseResult`) (observed).
- Tool `name` values observed locally: built-ins (`Bash`, `Read`, `Edit`, `Write`,
  `WebFetch`, `WebSearch`, `AskUserQuestion`, `ToolSearch`, `Monitor`, `ScheduleWakeup`,
  `SendUserFile`, `TaskCreate`/`TaskOutput`/`TaskStop`), subagent launch (`Agent`, with
  `input` keys `description`, `prompt`, `subagent_type` — note older versions called this
  tool `Task`), `Skill`, and MCP tools.
- MCP naming (observed): `mcp__<server>__<tool>` for directly configured servers, and
  `mcp__plugin_<plugin-name>_<server>__<tool>` for plugin-bundled MCP servers. Splitting
  on `__` yields server and tool; the `plugin_` prefix identifies plugin provenance.

### 1.6 Skill and slash-command representation

Three distinct signals (all observed):

1. **`Skill` tool_use blocks** — `input: { skill, args }`; the skill name is directly in
   `input.skill`. Deterministic invocation count.
2. **`<command-name>/<name></command-name>` markers** inside user `message.content`
   text — slash commands (built-ins like `/clear`, `/model` and custom/plugin commands)
   are echoed this way, alongside `system` records with `subtype: local_command`.
3. **`attributionSkill` / `attributionPlugin`** fields on assistant records — attribute
   generated messages to the loaded skill/plugin (recent versions only).

Signal 1 is the reliable one for "which Skills does this user actually run"; 2 adds
slash-command coverage; 3 is a bonus where present.

### 1.7 Other `~/.claude` artifacts relevant to metrics

- **`~/.claude/stats-cache.json`** (observed) — Claude Code's own precomputed stats:
  `dailyActivity[]` (`date`, `messageCount`, `sessionCount`, `toolCallCount`),
  `dailyModelTokens[]` (`date`, `tokensByModel{model: n}`), `hourCounts` (activity
  histogram by hour-of-day), `modelUsage{model: {inputTokens, outputTokens,
  cacheReadInputTokens, cacheCreationInputTokens, webSearchRequests, costUSD,
  contextWindow}}`, `totalSessions`, `totalMessages`, `firstSessionDate`,
  `longestSession`, `version`. Notes: it reaches further back than surviving transcripts
  (useful for recency/active-days), but its `costUSD` was `0` for all models on this
  machine, and its provenance/refresh cadence is undocumented — good cross-check, not a
  primary source. OpenUsage reads it as one of its inputs (`local_paths.go`).
- **`~/.claude/history.jsonl`** (observed) — one line per submitted prompt: `display`
  (the raw prompt text — **high sensitivity**), `pastedContents`, `project` (path),
  `sessionId`, `timestamp`. Useful only for prompt-count/recency; an analyzer should
  prefer transcripts and never ship anything from `display`.

### 1.8 Version drift summary

- Local range 2.1.185–2.1.218: envelope + `usage` shape is stable; every assistant
  record has full token fields including `cache_creation` TTL breakdown, `service_tier`,
  `iterations`, `server_tool_use` (observed).
- Reliably present across the range: `uuid`/`parentUuid`, `sessionId`, `timestamp`,
  `type`, `cwd`, `version`, `message.model`, `message.id`, `requestId`, all four token
  classes.
- Recent-addition / unreliable: `attributionSkill`/`attributionPlugin`/`attributionAgent`,
  `origin`/`permissionMode`/`promptSource` on user records, `stop_details`, `effort`.
- Known historical drift (from prior-art source, not observable locally): `costUSD` per
  record (gone), `summary` records, `Task` → `Agent` tool rename, flat vs nested session
  files. An analyzer should treat every non-core field as optional.

---

## 2. Prior art

### 2.1 ccusage (github.com/ryoppippi/ccusage → ccusage/ccusage)

Now a monorepo with the production implementation in Rust
(`rust/crates/ccusage/`); the Claude Code adapter lives in
`rust/crates/ccusage/src/adapter/claude/`. Source read 2026-07-24.

- **Discovery** (`adapter/claude/paths.rs`): `CLAUDE_CONFIG_DIR` (comma-separated,
  each entry a config dir containing `projects/`) → else `$XDG_CONFIG_HOME/claude` and
  `~/.claude`; recursive scan for `*.jsonl` under `projects/`. Project name = first path
  segment after `projects/`; session id derived from filename or, for
  `…/<sessionId>/subagents/agent-*.jsonl`, from the grandparent directory
  (`extract_session_parts`).
- **Dedup** (`adapter/claude/mod.rs`): key = hash of `(message.id, requestId)`
  (`usage_dedupe_hash`, FxHasher). Entries without a `message.id` are never deduped.
  Sidechain special case: `/btw` sidechain logs can replay a parent message with the same
  `message.id` but a *new* `requestId` (issue ccusage#913), so a second lookup on
  `message.id` alone drops the replayed copy when either duplicate has
  `isSidechain: true`; on collision the kept entry is the non-sidechain one, else the one
  with the larger token total (`should_replace_deduped_entry`).
- **Cost modes** (https://ccusage.com/guide/cost-modes + `cost.rs`):
  `display` = use recorded `costUSD` only (0 when absent); `calculate` = always price
  from tokens; `auto` (default) = `costUSD` if present, else calculate.
- **Pricing source** (`pricing.rs`): LiteLLM's
  `https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json`
  fetched at runtime, with a build-time embedded snapshot for offline use, plus a
  models.dev (`https://models.dev/api.json`) fallback for models LiteLLM lacks. Model-id
  normalization via an alias table (`model_aliases::resolve_model_name`), handling
  Anthropic `-YYYYMMDD` date suffixes.
- **Token→cost math** (`cost.rs`, verified against
  https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching):
  `cost = input·p_in + output·p_out + cache_5m·p_cache_create + cache_1h·(2·p_in) +
  cache_read·p_cache_read`. LiteLLM's `cache_creation_input_token_cost` is the 5-minute
  rate (1.25× input); the 1-hour rate isn't in LiteLLM, so ccusage hardcodes
  `CACHE_CREATE_1H_INPUT_MULTIPLIER = 2.0` on the base input price — matching Anthropic's
  documented multipliers (5m write = 1.25×, 1h write = 2×, read = 0.1×). Without the
  `cache_creation` breakdown it falls back to pricing all of
  `cache_creation_input_tokens` at the 5m rate. Long-context tiering: marginal
  `*_above_200k_tokens` rates past a 200K threshold (and whole-request tier switching for
  OpenAI-style models). A `speed: fast` usage value applies a per-model fast multiplier.
- **Iterations**: advisor iterations (`usage.iterations[].type == "advisor_message"`)
  are priced separately under the iteration's own model (adapter README).
- **Granularity**: daily / monthly / session / 5-hour billing blocks; "session" grouping
  is by project directory + session directory/file name, not only the embedded
  `sessionId` (adapter README notes the term is overloaded).

### 2.2 OpenUsage (github.com/janekbaraniewski/openusage)

Go terminal dashboard covering ~35 tools; Claude Code provider in
`internal/providers/claude_code/`. Source read 2026-07-24. (A community fork exists at
`openusage-community/openusage`; openusage.sh is the site.)

- **Discovery** (`local_paths.go`): `~/.claude/projects`, `~/.config/claude/projects`,
  plus `~/.claude/stats-cache.json`, `~/.claude.json`, `~/.claude/settings.json`.
- **Dedup** (`conversation_records.go`): usage key = `requestId` if present, else
  `message.id`, else `sessionId|timestamp|token-tuple`. Separate per-tool-call dedup key:
  `(requestId||messageId||sessionId+timestamp) + "|tool|" + tool_use.id` (or
  `name+index` fallback) — so tool counts survive record replays.
- **Aggregation** (`conversation_usage.go`): totals per model, per project (from `cwd`),
  per agent (main vs named subagent via `agentId`/path), per service_tier and
  inference_geo; daily maps (tokens, messages, cost, per-model tokens); 5-hour billing
  blocks with burn rate; session sets per scope; cache 5m/1h split; reasoning tokens;
  web search/fetch counts from `server_tool_use`.
- **Goes further than tokens** (same file): counts tool_use per (lowercased) tool name,
  infers programming languages from file-path arguments inside tool inputs, tracks
  changed-file sets and estimated lines added/removed for mutating tools, and counts
  `git commit` commands in Bash inputs. Note: these mine tool `input` payloads — exactly
  the high-sensitivity zone aistack's analyzer must treat as local-only.
- **Real quota data** (`usage_api.go`): also calls Anthropic's OAuth-scoped usage
  endpoint `https://api.anthropic.com/api/oauth/usage` (and a cookie-authenticated org
  endpoint) to get actual subscription utilization buckets (e.g. `seven_day_oauth_apps`,
  `extra_usage`) — i.e. real rate-limit consumption rather than notional dollars. This
  endpoint is undocumented/private; useful signal but fragile to rely on.
- **Pricing** (`internal/pricing/`): LiteLLM + OpenRouter + hardcoded tables with fuzzy
  model matching and override files.

### 2.3 Other prior art (brief)

- `phuryn/claude-usage` — local dashboard, same JSONL parsing approach, adds a
  plan-progress bar for Pro/Max.
- `658jjh/claude-usage-tracker`, `junhoyeo/tokscale`, `juliantanx/aiusage` — multi-tool
  aggregators in the same family (tokscale adds a public leaderboard — a cautionary
  example of publishing raw cost numbers).
- Claude-Monitor-style tools focus on live rate-limit windows rather than transcript
  history.

---

## 3. The honesty question (subscription users)

Facts:

- For Pro/Max (OAuth) users Anthropic does not bill per token; limits are rolling-window
  quotas. Any dollar figure derived from transcript tokens × API price is **notional**.
- ccusage's own docs concede this: its guide's Limitations section states
  "Costs are estimates and may not reflect actual billing", and the tool describes
  itself as reporting "estimated costs" (https://ccusage.com/guide/). Community discourse
  around ccusage screenshots ("I used $12,000 of Claude on a $200 plan") shows how easily
  the number is read as real spend.
- The only honest "what did this actually cost" figures are: the subscription price
  itself, and (for API-key users) real per-token billing. OpenUsage's OAuth usage
  endpoint gives real *quota utilization*, but it's undocumented and can change.

Recommendation for aistack's public measured layer:

1. **Lead with usage-share, not dollars.** Share-of-tokens per model / per tool and
   activity recency are fully deterministic and honest for every account type.
2. Where a dollar figure is shown, label it **"API-equivalent cost"** with a fixed
   definition ("what this usage would cost at Anthropic's public API list prices,
   priced per token class") and pin the pricing-table version/date used. Never label it
   "spent" or "cost" bare.
3. Record the account type if detectable (API key vs subscription) and suppress or
   caveat absolute dollars for subscription accounts; usage-share needs no caveat.
4. Do not build on the private OAuth usage endpoint for published numbers; at most use
   it locally as a sanity-check.

---

## 4. Mapping to aistack's atomic unit `(user, tool)`

Deterministically extractable from transcripts:

| aistack "tool" | source signal | determinism |
|---|---|---|
| Claude Code itself | existence of `~/.claude/projects` records; `version` field gives version history; timestamps give recency | full |
| Models (Opus/Sonnet/Haiku…) | `message.model` on every assistant record (+ `iterations[].model` for advisor calls) | full (after alias normalization) |
| Skills | `Skill` tool_use `input.skill` | full |
| Slash commands / plugins | `<command-name>` markers, `system.subtype == local_command`, `attributionPlugin` | full for counts; plugin attribution only on recent versions |
| MCP servers | `mcp__<server>__…` prefix parse; `mcp__plugin_<plugin>_<server>__…` for plugin-shipped servers | full |
| MCP tools (per tool) | full `mcp__…__<tool>` name | full |
| Built-in tools (Bash, Edit, WebSearch…) | tool_use `name` | full |
| Subagents / agent types | `Agent` tool_use `input.subagent_type`; subagent transcript files; `attributionAgent` | full for counts; `input` access needed for the type string |

Not extractable (or not honestly):

- **Editor/IDE identity** — `entrypoint` only says `cli` here; IDE integrations may
  differ but weren't observable. `~/.claude/ide/` existence hints at IDE use, unverified.
- **Non-Claude tools** (Cursor, Codex, Copilot…) — out of scope of `~/.claude`; would
  need their own adapters (this is exactly what OpenUsage/tokscale do).
- **Languages/frameworks** — only via mining tool-input file paths (OpenUsage does this);
  heuristic and high-sensitivity, keep out of P0 publish set.
- **Actual spend** — see section 3.
- **Team/org context** — nothing in the transcript identifies an org.

Caveat: MCP server names and especially Skill/command names are user-chosen strings and
can leak project/client names. The publish step needs either a known-tool allowlist
(match against aistack's catalog) or explicit per-name user approval — never auto-publish
arbitrary local names.

## 5. Metric-candidate catalog

Determinism: **D** = fully derivable, **E** = estimated (defined formula over exact data),
**H** = heuristic. Privacy: sensitivity of the *aggregate* if published (raw inputs may
be higher). Cost: all of these are computable in a single linear pass over all JSONL
files (~10⁵–10⁶ lines typical); "trivial" means also derivable from `stats-cache.json`
without a scan.

### Tokens & cost

| metric | source fields | det. | privacy | compute |
|---|---|---|---|---|
| Tokens per model × 4 classes (input / output / cache-write / cache-read) | `message.model`, `message.usage.*`, dedup on `(message.id, requestId)` | D | low | linear |
| Cache-write TTL split (5m vs 1h) | `usage.cache_creation.ephemeral_{5m,1h}_input_tokens` | D | low | linear |
| API-equivalent cost per model / total | tokens × pinned pricing table (LiteLLM/models.dev snapshot) | E (exact given pinned table) | low–med (invites misreading; label per §3) | linear |
| Cache-hit share (cache_read / all input-class tokens) | usage fields | D | low | linear |
| Model mix (share of tokens or messages per model) | `message.model` | D | low | linear |
| Reasoning/output ratio, thinking-block share | content block types | D | low | linear |
| Web search / fetch request counts | `usage.server_tool_use` | D | low | linear |
| Advisor/iteration usage per model | `usage.iterations[]` | D | low | linear |
| service_tier / inference_geo / speed mix | usage fields | D | low | linear |

### Activity & recency

| metric | source fields | det. | privacy | compute |
|---|---|---|---|---|
| Session count | distinct `sessionId` (or files) | D | low | trivial/linear |
| Active days, first/last activity, streaks | record `timestamp` | D | low | trivial (stats-cache) or linear |
| Hours-of-day / day-of-week histogram | `timestamp` | D | med (work-pattern fingerprint) | trivial/linear |
| Session duration / length (messages, wall-clock first→last) | timestamps, counts per `sessionId` | D (definition-dependent) | low | linear |
| Turn duration stats | `system.subtype == turn_duration` (`durationMs`) | D (recent versions only) | low | linear |
| Messages by role | record `type` | D | low | linear |
| 5-hour billing blocks / burn rate | timestamps bucketed per ccusage/OpenUsage block logic | E | low | linear |
| Projects count / per-project split | project dir names or `cwd` | D | **high** (path/repo names) — publish count only, never names | linear |

### Tools, skills, agents

| metric | source fields | det. | privacy | compute |
|---|---|---|---|---|
| Tool-call counts per tool name (built-ins) | `tool_use.name`, per-tool dedup key | D | low | linear |
| MCP server + tool invocation counts | `mcp__…` name parse | D | med (server names user-chosen) | linear |
| Skill invocation counts per skill | `Skill` tool_use `input.skill` | D | med (names can leak) | linear |
| Slash-command counts | `<command-name>` markers / `local_command` | D | med | linear |
| Subagent launches, per subagent_type | `Agent` tool_use + subagent files | D | low–med | linear |
| Subagent share of tokens | subagent-file usage vs main-file usage | D | low | linear |
| Tool error rate | `tool_result` `is_error` / `toolUseResult` status | D | low | linear |
| Hook activity (hooks configured & firing) | `attachment` hook records, `stop_hook_summary` | D (recent versions) | med | linear |
| Files changed / lines added-removed / commit counts | mining `tool_use.input` (OpenUsage-style) | H | **high** (requires reading inputs; outputs leak repo scale) | linear |
| Languages used | file extensions inside tool inputs | H | high | linear |
| Compaction events / context pressure | version-dependent (`summary` records, compact markers) — not present in local range | H | low | linear |

### Cross-checks

| metric | source | notes |
|---|---|---|
| Lifetime totals (sessions, messages, per-model tokens, daily activity, hour histogram) | `~/.claude/stats-cache.json` | trivial read; longer history than surviving transcripts; undocumented refresh semantics — use to sanity-check the scan, flag drift |
| Prompt count / recency | `~/.claude/history.jsonl` | contains raw prompt text — count/timestamps only, never content |

**P0 capture set is fully covered by D-tier rows:** tool inventory (tools/skills/MCP/
models), usage-share (tokens + tool-call shares), recency (active days, last-activity),
and cost (API-equivalent, labeled). Everything H-tier or path-derived stays local.

---

## Open questions

1. **Pre-2026 transcript shapes.** No files older than v2.1.185 survive on this machine;
   `costUSD`-bearing records, `summary` records, and the `Task` tool name are known only
   from prior-art code/docs. If auto-sync must support long-retention machines, sample a
   machine with older `~/.claude` data before freezing the parser.
2. **`stats-cache.json` semantics.** Refresh cadence, whether it survives transcript
   cleanup (`cleanupPeriodDays`), and why `modelUsage[].costUSD` is 0 here are all
   unverified. Worth a follow-up before using it as the recency source of record.
3. **Transcript retention.** Claude Code prunes old sessions (retention setting);
   effective lookback window per machine is unknown — measured metrics should state
   their observation window rather than implying lifetime totals.
4. **IDE/entrypoint values.** Only `entrypoint: "cli"` observed; the value set for IDE
   extensions/SDK use is unverified.
5. **`speed: "fast"` pricing.** ccusage applies a per-model fast multiplier from an
   override file; the authoritative Anthropic pricing for fast-mode output was not
   verified against official docs.
6. **OAuth usage endpoint stability.** `api.anthropic.com/api/oauth/usage` (used by
   OpenUsage) is undocumented; schema/stability unknown.
7. **`isCompactSummary` / compaction markers.** A marker string was grep-detectable in
   exactly one recent subagent file; the current compaction representation in 2.1.x
   needs a dedicated look once a compacted session is available to inspect.
8. **Multi-machine users.** Dedup keys (`message.id`, `requestId`) are stable across
   copies of the same file but nothing links two machines' histories; auto-sync's
   server-side merge semantics for one user with several machines are an aistack design
   question, not answerable from the data.

## Source index

- Local: `~/.claude/projects/**/*.jsonl` (v2.1.185–2.1.218, 2026-06/07),
  `~/.claude/stats-cache.json`, `~/.claude/history.jsonl` — structure inspection only.
- ccusage: `rust/crates/ccusage/src/adapter/claude/{README.md,paths.rs,mod.rs}`,
  `rust/crates/ccusage/src/{cost.rs,pricing.rs}` @ main (2026-07-24),
  https://ccusage.com/guide/ and https://ccusage.com/guide/cost-modes.
- OpenUsage: `internal/providers/claude_code/{conversation_usage.go,conversation_records.go,local_paths.go,usage_api.go}`
  @ janekbaraniewski/openusage main (2026-07-24).
- Anthropic cache pricing multipliers:
  https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching.
- LiteLLM pricing DB:
  https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json;
  models.dev: https://models.dev/api.json.
