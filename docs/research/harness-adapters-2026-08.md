# Harness adapters: opencode, cursor and pi-mono

Research for [#122](https://github.com/alp82/aistack/issues/122), on map
[#121 "Get the word out"](https://github.com/alp82/aistack/issues/121). Written 2026-08-09.

The three harnesses were **locked** when this research started. The owner picked them at the
#121 charting over a research-then-pick recommendation. This report did not re-open the
selection. It answers *how*, so the adapter tickets can be built without each one re-deriving
the same ground.

> **Outcome, 2026-08-09.** On the strength of section 3 below, the owner **cut Cursor from map
> #121** and moved it to the next map ([#125](https://github.com/alp82/aistack/issues/125),
> [#137](https://github.com/alp82/aistack/issues/137), handed off in
> [#135](https://github.com/alp82/aistack/issues/135)). **Map #121 ships two adapters:
> opencode and pi-mono.**
>
> The Cursor section stays in full. It is the evidence for the cut, and it is the starting
> point for whoever picks Cursor up. Read it as a finished investigation, not as a live build
> plan. Reading Cursor's disk cannot yield tokens. The only remaining path is the forward-only
> hook route described at the end of that section.

**Every claim here is measured against real files on the author's machine.** All three
harnesses have live local data, so this is empirical, not a documentation summary. Vendor
docs and upstream source are cited where they explain what the bytes mean. Where a harness
could not answer a question, the report says so plainly; that inability is itself a
result, and it changes what the adapter is allowed to claim.

The spec is written against the existing seam in `packages/cli/src/harness/`:
`types.ts` is the contract, `claude/` and `codex/` are the two working adapters, `shared/`
is the common payload code.

## The three answers in one line each

| Harness | Tokens on disk | Model per response | Timestamps | Priceable | Build cost |
| --- | --- | --- | --- | --- | --- |
| **pi-mono** | yes, four-way split **plus the cache-write TTL split** | yes | yes, ISO per entry | Anthropic and OpenAI share | **cheap** |
| **opencode** | yes, four disjoint counters | yes, with `providerID` | yes, epoch ms | 78.2% of tokens here | **medium** |
| **cursor** | **no** | selected, not served | never beside tokens | no | **risky** |

## Three findings that change the plan

**1. The ticket's premise for opencode is out of date.** The JSON tree at
`~/.local/share/opencode/storage` is dead storage. opencode migrated sessions to SQLite at
`~/.local/share/opencode/opencode.db` (commit `6d95f0d14`, 2026-02-13). On this machine the
JSON is a strict subset of the DB, 4 of 4 session ids and 35 of 35 message ids, so reading
both double counts. The adapter reads the database and needs a new I/O primitive.

**2. Cursor cannot report tokens, so it is weaker than the case the map locked.** The map
locked that "a subscription harness reports tokens and sessions with no dollars". Cursor
reports **sessions with no tokens and no dollars**. *(This is the finding that got Cursor cut
- see the note at the top.)* The one field that ever held tokens,
`tokenCount` on chat bubbles, is populated on **12 of 39,060 records**, the newest dated
**2026-01-13**, and every one of the twelve has `modelInfo: null`. There is no cache-read or
cache-write field at any grain. This was verified twice, independently. The locked shape
still stands, but Cursor falls short of it, and that is an owner decision (see
[Open decisions](#open-decisions-this-report-cannot-make)).

**3. Two seam changes are needed, and neither belongs inside an adapter ticket.**
`HarnessAdapter.pricingTableVersion` is a single required string (`types.ts:47`). Cursor must
declare no price table at all, and opencode routes five providers under one payload. Both
break the one-adapter-one-vendor assumption. Details in [Seam changes](#seam-changes-required).

## pi-mono

Harness: the `pi` coding agent. Version on this machine: `0.83.0` (`pi --version`).
Binary: `/usr/bin/pi` -> `/opt/pi-coding-agent/pi`.

Repo note: the task named `badlogic/pi-mono`. The shipped docs point at
`https://github.com/earendil-works/pi-mono`
(`/opt/pi-coding-agent/docs/session-format.md` line 31). `badlogic` is the
author's personal org and still hosts side repos such as `badlogic/pi-share-hf`
(`/opt/pi-coding-agent/docs/usage.md` line 138). Use `earendil-works/pi-mono`
for source citations.

Every claim below is either read off the real files in `~/.pi/agent/` on this
machine, off the vendor docs shipped inside `/opt/pi-coding-agent/docs/`, or off
the GitHub source. Both doc sets agree with the bytes on disk.

### 1. Where the history lives, and how stable the shape is

Path, from the vendor doc `/opt/pi-coding-agent/docs/session-format.md` (lines
5-11) and confirmed on disk:

```
~/.pi/agent/sessions/--<munged-cwd>--/<ISO-timestamp>_<uuid>.jsonl
```

The directory name is the absolute cwd with the leading separator dropped and
every `/` and `:` replaced by `-`, wrapped in `--`. Source:
`getDefaultSessionDirPath` in
`https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts`.

Real directories on this machine:

```
~/.pi/agent/sessions/--home-alp--
~/.pi/agent/sessions/--home-alp-dev-projects-curia--
~/.pi/agent/sessions/--home-alp-dev-projects-curia-spikes-worker-two-channels-ws-paseo--
~/.pi/agent/sessions/--tmp-claude-1000--home-alp-dev-projects-curia-25bd46f9-...-scratchpad-testws--
```

Layout is exactly two levels: root, one directory per cwd, then flat `.jsonl`
files. No date nesting (unlike Codex), no `subagents/` subdirectory (unlike
Claude Code).

Format is JSONL. One JSON object per line, each with a `type` field. Entries
form a tree through `id` / `parentId`, so branching happens in place inside one
file.

Root overrides the adapter must honor (`docs/environment-variables.md` lines
76-77):
- `PI_CODING_AGENT_DIR` overrides `~/.pi/agent`.
- `PI_CODING_AGENT_SESSION_DIR` overrides the session store.
- `--session-dir <dir>` overrides both, per run. A run started that way writes
  outside every discoverable root, so it is invisible to the adapter; the
  positive-claims rule permits that silence.

**Version marker: yes, and it is explicit.** The first line of every file is a
header carrying `version`. Real line from disk:

```json
{"type":"session","version":3,"id":"019f8fe5-f4d5-744d-9b02-4a9bad77279d","timestamp":"2026-07-23T16:54:00.149Z","cwd":"/home/alp/dev/projects/curia"}
```

The doc states the ladder (session-format.md lines 19-27): v1 linear, v2 tree,
v3 renamed `hookMessage` to `custom`. `CURRENT_SESSION_VERSION = 3`. Old files
are migrated in memory on load, not rewritten, so a scanner can still meet a v1
or v2 file on disk. The three shape changes so far never touched `usage`,
`model`, or `timestamp`, which are the only fields this adapter needs. This is
the strongest stability signal of the three harnesses: Codex has no version
field at all and needed a hand-built fingerprint (`codex/scan.ts`
`classifyRollout`).

The header is also a free genuineness fingerprint. A file whose first parsed
line is not `{"type":"session"}` with a numeric `version` was not written by pi.
That is the same negative test `classifyRollout` performs, with a field the
vendor put there on purpose.

Also on disk, and NOT session history:
- `~/.pi/agent/settings.json` - default provider and model. Real content:
  `{"lastChangelogVersion":"0.70.2","defaultProvider":"anthropic","defaultModel":"claude-opus-4-7","defaultThinkingLevel":"medium"}`.
  Usable as a static inventory hint, the way `codex/scan.ts` reads
  `config.toml`. It is a stated preference, not measured work.
- `~/.pi/agent/models-store.json` - the model catalog cache. Empty (`{}`) here.
- `~/.pi/agent/auth.json` - credentials. **Never open it.**
- `~/.pi/pi-acp/session-map.json` - ACP bridge index. It holds absolute
  `sessionFile` and `cwd` paths. It is an index, not usage. Skip it.

### 2. Token counts

Yes, per assistant response, with a full four-way split.

Real assistant record from
`~/.pi/agent/sessions/--home-alp-dev-projects-curia--/2026-07-23T16-54-00-149Z_019f8fe5-f4d5-744d-9b02-4a9bad77279d.jsonl`,
line 5 (reformatted, `errorMessage` truncated):

```json
{"type":"message","id":"acf8635a","parentId":"c506de52","timestamp":"2026-07-23T16:54:02.344Z",
 "message":{"role":"assistant","content":[],"api":"anthropic-messages","provider":"anthropic",
   "model":"claude-fable-5",
   "usage":{"input":0,"output":0,"cacheRead":0,"cacheWrite":0,"totalTokens":0,
            "cost":{"input":0,"output":0,"cacheRead":0,"cacheWrite":0,"total":0}},
   "stopReason":"error","timestamp":1784825641388,
   "errorMessage":"400 {\"type\":\"error\",...}"}}
```

Caveat, stated plainly: both sessions on this machine are one-shot smoke tests
that failed with an Anthropic 400, so every observed count is 0. The FIELD SET
is real and verified. The magnitudes are not observable here. Any adapter test
that needs non-zero numbers must build a fixture.

`Usage` shape, from the vendor doc (session-format.md lines 104-117) and from
`packages/ai/src/types.ts` on GitHub:

```typescript
interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cacheWrite1h?: number;   // in types.ts, not yet in the shipped doc
  reasoning?: number;      // a SUBSET of output
  totalTokens: number;
  cost: { input; output; cacheRead; cacheWrite; total };
}
```

The exact provider mapping is in the shipped binary. From
`strings /opt/pi-coding-agent/pi`, the Anthropic streaming reader:

```js
output.usage.input       = event.message.usage.input_tokens || 0;
output.usage.output      = event.message.usage.output_tokens || 0;
output.usage.cacheRead   = event.message.usage.cache_read_input_tokens || 0;
output.usage.cacheWrite  = event.message.usage.cache_creation_input_tokens || 0;
output.usage.cacheWrite1h= event.message.usage.cache_creation?.ephemeral_1h_input_tokens || 0;
output.usage.totalTokens = input + output + cacheRead + cacheWrite;
```

Three consequences that matter for the adapter:

1. `usage.input` is the Anthropic `input_tokens`, which already EXCLUDES cache
   read and cache write, so **no subtraction is needed**. This is the opposite of Codex,
   where `cached_input_tokens` is a subset of `input_tokens` and
   `codex/analyzer.ts` must subtract.
2. `cacheWrite1h` is a SUBSET of `cacheWrite`. pi's own cost function proves it:
   `const longWrite = usage.cacheWrite1h ?? 0; const shortWrite = usage.cacheWrite - longWrite;`.
   So the map into `TokenCounts` is exact, with no lower bound:
   `cacheWrite1h = usage.cacheWrite1h ?? 0`,
   `cacheWrite5m = usage.cacheWrite - cacheWrite1h`,
   `cacheWriteUnsplit = 0`.
   pi therefore carries the TTL split that the backend re-pricer normally has to
   guess. This is better than Codex, which reports no cache writes at all.
   When `cacheWrite1h` is absent (older sessions, non-Anthropic APIs), fall back
   to `cacheWriteUnsplit = usage.cacheWrite` and leave both split fields 0.
3. `reasoning` is already inside `output`. Never add it.

Grain: per assistant response, written once, append-only. There is no cumulative
total anywhere in the file, so neither Claude's message-id dedup nor Codex's
"sum the delta, never the total" applies. The values are deltas by construction.

**But there are four other places `usage` appears, and they are all real spend.**
From session-format.md:
- `toolResult` messages carry an optional `usage` - "Nested LLM work performed by
  the tool" (line 99). An extension that calls a model bills through here.
- `compaction` entries carry an optional `usage` - the summary generation
  (line 244).
- `branch_summary` entries carry an optional `usage` (line 259).
- `compaction.retainedTail` is a materialized `AgentMessage[]` (line 240). Those
  embedded assistant messages ALREADY appear as their own `message` entries
  earlier in the same file.

pi's own footer counts the first three: "Totals include assistant responses,
usage reported by tools, and summary generation" (`docs/usage.md` line 14).

**`retainedTail` is the double-count trap.** A naive recursive walk for any
`usage` key sums the same assistant response twice. The rule: read `usage` only
from `entry.message` where `role === "assistant"` or `role === "toolResult"`,
and from `entry.usage` on `compaction` / `branch_summary`. Never descend into
`retainedTail`.

### 3. Model per response

Yes. `message.model` sits on every assistant record, beside `message.provider`
and `message.api`.

Model ids actually on disk here: `claude-fable-5` and `claude-haiku-4-5`. Both
are exact keys in `packages/pricing/src/index.ts`. `normalizeModel` passes them
through unchanged.

`pi --list-models` on this machine (Anthropic is the only configured provider)
returns the full set of ids that can reach `message.model` for `provider:
"anthropic"`:

| pi model id | in `PRICES`? |
|---|---|
| `claude-fable-5` | yes |
| `claude-haiku-4-5` | yes |
| `claude-haiku-4-5-20251001` | yes, after `normalizeModel` strips `-20251001` |
| `claude-opus-4-1` | **no** |
| `claude-opus-4-1-20250805` | **no** |
| `claude-opus-4-5` | **no** |
| `claude-opus-4-5-20251101` | **no** |
| `claude-opus-4-6` | yes |
| `claude-opus-4-7` | yes |
| `claude-opus-4-8` | yes |
| `claude-opus-5` | yes |
| `claude-sonnet-4-5` | **no** |
| `claude-sonnet-4-5-20250929` | **no** |
| `claude-sonnet-4-6` | yes |
| `claude-sonnet-5` | yes |

Verdict for the native Anthropic path: pi uses the vendor's dashed ids verbatim.
`normalizeModel` works with zero changes. The three gaps (`opus-4-1`,
`opus-4-5`, `sonnet-4-5`) are pre-existing table gaps that Claude Code hits too,
and they surface correctly as `unpricedTokens`.

Three id hazards outside the native path, found by `strings` on the binary:

1. **Router ids are dotted and prefixed.** OpenRouter model ids embedded in the
   binary include `anthropic/claude-opus-4.6`, `anthropic/claude-sonnet-4.6`,
   `anthropic/claude-haiku-4.5`, `openai/gpt-3.5-turbo`. `normalizeModel` does
   not strip the `anthropic/` prefix and does not fold `4.6` to `4-6`, so these
   miss the table and surface as unpriced. That failure is the SAFE direction:
   an OpenRouter-billed response should not be priced at Anthropic list rates
   anyway. Do not "fix" it by normalizing the dots. Key the pricing on
   `provider` as well as model id, and price only `provider === "anthropic"` and
   `provider === "openai"`.
2. **Fast mode uses a `-fast` suffix, not `#fast`.** The binary carries
   `anthropic/claude-opus-5-fast`, `anthropic/claude-opus-4.8-fast`,
   `anthropic/claude-opus-4.7-fast`. The price table's keys are
   `claude-opus-5#fast` and `claude-opus-4-8#fast`. pi has no `usage.speed`
   field, so the adapter must translate the id suffix. `claude-opus-4-7-fast`
   has no table entry on purpose (see the comment in
   `packages/pricing/src/index.ts` line 106-108).
3. **`responseModel`.** `AssistantMessage` has an optional `responseModel`
   (`packages/ai/src/types.ts`). `model` is what pi asked for, `responseModel`
   is what the API says it served. For routers they differ. Decide this
   explicitly rather than by default. Recommended: price on `model`, and when
   `responseModel` disagrees, treat the response as unpriced.

Model changes are also recorded as their own entries, which gives a fallback
when a message lacks `model`:

```json
{"type":"model_change","id":"175c8e81","parentId":null,"timestamp":"2026-07-23T16:54:00.167Z","provider":"anthropic","modelId":"claude-fable-5"}
```

Prefer `message.model`. It is authoritative per response. Use `model_change` the
way `codex/analyzer.ts` uses `turn_context` - as context only.

### 4. Per-response timestamps

Yes, twice, in two different units. Both are on the real records above.

- Entry level: `entry.timestamp`, an **ISO 8601 string**
  (`"2026-07-23T16:54:02.344Z"`). Defined by `SessionEntryBase`
  (session-format.md lines 178-185). Present on every entry except the header.
- Message level: `message.timestamp`, a **Unix epoch in MILLISECONDS**
  (`1784825641388`). Defined by `UserMessage` / `AssistantMessage`
  (session-format.md lines 78, 90) as "Unix ms".

They are close but not equal. In the real record the entry timestamp is
`16:54:02.344Z` and the message timestamp is `1784825641388` =
`16:54:01.388Z` - a 956 ms gap, because the message timestamp is stamped when
the API call starts and the entry timestamp when the line is appended.

Use `entry.timestamp` for the window filter and for `activeDays`. It is a string
in the same shape the Claude and Codex analyzers already `Date.parse`, and it
exists on every entry type, including `compaction` and `branch_summary`, which
also carry priceable `usage`. Fall back to `message.timestamp` when the entry
timestamp is missing or unparseable. This gives per-response, time-aware pricing
through `apiEquivalentCost(modelKey, counts, tsMs)` with no gaps -
`agg.untimestampedResponses` should stay 0 in practice.

### 5. Pricing

pi is aggressively multi-provider. `docs/providers.md` lists 25+ API-key
providers plus 6 subscription logins. Provider id strings counted in the binary
by frequency: `openrouter` (662), `openai` (58), `anthropic` (57), `deepseek`
(49), `mistral` (33), `google` (28), `zai` (24), `groq` (11), `xai` (9),
`cerebras` (6), `bedrock` (4), `azure` (2). Model families embedded include
`gemini-3.1-pro`, `gemini-3.6-flash`, `deepseek-v4-pro`, `grok`, `kimi`, `glm`,
`qwen`, `minimax`.

`packages/pricing/src/index.ts` prices Anthropic and OpenAI only.

So:
- **Priced**: `provider === "anthropic"` with a native dashed id. This is the
  common case for a Claude Pro/Max user, and it is what the one real install on
  this machine does (`settings.json` -> `"defaultProvider":"anthropic"`).
- **Priced, with care**: `provider === "openai"`. The table's OpenAI rows are
  Codex-shaped (`gpt-5.5`, `gpt-5.6-terra`, `codex-auto-review`). A pi user on
  a raw OpenAI key may run ids outside that set.
- **Absent from the table**: google, deepseek, mistral, zai, groq, xai,
  cerebras, openrouter, bedrock, azure, copilot, vercel-ai-gateway, together,
  fireworks, huggingface, nvidia, radius, opencode, llama.cpp, and every custom
  provider.

There is a second option: **pi already priced it.** Every assistant
message carries `usage.cost.total`, computed at ingest by `calculateCost(model,
usage)` against `model.cost` from pi's own catalog, including tiered pricing.
That covers all 25 providers for free.

Do not use it as the published figure, for three reasons.
1. It is an unpinned third-party table refreshed over the network
   (`pi update --models`), so it is uncitable. The whole point of
   `PRICING_TABLE_VERSION` is that a dollar figure carries the table that
   produced it (`packages/pricing/src/index.ts` lines 34-38).
2. Two tables that both claim to price the same tokens drift, which is exactly
   the failure `packages/pricing` exists to prevent (#93).
3. The backend re-prices at read time from `@aistack/pricing`. A payload priced
   by pi's table cannot be re-priced consistently.

The honest design: price with `@aistack/pricing` exactly as Claude and Codex do.
Tokens from an unpriced provider land in `unpricedTokens` and are reported as
covered-share, never as `$0`. That is already the machinery
`addModelUsage` / `isPricedModel` provide. Ignore `usage.cost`.

### 6. Detection cost

pi is the CHEAPEST of the three harnesses to detect, by a wide margin.

The walk `hasRecentFile` (`shared/recency.ts`) would perform:
1. `readdir` of `~/.pi/agent/sessions` - one call.
2. `readdir` of each cwd directory - one call each. Depth stops here. There are
   no deeper directories.
3. `stat` each `*.jsonl` until one has `mtimeMs >= sinceMs`, then return true.

Measured on this machine right now:

```
pi:     4 directories, 2 .jsonl files, max depth 2 below the root
claude: 562 directories, 1697 .jsonl files
```

Worst case here is 5 `readdir` calls and 2 `stat` calls. `find` over the whole
tree completes in 0.02 s. The claude root is roughly 850x larger in file count.

The structural reason pi stays small: one directory per cwd, and files are
per session inside it. Directory count is bounded by the number of project
directories the user has ever run `pi` in. A heavy user with 200 projects and
50 sessions each still pays about 201 `readdir` plus at most 10,000 `stat`
calls in the negative case, which is the same order as the Claude walk today.

Two pi-specific optimizations exist, and only one is sound.
- **SOUND (positive shortcut).** The filename starts with the session START
  time: `2026-07-23T16-54-00-149Z_<uuid>.jsonl`. If that parsed time is at or
  after `sinceMs`, the file is in window without a `stat`. This can answer
  "yes" from `readdir` output alone.
- **UNSOUND (negative pruning).** The filename cannot prove a file is OUT of
  window. A session started in June and resumed today appends in-window records
  to a file whose name says June. Directory mtime is equally unsound, for the
  reason already verified and written down in `shared/recency.ts` and
  `claude/scan.ts`: appending to a file does not move its parent directory's
  mtime.

Adding the positive shortcut is optional. At this scale `stat` is free.

Live-detection state on this machine, as a sanity check: newest pi write is
`2026-07-23 18:54`. Today is `2026-08-09`, so the 30-day window opens about
`2026-07-11`. `detect()` returns **true** here. pi is genuinely a live harness
on this box, which makes it testable end to end.

### Constraint check

**Raw data never leaves the machine.** pi's files are more sensitive than
Codex's, because pi has no separate history file. Everything sits in the same
JSONL the adapter must open:
- `entry.cwd` on the header, and `parentSession`, are absolute paths.
- The DIRECTORY NAME is a munged absolute path. Handle it exactly the way
  `claude/scan.ts` handles `projectDir` and `codex/analyzer.ts` handles
  `state.cwd`: count it, never emit it.
- `role: "user"` content is raw prompt text.
- `role: "bashExecution"` entries carry `command`, `output`, and
  `fullOutputPath` (session-format.md lines 125-135). Raw shell output, on the
  same lines the scanner parses.
- `role: "custom"` and `custom_message` entries carry arbitrary extension text.
- `compaction.summary` and `branch_summary.summary` are LLM prose about the
  user's work.
- `errorMessage` on a failed assistant message contains the provider's raw
  response body. The real record on disk contains
  `"You're out of extra usage. Add more at claude.ai/settings/usage"` plus an
  Anthropic `request_id`.
- `ImageContent.data` is base64 image bytes inline. A pasted screenshot makes a
  session file large. Prefer streaming line by line (`claude/scan.ts` style)
  over the whole-file read `codex/scan.ts` uses, so one pasted image does not
  pull megabytes into memory.
- `~/.pi/agent/auth.json` holds credentials and must never be opened. Restrict
  the walk to `sessions/`, the same way `codex/scan.ts` restricts itself and
  refuses `history.jsonl`.
- Read errors must be swallowed, not thrown. The error object carries the
  absolute path.

**Positive claims only (#40).** pi omits several things the shared payload has
slots for. Every one must be SILENT, never 0.
- **No MCP.** `docs/usage.md` line 296: pi "intentionally does not include
  built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background
  bash." So `mcpServerCalls` and `mcpToolCalls` must be absent, not empty. There
  is no `config.toml` equivalent to read, so the static half of the MCP
  inventory does not exist either.
- **No subagents.** No sidechain flag exists. `subagentShare` must be omitted.
  Codex sets `mainTokens` and leaves `sidechainTokens` at 0, which reads as an
  honest 0 for Codex because Codex genuinely has one thread. pi is the same
  case, so the same treatment is defensible. Confirm which one `buildPayload`
  publishes before copying it.
- **No skill tool.** pi skills are prompt injections invoked as `/skill:name`
  (`docs/skills.md` line 79), not tool calls. They leave no countable record.
  `skillCalls` must be omitted.
- **Built-in tools are a short, vendor-fixed list** (`docs/usage.md` line 214):
  `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`. That is the whole
  `builtinTools` set. It is smaller and more stable than either existing
  harness's. Everything else on a `toolCall` block comes from a user extension
  and must fall to the per-category count under the fail-closed filter.
  `bashExecution` entries are user-typed `!` commands, not model tool calls.
  Decide whether they count. Recommended: do not count them as tool calls, since
  the model did not choose them.
- A pi install with no session inside the window must publish nothing at all.

**One correctness hazard specific to pi: `/fork` and `/clone` duplicate
entries into a second file, keeping the original entry ids.** Verified in
`session-manager.ts` on GitHub: `createBranchedSession` copies with
`{ ...entry, parentId: pathParentId }` and `forkFrom` writes each source entry
back out with `JSON.stringify(entry)`. Neither regenerates `id`. Both stamp
`parentSession` on the new header. So the same assistant response, with the same
tokens, can exist in two files inside one window. A per-file fold double-counts
it.

Dedup is required, and the entry `id` alone is not enough - it is only 8 hex
characters (about 4.3e9 values), so a 100k-entry corpus has a birthday collision
probability near 70%. Use a composite key:
`${entry.id}:${message.timestamp}:${usage.totalTokens}`. This is the same shape
as the Claude analyzer's `message.id` + `requestId` dedup, and it is the one
place where pi is harder than Codex, which needs no dedup at all.

Skipping any file whose header carries `parentSession` is NOT a valid shortcut.
A forked session's later entries are genuine new work.

### Build-difficulty verdict: CHEAP

Reasons, in order of weight.

1. The data model is the best of the three. Per-response `usage` with a real
   four-way split, a per-response `model`, a per-response ISO timestamp, and an
   explicit `provider`. No cumulative-total trap (Codex), no snapshot-replay
   dedup (Claude Code). The values are deltas by construction.
2. The cache-write TTL split (`cacheWrite` plus `cacheWrite1h` as a subset)
   maps onto `TokenCounts` exactly. pi is the only harness of the three that
   removes the backend re-pricer's lower-bound guess instead of adding to it.
3. The Anthropic model ids are the vendor's own dashed strings.
   `normalizeModel` and `PRICES` work unchanged.
4. Detection is trivially cheap. Two levels, no nesting, tiny file counts.
5. A vendor-documented format with an explicit `version` field and a
   vendor-documented migration ladder. Codex needed a reverse-engineered
   fingerprint. pi provides one in line 1.
6. `builtinTools` is seven names, published by the vendor.

The four things that make it cheap and not trivial, all bounded and all known
before a line is written:
- The `/fork` and `/clone` cross-file duplicate, needing a composite dedup key.
- The `retainedTail` embedded-message double count, needing one explicit
  "do not descend" rule.
- The four `usage` locations (assistant, toolResult, compaction,
  branch_summary), needing four small branches rather than one.
- The multi-provider gate, needing a `provider` check so a router-billed
  response is not priced at vendor list rates.

None of those needs new shared machinery. The adapter is a `HarnessAdapter`
with a `detect` that calls `hasRecentFile`, a `scan` that walks two levels and
streams JSONL, and a fold roughly the size of `codex/analyzer.ts`.

Risk sitting outside the code: **there is almost no real pi usage on this
machine to validate against.** Two sessions, both failed API calls, every token
count 0. The field set is verified. The magnitudes are not. Before shipping,
run a real pi session with non-zero usage and re-read the file, or the first
honest end-to-end check happens in front of a user.

### Sources

Local files (read directly):
- `/home/alp/.pi/agent/sessions/--home-alp-dev-projects-curia--/2026-07-23T16-54-00-149Z_019f8fe5-f4d5-744d-9b02-4a9bad77279d.jsonl`
- `/home/alp/.pi/agent/sessions/--home-alp-dev-projects-curia--/2026-07-23T16-54-44-086Z_019f8fe6-a076-7626-b43c-68bb3b08976a.jsonl`
- `/home/alp/.pi/agent/settings.json`, `/home/alp/.pi/agent/models-store.json`
- `/home/alp/.pi/pi-acp/session-map.json`
- `/opt/pi-coding-agent/docs/session-format.md`
- `/opt/pi-coding-agent/docs/usage.md`
- `/opt/pi-coding-agent/docs/providers.md`
- `/opt/pi-coding-agent/docs/environment-variables.md`
- `/opt/pi-coding-agent/docs/skills.md`
- `/opt/pi-coding-agent/pi` (via `strings`, for `calculateCost` and the
  Anthropic usage mapping)

Repo files (the contract this spec is written against):
- `/home/alp/dev/projects/aistack/aistack-web/packages/cli/src/harness/types.ts`
- `/home/alp/dev/projects/aistack/aistack-web/packages/cli/src/harness/codex/scan.ts`
- `/home/alp/dev/projects/aistack/aistack-web/packages/cli/src/harness/codex/analyzer.ts`
- `/home/alp/dev/projects/aistack/aistack-web/packages/cli/src/harness/claude/scan.ts`
- `/home/alp/dev/projects/aistack/aistack-web/packages/cli/src/harness/shared/aggregate.ts`
- `/home/alp/dev/projects/aistack/aistack-web/packages/cli/src/harness/shared/recency.ts`
- `/home/alp/dev/projects/aistack/aistack-web/packages/cli/src/harness/shared/window.ts`
- `/home/alp/dev/projects/aistack/aistack-web/packages/pricing/src/index.ts`

Upstream (primary):
- https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts
- https://raw.githubusercontent.com/earendil-works/pi-mono/main/packages/ai/src/types.ts
---
## opencode

Target: `sst/opencode`, now hosted at `anomalyco/opencode` (`gh api repos/sst/opencode` returns
`full_name = anomalyco/opencode`, default branch `dev`). Local evidence: `opencode 1.18.11` at
`/usr/bin/opencode`, data at `~/.local/share/opencode`. Source claims are pinned to branch `dev`
on 2026-08-09.

**Headline: the JSON files named in the ticket are dead storage. The live store is SQLite.**

---

### 1. Where session history lives, and in what format

The store is a single SQLite database.

* Path rule, from source
  ([`packages/core/src/database/database.ts`](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/database/database.ts)):

  ```ts
  export function path() {
    if (Flag.OPENCODE_DB) { ... }
    if (["latest","beta","prod"].includes(InstallationChannel) || process.env.OPENCODE_DISABLE_CHANNEL_DB === "1" ...)
      return join(Global.Path.data, "opencode.db")
    return join(Global.Path.data, `opencode-${InstallationChannel.replace(/[^a-zA-Z0-9._-]/g, "-")}.db`)
  }
  ```

  So the file is `opencode.db` on release channels, `opencode-<channel>.db` otherwise, and
  `$OPENCODE_DB` overrides both. A glob of `opencode*.db` is required. This is confirmed by
  [issue #16885](https://github.com/anomalyco/opencode/issues/16885) ("JSON->SQLite one-time
  migration reruns on channel-specific DBs", names `opencode-local.db`).
* `Global.Path.data = path.join(xdgData, "opencode")`
  ([`packages/core/src/global.ts`](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/global.ts)),
  so `$XDG_DATA_HOME/opencode` or `~/.local/share/opencode`.
* Observed on disk: `/home/alp/.local/share/opencode/opencode.db` (18,665,472 bytes), plus
  `opencode.db-wal` (4,140,632 bytes) and `opencode.db-shm`. The DB runs in WAL mode
  (`PRAGMA journal_mode = WAL` in `database.ts`), so a reader must be able to read the `-wal`
  and `-shm` siblings.

Tables that matter (read from `sqlite_master` on the real file):

| table | role | row count here |
|---|---|---|
| `session` | one row per session, plus **denormalized** `tokens_input/output/reasoning/cache_read/cache_write` and `cost` | 32 |
| `message` | v1 messages, `data` = JSON blob | 1016 |
| `part` | v1 message parts (tools, text, reasoning, step-finish), `data` = JSON blob | 4115 |
| `session_message` | **v2** message projection, `data` = JSON blob | 0 |
| `project` | `worktree` absolute path | 7 |

**Version markers exist and are usable.** Three of them:

1. `session.version` - the opencode version that wrote the session. Observed values:
   `1.1.27`, `1.1.65`, `1.2.6`, `1.2.25`, `1.2.27`, `1.3.1`, `1.3.7`.
2. `migration` table (drizzle-era `__drizzle_migrations` plus a newer `migration` table of
   38 rows, latest `20260622202450_simplify_session_input`). This is a real schema marker.
   An adapter can refuse to parse a DB whose latest migration id is past a pinned ceiling.
3. `data_migration` table for one-shot data moves.

**Is the shape stable?** Partly. `message` (v1) and `session_message` (v2) both exist in the
current generated schema
([`packages/core/src/database/schema.gen.ts`](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/database/schema.gen.ts),
`CREATE TABLE \`message\`` at line 128, `CREATE TABLE \`session_message\`` at line 170). The
v2 assistant record has a **different shape**
([`packages/schema/src/session-message.ts`](https://github.com/anomalyco/opencode/blob/dev/packages/schema/src/session-message.ts)):

```ts
export const Assistant = Schema.Struct({
  ...Base, type: Schema.Literal("assistant"),
  agent: Schema.String,
  model: Model.Ref,                       // { id, providerID }  - NOT modelID/providerID
  content: AssistantContent.pipe(Schema.Array),   // inline, not `part` rows
  cost: Schema.Finite.pipe(optional),
  tokens: Schema.Struct({ input, output, reasoning, cache: { read, write } }).pipe(optional),
  time: { created: DateTimeUtcFromMillis, completed: optional },
})
```

The token shape is identical. The model reference and the tool-call location are not. This
machine has 0 v2 rows, so I could not verify which table opencode 1.18.x writes. **Treat a
two-generation reader as a requirement.**

**The `storage/` JSON tree named in the ticket is legacy.** It holds 233 files
(`project/`, `session/`, `message/`, `part/`, `session_diff/`, plus a `migration` file whose
content is `2`). A one-time JSON to SQLite migration moved it
([issue #13654](https://github.com/anomalyco/opencode/issues/13654), commit `6d95f0d14`,
2026-02-13). On this machine the JSON is a **strict subset** of the DB: 4 of 4 session ids and
35 of 35 message ids also exist in SQLite. **Reading both double counts.** Read the DB only.
Note that #13654 reports users whose JSON was never imported and is now orphaned. A v2 could
back-fill those, but v1 must not.

---

### 2. Token counts

Yes, at **per-assistant-response** grain, in `message.data` JSON. Real record from
`opencode.db` (`select data from message`, formatted):

```json
{
  "role": "assistant",
  "time": { "created": 1774941217060, "completed": 1774941219047 },
  "parentID": "msg_d42bd15d4001B9rY3KDpwEDPQk",
  "modelID": "big-pickle",
  "providerID": "opencode",
  "mode": "build",
  "agent": "build",
  "path": { "cwd": "/home/alp/dev/projects/aistack/aistack-web", "root": "..." },
  "cost": 0,
  "tokens": {
    "total": 21373,
    "input": 241,
    "output": 50,
    "reasoning": 0,
    "cache": { "write": 573, "read": 20509 }
  },
  "finish": "stop"
}
```

Confirmed by the published SDK type
([`packages/sdk/js/src/gen/types.gen.ts`](https://github.com/sst/opencode/blob/dev/packages/sdk/js/src/gen/types.gen.ts)):
`tokens: { input: number; output: number; reasoning: number; cache: { read: number; write: number } }`.

Semantics, verified against the real data:

* **The four counters are disjoint.** `input + output + cache.read + cache.write` equals
  `tokens.total` on every record where `total` is present and the provider is not Google.
  So there is **no Codex-style subtraction** - `input` already excludes the cached prefix.
  Map straight through: `input -> input`, `output -> output`, `cache.read -> cacheRead`,
  `cache.write -> cacheWriteUnsplit`.
* **These are deltas, not cumulative sums.** `session.tokens_input` (a denormalized column)
  equals the exact sum of the per-message `tokens.input` over that DB: both are 6,605,877.
  The Codex cumulative gotcha does not apply.
* **Never read `tokens.total`.** It is absent on 35 of 925 assistant rows, and on 163 Google
  rows it exceeds the four-part sum by exactly `tokens.reasoning`. Compute the sum yourself.
* **Never add `reasoning`.** For `openai` and `anthropic` rows it is a subset of `output`.
  For `google` rows it is additive. Publishing it would be wrong for one vendor either way.
  Under positive-claims-only, stay silent about reasoning.
* **Cache writes carry no TTL split.** One merged `cache.write`, same lower-bound problem the
  backend re-pricer already documents. `cacheWriteUnsplit` in `packages/pricing/src/index.ts`
  is the right field, and it prices at the 5-minute rate. Observed 460,451 cache-write tokens
  across 157 records, all Anthropic and opencode-zen.
* `part` rows of `type: "step-finish"` repeat the same tokens. There are 911 of them against
  925 assistant messages, exactly one per message, and their sums match the message sums to
  the token. **Counting both double counts. Use `message` only.**
* **`cost` is always 0 here.** Sum over 925 assistant records is `0.0`, including 151 Anthropic
  and 539 OpenAI responses. opencode records 0 when the provider is authed by subscription or
  OAuth. Do not publish opencode's `cost`. Price from tokens, as the other adapters do.

---

### 3. Model ids per response

Yes. v1 assistant records carry `modelID` and `providerID` as top-level strings. No fallback
to a preceding context line is needed, unlike Codex. v2 carries `model: { id, providerID }`
(`Model.Ref` in
[`packages/schema/src/model.ts`](https://github.com/anomalyco/opencode/blob/dev/packages/schema/src/model.ts)).

Exact strings on disk, with tokens and the `packages/pricing` verdict (run through
`normalizeModel` + `isPricedModel`):

| providerID | modelID | responses | tokens | `normalizeModel` -> | priced |
|---|---|---:|---:|---|---|
| `openai` | `gpt-5.3-codex` | 399 | 22,769,948 | `gpt-5.3-codex` | **yes** (`openai-list-2026-08-02`) |
| `anthropic` | `claude-opus-4-6` | 151 | 10,990,393 | `claude-opus-4-6` | **yes** (`anthropic-list-2026-07-25`) |
| `google` | `gemini-3-pro-preview` | 196 | 10,943,248 | `gemini-3-pro-preview` | no |
| `openai` | `gpt-5.4` | 140 | 8,064,829 | `gpt-5.4` | **yes** (`openai-list-2026-08-02`) |
| `opencode` | `glm-4.7-free` | 23 | 492,891 | `glm-4.7-free` | no |
| `opencode` | `big-pickle` | 8 | 164,663 | `big-pickle` | no |
| `opencode` | `kimi-k2.5-free` | 6 | 69,988 | `kimi-k2.5-free` | no |
| `github-copilot` | `gemini-3-pro-preview` | 1 | 0 | `gemini-3-pro-preview` | no |
| `anthropic` | `claude-opus-4-5-20251101` | 1 | 0 | `claude-opus-4-5` | **no** (date suffix strips, but no `claude-opus-4-5` row) |

`normalizeModel` needs no change: opencode passes the vendor slug through unaltered, and the
dated-suffix rule already handles `claude-opus-4-5-20251101`. The gap is coverage, not parsing.

**Priced share on this machine: 41,825,170 of 53,495,960 tokens = 78.2%.**

---

### 4. Per-response timestamps

Yes, two of them, both **epoch milliseconds**:

* `message.data.time.created` - request start. Present on all 925 assistant records.
* `message.data.time.completed` - response end. Present on 924 of 925.

The SQLite row also carries indexed integer columns `message.time_created` and
`message.time_updated`, in ms, usable in the `WHERE` clause so the window filter runs in the
engine rather than in JS. The v2 schema types them as `DateTimeUtcFromMillis`, which pins the
unit in source.

Use `time.created` for pricing, to match the Codex adapter's convention of pricing at the
response's own timestamp.

`agg.activeDays` is derivable: 9 distinct UTC days across this DB.

---

### 5. Pricing

Priceable for the Anthropic and OpenAI share only. Providers present in real data:
`openai`, `anthropic`, `google`, `opencode` (the opencode-zen gateway), `github-copilot`.

Absent from `packages/pricing/src/index.ts`:

* **Google / Gemini.** `gemini-3-pro-preview` carries 10.9M tokens here, 20.5% of the total.
  This is the single largest coverage hole.
* **The `opencode` gateway models** - `glm-4.7-free`, `kimi-k2.5-free`, `big-pickle`. The
  `-free` names and the always-zero `cost` say these are promotional. `big-pickle` is an
  unbranded gateway codename with no public list price. Do not invent one.
* **`github-copilot`** as a provider. It re-serves other vendors' models under their own
  slugs, so the same `modelID` can arrive at a different real price. Do not price it.
* `claude-opus-4-5` - a real Anthropic model with no row in the table.

Two structural consequences for the payload:

1. One opencode payload **mixes vendors**. The adapter's `pricingTableVersion` constant is a
   single string. `packages/pricing` already anticipated this: `pricingTableFor(modelKey)`
   returns the table per model, and the comment says "one stack can carry Anthropic and
   OpenAI rows at once". But `HarnessAdapter.pricingTableVersion` is one field, and
   `buildPayload` stamps one `pricingTable`. **This is a seam decision the ticket must make:**
   either widen the payload to a per-model table id, or gate `publishCost` on the payload
   being single-vendor. Do not silently stamp one vendor's table id over another's dollars.
2. `shared/payload.ts` already handles the rest correctly. `unpricedTokens` accumulates,
   and `publishCost` only survives when `g.unpricedTokens === 0`. So a mixed-provider opencode
   scan simply publishes **no cost** and reports `excludedTokens.unpriced`. That is the
   positive-claims-only behavior, already built. The adapter needs no new machinery to be
   honest; it only has to avoid opencode's own zero `cost`.

---

### 6. Detection cost

**The `stat` walk from #101 does not apply, and a naive port of it is wrong twice.**

First, it is wrong on directory existence. `packages/core/src/global.ts` runs at module import:

```ts
await Promise.all([
  fs.mkdir(Path.data, { recursive: true }), fs.mkdir(Path.config, ...),
  fs.mkdir(Path.state, ...), fs.mkdir(Path.tmp, ...), fs.mkdir(Path.log, ...),
  fs.mkdir(Path.bin, ...), fs.mkdir(Path.repos, ...),
])
```

Every opencode start, including `opencode --version`, creates the whole tree. The DB layer
then opens `opencode.db` and applies migrations. So the directory and the file both exist
after any invocation at all. This is the exact failure #101 was written against.

Second, it is wrong on file mtime. Measured on this machine:

* `opencode.db` mtime: **2026-07-24 00:06**.
* Newest session message: `time_created = 1774941217060` = **2026-03-31 09:13**.

A four-month gap. Migrations, auth-token refresh and account writes touch the same file with
no session activity. An mtime probe on 2026-08-10 would have reported opencode "alive" while
the last real turn was 19 weeks old.

**So detection must be a query, not a stat.** Measured with `node:sqlite` on Node v24.15.0
against the real 18 MB DB:

```
open readOnly + select count(*), max(time_created) from message   0.49 ms  (total)
select 1 from message where time_created >= ? limit 1             0.02 ms  (query alone)
select max(time_updated) from session                             0.35 ms
```

`EXPLAIN QUERY PLAN` on the probe: `SCAN message USING COVERING INDEX
message_session_time_created_id_idx`. It is a covering-index scan, not a table scan, and it
never touches the JSON blobs.

Filesystem work for detection: **one `readdir` of `Global.Path.data` (7 entries here) to glob
`opencode*.db`, then one file open.** Zero directory recursion. Compare against Codex and
Claude Code, which recurse the whole session tree and `stat` every file to answer "no".

For completeness, the dead JSON tree: 233 files, 45 directories, `find` over all of it takes
**13 ms**. It is not worth walking, and it double counts if you do.

Full scan cost is likewise trivial. Projecting every message through `json_extract` in SQL:

```
1016 message rows -> role/model/provider/ts/4 token fields    2.8 ms
1201 tool part rows -> tool name / callID / skill name        9.3 ms
```

Sub-15 ms for a full 30-day scan against a 2.5-month history. Codex and Claude Code both take
seconds.

---

### Inventory surfaces (free, from `part`)

`json_extract(data, '$.tool')` over `part` where `$.type = 'tool'`, real counts:

```
read 395  bash 212  apply_patch 106  glob 87  grep 69  edit 69  skill 61
todowrite 38  question 23  task 21  webfetch 4  write 2
chrome-devtools_navigate_page 22  chrome-devtools_click 21  chrome-devtools_take_snapshot 19
chrome-devtools_evaluate_script 16  chrome-devtools_wait_for 11  ... (13 MCP names total)
```

* **MCP naming is ambiguous and the Codex split rule does not port.** Source
  ([`packages/opencode/src/mcp/catalog.ts`](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/mcp/catalog.ts)):
  `export const toolName = (clientName: string, name: string) => sanitize(clientName) + "_" + sanitize(name)`.
  The separator is a single `_`, and built-in tool names contain `_` too (`apply_patch`).
  Splitting on the first `_` would publish a fake MCP server named `apply`. **Fail-closed
  order: match the literal built-in set first, then match against MCP server names read from
  config, then bucket the remainder as an unnamed count.**
* **Skills come free.** The `skill` tool's `state.input.name` holds the skill name
  (`brainstorming`, `writing-plans`, `subagent-driven-development`). Claude Code's skill
  surface has an opencode equivalent, which Codex lacked.
* **Subagents come free.** The `task` tool's `state.input.subagent_type` names the agent, and
  `session.parent_id` marks child sessions. 19 of 32 sessions here are children.
* **`subagentShare` is honest, not a guess.** Splitting message tokens by whether the session
  has a parent: main 42,052,346, subagent 11,443,614 = **21.4% subagent**. Codex has to
  report 0 here.
* Static MCP inventory lives in `~/.config/opencode/opencode.json` under `"mcp"`, the analogue
  of Codex's `config.toml`. **It is JSONC, not JSON.** The real file on this machine has two
  trailing commas and `JSON.parse` throws on it. The adapter needs a comment-and-comma
  tolerant parser, and must treat a parse failure as silence.

---

### Constraint violations and hazards

**Raw data never leaves the machine: the DB holds many sensitive fields, so select named columns only.**
`opencode.db` also contains, in the same file the adapter opens:

* `account.access_token`, `account.refresh_token`, `control_account.*`, `credential.value`
* `session_input.prompt` - raw user prompt text
* `session.title`, `message.data.summary.title` - model-written titles of user prompts
* `session.summary_diffs`, `part.data.state.output` - **full file contents and command output**

Verified: `storage/session_diff/ses_3949aca89ffev5TSKB3c51chik.json` on this machine holds the
complete source of `convex/admin.ts`, including `ADMIN_EMAILS = ['alportac@gmail.com']`, in a
`before` field. The `part` blobs hold the same class of content.

Rules that follow:

1. Never `SELECT *`. Name every column, and pull tool data through `json_extract` of
   `$.tool`, `$.callID`, `$.state.input.name`, `$.state.input.subagent_type` only. Never
   materialize `part.data` in JS.
2. Never touch `session_input`, `session_share`, `account`, `control_account`, `credential`,
   `todo`, `session_context_epoch`, or `storage/session_diff/`.
3. `~/.config/opencode/antigravity-accounts.json` holds live Google OAuth refresh tokens. Out
   of bounds entirely, like `~/.codex/history.jsonl`.
4. `message.data.path.cwd`, `session.directory` and `project.worktree` are absolute repo
   paths. Count them into `agg.projectDirs`, never publish them, same rule the other two
   adapters hold.
5. Errors must be swallowed, not thrown. A `node:sqlite` error message carries the DB path.

**Positive-claims-only (#40) hazards specific to opencode:**

* `cost` is `0` on every record. A zero is not a measurement. Never publish it and never let
  it stand in for "free".
* `session.tokens_*` columns default to `0 NOT NULL`. A session opencode never priced looks
  identical to a session that cost nothing. Never read the denormalized columns as a fast
  path - use them only as a cross-check, as I did above.
* 21.8% of tokens here belong to unpriced providers. The correct output is no dollar figure
  plus `excludedTokens.unpriced`, which `shared/payload.ts` already does. Do not fill the gap
  with a Gemini price scraped from anywhere.
* `github-copilot` re-serving `gemini-3-pro-preview` proves `modelID` alone does not identify
  a price. Any future pricing key for opencode must be `providerID` + `modelID`, not the
  model slug the other two adapters use.

---

### Build-difficulty verdict: **medium**

The data itself is the best of the three harnesses. Per-response deltas with no cumulative
trap, disjoint cache counters that map onto `TokenCounts` with no arithmetic, millisecond
timestamps, an explicit provider and model on every record, and free skill, subagent and MCP
surfaces. Detection is 0.02 ms instead of a recursive `stat` walk. The pure analyzer is a
smaller job than Codex's.

Three things keep it off "cheap":

1. **A new I/O primitive.** Every existing adapter streams JSONL. This one needs SQLite.
   `node:sqlite` is the only dependency-free option, and it landed in Node 22.5 while
   `packages/cli/package.json` declares `"node": ">=18"`. Needs a feature-detected dynamic
   import that degrades to silence, in the shape of the existing `zstdDecompress` check in
   `codex/scan.ts`. A native dependency such as `better-sqlite3` is not acceptable in a
   published CLI. There is also a WAL wrinkle: a read-only open needs a readable `-shm`. It
   worked here in 0.49 ms, but it can fail on a locked or root-owned DB, and that must count
   as unreadable, never as zero.
2. **Two live message generations.** `message` (v1) and `session_message` (v2) with different
   assistant shapes, and I could not prove which one opencode 1.18.x writes, because this
   machine stopped at 1.3.7. Budget a reader for both, plus a migration-id ceiling check.
3. **The mixed-vendor payload.** `HarnessAdapter.pricingTableVersion` is one string and
   `buildPayload` stamps one `pricingTable`. opencode routes five providers. That is a seam
   change, not an adapter detail, and it needs a decision before the build starts.

Rough shape: `opencode/scan.ts` (glob `opencode*.db`, feature-detect `node:sqlite`, window
filter in SQL), `opencode/analyzer.ts` (pure fold over projected rows, reuses
`shared/aggregate.ts` unchanged), `opencode/adapter.ts` (built-in tool set, detect via the
indexed probe). Under half the code of the Codex adapter, on top of one new runtime risk.
---
## cursor

Investigated empirically on this machine on 2026-08-09. Cursor IDE 2.x (process
tree live during the reads), `cursor-agent` CLI build `2026.05.16-0338208` at
`/home/alp/.local/share/cursor-agent/versions/2026.05.16-0338208/`. Every SQLite
read used `file:...?mode=ro` or `?immutable=1`. No Cursor file was written.

### Verdict up front

**Build difficulty: risky.** Cursor stores sessions, timestamps, and model ids.
It does **not** store token counts. The one field that ever held them
(`tokenCount` on chat bubbles) is populated on **12 of 39,060** records on this
machine, all from 2025-11 to 2026-01, and it never carried cache tokens at all.
An adapter can honestly report **sessions, session recency, models selected, and
tool names**. It cannot report tokens from disk. Under positive-claims-only
(#40) that means the token block, the cost block, and the price-table id are all
**absent** from a cursor payload, not zero.

There is a second, worse problem: the harness has **two live storage
generations at once** and they disagree. See §1.

---

### 1. Where session history lives, and in what format

Three stores, all local. Two are current, one is dead-but-still-on-disk.

**(a) `~/.cursor/projects/<sanitized-workspace>/agent-transcripts/<id>/<id>.jsonl`
- JSONL, current, written by BOTH surfaces.**

The path is built in the CLI bundle: `const Qn=".cursor/projects", Dn="agent-transcripts"`,
and the workspace segment is `path.replace(/[^a-zA-Z0-9]/g,"-")` (grep hit in
`/home/alp/.local/share/cursor-agent/versions/2026.05.16-0338208/index.js`).
Observed dirs match that rule exactly, for example
`~/.cursor/projects/home-alp-dev-work-genius-repos-genius-prism/agent-transcripts/`.

This is the single most useful fact for the adapter: **all 264 transcript ids on
this machine are also `composerId` rows in the IDE's own database** (264/264
overlap against `composerHeaders`). The IDE agent and the `cursor-agent` CLI
write the same transcript format to the same tree. One adapter covers both
surfaces. The `cursor-agent` CLI additionally uses `<configDir>/chats/<md5(cwd)>`
for resume state (`CURSOR_CONFIG_DIR` || `$XDG_CONFIG_HOME/cursor` || `~/.cursor`),
but that directory does not exist here, so it holds no history the transcripts do
not already have.

Record shape, over all 266 transcript files (10,197 records):

```
["message","role"]        10048   -> {"role":"assistant","message":{"content":[...]}}
["status","type"]           125   -> {"type":"turn_ended","status":"success"}
["error","status","type"]    16
["error","type"]              8
```

`message` has exactly one key, `content`. `content` is an array of
`{"type":"text","text":...}` and `{"type":"tool_use","name":...,"input":{...}}`.
There is **no `usage`, no `model`, no timestamp anywhere in the file**. The
`turn_ended` marker, which is where a token record would naturally sit, carries
only `status` and an optional `error` string.

Sibling dirs in the same project tree: `subagents/` (same JSONL shape),
`agent-tools/*.txt` (raw tool output), `assets/`, `canvases/`, `mcps/`,
`terminals/`.

**(b) `~/.config/Cursor/User/globalStorage/state.vscdb` - SQLite, IDE only, 1.5 GB here.**

```sql
CREATE TABLE ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB);
CREATE TABLE cursorDiskKV (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB);
CREATE TABLE composerHeaders (composerId TEXT PRIMARY KEY, workspaceId TEXT,
  createdAt INTEGER, lastUpdatedAt INTEGER, isArchived INTEGER, isSubagent INTEGER,
  recency INTEGER, checkpointAt INTEGER, value TEXT);
CREATE INDEX idx_composerHeaders_0 ON composerHeaders (workspaceId, isSubagent, isArchived, recency);
CREATE INDEX idx_composerHeaders_1 ON composerHeaders (recency, composerId);
```

`cursorDiskKV` key prefixes, by row count: `agentKv:` 84,682, `bubbleId:` 39,060,
`checkpointId:` 1,241, `codeBlockPartialInlineDiffFates:` 827, `ofsContent:` 528,
`composerData:` 379, `inlineDiff:` 110.

**The shape is NOT stable across versions. It changed during this investigation, in this data.**
`bubbleId:` records (the old per-message store, 84 distinct JSON keys including
`tokenCount` and `modelInfo`) stop at **2026-07-23**. `composerHeaders` runs to
**2026-08-05**. The newer generation writes `agentKv:blob:<sha256>` - a
content-addressed store whose values are bare `{"role":..., "content":...}`
objects with **no tokens, no model, and no timestamp**. Cursor migrated the
message store during the observation window and dropped the only two fields an
adapter would want.

**(c) `~/.config/Cursor/User/globalStorage/conversation-search.db` - SQLite, 13 MB.**

```sql
CREATE TABLE conversations (fts_rowid INTEGER PRIMARY KEY, source TEXT
  CHECK (source IN ('local','cloud-cache')), scope TEXT, id TEXT, title TEXT,
  updated_at INTEGER, is_archived INTEGER, root_fingerprint TEXT, cache_fingerprint TEXT);
CREATE INDEX conversations_recency ON conversations(updated_at DESC, source, scope, id);
```

225 `local` rows, 6 `cloud-cache` rows. 22 local rows updated in the last 30
days. This is the cheapest honest session count, but `title` is derived from user
prompt text and must never be read into a payload, and `cloud-cache` rows are
**not local work** and must be excluded.

**(d) Per-workspace `~/.config/Cursor/User/workspaceStorage/<hash>/state.vscdb`**
holds `ItemTable['aiService.generations']`: a 50-entry ring buffer of
`{unixMs, generationUUID, type, textDescription}`. `textDescription` is the raw
prompt. `type` is `composer` or `bugbot`. No tokens. Out of bounds under #13.

**(e) `~/.cursor/ai-tracking/ai-code-tracking.db` - SQLite, 4.2 MB. It is a dead end.**

Tables: `ai_code_hashes`, `scored_commits`, `tracking_state`,
`conversation_summaries`, `tracked_file_content`, `ai_deleted_files`. This is
Cursor's "how much of this commit was AI-written" feature. It counts **lines**,
not tokens. Real row:

```json
{"hash":"bbbbe705","source":"composer","fileExtension":"ts",
 "fileName":"/home/alp/dev/work/genius/repos/genius-prism/src/domain/social-vertical-content.ts",
 "requestId":"aaea4900-...","conversationId":"10d35c46-...",
 "timestamp":1783695185713,"model":"default","createdAt":1783695185714}
```

198 rows. `conversation_summaries` is empty (0 rows). Every `ai_code_hashes.model`
value on this machine is the literal string `"default"`. `scored_commits` has
`linesAdded`/`tabLinesAdded`/`composerLinesAdded`/`humanLinesAdded` and
`v1AiPercentage`/`v2AiPercentage`. It is useful for a different product but has
nothing for this one. It also stores absolute source paths and full file contents
(`tracked_file_content.content`), so it is a privacy hazard the adapter should
simply never open.

---

### 2. Token counts

**No: not usably, and never for cache.**

The only field is `cursorDiskKV['bubbleId:...'].tokenCount`, and its shape is
exactly two integers:

```json
{"inputTokens": 0, "outputTokens": 0}
```

There is **no cacheRead and no cacheWrite field on disk at any grain**. That
alone would make Cursor's numbers non-comparable with the Claude Code and Codex
payloads, which are dominated by cache traffic.

Worse, it is almost never populated. Of 39,060 bubbles: **12** carry a nonzero
count, the newest dated 2026-01-13. Real record (the largest one on disk):

```json
{"type":2,"bubbleId":"02b03152-d8b5-4a8d-a73a-2250403db3ae",
 "createdAt":"2025-11-26T18:12:04.121Z",
 "tokenCount":{"inputTokens":59541,"outputTokens":6700},
 "modelInfo":null,"usageUuid":"eecb1e47-a654-414e-846a-9831006c9c2d",
 "timingInfo":null,"requestId":""}
```

Note `modelInfo: null` on every one of the 12. Even the twelve priceable-looking
records have no model attached.

Two near-misses worth naming so nobody re-checks them:

* `composerData:*.usageData` exists on 378 of 379 conversations and is `{}` on
  every single one.
* `composerData:*.contextTokensUsed` / `contextTokenLimit` / `contextUsagePercent`
  are real, for example `{"contextTokensUsed":35411,"contextTokenLimit":176000,
  "contextUsagePercent":20.1}`. This is a **context-window gauge**, a snapshot of
  how full the prompt is right now. It is not cumulative and summing it across
  conversations would fabricate a number.

**Tokens exist in memory and are exposed only to hooks.** The `cursor-agent` bundle
receives a `turnEnded` protobuf message carrying `inputTokens`, `outputTokens`,
`cacheReadTokens`, `cacheWriteTokens`, normalizes it, and forwards it to the
`afterAgentResponse` and `stop` hooks as:

```
input_tokens, output_tokens, cache_read_tokens, cache_write_tokens
```

alongside `generation_id` and `model`. The bundle even converts to Anthropic's
own field names in one branch:
`{input_tokens: max(input - cacheRead - cacheWrite, 0), output_tokens,
cache_creation_input_tokens: cacheWriteTokens, cache_read_input_tokens: cacheReadTokens}`.
Cursor's public hook docs list `conversation_id`, `generation_id`, `model`,
`model_id`, `model_params`, `hook_event_name`, `cursor_version`,
`workspace_roots`, `user_email`, `transcript_path` as the common input to all
hooks, and document `afterAgentResponse` input as only `{"text": ...}` - the
token fields are **shipped but undocumented**
(https://cursor.com/docs/hooks.md, common-schema section and the
`afterAgentResponse` / `stop` sections).

So the only path to Cursor tokens is a **forward-only hook install** in
`~/.cursor/hooks.json`, writing our own sidecar log. That is a different product
decision from "read what is already there", it depends on an undocumented field,
and it yields nothing for the user's past 30 days on the day they install it. It
is not a scan adapter.

---

### 3. Model ids on disk

Yes, but on the wrong records and in Cursor's own vocabulary.

`bubbleId:*.modelInfo.modelName` is present on **954 of 39,060** bubbles, and
**941 of those 954 are `type: 1` (user) bubbles**, not assistant responses. It is
the model *selected for the turn*, not the model that produced a response.
`composerData:*.modelConfig` carries the same thing per conversation plus
`maxMode` and `selectedModels[].parameters`.

The 17 distinct strings observed, with counts:

```
claude-4.6-opus-high-thinking      255
gpt-5.5                            152
claude-4.6-opus-high               105
claude-opus-4-7-thinking-max       102
composer-2.5                       101
default                             83
gpt-5.5-extra-high                  46
claude-opus-4-8                     46
claude-opus-4-7                     29
claude-4.5-opus-high                 8
composer-2                           6
claude-sonnet-5                      6
grok-4.5                             5
gpt-5.6-sol                          5
claude-4.6-sonnet-medium-thinking    3
composer-2-fast                      1
composer-1                           1
```

`modelConfig` adds `gpt-5.6-sol-medium`, `composer-1.5`.

Against `packages/pricing/src/index.ts`: `normalizeModel()` only strips a
trailing `-YYYYMMDD`, so matching is exact-string. **238 of 954 (25%) match a
`PRICES` key**: `gpt-5.5`, `gpt-5.6-sol`, `claude-opus-4-8`, `claude-opus-4-7`,
`claude-sonnet-5`. The rest do not, in three ways:

1. **Reordered vendor names.** `claude-4.6-opus-high` is Cursor's spelling of
   what the price table calls `claude-opus-4-6`. `claude-4.6-sonnet-medium-thinking`
   → `claude-sonnet-4-6`. A normalizer would have to re-order and strip effort
   suffixes (`-high`, `-extra-high`, `-thinking`, `-medium`, `-max`).
2. **Cursor-proprietary models with no public per-token price.**
   `composer-1`, `composer-1.5`, `composer-2`, `composer-2.5`, `composer-2-fast`.
   Cursor's pricing page puts these in a "Cursor Models Pool" with "generous
   included usage", not a per-token rate (https://cursor.com/docs/account/pricing).
3. **Third-party models outside the table's two vendors.** `grok-4.5`. The price
   table is Anthropic + OpenAI only.
4. **`default`** (83 hits) - auto-routing. The actual model is unknowable from disk.

Cursor's pricing page does publish a per-million-token table with input / cache
write / cache read / output columns for third-party models
(https://cursor.com/docs/account/pricing). So a *third* price table could be
built. It would be pointless: there are no tokens to multiply it by.

---

### 4. Per-response timestamps

Mixed, and none of them sit next to a token count.

* `bubbleId:*.createdAt` - **present on all 39,060 bubbles**, an **ISO 8601 UTC
  string**, for example `"2026-07-23T09:15:15.288Z"`. Not epoch ms. Range on
  this machine: 2025-11-26 to 2026-07-23.
* `bubbleId:*.timingInfo` - sparse, epoch **ms** numbers:
  `{"clientStartTime":165658.8,"clientRpcSendTime":1764180657974,
  "clientSettleTime":1764180775214,"clientEndTime":1764180775214}`. Note
  `clientStartTime` is a monotonic uptime reading, not a wall clock. It was
  `null` on all 12 token-bearing bubbles.
* `composerHeaders.createdAt` / `.lastUpdatedAt` / `.recency` - epoch **ms**
  integers, indexed. Session grain, not response grain.
* `conversations.updated_at` - epoch **ms** integer, indexed.
* `ai_code_hashes.timestamp` / `.createdAt` - epoch **ms**.
* **The JSONL transcripts have no timestamps at all.** The only time signal
  there is the file mtime, which is turn-level at best and session-level in
  practice.

`packages/pricing`'s whole design (`priceAt(modelKey, atMs)`, per-response
pricing at ingest) needs a timestamp *on the same record as the tokens*. No such
record exists in Cursor.

---

### 5. Can it be priced? What can be reported honestly?

**Cost: no, and the map already ruled the alternative out of scope.** Cursor is
the subscription case. Even setting the flat-fee question aside, the mechanical
blockers stand on their own: no cache tokens at any grain, tokens on 0.03% of
records, no model on the records that do have tokens, and no timestamp on those
records either. `apiEquivalentCost()` cannot be called. `pricingTableVersion`
must not be stamped, because a stamped table id is a citation for dollars that
do not exist.

**Tokens: no.** Do not publish a token block. Under #40 the correct behavior is
silence, and a zero would be a lie about a harness the user is heavily using.

**What CAN be reported honestly, all of it measured:**

| Fact | Source | This machine |
| --- | --- | --- |
| Sessions in window | `conversations` where `source='local'` and `updated_at >= sinceMs`, or `composerHeaders.recency` | 22 in last 30 days |
| Last activity | `max(composerHeaders.recency)` | 2026-08-05 |
| Models selected | `bubbleId:*.modelInfo.modelName`, `composerData:*.modelConfig.modelName` | 17 distinct |
| Built-in tool names | `tool_use.name` in the JSONL transcripts | `ReadFile`, `Shell`, `Subagent`, ... |
| MCP servers configured | `~/.cursor/mcp.json`, `projects/*/mcps/<name>/` | 10 dirs on one project |
| Subagent use | `agent-transcripts/*/subagents/*.jsonl`, `composerHeaders.isSubagent` | present |

That set matches the map's locked shape for a subscription harness: sessions and
models, no dollars. Note the model list is "what the user picked", not "what ran"
- label it that way. `default` (83 hits) means auto-routing and should publish as
`default`, not be dropped and not be guessed.

---

### 6. Detection cost - measured

`#101` wants a `stat` walk that stops at the first in-window file. Cursor can
satisfy that, but only if the walk is pruned. Measurements below are **warm
page cache**, wall-clock, median of 3, on this machine.

**Option A - the transcript walk (recommended).**
Glob `~/.cursor/projects/*/agent-transcripts/*/*.jsonl` and `stat` each.

```
pruned glob, 264 files                            2 ms
naive recursive walk of ~/.cursor/projects       18-29 ms
```

The naive walk is 10x worse because `~/.cursor/projects` holds **7,152 files
across 647 directories**, and **7,042 of them are under `mcps/`** - MCP server
caches that have nothing to do with sessions. `agent-transcripts` accounts for
429. **The adapter must prune to `*/agent-transcripts/` and never recurse the
project root.** `hasRecentFile()` in `shared/recency.ts` recurses everything it
is given, so it needs either a `prune` predicate or roots handed to it one level
deeper.

`recency.ts`'s existing warning applies unchanged: appending to a transcript does
not move its parent directory's mtime, so directory mtimes cannot prune further.

**Option B - SQLite. Cheap to query, expensive to depend on.**

```
sqlite3 'file:...state.vscdb?mode=ro'
  "select 1 from composerHeaders where recency>=<since> limit 1;"        1 ms
sqlite3 'file:...conversation-search.db?mode=ro'
  "select 1 from conversations where updated_at>=<since>
   and source='local' limit 1;"                                          1 ms
```

Both hit a covering index, so the 1.5 GB file size does not matter - this is a
B-tree seek, not a scan. It is genuinely fast, **and it is still the wrong
choice**, for four reasons:

1. **`packages/cli` has zero native dependencies today** (`@clack/prompts`,
   `commander`, `ignore`, `open`, `picocolors`, `smol-toml`, `yaml`) and
   `engines: node >=18`. Reading SQLite from Node means either `better-sqlite3`
   (native, prebuilt binaries per platform and per Node ABI, a step change in
   packaging risk for an npm-published CLI) or `node:sqlite` (Node 22.5+, which
   raises the engine floor). Shelling out to a system `sqlite3` is not portable.
2. **Locking.** Cursor was running during every read here (14 processes) and
   `mode=ro` worked. That is not a guarantee. The safe fallback, `immutable=1`,
   **ignores the WAL** - there were 6.6 MB of pending WAL bytes at read time, so
   a session written minutes ago can be invisible. Detection would then say "not
   present" for a live harness, which is exactly the bug #101 fixed.
3. **`state.vscdb` mtime is not a usable proxy.** The file is touched by editor
   state, file-tab view state, and secret storage, none of which is agent
   activity. `stat` on it is 0 ms and answers the wrong question.
4. **Schema churn.** `composerHeaders` is not in the older `state.vscdb.backup`
   generation's vocabulary, `bubbleId:` records stopped being written on
   2026-07-23, and `agentKv:` replaced them. A schema-coupled detector breaks on
   a Cursor update. The JSONL path has held its shape across the same window.

**Cold cache caveat:** I could not drop the page cache without root, so treat the
2 ms as a floor. The pruned walk touches 264 files and ~30 directories, which is
the same order as the Codex walk, so the cold number should be comparable.

---

### Constraint checks

**Raw data never leaves the machine (#13).** Cursor is more hazardous than Codex
here, and the hazards are in the files an adapter is most tempted to open.

* `agent-transcripts/*.jsonl` `message.content[].text` is **raw prompt and
  response text**, and `tool_use.input` carries **absolute paths and full shell
  commands**. Read it for `tool_use.name` only. Nothing else in the record may
  cross the boundary.
* `agent-tools/*.txt` is raw tool output. Never opened.
* `conversations.title` is a summary of the user's prompt. Never published.
* `ItemTable['aiService.generations'].textDescription` is the verbatim prompt.
  Never opened.
* `ai-tracking/ai-code-tracking.db` stores `tracked_file_content.content` (whole
  source files) and absolute `fileName` paths. Never opened.
* The **project directory names are the user's absolute paths** with separators
  replaced by dashes: `home-alp-dev-work-genius-repos-genius-prism` is
  `/home/alp/dev/work/genius/repos/genius-prism`. The directory names therefore
  leak the user's repo paths. Path handling in error strings must follow the
  same rule `codex/scan.ts` already follows: swallow the error, keep only the
  error class, never the path.
* `ItemTable` also holds `cursorAuth/accessToken` and `cursorAuth/refreshToken`.
  Opening `state.vscdb` at all puts live credentials one query away. That is an
  independent argument for Option A.
* Hook payloads carry `user_email`. If the hook route is ever taken, drop it at
  the hook script.

**Positive-claims-only (#40).** The cursor adapter must omit, not zero:
`tokens`, any cost field, and `pricingTableVersion`. `HarnessAdapter` currently
declares `pricingTableVersion: string` as required
(`packages/cli/src/harness/types.ts:47`). **This is the seam change the ticket
implies**: the field has to become optional, or the payload builder has to accept
an adapter that declares no price table, and `shared/payload.ts` has to emit a
payload with no dollars and no token block at all. That is the concrete
integration cost, and it is shared work that the next subscription harness reuses.

### Which surface should the adapter target

**Target the JSONL transcript tree at `~/.cursor/projects/*/agent-transcripts/`,
and treat it as covering both surfaces.** The 264/264 id overlap with
`composerHeaders` proves the IDE and the `cursor-agent` CLI write the same files.
One walk, no SQLite, no native dependency, no credentials in reach, and the
`stat`-walk detection contract of #101 holds at 2 ms once the walk is pruned past
`mcps/`.

Use `conversation-search.db` or `composerHeaders` **only** if session counting
from the transcript tree proves insufficient, and accept the native-dependency
cost knowingly if so. Model ids are the one fact that lives only in SQLite; if
that fact is not worth a native dependency, publish sessions and tools without it
and say nothing about models.
---

## Seam changes required

Two changes sit in `shared/`, not in any one adapter. Both are shared work that the next
harness reuses, and both should land before the adapter tickets start.

### A. An adapter must be able to declare no price table

`HarnessAdapter.pricingTableVersion` is a required `string`
(`packages/cli/src/harness/types.ts:47`), and `buildPayload` stamps it as
`pricingTable: publishCost ? pricingTableVersion : null` (`shared/payload.ts:362`).

Cursor has no dollars and no tokens. Stamping a table id would be a citation for figures
that do not exist. The field has to become optional, and the payload builder has to accept
an adapter that declares no price table and emit a payload with no cost block and no token
block. This is the concrete integration cost of the subscription case.

### B. One opencode payload mixes vendors

opencode routes five providers. On this machine one payload would carry OpenAI rows
(`gpt-5.3-codex`, `gpt-5.4`) and Anthropic rows (`claude-opus-4-6`) at once, priced from two
different tables, and stamp **one** table id over both.

The per-model gate is already correct and needs no change. `buildModels` gates each model
group separately (`shared/payload.ts:253`): a group is priced only when
`!g.anyUnpriceable && g.unpricedTokens === 0`. So the Gemini rows publish no dollars while
the OpenAI rows still do, which is the right behavior. The defect is only the **single
top-level `pricingTable` string**.

`packages/pricing` already anticipated this: `pricingTableFor(modelKey)` returns the table
per model (`packages/pricing/src/index.ts:191`). The fix is to carry the table id per model
group in the payload rather than once per harness. That is a wire change, so it rides with
the other pending wire changes rather than being done quietly.

**Note this corrects a plausible-sounding but wrong reading:** a mixed-provider opencode scan
does *not* suppress all cost. It publishes cost for the fully-priced model groups and
withholds it from the rest, then stamps one vendor's table id across the lot. The gap is the
citation, not the dollars.

## Costed build order

### 1. pi-mono - cheapest, build first

The best data model of the three. Per-response `usage` with a four-way split, a per-response
`model` and `provider`, a per-response ISO timestamp, and no cumulative-total trap. Anthropic
ids are the vendor's own dashed strings, so `normalizeModel` and `PRICES` work unchanged.
Detection is 4 directories and 2 files here, against Claude Code's 562 and 1697.

It is also the only harness of the three that **improves** the backend re-pricer.
`cacheWrite1h` is a proven subset of `cacheWrite`, so the TTL split maps onto `TokenCounts`
exactly. Every other harness makes the re-pricer guess the cheap tier. pi removes the guess.

Format risk is the lowest available: line 1 of every file is a vendor-written header with an
explicit `"version": 3` and a published migration ladder. Codex needed a reverse-engineered
fingerprint. pi provides one.

Four bounded hazards, all known before a line is written: the `/fork` and `/clone` cross-file
duplicate needing a composite dedup key, the `compaction.retainedTail` embedded-message
double count, `usage` living in four places, and the multi-provider gate.

**The one real risk is outside the code.** There is almost no real pi usage on this machine.
Both sessions are failed smoke tests with every count at 0. The field set is verified. The
magnitudes are not. Record one real pi session before shipping, or the first honest
end-to-end check happens in front of a user.

### 2. opencode - medium, build second

The data itself is excellent, and in three ways it is the richest of the three: skills,
subagents and MCP names all come free from the `part` rows, and `subagentShare` is a real
measurement rather than the honest 0 that Codex must report. The pure analyzer is a smaller
job than Codex's, and a full 30-day scan runs in under 15 ms against a 2.5-month history.

Three things keep it off "cheap", and the third is the one that must be settled first.

1. **A new I/O primitive.** Every existing adapter streams JSONL. This one needs SQLite.
   `node:sqlite` is the only dependency-free option and it landed in Node 22.5, while
   `packages/cli` declares `>=18`. It needs a feature-detected dynamic import that degrades
   to silence, in the shape of the existing `zstdDecompress` check in `codex/scan.ts`. A
   native dependency such as `better-sqlite3` is not acceptable in a published CLI.
2. **Two live message generations.** `message` (v1) and `session_message` (v2) have different
   assistant shapes, and this machine has 0 v2 rows, so which one opencode 1.18.x writes is
   unproven. Budget a reader for both plus a migration-id ceiling check.
3. **Seam change B**, above.

Detection needs its own attention. The `stat` walk from
[#101](https://github.com/alp82/aistack/issues/101) is wrong twice here. `global.ts` creates
the whole directory tree on every start including `opencode --version`, and the database
mtime read 2026-07-24 while the newest session message was 2026-03-31 - a four-month false
positive. Detection must be an indexed query, measured at 0.02 ms.

### 3. cursor - riskiest, build last, and build something smaller than an adapter

Cursor is the only one of the three that cannot answer the question the CLI exists to answer.
No tokens, no cost, no price table, and the model ids on disk are what the user *selected*,
not what responded. 25% of them match `PRICES` and the rest are re-ordered
(`claude-4.6-opus-high`), Cursor-proprietary (`composer-*`), third-vendor (`grok-4.5`), or
the literal string `default`.

It is also the least stable. The message store changed **during the observation window**:
`bubbleId:` records stop at 2026-07-23 and are replaced by content-addressed
`agentKv:blob:<sha256>` values that dropped both `tokenCount` and `modelInfo`. A
schema-coupled reader breaks on a Cursor update.

What it *can* report honestly, all measured: sessions in window (22 here), last activity,
models selected, built-in tool names, MCP servers configured, and subagent use.

**Target the JSONL transcript tree**, `~/.cursor/projects/*/agent-transcripts/*/*.jsonl`.
All 264 transcript ids on this machine are also `composerHeaders.composerId` rows, so the IDE
and the `cursor-agent` CLI write the same format to the same tree and **one adapter covers
both surfaces**. That route needs no SQLite, no native dependency, and keeps
`cursorAuth/accessToken` out of reach. The walk must be pruned to `*/agent-transcripts/`:
`~/.cursor/projects` holds 7,152 files and 7,042 of them are MCP caches under `mcps/`, which
is the difference between 2 ms and 29 ms. `shared/recency.ts` recurses whatever it is given,
so it needs a prune predicate or roots handed to it one level deeper.

**There is one forward-only path to real Cursor tokens.** The `cursor-agent` bundle receives
`inputTokens`, `outputTokens`, `cacheReadTokens` and `cacheWriteTokens` from a `turnEnded`
message and forwards them to the `afterAgentResponse` and `stop` hooks alongside `model` and
`generation_id`. Cursor's public hook docs do not document those fields. Using them means
installing a hook that writes our own sidecar log. That is a different product decision from
"read what is already there", it depends on an undocumented field, and on install day it
yields nothing for the user's past 30 days. It is not a scan adapter.

## Open decisions this report cannot make

These need the owner. Each one changes what gets built.

1. **Does a tokenless harness ship at all?** The map locked "tokens and sessions, no dollars"
   for the subscription case. Cursor delivers sessions with no tokens. A cursor row on a
   stack would say "this person uses Cursor" and carry no measurement. That may still be
   worth it, because Cursor ties for third on demand with 13 stacks listing it, and because
   *positive claims only* means silence about Cursor today reads as absence. It is a
   judgement about what a harness row is for.
2. **The wire change for a per-model price-table id.** Seam change B is a wire bump. The map
   already ships a CLI release, so this is the moment it is cheapest. The alternative is to
   let opencode publish a single vendor's table id across mixed rows, which is a false
   citation.
3. **Whether the hook route for Cursor tokens is worth opening later.** It is the only way
   Cursor ever reports tokens. It is also an undocumented field and a forward-only install.

## Standing constraints, checked

**Raw data never leaves the machine.** All three harnesses are more hazardous than Codex,
because in each case the sensitive content sits in the same file the scanner must open.

- **pi-mono** has no separate history file. Raw prompts, `bashExecution` command and output,
  absolute cwd paths, inline base64 images, and raw provider `errorMessage` bodies all sit in
  the lines the scanner parses. Stream line by line, never whole-file read, and never open
  `auth.json`.
- **opencode**'s database also holds `account.refresh_token`, `credential.value`,
  `session_input.prompt`, and full file contents in `session.summary_diffs` and
  `part.data.state.output`. Verified: one `session_diff` file on this machine holds the
  complete source of `convex/admin.ts`. The adapter must select named columns only and never
  `SELECT *`.
- **cursor**'s transcripts carry raw prompt text and `tool_use.input` with absolute paths and
  full shell commands. Read `tool_use.name` only. The project directory names *are* the
  user's absolute paths with separators replaced by dashes, so the directory names themselves
  leak the user's repo paths. `ItemTable` holds `cursorAuth/accessToken`, which is an independent
  argument for the JSONL route.

**Positive claims only ([#40](https://github.com/alp82/aistack/issues/40)).** Three new
harnesses **widen** this problem rather than close it, exactly as the map predicted. Each one
must be silent, never zero, about what it cannot report:

- pi-mono has no MCP, no subagents and no skill tool, by explicit vendor design. Those payload
  slots must be **absent**, not empty.
- opencode records `cost` as `0` on every one of 925 assistant records, and its denormalized
  `session.tokens_*` columns default to `0 NOT NULL`. A zero is not a measurement. Never read
  either as a fast path.
- cursor must omit the token block, the cost block and the price-table id entirely.

**Pricing-table coverage widens, as the map predicted.** Google and Gemini is the single
largest hole: `gemini-3-pro-preview` carries 20.5% of the tokens on this machine. Also absent
are the opencode-zen gateway models (`glm-4.7-free`, `kimi-k2.5-free`, `big-pickle`),
`github-copilot` as a re-serving provider, and `claude-opus-4-5`. None of these should be
filled with a scraped price. They surface as `unpricedTokens` and the covered share is
reported, which is machinery `shared/payload.ts` already has.

One rule falls out of all three harnesses at once: **the pricing key must be
`providerID` + `modelID`, not the model slug alone.** opencode proves it directly, with
`github-copilot` re-serving `gemini-3-pro-preview` under the vendor's own name at a different
real price. pi-mono proves it again through OpenRouter, where `anthropic/claude-opus-4.6` is
billed by the router and must not be priced at Anthropic list rates.
