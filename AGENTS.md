# AI Stack Webapp

This is a webapp for sharing AI Stacks so that users can compare and choose the best set of tools for their needs.

## Development Process
* Web App is running on localhost:3019 - I am taking care of the dev servers running properly in my own terminal
* Convex is running already as well
* Schema changes are often required and okay
* Avoid backwards-compat, prefer convex migrations

## Prod database access

**Never point the local Convex CLI at prod.** That broke the local setup multiple times. All prod operations run on the server over ssh (`root@10.0.0.20`). Two scripts wrap this:

```sh
# Any Convex CLI command against prod, executed on the server.
# The admin key is minted on the server per call and never stored here.
scripts/convex-prod.sh data models --limit 20
scripts/convex-prod.sh run migrations/<name>:run

# Replace the local dev database with a fresh prod export.
# Destructive locally (auth tables included - log in again). Prod is only read.
scripts/sync-prod-db.sh
```

The local database lags behind prod. Before work that depends on real rows (catalog data entry, migration dry runs), run `scripts/sync-prod-db.sh` first.

**Prod deploys run through GitHub Actions exclusively.** A push to `main` triggers `.github/workflows/deploy-convex.yml`, which pulls the `~/aistack` checkout on the server and runs `pnpm convex deploy` there. Never run `npx convex deploy` against prod from a local machine. To run a new migration on prod: push to `main`, wait for the workflow, then `scripts/convex-prod.sh run migrations/<name>:run`.

**Never pass `--push` to `scripts/convex-prod.sh`, and never give it `deploy`, `dev`, or `push`.** The CLI runs from a minimal project dir on the server that holds no `convex/` directory, so anything that writes code pushes an EMPTY function set and prod loses every function and every index at once. That is a full outage, and it happened on 2026-08-24. The script now refuses those four forms, and the recovery is the workflow's own command, run on the server: `ssh root@10.0.0.20 "bash -l -c 'cd ~/aistack && git fetch origin main && git reset --hard origin/main && /root/.local/share/pnpm/pnpm i && /root/.local/share/pnpm/pnpm convex deploy'"`. Table rows survive; the indexes come back with the deploy.

## CLI release

Publish `@use-aistack/cli` to npm after the version bump lands on `main`:

```sh
cd packages/cli && pnpm publish
```

`prepublishOnly` runs the build. npm asks for a one-time password, so the owner must run the command in an interactive terminal. In a Claude Code session, type `! cd packages/cli && pnpm publish` so the OTP prompt reaches the owner. Deploy the backend first when the release changes the wire format - old clients must keep working, new clients need the new endpoint behavior.

## Styling Guidelines
* **No border-radius** - Use sharp corners throughout the design
* Use monospace fonts for buttons, labels, and technical accents
* Brand color: lime

## Writing Guidelines
* **No em dashes (U+2014) anywhere**: not in user-facing copy, CLI output, code
  comments, or docs. Use a period, colon, comma, or parentheses instead.
  `src/__tests__/no-em-dash.test.ts` enforces this.
* Write plain, direct sentences in copy and docs. Avoid aphorisms, rhetorical
  fragments, and "X, not Y" constructions unless the prohibition itself is the
  point.

## Tech Stack
* `pnpm`
* TypeScript / Vite / Biome
* Tanstack Start
* Tanstack Query
* Tanstack Forms
* Tailwind CSS
* Lucide Icons
* Convex
* Better Auth
* Resend

## Pricing

There is ONE price table, in `packages/pricing` (`@aistack/pricing`). The CLI
and the Convex backend both import it. It is a private workspace package and is
never published - `tsup` bundles it into the CLI's `dist`.

* The CLI prices each response at its own timestamp, at ingest. That figure is
  exact and always wins.
* The backend re-prices at READ time in `convex/lib/reprice.ts`, filling gaps
  only. Its figures are LOWER BOUNDS, for one remaining reason: it has no
  per-response timestamps, so a window straddling a repricing pays the cheaper
  rate. The cache-write bias is gone from new payloads. The wire carries the
  5-minute/1-hour split as `tokens.cacheWriteTtl`, and the repricer charges each
  tier its own rate; a payload from before that field still merges into one
  `cacheWrite` and charges the cheap tier, about 8% low for Claude Code.
* Every surface that prints dollars prints the price-table id and the share of
  tokens the figure covers. `publishCost` on the stack is the consent gate:
  check the flag. The presence of dollars in the data is not consent.
* A harness that routes several providers keys its rows `provider:model`
  (`google:gemini-3.6-flash`). Only a provider the table maps to a vendor gets
  that vendor's rates, so a gateway re-serving someone else's model stays
  unpriced. Local providers hold a real zero rate, cited `local-no-charge`:
  free (the machine charges nothing) and unpriced (the table has no rate) are
  different states and must render differently. Use `vendorModelId()` for
  display and catalog lookups.

## Charts

All charts come from `src/features/charts`. It is the only place that imports
`@tanstack/charts`, and the version is pinned exactly, with no caret. Import the
components, never the library.

* **One series wears the page accent** (`--accent-lime`, re-pointed per stack).
  **Two or more wear the validated palette** (`--chart-1` … `--chart-6`) and
  never the accent.
* The palette is validated, not chosen by eye. Change a slot and the tests in
  `src/features/charts/__tests__/palette.test.ts` re-run the six checks. The
  canonical validator is the `dataviz` skill's `scripts/validate_palette.js`.
* Square ends everywhere. No mark sets a corner radius.
* Every chart server-renders complete SVG. `ssr.test.tsx` asserts real marks, so
  a library regression fails the build instead of shipping blank charts.

## Measured workflow

The Workflow section on the stack page. Spec:
[docs/specs/workflow-surface.md](docs/specs/workflow-surface.md).

* **The rules are one package**: `packages/workflow-rules` (`@aistack/workflow-rules`),
  imported by the CLI, the Convex backend, and the web app. It holds `phase-rules/v1`,
  `metric-rules/v1`, `component-rules/v1`, `lead-templates/v1`, `playbook-rules/v1`, and
  the fit and rotation arithmetic. Every function in it is pure, so it is where a rule
  change gets tested.
* **Fit splits between the machine and the server.** The CLI measures and ships value,
  band, coverage and rule id per pool metric. The server computes fit (coverage times
  surprise), applies the rotation limit, and applies the owner's pins and hides.
* **A reading is one machine's** (ADR-0009). `measuredWorkflows` holds one row per
  (stack, machine), REPLACED on every sync rather than appended, and nothing merges two
  machines. The Git half cannot merge (no commit identity on the wire) and a pool metric
  has no denominator to merge on.
* **No LLM anywhere** (ADR-0002). Every sentence the section prints comes from a fixed
  template over measured numbers.
* The `publishWorkflow` bit is the consent gate, and it reads at BOTH ends: the CLI skips
  the extraction when it is off, and `getWorkflowByStackSlug` returns null for a reading
  already stored. The presence of a stored section is not consent.
* **The section is `src/features/workflow`.** It renders what the server hands it and ranks
  nothing: `placement`, `pinned` and `hidden` arrive computed, and a second ranking on the
  page could disagree with the first. The two owner controls are pin and hide per row,
  through `setWorkflowRowOverride`.
* **The playbook's tracks split on the median measured session, never on intent.** Nothing
  records what a session was for, so `playbook-rules/v1` names its two tracks the shorter
  and the longer sessions. A receipt card's head names both sides and claims no direction.

## News

Everything about the news pipeline starts here.

* **[docs/news-runbook.md](docs/news-runbook.md)** is the operating procedure:
  the collection crons, the inbox, drafting, authoring an issue, and the send.
  Read this one first.
* **[docs/specs/news-pipeline.md](docs/specs/news-pipeline.md)** is the design:
  the sourcing phases, the re-serving policy table, and the two projections.
* **[ADR-0003](docs/adr/0003-news-drafting-in-the-owner-session.md)**: drafting
  runs in the owner's Claude session. The backend holds no LLM call and no API
  key.
* **[ADR-0004](docs/adr/0004-a-hacker-news-story-joins-the-item-a-feed-collected.md)**:
  a Hacker News story joins the item a feed already collected.
* **[ADR-0005](docs/adr/0005-the-x-profile-lane-is-owner-triggered-only.md)**: the
  X profile lane is owner-triggered only. No cron calls it.
* **[CONTEXT.md](CONTEXT.md)** defines the vocabulary: collector, lane, item
  stream, issue, prepare, publish, subscriber.

The two command sets, in the order they are used:

```sh
# Drafting. Run the skill, review and merge drafts/news/*.md, then apply.
/news-draft
node scripts/news-drafts.ts list
node scripts/news-drafts.ts apply [--dry-run]

# The newsletter. An issue is authored in src/newsletter/issues.ts.
node scripts/newsletter.ts list
node scripts/newsletter.ts prepare issue-1
node scripts/newsletter.ts preview issue-1
node scripts/newsletter.ts test issue-1 --to you@example.com
node scripts/newsletter.ts send issue-1 --yes
```

Both reach prod through `scripts/convex-prod.sh`, like migrations, and both call
INTERNAL Convex functions: an admin key carries no user identity, and the public
news functions check `isAdmin`. **Deploy first**, the same way a migration does.

Three rules that bite if forgotten:

* A source collects **forward only**. `collectFrom` is the moment the row is
  created, so a new source never backfills unless you move it.
* A **sent issue is never edited**. `prepare` refuses one, and a second send is
  refused.
* Item **summaries live on the item rows**, not in the issue definition. Both
  projections read them from there.

## Icon Migration

After seeding (or any time `iconUrl` rows on tools/models/bundles need to be
moved into Convex storage), run:

```sh
# Dev: auto-detects the running `convex dev` anonymous backend's admin key
# from ~/.convex/anonymous-convex-backend-state/<deployment>/config.json
pnpm tsx scripts/migrate-icons.ts

# Self-hosted prod - see "Prod database access": run prod operations on the
# server over ssh, not with local env vars. Deploy code first so the migration
# functions exist, then run the script from the server side.
```

Auth: the script talks HTTP to Convex via `ConvexHttpClient` with admin auth
(no CLI shelling, no stdout parsing). It auto-detects a local anonymous
backend when env vars aren't set.

## Agent skills

### Issue tracker

Issues and PRDs live in the `alp82/aistack` GitHub Issues, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

Idempotent - a second run skips every row that already has an
`iconStorageId`. Data URIs are decoded, http URLs are fetched (8s timeout),
ICOs are decoded via `decode-ico` (largest entry), and everything is sharp'd
to 512×512 WebP q80 and uploaded. Data-URI sources are cleared from
`iconUrl`; http-URL sources are kept as the canonical source.
