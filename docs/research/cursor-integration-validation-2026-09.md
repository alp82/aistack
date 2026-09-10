# Cursor integration validation and release handoff

Status on 2026-09-10: automated acceptance passed. Native acceptance is UNRUN and awaits the owner's release disposition in [Validate Cursor integration and release readiness](https://github.com/alp82/aistack/issues/393). This report does not claim publication or close that ticket.

## Integrated changes

Validated together on `task/cursor-collection`:

- `003f5dbd`: usage collection and historical sync.
- `1ed0a53c`: workflow metrics and machine inventory.
- `03214ffe`: shared pricing and statistics consumers.
- `f06028ff`: stop-hook automatic sync and connection lifecycle.

The existing wire and backend harness handling accept Cursor without a schema migration or a new catalog model. Models use the normal vendor identifiers and pricing catalog. Auto stays unpriced when it cannot resolve. These changes add no Cursor-specific disclaimer, accuracy badge or coverage UI. The existing cost consent, source citation and coverage behavior remain the presentation contract.

The collection, workflow and autosync implementation reports in this directory document the formulas, defaults and supported evidence. Local missing text-token buckets use `ceil(text.length / 4)` once, explicit zero survives, matched API conversation/day totals replace local totals, and unsupported per-call Context and timing remain absent. SQLite login reuse is unattended; Keychain-only installations use local evidence and cached enrichment. No separate login or native credential helper is introduced.

## Checks performed

All commands ran on the combined implementation, using synthetic inputs where a source/account is needed:

```sh
pnpm exec vitest run packages/cli/src/harness packages/cli/src/autosync packages/cli/src/sync packages/cli/src/usage packages/workflow-rules packages/pricing convex/measured.test.ts convex/workflow.test.ts convex/leaderboard.test.ts src/features/activity/__tests__/feed.test.ts src/features/leaderboard/__tests__/leaderboard-page.test.tsx src/features/usage/__tests__/harness-label.test.ts src/features/workflow/__tests__/harness-label.test.ts src/__tests__/no-em-dash.test.ts
pnpm exec vitest run packages/cli/src/workflow packages/cli/src/payload.test.ts packages/cli/src/scanner.test.ts
pnpm --filter @use-aistack/cli build
node scripts/verify-cursor-package.mjs
pnpm dlx node@22.13.0 scripts/verify-cursor-package.mjs
pnpm exec tsc --noEmit -p packages/cli/tsconfig.json
pnpm build
pnpm exec biome check packages/cli/src/index.ts
node packages/cli/dist/index.js sync --help
git diff --check
```

- First suite: 50 files, 847 tests passed. Supplementary workflow/scanner suite: 6 files, 33 tests passed. The supplementary command's payload filename filter matched no extra file; shared payload tests ran within the first suite's harness coverage.
- CLI build and typecheck passed. After the help correction, its Biome check, rebuilt CLI and actual `sync --help` output passed. Production web client, SSR and Nitro build passed, with build chunk-size warnings.
- Actual production CLI bundle's read-only MCP preview passed on Node 24.15.0 and supported minimum 22.13.0. Synthetic SQLite resolves through the installed pinned reader and writes the expected normalized local cache. The child has an isolated home and blocked network; it does not publish or invoke interactive sync.
- The integrated suites cover missing/zero fields, local/API overlap, account changes and credential reread, UTC corrections, delayed replacement, ID-less multiplicity, failures and preserved cache, incomplete machine-day withholding, consent-off extraction/pricing, workflow and inventory privacy, two-machine backend histories, pricing and existing display labels.
- Autosync checks cover installation/removal ownership, malformed config, remote permission order, local disable on removal failure, shared throttle and silent failures. Both Unix command variants execute with synthetic npx on Linux, including offline fallback. Windows command construction is checked without claiming native execution.
- Diff inspection found no new wire version, database migration or accuracy UI. Updated CLI help to describe harness hooks now that Cursor uses stop instead of SessionStart. No other implementation defect was identified by this validation.

No owner credentials, private retained history, paid session, real interactive sync, production rows or deployment were used. No version was changed. The test evidence establishes the synthetic paths and shared backend behavior; it does not establish a real Cursor account's current field population or native hook delivery.

## Native checks and practical release impact

| Check | Status | Practical impact |
| --- | --- | --- |
| Owner-approved manual sync to the local app and inspection of resulting usage/history | UNRUN | Real retained history may expose formats or joins the synthetic reader fixtures do not cover. |
| Real Cursor stop delivery through the configured hook | UNRUN | Automatic refresh depends on Cursor invoking the command with a usable GUI PATH. The existing manual path remains available if delivery fails. |
| Actual SQLite login reuse, unavailable/expired access and Cursor renewal | UNRUN | Enrichment success and join coverage remain unverified on a real account. Local estimates and complete-cache fallback are implemented and tested. |
| Native macOS and Windows execution, including GUI PATH | UNRUN | Launcher text/platform paths are tested synthetically; native shell and environment behavior is unverified. |

These gaps affect the promised real acquisition and automatic-refresh paths, so their release treatment needs the explicit owner disposition required by the validation ticket. They do not justify an exhaustive donor programme or paid session requirement. The Grok Build precedent deferred native checks to post-release user validation after an explicit owner decision. That decision has not yet been recorded for Cursor.

Recommended disposition: accept these exact UNRUN checks as staged post-release owner/user validation, retaining their status and asking for normal user feedback. Alternatively, hold publication until the owner runs the feasible local manual and native stop checks and reports the results; unavailable platform checks still need a disposition. No synthetic result is relabelled as native success.

The installed hook intentionally invokes npm `@latest`, with the existing cached fallback. Before the Cursor release is published, a real stop event can therefore run the older published collector. Pre-release synthetic launcher tests use a controlled executable; they are not evidence that the installed hook has run the new collector against an owner account.

## Owner smoke procedure

For a chosen native smoke run, the owner signs into the local app, builds the CLI, and runs the AGENTS.md local login/sync instructions in their own terminal. If the local stack is missing, sync the production export to dev first and sign in again. Approve only the preview intended for localhost. Check the stack's token/model totals, retained-day behavior, Actual Usage rows and inventory. A second sync should preserve the reading without duplicate days. No new paid activity is required.

Automatic sync needs its normal explicit opt-in. After the Cursor package is published, enable it against the intended backend with `AISTACK_URL=http://localhost:3019 node packages/cli/dist/index.js sync --auto on` when checking dev. Ensure the Cursor process launching the hook also inherits the intended `AISTACK_URL`; otherwise the released hook uses its normal production default. Check a naturally occurring stop event and the existing autosync log/status, respecting the shared six-hour throttle. Disable through `sync --auto off` when finished. Do not bypass the CLI's interactive gate or reset consent/throttle state to manufacture a pass.

## Backend-first release handoff

[Deploy Cursor backend support and publish the CLI](https://github.com/alp82/aistack/issues/394) owns all publication:

1. Record the owner's disposition or actual native outcomes on the validation ticket before closing acceptance.
2. Integrate the four implementation commits and this report using a Conventional Commit CLI feature title. Preserve unrelated workspace changes. Resolve any current-main drift through the normal review workflow; this report validates the local combined branch, not a future merge commit.
3. Wait for the `deploy-convex.yml` workflow on the merged main commit. There is no Cursor migration in this change. If later integration requires a migration, run it only via the server wrapper after its code is deployed.
4. Let Release Please choose the CLI version and release PR. Merge that PR only after compatible backend deployment and the acceptance disposition. `publish-cli.yml` publishes its release commit through npm OIDC. Do not bump the package version or publish manually.
5. Verify the deployed commit, GitHub release, successful publishing workflow and npm artifact/version. Repeat the safe packaged smoke on the released artifact. Record native feedback with its actual status. Normal release copy can say that Cursor history now appears in sync and statistics, and that automatic sync uses the user-level stop hook.
