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

Release Please owns the version in `packages/cli/package.json`. Do not bump it
in a feature change. Use a Conventional Commit title on a CLI pull request:
`fix(cli):` selects a patch, `feat(cli):` selects a minor, and a breaking
change selects a major. After the change lands on `main`, Release Please opens
or updates the CLI release pull request. Merging that pull request creates the
`cli-v<version>` GitHub release and `.github/workflows/publish-cli.yml`
publishes `@use-aistack/cli` to npm.

npm trusts `publish-cli.yml` directly through OIDC. The publish job needs
`id-token: write` and must not use an npm write token. The trusted-publisher
configuration identifies the workflow by its filename, so rename it only after
updating the package settings on npm.

The publish workflow can also be dispatched manually to retry npm publication
for the version at the selected commit. Deploy the backend first when a release
changes the wire format. Old clients must keep working before the new client is
published.

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

The price table lives in Convex: `modelPrices`, one row per dated period
`{modelSlug, provider?, from, input, output, cacheRead?, cacheWrite5m?,
cacheWrite1h?, source}` (ADR-0012, #336). A period runs until the next period's
`from`; there is no `to`. Cache tiers are absolute rates per period, never a
vendor multiplier. `models` carries no price field: unpriced is an empty read,
free is a zero-rate period cited `local-no-charge`.

* **One read seam.** `convex/lib/modelCatalog.ts` (`loadModelCatalog`) collects
  `models` and `modelPrices` and exposes `priceAt(slug, provider, timestamp)`
  and a `pricer`. `convex/lib/reprice.ts` and every other consumer price
  through it; nothing else reads `modelPrices`.
* **`GET /api/prices`** (`convex/prices.ts`) serves the rows with a table id
  (`modelPrices/<rows>-<hash>`). The CLI fetches it at the start of every sync
  from `AISTACK_URL`, layers it over its bundled table and prices at ingest.
  When the fetch fails it prices from the bundled table and the gate says so.
* **`packages/pricing` (`@aistack/pricing`) is the shared lookup and the
  bundled fallback.** `table.ts` holds the row shape and the `Pricer` both
  sides use; `index.ts` holds the constants, rendered by `bundledPriceTable()`.
  The seed migration `20260829_seed_model_prices` wrote them into
  `modelPrices`; from now on a rate change is a row in the table, and the
  constants only need touching when the fallback should move with it. It is a
  private workspace package, never published; `tsup` bundles it into the CLI.
* **Every dollar figure cites the period's `source`** as its price-table id,
  and prints the share of tokens the figure covers. `publishCost` on the stack
  is the consent gate: check the flag. The presence of dollars is not consent.
* The CLI prices each response at its own timestamp, so its figure is exact.
  The backend re-prices at READ time, filling gaps only. Its figures are LOWER
  BOUNDS: it has no per-response timestamps, so a window straddling a repricing
  pays the cheaper rate, and a payload from before `tokens.cacheWriteTtl`
  charges every cache write at the 5-minute tier.
* **Alias rules before lookup** (decision 6): strip the `provider:` prefix, a
  `#fast` suffix and a trailing `-YYYYMMDD`; then the slug, then the stored
  `aliases`. The catalog slug IS the vendor's bare API id, dots included
  (`gpt-5.4`, `kimi-k2.5`).
* A harness that routes several providers keys its rows `provider:model`
  (`google:gemini-3.6-flash`). A provider with rows of its own uses them; a
  provider that IS the vendor reaches the bare rate; a gateway re-serving
  someone else's model stays unpriced. Local providers hold a real zero rate:
  free and unpriced are different states and must render differently. Use
  `vendorModelId()` for display and catalog lookups.
* **Priced lanes** (`codex-auto-review`) and the `#fast` variants stay in the
  bundled constants only: they are rates without a catalog row, and the seed
  skips them.
* **The import** (`convex/modelImport.ts`, rules in `convex/lib/modelImport.ts`,
  #337) runs daily at 05:00 UTC and from the admin Import tab. It reads
  models.dev (`api.json`), LiteLLM as fallback, and compares each catalog row's
  rate under its OWN vendor (a gateway listing never prices a vendor row). A
  changed rate is a new period dated to the run, cited `models.dev@<date>`; an
  unchanged rate writes nothing. It creates `pending` rows for dataset models
  of the allowlisted vendors (`VENDOR_ALLOWLIST`) released in the last 180
  days that read and write text only, and for any measured id with tokens on
  a day that resolves to no row. Never for a priced lane, a `#fast` or dated
  variant, or an inventory-only id. Every write is a line in `importLog`.

## Stack models

The model list on a stack page is DERIVED (#338, map #332), in
`convex/lib/stackModels.ts`: the measured models of the stack's 30-day fold with
tokens, sorted by token share, then the manual picks (`stacks.modelSubscriptions`)
in stored order. `getBySlug` and `getPublicSummary` hand the page that list; the
page renders it as handed and ranks nothing. There are no roles.

* **The picker adds only what no adapter sees.** A pick a later sync measures sorts
  into the measured group, once. A pick that names no catalog row is dropped.
* **Hide is display only.** `stacks.hiddenModelSlugs` drops a model from the public
  list and from nothing else: tokens, spend and the leaderboard keep counting it.
  The owner hides and unhides in the editor (`listMeasuredModels`, `setModelHidden`).
* **Consent is the CLI approve gate plus that hide.** There is no separate flag, and
  nothing asks to add a measured model: `addMeasuredModel` and the
  `missing_from_authored` suggestion are gone.
* On the tile print the share and nothing else ("Anthropic · 62%").

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

## Measured workflow and Stats

The measured workflow atoms feed Stats (the Actual Usage section,
`src/features/usage`). Spec: [docs/specs/workflow-surface.md](docs/specs/workflow-surface.md).

* **The rules are one package**: `packages/workflow-rules` (`@aistack/workflow-rules`),
  shared by the CLI, Convex and web. It holds the versioned extraction rules, daily wire
  shape and pure folds. Rule changes belong there with tests. No LLM generates readings.
* **The wire is per-day combinable atoms** (`workflow-aggregates/v3`). Counts, sums,
  maxes and histograms travel; shares, medians and means do not. Context is optional;
  older days remain readable beside days with context atoms. No new CLI extraction
  was required for the Stats redesign.
* **Storage is per machine/day.** `measuredDays` holds usage and workflow halves per
  (stack, machine, date), retained server-side (ADR-0010). Complete re-syncs replace
  that day; partial readings retain prior evidence. Window-free inventory lives on
  `measuredInventory`, latest per (stack, machine, harness) (ADR-0011).
* **Web Stats has a fixed 30-day window and automatic scope** (#466, ADR-0009).
  `getStatsByStackSlug` combines session atoms across machines before deriving routing,
  context, activity, phases and median-session ranges. Usage totals also combine machines.
  Current dates are today minus 29 through today UTC; previous dates are minus 59 through
  minus 30. There is no window or machine selector, machine name, or partial-coverage label.
  Existing single-machine workflow, public HTTP and Discord contracts remain intact.
* **Git stays on one coherent source.** Lines changed and Languages use the newest
  published eligible machine with current-window Git evidence, with deterministic ties.
  These are not exact all-machine Git totals: the wire has no commit identities.
  Discord retains its separate context-only aggregation exception.
* **Inventory shares use counts.** Combine absolute call counts and category denominators,
  including withheld contributions, before deriving shares. Never average stored shares.
  Missing counts stay missing; known subtotals render as lower bounds and percentages
  disappear when their numerator or denominator is incomplete. Withheld names stay private.
* **Consent is checked at both ends.** `publishWorkflow` gates CLI extraction and the
  Stats query even for stored days. `publishCost` separately gates dollars; displayed
  cost retains pricing coverage and sources. Stored evidence is never consent.
* **Flat blocks replace tabs and scan rows.** Order: token/cost headline; tiles; Models
  with subagent routing; Harnesses and Context; Skills; MCP servers; Subagent types;
  The week; Lines changed; Where the time goes and Languages. Missing readings disappear.
  The five tile candidates are active days, sessions, cache hits, run by subagents and
  median session. The page ranks nothing by fit and has no per-row owner controls.
* **Mobile has compact forms and tap details.** Four initial model rows, independent
  more-model and routing controls, visible context waffles, inventory chips, week
  marginals with hourly detail, and pricing-source disclosure. Desktop phase hover
  holds shorter/longer session tracks; mobile shows only the compact phase strip.
* **Median session is a measured range**, excluding waiting and idle, over at least 20
  measured sessions. Print the bucket range and any available previous range, never an
  estimated midpoint or percentage delta. The tile does not require five sessions on
  each side of the phase-track split; upstream measurement gates still apply.
* **Token efficiency is the owner's block** (`workflow-aggregates/v4`). The CLI
  ships `efficiency` atoms per harness day: main-call gap and per-session peak
  histograms, cache re-warm and orphan-write sums, short-session counts,
  tool-result sizes under the fixed vocabulary `TOOL_RESULT_NAMES` (`mcp` and
  `other` for the rest, never a server or user name), and content block counts.
  `getEfficiencyByStackSlug` answers only the stack's creator; everyone else
  reads null. The eight rules live in `packages/workflow-rules/src/efficiency.ts`
  with placeholder thresholds that should become measured population
  percentiles. Tiles lead with the fix; lime is reserved for a passing rule;
  `--warning` is the "worth a look" edge. Dollars need `publishCost` and price
  at the harness's top model rate. Deploy the backend before the CLI release:
  the day validator rejects a block it has no field for.
* **The cut list applies to details too.** No thinking share, late-night commits, turn
  length, parallel projects, project workspaces, web searches per day, effort levels,
  lines-per-commit dots, fan-out records, separate start-hours histogram or duplicate
  Models tab. Session starts survive in the heatmap marginal. Preserve shared rules,
  stored atoms and other consumers; removing presentation does not remove measurement.

## Discord bot

Spec: [docs/specs/discord-bot.md](docs/specs/discord-bot.md). The interactions endpoint is
a Convex `httpAction` (`convex/discordInteractions.ts`); there is no gateway process and
the app needs zero privileged intents.

* **Production command registration is automatic** in
  `.github/workflows/deploy-convex.yml`: after the pinned backend deploy, it waits
  for the matching Coolify renderer revision, updates the canonical global command
  set and verifies readback. Keep `DISCORD_BOT_TOKEN` in GitHub Actions secrets;
  runtime services do not need it. For setup, retries or registration recovery,
  read [docs/discord-release.md](docs/discord-release.md).
* Command names must equal the keys of `COMMANDS` in `convex/discordInteractions.ts`.
  `convex/discordCommandDefinitions.test.ts` fails when they drift.
* Every command sets `integration_types: [0, 1]` (guild install, user install) and
  `contexts: [0, 1, 2]` (guild, bot DM, private channel).
* The owner sets the Developer Portal by hand: Installation > Install contexts, both
  User Install and Guild Install enabled; General Information > Interactions Endpoint URL
  pointing at the Convex site URL plus `/api/discord/interactions`; Bot > Privileged Gateway Intents
  all off.

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
