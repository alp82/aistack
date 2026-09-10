# Minimal Cursor source qualification

Qualified 2026-09-10 for [Qualify the minimal Cursor usage and history sources](https://github.com/alp82/aistack/issues/387). This is acquisition evidence for [Decide Cursor attribution and estimation defaults](https://github.com/alp82/aistack/issues/388), not its accounting contract.

## Recommendation

Use personal dashboard JSON for reported usage and retained local history for conversation/workspace joins and workflow. Prefer the dashboard cookie transport as the best supported starting implementation; a user-supplied API key plus DashboardService RPC is a concrete alternative if the contract favors that connection flow. Select one transport initially. Both deliver the same useful event shape. Neither requires Enterprise onboarding.

Use `cursor-history`'s read-only library interface as the first local-reader candidate, wrapping `listSessionSummaries` / `getSession` and its resolution diagnostics. Its Composer, transcript, Store and ACP reconciliation covers ordinary IDE history and naturally includes retained CLI activity. A transcript-only reader is simpler but drops historical timing and workspace evidence available in Composer. Do not rebuild all storage generations before trying the library. Pin the chosen release and verify CLI bundling during implementation: the inspected package is MIT, version 0.18.0, and depends on native `better-sqlite3 >=12.10.0 <13` as well as jszip and commander. AI Stack currently has no runtime SQLite dependency. Source compatibility is established; package installation and binary portability have not been checked here.

The SDK's separate `index.db` / run-event store has no demonstrated ordinary IDE-history overlap in the completed SDK report. It does not simplify this acquisition path. No additional SDK probe is needed to proceed.

## Exact account reads and authentication

These are private interfaces implemented by the pinned primary sources below. All credentials described here are field names, never captured values.

| Transport | Exact request | Response and limits |
| --- | --- | --- |
| Dashboard JSON | POST `https://cursor.com/api/dashboard/get-filtered-usage-events`; `Content-Type: application/json`, `Origin: https://cursor.com`, cookie `WorkosCursorSessionToken`; body `{startDate, endDate, page, pageSize}` | `usageEventsDisplay`, optionally `totalUsageEventsCount`. Pages start at 1. Bounds are epoch milliseconds. Read a fixed window completely before replacing cached days. A client page cap is not evidence of server retention. |
| API-key alternative | POST `https://api2.cursor.sh/auth/exchange_user_api_key`, bearer user API key, JSON `{}`; read `accessToken`. Then POST `https://api2.cursor.sh/aiserver.v1.DashboardService/GetFilteredUsageEvents`, bearer access token, JSON content type and `Connect-Protocol-Version: 1` | Pulse sends the same page fields and stringified millisecond date bounds, increments until empty, caches access tokens by JWT expiry and retries exchange once after 401. Its mapper discards native conversation identity after hashing it, so consume raw responses rather than adopting that DTO. |

The dashboard reference accepts a supplied session token or obtains a Cursor access token from macOS Keychain / `ItemTable` key `cursorAuth/accessToken`, derives a user-id/token cookie, and URL-encodes `::`. This establishes auth mechanisms, not authorization to extract credentials. Connection UX and credential storage belong to the contract/lifecycle tickets. No credentials were read here. HTTP transports are platform-independent; automatic credential discovery is not.

Prefer omitting `teamId` for the initial personal request. The completed usage report records conflicting implementations and empty-result reports with forced `teamId: 0`. Do not interpret an auth error, malformed response, page cap or repeated-page loop as a complete empty account. Preserve the previous complete cache/day using existing `scanComplete: false` behavior. An account-wide count is not the number of locally attributable events.

CSV supplies date/model/token totals but the inspected format has no conversation identifier. It is a weaker fallback for this machine-owned integration, not a second source to sum. Do not add Admin APIs, CSV and RPC simultaneously.

## Local read paths

Let `User` be `%APPDATA%/Cursor/User` on Windows, `~/Library/Application Support/Cursor/User` on macOS, and `~/.config/Cursor/User` on Linux. These are the inspected reader's defaults, not a guarantee about every custom install. It accepts `CURSOR_DATA_PATH` / an explicit data path. Its Linux default does not consult `XDG_CONFIG_HOME`. WSL has separate Store preference logic and must not silently scan a mounted Windows installation as another machine's data.

| Retained source | Exact read / identity | Practical availability |
| --- | --- | --- |
| Composer | `User/globalStorage/state.vscdb`, `cursorDiskKV` keys `composerData:<conversationId>` and `bubbleId:<conversationId>:<bubbleId>`; headers also occur in `ItemTable`. `User/workspaceStorage/<id>/state.vscdb`, `ItemTable` key `composer.composerData`, plus sibling `workspace.json` | Header discovery varies by generation. Ordered `fullConversationHeadersOnly` references split bubbles; earlier conversations can be inline. Native composer ID joins usage. Workspace URI/path is stronger than an encoded directory label. |
| Transcripts | `~/.cursor/projects/<project>/agent-transcripts/**/*.jsonl`; basename without extension is conversation ID; `.../<parent>/subagents/<child>.jsonl` identifies a child | Records have `role` and `message.content[]`, including text and `tool_use` blocks. Reader retains tools even in empty-text messages. Model, per-message time, token buckets and tool results are not reliably available. Project-directory encoding is not reversible proof of a Git root. |
| CLI / ACP Store | `~/.cursor/chats/**/store.db`, `~/.cursor/acp-sessions/**/store.db` | The reader follows the active conversation tree and matches tool-result IDs rather than scanning every blob. Store/transcript and Composer can overlap under one UUID. Use resolution/completeness metadata; do not concatenate every copy. |

Use read-only connections and bounded coherent reads, including SQLite WAL state. A missing store is different from an unreadable discovered store. No local Cursor history was inspected in this session. Platform support above is source support, not an OS smoke-test result.

## Fields, semantics and useful workflow

| Evidence | Interpretation available to the contract |
| --- | --- |
| API `timestamp`, `conversationId`, optional `cloudAgentId`, `id` / `eventId` | Timestamp is an event time in epoch milliseconds (often a string). Conversation ID permits a session join, not a request-level identity or machine-origin proof. `bc-` IDs can represent background composers. No per-call granularity guarantee was established. |
| API `tokenUsage.inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens` | Consumers treat these as four disjoint buckets and sum them. Preserve presence separately from zero. Cache-write TTL and separate reasoning tokens are not established by this shape. Use the existing 5-minute fallback if the contract adopts existing TTL conventions. |
| API `model`, `kind`, `chargedCents`, `tokenUsage.totalCents` | Preserve model labels, including routing/Auto labels. Charged cents can be zero for included activity while metered cents are nonzero. Neither supplies a model price-table period. Use the shared catalog/pricer and ordinary coverage rules; do not turn cents into a guessed token bucket. |
| Composer `createdAt`; older `timingInfo.clientRpcSendTime`, `clientSettleTime`, `clientEndTime` | ISO time or epoch milliseconds, respectively. Reader marks stored versus inferred timestamps. `clientEndTime - clientStartTime` yields duration when valid. Timed messages support sessions, activity and pauses through existing reducers. |
| Composer `modelInfo.modelName`, `toolFormerData.name/params/rawArgs/result/status/additionalData`, `thinking.text` | Per-bubble model, tool calls/results, and retained thinking are readable. Map known tools through existing rules; raw arbitrary tool/MCP names still pass existing privacy filtering. Tool names alone do not prove an MCP server or native effort setting. |
| Workspace association and structural parent ID | Workspace can feed existing local Git extraction after local path validation. Child relationships can support agent/workflow rules where present. A copied conversation is still only best-effort local attribution. |
| Local token and context fields | `cursor-history.extractTokenUsage` combines direct `tokenCount` / `usage` with estimates from `contextWindowStatusAtCreation.tokensUsed` and `promptDryRunInfo`. Its public `tokenUsage` loses that distinction. Do not add this field to API totals or assume it is reported usage. |

A deterministic timing fallback can use neighboring stored timestamps or the joined usage session's event range; the contract must choose the formula for untimed turns. Visible text can support a documented token estimate where useful, but no coefficient or replay formula was established by this qualification. This remains a policy choice under the owner's existing preference for reasonable estimates. No new user-facing badges are needed.

Useful coverage includes session/message activity, mapped tools and searches, workspace-linked Git, and structural subagents when present. Precise tool latency, effort, native compaction events, reasoning-token counts and per-call Context distributions have no sufficient basis in this minimal route. Aggregated turn input and context snapshots do not establish each model call's context. Preserve normal absent-field conventions where a practical estimate has no basis.

## Safe fixtures and checks

[Fixture README](../../research/cursor-source-fixtures/README.md) describes a small authored corpus: reported-bucket-shaped usage, matching Composer/workspace rows, an overlapping transcript, unmatched events, absent fields and concurrent events sharing timestamp/model/conversation. Every value is synthetic; no donor capture or upstream private content was copied.

`python3 research/cursor-source-fixtures/check.py` validates source-shape relationships and constructs an in-memory SQLite database from the row fixture to exercise exact keyed reads. It checks two distinct ID-less events survive in the corpus and missing cache writes remain distinguishable from zero. It does not test an AI Stack Cursor adapter, perform an upstream-reader runtime test, or establish server field population.

Rechecked the upstream tokscale PR through GitHub: its author reports a live sync of 34 events across 18 sessions with matched per-session charged costs. That is an upstream live report, not a check performed here. The API-key route has source and mocked-test support; no authenticated live request was performed here. Native auth success, actual retention and local join coverage remain owner smoke checks for implementation/release readiness, not prerequisites to finish this source ticket.

## Contract handoff

The next ticket can now decide: one initial auth transport, unmatched/cloud and copied-session inclusion, local estimate formulas, timestamp fallback, model routing/pricing, and event/source deduplication. Retain legitimate identical-looking ID-less events; a timestamp/model/conversation hash alone collides. Re-fetch complete fixed windows rather than append immutable rows because usage fields can arrive late. Reconcile alternate local copies once per conversation and preserve complete prior days on partial acquisition. These questions already belong to the contract ticket; no new map ticket is needed.

## Pinned primary sources inspected

- [Dashboard fetch, authentication and transcript join](https://github.com/chocolatemale/cursor-usage/blob/a2f298f161f797036bf96718455e03ccdb42bef4/scripts/fetch_cursor_usage.py): request, `load_transcript_titles`, event grouping.
- [API-key exchange and personal RPC](https://github.com/cnwinds/cursor-pulse/blob/6017130f010fe5a000550cf87dbefdd3b5f0cb9a/pulse/integrations/cursor_api.py): exchange body/headers, pagination, mapper and expiry.
- [Local reader](https://github.com/S2thend/cursor-history/tree/c7f88062275b14078ffb26710bd9be281110d5e6): `src/core/storage.ts`, `src/core/store-stack/transcript.ts`, `src/lib/platform.ts`, `src/lib/index.ts`, `src/lib/types.ts`, `package.json`.
- [Upstream live JSON import report](https://github.com/junhoyeo/tokscale/pull/1247): authenticated fetch and cost comparison reported by its author.
- [Completed research and SDK report index](https://github.com/alp82/aistack/issues/381#issuecomment-5615569556): broader findings were consumed without repeating the survey. Retained research commit `940d82cf262a5c5815edb5c851cdfa8841136763`.

Existing AI Stack implementation inspected: `packages/cli/src/harness/types.ts` and `packages/cli/src/harness/grok/scan.ts`. No production data, deployment, dependency, or application behavior changed.
