# Cursor local storage: repository investigation

Researched 2026-09-10. This supplements the Cursor harness gap research. Scope: historical local storage, exporters, conversation analytics, and implementations that turn local Cursor data into usage statistics. No owner's Cursor data was inspected and no downloaded program was executed. Public repositories were cloned into an isolated temporary directory for source inspection.

## Finding

A retrospective local Cursor adapter is technically credible. Several independent implementations read historical Composer conversations, associate them with workspaces, and recover messages and structured tool activity. Current implementations also cover Agent transcripts, CLI session databases, and ACP session databases. Describing reverse engineering as a reason to exclude historical integration is too strong. The actual gap is maintaining readers for several evolving private formats and distinguishing directly stored observations from inference.

Exact, comprehensive historical token accounting remains unproven. Some repositories advertise token or cost dashboards while using context snapshots, text length, invented context replay, or even fixed activity pulses. A parser accepting a token field does not establish that Cursor populates it reliably or that it has billable request semantics. This distinction is supported by the concrete implementations below.

## Search coverage and selected repositories

Breadth-first discovery used GitHub repository searches for `cursor history`, `cursor exporter`, and `cursor chat export`, plus web searches combining Cursor, `state.vscdb`, `composerData`, `bubbleId`, token usage, and exporter. Candidate families included dedicated exporters, migration/recovery tools, and multi-harness analytics. Search results were used for discovery; claims below rely on repository source or first-hand issue reports.

| Repository | Inspected revision | What it establishes |
| --- | --- | --- |
| [S2thend/cursor-history](https://github.com/S2thend/cursor-history/tree/c7f88062275b14078ffb26710bd9be281110d5e6) | `c7f8806`, 2026-09-09 | Most substantial inspected local reader: Composer, Store/CLI, ACP, transcripts, source resolution, identities, workspace scoping, explicit partial results. |
| [Callum-Ward/cursaves](https://github.com/Callum-Ward/cursaves/tree/2919739d35a043f1f35979a758f87d4c936a42b7) | `2919739`, 2026-05-15 | Independent exporter/importer handling split bubble storage and extensive workspace-associated data. |
| [mmssss/cursor-chat-export](https://github.com/mmssss/cursor-chat-export/tree/42a7c341489fa89d11d4fae30e9b4e24f68c3799) | `42a7c34`, 2026-02-27 | Small readable implementation of historical text export; intentionally filters empty-text bubbles. |
| [ibrahim317/cursor-chat-transfer](https://github.com/ibrahim317/cursor-chat-transfer/tree/79841061a670b63dd2a8eb25725337d704ccd98e) | `7984106`, 2026-06-20 | Global composer header discovery, private schema inventory and workspace links. |
| [p2o51/session-exporter](https://github.com/p2o51/session-exporter/tree/0a3a2ed62542830aaa0f1cf36342ef8db14c9970) | `0a3a2ed`, 2026-07-20 | Multi-harness app with an explicit Cursor context-snapshot basis, despite broader token-accounting presentation. |
| [SuvenSeo/ai-coding-usage-tracker](https://github.com/SuvenSeo/ai-coding-usage-tracker/tree/6eda1a887a210220cfc584d6253408829023e5b3) | `6eda1a8`, 2026-06-21 | Broad local source coverage, but crucial usage fields are heuristic; see detailed audit. |
| [pcloudata/projectbar](https://github.com/pcloudata/projectbar/tree/bff7e078f90e8b7669b69ff263491e3577a67ff6) | `bff7e07`, 2026-07-19 | Project attribution from transcripts/hooks with estimates, including a fixed tokenless-hook pulse. |

Additional discovered candidates, not equivalently code-audited in this lane: [mikhailsal/cursor-chronicle](https://github.com/mikhailsal/cursor-chronicle), [anasabbasdev/cursor-chat-bulk-export](https://github.com/anasabbasdev/cursor-chat-bulk-export), [ay-bh/chat-history](https://github.com/ay-bh/chat-history), [0merUfuk/skuggsja](https://github.com/0merUfuk/skuggsja), [SaoirseYang/CursorHistory](https://github.com/SaoirseYang/CursorHistory), [vitalyis/cursor-chat-recovery-kit](https://github.com/vitalyis/cursor-chat-recovery-kit), [egorvinogradov/cursor-history-import](https://github.com/egorvinogradov/cursor-history-import), and [binarycache/cursor-chat-export](https://github.com/binarycache/cursor-chat-export). Their discovery expands the ecosystem inventory; it is not independent verification of each claim.

## Recoverable historical structure

The following are implemented observations, not an official Cursor schema guarantee.

| Source | Recoverable fields and joins | Limits |
| --- | --- | --- |
| Global/workspace `state.vscdb` | Global `ItemTable` composer headers, `cursorDiskKV` composer data, ordered `fullConversationHeadersOnly`, `bubbleId:<composerId>:<bubbleId>` records. Workspace identifiers and URIs associate composers with projects. | Earlier inline conversations, workspace summaries, and later global headers require different discovery paths. |
| Composer bubbles | User/assistant content, native bubble IDs, model information, tool data, direct timestamps or timing information when present. | Empty text does not imply no activity. Token fields are optional and often absent. |
| `~/.cursor/projects/**/agent-transcripts/**/*.jsonl` | Conversation text and structured tool-use blocks. | May omit tool results, model, token usage, and message timestamps. A readable conversation is insufficient for every workflow metric. |
| `~/.cursor/chats/**/store.db` | Active conversation tree, message leaves, tool calls and matching tool results. | The inspected reader does not extract per-message timestamps or token counts from this layer. |
| `~/.cursor/acp-sessions/**/store.db` | Same Store-reader family under an additional discovery root. | Coverage follows supported Store variants, not a vendor compatibility promise. |

Sources: [cursor-history source inventory](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/README.md#where-cursor-stores-data), [Composer reader and workspace matching](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/storage.ts), [Store tree and tool-result reader](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/store-stack/store-db.ts), [transcript reader](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/store-stack/transcript.ts), [independent global header lookup](https://github.com/ibrahim317/cursor-chat-transfer/blob/79841061a670b63dd2a8eb25725337d704ccd98e/lib/db.js#L409).

The Store reader walks the active root and indexes reachable tool results by tool-call ID. Unmatched results make the parse partial instead of being attached speculatively. This is substantially stronger than scanning every blob in the database. It also shows that structured historical tool activity can exist beyond Markdown text. [Store reader](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/store-stack/store-db.ts#L458)

Simple exporters understate the available data: `mmssss/cursor-chat-export` rejects bubbles with no non-whitespace text, so its output omits tool-only records even when the underlying database retains them. Its model extraction reads `modelInfo.modelName`. [Extraction code](https://github.com/mmssss/cursor-chat-export/blob/42a7c341489fa89d11d4fae30e9b4e24f68c3799/src/cursor_chat_export/extract.py#L60)

## Token-statistics claims audited

### cursor-history: supported fields versus observed population

`extractTokenUsage` tries `tokenCount.inputTokens/outputTokens`, then `usage.input_tokens/output_tokens`, then treats `contextWindowStatusAtCreation.tokensUsed` as an input estimate. These paths are not semantically equivalent. Its unit tests construct token-bearing objects; they verify parsing, not actual field prevalence. [Extractor](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/storage.ts#L6932), [unit tests](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/tests/unit/storage.test.ts#L5093)

A particularly useful first-hand report from the maintainer examined 4,592 bubbles: only five had nonzero `tokenCount`, and none had snake-case `usage`. The issue proposes optional tokenization with explicit estimate labeling. This is evidence from one reported store, not a population-wide coverage measurement or a claim about every current Cursor release. [Token estimation issue](https://github.com/S2thend/cursor-history/issues/14)

### session-exporter: snapshot, not accumulated request usage

Its Cursor parser maps `promptTokenBreakdown.totalUsedTokens` into input and total tokens, labels the basis `context-snapshot`, leaves cache hit rate unavailable, and gets the project from `workspaceIdentifier.uri.fsPath`. A real project association therefore exists, but the reported number does not establish accumulated session usage or billable spend. It chooses a session model from `modelConfig`, which cannot establish the model of every historical request in a mixed-model conversation. [Cursor parser](https://github.com/p2o51/session-exporter/blob/0a3a2ed62542830aaa0f1cf36342ef8db14c9970/parsers/cursor.py#L182)

### ai-coding-usage-tracker: estimates across several local sources

The implementation estimates text tokens and synthesizes context replay/cache reads. Even its `bubble_explicit` path adds accumulated context to token counts; that label must not be read as exact provider-reported consumption. It selects the most frequent observed model per thread, defaulting to `cursor-auto`. [Estimation function](https://github.com/SuvenSeo/ai-coding-usage-tracker/blob/6eda1a887a210220cfc584d6253408829023e5b3/codex_app_tracker.py#L809), [bubble aggregation](https://github.com/SuvenSeo/ai-coding-usage-tracker/blob/6eda1a887a210220cfc584d6253408829023e5b3/codex_app_tracker.py#L1230)

The `agentKv:blob:%` reader sorts by key, parses text, estimates replay, and assigns every event the current scan time. It emits one synthetic conversation, empty workspace, and `cursor-auto`. This is not proof of recoverable historical daily model usage from agentKv. Separately, `ai-code-tracking.db` yields conversation/request IDs, timestamps, source, file extension/name, and model from `ai_code_hashes`. That is a valuable attribution lead, but the query contains no token columns. [agentKv reader](https://github.com/SuvenSeo/ai-coding-usage-tracker/blob/6eda1a887a210220cfc584d6253408829023e5b3/codex_app_tracker.py#L1307), [tracking database query](https://github.com/SuvenSeo/ai-coding-usage-tracker/blob/6eda1a887a210220cfc584d6253408829023e5b3/codex_app_tracker.py#L1383)

### projectbar: genuine attribution with synthetic quantities

Hook attribution uses the first workspace root or cwd, but a hook without token fields becomes an estimated 1,000-token pulse. The test with `total_tokens:4200` is an authored payload, not evidence that real Cursor hooks supply that field. Historical backfill sums raw JSONL UTF-8 byte counts and passes the count to a roughly four-characters-per-token estimator when no token fields are found. It can fall back to file modification time. These figures should not enter AI Stack's measured token totals. [Hook code](https://github.com/pcloudata/projectbar/blob/bff7e078f90e8b7669b69ff263491e3577a67ff6/Sources/ProjectBarCore/HookIngestor.swift#L69), [backfill code](https://github.com/pcloudata/projectbar/blob/bff7e078f90e8b7669b69ff263491e3577a67ff6/Sources/ProjectBarCore/BackfillScanner.swift#L79), [estimator](https://github.com/pcloudata/projectbar/blob/bff7e078f90e8b7669b69ff263491e3577a67ff6/Sources/ProjectBarCore/CostCalculator.swift), [synthetic hook test](https://github.com/pcloudata/projectbar/blob/bff7e078f90e8b7669b69ff263491e3577a67ff6/Tests/ProjectBarCoreTests/BackfillScannerTests.swift#L54)

## Concrete compatibility and duplication risks

These are documented engineering problems with examples, not a blanket reason to reject the integration:

- A Cursor 3.0.13 user reported recent conversations missing from discovery; another reported the same with 3.1 prerelease. The issue is closed and the maintainer later requested retesting the newer reader. This establishes an actual discovery regression, without independently verifying the fix on those private stores. [Missing sessions](https://github.com/S2thend/cursor-history/issues/29)
- Older bubbles lacked direct timestamps. The maintainer identified assistant `timingInfo.clientRpcSendTime` as a recoverable source, while some user messages required interpolation. The issue includes a subsequent test report. Preserve stored versus inferred time; interpolation cannot support precise pause/response-time measurements. [Timestamp investigation](https://github.com/S2thend/cursor-history/issues/13)
- Composer and Store may represent the same native conversation. Newly recovered Store turns can appear in the middle of an existing session. Array-index identities and timestamp-watermark appends can duplicate or drop them. Current reader rules preserve Composer identity, assign deterministic Store identities, expose partialness, and describe whole-session replacement. [Compatibility issue](https://github.com/S2thend/cursor-history/issues/36), [shipped compatibility contract](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/docs/compatibility.md)
- Store databases and transcripts are parallel representations, so summing both is invalid. Current merging reconciles same-UUID sources and explicit active branches. Divergent replicas are ambiguous instead of silently unioned. This does not prove that inherited content across different forked conversation UUIDs represents new work; that remains a separate validation question for usage/workflow accounting. [Merge implementation](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/store-stack/merge.ts)

## Additional independent CLI/transcript implementation

[jazzyalex/agent-sessions at `6f9b6c7`](https://github.com/jazzyalex/agent-sessions/tree/6f9b6c72d0512bb01881f0b66120816db9e89f2f) provides an additional concrete lineage lead. Its Cursor transcript reader handles tool-use, tool-result and thinking blocks while leaving event timestamps and model unset. It extracts a parent session UUID from `agent-transcripts/<parentUUID>/subagents/<uuid>.jsonl`. This is an implemented structural parent association, stronger than a name-prefix guess, but still requires fixtures to establish current-version prevalence. [Parser and parent detection](https://github.com/jazzyalex/agent-sessions/blob/6f9b6c72d0512bb01881f0b66120816db9e89f2f/AgentSessions/Services/CursorSessionParser.swift#L360)

Its separate metadata reader decodes hex JSON at `store.db` table `meta`, key `0`, including session ID, creation time, name and `lastUsedModel`. It resolves the workspace-directory hash by matching MD5 against already-known project paths. This offers session-level enrichment, not per-response model/timestamp recovery or reversal of arbitrary workspace hashes. [Metadata reader](https://github.com/jazzyalex/agent-sessions/blob/6f9b6c72d0512bb01881f0b66120816db9e89f2f/AgentSessions/Cursor/CursorChatMetaReader.swift)

Further late-discovery candidates for the inventory: [Dicklesworthstone/coding_agent_session_search](https://github.com/Dicklesworthstone/coding_agent_session_search) has a Cursor connector and workspace-header fixtures; [0xSero/ai-data-extraction](https://github.com/0xSero/ai-data-extraction), [braincompany/sessiongrep](https://github.com/braincompany/sessiongrep), and [jbdamask/cursor-db-mcp](https://github.com/jbdamask/cursor-db-mcp) remain leads rather than audited usage sources in this report.

## Workflow-family evidence and remaining tests

| Workflow family | Concrete retained-data evidence | What is not established |
| --- | --- | --- |
| Session timing and pauses | Composer `createdAt` and older assistant `timingInfo.clientRpcSendTime` have first-hand populated-store reports. The reader computes duration from `clientEndTime - clientStartTime` when both exist. | Duration-field prevalence is unmeasured. Inferred user times and Store-only missing times cannot support precise pause/latency histograms. |
| Tools and MCP | Composer readers preserve structured tools; Store reader matches result IDs to active-tree calls. Transcript reader accepts named `tool_use` blocks. | Tool activity does not itself establish reliable MCP server identity, configured-versus-used distinctions, tool duration, or comparable denominator coverage. |
| Subagents | Cursaves documents separate composers with IDs resembling `task-toolu_...`. Agent-sessions additionally extracts parent UUID from the transcript subagents directory structure. | Population of that layout across versions, inherited-history treatment, child start/end timing, and agent lifetime remain unverified. |
| Models | Independent exporters read bubble `modelInfo.modelName`; some analytics choose the session model or most common model instead. | Session settings and majority models cannot substitute for each actual response's model. Auto-routing needs separate verification. |
| Context and compaction | Context-window snapshots and `promptDryRunInfo` client estimates are implemented read paths. | A change in snapshot size is not a native compaction event. No reliable compaction-event stream was established by this lane. |
| Reasoning | Composer reader extracts `thinking.text`; cursaves documents `allThinkingBlocks`. | Retained reasoning text does not establish reasoning token counts or an effort setting. Field population and format coverage remain unmeasured here. |
| Effort | No independently validated native effort field or historical effort extraction was found in this inspected set. | Do not infer effort from model name, reasoning text, latency, or response length. |

Sources: [timing/model extraction](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/storage.ts#L6995), [thinking extraction](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/storage.ts#L6687), [context and dry-run estimate fallbacks](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/storage.ts#L6963), [subagent and bubble observations](https://github.com/Callum-Ward/cursaves/blob/2919739d35a043f1f35979a758f87d4c936a42b7/docs/how-cursor-stores-chats.md#L288), and the Store/transcript sources cited above. Code accepting a field is weaker evidence than a populated captured fixture; maintainer reports are evidence of their observed installations, not a general coverage guarantee.

## Consequences for AI Stack

The evidence supports a compatibility-tested historical workflow reader as a real candidate, with separate capability flags for messages, tools, stored timestamps, workspace attribution, models, and usage. It does not support either a blanket history prohibition or unconditional parity with existing measured harnesses.

Before implementation, obtain sanitized, version-identified fixtures with known actions and dashboard comparisons. Confirm request-level token semantics and prevalence, model switching, cache tiers, regeneration and forks, compaction, deleted/recovered sessions, parallel Composer/Store copies, and midnight-spanning sessions. Use fixture provenance to distinguish real extracted structures from synthetic parser tests. Missing information must remain unavailable rather than becoming zero, current time, a guessed model, or a text-length usage total.

A retained SQLite reader also needs snapshot/WAL consistency, bounded reads, platform discovery, and explicit unsupported-format reporting. Cursor-history offers substantial prior art, but its public compatibility fixtures are expressly synthetic. Its breadth and tests demonstrate an implementable approach; they do not replace validation against sanitized current Cursor stores. [Fixture provenance](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/tests/compatibility/fixtures/v016/fixture-manifest.json), [reader compatibility contract](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/docs/compatibility.md)
