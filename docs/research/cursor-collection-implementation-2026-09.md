# Cursor collection implementation

Implements [Implement Cursor usage collection and historical sync](https://github.com/alp82/aistack/issues/389) under the [accepted acquisition and accounting contract](https://github.com/alp82/aistack/issues/388#issuecomment-5617625795).

## Acquisition and accounting

The normal `cursor` harness adapter is registered alongside the existing adapters. Discovery reads retained source timestamps, including previously cached evidence, so an unreadable or temporarily missing source reaches the shared incomplete-scan gate. File modification times never date usage. `CURSOR_DATA_PATH` names the reader's workspaceStorage root; `CURSOR_STORE_ROOT` retains the reader's Store override. Default IDE paths cover Linux/XDG, macOS Application Support and Windows APPDATA. The reader naturally reconciles Composer, transcripts and retained CLI/ACP Store representations by native conversation.

`cursor-history` is pinned to npm release 0.18.0 and remains an external runtime dependency in the published CLI. The adapter explicitly selects its built-in `node:sqlite` driver. The workspace disables build scripts for its transitive `better-sqlite3` dependency; synthetic Composer and overlapping-transcript reads pass without that native binary. Hydrated session resolution is authoritative: a summary can be partial before loading a complete resolved session. Unreadable, malformed, ambiguous, limited or corrupt sources withhold measured-day replacement.

A narrow supplemental read retrieves Composer token fields by native bubble ID, plus the old inline representation. This avoids the reader's flattened `tokenUsage`, which cannot distinguish reported zero from absent output or a context estimate. The supplemental read uses a read-only SQLite transaction. A changing global database/WAL stamp invalidates the scan rather than combining inconsistent source versions.

Each assistant contribution prefers its own recorded input/output fields. Missing input can use its preceding user message's recorded/context/dry-run count, then `ceil(userText.length / 4)`, consumed once. Missing output independently uses `ceil(assistantText.length / 4)`. Explicit zero remains zero. The normalized local cache retains bucket provenance. No billed-cents inference, system/tool-content invention, reasoning split or per-call Context distribution is introduced. Native copied response prefixes count once within the installation.

Stored message timestamps are authoritative. Ordered untimed records interpolate evenly between stored message/session anchors; a single anchor dates them without inventing duration. Matched usage events can supply anchors to otherwise undated history. Without anchors, models and installation inventory remain available but no dated token contribution is invented.

Personal dashboard JSON uses the qualified `get-filtered-usage-events` endpoint, fixed 30-day UTC query windows, page size 100 and a maximum of 100 pages per window. A page failure, changed total, malformed bucket, repeated page or cap rejects that window. Native event IDs deduplicate; identical-looking ID-less events retain their multiplicity. Only native conversation IDs found in local history are included. Explicit cloud events and background-composer IDs are excluded. Billing-only events do not replace supported local counts. API totals supersede local tokens for the same conversation and UTC date while preserving the local source for workflow projection. API model labels, including Auto, remain their own attribution.

The installation cache stores normalized contributions, account hashes and complete query windows, never credentials or transcript text. Writes use a private temporary file and atomic rename. A successful complete window replaces its prior contents. A now-empty historical window retains previously complete evidence because remote retention can expire. Failed requests retain previous complete windows. A five-minute refresh interval avoids duplicate snapshot/history fetches in one sync. Account changes reset enrichment; a missing login can use the last account's complete local cache. Corrupt caches, disappearing local contributions or partial local reads withhold the machine's measured-day block. Cache repair must preserve this gate; deleting a corrupt cache is not automatically proof that replacing existing server days is safe.

Usage goes through the existing aggregate, shared pricing, name filtering, consent, per-day builder, fingerprint and manifest. Cursor participates in the existing acknowledged session-date hints, with a separate scope from Grok, so corrections include former dates even when they become empty. All raw workspace paths remain local and pass through the existing opaque project-ID seam.

## Authentication and native limitations

Automatic enrichment reads only `ItemTable` key `cursorAuth/accessToken` in the installation's global SQLite store. The JWT subject derives the dashboard cookie in memory and scopes cached enrichment by a hash. No API key, browser-cookie import, reconnect screen or new interactive authentication exists.

The adapter never invokes macOS Keychain, Windows credential UI or a secret-service helper. The qualified Keychain command cannot guarantee it will not prompt, so a Keychain-only installation uses local history and any complete prior cache. Linux, macOS and Windows installations with a usable SQLite login can attempt the same transport. Cursor owns login renewal; later scans re-read the token. Native authenticated success, actual field population/retention, OS credential-storage availability and real account join coverage remain UNRUN. This implementation and its smoke scripts accessed no owner's credentials, private history or paid sessions.

## Checks performed

- Frozen dependency installation, CLI TypeScript check and production CLI build pass.
- The representative qualification fixtures are copied into `packages/cli/src/harness/cursor/fixtures`. They remain wholly synthetic. Native SQLite tests exercise the installed reader, not a reader mock.
- Cursor tests cover local-only readings, missing/explicit-zero fields, text estimates, context provenance, API precedence, unmatched/cloud IDs, equal timestamps across conversations, ID-less multiplicity, native-prefix deduplication, repeated refresh, account changes, later-page failure, missing login, UTC interpolation/correction, malformed cache/database, disappeared sources and local-only project privacy/consent.
- Shared harness, staging, usage and workflow-rule regression tests pass. The added staging case checks former-date rebuilding and complete withholding of machine days on an incomplete Cursor scan.
- `node scripts/verify-cursor-package.mjs` passes on Node 24.15.0. `pnpm dlx node@22.13.0 scripts/verify-cursor-package.mjs` passes on the CLI's supported minimum. These invoke the actual production bundle's read-only MCP preview with synthetic SQLite, a child-only `os.homedir()` loader and blocked network. They do not invoke interactive sync or publish.
- No production data, deployment or publication was performed.

## Handoff

`packages/cli/src/harness/cursor/local.ts` exports `readLocal`, returning `LocalRead.sessions: LocalSession[]`, hydrated reader sessions and token evidence. `evidence.ts` exports `messageTimes`, `localContributions` and `reconcile`. `scan.ts` owns aggregation and the Cursor reducer slot. Workflow projection belongs to the dependent workflow ticket: use the retained sessions and interpolated dates while keeping unsupported timing/Context absent. The reader's public session shape does not expose a structural parent-session field; resolve only demonstrated local structural references rather than inventing a parent.

Automatic stop hooks, hook-sidecar enrichment, catalog/consumer polish, owner native smoke checks and release are the remaining map tickets. This collection change does not install any hook and does not claim those tasks complete.
