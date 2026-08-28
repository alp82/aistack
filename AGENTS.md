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

The local database lags behind prod. Before work that depends on real rows (catalog data entry, migration dry runs), run `scripts/sync-prod-db.sh` first. It copies what prod HAS: for a reading no machine has published yet, see "Publishing a measured reading to the local backend".

**Prod deploys run through GitHub Actions exclusively.** A push to `main` triggers `.github/workflows/deploy-convex.yml`, which pulls the `~/aistack` checkout on the server and runs `pnpm convex deploy` there. Never run `npx convex deploy` against prod from a local machine. To run a new migration on prod: push to `main`, wait for the workflow, then `scripts/convex-prod.sh run migrations/<name>:run`.

**Never pass `--push` to `scripts/convex-prod.sh`, and never give it `deploy`, `dev`, or `push`.** The CLI runs from a minimal project dir on the server that holds no `convex/` directory, so anything that writes code pushes an EMPTY function set and prod loses every function and every index at once. That is a full outage, and it happened on 2026-08-24. The script now refuses those four forms, and the recovery is the workflow's own command, run on the server: `ssh root@10.0.0.20 "bash -l -c 'cd ~/aistack && git fetch origin main && git reset --hard origin/main && /root/.local/share/pnpm/pnpm i && /root/.local/share/pnpm/pnpm convex deploy'"`. Table rows survive; the indexes come back with the deploy.

## Publishing a measured reading to the local backend

`scripts/sync-prod-db.sh` copies prod's rows, so it can only give you data prod
already has. A measured reading it cannot give you is one no machine has ever
published. As of 2026-08-25 `measuredWorkflows` is empty on prod, so no amount of
mirroring makes the Workflow section appear locally: something has to publish one.

Point the CLI at the local app and sync. The whole ingest path runs for real, and
nothing touches prod.

**The owner runs this, not an agent.** `sync` refuses to run without a TTY
(`packages/cli/src/commands/sync.ts`, #31: a gate that cannot ask must not
send), and a model-launched Bash call has no TTY. In a Claude Code session, type
the sync line with a leading `!` so it runs in the owner's own shell, or run it
in a terminal. Do not try to route around the gate.

```sh
cd packages/cli && pnpm build   # dist/index.js is what you run
cd ../..

# One login per server. Opens the LOCAL approval page; approve it there.
# `sync` runs this inline on an unlinked machine, so it is optional.
AISTACK_URL=http://localhost:3019 node packages/cli/dist/index.js login

# Scan, preview, approve, publish - against the local backend. Needs a TTY.
AISTACK_URL=http://localhost:3019 node packages/cli/dist/index.js sync
```

Five things that make this safe and make it work:

* **`AISTACK_URL` is the only switch.** `packages/cli/src/api.ts` reads it and
  falls back to `https://aistack.to`. The device-auth URL comes from whichever
  server answered, so a localhost run sends you to a localhost approval page.
* **A localhost login cannot clobber the prod token.** `~/.config/aistack/credentials.json`
  keys credentials by server URL, which is exactly what that keying is for. You
  log in once per server and both tokens survive.
* **`publishWorkflow` defaults ON.** `stack.publishWorkflow !== false` is the
  gate, so a stack that never set the flag still publishes its workflow section.
  There is nothing to toggle before the first run.
* **The local app and `convex dev` both have to be up**, and your stack has to
  exist in the local database. Run `scripts/sync-prod-db.sh` first if it does
  not, then log in to the local app again - the mirror replaces the auth tables.
* **Be signed in to the LOCAL app in a browser before you start.** The approval
  page is served by localhost, and it can only approve a machine for an account
  it already has a session for.

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
  `metric-rules/v2`, `component-rules/v2`, `lead-templates/v1`, `playbook-rules/v2`, the
  daily wire shape and its fold (`daily.ts`), and the fixed row order
  (`workflowRows.ts`). Every function in it is pure, so it is where a rule change gets
  tested.
* **The wire is per-day rows of combinable atoms** (`workflow-aggregates/v2`, #285). The
  CLI ships one `WorkflowDay` per UTC date holding counts, sums, maxes and
  `log-buckets/v1` histograms, and NO share, median or mean. The server folds a window
  (30 days, 7 days, or the last 24 hours) at read time and computes every row over the
  fold. A rule change is a server deploy and needs no re-sync.
* **A reading is one machine's, per day** (ADR-0009). `measuredWorkflowDays` holds one
  row per (stack, machine, date); a re-synced day REPLACES that day, days append across
  syncs, and 400 days are kept per machine. Nothing merges two machines: the Git day
  carries no commit identity.
* **Fit is a number nothing ranks by** (#277). Rows come in the fixed order of
  `WORKFLOW_ROW_ORDER`, pinned rows first, and the first three are the podium. There is
  no rotation state, fit line or expander.
* **No LLM anywhere** (ADR-0002). Every sentence the section prints comes from a fixed
  template over measured numbers.
* The `publishWorkflow` bit is the consent gate, and it reads at BOTH ends: the CLI skips
  the extraction when it is off, and `getWorkflowByStackSlug` returns null for days
  already stored. The presence of stored days is not consent.
* **The rows render inside Actual Usage, `src/features/usage` (#307).** There is no
  Workflow section and the word appears nowhere on the page. The section renders what the
  server hands it and ranks nothing; the rows sit in five fixed tabs under the token
  headline. The owner has no per-row control: `setWorkflowRowOverride` has no consumer on
  the web. `src/features/workflow` keeps the row bodies, heads and derivations.
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
