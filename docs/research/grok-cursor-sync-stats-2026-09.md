# Grok and Cursor support for sync and stats

Research date: 2026-09-08. Scope: feasible data sources, integration work, and limits. No adapter, hook, account connection, or publication was installed or run.

Method: current first-party documentation and source code, current AI Stack code, and the explicitly dated Cursor investigation already in this repository. Historical observations below were not reproduced on a current client. API shapes were read without credentials; no account API was called. Recommendations are engineering conclusions, not vendor promises.

## Decision

Support should distinguish the product that records work from the model that produces tokens. Grok Build, Grok consumer chat, xAI API usage, and Grok models inside another harness have different evidence. Cursor similarly has local IDE/CLI activity, personal billing exports, and Enterprise telemetry.

Recommended order:

1. Fix xAI provider identity and price lookup for Grok usage already recorded by OpenCode and Pi.
2. Add a native Grok Build adapter after validating retained local session records against source and a sanitized fixture.
3. Give Cursor a limited local adapter and an optional forward collector. Treat exact token reporting as a separate capability with explicit evidence requirements.
4. Offer account imports separately: personal Cursor CSV first, Enterprise API/OTel and xAI management API only when needed. They require an account-level provenance and deduplication design.
5. Keep Grok consumer exports exploratory. There is no verified public token-statistics contract for them in the sources reviewed.

The sections below establish the evidence and boundaries behind this order.

## Current repository integration

`HARNESS_ADAPTERS` contains Claude Code, Codex, OpenCode, and Pi. Cursor appears in the scanner's rules-file detection, which does not make it a measured usage adapter. There is no `stats` CLI command today. Here, stats means the measured statistics produced by sync and shown in the app. A registered adapter must feed staging and persisted readings to reach those statistics. Sources: [registry](../../packages/cli/src/harness/index.ts), [scanner](../../packages/cli/src/scanner.ts), [sync staging](../../packages/cli/src/sync/stage.ts), [measured backend](../../convex/measured.ts), [sync](../../packages/cli/src/commands/sync.ts).

OpenCode and Pi retain provider-qualified model accounting. Grok responses with real usage in those stores can already contribute tokens through their existing parsers. However, `Vendor` and `PROVIDER_VENDOR` in the shared price lookup omit xAI, while the catalog import allowlist includes `xai`. `vendorOfProvider` in the backend catalog also omits xAI. A native `xai:grok-...` row therefore needs provider identity support before bare vendor prices can resolve consistently. A catalog entry or a detected model name alone establishes no measured usage. Sources: [OpenCode analyzer](../../packages/cli/src/harness/opencode/analyzer.ts), [Pi analyzer](../../packages/cli/src/harness/pi/analyzer.ts), [pricing table](../../packages/pricing/src/table.ts), [model import](../../convex/lib/modelImport.ts), [backend model catalog](../../convex/lib/modelCatalog.ts).

This is a code finding, not a claim that current production has a particular Grok price row. No database inspection was needed or performed. Implementation should synchronize prod data before checking actual catalog rows, following [AGENTS.md](../../AGENTS.md).

## Cursor

### Existing local history: useful activity, unreliable tokens

The [2026-08-09 local investigation](harness-adapters-2026-08.md#cursor) inspected Cursor's own on-disk data and its shipped CLI bundle. It found shared IDE/CLI transcripts under `~/.cursor/projects/*/agent-transcripts/`, with content and tool calls but no usable token/model/timestamp combination. Most SQLite token counters were zero; newer storage had changed schema. A context-window gauge was present but was not cumulative consumption. This is historical empirical evidence from one installation, not a permanent format specification.

A read-only local adapter is feasible for detected activity and carefully delimited inventory. Historical per-day workflow claims need actual event timestamps. File mtime can locate candidate files but cannot place every event in the day the file was last modified. Selected model names also cannot prove which model served an Auto-routed response. Do not assign absent tokens a zero or infer spend from the subscription price. Re-check a current sanitized sample before committing to a path or schema.

Avoid the temptation to scan all Cursor databases: the prior investigation found auth material and source contents alongside tempting statistics. A pruned transcript walk is a much narrower input. The report's historical statement that hooks were the only token route is superseded by the documented account/export routes below.

### Official hooks: good prospective workflow evidence

Cursor documents user/project hooks for prompt, tool, subagent, session, response, and compaction events. Common inputs include conversation/generation IDs, selected model metadata, client version, workspace roots, and an optional transcript path. Tool hooks expose execution results and duration. `preCompact.context_tokens` describes the current context. Current `afterAgentResponse` and `stop` schemas still do not document billed token fields. Cloud hooks have coverage differences and can miss early read-only turns. [Hook reference](https://cursor.com/docs/hooks).

Recommendation: an opt-in command hook should write a minimal local sidecar of timestamps, IDs, counted events, and allowlisted numeric fields. Collection begins at installation. Never persist whole hook payloads: they can contain prompts, outputs, commands, email, and paths. Infer only metrics the captured events support; compaction-only context samples cannot represent every model call.

The earlier bundle inspection found undocumented `input_tokens`, `output_tokens`, `cache_read_tokens`, and `cache_write_tokens` fields on response/stop hooks. Its normalization subtracted both cache categories from inclusive input. Treat this as a version-specific lead requiring current fixtures, semantic tests, and deduplication across hooks, not a supported billing contract. [Historical source inspection](harness-adapters-2026-08.md#cursor).

### CLI structured output is another forward source

Cursor CLI documents `json` and `stream-json`. The final result carries session ID, elapsed time, optional request ID, and response text. The documented schema contains no token or cost fields. Streaming emits tool/message events; partial-output mode can repeat content through delta and flush records, and failures may end without a terminal result. A wrapper could record activity prospectively, but cannot promise token totals from this schema. It also misses interactive runs that bypass the wrapper. [Output format](https://cursor.com/docs/cli/reference/output-format).

### Personal plans: user-provided usage CSV

Cursor's official support states that individual plans have no public usage API/CLI command and points users to the dashboard's usage CSV export. This is a dated support answer from May 2026; the current API overview still does not offer an individual usage API. [Cursor support](https://forum.cursor.com/t/usage-api-cli-command/160967), [API overview](https://cursor.com/docs/api).

A user-provided CSV import is the most practical supported personal-account entry point. Before implementation, obtain a sanitized current export: the documentation reviewed does not provide a stable versioned CSV schema. Confirm timestamp timezone, input/cache semantics, actual model identity, included/free rows, and cost meaning. Do not turn a dashboard browser endpoint into a token-cookie integration.

CSV represents account usage across environments. Reimporting it from two machines must not create two contributions, and importing it alongside hooks must not count the same calls twice. Historical exports need overlap replacement and stable event identity, or an explicitly authoritative snapshot strategy. These are AI Stack design requirements.

### Enterprise Admin API: historical token and billing data

The current API overview lists Admin, Analytics, and AI Code Tracking APIs for Enterprise teams. Team administrators create keys; the overview documents Basic authentication and `admin:*` for Admin API access. Ordinary personal CLI/API credentials do not establish access to these endpoints. [API overview](https://cursor.com/docs/api).

`POST https://api.cursor.com/teams/filtered-usage-events` supports time filters, user filtering, pagination, and detailed usage. Examples include timestamp, model, conversation ID, token/cache counts, headless status, `tokenUsage.totalCents`, `chargedCents`, and `cursorTokenFee`; some rows lack `tokenUsage`. Cursor describes hourly aggregation and recommends polling at most hourly. Daily usage exposes activity counters; spend exposes billing-cycle totals. [Admin API](https://cursor.com/docs/account/teams/admin-api).

Use detailed usage for token/cost imports and daily counters only for their documented activity meaning. Keep provider token value, Cursor charges/fees, and subscription expenditure distinct. Missing cache TTL cannot support exact 5-minute versus 1-hour repricing. Do not reconstruct tool sequences, per-call context distributions, or precise session durations from hourly/account aggregates. Unknown or Auto model labels must remain unresolved. Pagination must complete before replacing a stored window; tokenless rows remain uncovered.

### Enterprise OpenTelemetry: strongest documented prospective route

Cursor can push server-side OTLP/HTTP protobuf to one team-controlled public HTTPS collector. Enterprise admins enable it. It has no historical backfill. Token/tool/cost metrics are delta sums; metrics have at-most-once delivery. Logs have at-least-once delivery and must be deduplicated. Cost metrics are best-effort estimates and BYOK values exclude provider spend. This requires hosted ingestion rather than a passive local file scanner. [OTel setup](https://cursor.com/docs/enterprise/opentelemetry-export).

`cursor.api.request` logs expose input/output/cache-read/cache-creation tokens with optional conversation and usage-event IDs. The wire distinguishes desktop, CLI, cloud agent, Bugbot, and Grok Bot. Model names describe requested public models and collapse routing labels such as Auto. Tool counts are metric-only with no conversation linkage. Corrections identify retrospectively unbilled usage; logs can arrive out of order. Retries recover transient log failures for about seven days, while metric failures are not replayed. [Wire reference](https://cursor.com/docs/enterprise/opentelemetry-export/wire).

Recommendation: use request logs for session token totals, account metrics for coverage checks, and corrections for billing only. Confirm whether input already includes cache before normalization. OTel is viable for Enterprise customers, but it cannot supply an individual user's missing local history or guarantee complete per-session workflow attribution.

## Grok

### Native Grok Build: best new local adapter candidate

Grok Build is a first-party coding-agent product and must be evaluated as its own harness. Its documented interface includes local CLI use; the published source is available for inspecting persistence rather than guessing from xAI inference APIs. [Build overview](https://docs.x.ai/build/overview), [first-party repository](https://github.com/xai-org/grok-build).

Source inspected at commit `75810042ca2762aa0b0fa17864f3f68823ccbea5`. No installed Build client or private session was used for validation.

The session guide documents automatic local persistence across TUI, headless, and agent-stdio use, under `$GROK_HOME/sessions` or `~/.grok/sessions`. It recommends `grok usage <session-id> [turn]` instead of reading files directly. The command prints JSON session totals and recorded turns; totals include history inherited by resume/fork. Session listing is scoped to the current directory, while search can combine local and remote results. Use known local IDs for initial validation. [Session guide](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-pager/docs/user-guide/17-sessions.md), [usage command](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-pager/src/usage_cmd.rs).

The persisted `usage.json` model contains `sessionId`, `updatedAt`, session summary, and `turns`. Turn rows expose `turnNumber`, `endedAt`, input/output/cache-read/cache-creation/reasoning/total tokens, model-call count, optional `costUsdTicks`, `costIsPartial`, `usageIsIncomplete`, primary model, and per-model usage. This is enough for a concrete token-stats adapter, subject to coverage and duplication rules. [Usage file schema](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/usage_file.rs#L10-L65).

Key limitations established by source:

- Input includes cached-read and cache-creation tokens; reasoning is within output. Normalize fresh input as input minus both cache categories, and keep reasoning informational. [Sampling types](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-sampling-types/src/conversation.rs#L724-L740).
- The persisted turn timestamp is assigned when usage is saved. A turn spanning midnight or a price change has no per-response allocation in this summary. Attribute it to completion with that limitation, or inspect richer events before claiming exact daily/per-period prices. [Persistence](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/persistence.rs#L2421-L2450).
- Forking copies the usage sidecar and restamps the child session ID. Summing session totals or every child turn duplicates inherited work. Retain lineage and exclude inherited prefixes. [Copy implementation](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/session/storage/jsonl/copy.rs#L384-L412).
- Live usage resets across a resumed process and includes folded subagent spend. Parent and child readings therefore need explicit reconciliation. The ledger records main-loop and child usage; its own comment excludes side calls such as compaction. These figures must not be advertised as the complete account bill. [Runtime extension](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-grok-shell/src/extensions/usage.rs), [usage ledger](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-chat-state/src/usage.rs).

Recommendation: begin by validating the documented `grok usage` output for local sessions. A bulk file reader can be considered after compatibility and performance measurements. Token stats do not require parsing raw conversation contents. Full workflow rows need separate verification of timestamped prompt/tool/subagent events, and the usage summary alone cannot supply per-call context histograms. Respect incomplete/partial flags, older sessions without usage, and custom-provider model identity. Native Build is substantially more promising for local token sync than Cursor's historical transcript store.

### Grok models used inside supported harnesses

For someone already using Grok through OpenCode or Pi, the harness's real response records are the shortest route to sync/stats. Keep the harness as OpenCode/Pi and model as the Grok model; inventing a second Grok harness would double count the same work. The required repository work is provider identity, catalog/pricing coverage, and fixtures proving that usage survives each adapter's parser. A gateway serving Grok needs its own provider rates; it must not silently inherit xAI's direct API rate. [OpenCode analyzer](../../packages/cli/src/harness/opencode/analyzer.ts), [Pi analyzer](../../packages/cli/src/harness/pi/analyzer.ts), [pricing table](../../packages/pricing/src/table.ts).

### Direct xAI inference: measurable when the caller retains responses

The Responses API returns response ID, model, creation time, `input_tokens`, cached-input detail, `output_tokens`, reasoning detail, and tool-use counts. Cache and reasoning are subsets, not additional whole token totals. The schema has no cache-write TTL categories. Stored responses are retained for 30 days; retrieval requires a known response ID. This is not a documented enumeration API for every historical call on an account. [Responses API](https://docs.x.ai/developers/rest-api-reference/inference/responses).

For AI Stack's disjoint buckets, cached input must be removed from inclusive input; reasoning must remain within output. A caller-side collector can retain only IDs, timestamps, model, usage, and provenance. Without retained IDs/records it cannot recover an arbitrary usage history from the inference endpoint.

xAI now documents exact billed `usage.cost_in_usd_ticks`, divided by `10^10` for USD. It includes discounts and server-side tool charges. The xAI SDK's streaming value is cumulative; use the final value once. Chat-completions streaming through REST/OpenAI requires usage in the final chunk. The Vercel xAI SDK currently does not expose this cost field. [Cost tracking](https://docs.x.ai/developers/cost-tracking).

This opens an actual-billed-cost capability, but the existing token-price citation must not mislabel a vendor receipt as a price-table estimate. Also, response usage does not reveal local edits, shell commands, session intent, or Git activity. Those need the harness event stream.

### xAI account usage: historical totals with different ownership

The Management API uses `https://management-api.x.ai` and a management key, separately from inference credentials. Creating that key requires the account's Management Keys permissions; a team administrator can grant them. No consumer subscription entitlement should be inferred from possession of an inference key. [Management API](https://docs.x.ai/developers/rest-api-reference/management).

`POST /v1/billing/teams/{team_id}/usage` accepts a time range, timezone, bucket size, aggregate fields, grouping, and filters. Its example sums `usd` grouped by description. Results include time-series points and `limitReached`, which means the result is incomplete. Time ranges use local-formatted date strings plus an IANA timezone; returned points use UTC. The public schema does not enumerate every valid measure/filter name or guarantee retention and freshness. [Billing reference](https://docs.x.ai/developers/rest-api-reference/management/billing).

Console Usage Explorer separately confirms token/cost views and grouping/filtering by API key and model. That supports the feasibility of account token reporting, but is not proof of undocumented JSON field names for the management endpoint. [Usage Explorer](https://docs.x.ai/console/usage).

Recommendation: start with documented spend queries and verify token dimensions with a permitted test account before promising token history. Choose an explicitly personal API-key scope or account import; shared team traffic cannot automatically become one owner's machine activity. Handle `limitReached` by partitioning queries and reporting incomplete coverage. Do not add account totals on top of Grok Build/OpenCode/Pi events that caused those same totals.

### Consumer Grok web, mobile, and X

The consumer FAQ documents conversation history and data download in Settings/Data Controls; Grok on X has a separate help surface. Private chats are absent from visible history. Neither the consumer FAQ nor the API references reviewed specifies a public consumer token-statistics API or a stable export schema with billed input/output/cache counts. [Consumer FAQ](https://x.ai/legal/faq), [Grok on X](https://help.x.com/en/using-x/about-grok).

A user-supplied export may support dated conversation/message activity after inspecting its schema. It is not evidence of exact inference tokens: visible text excludes hidden context, retries, tool payloads, and other billing inputs. Do not apply a tokenizer to exported chat text and label the result measured consumption. No reliable automatic consumer sync is established by this investigation.

Grok Bot also appears as a separate surface in Cursor's Enterprise telemetry. That does not establish access to consumer Grok history or native Grok Build records. [OTel wire](https://cursor.com/docs/enterprise/opentelemetry-export/wire).

## Implementation boundaries and acceptance evidence

These are proposed requirements for a follow-up implementation:

- **Preserve scope.** Machine-local daily folds and account-wide imports need distinct provenance. Current daily replacement is keyed by stack/machine/date; repeating a remote account import under two machine IDs would overcount. Keep an account source authoritative for its chosen scope or reconcile immutable request identities before aggregation.
- **Preserve partial coverage.** Empty, unavailable, and measured zero are different states. Session/inventory-only support must not fabricate a token block, a model share, or a price citation.
- **Normalize once.** Validate cache-inclusive versus disjoint input with provider examples and sanitized fixtures. Distinguish per-call records, streaming cumulative updates, and lifetime/session totals. Test retries, resumed sessions, overlapping imports, and midnight boundaries.
- **Separate costs.** Record whether dollars are vendor-billed, Cursor-charged, or reconstructed from a dated price table. Preserve covered-token share and the existing `publishCost` consent gate.
- **Respect collection consent.** Installing a hook is additional forward collection, not ordinary read-only scanning. Keep raw content local; publish only supported atoms after the existing CLI approval gate. `publishWorkflow` still governs workflow extraction/publication.
- **Share the adapter seam.** Verify that sync staging, persisted readings, and displayed statistics agree. Current `PayloadModel.tokens` and `activity.totalTokens` are required; session-only support needs an explicit contract change to represent missing tokens. Extend backend harness validation and tokenless payload handling where needed; registering a detector alone does not complete support.
- **Validate without live publication.** Use sanitized vendor fixtures and offline parser tests. The owner must perform any real TTY `sync` approval. No database writes or production changes are needed to evaluate parser feasibility.

Repository sources for these constraints: [harness types](../../packages/cli/src/harness/types.ts), [payload builder](../../packages/cli/src/harness/shared/payload.ts), [measured workflow and ownership rules](../../AGENTS.md), [shared pricing](../../packages/pricing/src/table.ts).
