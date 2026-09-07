# Context composition from session logs - primary-source research

Question: for a per-turn "context breakdown" on the stack page, modeled on Claude
Code's `/context` grid (System prompt, System tools, MCP tools, Memory files, Skills,
Messages, Free space), what can the aistack CLI actually recover from Claude Code and
Codex session logs, and what per-call context size is recoverable?

Method: direct inspection of the logs on this machine (structure and sizes only, no
conversation content reproduced), `strings` over the installed Claude Code binary,
source reading of `openai/codex` at `main` (fetched 2026-09-07), and the official docs.
Date: 2026-09-07. Builds on
[claude-code-transcripts-2026-07.md](claude-code-transcripts-2026-07.md),
[codex-session-log-anatomy-2026-08.md](codex-session-log-anatomy-2026-08.md) and
[aistack-token-accounting-end-to-end-2026-09.md](aistack-token-accounting-end-to-end-2026-09.md);
facts already established there are cited, not repeated.

**Local evidence base.** Claude Code: 305 main transcripts plus subagent files under
`~/.claude/projects/`, `version` 2.1.223 to 2.1.259 (retention has pruned older
files), installed binary 2.1.263 (`~/.local/share/claude/versions/2.1.263`, a
215 MB native executable, `strings`-readable). Codex: 447 rollouts under
`~/.codex/sessions/`, `cli_version` 0.116.0 to 0.153.4, 106 of them holding a
`compacted` line. Claims marked (observed) come from these files.

---

## 1. Summary

| `/context` category | Claude Code | Codex | How | Source |
|---|---|---|---|---|
| System prompt | **no** as a number; the text is not logged | **exact by characters, estimate in tokens** | Codex writes the full base prompt into `session_meta.payload.base_instructions.text` (17,972 and 21,261 chars observed). Claude Code's JSONL holds no system prompt text and no per-category count. | Codex: observed; Claude: §4, zero hits for the system-prompt sentence across the corpus |
| System tools | **no** | **no** | Neither harness persists tool definitions. Claude Code's `deferred_tools_delta` attachment lists tool NAMES only (73 names in 3,023 chars observed). Codex rollouts hold no `parameters` schema anywhere (0 of 447 files). | observed, §4 and §7 |
| MCP tools | **names only, estimate** | **names only** | Claude Code: `deferred_tools_delta.addedNames` (`mcp__…` names) and `mcp_instructions_delta.addedBlocks` (server instructions, 900 chars observed). MCP schemas are deferred by default, so names plus instructions IS what sits in context. Codex: MCP calls appear as `function_call` items; the listing itself is not logged. | Claude: observed attachments; deferral: [costs doc](https://code.claude.com/docs/en/costs) "MCP tool definitions are deferred by default, so only tool names and server instructions enter context" |
| Memory files (CLAUDE.md, MEMORY.md, rules) | **no from the log; exact by bytes from disk** | **exact by characters** | Claude Code never writes CLAUDE.md or MEMORY.md text to the JSONL (0 hits for sentences from both files in this session's own transcript), although the docs say it is "delivered as a user message after the system prompt". Only `nested_memory` attachments (lazy subdirectory CLAUDE.md, 2 records in the corpus) carry content. The files themselves are on disk. Codex writes `# AGENTS.md instructions for <cwd>` plus `<environment_context>` as a user-role `response_item` (2,289 chars observed). | [memory doc](https://code.claude.com/docs/en/memory) "Claude isn't following my CLAUDE.md"; observed |
| Skills | **exact by characters, estimate in tokens** | **exact by characters** | Claude Code: `skill_listing` attachment carries the injected description text (`content`, 14,713 chars for 43 skills observed) and `skillCount`. Codex: `<skills_instructions>` developer-role message (9,442 chars observed). | observed |
| Messages | **exact** | **exact** | Total context at a call minus the fixed part. The total is API-measured (§2). | §2, §3 |
| Free space | **derived, needs a window from a catalog** | **derived, window is logged** | `window - total`. Codex logs `model_context_window` on every `token_count`; Claude Code logs no window. | §5 |
| Autocompact buffer | no | no | Both harnesses hold the threshold in code or settings, not in the log. `~/.claude/settings.json` on this machine has no `autoCompactWindow`; Codex `auto_compact_token_limit` is `null` in `models_cache.json`. | observed |

The headline: **the per-call total context is exact on both harnesses; the split into
categories is not recoverable from Claude Code logs beyond "skills listing size" and
"first call overhead", and is recoverable by character count from Codex logs for the
system prompt, AGENTS.md, environment and skills, but not for tools.** Claude Code's own
`/context` does not persist its breakdown (§7), and it computes the categories with the
`count_tokens` API, not from anything the transcript holds (§4).

---

## 2. Per-call context size

### 2.1 Claude Code

Every assistant record carries `message.usage`; the context sent on that call is

```
context = input_tokens + cache_creation_input_tokens + cache_read_input_tokens
```

This is the documented formula:
"`total_input_tokens = cache_read_input_tokens + cache_creation_input_tokens + input_tokens`"
([prompt caching, "Understanding the token breakdown"](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)),
and it is exactly what `/context` itself displays as **Tokens**: the binary's
`/context` code takes the latest usage `ut` and sets
`en = ut.input_tokens + ut.cache_creation_input_tokens + ut.cache_read_input_tokens`
(minified chunk containing `claudeMdTokens`, `strings` of
`~/.local/share/claude/versions/2.1.263`). It is also the value the CLI already
folds as `routingTokens` via `countsTotal`
([`packages/cli/src/harness/claude/analyzer.ts` L199-231](../../packages/cli/src/harness/claude/analyzer.ts)),
which then only survives as a per-model SUM in `routing`, so the per-call figure is
computed today and thrown away.

Rules that already hold and matter here:

* One response is several JSONL records with cumulative usage; take the largest per
  `message.id` (analyzer header comment, L14-30). The per-call context is the same on
  every record of the group in the current corpus (observed), so any record works, but
  `apiBlockIndex` (10,070 records) now orders the blocks explicitly.
* `isSidechain: true` plus `agentId` marks a subagent call; a subagent has its own
  context window and its own first call (§3).
* `<synthetic>` model records are the harness's own, not a call (L305-313).

**Real example, one session's first three distinct responses** (usage object only;
model `claude-fable-5-1`, version 2.1.259, 2026-09-06):

```json
{"input_tokens":2,"cache_creation_input_tokens":50684,"cache_read_input_tokens":0,"output_tokens":366,
 "cache_creation":{"ephemeral_1h_input_tokens":50684,"ephemeral_5m_input_tokens":0}}
{"input_tokens":127,"cache_creation_input_tokens":8121,"cache_read_input_tokens":50684,"output_tokens":377}
{"input_tokens":127,"cache_creation_input_tokens":2230,"cache_read_input_tokens":58805,"output_tokens":176}
```

Context per call: 50,686, 58,932, 61,162. The cache read of call N equals the context
of call N-1 minus its `input_tokens` tail (50,684 = 50,686 - 2), which is the
cache-breakpoint geometry the docs describe and a useful self-check.

**First call of a session.** The first assistant record in the file (lowest
`timestamp`, or the record whose `parentUuid` chain has no earlier assistant). Across
265 main sessions its context ranges 0 to 55,251, median 40,648 (observed;
`input_tokens` is 2 on every first call, median and max). Two populations exist:

* 150 sessions with `cache_read_input_tokens > 0` on the FIRST call (17,391 to 25,368,
  median 23,216): a prefix that another session with the same model and version had
  already cached. That prefix can only be the parts shared across sessions, the system
  prompt and the tool definitions. Their `cache_creation` (median 21,672) is then the
  per-session part.
* 108 sessions with no read: `cache_creation` 24,250 to 55,054, median 36,418.

Inference, not a documented fact: on this machine "System prompt + System tools" is
about 17k to 25k tokens and the per-session remainder (CLAUDE.md, MEMORY.md, skill
listing, agent and tool listings, first prompt) about 22k, model-dependent.

**Compaction boundaries.** The record is `{"type":"system","subtype":"compact_boundary",
"compactMetadata":{trigger, preTokens, postTokens?, cumulativeDroppedTokens?,
preservedSegment|preservedMessages, ...}}`: the binary parses exactly this
(`n.type!=="system"||n.subtype!=="compact_boundary"` then reads
`n.compactMetadata?.preservedSegment||n.compactMetadata?.preservedMessages`), writes
`compactMetadata:{trigger:e,preTokens:t,userContext:o,messagesSummarized:d...}`, and
computes `cumulativeDroppedTokens ?? max(0, preTokens - postTokens)` over the file. The
summary message is a `user` record with `isCompactSummary: true`. The SDK stream form is
`compact_metadata: {trigger: "manual"|"auto", pre_tokens, post_tokens?,
cumulative_dropped_tokens?, duration_ms?}`. **Zero** `compact_boundary` and zero
`isCompactSummary` records exist in the local corpus (2.1.223 to 2.1.259, 305 files),
so the shape is source-confirmed but not log-confirmed here; the previous research saw
one marker in an older subagent file (transcripts note, open question 7). Observable
without the marker: a call whose context drops sharply while `cache_read` collapses.

### 2.2 Codex

Two line types carry per-response usage.

**`event_msg` / `token_count`** (every version in the corpus, 151,641 lines):
`payload.info.last_token_usage` is the per-response delta and
`payload.info.model_context_window` the window
([`protocol.rs` L2251-2257](https://github.com/openai/codex/blob/main/codex-rs/protocol/src/protocol.rs)).
The context at that call is

```
context = last_token_usage.input_tokens          (cached_input_tokens is a SUBSET of it)
fresh    = input_tokens - cached_input_tokens     (non_cached_input, protocol.rs L2405-2407)
total_tokens = input_tokens + output_tokens      (tokens_in_context_window returns it, L2414-2416)
```

`cache_write_input_tokens` exists in the struct (L2223, `serde(default)`) and is 0 on
every line of every local file (0 nonzero occurrences in 447 files, observed). The CLI
already reads `last_token_usage` and maps it to `input`/`cacheRead`
([`packages/cli/src/harness/codex/analyzer.ts` L193-216](../../packages/cli/src/harness/codex/analyzer.ts)),
so `input + cacheRead` before that subtraction IS the per-call context.

**`token_usage_record`** (new; 7 of 447 local files, first seen at `cli_version`
0.151.0, observed): one line per completed response with `response_id`, `usage`,
`turn_token_usage` and `thread_token_usage`
([`protocol.rs` L2238-2249](https://github.com/openai/codex/blob/main/codex-rs/protocol/src/protocol.rs),
written by `persist_rollout_items(&[RolloutItem::TokenUsageRecord(record)])`,
[`core/src/session/mod.rs` L4409](https://github.com/openai/codex/blob/main/codex-rs/core/src/session/mod.rs)).
It carries a stable per-call id, which `token_count` lacks. The CLI does not read it
yet (`ingestLine` dispatches only `event_msg` and `response_item`, analyzer L169-171).

**Real example** (one `token_usage_record`, ids shortened; `gpt-6-astra`, 0.153.4):

```json
{"turn_id":"01a078e0-…","response_id":"resp_0c4c…",
 "usage":{"input_tokens":130480,"cached_input_tokens":11392,"cache_write_input_tokens":0,
          "output_tokens":105,"reasoning_output_tokens":0,"total_tokens":130585},
 "turn_token_usage":{…same on the turn's first response…},
 "thread_token_usage":{"input_tokens":8897136,"cached_input_tokens":8344960,"output_tokens":26249,…}}
```

and the matching `token_count` on the next line:

```json
{"type":"token_count","info":{"total_token_usage":{…},"last_token_usage":{"input_tokens":130480,
 "cached_input_tokens":11392,"cache_write_input_tokens":0,"output_tokens":105,"reasoning_output_tokens":0,
 "total_tokens":130585},"model_context_window":258400},"rate_limits":{…}}
```

Context at this call: 130,480 of a 258,400 window (this rollout is a fork, hence the
large first call; see below).

**First call of a session.** The first `token_count` with a nonzero delta after
`session_meta`. A fresh, unforked session on this machine opens at
`input_tokens: 18515, cached_input_tokens: 11904` (observed, 0.153.4): about 18.5k
tokens of prompt, AGENTS.md, environment, skills and first message, of which 11.9k
was already cached by an earlier session (the base instructions and tool specs).
Caveats: (a) forked rollouts (`session_meta.forked_from_id` set) replay the parent
history first, so their first genuine call already carries the parent's context; the
CLI's 500 ms replay guard (analyzer L103-116) separates the two. (b) `session_meta`
carries `context_window: {window_id}` (protocol.rs L3099-3101), an IDENTITY of the
initial context window, not a size.

**Compaction boundaries.** A `compacted` rollout line
(`CompactedItem`, [`history/src/lib.rs` L182-199](https://github.com/openai/codex/blob/main/codex-rs/history/src/lib.rs))
holds `replacement_history` (the summary items that become the new history),
`window_number`, `first_window_id`, `previous_window_id`, `window_id` and
`latest_token_usage_record` (observed keys match). It is followed by a `turn_context`
and then a synthetic `token_count` whose `last_token_usage` is all zeros except
`total_tokens`, which is Codex's ESTIMATE of the post-compaction context:
`recompute_token_usage` sets `last_token_usage = TokenUsage { total_tokens:
estimated_total_tokens, ..0 }` from `estimate_token_count_with_base_instructions`
([`core/src/session/mod.rs` L4449-4485](https://github.com/openai/codex/blob/main/codex-rs/core/src/session/mod.rs),
called from [`compact_remote.rs` L308](https://github.com/openai/codex/blob/main/codex-rs/core/src/compact_remote.rs)).
Observed: pre-compaction call 212,564 input, then `compacted`, then a zero-delta
`token_count` with `total_tokens: 11041`, then the first post-compaction call at
17,390 input. An `event_msg` of type `context_compacted` marks it in the UI stream
(515 in the corpus). Two consequences for the CLI: the zero-delta line is already
skipped as "rate-limit-only refresh" (analyzer L214-216), which is correct for tokens
but drops the one line that states the post-compaction size; and the pre/post sizes
are recoverable as (last real call before `compacted`, first real call after it).

### 2.3 opencode and pi, briefly

Both store the four disjoint counters per assistant message, so per-call context is
`input + cache.read + cache.write` (opencode `message.tokens` row observed:
`{"input":19260,"output":18,"reasoning":105,"cache":{"write":0,"read":113}}`; pi
`message.usage` `{input, output, cacheRead, cacheWrite}` per
[`packages/cli/src/harness/pi/analyzer.ts` L8-23](../../packages/cli/src/harness/pi/analyzer.ts)
and [`opencode/analyzer.ts` L12-14](../../packages/cli/src/harness/opencode/analyzer.ts)).
Neither stores a category split or a window size; nothing further was checked.

---

## 3. Fixed overhead derivation

"First call's `input + cache_creation + cache_read`" is a valid **upper bound** on the
startup overhead and the closest single number the Claude Code log offers. What it
contains beyond the `/context` fixed categories:

1. **The first user prompt.** Measurable: the `user` record with `promptSource: "typed"`
   (370 chars in the example session). Subtract its estimate.
2. **Local-command echoes.** `isMeta`/`<local-command-caveat>` user records that precede
   the prompt (three records, 487 chars in the example). They are in the API request.
3. **Attachments injected with the first turn.** `deferred_tools_delta`,
   `agent_listing_delta`, `mcp_instructions_delta`, `skill_listing`, `auto_mode`,
   `total_tokens_reminder`, `output_style` (about 21.2k chars in the example). These
   ARE the `/context` categories "MCP tools (deferred)", "Custom agents", "Skills", so
   they should be counted, not subtracted. They are also what `/context` lists as
   `deferredBuiltinTools`, `agentDetails`, `skillFrontmatter` (binary identifiers).
4. **CLAUDE.md, rules and MEMORY.md.** In the request, not in the log (§4). Sizes come
   from disk: on this machine `AGENTS.md` 19,803 bytes plus a 10-byte `CLAUDE.md`
   importing it, `MEMORY.md` 12,004 bytes (capped at 200 lines or 25 KB, per the
   [memory doc](https://code.claude.com/docs/en/memory)), `~/.claude/CLAUDE.md` empty.
5. **Attachments such as images or pasted files** in the first prompt (`image` blocks
   exist in the corpus: 1,129) inflate it unpredictably.
6. **Git status block and environment info** are part of the system prompt and never
   logged (context-window doc: "Git branch, status, and recent commits load as a
   separate block at the very end of the system prompt").

So `overhead ~= firstCallContext - est(firstPrompt) - est(localCommandEchoes)`. The
cache-read split (§2.1) refines it further: on a first call with `cache_read > 0`,
`cache_read` is the cross-session shared prefix (system prompt + tools) and
`cache_creation` the per-session part.

For **subagents** the first call is a cleaner overhead: the subagent's system prompt,
CLAUDE.md hierarchy, listings and the task prompt
([sub-agents doc](https://code.claude.com/docs/en/sub-agents), "what loads at
startup"). Observed: a research subagent opened at `cache_creation: 41185` with a
6,269-char task prompt and the same seven listing attachments as the main session.

For **Codex** the first `input_tokens` is the same kind of bound, and the log lets
you subtract more: `base_instructions.text`, the developer messages
(`<skills_instructions>`, `<permissions instructions>`, `<collaboration_mode>`,
`<multi_agent_role>`), the AGENTS.md/environment user item and the first typed prompt
are all present as text (§4). The unexplained remainder is the tool specs.

**Compaction resets the baseline.** After compaction, Claude Code re-injects CLAUDE.md,
auto memory, unscoped rules and up to five recently read files
([context-window doc, "What survives compaction"](https://code.claude.com/docs/en/context-window)),
so the first call after a `compact_boundary` is a second "overhead-like" reading, not a
conversation reading. Codex's post-compaction estimate line (§2.2) plays the same role.

---

## 4. What is measurable by character count

### 4.1 Claude Code: what the JSONL holds and does not hold

Confirmed absent (0 hits in this session's own transcript, grep over the full corpus in
parentheses): the system prompt ("You are a Claude agent, built on Anthropic"), a
built-in tool description ("Executes a bash command and returns its output": 1 file,
a tool result quoting it), the project instructions (a sentence unique to `AGENTS.md`:
21 files, all tool results reading the file), `MEMORY.md` content. The
`<system-reminder>` wrapper that carries `# claudeMd` in the live request appears in
only 20 of 305 files and never with the CLAUDE.md payload. **The harness writes what it
injected as `attachment` records instead, and only for some injections.**

Attachment census over the corpus (46,131 records) and what each measures:

| `attachment.type` | count | content field | `/context` row |
|---|---|---|---|
| `skill_listing` | 574 | `content` (text), `names[]`, `skillCount`, `isInitial` | Skills (descriptions) |
| `deferred_tools_delta` | 581 | `addedLines`, `addedNames`, `removedNames`, `wireHiddenNames`, `failedMcpServers` | MCP tools (deferred) and System tools (deferred), names only |
| `agent_listing_delta` | 276 | `addedLines`, `addedTypes`, `isInitial` | Custom agents |
| `mcp_instructions_delta` | 6 | `addedBlocks`, `addedNames` | MCP server instructions |
| `nested_memory` | 2 | `path`, `content` | lazily loaded subdirectory CLAUDE.md |
| `hook_success` | 15,218 | `stdout`, `stderr`, `content`, `hookEvent` | Messages (hook output) |
| `total_tokens_reminder` | 12,622 | `text` = `<total_tokens>N tokens left</total_tokens>` | a budget reminder, NOT the context window (15,000,000 on this machine) |
| `output_style`, `auto_mode`, `batching_reminder_sent`, `bash_output_audience_note`, `task_reminder`, `edited_text_file`, `command_permissions`, `queued_command`, `silent_turn_reminder`, `date_change`, `opened_file_in_ide`, `read_truncation_notice`, `hook_system_message`, `remote_session_change`, `selected_lines_in_ide` | rest | small reminders and IDE state | Messages |

The CLI ignores `attachment` records today (`ingestRecord` dispatches `assistant`,
`user`, `system` only,
[`analyzer.ts` L167-171](../../packages/cli/src/harness/claude/analyzer.ts)).

### 4.2 Codex: what the rollout holds

Everything the model saw except the tool specs, as text:

* `session_meta.payload.base_instructions.text` with `provenance: {type: "model",
  model}` (observed 17,972 and 21,261 chars for two models).
* `response_item` `message` with `role: "developer"`: `<skills_instructions>` (9,442
  chars), `<permissions instructions>` (362), `<collaboration_mode>` (1,328),
  `<multi_agent_role>` (2,429), `<multi_agent_mode>` (271). 2,413 developer items in
  the corpus.
* `response_item` `message` with `role: "user"` at the head: `# AGENTS.md instructions
  for <cwd>` plus `<environment_context>` (2,289 chars), then the typed prompt, then
  any invoked skill body as a `<skill>` item (12,198 chars observed).
* Corpus marker counts: `<collaboration_mode>` 7,209, `<environment_context>` 1,042,
  `<skills_instructions>` 1,010, `<permissions instructions>` 982, `# AGENTS.md
  instructions` 889, `<turn_aborted>` 122.

Absent: tool and function specs (0 files contain a `"parameters":{"type":"object"`
schema), which the request builds per turn and never persists.

### 4.3 Converting characters to tokens

There is no exact local conversion. Two documented anchors:

* Claude Code itself does not estimate; `/context` calls the token counting endpoint.
  The binary's counter posts `client.beta.messages.countTokens({model, messages,
  tools, ...})` with `source: "count_tokens"`, logs `countTokens API call failed` on
  error and returns `null` (not a heuristic) for the category. Its only `chars/4`
  helper (`Ngn(e){return Math.ceil(e.length/4)}`) is used for streaming
  thinking-progress estimates, not for `/context`. The endpoint is free but
  rate-limited and needs credentials
  ([token counting doc](https://platform.claude.com/docs/en/build-with-claude/token-counting)),
  and the same doc warns the count is an estimate and that "Claude 4.7 and later
  models and Claude Mythos Preview use a newer tokenizer. The same input text produces
  approximately 30 percent more tokens than on earlier models."
* Codex's own estimator for the post-compaction size is `approx_token_count` over the
  base instructions plus per-item estimates
  ([`compact_remote.rs` L413-419](https://github.com/openai/codex/blob/main/codex-rs/core/src/compact_remote.rs)),
  so Codex accepts an approximation for exactly this purpose.

Practical rule for the CLI: publish the CHARACTER counts as atoms and let the server
apply one stated divisor per model family, or calibrate the divisor per session from
the first call (`firstCallContext / totalInjectedChars` where every injected byte is
known, which is true for Codex and false for Claude Code). Never label a converted
figure "measured".

---

## 5. Window sizes

**Codex** logs it. `token_count.info.model_context_window` is present on every line
(observed 258,400 for `gpt-6-astra` and `gpt-5.6-sol`). It is the usable window, not
the raw one: `usable_context_window = context_window * effective_context_window_percent / 100`
([`openai_models.rs` L509-513](https://github.com/openai/codex/blob/main/codex-rs/protocol/src/openai_models.rs),
same formula in
[`core/src/session/context_window.rs` L83-85](https://github.com/openai/codex/blob/main/codex-rs/core/src/session/context_window.rs)),
and `~/.codex/models_cache.json` lists `context_window: 272000,
effective_context_window_percent: 95` for those slugs: 272,000 x 0.95 = 258,400
(observed). `max_context_window` is 872,000 for the gpt-5.6 and gpt-6 slugs, so a
long-context tier exists but the logged window is the standard one. `turn_context`
has no window field in 0.153.4 (observed; `TurnContextItem.model_context_window` is
`Option<i64>`, protocol.rs L2178, and it is not serialized here). Codex's own
percent display subtracts a `BASELINE_TOKENS = 12000` constant "Includes prompts,
tools and space to call compact" (protocol.rs L2393-2394, L2428-2440): a coded
estimate of the fixed overhead, which is a useful sanity figure for the Codex
"System prompt + System tools" row.

**Claude Code** logs nothing about the window. `message.usage` has no window field;
`~/.claude/stats-cache.json` has a `contextWindow` per model but it is 0 for both
models on this machine (observed). The window is a table inside the binary plus
settings: the model setting here is `claude-fable-5-1[1m]`, the docs describe the
`[1m]` variant, `CLAUDE_CODE_DISABLE_1M_CONTEXT`, `autoCompactWindow`,
`CLAUDE_CODE_MAX_CONTEXT_TOKENS` and the per-model 200K boundary
([model-config doc](https://code.claude.com/docs/en/model-config), "Default
auto-compact thresholds"). So for Claude Code the window must come from the aistack
model catalog, keyed by `message.model` plus a `[1m]`/settings signal the log does not
carry. The corpus shows why the choice matters: of 15,609 distinct main-session calls,
3,398 exceed 200,000 tokens of context (p90 261,390, max 580,322), which is only
possible under a 1M window.

---

## 6. Proposed atoms (proposal, not a decision)

Per day, per harness, combinable under the existing rule (counts, sums, maxes,
`log-buckets/v1` histograms; no shares, medians or means,
[`daily.ts` L8-13, L220-223](../../packages/workflow-rules/src/daily.ts)). `logBucket`
is base-2, so for token counts a finer scale is needed: propose `log-buckets/v2` as
half-octave (`floor(2 * log2(v)) + 1`), which gives about 20 buckets between 1k and
1M and a median error under 20%.

```
context?: {
  bucketRuleVersion: "log-buckets/v2";
  // one entry per API call (main and subagent separately), bucket of context tokens
  calls: { main: {bucket, calls}[]; subagents: {bucket, calls}[] };
  // the same calls, bucketed by context / window; absent when the window is unknown
  fill?: { bucket: number; calls: number }[];          // percent buckets, 0..100 in 5s
  maxContext: number;                                    // a max
  callsOverWindow: number;                               // a count
  // fixed overhead: first call of each session, main and subagent separately
  firstCalls: { main: {bucket, sessions}[]; subagents: {bucket, sessions}[] };
  firstCallSharedPrefixTokens: number;   // sum of cache_read on first calls (Claude), cached_input (Codex)
  firstCallSessionTokens: number;        // sum of cache_creation (+ input) on first calls
  // injected text the log holds, in characters, summed over sessions that started this day
  injectedChars: { systemPrompt: number; skills: number; mcpInstructions: number;
                   toolNames: number; agentListing: number; memoryFiles: number; environment: number };
  injectedCharsSessions: number;         // sessions contributing, so the fold can average
  compactions: number;                   // compact_boundary / compacted lines
  compactionPreTokens: number; compactionPostTokens: number;  // sums, for a fold-level ratio
};
windowTokens?: { model: string; window: number; calls: number }[];  // Codex only; Claude from catalog
```

What the server can fold from this: median and p90 turn context (bucket medians, as
`medianBucket` does today, daily.ts L247-261), a "how full" histogram for the waffle,
an overhead-vs-conversation split as `sum(firstCallSessionTokens +
firstCallSharedPrefixTokens) / sessions` against the median call, and compaction
frequency. What it cannot fold: the seven `/context` rows for Claude Code, because
four of them are not in the log (§7).

---

## 7. Gaps

| Gap | Why | Proof |
|---|---|---|
| Claude Code system prompt and tool definition sizes | Not written to the JSONL. `/context` obtains them by calling `count_tokens` on the live request pieces (`systemPromptSections`, `builtInToolTokens`, `mcpToolTokens`, `agentTokens`, `claudeMdTokens`), a request the transcript never sees. | 0 hits for system-prompt and tool-description sentences (§4.1); binary `/context` code path (§4.3) |
| Claude Code CLAUDE.md / MEMORY.md / rules content | Delivered "as a user message after the system prompt" but not persisted; only lazily loaded `nested_memory` is. | [memory doc](https://code.claude.com/docs/en/memory); 0 hits (§4.1); 2 `nested_memory` records in 46,131 attachments |
| `/context` output persistence | The command renders to the terminal; the only persisted artifacts are `~/.claude/stats-cache.json` (no breakdown, `contextWindow` 0) and the SDK stream type `contextUsage` (`categories[].kind`, `mcp_tools`, `memory_files`, `agents`, `skills`), which is a live message, not a file. | binary strings: "One row of the /context usage-by-category breakdown", `_dr(o)` returns `contextUsage`; `~/.claude/settings.json` has no related key |
| Claude Code window size | Not logged; depends on model, `[1m]` variant, `autoCompactWindow`, env vars. | §5; [model-config doc](https://code.claude.com/docs/en/model-config) |
| Claude Code compaction markers in this corpus | Shape confirmed from the binary (`compact_boundary`, `compactMetadata.preTokens/postTokens`), none observed in 305 files; frequency and reliability unverified. | §2.1 |
| Codex tool specs | Built per request, never persisted in the rollout. | 0 of 447 files hold a `parameters` schema (§4.2) |
| Codex `token_usage_record` coverage | Only 7 of 447 local files (0.151.0+); older rollouts have `token_count` only, which lacks a response id. | observed (§2.2) |
| Codex cache writes | `cache_write_input_tokens` is 0 everywhere; the Responses API cached count is a subset of input, so "cache write" as a category does not exist for Codex. | protocol.rs L2223, L2405-2407; 0 nonzero in corpus |
| Codex post-compaction size | An estimate (`approx_token_count`), emitted as a zero-delta `token_count`; the CLI currently skips that line. | mod.rs L4449-4485; analyzer L214-216 |
| Exact chars-to-tokens | No local tokenizer for either vendor; Anthropic changed tokenizers at Opus 4.7 (+30%). | [token counting doc](https://platform.claude.com/docs/en/build-with-claude/token-counting) |
| OpenAI Responses `usage` reference | The API reference page did not return the `usage` object to the fetcher; the field semantics used here are the Codex source's own (`non_cached_input`, `tokens_in_context_window`). | protocol.rs L2405-2416 |

## Source index

* Local: `~/.claude/projects/**/*.jsonl` (2.1.223 to 2.1.259), `~/.claude/stats-cache.json`,
  `~/.claude/settings.json`, `~/.local/share/claude/versions/2.1.263` (strings),
  `~/.codex/sessions/**/*.jsonl` (0.116.0 to 0.153.4), `~/.codex/models_cache.json`,
  `~/.local/share/opencode/opencode.db`, `~/.pi/agent/sessions/`. Structure and sizes
  only; nothing modified.
* Repo: `packages/cli/src/harness/claude/analyzer.ts`, `packages/cli/src/harness/codex/analyzer.ts`,
  `packages/cli/src/harness/pi/analyzer.ts`, `packages/cli/src/harness/opencode/analyzer.ts`,
  `packages/cli/src/workflow/reducer.ts` L28-42, `packages/workflow-rules/src/daily.ts`,
  `packages/workflow-rules/src/usage.ts` L23-33.
* Codex source at `main` (2026-09-07): `codex-rs/protocol/src/protocol.rs`,
  `codex-rs/protocol/src/openai_models.rs`, `codex-rs/core/src/session/mod.rs`,
  `codex-rs/core/src/state/session.rs`, `codex-rs/core/src/compact_remote.rs`,
  `codex-rs/core/src/session/context_window.rs`, `codex-rs/history/src/lib.rs`.
* Docs: https://platform.claude.com/docs/en/build-with-claude/prompt-caching,
  https://platform.claude.com/docs/en/build-with-claude/token-counting,
  https://code.claude.com/docs/en/context-window, https://code.claude.com/docs/en/memory,
  https://code.claude.com/docs/en/costs, https://code.claude.com/docs/en/commands,
  https://code.claude.com/docs/en/model-config, https://code.claude.com/docs/en/sub-agents.
