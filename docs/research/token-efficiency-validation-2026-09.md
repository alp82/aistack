# Token efficiency: validating the rules, the fix steps and the severity model

Researched 2026-09-24 by four parallel agents against primary sources: the Claude Code
docs and CHANGELOG (v2.1.281), the Anthropic, OpenAI and Google pricing and caching pages,
the source repositories of Codex, opencode, pi-mono and Grok Build, the Cursor docs, and
this repo's extraction code. Every claim in Parts A to D cites its source. This first
section is the synthesis.

Subject: the eight rules in `packages/workflow-rules/src/efficiency.ts`, the atoms in
`packages/workflow-rules/src/daily.ts`, the extractor in `packages/cli/src/workflow/reducer.ts`
and the rate wiring in `convex/lib/efficiency.ts`.

The threshold source that `efficiency.ts` cites, `docs/research/token-efficiency-levers-2026-09.md`,
is not on `main`. It exists only in commit `c4ef8368` on `prototype/token-efficiency`.

## Summary

The levers are the right eight. The measurement behind half of them and the severity cut
behind all of them need work. Three facts drive most of the changes:

1. **A Claude subscription already caches the main conversation for one hour.** API keys,
   cloud providers and usage credits get five minutes. The rules assume five minutes for
   everyone (`CACHE_TTL_SEC = 300`), so for most Claude Code users the cache tile counts
   breaks that cost nothing and recommends a setting they already have (Part A, Part D 1).
2. **Opus 5.5 changed the defaults.** It defaults to medium effort, ignores `effortLevel`
   in the user settings file, keeps the cache across effort changes, and reads cache at
   0.05x input (Fable 5.1 at 0.025x). Other Claude models default to high effort. The effort
   rule flags defaults, and the switches and effort copy blames effort for cache misses
   that no longer happen (Part A, Part B).
3. **Severity is a share against a placeholder threshold, with no sample floor and no
   absolute size.** One short Grok session out of three reaches Fix. A $227 cache finding
   reaches only Look because it is divided by the whole stack's input cost. The scorecard
   picks the harness with the highest meter, not the most waste (Part D 2).

## Rule by rule

| Rule | Measurement | Copy and steps | Main change |
|---|---|---|---|
| cache | Wrong TTL for subscribers (1h) and Codex GPT-5.6+ (30 min). The write atom includes the normal tail write. Dollars are gross write cost, not the saving. | "Use the 1h cache TTL" is moot on a subscription within plan usage. `promptCacheTtl` is valid (v2.1.242+). | Detect the TTL in force from the 5m/1h write split (already on the wire, dropped in `convex/lib/efficiency.ts`). Price at write minus read. Recommend 1h only when the net saving is positive. |
| switches | Double counts every cold call after a break (the orphan test ignores the gap). | Effort changes keep the cache on Opus 5.5 and Fable 5.1. `effortLevel` in user settings is ignored by Opus 5.5. `opusplan`, fast mode and skills that set a model also switch. | Count an orphan only when the gap is within the TTL. Name the causes that still apply. |
| tools | Counts subagent tool results, so "delegate to a subagent" does not move it. Images count as base64 bytes. `read` (opencode, pi) falls into `other`. | `bashOutputMaxChars: 30000` is the default and changes nothing. Read already pages huge files. | Main-thread results only, image-aware sizing, add `read` to `TOOL_RESULT_NAMES`. Suggest 10000 for Bash. |
| context | One late call marks the whole session high. 128K is normal on 1M-window models, which auto-compact near 967K. | Correct, "about four times" holds as a token ratio, but the tokens are cheap cache reads. | Score calls, not sessions (`context.calls.main` exists). Add `/autocompact 200k` as a step. |
| routing | Token shares are dominated by cache reads. Fires even when no cheaper model exists. | `CLAUDE_CODE_SUBAGENT_MODEL` alone does not move Explore or Plan. Explore inherits the main model since v2.1.198. | Add `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` or an `Explore` agent with `model: haiku`. Fire only when a cheaper same-vendor model exists. |
| startup | Scores the harness floor the user cannot trim. Most Claude Code users land on Look or Fix. | MCP tool schemas are deferred by default. Skill descriptions are always loaded, only bodies load on demand. CLAUDE.md under 200 lines is confirmed. | Score the instructions part only (`firstCallInstructionsTokens` exists). |
| effort | "high" is the default on most Claude models, so defaults score Fix. `xhigh` and `max` are merged into high. | `/effort high` saves a default for later sessions. Use `claude --effort high` for one session. | Keep raw levels. Score only levels above the model's default. Cap at Minor until output by effort is measured. |
| sessions | Counts `claude -p` runs, Codex rollouts, resumed sessions and Grok sessions with missing logs. The dollar figure prices cache reads at the input rate. | Asking in a big running session re-reads its whole history. `/btw` (Claude Code, Codex, Grok Build) answers without growing it. | Exclude headless sessions. Lead with `/btw`. Expect near-zero waste for most users. |

## Severity today and proposed

| | Today | Proposed |
|---|---|---|
| What drives the color | `meter = observed / placeholder threshold`, clamped to 1. Fix at 0.6, Look at 0.3, Minor at 0.1. | Estimated waste over the window, in input-token equivalents and dollars when priced, as a share of the whole stack's spend. |
| Absolute size | Ignored. | Required: Fix needs share of 5% or more AND $20 or 5M tokens. Look needs 1.5% AND $5 or 1M tokens. Minor needs 0.5%. |
| Sample size | Ignored. 1 of 3 sessions is a 33% share. | Evidence floor per rule (20 sessions, 200 calls, 100 tool results). Below it the tile says "Not enough data yet" in the muted style. Shares use a 95% lower confidence bound. |
| Confidence | None. | High for exact atoms (cache, switches), medium for bucket estimates (context, tools), low for assumed waste (routing, effort). Low-confidence rules cap at Look. |
| Harness choice | The harness with the highest meter owns the lever. | Sum waste across harnesses per lever and name the largest contributor. |
| Sort | Severity, then dollars, then meter. | Waste, descending. |
| Dollars | Cache and sessions only, gross cost. | Every rule that can estimate waste, priced as the saving (write minus read, for example). |

Applied to the screenshot:

* **Grok "Ask quick questions" (Fix today)** becomes "Not enough data yet": 3 sessions are
  under the floor, and Grok's short count is inflated by the retained-log gap.
* **"Use the 1h cache TTL", $227 (Look today)** becomes Fix on an API key, if the net saving
  after the 2x write premium stays positive. On a subscription the fix changes to "Start
  fresh after long breaks", and only calls after gaps over an hour count.
* **"Default to medium effort" (Minor today)** becomes Good or "not scored" when the high share
  is the model's default.
* **"Trim instructions and unused MCP" (Fix today)** is re-scored on instruction tokens only.
  It likely drops to Look or Minor.
* **"Pick model and effort at start" (Minor today)** loses the calls the cache rule already counts.

## New levers worth adding

From atoms that exist today:

* Overall cache hit ratio, a headline that explains the cache and switches tiles.
* Thinking share (`thinking` and `efficiency.blocks` exist, no rule reads them). Owner-only,
  so the public cut list does not apply.
* Long idle resumes: gaps over an hour from `callGaps`. No TTL fixes these. The fix is to start
  fresh, or accept Claude Code's resume-from-summary offer, and never `/compact` a cold session.
* 1h TTL paid but unused: a high 1h write share with few 5 to 60 minute gaps pays 2x writes
  for nothing.
* Compaction frequency and output-heavy spend.

Documented settings to surface as steps (Part A, Part C):

* Claude Code: `subagentPromptCacheTtl` (subagents get 5 minutes even on a subscription),
  `/autocompact`, `/btw`, `claude --bare -p` for scripted calls, fast mode only at session
  start, `ultrathink` for one-off depth without an effort change, `/usage` cache stats,
  `/skill-doctor`.
* Codex: `model_reasoning_effort`, `tool_output_token_limit`, `model_auto_compact_token_limit`,
  `agents.default_subagent_model`, `/side` (`/btw`), `service_tier`.
* Grok Build: `models.default_reasoning_effort`, `toolset.bash.output_byte_limit`,
  `session.auto_compact_threshold_percent`, `[subagents.models]`, `/btw`.
* opencode: `small_model`, the `compaction` block, `"enabled": false` per MCP server.
* pi: `PI_CACHE_RETENTION=long`, `cacheWarming`, `defaultThinkingLevel`.
* Cursor: `/summarize`, `agent mcp disable`, Auto in Cost mode.

Needs new atoms (CLI side, all counts or sums): after-gap writes split by gap band plus
after-gap cache reads, raw effort levels with output per level, headless session count,
main-only tool results, cold compactions, configured but uncalled MCP servers, and Codex
`cache_write_tokens` (hard-coded to 0 in `codex/analyzer.ts`, although GPT-5.6+ charges writes).

## Copy fixes that need no measurement change

These can ship on their own, before any rule change:

1. Cache: branch the step on billing. Subscribers: "Start fresh after breaks over an hour."
   API key: `promptCacheTtl: "1h"`, needs v2.1.242 or later.
2. Switches and effort: replace `{ "effortLevel": "medium" }` with `/effort medium`, or
   `CLAUDE_CODE_EFFORT_LEVEL` in the `env` block. Replace `/effort high` with
   `claude --effort high`. Say that effort changes keep the cache on Opus 5.5 and Fable 5.1.
3. Tools: `bashOutputMaxChars` 10000, not 30000.
4. Routing: add `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` or an `Explore` override.
5. Startup: "skills, whose body loads only when used".
6. Sessions: lead with `/btw`.
7. Context: add `/autocompact 200k`, and "compact while the cache is warm".
8. Non-Claude cache copy: "about 5 minutes" is wrong for Codex (30 minutes to 24 hours).
9. Figure label: "1 sessions" does not pluralize.


## Part A: Claude Code claims in packages/workflow-rules/src/efficiency.ts, checked against primary sources

Checked 2026-09-24 against code.claude.com/docs (fetched as `.md`), the Claude API prompt caching page, and the Claude Code CHANGELOG at v2.1.281. Every claim below carries a URL. "Not found" means no primary source states it.

Short URL keys used in the tables:

* PC: https://code.claude.com/docs/en/prompt-caching
* SR: https://code.claude.com/docs/en/settings-reference
* ENV: https://code.claude.com/docs/en/env-vars
* MC: https://code.claude.com/docs/en/model-config
* SA: https://code.claude.com/docs/en/sub-agents
* COSTS: https://code.claude.com/docs/en/costs
* MEM: https://code.claude.com/docs/en/memory
* SK: https://code.claude.com/docs/en/skills
* MCP: https://code.claude.com/docs/en/mcp
* TR: https://code.claude.com/docs/en/tools-reference
* CMD: https://code.claude.com/docs/en/commands
* CW: https://code.claude.com/docs/en/context-window
* API: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
* CL: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md

### The five findings that change the copy

1. **Subscription users already get the one-hour cache.** Unless you set a TTL yourself, Claude Code asks for the one-hour TTL on the main conversation for Claude subscriptions within the plan's included usage. API keys, cloud providers and a subscription drawing on usage credits get five minutes (PC#which-ttl-each-request-gets). So "Use the 1h cache TTL" does nothing for a subscriber inside the plan. It only helps API-key and cloud users, and subscribers on usage credits. A five-minute gap is also the wrong break threshold for subscribers. Their cache survives gaps of up to an hour. The transcripts can tell which TTL applied: on this machine the JSONL `usage.cache_creation` object carries `ephemeral_1h_input_tokens` and `ephemeral_5m_input_tokens` (seen in a local transcript; the docs name the same fields for `claude -p --output-format json`, PC#choose-the-ttl-yourself).
2. **`effortLevel` in `~/.claude/settings.json` is ignored by Opus 5.5, the default model.** In the user settings file the top-level `effortLevel` is the older form. It still applies to Opus 5, Fable 5.1 and earlier models. Opus 5.5 and later ignore it (SR#effortlevel, MC#adjust-effort-level; CL 2.1.280). Opus 5.5 already defaults to `medium` (MC#choose-an-effort-level). The step `{ "effortLevel": "medium" }` therefore does nothing on Opus 5.5. It works in project, local or managed settings, and so does `CLAUDE_CODE_EFFORT_LEVEL`.
3. **`/effort high` typed with a level saves it as the default for later sessions.** Typing a level after `/effort` saves it as your default, which Claude Code stores per model under `modelSettings`. Pressing `s` in the slider applies it to this session only (MC#adjust-effort-level). So the "for design work, `/effort high`" step would leave every later session on high, which is the exact problem the effort rule flags. Use `claude --effort high` for one session, or `s` in the `/effort` slider.
4. **Changing effort does not break the cache on Opus 5.5 or Fable 5.1 with an API key or a subscription.** It still does on other models, on Bedrock, Agent Platform and the apps gateway, and with `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` (PC#changing-effort-level; CL 2.1.260 for Fable 5.1). "Changing it mid-session also rebuilds the cache" is therefore only partly true.
5. **`{ "bashOutputMaxChars": 30000 }` is the default value, so it changes nothing.** The default is 30,000 characters inline. The setting clamps to 4,000 to 128,000 and needs v2.1.261 or later. Past the limit, output goes to a file and Claude gets a 2,000-character preview (SR#bashoutputmaxchars, TR#output-limits). To cap output, set a lower number, for example 10000. Also, `CLAUDE_CODE_SUBAGENT_MODEL` does not move the built-in Explore agent, and Explore has no frontmatter to edit (see rule 5).

### Rule 1: cache (breaks)

| Claim | Verdict | Source | Corrected wording |
|---|---|---|---|
| why: "The prompt cache expires 5 minutes after the last call." | Partly | The API default is 5 minutes, and "the cache is refreshed for no additional cost each time the cached content is used" (API, "5-minute lifetime"). Claude Code: "Each request that hits the cache resets the timer" (PC#cache-lifetime). But Claude Code's main conversation on a subscription within plan usage defaults to 1 hour (PC#which-ttl-each-request-gets). | "The prompt cache expires after 5 minutes without a call (1 hour on a Claude subscription within plan usage). Every cache hit restarts the timer." |
| why: "The next call rewrites the whole prefix at the cache-write rate." | Correct | "After a long enough gap, the next request recomputes the full input and re-establishes the cache" (PC#cache-lifetime). Writes cost 1.25x base input at 5m and 2x at 1h (API, pricing multipliers). | Keep. |
| fix: "Use the 1h cache TTL" | Partly | Useful only on API key, cloud provider, or a subscription on usage credits. Subscribers within plan usage already have 1h on the main conversation (PC#which-ttl-each-request-gets; COSTS#why-usage-climbs-in-a-long-session). | Branch on billing. For subscribers inside the plan, lead with "Start fresh after long breaks" or `/clear`. |
| action: "Set the cache TTL to 1h on API-key billing, or start a fresh session after a long break instead of resuming a large one." | Correct for API keys | PC#choose-the-ttl-yourself: "If you sign in with an API key or use a cloud provider, set `promptCacheTtl` to `1h`." | Add "or on a subscription while you draw on usage credits." |
| step: `{ "promptCacheTtl": "1h" }` in `~/.claude/settings.json` | Correct | Valid key, values `"5m"` or `"1h"`, any settings file, v2.1.242 or later (SR#promptcachettl). The changelog lists the key under 2.1.243 (CL). Precedence: `FORCE_PROMPT_CACHING_5M` beats `CLAUDE_CODE_PROMPT_CACHE_TTL`, which beats this key, which beats `ENABLE_PROMPT_CACHING_1H` (SR#promptcachettl). | Keep. Add "Needs Claude Code 2.1.242 or later." |
| step: "It works on API keys and Claude subscriptions." | Partly | It is accepted on both. For a subscriber inside plan usage it is already the default, so it only matters on usage credits (PC#which-ttl-each-request-gets). | "On API keys and cloud providers this turns the one-hour cache on. A Claude subscription already uses it until you draw on usage credits." |
| step: "A one-hour cache write costs more than a five-minute one." | Correct | 2x vs 1.25x base input (API, pricing). The trade-off is described in PC#cache-lifetime. | Keep. You could state "twice base input instead of 1.25 times". |
| step: "It pays off when you often step away for 5 to 60 minutes." | Correct (reasoning) | PC#cache-lifetime: the longer TTL "helps when you leave a session idle and come back to it" and "costs more on short bursts of work that never idle past five minutes". | Keep. |
| step: "After a break longer than an hour, start a fresh session instead of resuming a large one." | Correct (supported) | The first message after the TTL "misses the cache and reprocesses your full context". On Pro and Max, Claude Code offers to resume from a summary (COSTS#why-usage-climbs-in-a-long-session). `/compact` on a cold cache reprocesses the full history uncached, and `/clear` costs nothing (PC#compacting-the-conversation; COSTS). | Add "or accept the resume-from-summary offer (Pro and Max). Don't `/compact` a cold session: that re-reads the whole history uncached." |
| evidence label "calls more than 5 min after the last" | Partly (not copy, but it drives the meter) | For 1h-TTL sessions, a gap of 5 to 60 minutes is not a cold start (PC#which-ttl-each-request-gets). | Read the TTL from `usage.cache_creation.ephemeral_1h_input_tokens` and use a 60-minute gap for those calls. |

### Rule 2: switches

| Claim | Verdict | Source | Corrected wording |
|---|---|---|---|
| why: "A mid-session call that writes cache and reads none had its prefix invalidated: a model, effort or tool-set change." | Partly | The documented invalidators are: switching models, changing effort (most models), turning on fast mode, connecting or disconnecting an MCP server whose tools load upfront, enabling a plugin that provides MCP servers, denying a whole tool when tool search is off, compaction, dropping images, and upgrading Claude Code (PC#actions-that-invalidate-the-cache). A skill whose frontmatter names a different `model` counts as a model switch for that turn, and so does each plan-mode toggle under `opusplan` (PC#switching-models). | "...invalidated: a model switch (including `opusplan` and skills that set a model), an effort change, turning on fast mode, or an MCP tool-set change." |
| action: "Pick the model and effort at session start." | Correct | PC tip: "Pick your model and effort level at the top of a session." | Keep. |
| action: "Keep tool search on so an MCP reconnect does not change the tool set." | Partly | With deferred tools, a reconnect "only appends new content and doesn't disturb anything already cached". The tool list can still change, but the cached prefix survives (PC#connecting-or-disconnecting-an-mcp-server). | "Keep tool search on, so an MCP reconnect adds to the end of the prompt and leaves the cache intact." |
| step: `claude --model sonnet` | Correct | `claude --model <alias\|name>` applies to that session only. `sonnet` is Sonnet 5 on the Anthropic API (MC#setting-your-model, MC#model-aliases). | Keep. `/model sonnet` would also save a default (MC#setting-your-model). |
| step: `{ "effortLevel": "medium" }` in `~/.claude/settings.json` | Partly wrong | The values are `low`, `medium`, `high`, `xhigh` (`max` is not accepted). In the user file, Opus 5.5 and later ignore the key (SR#effortlevel; MC#adjust-effort-level; CL 2.1.280). Opus 5.5 already defaults to `medium`. | "Run `/effort medium` once: Claude Code saves it for the model you're using. For every model, set `CLAUDE_CODE_EFFORT_LEVEL=medium` in the `env` block." |
| step: "Avoid /model and /effort in the middle of a session." | Partly | `/model` always costs a full re-read. `/effort` keeps the cache on Opus 5.5 and Fable 5.1 with an API key or a subscription (PC#changing-effort-level). Claude Code asks you to confirm while the cache is warm (PC#switching-models). | "Avoid /model mid-session. On models other than Opus 5.5 and Fable 5.1, avoid /effort too." |
| step: "Keep MCP tool search on (the default). With ENABLE_TOOL_SEARCH=false, every MCP reconnect changes the tool list and rewrites the cache." | Mostly correct | Deferral is the default when unset (ENV `ENABLE_TOOL_SEARCH`; MCP#configure-tool-search). Upfront tools invalidate on connect or disconnect (PC). Upfront loading also happens with a non-first-party `ANTHROPIC_BASE_URL`, in `auto` threshold mode below 10% of context, for `alwaysLoad` servers, and on Azure-hosted Foundry (MCP#configure-tool-search; PC). | "...With ENABLE_TOOL_SEARCH=false or auto, behind a custom gateway, or for alwaysLoad servers, each MCP connect or disconnect re-reads the whole conversation." |

### Rule 3: tools

| Claim | Verdict | Source | Corrected wording |
|---|---|---|---|
| why: "Every byte a tool returns stays in the context and is re-read by every later call until compaction." | Partly | Tool results stay in history and are re-sent (PC#how-the-cache-is-organized; COSTS). But Bash output over ~30,000 characters arrives as a file path plus a 2,000-character preview (TR#output-limits). Claude Code also clears old tool results from context by itself, which `/usage` counts as an expected rebuild (COSTS#prompt-cache-statistics). `/clear` drops everything too. | "Tool output stays in the context and is re-sent on every later call until you clear or compact." |
| fix/action: "Read with offset and limit, Grep before Read" | Correct but partly automatic | Read already caps output: a whole-file read over the token limit returns a first page with a `PARTIAL view` notice (TR#read-tool-behavior; CL "PARTIAL view"). `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS` overrides the limit (ENV). The default token limit value: not found in the docs. A 2,000-line default: not found in the docs (the changelog's only "2000 lines" is @-mention truncation, CL 2.0 era). Unchanged re-reads are deduplicated (CL 2.1.86). | Keep. Say the problem is many medium files, since a single huge read is already paged. |
| step: CLAUDE.md line "Use Grep ... then Read with offset and limit" | Unverifiable (advice) | No primary source recommends this exact instruction. Docs recommend specific prompts, subagents for big reads and code intelligence plugins (COSTS#reduce-token-usage). | Keep as advice, or add "install a code intelligence plugin for typed languages" (COSTS). |
| action: "delegate whole-file scans to a subagent so the main thread sees only the summary" | Correct | COSTS#delegate-verbose-operations-to-subagents; CW#when-your-context-fills-up ("Delegate large reads"). | Keep. |
| step: `{ "bashOutputMaxChars": 30000 }` "Cap the Bash output" | Wrong value | The key exists (v2.1.261 or later, clamped 4,000 to 128,000), but the default is already 30,000 (SR#bashoutputmaxchars). It sizes successful output only. Failures are inline up to about 10,000 characters (TR#output-limits). `BASH_MAX_OUTPUT_LENGTH` is ignored when the key is set (ENV). | `{ "bashOutputMaxChars": 10000 }` with "Lower the Bash output Claude receives inline (default 30,000 characters, minimum 4,000). Longer output goes to a file Claude can search." |
| step: `MAX_MCP_OUTPUT_TOKENS=10000` | Correct (lowering) | Default 25,000, with a warning above 10,000 (ENV; MCP#mcp-output-limits-and-warnings). Tools that declare `anthropic/maxResultSizeChars` use that limit for text instead. The docs only show raising it; lowering follows from "maximum number of tokens allowed" (ENV). | "Lower the MCP output cap from its 25,000-token default: `{ \"env\": { \"MAX_MCP_OUTPUT_TOKENS\": \"10000\" } }`." Mention that tools declaring their own size limit ignore it. |

### Rule 4: context

| Claim | Verdict | Source | Corrected wording |
|---|---|---|---|
| why: "Cost per call scales with context." | Correct | "Token costs scale with context size" (COSTS#reduce-token-usage). | Keep. |
| why: "A 150K-token prefix costs about four times a 40K one on every call." | Correct (arithmetic, 3.75x) | Cache reads bill per token at a flat rate (API pricing), so it is linear. | Keep. |
| step: `/clear` when switching to an unrelated task | Correct | CMD `/clear`; COSTS#manage-context-proactively; CW. `/clear` costs nothing (COSTS). | Keep. Could add "`/rename` first so you can `/resume` it" (COSTS). |
| step: `/compact focus on the auth bug fix` | Correct | It is the exact example in CW#when-your-context-fills-up. `/compact [instructions]` (CMD). | Keep. Add "while the cache is warm". A cold `/compact` reprocesses the full history uncached (PC#compacting-the-conversation). |
| step: "Keep one session per task." | Correct (supported) | CW and COSTS: clear between tasks. | Keep. |
| threshold "peak over 128K" | Context note | On 1M-window models (Opus 4.7 and later, Sonnet 5, Fable) auto-compact fires at about 967K by default (MC#default-auto-compact-thresholds), so nothing stops a session at 128K. | Add a step: `/autocompact 200k` (CMD; SR#autocompactwindow). |

### Rule 5: routing (subagents)

| Claim | Verdict | Source | Corrected wording |
|---|---|---|---|
| why: "...starts on a cold cache." | Correct | A subagent's "first request doesn't read the parent's cache". Subagents get a 5-minute TTL even on a subscription (PC#subagents-and-the-cache). | Add "with a 5-minute cache, even on a subscription". |
| why: "Subagent work is mostly reading and searching. It rarely needs the top model." | Unverifiable (opinion) | Docs do say "For simple subagent tasks, specify `model: haiku`" (COSTS#choose-the-right-model). | Soften: "Search and read work rarely needs the top model." |
| action: "Set CLAUDE_CODE_SUBAGENT_MODEL to a smaller model, or set model in the Explore agent's frontmatter." | Partly wrong | The variable is only a default. A per-spawn model and a definition's `model` (including `inherit`) win over it (SA#choose-a-model; CL 2.1.251). "Setting `CLAUDE_CODE_SUBAGENT_MODEL` by itself doesn't change the model the built-in Explore and Plan subagents run on" (SA#choose-a-model). The built-in Explore has no frontmatter you can edit. You override it by creating a user or project agent named `Explore` with `model: haiku` (SA#built-in-subagents). `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (v2.1.257 or later) applies the model to every subagent (SA#run-every-subagent-on-one-model). | "Set CLAUDE_CODE_SUBAGENT_MODEL and CLAUDE_CODE_SUBAGENT_MODEL_FORCE, or define your own `Explore` agent with `model: haiku`." |
| step: `{ "env": { "CLAUDE_CODE_SUBAGENT_MODEL": "sonnet" } }` | Correct syntax, partial effect | The `env` block form is the documented way (SA#run-every-subagent-on-one-model). It moves general-purpose and agents without a `model`, but not Explore or Plan, and not spawns where Claude passes a model. | Add `"CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1"` if the intent is every subagent. |
| step: `model: haiku` in `.claude/agents/` frontmatter | Correct | Aliases `sonnet`, `opus`, `haiku`, `fable`, full IDs, or `inherit` (SA#choose-a-model). | Add: "Name the file's agent `Explore` to replace the built-in one." |
| step: "Keep model: inherit only for agents that do design or review work." | Correct (advice) | `inherit` = the main conversation's model (SA#choose-a-model). | Keep. |
| Background fact: Explore's default model | Explore no longer runs on Haiku | Since v2.1.198 Explore inherits the main model, capped at Opus on the Claude API (SA#built-in-subagents; CL 2.1.198). Before that it was "Powered by Haiku" (CL 2.0.17). | An Opus 5.5 or Fable user's Explore runs on Opus. That is the main reason this rule fires. |

### Rule 6: startup

| Claim | Verdict | Source | Corrected wording |
|---|---|---|---|
| why: "The first call carries the system prompt, instruction files, memory and every tool schema, and is a cache write." | Partly | MCP tool schemas are deferred by default: "Only tool names and server instructions load at session start" (MCP#scale-with-mcp-tool-search). Built-in tool definitions do sit in the system prompt (PC layer table). The first call can also be a cache read: parallel sessions in the same directory share a prefix, and so do sequential ones when the startup git snapshot matches (PC#cache-scope). | "...the system prompt, built-in tool schemas, instruction files, memory, the skill listing and MCP tool names. It is usually a cache write." |
| "Keep CLAUDE.md under 200 lines" | Correct | COSTS#move-instructions-from-claudemd-to-skills: "Aim to keep CLAUDE.md under 200 lines". MEM: "target under 200 lines per CLAUDE.md file". CW tip: "Keep it under 200 lines." | Keep. Add: `@path` imports still load at launch (MEM). Path-scoped rules load only on matching files (MEM). |
| "Move long workflows into skills, which load only when a task needs them." | Partly | The skill body loads on use, but every skill's name and description sit in context on every turn, within a listing budget of 1% of the context window (SK, "Description always in context, full skill loads when invoked"; SK#skill-descriptions-are-cut-short). `/skill-doctor` shows each skill's cost (SK; CMD). | "...skills, whose body loads only when used (their one-line description is always loaded)." |
| "disable MCP servers you did not call this month. Open the server list in Claude Code" | Correct | `/mcp` panel toggle, saved per project as `disabledMcpServers` in `~/.claude.json` (MCP#disable-a-server-without-removing-it). Also `/mcp disable <server>` (CMD). COSTS: "Run `/mcp` ... and disable any you're not actively using." | Name the command: "Run `/mcp` (or `/mcp disable <name>`)". With tool search on, an idle server costs only its tool names and instructions, so the saving is smaller than it used to be (MCP). |
| `claude mcp remove <name>` | Correct | MCP#managing-your-servers. | Keep. |
| "Keep MCP tool search on (the default), so tool schemas load only when Claude needs them." | Correct | MCP#scale-with-mcp-tool-search; ENV `ENABLE_TOOL_SEARCH`. | Keep. |

### Rule 7: effort

| Claim | Verdict | Source | Corrected wording |
|---|---|---|---|
| why: "Effort scales thinking output, the most expensive token." | Mostly correct | Effort controls adaptive reasoning (MC#adjust-effort-level). Thinking is billed as output (COSTS#adjust-extended-thinking). Output is the highest per-token rate (API pricing table). Effort also changes non-thinking token spend (SR#effortlevel: "reduces token usage"). | "Effort sets how much the model thinks, and thinking bills as output, the most expensive token." |
| why: "Changing it mid-session also rebuilds the cache." | Partly | Not on Opus 5.5 or Fable 5.1 with an API key or a subscription (PC#changing-effort-level). | "On most models, changing it mid-session also rebuilds the cache." |
| fix: "Default to medium effort" | Partly | Opus 5.5 already defaults to `medium`. Other models default to `high`, Opus 4.7 to `xhigh` (MC#adjust-effort-level). A high share on Opus 5.5 means the user saved or passed `high`. | Keep, but on Opus 5.5 phrase it as "Go back to the default: `/effort auto`" (CMD `/effort`). |
| step: `{ "effortLevel": "medium" }` in `~/.claude/settings.json` | Partly wrong | See finding 2 (SR#effortlevel). | "`/effort medium` saves medium for your current model. For all models use `{ \"env\": { \"CLAUDE_CODE_EFFORT_LEVEL\": \"medium\" } }`." Note the env var also overrides `/effort` (ENV), which blocks raising effort for design work. `effortLevel` in project settings applies to every model (MC). |
| step: `/effort high` "at the start of the session, before the cache warms up" | Syntax correct, side effect missing | `/effort <level>` is valid (CMD). But typing a level saves it as the default for later sessions (MC#adjust-effort-level). "Before the cache warms up" matters only on models where effort changes break the cache (PC). | "For design work, start that session with `claude --effort high`. It applies to that session only." |

### Rule 8: short sessions

| Claim | Verdict | Source | Corrected wording |
|---|---|---|---|
| why: "A one-question session pays the startup prefix for one answer." | Partly | True as a cache write, but a new session in the same directory can read a parallel or recent session's cache (PC#cache-scope). | Keep, lightly softened. |
| "Ask one-line questions in a running session" | Partly | A question in a large session re-reads the whole history at the cache-read rate. "a one-line question in a session that has been open all day still draws usage for the whole conversation" (COSTS#why-usage-climbs-in-a-long-session). `/btw` answers from the session's context "without adding to the conversation history" (CMD `/btw`; https://code.claude.com/docs/en/interactive-mode#side-questions-with-btw). | "Ask quick questions about the current work with `/btw` in a running session. It doesn't grow the conversation." |
| "use a plain chat. It skips the tool and instruction prefix." | Correct (reasoning) | The tool and CLAUDE.md layers are part of every Claude Code request (PC layer table). For scripted one-offs, `claude --bare -p` skips CLAUDE.md, MCP, skills and hooks (https://code.claude.com/docs/en/cli-reference). | Add `claude --bare -p "..."` as the Claude Code option. |

### More documented levers

| Lever | What it saves | How to set it | Source |
|---|---|---|---|
| `/usage` (aliases `/cost`, `/stats`) with the `Prompt cache (main)` line | Shows hit ratio, misses, likely cause of the last miss (v2.1.260+), and warm or cold with the TTL. On paid plans it attributes usage to skills, subagents, plugins and MCP servers, and flags behaviors over 10% | `/usage`; `d`/`w` toggles 24h or 7d | COSTS#prompt-cache-statistics, COSTS#plan-usage-breakdown |
| Status line `prompt_cache`, `cost.total_cost_usd`, `current_usage` | Live cache creation vs read per turn | `/statusline` | PC#check-cache-performance; https://code.claude.com/docs/en/statusline |
| `/context` | Shows what fills the window, with suggestions | `/context [all]` | CMD; CW#check-your-own-session |
| `/insights` | Report on friction and wasted patterns (itself costs tokens) | `/insights` | COSTS#analyze-your-usage-patterns |
| `/skill-doctor` | Per-skill context cost and usage, to find skills to turn off | `/skill-doctor` (v2.1.252+) | SK; CMD |
| Auto-compact window | Compacts earlier. The 1M-window default is about 967K | `/autocompact 200k`, `--autocompact`, `autoCompactWindow`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`; `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` only lowers it | MC#set-the-auto-compact-window; SR#autocompactwindow; ENV |
| Compact instructions in CLAUDE.md | Better summaries | a `# Compact instructions` section | COSTS#manage-context-proactively |
| `/rewind` instead of `/compact` to abandon a path | Falls back to an already cached prefix | `/rewind`, or Esc twice | PC#rewinding-the-conversation; COSTS |
| `/btw` side questions | Answers without growing history | `/btw <question>` | CMD; interactive-mode#side-questions-with-btw |
| `subagentPromptCacheTtl` | 1h cache for subagents, workflows and compaction (5m by default even on subscriptions) | `{ "subagentPromptCacheTtl": "1h" }` or `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL` | SR#subagentpromptcachettl; PC#subagents-and-the-cache |
| Subagent `experimental.cacheTtl` frontmatter | Per-agent TTL | frontmatter, v2.1.248+ | PC#choose-the-ttl-yourself |
| `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` | Puts every subagent, Explore included, on one cheap model | `env` block, v2.1.257+ | SA#run-every-subagent-on-one-model |
| `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS` | Stops Explore/Plan spawns (their cold-cache startup) | env `=1` | SA#built-in-subagents; ENV |
| Forks share the parent cache | A fork's first request reads the parent's cache; a normal subagent's does not | ask for the `fork` subagent type; `/fork` | PC#subagents-and-the-cache; SA#fork-the-current-conversation |
| `/model opusplan` | Opus in plan mode, Sonnet for execution, but every plan-mode toggle is a model switch and a full re-read | `/model opusplan` or `--model opusplan` | MC#opusplan-model-setting; PC#switching-models |
| Fast mode cost | Opus 5.5 fast is $8/$40 per MTok. Turning it on mid-session bills the whole context uncached at fast rates once per conversation | `/fast`; turn it on at session start or not at all | https://code.claude.com/docs/en/fast-mode#understand-the-cost-tradeoff; PC#turning-on-fast-mode |
| Thinking controls | `MAX_THINKING_TOKENS` only matters for fixed-budget models; adaptive models ignore nonzero values. `0` disables thinking except on Opus 5.5 and Fable, which cannot turn it off | env var; `/config` thinking toggle; Alt+T | ENV `MAX_THINKING_TOKENS`; MC#extended-thinking; COSTS#adjust-extended-thinking |
| `ultrathink` keyword | Deep reasoning for one turn without changing the session effort (and so without an effort-change cache miss) | put `ultrathink` in the prompt | MC#use-ultrathink-for-one-off-deep-reasoning |
| `maxEffortLevel` | Caps effort (including per model) | settings, v2.1.267+ | CL 2.1.267; SR |
| Skill/subagent `effort` frontmatter | Low effort for mechanical agents | `effort: low` in frontmatter | MC#set-the-effort-level |
| Output style Concise | Fewer output tokens; switching styles keeps the cache (v2.1.251+) | `/output-style concise` | https://code.claude.com/docs/en/output-styles; PC#changing-output-style |
| Hooks to prefilter output | Turns a 10K-line log into matching lines | PreToolUse hook rewriting the command | COSTS#offload-processing-to-hooks-and-skills |
| Hook context cost | `additionalContext` and stdout enter context, capped at 10,000 characters, then a file plus 2,000-character preview | keep hook output small | https://code.claude.com/docs/en/hooks |
| Code intelligence plugins | One go-to-definition instead of grep plus several reads | install from `/plugin` | COSTS#install-code-intelligence-plugins-for-typed-languages |
| Prefer CLIs over MCP | No per-tool listing | `gh`, `aws` and similar | COSTS#reduce-mcp-server-overhead |
| `--bare` | Skips CLAUDE.md, MCP, skills, hooks, memory for scripted calls | `claude --bare -p` | https://code.claude.com/docs/en/cli-reference |
| `--max-turns`, `--max-budget-usd` | Hard caps for print mode | CLI flags | https://code.claude.com/docs/en/cli-reference |
| `--exclude-dynamic-system-prompt-sections` | Cache reuse across machines and users for `-p` fleets | CLI flag | https://code.claude.com/docs/en/cli-reference |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` | Holds 1M models to a 200K window, so they compact at 200K | env `=1` | MC#extended-context |
| `DISABLE_AUTOUPDATER` | Controls when an upgrade's uncached first turn happens | env `=1` | PC#upgrading-claude-code |
| Idle-time spenders | Scheduled tasks, cross-session messages (`crossSessionInbound: "hold"`), goal check-ins (`CLAUDE_CODE_GOAL_CHECKIN_MINUTES=0`) each send the full context while idle | settings/env | COSTS#why-usage-climbs-in-a-long-session |
| Background token usage | Summarization for `--resume`, under $0.04 per session. Not a meaningful lever. `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` covers telemetry and updates, not model calls: a documented model-call saving from it was not found | n/a | COSTS#background-token-usage; ENV |
| Agent teams | About 7x the tokens of a standard session in plan mode | keep team tasks small | COSTS#manage-agent-team-costs |
| Advisor tool | Haiku main plus Opus advisor costs less than an Opus main; toggling keeps the cache | `/advisor opus` | https://code.claude.com/docs/en/advisor; PC#connecting-or-disconnecting-an-mcp-server |
| Resume from summary | Large sessions resumed after a long break carry a summary instead of full history (Pro/Max) | accept the offer on resume | PC#cache-lifetime; https://code.claude.com/docs/en/sessions |
| Plugins with MCP servers | Enabling mid-session with upfront tools is a full re-read. `/reload-plugins` warns first | enable at session start | PC#enabling-or-disabling-a-plugin |
| Opus 5.5 cache reads | Priced at 0.05x base input, not 0.1x. The `COST_WEIGHT.cacheRead = 0.1` placeholder overstates Opus 5.5 reads, and Fable 5.1 is 0.025x | n/a (affects the meter math) | API pricing footnotes; CL 2.1.280 |

### Not found

* A documented default token limit for the Read tool, or a documented 2,000-line default. The env var `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS` exists, but its default value is not stated (ENV; TR#read-tool-behavior).
* Any primary source for "Subagent work is mostly reading and searching."
* Documentation that the session JSONL transcripts carry `cache_creation.ephemeral_1h_input_tokens`. The field names are documented only for `-p --output-format json` (PC). The transcript presence was observed on this machine.

## Part B: Token-efficiency rules: pricing and cache facts checked against vendor docs

Date: 2026-09-24. Scope: `packages/workflow-rules/src/efficiency.ts` (the eight rules, `COST_WEIGHT`),
the atoms in `packages/workflow-rules/src/daily.ts` (`EfficiencyDay`, `CACHE_TTL_SEC = 300`), the
extractor in `packages/cli/src/workflow/reducer.ts` (lines 715 to 760) and the rate wiring in
`convex/lib/efficiency.ts` (`ratesFor`). Every vendor claim below carries its URL. "Not found" means
the primary source did not say it.

Sources used:

- A1 Claude prompt caching: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- A2 Claude pricing: https://platform.claude.com/docs/en/about-claude/pricing
- A3 Claude context windows: https://platform.claude.com/docs/en/build-with-claude/context-windows
- A4 Claude effort: https://platform.claude.com/docs/en/build-with-claude/effort
- A5 Claude extended thinking: https://platform.claude.com/docs/en/build-with-claude/extended-thinking
- C1 Claude Code prompt caching: https://code.claude.com/docs/en/prompt-caching
- C2 Claude Code costs: https://code.claude.com/docs/en/costs
- O1 OpenAI prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching (markdown at `.md`)
- O2 OpenAI pricing: https://developers.openai.com/api/docs/pricing (markdown at `.md`)
- G1 Gemini caching (generateContent): https://ai.google.dev/gemini-api/docs/generate-content/caching
- G2 Gemini caching (Interactions): https://ai.google.dev/gemini-api/docs/caching
- G3 Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- G4 Google Cloud context cache overview: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/context-cache/context-cache-overview

### 1. COST_WEIGHT = { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 }

#### Claude cache multipliers

- 5-minute write is 1.25x base input, 1-hour write is 2x base input (A1, A2 "Prompt caching" table).
- Cache read is 0.1x on most models, but NOT on the newest ones (A2 footnotes 1 and 2, A1):
  - Claude Fable 5.1 and Claude Mythos 5.1: 0.025x ($0.25 read on $10 input).
  - Claude Opus 5.5: 0.05x ($0.20 read on $4 input).
  - All other models: 0.1x (Opus 5 $0.50 on $5, Sonnet 5 $0.20 on $2, Sonnet 4.6 $0.30 on $3, Haiku 4.5 $0.10 on $1).
- A read also refreshes the entry "for no additional cost" (A1).

Verdict: `cacheWrite: 1.25` is right only for 5-minute writes. A Claude subscription writes the main
conversation at the 1-hour TTL by default (C1 "Which TTL each request gets"), and those writes cost
2x. `cacheRead: 0.1` is 2x to 4x too high for Opus 5.5 and Fable 5.1, the current top models.
The CLI already records the split (`cacheWriteTtl: { fiveMinute, oneHour, unsplit }` in
`packages/workflow-rules/src/usage.ts`), but `ratesFor` in `convex/lib/efficiency.ts` passes only
`cacheWrite5m` and never a read rate.

#### Output 5x input

Correct for every Claude model on the A2 table: Fable 5.1 and 5 ($10/$50), Mythos 5.1 and 5 ($10/$50),
Opus 5.5 ($4/$20), Opus 5 to 4.5 ($5/$25), Opus 4.1 and 4 ($15/$75), Sonnet 5 ($2/$10), Sonnet 4.6,
4.5, 4 ($3/$15), Haiku 4.5 ($1/$5), Haiku 3.5 ($0.80/$4). Fast mode keeps 5x (Opus 5.5 $8/$40) (A2).

Not correct for other vendors, and `COST_WEIGHT` is applied to every harness:

- OpenAI (O2 standard table): gpt-6-astra, gpt-6-sol, gpt-6-luna and gpt-5.6-sol are 5x;
  gpt-5.6-terra and gpt-5.6-luna are 6x; gpt-5.5 and gpt-5.4 are 6x; gpt-5.2 is 8x; gpt-5.1 and gpt-5 are 8x.
- Gemini (G3): 3.8 and 3.7 Flash 5x ($0.75/$3.75), 3.5 Flash 6x ($1.50/$9), 3.1 Pro Preview 6x
  ($2/$12), 2.5 Pro 8x ($1.25/$10), 2.5 Flash about 8.3x ($0.30/$2.50).

Cache weights for other vendors (O1 "Summary of model differences", G4):

- OpenAI GPT-5.6 and later: read 0.1x, write 1.25x. Before GPT-5.6: model-dependent read rate and
  "No additional cache-write charge" (a write is billed as ordinary input, 1.0x). Examples from O2:
  gpt-5.5 read $0.50 on $5 (0.1x), gpt-4.1 read $0.50 on $2 (0.25x), gpt-4o 0.5x.
- Gemini 2.5 and newer: implicit cache hit is a 90% discount (0.1x); creating the cache is billed "at
  the standard input token price" (1.0x); no storage cost for implicit caching (G4).

Note that `output: 5` is declared but never read by any rule in `efficiency.ts`.

### 2. "The prompt cache expires 5 minutes after the last call"

Claude API: default lifetime is 5 minutes and "The cache is refreshed for no additional cost each
time the cached content is used" (A1). So each hit does refresh it. Two refinements from A1:

- The lifetime "is measured from the start of the request that writes or reads the cache entry, not
  from the end of its response." A 4-minute streamed response leaves about 1 minute. The reducer
  measures `gapSec` between call timestamps (`reducer.ts` line 740); whether `tsMs` is request start or
  response end is not documented in the reducer, so a long response can hide a real expiry.
- A 1-hour TTL exists at 2x write cost (A1, A2).

Claude Code changes the default (C1 "Which TTL each request gets", C2 "Why usage climbs"):

- Claude subscription within plan usage: main conversation gets ONE HOUR by default. Subagents,
  compaction, workflows and other requests get five minutes.
- Usage credits, API key or cloud provider: five minutes by default.
- Overrides: `promptCacheTtl` setting or `CLAUDE_CODE_PROMPT_CACHE_TTL` for the main conversation,
  `subagentPromptCacheTtl` or `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL` for the rest, both v2.1.242+;
  `ENABLE_PROMPT_CACHING_1H=1` and `FORCE_PROMPT_CACHING_5M=1` also exist (C1 "Choose the TTL yourself").

Consequences for the rules:

- `CACHE_TTL_SEC = 300` is hard-coded for every harness. For a subscription user every call 5 to 60
  minutes after the last one is counted in `callsAfterGap` although the cache was warm. The rule's
  meter partly self-corrects (it prices `cacheWriteAfterGap`, which is only the new tail when the
  read hits), but the tile figure "calls after a break" and the evidence line "calls more than 5 min
  after the last" are overstated.
- The cache fix "Use the 1h cache TTL" is already the default for subscription users within plan,
  so for them the advice is a no-op. It is real advice for API-key, usage-credit and cloud users.
- The step text "It works on API keys and Claude subscriptions" matches C1: the setting applies to
  both, and on a subscription it matters when drawing on usage credits.

### 3. Switches rule: what invalidates, and what else produces a write with no read

The rule's extractor (`reducer.ts` lines 746 to 752): a main call after the first with
`cacheWriteTokens > 0 && cacheReadTokens === 0` is an orphan.

#### Claude API invalidation table (A1, "What invalidates the cache")

| Change | Tools cache | System cache | Messages cache |
| --- | --- | --- | --- |
| Tool definitions | miss | miss | miss |
| Web search toggle, citations toggle | hit | miss | miss |
| Speed setting (fast) | hit | miss | miss |
| tool_choice | hit | hit | miss |
| Images added or removed | hit | hit | miss |
| Thinking parameters (mode, budget_tokens) | model-specific | model-specific | miss |
| Effort setting (`output_config.effort`) | model-specific | model-specific | miss |
| Non-tool results with extended thinking | hit | hit | model-specific (hit on Opus 4.5+ and Sonnet 4.6+) |
| Dropped thinking blocks (Fable 5.1, Mythos 5.1, Opus 5.5) | hit | hit | miss from that block on |

Also from A1: effort set explicitly to the model's default does not invalidate; a per-message effort
change (a `role: "system"` message) "leaves the cached prefix intact"; hits require "100% identical
prompt segments"; caches are isolated per organization and, on the Claude API, per workspace.

Model: A1 does not state that caches are per model (not found on A1). C1 states it directly: "each
model has its own cache. Switching models recomputes the entire request even when the content is
identical."

Claude Code's own list of invalidating actions (C1 "Actions that invalidate the cache"): switching
models (including `opusplan` plan-mode toggles, automatic model fallback on Fable, Opus 5.5 and Opus 5,
and a skill or command whose frontmatter names another model), changing effort, turning on fast mode
(once per conversation), connecting or disconnecting an MCP server when its tools are loaded into the
prefix (not when deferred by tool search, the default), enabling or disabling a plugin that provides
MCP servers, denying an entire tool when tool search is off, compacting, accumulating many images
(batch eviction), and upgrading Claude Code (applies on next launch).

Effort exception: "On Opus 5.5 and Fable 5.1 with an API key or a Claude subscription, changing effort
keeps the cache" (C1, "Changing effort level"; before v2.1.260 Fable 5.1 still invalidated). The API
supports per-message effort that keeps the cache on Fable 5.1, Mythos 5.1, Opus 5.5 and Opus 5 (A4,
"Change effort mid-conversation", beta header `mid-conversation-output-config-2026-07-01`).

#### Other causes of write-with-no-read (double counting and misattribution)

1. TTL expiry after a break. After expiry nothing is left to read, so the call writes the whole prefix
   and reads zero (A1 lifetime; C2 "your first message after a break longer than the cache lifetime
   misses the cache and reprocesses your full context"). The reducer counts that call in BOTH
   `callsAfterGap` (rule 1) and `orphanCacheWrites` (rule 2), because the orphan test has no gap
   condition. This is a real double count, and the switches verdict then blames a model, effort or
   tool-set change for what was a break.
2. Concurrent requests: "a cache entry only becomes available after the first response begins" (A1).
   Two main calls sent in parallel can both write with no read. Whether Claude Code sends parallel main
   calls is not found.
3. Compaction: not an orphan in Claude Code. C1 says compaction "invalidates the conversation layer"
   but "Claude Code reuses the system prompt layer", so the next call reads the system layer and
   `cacheRead > 0`. Exception in C1: a resumed conversation that kept an old system prompt rebuilds that
   layer once on first compaction, which can be a full miss.
4. Subagent start: out of scope, the atoms are main calls only (`daily.ts` doc comment). C1 confirms a
   subagent's first request does not read the parent's cache and a fork does.
5. Resume after an upgrade or with a different `--append-system-prompt`: C1 says a resumed conversation
   keeps its original system prompt by default, so this is usually not a miss.
6. Anything below the minimum cacheable length writes nothing (A1), so it cannot be an orphan.

The opposite error also exists: many real invalidations leave `cacheRead > 0` and are missed. Per the
A1 table, `tool_choice`, images, thinking and effort changes (on models that render the config after
tools and system) invalidate only the messages cache, so the tool and system layers still read. Image
eviction in Claude Code reprocesses only "from the earliest of those messages onward" (C1). The orphan
test therefore catches FULL misses only: model switch, tool-definition change, fast-mode header, TTL
expiry, and effort changes on models that render effort ahead of tools. Which models render the thinking
or effort config ahead of tools and system is "model-specific" and the list is not found in A1.

### 4. Context rule: "A 150K-token prefix costs about four times a 40K one on every call"

Arithmetic: 150/40 = 3.75, so "about four times" holds for any linear price, cached or not, as long as
both prefixes are billed the same way. With caching the ratio is unchanged but the absolute per-call
cost is small: a cached 150K prefix costs 15K input-equivalents at 0.1x, 7.5K at 0.05x on Opus 5.5 and
3.75K at 0.025x on Fable 5.1 (A2). C2 agrees that long context costs on every call: "Claude Code re-reads
that history at the cached token rate, so a one-line question in a session that has been open all day
still draws usage for the whole conversation."

Long-context premium:

- Claude: none on current models. "Claude 4.6 and later models and Claude Mythos Preview include the full
  1M token context window at standard pricing. (A 900k-token request is billed at the same per-token rate
  as a 9k-token request.)" (A2, "Long context pricing"; A3). Sonnet 4.5 and other older models have a
  200K window (A3). A per-model premium for older models is not found on the current A2 page.
- OpenAI: yes. gpt-5.5 and gpt-5.4 rows are labelled "<272K context length"; long context doubles input
  and cached input and makes output 1.5x (gpt-5.5 $5 to $10 input, $30 to $45 output). GPT-6 and
  GPT-5.6 rows also carry long-context columns at 2x input and 1.5x output; the token threshold for those
  rows is not stated in the O2 markdown (not found).
- Gemini: yes on Pro models. 3.1 Pro Preview and 2.5 Pro double input and cache price and raise output
  1.5x for prompts over 200K tokens (G3). The Flash rows show no tier (G3).

So the sentence is fair as a ratio, but it hides that the cost of a cached prefix is dominated by the
read rate, and it misses the one real step change: crossing 200K or 272K on OpenAI and Gemini Pro
reprices the whole request.

### 5. Effort rule

"Effort scales thinking output, the most expensive token":

- Thinking tokens "are billed as output tokens" (A3; C2 "Thinking tokens are billed as output tokens").
  Output is the most expensive token class on every Claude model (5x input, A2). True.
- But effort is not thinking-only: "The effort parameter affects all tokens in the response, including
  text responses and explanations, tool calls and function arguments, thinking (when active)" (A4). On
  Opus 5, "Effort controls thinking volume, not visible response length" (A4). The sentence is close
  enough, but "thinking and tool calls" is more accurate.
- On models that keep prior thinking blocks (Opus 4.5+, Sonnet 4.6+, Fable, Mythos), those blocks are
  "billed as input tokens" on later requests (A3), so high effort also inflates context and every later
  read.

"Changing it mid-session also rebuilds the cache":

- True on most models: top-level effort "shapes the rendered prompt, changing it between requests doesn't
  preserve cached prefixes" (A4); A1 table row "Effort setting".
- False on Opus 5.5 and Fable 5.1 in Claude Code with an API key or subscription (C1), and false through
  the API's per-message effort on Fable 5.1, Mythos 5.1, Opus 5.5 and Opus 5 (A4).
- Defaults: `high` on most models, `medium` on Opus 5.5; setting effort to the default equals omitting it
  (A4). The step "Make medium the default" is a no-op on Opus 5.5.

Measurement gap: `EffortLevel` is `"low" | "medium" | "high" | "other"` (`daily.ts` line 294). A4 lists
five levels including `xhigh` and `max`. Unless the CLI folds `xhigh` and `max` into `high`, they land in
`other` and the rule's `high` share, the one it meters, misses the two most expensive levels. How the CLI
maps them is not checked here.

### 6. Minimum cacheable length and breakpoints

- Minimums (A1): 512 tokens for Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Fable 5, Mythos 5; 1,024 for
  Opus 4.8, Sonnet 5, Sonnet 4.6, 4.5, Opus 4.1, Opus 4, Sonnet 4; 2,048 for Mythos Preview, Opus 4.7,
  Haiku 3.5; 4,096 for Opus 4.6, Opus 4.5, Haiku 4.5. Shorter prompts are processed without caching and
  "no error is returned."
- Up to 4 explicit breakpoints per request; automatic caching looks back at most 20 blocks per
  breakpoint (A1). OpenAI GPT-5.6+ allows up to four cache writes per request (O1).
- OpenAI GPT-5.6+ minimum 1,024 visible tokens; earlier models vary with settings (O1). Gemini implicit
  minimums: 4,096 on 3.x Flash and 3.1 Pro Preview, 2,048 on 2.5 (G2).

Relevance: small. A coding-harness prefix is far above every minimum, so no rule is affected. The 20-block
lookback can in principle turn a long tool-heavy turn into a messages-layer miss, but the system and tool
layers still read, so it does not create orphans. The minimum matters only if a rule ever counts
`cacheWrite == 0` as "not caching".

### 7. Non-Claude advice ("Work in contiguous blocks", "The cache survives about 5 minutes")

OpenAI (O1):

- Caching is automatic ("enabled by default for supported OpenAI models").
- GPT-5.6 and later: `prompt_cache_options.ttl`, only value `30m`, the default; a prefix stays reusable
  "for 30 minutes after its most recent write or reuse". Read 0.1x, write 1.25x.
- GPT-5.5 and 5.5 Pro: `24h` only, "typically around 30 minutes, up to 24 hours".
- Other earlier models: `in_memory` "around 5 to 10 minutes of inactivity, up to one hour", or `24h`.
  Where both exist, organizations without Zero Data Retention default to `24h`, ZDR organizations to
  `in_memory`. Extended retention is supported by gpt-5.5, gpt-5.5-pro, gpt-5.4, gpt-5.2,
  gpt-5.1-codex-max, gpt-5.1, gpt-5.1-codex, gpt-5.1-codex-mini, gpt-5.1-chat-latest, gpt-5,
  gpt-5-codex and gpt-4.1.
- Prefix breakers: model, tools, parallel_tool_calls, text.format, reasoning.effort, text.verbosity,
  context_management (compaction). GPT-6 can change effort via a `configuration_update` item without
  rewriting the prefix.
- Reuse depends on routing to a machine holding the entry; traffic above about 15 requests per minute
  per prefix can overflow (O1).
- How Codex CLI sets retention, and whether ChatGPT-plan Codex usage follows API caching rules: not found.

Gemini (G1, G2, G4): implicit caching is on by default for 2.5 and newer, "no cost saving guarantee"
(G1), 90% discount on hits (G4). The implicit cache lifetime is not documented; the docs only say "send
requests with a similar prefix in a short amount of time" (G2, G4). Explicit caches default to a 1-hour
TTL and bill storage per hour (G1, G3).

Verdict:

- "Work in contiguous blocks" is correct advice for every vendor.
- "The cache survives about 5 minutes between calls" is wrong for most Codex users: 30 minutes minimum
  on GPT-5.6+, typically about 30 minutes up to 24 hours on 24h retention, which is the default for
  non-ZDR organizations on the Codex models listed. It is right only for `in_memory` retention, and it is
  unsupported for Gemini (lifetime not documented).
- `CACHE_TTL_SEC = 300` applied to Codex over-counts `callsAfterGap` for the same reason.

### 8. Rule-by-rule: meter and dollar formulas

Notation per model m: `i` input rate, `w5` and `w1h` write rates, `r` read rate, `o` output rate (all A2
or O2 or G3). Current code hands only `input` and `cacheWrite5m` (`ratesFor`), at the harness's top model.

#### Rule 1, cache (usd = rewarmTokens x cacheWrite)

Problems:

- Wrong counterfactual. Had the cache been warm, those prefix tokens would have been read, not free. The
  avoidable cost is `prefix x (w - r)`, not `prefix x w`. At Claude 0.1x that is 1.15/1.25 = 92% of the
  printed figure, at Opus 5.5 0.05x it is 96%. The overstatement is small but the label says "lower bound".
- `cacheWriteAfterGap` includes the new tail each call writes anyway (the latest exchange), which would
  have been written on a warm cache too. That part is not avoidable.
- Writes at the 1-hour tier (subscription default) cost 2x, not 1.25x, so the figure is low there, and on
  a subscription the dollars are notional.
- A 300-second gap is not a miss on a 1-hour TTL or on OpenAI 30m/24h retention.
- The meter's denominator weights reads at 0.1, too high for Opus 5.5 and Fable 5.1, which understates the
  share.

Correct bound: classify a call as a re-warm when `gap > TTL_in_effect AND cacheRead == 0` (or when
`cacheRead` is far below the previous call's context), and record `rewarmPrefixTokens = min(cacheWrite,
previousCallContext)`. Then `usd = rewarmPrefixTokens x (w_tier - r)`, priced per model at the call's own
tier using the existing `cacheWriteTtl` split. For the "switch to 1h" advice, the net saving is
`sum over gaps in (5 min, 60 min] of prefix x (w5 - r)  minus  sum of all main-conversation writes x (w1h - w5)`;
print the advice only when that is positive.

#### Rule 2, switches (usd null)

Meter formula is wrong: it includes every after-gap full miss (double count with rule 1) and blames a
switch for it. Fix in the reducer: count an orphan only when `gapSec <= TTL_in_effect`, or publish an
`orphanAfterGap` split so the rule can subtract. Dollar bound: `orphanTokens x (w - r)` at the call's
model rate. Note that a model switch's first call is billed at the new model's rates.

#### Rule 3, tools (usd null)

No dollar is possible from bytes alone. A bound needs tokens (Anthropic's rough rule is about 4
characters per token, A2 FAQ) times the number of later calls that re-read the result until compaction,
times `r`. That needs a new atom (result tokens x calls remaining in the session). Keep null until then.

#### Rule 4, context (usd null)

The sentence is right as a ratio. A dollar bound needs the sum over calls of `max(0, context - target) x r`
(the read cost of the excess), which the peak-only histogram cannot give. Add an atom such as
`cacheReadAboveHighContext` (sum of cache reads on calls whose context is at or above 128K). For OpenAI and
Gemini Pro, add the tier step: calls over 272K or 200K pay 2x input and 1.5x output on the whole request.

#### Rule 5, routing (usd null)

Bound: subagent tokens on the top model priced at the top model minus the same tokens at the recommended
model, per category: `sum_c tokens_c x (rate_top_c - rate_small_c)`. The routing atom carries total tokens
per model, not the input, read, write and output split, so a per-category atom is needed; pricing total
tokens at the input rate would mix categories.

#### Rule 6, startup (usd null)

"The first call ... is a cache write" is mostly right, but C1 "Cache scope" says parallel sessions in the
same directory read each other's cache, and sequential sessions share it when the startup git snapshot
matches, so some first calls are reads. Bound per session: trimmed startup tokens x (`w` on the first call +
`r` on each later call). Needs startup tokens per session times calls per session, which the atoms do not pair.

#### Rule 7, effort (usd null)

Leave null. No vendor document gives a thinking-token reduction ratio per effort step (not found; A4 calls
effort "a behavioral signal, not a strict token budget"). A truthful figure is only "thinking and output
tokens spent at high effort x o", as spend, not savings. Also fix the level mapping for `xhigh` and `max`,
and drop the cache sentence for Opus 5.5 and Fable 5.1.

#### Rule 8, sessions (usd = shortSessionFirstCallTokens x input)

Wrong rate: the first call's context is mostly a cache write (`w`, 1.25x or 2x) or a read (`r`) when a sibling
session warmed it, never plain input. And asking inside a running session is not free: it reads that
session's larger context at `r`. A bound: `sum over short sessions of (firstCallWrite x w + firstCallRead x r)`
as the startup actually paid, labelled as an upper bound on what staying in a running session saves. Needs the
first call's write and read split as atoms instead of one `contextTokens` sum.

#### Scorecard total

`recoverableUsd` in `convex/lib/efficiency.ts` sums rule dollars. A two-call short session whose second call
came after a break is in both rule 1 and rule 8 today, so the sum can double count a little. It also prices at
the harness's single top model (`ratesFor`), while tokens span several models.

### 9. Summary of flags

1. `cacheRead: 0.1` is wrong for Opus 5.5 (0.05) and Fable 5.1 and Mythos 5.1 (0.025) (A2).
2. `cacheWrite: 1.25` ignores 1-hour writes at 2x, the Claude Code subscription default (A1, C1).
3. `output: 5` is right for all Claude models, wrong for most OpenAI (6x to 8x) and Gemini (5x to 8.3x); it is also unused.
4. `CACHE_TTL_SEC = 300` is wrong for subscription Claude Code (1 hour), OpenAI GPT-5.6+ (30 min) and 24h retention.
5. Switches rule double counts every TTL-expiry miss and misses partial invalidations.
6. Effort rule's cache sentence is false on Opus 5.5 and Fable 5.1 in Claude Code, and `xhigh` and `max` likely fall in `other`.
7. Cache rule prices re-warm at `w` instead of `w - r`, and includes the unavoidable tail.
8. Sessions rule prices startup at plain input, which is not what the first call paid.
9. Non-Claude "about 5 minutes" is wrong for most Codex users; Gemini's implicit lifetime is undocumented.
10. No long-context premium on current Claude models; there is one on OpenAI gpt-5.x and Gemini Pro above 272K and 200K.

## Part C: Token-efficiency levers for the non-Claude harnesses

Researched 2026-09-24 for the eight rules in `packages/workflow-rules/src/efficiency.ts`
(cache, switches, tools, context, routing, startup, effort, sessions). Each rule gives
Claude Code concrete steps and every other harness generic ones. This file lists the
documented equivalents per harness, so the generic branch can become per-harness steps.

Primary sources only. Open source harnesses were read from shallow clones at these commits:

| Harness id (CLI) | Label | Source read | Commit |
| --- | --- | --- | --- |
| `codex` | Codex | github.com/openai/codex plus learn.chatgpt.com docs | `53446f90a566` |
| `opencode` | opencode | github.com/anomalyco/opencode (docs in `packages/web/src/content/docs`) | `0f549842ee74` |
| `pi-mono` | Pi | github.com/earendil-works/pi-mono (docs in `packages/coding-agent/docs`) | `b45597504eea` |
| `grok-build` | Grok Build | github.com/xai-org/grok-build (docs in `crates/codegen/xai-grok-pager/docs/user-guide`) | `f0e3be1100ef` |
| `cursor` | Cursor | cursor.com/docs (closed source; `.md` versions of the pages) | n/a |

Harness ids come from `packages/cli/src/harness/` (adapters `claude`, `codex`, `cursor`,
`grok`, `opencode`, `pi`) and `HARNESS_LABELS` in `src/features/usage/HarnessShareRows.tsx`
(`claude-code`, `codex`, `cursor`, `grok-build`, `opencode`, `pi-mono`). **Gemini CLI has no
adapter**, so it is out of scope. A "Grok CLI" separate from Grok Build was not found in the adapters.

URL prefixes used below, to keep the tables readable:

- `CX` = https://github.com/openai/codex/blob/53446f90a56692dede3c8f413e8d486a6adb77b5/
- `CXDOC` = https://learn.chatgpt.com/docs/config-file/config-reference (redirect target of https://developers.openai.com/codex/config-reference)
- `CXCMD` = https://learn.chatgpt.com/docs/developer-commands?surface=cli (redirect target of https://developers.openai.com/codex/cli/slash-commands)
- `OC` = https://github.com/anomalyco/opencode/blob/0f549842ee746e400b1f72516b0b2e292e267e2c/
- `OCDOC` = `OC` + `packages/web/src/content/docs/` (published at https://opencode.ai/docs/)
- `PI` = https://github.com/earendil-works/pi-mono/blob/b45597504eeaba1f11a9920a1d1048c361ed4b8e/
- `PIDOC` = `PI` + `packages/coding-agent/docs/`
- `GB` = https://github.com/xai-org/grok-build/blob/f0e3be1100ef5252488e3be8bb0e91cf68d8c305/
- `GBDOC` = `GB` + `crates/codegen/xai-grok-pager/docs/user-guide/`
- `CU` = https://cursor.com/docs/

---

### Codex (`codex`)

Config file: `~/.codex/config.toml` ("Base config deserialized from ~/.codex/config.toml", `CX`codex-rs/config/src/config_toml.rs).

| Lever | Documented equivalent | Source |
| --- | --- | --- |
| 1. cache | **No retention or TTL key found.** Codex sends a `prompt_cache_key` per conversation and has no config key for retention. `service_tier` is the only request-level cost knob. | `CX`codex-rs/core/src/client.rs (prompt_cache_key), `CXDOC` (no cache key listed) |
| 2. switches | Model at start: `codex -m <model>` (`--model`). Any key at start: `codex -c key=value`, e.g. `codex -c model_reasoning_effort=medium`. Named bundles: `--profile <name>` / `-p` layers `$CODEX_HOME/<name>.config.toml`. Defaults: `model = "..."` and `model_reasoning_effort = "..."` in config.toml. Mid-session switch is `/model` ("choose what model and reasoning effort to use"), which is what to avoid. | `CX`codex-rs/utils/cli/src/shared_options.rs, `CX`codex-rs/utils/cli/src/config_override.rs, `CXCMD`, `CX`codex-rs/tui/src/slash_command.rs |
| 3. tools | `tool_output_token_limit` (number): "Token budget for storing individual tool/function outputs in history." MCP: `mcp_servers.<id>.enabled_tools` / `disabled_tools` allow and deny lists. Reading by range: Codex has no dedicated read tool with offset/limit; files are read through the shell (not found as a documented read tool). | `CXDOC`, `CX`codex-rs/config/src/config_toml.rs, `CX`codex-rs/config/src/mcp_types.rs |
| 4. context | `/new` "start a new chat during a conversation"; `/clear` "clear the terminal and start a new chat"; `/compact` "summarize conversation to prevent hitting the context limit". Auto compact: `model_auto_compact_token_limit` (unset uses model defaults), `model_auto_compact_token_limit_scope = total \| body_after_prefix`, `model_post_turn_compact_threshold_percent` (0 to 100, 0 disables), `compact_prompt` to override the summary prompt. | `CX`codex-rs/tui/src/slash_command.rs, `CXDOC`, `CX`codex-rs/config/src/config_toml.rs |
| 5. routing | `[agents] default_subagent_model = "..."` and `default_subagent_reasoning_effort = "..."` ("Default model for spawned agents. An explicit spawn model takes precedence."). Roles: `[agents.<role>] config_file = "./agents/<role>.toml"`. `agents.enabled` turns multi-agent tools off. `review_model` sets the `/review` model. | `CXDOC`, `CX`codex-rs/config/src/config_toml.rs (AgentsToml) |
| 6. startup | Instruction files: every `AGENTS.md` from the project root (found by `project_root_markers`, default `.git`) down to the cwd, concatenated. `AGENTS.override.md` is the local override name. `project_doc_max_bytes` caps the bytes read (default 32 KiB). `project_doc_fallback_filenames` adds other names. MCP off without deleting: `[mcp_servers.<id>] enabled = false`. Remove: `codex mcp remove <name>`. List in session: `/mcp`. | `CX`codex-rs/core/src/agents_md.rs, `CX`codex-rs/config/src/config_toml.rs, `CXDOC`, `CX`codex-rs/cli/src/mcp_cmd.rs |
| 7. effort | `model_reasoning_effort` in `~/.codex/config.toml`. Documented values: "low, medium, high, xhigh, max, or ultra" (as advertised by the model). The enum also has `none`, `minimal`, `persistent`; the enum default is `medium`. `plan_mode_reasoning_effort` overrides Plan mode only. | `CXDOC`, `CX`codex-rs/protocol/src/openai_models.rs |
| 8. sessions | Resume: `codex resume` (picker) or `codex resume --last`; `/resume`; `/fork`. Quick question inside a session: `/side` (alias `/btw`) "start a side conversation in an ephemeral fork". One-shot: `codex exec "..."`. | `CXCMD`, `CX`codex-rs/cli/src/main.rs, `CX`codex-rs/tui/src/slash_command.rs |

Extra Codex levers:

- **Service tier / Fast mode.** `service_tier` "Preferred service tier for new turns. Use fast or another tier advertised by the active model." Source comment lists `default`, `priority`, `flex`, legacy `fast`. `features.fast_mode` (on by default) exposes Fast-tier commands; the docs list `/fast`. Fast costs more, so it is an anti-lever for cost. (`CXDOC`, `CX`codex-rs/config/src/config_toml.rs, `CXCMD`)
- **`model_verbosity`** (Responses API `text.verbosity`) and `model_reasoning_summary` change output length. (`CX`codex-rs/config/src/config_toml.rs)
- **`model_context_window`** declares the window, which drives when auto compact fires. (`CXDOC`)
- **Profiles** (`--profile`) are the cleanest way to "pick model and effort at start" without editing the base file. (`CXCMD`)

---

### opencode (`opencode`)

Config file: `opencode.json` / `opencode.jsonc` (project) and the global config dir; `$schema` is `https://opencode.ai/config.json` (`OCDOC`config.mdx).

| Lever | Documented equivalent | Source |
| --- | --- | --- |
| 1. cache | **No TTL or retention setting found.** opencode marks the first two system messages and last two messages `cacheControl: { type: "ephemeral" }` (5-minute default on Anthropic) and sets `promptCacheKey` to the session id for OpenAI-style providers. Provider option `setCacheKey: true` "Ensure a cache key is always set for designated provider." | `OC`packages/opencode/src/provider/transform.ts, `OCDOC`config.mdx |
| 2. switches | Start flag: `opencode --model provider/model` (`-m`); `opencode run --variant <v>` ("Model variant (provider-specific reasoning effort)"). Default: `"model": "provider/model"` in opencode.json. Mid-session switches to avoid: `/models`, `variant_cycle` keybind (`ctrl+t`). | `OCDOC`cli.mdx, `OCDOC`config.mdx, `OCDOC`keybinds.mdx, `OCDOC`tui.mdx |
| 3. tools | Read tool takes `offset` and `limit`; default 2000 lines, lines cut at 2000 chars, output capped at 50 KB with a "Use offset=N to continue" hint. Other tool output is cut at 2000 lines / 50 KB and the full text goes to a file the model can inspect. **No user config key for these caps found.** `compaction.prune: true` removes old tool outputs. | `OC`packages/opencode/src/tool/read.ts, `OC`packages/opencode/src/tool/truncate.ts, `OCDOC`config.mdx |
| 4. context | `/new` "Start a new session. Alias: `/clear`". `/compact` "Compact the current session. Alias: `/summarize`". Auto compact: `"compaction": { "auto": true, "prune": false, "reserved": 10000 }` (`auto` default true, `prune` default false). Env `OPENCODE_DISABLE_AUTOCOMPACT`. | `OCDOC`tui.mdx, `OCDOC`config.mdx, `OCDOC`cli.mdx |
| 5. routing | Built-in subagents General, Explore, Scout. Per-agent model: `"agent": { "<name>": { "model": "provider/model" } }` or `model:` in agent markdown frontmatter. "subagents will use the model of the primary agent that invoked the subagent" when unset. Per-agent effort passes through, e.g. `"reasoningEffort": "high"`. | `OCDOC`agents.mdx |
| 6. startup | Instruction files: project `AGENTS.md`, global `~/.config/opencode/AGENTS.md`; falls back to `CLAUDE.md` and `~/.claude/CLAUDE.md`. Extra files via `"instructions": [...]`. `OPENCODE_DISABLE_CLAUDE_CODE`, `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT`, `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` stop the Claude fallbacks. MCP off: `"mcp": { "<name>": { "enabled": false } }`, or hide tools with `"tools": { "<name>*": false }`. | `OCDOC`rules.mdx, `OCDOC`config.mdx, `OCDOC`cli.mdx, `OCDOC`mcp-servers.mdx |
| 7. effort | No single global effort key found. Effort is a model variant or a provider option: `provider.<id>.models.<model>.options.reasoningEffort` (e.g. `"high"`), custom `variants`, or per agent. OpenAI built-in variants: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`; Anthropic: `high` (default), `max`; Google: `low`, `high`. | `OCDOC`models.mdx, `OCDOC`agents.mdx |
| 8. sessions | `opencode --continue` (`-c`), `--session <id>` (`-s`), `--fork`; `/sessions` (aliases `/resume`, `/continue`). One-shot: `opencode run "..."`. In-session side question: not found. | `OCDOC`cli.mdx, `OCDOC`tui.mdx |

Extra opencode levers:

- **`small_model`** "configures a separate model for lightweight tasks like title generation"; by default opencode picks a cheaper model from the provider. (`OCDOC`config.mdx)
- **Agent `steps`** caps agentic iterations per agent (`maxSteps` is deprecated). (`OCDOC`agents.mdx)
- **`permission.task`** controls which subagents an agent may spawn; `deny` removes them from the Task tool description, which also shrinks the prompt. (`OCDOC`agents.mdx)
- **`OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX`** caps LLM output tokens. (`OCDOC`cli.mdx)

---

### Pi (`pi-mono`)

Config: `<agent-dir>/settings.json` (default `~/.pi/agent`, override `PI_CODING_AGENT_DIR`) and project `.pi/settings.json` (`PIDOC`configuration.md, `PIDOC`environment-variables.md).

| Lever | Documented equivalent | Source |
| --- | --- | --- |
| 1. cache | `PI_CACHE_RETENTION=long` "for extended provider prompt caching where supported". In code, `long` sends Anthropic `cacheControl.ttl = "1h"` and OpenAI `prompt_cache_retention: "24h"`; the default is `short`. Settings `cacheWarming: "off" \| "streaming" \| "idle"` (default `streaming`) keeps caches warm, and `"idle"` also between runs. `showCacheMissNotices` shows cache misses. Model `promptCache: { "short": 300, "long": 3600 }` declares lifetimes. | `PIDOC`environment-variables.md, `PI`packages/ai/src/api/anthropic-messages.ts, `PI`packages/ai/src/api/openai-responses.ts, `PIDOC`settings.md, `PIDOC`models.md |
| 2. switches | Start flags: `pi --model <pattern>` (suffix form `pi --model sonnet:high`), `--thinking <level>`. Defaults: `defaultProvider`, `defaultModel`, `defaultThinkingLevel`. Mid-session switches to avoid: `/model`, `/thinking`. | `PIDOC`cli.md, `PIDOC`settings.md, `PIDOC`slash-commands.md |
| 3. tools | `read` takes `offset` (1-indexed) and `limit`; output truncated at 2000 lines or 50 KB, "Use offset/limit for large files". Tool set at start: `--tools read,grep,find,ls`, `--exclude-tools`, `--no-tools`. **No user key for the output cap found.** | `PI`packages/coding-agent/src/core/tools/read.ts, `PI`packages/coding-agent/src/core/tools/truncate.ts, `PIDOC`cli.md |
| 4. context | `/new` "Start a new session"; `/compact [instructions]`. Auto compact: `compaction.enabled` (default true), `compaction.reserveTokens` (16384), `compaction.keepRecentTokens` (20000), `compaction.modelOverrides`. `/tree`, `/fork`, `/clone` branch a session. | `PIDOC`slash-commands.md, `PIDOC`settings.md |
| 5. routing | No built-in subagents found. The shipped example extension `examples/extensions/subagent` runs a `pi` subprocess per agent with `model:` in the agent file (`.pi/agents/*.md`); without it the subagent inherits the session model and thinking level. | `PI`packages/coding-agent/examples/extensions/subagent/README.md |
| 6. startup | Context files: `AGENTS.override.md`, `AGENTS.md`, `CLAUDE.md` in the agent dir and project dirs; `SYSTEM.md` replaces and `APPEND_SYSTEM.md` extends the system prompt. `--no-context-files` (`-nc`), `--no-skills` (`-ns`), `--no-extensions` (`-ne`) cut startup load. MCP: not found in the pi docs (no MCP setting documented). | `PIDOC`configuration.md, `PIDOC`cli.md |
| 7. effort | `defaultThinkingLevel`: `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "max"`, default `"medium"`. `modelThinkingLevels` per `provider/modelId`. `thinkingBudgets` sets token budgets per level. | `PIDOC`settings.md |
| 8. sessions | `pi --continue` (`-c`), `--resume` (`-r`), `--session <path\|id>`, `--fork`; `/resume`. One-shot: `pi --print "..."` (`-p`). In-session side question: not found. | `PIDOC`cli.md, `PIDOC`slash-commands.md |

Extra Pi levers:

- **`cacheWarming`** is the only harness-level cache keep-alive found in any harness here. It runs only when the model declares a lifetime and Pi estimates at least $0.05 of avoided miss cost; refresh usage counts toward session totals. (`PIDOC`settings.md)
- **`thinkingBudgets`** caps the thinking tokens per level directly. (`PIDOC`settings.md)
- **`--models <patterns>` / `/scoped-models`** restrict the cycling set. (`PIDOC`cli.md, `PIDOC`slash-commands.md)

---

### Grok Build (`grok-build`)

Config: `$GROK_HOME/config.toml` (default `~/.grok/config.toml`); project `.grok/config.toml` may set only `[mcp_servers]`, `[plugins]`, `[permission]`, `[mcp] max_output_bytes` (`GBDOC`26-config-reference.md).

| Lever | Documented equivalent | Source |
| --- | --- | --- |
| 1. cache | **No prompt cache TTL or retention key found** in the config reference. | `GBDOC`26-config-reference.md |
| 2. switches | Start flags: `grok -m <model>` (`--model`), `--reasoning-effort <level>` / `--effort <level>` (TUI and headless). Default: `models.default` (also `GROK_DEFAULT_MODEL`). Mid-session switches to avoid: `/model <name> [effort]` (alias `/m`), `/effort <level>`. | `GBDOC`14-headless-mode.md, `GBDOC`26-config-reference.md, `GBDOC`04-slash-commands.md |
| 3. tools | `toolset.bash.output_byte_limit` "Max captured bash output in bytes". `mcp.max_output_bytes` "Cap MCP tool output size in bytes" (project files may set it). `disabled_mcp_tools` per-server deny list. `read_file` takes `offset` and `limit` (AGENTS.md, CLAUDE.md and SKILL.md are always returned whole). | `GBDOC`26-config-reference.md, `GB`crates/codegen/xai-grok-tools/src/implementations/grok_build/read_file/mod.rs |
| 4. context | `/new` "Start a fresh session and clear the current conversation. Alias: `/clear`." `/compact [context]`, e.g. `/compact keep the auth implementation details`. `/context` shows usage. Auto compact: `session.auto_compact_threshold_percent` (0 to 100), per model `model.<id>.auto_compact_threshold_percent` and `model.<id>.compaction_at_tokens`. Strategy: `features.compaction_mode = summary \| transcript \| segments`. | `GBDOC`04-slash-commands.md, `GBDOC`26-config-reference.md |
| 5. routing | `[subagents.models]` per type, e.g. `explore = "grok-4.6"`; without an override a subagent inherits the parent model. `subagents.toggle.<name>` turns a type off; `subagents.enabled` / `--no-subagents` is the master switch; `subagents.max_concurrent`, `subagents.max_depth`. Personas carry `model` and `reasoning_effort`. | `GBDOC`16-subagents.md, `GBDOC`26-config-reference.md |
| 6. startup | Rule files per directory: `Agents.md`, `Claude.md`, `CLAUDE.md`, `CLAUDE.local.md`, `AGENT.md`, `AGENTS.md` (all matches load). Rule dirs: `.grok/rules/`, plus `.claude/rules/` and `.cursor/rules/` under Claude and Cursor compatibility, and home-level `~/.claude/` and `~/.cursor/`. MCP: `grok mcp disable <name>`, `grok mcp remove <name>`, `disabled_mcp_servers = [...]`, `/mcps`. MCP tools reach the model through `search_tool` / `use_tool`, so schemas are not listed up front. | `GBDOC`12-project-rules.md, `GBDOC`07-mcp-servers.md, `GBDOC`26-config-reference.md, `GBDOC`17-sessions.md |
| 7. effort | `models.default_reasoning_effort` "Default reasoning effort for the default model when the model supports it." `/effort` levels: `low`, `medium`, `high`, `xhigh`; the flag accepts `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`. `model.<id>.reasoning_efforts` limits the menu. | `GBDOC`26-config-reference.md, `GBDOC`04-slash-commands.md, `GBDOC`14-headless-mode.md |
| 8. sessions | `grok -c` continues the latest session; `grok --resume <id>`; `/resume`; `/fork`. Quick question: `/btw` "Send an aside to the agent without interrupting the current task ... The side question and its answer aren't part of the main turn." One-shot: `grok -p "..."`. | `GBDOC`01-getting-started.md, `GBDOC`04-slash-commands.md |

Extra Grok Build levers:

- **`long_reasoning_reminder`** (`enabled`, `tokens`, `delay`) injects a reminder to reason briefly after a long hidden-reasoning call. Default off. (`GBDOC`26-config-reference.md)
- **`features.subagent_model_inheritance`** forces subagents onto the parent model; this is the opposite of cheap routing, so leave it off. (`GBDOC`26-config-reference.md)
- **`models.session_summary`** and **`models.prompt_suggestion`** pin the side models for titles and ghost text. (`GBDOC`26-config-reference.md)
- **Workflow `agent_budget`** caps child agent calls (default 128). (`GBDOC`04-slash-commands.md)
- **Compatibility imports** of `.claude/` and `.cursor/` rules add startup tokens by default; turning compatibility off is a startup lever. (`GBDOC`12-project-rules.md)

---

### Cursor (`cursor`)

Closed source, so only cursor.com docs. CLI config: `~/.cursor/cli-config.json`; project `.cursor/cli.json` holds only permissions (`CU`cli/reference/configuration.md).

| Lever | Documented equivalent | Source |
| --- | --- | --- |
| 1. cache | **No prompt cache TTL setting found.** Cursor only publishes cache write and read prices per model. | `CU`models-and-pricing.md |
| 2. switches | CLI start flag: `agent --model <model>`; `agent --list-models`. In session `/model [filter]` (to avoid mid-session). Model parameters in brackets set effort and window: `claude-opus-5[effort=high,context=300k]` (documented for subagent `model:` and the SDK). The CLI stores the selected model under `model` in cli-config.json. | `CU`cli/reference/parameters.md, `CU`cli/reference/slash-commands.md, `CU`subagents.md, `CU`cli/reference/configuration.md |
| 3. tools | **No tool output cap or read-range setting found.** Terminal output shown to the user can be truncated, but no model-side cap is documented. | `CU`agent/tools/terminal.md |
| 4. context | CLI: `/clear` "Start a new chat session. `/new`, `/new-chat`, and `/newchat` are aliases." `/summarize` "Summarize the conversation to reduce context. `/compress` is an alias." Auto: "When the window gets close to full, Cursor compresses older parts of the conversation into a summary"; no threshold setting found. The context ring shows usage by category. | `CU`cli/reference/slash-commands.md, `CU`agent/prompting.md |
| 5. routing | Subagent file frontmatter `model: inherit` (default) or a model id, with optional params, e.g. `model: composer-2.5[]` or `model: gpt-5.6-sol`. The built-in Explore subagent "uses a faster model by default". Auto with Cursor Router picks a model per request (Cost, Balance, Intelligence). | `CU`subagents.md, `CU`cursor-router.md |
| 6. startup | Rules: `.cursor/rules/*.mdc` with `description`, `globs`, `alwaysApply` (only `alwaysApply: true` loads every time); `AGENTS.md` as plain markdown. Guidance: "Keep rules under 500 lines". MCP: `agent mcp disable <identifier>` "Disable an MCP server so it won't load", or toggle it off under Customize in the editor. `agent mcp list`. | `CU`rules.md, `CU`cli/reference/parameters.md, `CU`mcp.md |
| 7. effort | **No default effort key found.** Effort is part of the model choice: variant ids (e.g. `gpt-5-high`, `gpt-5-low-fast`) or the `[effort=...]` model parameter. | `CU`models-and-pricing.md, `CU`subagents.md |
| 8. sessions | `agent --resume [chatId]`, `agent --continue` (alias for `--resume=-1`), `agent resume`, `agent ls`, `/resume`, `/fork`. Quick read-only questions: `/ask` toggles Ask mode. One-shot: `agent -p "..."` (`--print`). | `CU`cli/reference/parameters.md, `CU`cli/reference/slash-commands.md |

Extra Cursor levers:

- **Max Mode** exists only on legacy request-based plans; it "extends a model's context window beyond the default limit" and bills "at the model's API rate plus 20%". Toggle: model picker, or `/max-mode` in the CLI; persisted as `maxMode` in cli-config.json. (https://cursor.com/help/ai-features/max-mode.md, `CU`cli/reference/slash-commands.md, `CU`cli/reference/configuration.md)
- **Fast variants** (e.g. Grok 4.7 Fast, Composer 2.5 Fast, `claude-opus-5-5-fast`) cost about 2x or more per token; `composer-2.5[fast=false]` or `composer-2.5[]` selects the standard variant. (`CU`models-and-pricing.md, `CU`subagents.md)
- **Auto / Cursor Router** "Cost" mode "optimizes token spend"; Balance and Intelligence "use your usage limits faster than Cost". (`CU`cursor-router.md)
- **Context parameter** `[context=300k]` caps the window per model. (`CU`subagents.md)

---

### Notes for the rule copy

- **Cache (rule 1)** has a real setting only in Pi (`PI_CACHE_RETENTION=long`, `cacheWarming`). Codex, opencode, Grok Build and Cursor expose none, so "work in contiguous blocks" is the honest step there.
- **Tools (rule 3)** has user caps in Codex (`tool_output_token_limit`) and Grok Build (`toolset.bash.output_byte_limit`, `mcp.max_output_bytes`). opencode and Pi hard-code 2000 lines / 50 KB with offset hints. Cursor documents nothing. The rule's Read branch checks `Read` and `read_file`, so Grok Build's `read_file` reaches it. opencode's and Pi's lowercase `read` is not in `TOOL_RESULT_NAMES` (`packages/workflow-rules/src/daily.ts`), so it folds into `other` and never reaches the Read branch.
- **Routing (rule 5)** has a single default-subagent-model key only in Codex (`agents.default_subagent_model`). Grok Build routes per type (`[subagents.models]`), opencode and Cursor per agent definition, Pi only through an extension.
- **Effort (rule 7)** has a global default key in Codex (`model_reasoning_effort`), Pi (`defaultThinkingLevel`, already `medium` by default) and Grok Build (`models.default_reasoning_effort`). opencode and Cursor tie effort to the model variant.
- **Sessions (rule 8)**: Codex (`/side`, `/btw`) and Grok Build (`/btw`) have a documented side-question command that stays out of the main turn. Cursor has `/ask` mode. opencode and Pi: not found.
- Codex and Cursor docs move: `developers.openai.com/codex/...` now 308-redirects to `learn.chatgpt.com/docs/...`. Pin source commits when citing code.

## Part D: Research D: token-efficiency measurement fidelity and severity model

Date: 2026-09-24. Branch `feat/cli-short-gate` (working tree; the uncommitted diff to
`efficiency.ts` only adds `steps`, no rule or threshold changes).

Files read:

* `packages/workflow-rules/src/efficiency.ts` (rules, thresholds, severity, scorecard)
* `packages/workflow-rules/src/daily.ts` (EfficiencyDay, ContextDay, HarnessDay, fold)
* `packages/cli/src/workflow/reducer.ts` (where the v4 atoms are filled)
* `packages/cli/src/harness/claude/analyzer.ts`, `codex/analyzer.ts`, `grok/scan.ts`, `grok/context.ts`
* `convex/lib/efficiency.ts`, `convex/lib/workflow.ts` (`topModelOf`)
* `packages/workflow-rules/src/efficiency.test.ts`
* `src/features/efficiency/TokenEfficiency.tsx` (severity words: high=Fix, medium=Look, low=Minor, ok=Good, lines 32-43)

Note: the header of `efficiency.ts:8-11` cites `docs/research/token-efficiency-levers-2026-09.md`
as the threshold source. That file is not on this branch; it exists only in commit
`c4ef8368` on `prototype/token-efficiency`. The thresholds are therefore unsourced in the
tree that ships them.

Vendor facts used below (fetched 2026-09-24):

* [V1] Claude Code prompt caching: https://code.claude.com/docs/en/prompt-caching
  * Main conversation TTL defaults to ONE HOUR on a Claude subscription within plan usage,
    five minutes on API key, usage credits or cloud provider. Subagents, compaction and
    titles get five minutes. Settings: `promptCacheTtl` / `CLAUDE_CODE_PROMPT_CACHE_TTL`,
    `subagentPromptCacheTtl`.
  * "non-interactive `-p` runs" are in the main-conversation bucket.
  * Invalidators: model switch (incl. `opusplan` toggles, automatic fallback, a skill whose
    frontmatter names another model), effort change (EXCEPT Opus 5.5 and Fable 5.1 on API
    key or subscription), fast mode on (once per conversation), MCP connect/disconnect only
    when tools are loaded into the prefix (deferred by default), compaction (conversation
    layer only; system prompt layer reused), image eviction, upgrade.
  * Compaction summary is "a separate request with the same system prompt, tools, and history".
  * Subagent first request "doesn't read the parent's cache".
  * 1h writes are logged as `ephemeral_1h_input_tokens`, 5m as `ephemeral_5m_input_tokens`.
* [V2] Claude Code model config: https://code.claude.com/docs/en/model-config
  * Default effort: "`high` on every model that supports effort, except that Opus 5.5
    defaults to `medium`, Opus 4.7 defaults to `xhigh`".
  * `CLAUDE_CODE_SUBAGENT_MODEL` is real; a definition's `model` field (incl. `inherit`) wins over it.
* [V3] Anthropic pricing: https://platform.claude.com/docs/en/about-claude/pricing#prompt-caching
  * 5m write 1.25x, 1h write 2x, read 0.1x base input; read is 0.05x on Opus 5.5 and 0.025x
    on Fable 5.1 / Mythos 5.1. Output is 5x input on every listed model.
* [V4] OpenAI prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching
  * GPT-5.6+: default TTL `30m`, writes 1.25x, reads 0.1x, usage reports `cache_write_tokens`.
    Earlier models: in-memory "around 5 to 10 minutes of inactivity, up to one hour", no
    write charge. `reasoning.effort`, `model`, `tools`, compaction break reuse.

---

### 1. Is each atom a faithful signal of the problem its tile claims?

Common facts about extraction (reducer.ts):

* A "call" is a response that carried `contextTokens` (`reducer.ts:735-737`).
* Efficiency atoms are MAIN sessions only: `routing === "main"` when neither
  `state.sidechain` nor `state.parentSession` (`reducer.ts:639-640`, gate at `:733`).
  Codex has no sidechain signal, so every Codex rollout is main (`codex/analyzer.ts:300-301`).
* Gap and orphan are computed independently in the same loop (`reducer.ts:738-753`).
* `CACHE_TTL_SEC = 300` is one constant for every harness and billing mode (`daily.ts:154`).

#### Rule 1: cache re-warmed after breaks (`efficiency.ts:208-284`)

Atom: `callsAfterGap`, `cacheWriteAfterGap`, `inputAfterGap` (`reducer.ts:742-746`), any main
call more than 300 s after the previous main call of the same session.

Problems:

1. **Wrong TTL for most Claude Code users.** On a Claude subscription the main conversation
   already uses the 1h TTL [V1]. A call 5 to 60 minutes after the last one is a cache READ
   there, yet it still counts as "after a break". The tile then tells a subscription user to
   "Use the 1h cache TTL" (`efficiency.ts:234`) that they already have, and the step text
   says it "works on API keys and Claude subscriptions" (`:260`), which is true but moot.
   The usage half already carries `cacheWriteTtl.{fiveMinute,oneHour}` per model
   (`convex/schema.ts:107`), so the rule could see this. `convex/lib/efficiency.ts:83-96`
   drops the split when it builds `tokens`.
2. **Wrong TTL for Codex on GPT-5.6+**: default 30 min [V4]; older models 5 to 10 min.
3. **`cacheWriteAfterGap` is not the re-warm, it is re-warm plus the normal tail write.**
   Every Claude Code call writes the new exchange (previous answer plus tool results) to
   cache. An after-gap call on a warm cache still has a non-zero write. The atom overstates
   waste on 1h-TTL users and on parallel sessions that keep the prefix warm. There is no
   `cacheReadAfterGap` atom to tell a cold call from a warm one.
4. **The dollar figure is gross, not saving.** `usd = rewarmTokens * rates.cacheWrite`
   (`efficiency.ts:223-225`). Had the call hit cache it would still pay 0.1x (0.05x on Opus
   5.5), so the saving is (1.25 - 0.1)/1.25 = 92% of the figure at best. And the recommended
   fix (1h TTL) raises EVERY main write from 1.25x to 2x [V3]; the net saving can be negative
   for bursty users. Rates always use `cacheWrite5m` (`convex/lib/efficiency.ts:55`), so for a
   user already on 1h writes the dollars are understated by 2/1.25.
5. **Gaps over one hour are not fixable by the TTL fix at all.** `callGaps` has the histogram
   (log-buckets/v1 seconds) but the rule never reads it, and `cacheWriteAfterGap` is not
   split by gap length.
6. Resumed sessions: the first call after `claude --resume` hours later is correctly an
   after-gap call, but that is the "start fresh instead of resuming" lever, not the TTL lever.
7. Codex: `cacheWriteTokens: 0` is hard-coded (`codex/analyzer.ts:324`), and `inputAfterGap`
   includes the new user turn which is fresh input anyway.

#### Rule 2: switches, "prefix rewritten without a read" (`efficiency.ts:286-341`)

Atom: `orphanCacheWrites`: a main call after the first with `cacheWrite > 0 && cacheRead === 0`
(`reducer.ts:747-753`).

False positives:

1. **Double count with rule 1.** The orphan test does not exclude `gapSec > CACHE_TTL_SEC`.
   After a break longer than the TTL, when no parallel session in the same directory kept the
   system prompt warm (cache scope is one machine and one directory [V1]), the whole prefix is
   cold, so `cacheRead === 0`. The same call lands in `callsAfterGap` AND
   `orphanCacheWrites`. With `ORPHAN_SHARE_OF_CALLS = 0.05` (`efficiency.ts:120`), a solo
   API-key user who takes a handful of breaks per session hits "Fix" on switches from breaks
   alone and gets told to pin model and effort.
2. **Effort changes do not always invalidate.** On Opus 5.5 and Fable 5.1 (API key or
   subscription) an effort change keeps the cache [V1]; the "why" (`:312`) and steps (`:323`)
   still blame effort. Conversely on most models an effort change DOES invalidate from the
   system level, so it shows as read=0 and is correctly caught.
3. **Model switches the user did not choose**: automatic fallback on Fable/Opus 5.5/Opus 5,
   `opusplan` plan-mode toggles, and skills whose frontmatter names a model [V1]. The advice
   "pick model at start" does not reach these; `opusplan` users need a different fix.
4. **Compaction**: the next request reuses the system-prompt layer [V1], so read > 0, and it
   is correctly NOT an orphan. If the transcript logs the summarization request as a main
   assistant record, that request after a long break is both after-gap and orphan (cold
   compaction). Not verified in a transcript; worth one fixture check.
5. **Subagent first calls** are excluded (main only), correct. Forks are sidechain, also excluded.
6. The atom cannot name the cause. Claude Code itself reports a diagnosed cause
   (`tools_changed`, `ttl_expired_5m`, ...) in `/usage` [V1 "Check cache performance"], but not
   in the transcript fields this adapter reads.

#### Rule 3: tool results flooding the context (`efficiency.ts:343-417`)

Atom: `toolResults[]` by wire name: count, byte sum, byte histogram.

Problems:

1. **Subagent tool results are included.** The `toolResult` branch (`reducer.ts:539-557`) and
   the date merge (`:773-788`) never check `routing`; the Claude adapter passes `sidechain`
   through (`claude/analyzer.ts:740-758`) but the reducer ignores it for tool results. The
   rule's own fix ("delegate whole-file scans to a subagent", `:381`) therefore does not move
   the meter: the bytes are still counted.
2. **Bytes, not tokens.** `Buffer.byteLength(JSON.stringify(content))` for array content
   (`claude/analyzer.ts:746-751`). An image result (Read of a screenshot) is base64 bytes,
   hundreds of KB, while it is billed by pixels. One screenshot session can make `Read` the
   top tool with a large 32 KB+ share.
3. **Only the top tool by bytes** is judged (`toolResults[0]`, sorted by bytes in the fold,
   `daily.ts:651`). The meter `share * bigShare / 0.25` multiplies two shares: 60% of bytes
   from Read times 40% of Read results over 32 KB = 0.24 -> meter 0.96 -> Fix, regardless of
   whether the user produced 2 MB or 2 GB of output, or how long those results stayed in
   context.
4. The real cost of a result is its size times the number of later calls that carry it
   (at the cache-read rate) plus one write. Nothing measures "calls carried after".

#### Rule 4: sessions at high context (`efficiency.ts:419-475`)

Atom: `sessionMaxContext` (peak per main session, `reducer.ts:755`).

Problems:

1. A single late call makes the whole session "high". A productive long session that
   auto-compacts is always high: on native-1M models Claude Code auto-compacts near the
   model's limit (levers note, citing https://code.claude.com/docs/en/model-config), so the
   128K cut (`HIGH_CONTEXT_BUCKET`, `:131`) marks normal 1M usage.
2. The tile's "why" says "a 150K-token prefix costs about four times a 40K one on every
   call" (`:447`). True in tokens, but with caching those tokens are reads at 0.1x (0.05x on
   Opus 5.5, 0.025x on Fable 5.1 [V3]), and Claude 4.6+ bills the full 1M window at standard
   rates [V3 "Long context pricing"]. The lever is real but smaller than implied.
3. `context.calls.main` (a per-call histogram that already exists, `daily.ts:275-278`) is the
   better signal: call-weighted, so it measures how many calls actually ran fat.

#### Rule 5: subagents on the top model (`efficiency.ts:477-536`)

Atom: `routing.subagents[]` tokens by model, and `routing.main[]`.

Problems:

1. `routingTokens` is `countsTotal(counts)` including cache reads (`claude/analyzer.ts:365`).
   The share is dominated by cache reads, which are the cheapest tokens; dollar impact is not
   proportional.
2. "Top model" is the main thread's biggest model. If the user runs a single model family
   (a harness with one model, or a user who only runs Sonnet), subagents on "the top model"
   are on the only or cheapest option. The rule never checks that a cheaper model exists in
   the same vendor and harness.
3. Price gap is smaller than the tile implies: Opus 5 is $5 vs Sonnet 5 $2 [V3], Opus 5.5 $4.
   A subagent on Opus 5.5 is 2x Sonnet 5, not 5x.
4. Claude Code's own Explore agent already picks its model; a user with `model: inherit` in a
   design-review agent is using it on purpose. The step text allows for this (`:522`), the
   severity does not.
5. Codex: no sidechain signal, so the rule never fires (fine). Grok and opencode: parent
   links exist; check whether a cheaper model is selectable before firing.

#### Rule 6: startup floor (`efficiency.ts:538-595`)

Atom: `context.firstCalls.main` histogram; meter = LOW bound of the median bucket / 40K.

Problems:

1. The measured first call includes the harness floor (system prompt plus tool schemas) the
   user cannot trim, plus the first prompt (a pasted log counts as "startup").
   `firstCallHarnessTokens` and `firstCallInstructionsTokens` already exist
   (`daily.ts:281-285`) but the meter uses the total. Any Claude Code user whose median first
   call is in the 23K to 33K bucket reads meter 0.58 (Look); 33K to 46K reads 0.82 (Fix).
2. The split itself is imperfect: "harness" = cache read on first call, which includes MCP
   schemas loaded into the prefix and a CLAUDE.md that a parallel session in the same
   directory already cached [V1 "Cache scope"]. So an instructions-heavy user with parallel
   sessions looks light.
3. No per-session multiplier: 40K on 3 sessions and 40K on 300 sessions score the same.

#### Rule 7: effort mix (`efficiency.ts:597-645`)

Atom: `effort[]` responses per level, `effortLevelOf` collapses `high|xhigh|max|ultra` into
`high` (`daily.ts:304-319`).

Problems:

1. **"high" is the vendor default** on every Claude model that supports effort except Opus
   5.5 (medium) and Opus 4.7 (xhigh) [V2]. A user who never touched effort reads 100% high,
   meter 1, Fix. The rule flags defaults, not choices.
2. The collapse hides the actually expensive choices (`xhigh`, `max`), which are the ones
   worth flagging.
3. "Changing it mid-session also rebuilds the cache" (`:620`) is false on Opus 5.5 and Fable
   5.1 with API key or subscription [V1].
4. No output-token evidence: effort only matters through thinking/output tokens. The
   `thinking` atom (`daily.ts:126`) and `efficiency.blocks` (`daily.ts:257`) exist and are unused.
5. Which harnesses log effort: Codex from `turn_context.effort` (`codex/analyzer.ts:218`).
   Claude from `rec.effort ?? msg.effort` (`claude/analyzer.ts:366-368`); if Claude Code does
   not log it, the rule is Codex-only in practice. Codex CLI default is reported as medium
   (secondary source in the levers note), so a Codex high share is more likely a choice.

#### Rule 8: short sessions (`efficiency.ts:647-693`)

Atom: `shortSessions` = main sessions with at most 2 calls (`SHORT_SESSION_CALLS`,
`daily.ts:160`; `reducer.ts:757-760`).

False positives:

1. **Scripted runs.** `claude -p` is a main-conversation request [V1], so hooks, git commit
   message generators, CI jobs and any tool that shells out to `claude -p` count as short
   sessions. Codex `exec` runs likewise. None of these can "ask in a running session".
2. **Codex subagents and review lanes** are main sessions (no sidechain flag).
3. **Grok**: calls come from a retained inference log that aistack caches locally only from
   the first sync onward (`grok/context.ts:67-70`, `grok/scan.ts:332-351`), so sessions whose
   calls predate the cache or fell out of Grok's rotated log show 0 to 2 calls and count
   short. Grok calls carry `contextTokens` only.
4. **Resumed sessions** whose earlier calls predate the scan window count only their
   in-window calls.
5. **The fix may not save anything.** A fresh session's first call is mostly a cache READ of
   the harness prefix (shared across sessions in the same directory [V1]) plus a write of the
   instructions. Asking the same question in a running 100K session pays a 100K read. At
   0.1x that is 10K input-equivalents vs roughly 2K (20K read) + 12.5K (10K write) = 14.5K
   for the fresh session: roughly parity. The `usd` figure prices the whole first-call context
   at the INPUT rate (`efficiency.ts:653`), ignoring that most of it was a cache read, so it
   overstates by up to about 10x.
6. It contradicts rule 4's advice ("one session per task", "/clear between tasks").

#### Scorecard assembly (`efficiency.ts:709-732`, `convex/lib/efficiency.ts:79-110`)

* One tile per lever, from the harness with the HIGHEST METER (`:712-717`). Volume is not
  considered, so a harness with 3 sessions beats one with 3,000. This is how Grok's one
  short session can own the "sessions" tile for a user whose Claude Code is fine.
* `recoverableUsd` sums tile dollars across different harnesses and rate bases.
* `COST_WEIGHT` (`:134`) uses 0.1 for cache reads; Opus 5.5 is 0.05, Fable 5.1 is 0.025 [V3].

---

### 2. The current severity model, exactly

1. Each rule computes `meter = clamp(observed / THRESHOLD)` in [0, 1] (clamp at `:176`):

   | Rule | observed | threshold (`:119-126`) | meter = 1 when |
   |---|---|---|---|
   | cache | rewarmCost / inputCost, cost in list multipliers (input 1, write 1.25, read 0.1, `:134`); fallback gapShare / 0.5 when no usage | 0.15 | re-warm is 15% of input-side cost |
   | switches | orphanCacheWrites / mainCalls | 0.05 | 5% of calls |
   | tools | (top tool byte share) x (its share of results >= 32 KB) | 0.25 | e.g. 50% x 50% |
   | context | share of sessions peaking >= 128K | 0.6 | 60% of sessions |
   | routing | (subagent tokens on top model / subagent tokens) x (subagent share of all tokens) | 0.3 | |
   | startup | LOW bound of median first-call bucket / 40,000 | 40K tokens | |
   | effort | share of responses at high | 0.5 | |
   | sessions | shortSessions / sessions with calls | 0.3 | 30% short |

   `mainCalls` = gaps + one per session (`:203-204`).
2. `severityOf` (`:136-141`): meter >= 0.6 high (Fix), >= 0.3 medium (Look), >= 0.1 low
   (Minor), else ok (Good). Because meters are pre-divided by the threshold, "Fix" means
   "60% of the placeholder threshold".
3. Severity ignores: absolute tokens, dollars, share of the user's total spend, sample size,
   and confidence. Dollars are only computed for cache and sessions, and only feed the sort.
4. Sort (`:725-731`): severity, then usd desc, then meter desc, then lever order. Passing
   tiles lose their usd.

#### Why "1 sessions of 2 calls or fewer" on Grok rated Fix

`meter = (shortSessions / callSessions) / 0.3`. With `callSessions <= 3` a single short
session gives share >= 0.33, meter 1, "high". No minimum sample. The scorecard then picks the
Grok tile over Claude Code's because it has the higher meter (`:715`), not the higher volume.
Grok's short count itself is inflated by the retained-log gap (1.3 above). The label also
does not pluralize ("1 sessions", `:667`).

#### Why "Use the 1h cache TTL" with $227 rated only Look

`meter = (1.25 x cacheWriteAfterGap) / (input + 1.25 x cacheWrite + 0.1 x cacheRead) / 0.15`.
$227 at the Opus 5 5m write rate ($6.25/M [V3]) is about 36M rewritten tokens, i.e. 45M
weighted. For Look the ratio must be between 0.045 and 0.09, so the denominator is 0.5B to
1.0B weighted units, e.g. 300M cache writes plus 2.5B cache reads. A heavy user's denominator
grows with total volume, so even a large absolute re-warm stays a small SHARE. Meanwhile rules
with no dollars reach meter 1 on tiny counts (switches at 5% of calls, sessions at 1 of 3,
effort at the vendor default, startup from the harness floor), so they sort above it: the
sort compares severity before dollars. Separately, if this user is on a subscription, the tile
is recommending a setting already in force [V1], and the $227 is gross write cost rather than
the saving from any fix.

#### Other concrete defects in the model

* Startup scores Look or Fix for most Claude Code users from the harness floor alone.
* Effort scores Fix for anyone on defaults [V2].
* Switches double counts rule 1 (1.1 above), so one behavior (taking breaks) yields two red tiles.
* A "Minor" at 10% of a placeholder threshold is noise at every sample size.

---

### 3. Proposed severity model

Principle: severity = how much money (or quota) the fix would plausibly recover over the
window, as a share of the user's spend, gated by enough evidence to believe it. Meters stay as
the tile's secondary figure but stop driving color.

#### 3.1 Common quantities (all from existing atoms)

Per harness h over the 30-day window, in input-token equivalents (ITE), then dollars when
rates exist:

* `w` = per-model multipliers from the price row: `w_in = 1`, `w_cw5 = cacheWrite5m/input`,
  `w_cw1 = cacheWrite1h/input`, `w_cr = cacheRead/input` (0.1, 0.05 or 0.025 [V3]),
  `w_out = output/input` (5 on Claude). Fallback to the current COST_WEIGHT when unpriced.
* `Spend_h = input + w_cw5 x CW5 + w_cw1 x CW1 + w_cr x cacheRead + w_out x output` from the
  usage half, using `cacheWriteTtl` (already on the wire, dropped by
  `convex/lib/efficiency.ts:83-96`).
* `Spend = sum over harnesses`.
* `TTL_h` = 3600 when `CW1 / (CW5 + CW1) > 0.5`, else 300 (Claude); 1800 for Codex GPT-5.6+,
  300 otherwise.

#### 3.2 Evidence floor and confidence

* A rule renders a finding only when its denominator clears a floor: sessions >= 20 for
  session-shaped rules (context, startup, sessions), main calls >= 200 for call-shaped rules
  (cache, switches), tool results >= 100 (tools), responses >= 200 (effort). Below the floor
  the tile shows "Not enough data yet (n of 20 sessions)" in the muted style, not a severity.
* For share-based rules use the Wilson 95% lower bound of the observed share instead of the
  point estimate, so 1 of 3 (0.33, lower bound 0.06) stops reading as 33%.
* Confidence label: high when n >= 5x floor and the atom is exact (cache, switches), medium
  when estimated from bucket mids (context, tools), low when the waste model is an assumption
  (routing quality, effort).

#### 3.3 Severity cut

```
waste_h      = rule-specific ITE (below), >= 0
share        = waste_h / Spend            (whole-stack spend, not the rule's own denominator)
usd          = waste_h x input_rate_h     (when publishCost and priced)

Fix   : evidence floor met AND share >= 5%  AND (usd >= $20 OR ITE >= 5M)
Look  : evidence floor met AND share >= 1.5% AND (usd >= $5  OR ITE >= 1M)
Minor : evidence floor met AND share >= 0.5%
Good  : evidence floor met AND below Minor
Insufficient : floor not met
```

Scorecard: SUM waste per lever across harnesses (not max meter), and name the harness with
the largest waste. Sort by waste ITE descending. `recoverableUsd` = sum of per-tile usd. The
cut points are placeholders like today's, but they are in units a user can check, and a
population percentile swap later changes six constants instead of eight.

#### 3.4 Per-rule waste formulas

1. **Cache after breaks** (fixed and TTL-aware).
   * Now: `waste = cacheWriteAfterGap x (w_cw - w_cr)` at the TTL in force, counting only
     calls with gap > `TTL_h`. The existing atom counts gap > 300 s, so for 1h users the rule
     needs the new atom below; until then, suppress the "Use the 1h TTL" fix when
     `CW1 share > 0.5` and show "Start fresh after long breaks" instead.
   * 1h TTL recommendation only when net positive:
     `net_1h = W(5..60 min) x (w_cw5 - w_cr) - (w_cw1 - w_cw5) x CW5_main_total`. The
     second term is the premium on every write. Requires W split by gap length.
   * New atoms: `cacheWriteAfterGapByBand` {5-60 min, >60 min} (or keyed on 300/1800/3600),
     `cacheReadAfterGap` (to separate cold from warm after-gap calls), and ideally
     `coldAfterGap` = count with read below 5% of context (mirrors Claude Code's own miss rule,
     re-processed more than 5% and at least 2,000 tokens [V1 via costs#prompt-cache-statistics]).
2. **Switches.**
   * Fix extraction first: count orphan only when `gapSec <= TTL`. Then
     `waste = orphanCacheWriteTokens x (w_cw - w_cr)`.
   * Exact atoms, so confidence high. Optional new atom: `modelSwitches` (count of main calls
     whose model differs from the previous call's) to name the cause, and a `mixedEffort`
     count; with those the fix text can say which one.
3. **Tools.**
   * Fix extraction: main-thread results only (gate `toolResult` on routing like the other
     v4 atoms), and size image blocks as 0 or by their billed estimate.
   * Existing-atom estimate: `T_big = bytes in buckets >= 32 KB / 4` (tokens), carried for
     half the session's remaining calls on average:
     `waste ~= T_big x (w_cw + w_cr x meanCallsPerSession / 2) x 0.5` (assume half is avoidable).
     `meanCallsPerSession` from `sessionCalls` bucket mids. Confidence medium.
   * New atom for an exact figure: `toolResultCarriedTokens` = sum over results of
     (bytes/4) x (main calls after it in the session before the next compaction).
4. **Context.**
   * From `context.calls.main` (exists): `excess = sum_b calls_b x max(0, mid_b - 128K)`;
     `waste = excess x w_cr x 0.5`. Low confidence, cap at Look (the tokens are cached reads,
     and long tasks are legitimate). Adjust the 128K line to the context window when `window`
     is known.
5. **Routing.**
   * `subOnTop` tokens are routing totals (mostly cache reads). Estimate
     `waste = subOnTopTokens x w_cr_top x (1 - price_small / price_top)` using the catalog's
     cheapest same-vendor model the harness can select; zero when none exists (single-model
     harness). Confidence low; cap at Look. New atom that would make it exact: subagent tokens
     by model split into input/read/write/output (the usage half has the split but not by
     main vs subagent).
6. **Startup.**
   * Use the instructions part only: `instr = firstCallInstructionsTokens / firstCallCount`.
     `waste = max(0, instr - 10K) x firstCallCount x w_cw5` (instructions are written each
     session; 10K is a placeholder reasonable CLAUDE.md plus first prompt). The harness part
     is shown as context, not scored. New atom to separate the first prompt from instruction
     files would sharpen it but is not required.
7. **Effort.**
   * Stop scoring defaults: `effortLevelOf` should keep `xhigh` and `max` distinct (new level
     values or a new atom `effortRaw` counts), and the rule scores only levels above the model's
     documented default [V2].
   * Waste needs output by effort: new atom `outputByEffort` {level: output tokens, thinking
     tokens}. Then `waste = output_at_xhigh_max x w_out x 0.3` (placeholder share of thinking
     that a lower level would drop). Without it, show evidence only, severity capped at Minor.
8. **Short sessions.**
   * Exclude non-interactive runs. New atom: `headlessSessions` (Claude records carry an
     entrypoint marker for `-p`/SDK runs; confirm the field in a transcript fixture before
     relying on it; Codex `exec` rollouts likewise), and never count sessions with a
     `parentSession`.
   * Price correctly: `waste = max(0, shortStart - shortCount x medianCtx x w_cr)` where
     `shortStart = shortHarness x w_cr + shortInstr x w_cw5`. Needs new atoms
     `shortSessionFirstCallHarness` / `shortSessionFirstCallInstructions` (the current sum
     mixes both). Expect this to be near zero for most Claude Code users; cap at Minor.

---

### 4. More levers

From atoms that exist today:

| Lever | Atoms | Formula / signal | Notes |
|---|---|---|---|
| Overall cache hit ratio | usage `cacheRead`, `cacheWrite`, `input` | `cacheRead / (input + cacheWrite + cacheRead)` | Claude Code docs frame read vs creation as the health check [V1]. A single headline that explains rules 1-2. |
| Thinking share | `HarnessDay.thinking` {thinkingTokens, responseTokens}; `efficiency.blocks` {thinking, text} | thinking / output; thinking blocks per response | Both atoms exist, neither is read by a rule. Owner-only, so the public cut list ("no thinking share") does not apply. |
| Output-heavy spend | usage `output` | `w_out x output / Spend` | Output is 5x input [V3]; a high share points at effort/verbosity. |
| Main model left on top tier | `routing.main` | top-tier share of main tokens | The "Opus left as default" pattern from the Claude Code costs docs (levers note). Low confidence; quality trade-off. |
| Compaction frequency | `context.compactions`, `efficiency.sessionsCompacted`, sessions | compactions per compacted session; share of sessions compacted | Many auto-compactions per session suggests "/compact at natural breaks" or "/clear between tasks". |
| Long idle resumes | `callGaps` buckets >= 12 (>= 2048 s) and >= 13 | count of >1h gaps; share of after-gap calls that are >1h | The ">1h" part is the "start fresh after a long break" lever, which no TTL fixes. |
| 1h TTL paid but unused | usage `cacheWriteTtl.oneHour`, `callGaps` | CW1 share high AND few gaps in 5-60 min | Inverse of rule 1: a bursty API-key user who set 1h pays 2x writes for nothing [V3]. |
| Tool output not delegated | `toolResults` + `delegation` {mainToolCalls, subagentToolCalls} | big Read/Bash bytes in main while subagent share of tool calls ~0 | Pairs with the tools rule once tool results are main-only. |
| Per-call context tail | `context.calls.main` | p90 via `quantileBucket` | Better than per-session peak for rule 4. |
| Parallel worktrees | `WorkflowDay.parallelProjects` | days with >1 workspace | Cache scope is per directory, worktrees do not share cache [V1]; multiplies startup cost. Informational. |
| Codex long-context calls | `context.calls.main`, `context.window` | calls above the model's long-context line | The levers note says GPT-5.x bills above a line; verify on the OpenAI pricing page before shipping. |

Cheap additions (new atoms, CLI-side, all counts or sums):

* `cacheWriteAfterGapByBand` and `cacheReadAfterGap` (rule 1 precision, 1h TTL net saving).
* Orphan excluding gaps, plus `modelSwitches` count (rule 2 cause).
* `toolResults` restricted to main, image-aware sizing, `toolResultCarriedTokens` (rule 3).
* `effortRaw` keeping xhigh/max, and `outputByEffort` (rule 7).
* `headlessSessions` and the short-session harness/instructions split (rule 8).
* `coldCompactions`: compaction boundaries whose preceding call gap exceeded the TTL [V1:
  "This is why `/compact` costs the most when you resume an old session"].
* MCP servers loaded but never called: inventory holds CALLED servers only (`MeasuredAtom`
  with `calls`, `convex/schema.ts:126-160`). Needs a new count of CONFIGURED servers per
  harness (from Claude Code / Codex config files) and whether their tools are deferred; with
  tool search on by default, an unused deferred server costs little [V1 "Deferred tools"], so
  the lever matters mainly when tool search is off or `alwaysLoad` is set.
* Codex: read `cache_write_tokens` instead of hard-coding 0 (`codex/analyzer.ts:324`); GPT-5.6+
  charges writes [V4], so rules 1-2 are currently blind on Codex.
