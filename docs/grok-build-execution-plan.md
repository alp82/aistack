# Grok Build execution sequence and release acceptance

Accepted execution plan. The canonical resolution belongs on [Decide the Grok Build execution sequence and release acceptance](https://github.com/alp82/aistack/issues/370). Nothing here has been implemented or release-tested.

## Settled constraints

Follow the [measurement contract](https://github.com/alp82/aistack/issues/367#issuecomment-5591789778), [collection contract](https://github.com/alp82/aistack/issues/368#issuecomment-5591912250), and [released-format decision](https://github.com/alp82/aistack/issues/371#issuecomment-5604952405).

Support all measurable Grok Build capabilities through existing adapters, statistics and consent flows. Favor practical estimates and existing presentation. Historical per-call Context and completed-turn sync workers remain out of scope.

The owner accepted two additional choices: actual Linux, macOS and Windows hook checks all gate CLI publication; transient Grok read failures defer the machine's measured days while independently readable inventory may publish.

KISS/YAGNI governs implementation: one ordinary adapter, small required shared changes, existing machinery elsewhere. Do not build general infrastructure for hypothetical harnesses or exhaustive recovery from lost local history. The owner accepted these simplifications and requested a new execution map.

## 1. Adapter and historical discovery

Add `packages/cli/src/harness/grok/{scan,analyzer,adapter}.ts` using `HarnessAdapter` and existing aggregates. Register `grok-build` with the label `Grok Build`.

Read only known workspace/session directory levels and evidence files under `$GROK_HOME/sessions`, default `~/.grok/sessions`. Resolve encoded/hashed workspaces through metadata. Do not follow directory symlinks or search the disk. Stream JSONL one file at a time. Keep the existing authored-resource size limit. No new concurrency scheduler or collection of speculative performance thresholds.

Use the settled session-level sidecar/event precedence, identity-based replacement and practical child accounting. Missing usage never supersedes usable usage. Preserve per-model counters, reasoning semantics and timestamp units. Prefer recorded duration, then an associated start/end span; otherwise omit it. Synthetic completions and `numTurns` do not establish human-turn counts.

Separate historical detection in `sync/stage.ts` from hook eligibility: retained history reaches the manifest window, capped at 400 days; hooks still require activity in the last 30 days. Include other historical harnesses when recomputing mixed-harness days. Keep existing staging even if it scans twice; optimize only if measurement shows a problem.

## 2. Safe replacement with minimal local state

Add a scan-complete flag to gate measured-day publication. Retry changing/unreadable files twice after the first attempt, with 100 ms then 300 ms delays. Compare file metadata around reads. A changing/truncated file or failed traversal defers the machine's days. Skip stable malformed contributions individually; usable partial recordings remain publishable and unknown extra fields are tolerated.

Remember each Grok session's previously published dates in one small local cache scoped to server/stack/machine. A rewritten sidecar can otherwise erase its old timestamp. Store session identity and dates only. Do not introduce a token cache, cross-harness source registry or general transaction journal. The server day manifest remains the synchronization authority.

On a successful reread, recompute old and current dates through the existing full local fold, retaining other harness contributions. Send an explicit empty old day only when complete recomputation is empty. Extend `usage/days.ts` and `usage/diff.ts` to include these correction dates and test the backend's existing whole-day replacement with empty rows.

Retain the old/current date union before sending; reduce it to current dates only after successful publication. A failed send can then retry idempotently. Missing known source files are incomplete evidence, not a reason to clear history. Expire hints outside the send window. After cache loss, rebuild hints without guessing old dates or clearing all missing manifest dates. Repair of earlier moves after cache loss is not guaranteed. Reuse existing full-fold assumptions for other harnesses; recovery after arbitrary source deletion is outside this adapter change.

## 3. Workflow and inventory

Normalize persisted events into existing reducers/rules for activity, sessions/project workspaces, durations, phases/playbook, routing/thinking, supported delegation, questions, web searches, skills and MCP calls. Effort requires a usable effective-state timeline and denominator. Git statistics use the existing extractor. Omit metrics lacking their required evidence. Configuration never establishes invocation.

Use existing scanner, MCP, plugin, hook and resource-preview paths for native, compatible and plugin inventory. Follow documented precedence, disabled settings and trust rules. Read known roots and explicitly referenced paths. Do not grant trust, alter compatibility settings or upload secrets, paths, transcripts or raw arguments. Unreadable configuration must not fabricate an empty inventory.

Preserve workflow/cost consent at both ends, resource approvals, fixed row ordering and existing exact/proxy rules. No generic capability framework.

## 4. Pricing, catalog and consumers

Add xAI to the shared vendor type, provider mapping, wire parser and catalog normalization. Keep the price-table wire shape. Resolve actual configured aliases to known model IDs before publication so backend repricing sees the same IDs. Add only explicit shared pricing aliases required by retained cases. No catalog-alias distribution API or general suffix-guessing rule.

Prefer the identified provider's rate, then the canonical model's vendor rate as the settled Grok estimate. For the observed `grok-4.6-build` case, use an explicit Grok-only pricing alias to `grok-4.6` when the exact model lacks a rate and the base has a citable rate. Preserve separate catalog identities. Unknown mappings/rates stay unpriced. Keep CLI/backend fallback identical and confined to Grok. A localhost endpoint alone does not establish free usage.

Reuse token normalization, unsplit cache-write pricing, dated rates, citations and price coverage. Do not add reasoning to token totals or create a billed-cost surface.

Mirror prod before catalog inspection. Add an idempotent migration only for missing native tool/model/rate data; distinguish Build from consumer chat. Rates require sources. Do not change schema or wire versions merely to add a harness.

Update shared/explicit labels, sync support copy and CLI docs. Verify the model list, Actual Usage, history, workflow, leaderboard, activity, freshness and Discord with representative Grok data. Keep generic consumers generic.

## 5. Native SessionStart hook

Add a Grok installer beside the existing installers and connect interactive reconciliation/removal. Own one global hook source under the selected Grok home. Preserve user/imported hooks and refuse to overwrite malformed configuration. Use existing consent and recent-activity eligibility; silent sync never installs hooks.

Invoke existing `sync --auto`, reusing package/cache fallback, permissions, logs and failure reporting. Use only the platform wrapper needed to return promptly and suppress stdout. Verify actual background execution on each OS. No separate launcher service, package downloader or update lifecycle.

Fix the demonstrated simultaneous-trigger race with an atomic shared attempt reservation before work. Keep the six-hour default and 1-24-hour setting. A crash consumes an attempt; the next interval or manual sync retries. No retry worker. Suppress Claude-specific `systemMessage` output for Grok.

Report collection support separately from installed hooks and document reload/new-session requirements. Retry installation failures during interactive reconciliation. Disable local execution before remote revocation and remove only owned hooks, even when Grok is inactive. A leftover hook cannot publish while locally disabled.

## 6. Validation and release

Order: adapter and safe staging, workflow/inventory, pricing/catalog/consumers, then native auto-sync. Shared type changes accompany their first consumer. Use as few PRs as make review practical. These steps are not six required projects.

Use retained native and constructed fixtures at `research/grok-build-fixtures`, branch `research/grok-build-fixtures-2026-09`, commit `921afdd4d6013046c1df6ea5b724f4fa441172f7`. Preserve provenance and known limitations. No new donor campaign or `grok usage` equivalence gate.

Automated checks cover:

- Precedence, revisions/copies/children, partial usage, timestamps, reasoning and duration.
- Old history, custom homes, encoded/hashed workspaces, changing/malformed files, deferral/catch-up, repeated sync, date movement and empty old days alongside another harness.
- Pricing aliases/fallback/missing rates, zero versus unpriced, citations and CLI/backend agreement.
- Supported workflow joins and absent evidence; inventory precedence/disable/trust, privacy and consent.
- Hook ownership/coexistence, idempotence, simultaneous triggers, disable/revoke, reload and cache/failure recovery.

Run affected package tests, typecheck and required repository checks, including the no-em-dash check. Exercise a large synthetic stream to catch whole-file loading or pathological work. Do not invent speed/RSS release targets before measuring.

All live checks remain UNRUN:

1. The owner builds the CLI, mirrors data as needed, logs into localhost and runs documented local sync in their own TTY with `AISTACK_URL=http://localhost:3019`. Review the preview, repeat sync and inspect statistics. Never bypass the TTY gate.
2. Owner/platform testers verify actual SessionStart behavior on Linux, macOS and Windows, including paths with spaces, custom home, coexistence, prompt return, empty stdout, reload and removal. All three gate publication. Existing recordings suffice; paid prompts are not required.
3. Verify previous-client acceptance. Deploy backend/web through GitHub Actions, wait for success, then run necessary catalog migrations through `scripts/convex-prod.sh`.
4. Release through Release Please using `feat(cli):`, with no manual version bump. Publish only after the preceding checks pass. Record commits, migration results, package version and check outcomes.

This completes the planning decision. Implementation, validation, deployment and publication belong to [Execute complete Grok Build support for sync and measured statistics](https://github.com/alp82/aistack/issues/372). No implementation or release check was performed by accepting this plan.
