# Token headline conventions: do usage tools count cache reads?

Research date: 2026-09-01. Question: aistack's 30-day token headline sums fresh
input + output + cache writes + cache reads (`packages/workflow-rules/src/usage.ts`,
`totalOfTokens`: "input + output + cacheWrite + cacheRead, the CLI's totalTokens").
On Codex-heavy machines cache reads are ~98% of that sum, and a user found the
headline ~3x larger than a "lifetime" figure they had seen elsewhere. Should the
headline include cache reads, exclude them, or show a split?

Every claim below is against source code or first-party docs. Anything not
verified against a primary source is marked unverified.

## The two provider accounting models (the root of the split)

**Anthropic: disjoint fields.** The prompt-caching docs
(https://platform.claude.com/docs/en/build-with-claude/prompt-caching) define
`input_tokens` as the "number of input tokens which were not read from or used to
create a cache (that is, tokens after the last cache breakpoint)". Total input
processed is `cache_read_input_tokens + cache_creation_input_tokens + input_tokens`.
The Usage Admin API
(https://platform.claude.com/docs/en/manage-claude/usage-cost-api) tracks the same
four disjoint measures: "uncached input, cached input, cache creation, and output
tokens". A tool that wants "everything" has to add all four itself.

**OpenAI: cached is a subset of input.** The Usage API's completions result
documents `input_tokens` as "the aggregated number of input tokens used, including
cached and cache-write tokens", with `input_cached_tokens` and
`input_cache_write_tokens` as breakouts
(openai/openai-python, `src/openai/types/admin/organization/usage_completions_response.py`,
`DataResultOrganizationUsageCompletionsResult`). Same for per-request usage:
`prompt_tokens_details.cached_tokens` / `input_tokens_details.cached_tokens` are
subsets of the prompt/input count
(https://developers.openai.com/api/docs/guides/prompt-caching). So an OpenAI-side
"input + output" total already counts each cached token exactly once, never as an
extra addend.

## Survey

### 1. ccusage (ryoppippi/ccusage)

Headline: **all-inclusive**. `TokenCounts::total()` returns
`input + output + cache_creation + cache_read (+ extra_total_tokens)`
(`rust/crates/ccusage-core/src/types.rs`, lines 89-95 on main as of 2026-09-01).
The report tables always show the split: columns are Input, Output, Cache Create,
Cache Read, Total Tokens, Cost
(`docs/guide/daily-reports.md`: "Cache Create: Tokens used to create cache
entries", "Cache Read: Tokens read from cache (typically cheaper)").

### 2. Codex CLI (openai/codex, codex-rs)

Headline: **excludes cached input entirely**. `TokenUsage` in
`codex-rs/protocol/src/protocol.rs` (impl at lines 2384-2404 on main):

```rust
pub fn non_cached_input(&self) -> i64 {
    (self.input_tokens - self.cached_input()).max(0)
}
/// Primary count for display as a single absolute value: non-cached input + output.
pub fn blended_total(&self) -> i64 {
    (self.non_cached_input() + self.output_tokens.max(0)).max(0)
}
```

`cached_input_tokens` is a subset of `input_tokens` (OpenAI convention; the
subtraction above is the definition). The `/status` card builds
`total: total_usage.blended_total(), input: total_usage.non_cached_input(),
output: total_usage.output_tokens` (`codex-rs/tui/src/status/card.rs`). The raw
`total_tokens` (which includes cached) is used only as the context-window
occupancy via `tokens_in_context_window()`. So every session total Codex prints
is fresh input + output; cache reads appear in no displayed total.

**The "lifetime" figure exists and is server-computed.** `/usage` in the TUI and
the ChatGPT Codex analytics page ("Codex and Work Analytics",
chatgpt.com/codex/settings/usage; help.openai.com article 20001478) show
"Lifetime", "Peak" and daily buckets from the backend
(`codex-rs/backend-client/src/types.rs`, `TokenUsageProfileStats.lifetime_tokens`;
rendered in `codex-rs/tui/src/chatwidget/tokens/chart.rs`, `("Lifetime", ...)`).
The client only displays the number; what the server sums is not in the repo.
A controlled comparison against `/wham/profiles/me` later established the
current behavior: account daily buckets match guarded local
`input_tokens + output_tokens`, so they include cached input once. See
`docs/research/codex-account-token-stats-2026-09.md`.

### 3. OpenAI platform usage dashboard / Usage API

Headline: **cache-inclusive input, but as a subset, never an extra addend**.
`input_tokens` includes cached and cache-write tokens; `input_cached_tokens` is a
breakout (citation in the accounting-model section above). The dashboard charts
built on this API therefore show input and output where cached tokens are inside
input, counted once. There is no surface that adds cache reads on top of input.
The exact tiles of the logged-in platform dashboard UI: unverified (behind login),
but they render this API's fields.

### 4. Anthropic Console / Usage & Cost Admin API

Fields are **disjoint** (citation above). The Usage API returns
`uncached_input_tokens`, cache creation, `cache_read_input_tokens` and
`output_tokens` per bucket; consumers choose their own total. The Console usage
page's exact headline: unverified (behind login). The docs' framing ("Measure
uncached input, cached input, cache creation, and output tokens") treats them as
four parallel measures, not one total.

### 5. opencode (sst/opencode)

Stored tokens are normalized to **disjoint** parts: `adjustedInputTokens =
inputTokens - cacheRead - cacheWrite` with the comment "AI SDK v6 normalized
inputTokens to include cached tokens across all providers ... Always subtract
cache tokens to get the non-cached input count"
(`packages/opencode/src/session/session.ts`, around line 364). Display:

* `opencode stats` totals are **all-inclusive**: `sessionTotalTokens = input +
  output + reasoning + cache.read + cache.write`
  (`packages/opencode/src/cli/cmd/stats.ts`, around line 216), and the per-model
  breakdown prints Input Tokens, Output Tokens, Cache Read, Cache Write as
  separate rows (same file, around line 343).
* The TUI sidebar token figure is context occupancy: the LAST message's
  `input + output + reasoning + cache.read + cache.write` against the context
  limit (`packages/tui/src/feature-plugins/sidebar/context.tsx`, line 29). That
  is a context meter, not a usage total.

### 6. Cline and Roo Code

**Cline**: the task header's "Token Usage" accordion total is **all-inclusive**:
`const totalTokens = (tokensIn || 0) + (tokensOut || 0) + (cacheWrites || 0) +
(cacheReads || 0)`
(`apps/vscode/webview-ui/src/components/chat/task-header/ContextWindowSummary.tsx`,
line 121), with four labeled rows: Prompt Tokens, Completion Tokens, Cache
Writes, Cache Reads (lines 63-66). `tokensIn` itself excludes cache (disjoint
fields, summed from per-request metrics in
`apps/vscode/src/shared/getApiMetrics.ts`; the same file's
`getLastApiReqTotalTokens` sums all four for context-window purposes).

**Roo Code**: **no combined total at all**. The task header shows "Tokens:
up-arrow tokensIn, down-arrow tokensOut" and a separate "Cache: writes, reads"
line (`webview-ui/src/components/chat/TaskHeader.tsx`, lines 328-350).
`inputTokens` comes straight from Anthropic `input_tokens`, cache reads and
writes kept as their own fields (`src/api/providers/anthropic.ts`, lines
183-210). So Roo's visible token figures exclude cache reads; cache is its own
labeled pair.

### 7. LiteLLM and tokencost

**LiteLLM** normalizes Anthropic to the OpenAI convention: `calculate_usage`
does `prompt_tokens += cache_creation_input_tokens` and `prompt_tokens +=
cache_read_input_tokens` (`litellm/llms/anthropic/chat/transformation.py`,
lines 2296-2301), with the cached share exposed via `prompt_tokens_details`. A
passthrough handler comment states it outright: "prompt_tokens are
cache-inclusive" (`litellm/proxy/pass_through_endpoints/llm_provider_handlers/anthropic_passthrough_logging_handler.py`).
So LiteLLM's `total_tokens` counts cache reads once, inside prompt_tokens. Its
dashboard shows cache reads as their own metric ("Cache Read: N tokens",
`ui/litellm-dashboard/src/components/activity_metrics.tsx`).

**tokencost** (AgentOps-AI/tokencost) has no headline total: it prices token
types independently (`TokenType = Literal["input", "output", "cached"]`,
`calculate_cost_by_tokens` in `tokencost/costs.py`).

### 8. Other trackers, brief

* **Claude Code Usage Monitor** (Maciek-roboblog/Claude-Code-Usage-Monitor):
  all-inclusive. `total_tokens` property returns `input + output +
  cache_creation + cache_read` (`src/claude_monitor/core/models.py`, lines
  50-57); table views show cache columns separately.
* **sniffly** (chiphuyen/sniffly): headline **excludes cache**. "Total tokens" =
  `overview.total_tokens.input + overview.total_tokens.output`
  (`sniffly/static/js/stats-cards.js`; same sum in `export.js`, which lists
  Cache Created / Cache Read as separate lines). Cache reads feed only a "cache
  efficiency" stat and cost.
* **viberank** (sculptdotfun/viberank): ranks by ccusage's `totalTokens`, so it
  inherits ccusage's all-inclusive sum (submission flow per its README; not
  independently re-derived, secondary).
* **ccflare** (snipeship/ccflare): prices cache reads for cost
  (`packages/core/src/pricing.ts`); its token display composition: unverified.

## Synthesis

There are two useful conventions:

1. **All-inclusive sum with a visible split.** Claude-ecosystem trackers
   (ccusage, Claude Code Usage Monitor, Cline's accordion, opencode stats,
   viberank) add all four disjoint Anthropic fields into "total tokens", and
   every one of them prints Cache Read as its own column or row right next to
   that total. The total is a "tokens processed" figure and the split is always
   there to explain it.
2. **Fresh work.** Some session-level surfaces exclude cache reads from their
   single number. Codex CLI's `/status` and human `codex exec` use
   `blended_total`, while sniffly excludes cache and Roo Code keeps cache on a
   separate line.

Codex itself uses both. Its account Lifetime, daily, and weekly activity is
cache-inclusive, while its local session status is cache-excluded. A product
must name which one it shows and expose the split when the difference is large.

## Recommendation for aistack's 30-day headline

Use the cache-inclusive processed total as the headline and show its labeled
split.

* Headline = fresh input + cache writes + cache reads + output. This matches
  Codex account activity and counts every normalized bucket exactly once.
* Directly under or beside the headline, print fresh and cached amounts. This
  reconciles the processed total with Codex's cache-excluded session status.
* Cost is unaffected: pricing already rates each category separately, and the
  wire already ships the four atoms per day, so this is a read-time fold and
  display change, a server deploy, no re-sync (per the workflow-aggregates
  design in AGENTS.md).

Source files checked on main branches as of 2026-09-01; line numbers will
drift, function names are the stable anchors.
