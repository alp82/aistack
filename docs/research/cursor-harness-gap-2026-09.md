# Cursor harness integration gaps

Research date: 2026-09-10, extended after a breadth-first GitHub implementation survey. This revises [Compare existing harness evidence with Cursor integration surfaces](https://github.com/alp82/aistack/issues/381) and supersedes its initial resolution. Repository baseline: [`41e3405b`](https://github.com/alp82/aistack/tree/41e3405b3650f55d3c963bd11f021393258bd517).

## Clear statement

Historical Cursor integration is feasible enough to plan and validate. Existing implementations already fetch personal historical token usage, retain real conversation IDs, join those IDs to local transcripts, and read historical conversations, workspaces, and tool activity from several local stores. Enterprise telemetry and collection beginning at installation are optional paths, not prerequisites for all useful support.

The main difference from our existing harnesses is where the evidence lives. For ordinary Cursor IDE activity, the strongest researched usage source is account-side JSON; the strongest local workflow source is a compatibility-aware history reader. They need joining and completeness checks before AI Stack can publish machine-owned measured days. The existing aggregate, pricing, approval, and daily publication seams remain useful. This does not require assuming an entirely new backend architecture before testing a Cursor adapter.

The first report confused lack of a published IDE storage contract with lack of usable implementation evidence. It also missed personal dashboard APIs, session joins, SDK persistence, and released CLI token output. Its categorical conclusions about prospective-only personal support and unavailable historical tokens should be withdrawn.

## What the expanded search covered

Three parallel research agents investigated Cursor-specific usage tools, multi-harness trackers, and local history readers. The coordinator investigated SDK/CLI consumers, rechecked official documentation, and reviewed the strongest source claims. Searches fanned out across usage, tokens, statistics, analytics, exporters, history, `state.vscdb`, `composerData`, `conversationId`, and `stream-json` before selecting implementations for deeper inspection.

The evidence is retained in four companion reports, including discovery candidates, pinned revisions, exact source paths, disagreements, and limitations:

- [Cursor usage repositories](./cursor-usage-repositories-2026-09.md): 14 pinned repository inspections/screens, plus additional discovery candidates. Personal dashboard JSON, API-key RPC, CSV, authentication, joins, missing fields, and pagination.
- [Multi-harness repositories](./cursor-multi-harness-repositories-2026-09.md): eight substantive implementations, broader candidate dispositions, token accounting, cache handling, real versus synthetic identities, and fork lineage.
- [Local storage repositories](./cursor-local-storage-repositories-2026-09.md): eight substantive implementations covering historical Composer, transcript, CLI/Store and ACP readers; workspace and tool extraction; compatibility reports; estimation pitfalls.
- [SDK and CLI evidence](./cursor-sdk-cli-evidence-2026-09.md): four GitHub CLI consumer inspections, current official APIs, and static inspection of `@cursor/sdk@1.0.31` declarations.

These counts describe inspections within each lane; overlapping repositories and forks are not independent confirmations. No account endpoint was called with credentials, no private user history was inspected, and no downloaded program was executed. An implemented parser, a synthetic fixture, an upstream author's live observation, and a vendor contract are different evidence strengths. The reports distinguish them.

## Corrections to the first report

| Previous conclusion | Revised conclusion and decisive evidence |
| --- | --- |
| Personal history must start with hook installation | Personal dashboard history is already imported by multiple tools. Local history is already parsed by exporters. Hooks can improve future completeness. |
| Account usage has no session join | Personal JSON consumers read `conversationId`; the current Admin API explicitly documents it. CSV-only readers often lost this information. |
| Exact tokens require Enterprise telemetry | Personal API responses contain reported input/output/cache buckets. Some fields can be missing, and complete coverage still needs validation. |
| CLI structured output supplies no tokens | Version-specific upstream observations and consumers read terminal `result.usage` in camelCase. The output reference omits it; omission was insufficient evidence of absence. |
| Cursor has no supported local persistence interface | The SDK publishes a typed local store and historical inspection APIs. Whether its store overlaps ordinary IDE/CLI history is still unproven. |
| Private SQLite makes historical support impractical | Maintained readers already handle several storage generations, workspace joins, active conversation trees, and duplicates. The risk is concrete compatibility and field semantics. |

The current [Admin API](https://cursor.com/docs/account/teams/admin-api#get-usage-events-data) makes `conversationId` optional and explicitly describes session attribution. Missing IDs still need an unattributed category. The [SDK](https://cursor.com/docs/sdk/typescript#token-usage) documents per-turn usage and historical agent/run reads. Detailed code and package evidence are in the companion reports.

## Strongest implementations to learn from

| Implementation | What its source demonstrates | What it does not establish |
| --- | --- | --- |
| [junhoyeo/tokscale](https://github.com/junhoyeo/tokscale/blob/4b343e43bf0f1aa78f5032cb082f1c2c4cc76f65/crates/tokscale-core/src/sessions/cursor.rs) | Personal usage JSON with real conversation IDs. The [migration PR](https://github.com/junhoyeo/tokscale/pull/1247) reports a live import of 34 events across 18 sessions with matched costs. | Universal retention, all-account coverage, local workspace/machine ownership, or independent native verification here. Later cost-parity fixtures were partly synthesized. |
| [chocolatemale/cursor-usage](https://github.com/chocolatemale/cursor-usage/blob/a2f298f161f797036bf96718455e03ccdb42bef4/scripts/fetch_cursor_usage.py#L204) | Joins personal usage `conversationId` to retained transcript filename IDs, project directories, and nested subagent parents. | That every event has a transcript, every project directory is a canonical repo, or every matched session originated on this machine. |
| [iair0007/cursor-usage](https://github.com/iair0007/cursor-usage/blob/259ce8a426faf849592ddacb3cb24aae5caed1de/src/api.ts#L157) | Personal/Admin usage readers, conversation grouping, narrow SQLite title enrichment, and explicit tracking of unreported token buckets. | A guaranteed request ID or complete tokens on all accounts. Missing-cache handling is evidence of an actual field-availability problem. |
| [cnwinds/cursor-pulse](https://github.com/cnwinds/cursor-pulse/blob/6017130f010fe5a000550cf87dbefdd3b5f0cb9a/pulse/integrations/cursor_api.py#L171) | User API-key exchange followed by bearer-authenticated usage RPC. Browser-cookie extraction is not the only implemented auth path. | Public compatibility guarantees for that private RPC or live success on every personal plan. |
| [S2thend/cursor-history](https://github.com/S2thend/cursor-history/tree/c7f88062275b14078ffb26710bd9be281110d5e6) | Historical reader across Composer, transcripts, CLI/Store and ACP; workspace joins, tool results, source reconciliation, and partial-read reporting. | Complete native token population, exact timestamps in every source, or complete accounting across forks. |
| [steipete/CodexBar](https://github.com/steipete/CodexBar/blob/3b6864fa92489b7df122e72c153a579db4c0ddd8/Sources/CodexBarCore/Providers/Cursor/CursorUsageEventsFetcher.swift) | Independent JSON usage implementation with detailed token-bucket and pagination handling. | A complete local workflow reader. Its existence is not evidence for fields it does not consume. |
| [im4codes/imcodes](https://github.com/im4codes/imcodes/blob/023f7c358570769cde01a10ef8e134a9b05e75a7/src/agent/providers/cursor-headless-stream.ts#L89) | Version-specific CLI usage observation and camelCase parsing. | Passive collection of IDE history or a per-request Context histogram from aggregate turn usage. |

These repositories are implementation references. Reusing a dependency or copying code would also need checking the selected version's license and behavior.

## Gap matrix against the existing harnesses

The measured registry currently contains Claude Code, Codex, Grok Build, OpenCode, and Pi. Gemini is presently a resource/model identity. Existing adapters own discovery, parsing, deduplication, and normalization; shared code handles pricing, consent, and publication. Their coverage already varies, so Cursor need not satisfy a baseline in which every other harness exposes every metric. [Registry](https://github.com/alp82/aistack/blob/41e3405b3650f55d3c963bd11f021393258bd517/packages/cli/src/harness/index.ts), [adapter contract](https://github.com/alp82/aistack/blob/41e3405b3650f55d3c963bd11f021393258bd517/packages/cli/src/harness/types.ts)

| Capability | Existing measured harness pattern | Cursor evidence now available | Actual remaining gap |
| --- | --- | --- | --- |
| Historical usage | Timestamped local records can be rescanned | Personal JSON/CSV imports; SDK run/turn usage; captured CLI terminal usage | Account-history acquisition and retention; mapping reported events to local activity |
| Token buckets | Stored usage normalized into disjoint input/output/cache fields | Personal JSON carries all four; CLI/SDK can report them | Missing cache fields, legacy request-priced rows, ambiguous CSV headers, and optional reasoning/cache TTL detail |
| Conversation identity | Native IDs plus harness-specific replay handling | Real `conversationId` in JSON; native local composer/transcript IDs | Conversation IDs do not identify individual usage events; copied or resumed sessions need an origin policy |
| Event time | Per-response or turn timestamps | API event times; Composer timestamps and some timing fallbacks | Store/transcript variants can lack times; session time or file mtime cannot recover each turn's timing |
| Model attribution | Per-response model/provider where recorded | Usage-event model; some bubble model fields; SDK run selection | Auto/routing labels and mixed-model histories; selected session model is not proof of response model |
| Workspace/project | Local cwd supports hashing and Git extraction | Workspace identifiers and transcript directories; ID-based API joins implemented | Join misses, encoded paths, multiple roots, remote sessions, and validating a real local Git root |
| Machine ownership | Reading belongs to the publishing machine | Local retention proves availability; API gives account events | Account-wide usage spans machines/cloud; a local copy alone does not prove origin |
| Historical workflow | Retained event records feed the shared reducer | Composer/Store readers recover messages, tools/results, and some timing | Field completeness per storage generation; tool/MCP normalization and reliable metric denominators |
| Inventory | Configured and observed resources distinguished | Existing AI Stack Cursor MCP/config scanning plus local tool/hook evidence | Full configured/used inventory mapping; parent/child accounting and plugin/resource precedence |
| Automatic sync | Owned startup hooks trigger consented, throttled scans where supported | Cursor hooks are a feasible trigger; prospective collection can enrich history | Installation/lifecycle/platform checks and source completeness before replacing a day |
| Context | Only sources with per-call context evidence qualify | Local context snapshots; SDK/CLI turn usage | Snapshot or accumulated turn input is not a per-call context distribution |
| Safe replacement | Complete scans rebuild daily rows; failures can defer publication | Existing importers preserve caches on incomplete fetches and prefer one source | Combine API pagination completeness, local read completeness, delayed billing updates, and source overlap |

Sources for Cursor columns: the pinned implementations in the three repository surveys and [SDK/CLI report](./cursor-sdk-cli-evidence-2026-09.md). Sources for AI Stack's normalization and publication boundary: [adapter contract](https://github.com/alp82/aistack/blob/41e3405b3650f55d3c963bd11f021393258bd517/packages/cli/src/harness/types.ts), [daily usage builder](https://github.com/alp82/aistack/blob/41e3405b3650f55d3c963bd11f021393258bd517/packages/cli/src/usage/days.ts), [sync staging](https://github.com/alp82/aistack/blob/41e3405b3650f55d3c963bd11f021393258bd517/packages/cli/src/sync/stage.ts).

## What reverse engineering actually means here

There are several separate surfaces:

1. **Personal dashboard JSON/RPC:** already implemented for reported historical usage and session IDs. Risks include authentication, account-context parameters, pagination, missing fields, and retention. SQLite may be involved only in obtaining credentials.
2. **IDE SQLite and retained transcripts:** already implemented for historical conversation, workspace, and tool evidence. Risks include discovery changes, multiple representations of the same session, missing timestamps, and fields with unclear semantics.
3. **Documented SDK stores and APIs:** a supported interface for SDK agents, with typed IDs, usage, time, workspace and events. Its relationship to ordinary IDE history requires investigation rather than assumption.
4. **Enterprise APIs/OTel:** optional additional sources. Admin conversation joins exist. AI Code Tracking adds conditional commit/conversation attribution, but has Enterprise and alpha-access limits. [AI Code Tracking](https://cursor.com/docs/account/teams/ai-code-tracking-api#get-commit-details)

Private formats are not automatically unsuitable. OpenCode also requires schema-aware SQLite reading in our existing codebase; the important difference is access to an authoritative schema and the degree of empirical qualification. Cursor's unknowns should be stated as field/version questions rather than a blanket prohibition.

There is real maintenance evidence. A Cursor 3.0.13 user reported missing recent sessions; older bubbles required alternate timestamp fields; Composer/Store reconciliation exposed duplicate/drop problems. Those reports make compatibility work concrete. [Discovery regression](https://github.com/S2thend/cursor-history/issues/29), [timestamp recovery](https://github.com/S2thend/cursor-history/issues/13), [merge compatibility](https://github.com/S2thend/cursor-history/issues/36)

Local token fields are especially weak evidence of completeness. One maintainer reported nonzero token counts in only five of 4,592 bubbles. Other trackers synthesize cache replay, tokenize visible text, use context snapshots as input totals, assign the scan time to old records, or create fixed token pulses for hooks. Those implementations cannot establish measured historical usage. Reported API tokens and reconstructed local estimates must retain distinct provenance. [Maintainer observation](https://github.com/S2thend/cursor-history/issues/14), [audited estimation paths](./cursor-local-storage-repositories-2026-09.md#token-statistics-claims-audited)

## Practical direction for a future Cursor integration

The strongest candidate is a Cursor acquisition layer that fetches personal usage JSON, reads retained local sessions, joins on native conversation IDs, and then feeds the existing daily aggregation seam. Source selection belongs inside the adapter: API usage and local token fields must not be added together for the same activity. Hooks can trigger refreshes and supply future missing workflow events. SDK history deserves a separate compatibility probe because it may offer a simpler supported path for that subset of usage.

This is a research recommendation, not a decision that all unmatched account events should be published. Account-wide totals and a machine's reading are different scopes. Unmatched events, cloud activity, and copied histories need an explicit inclusion and ownership rule to avoid duplicate publication across machines.

For Actual Usage, historical timing can support activity and session metrics where timestamps are observed. Tools can support searches, questions and kit-related metrics after mapping names and checking denominator coverage. Workspace joins make Git-derived rows plausible. Structural subagent parent IDs are already read by multiple implementations; inherited usage, precise turn durations, effort settings, reasoning tokens, and per-call Context remain conditional. The local-storage report maps each family to concrete fields; missing measurements stay absent under the existing [workflow row contract](https://github.com/alp82/aistack/blob/41e3405b3650f55d3c963bd11f021393258bd517/packages/workflow-rules/src/workflowRows.ts).

## Unknowns reduced to specific validation work

| Question to settle | Evidence already available | Focused validation |
| --- | --- | --- |
| Can a personal account provide historical tokens and session IDs? | Implemented JSON import plus an upstream live-sync report | One sanitized current account response with field-presence and date-range counts; test the intended auth path |
| Can reported usage join this machine's projects? | Transcript-ID and SQLite-ID joins exist in code | Compare matched/unmatched usage across ordinary IDE, subagent, cloud and a second-machine conversation |
| What historical workflow rows can ship? | Local reader implementations and real timing/discovery reports | Small version-identified fixtures with known tools, model changes, timing, subagents and compaction |
| Can a complete day be replaced safely? | Pagination caps, cache preservation, overlap repair and source precedence are implemented elsewhere | Repeated pages, concurrent same-time events, delayed fields, a partial read, and a UTC boundary |
| Which token fields are trustworthy? | Reported API/CLI/SDK buckets; concrete missing-cache regressions | Compare dashboard totals, field presence, repeated requests and cache semantics without treating missing as zero |
| Does the SDK simplify passive history? | Typed local store, list/get/history and usage APIs | Determine which SDK/CLI/IDE stores it actually enumerates without creating new runs |
| How much history survives? | Date filtering and history import implemented | Probe older periods and retention boundaries; no inspected implementation establishes unlimited backfill |

The repository search resolves the basic feasibility question. The next work is targeted qualification and an accounting decision for account-versus-machine scope. There is no evidence-based reason to require a prospective-only first integration or to defer all historical support until Cursor publishes an IDE database schema.
