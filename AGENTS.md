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
never published — `tsup` bundles it into the CLI's `dist`.

* The CLI prices each response at its own timestamp, at ingest. That figure is
  exact and always wins.
* The backend re-prices at READ time in `convex/lib/reprice.ts`, filling gaps
  only. Its figures are LOWER BOUNDS: the wire carries one merged `cacheWrite`
  (so it charges the cheap 5-minute tier, about 8% low for Claude Code), and it
  has no per-response timestamps (so a window straddling a repricing pays the
  cheaper rate).
* Every surface that prints dollars prints the price-table id and the share of
  tokens the figure covers. `publishCost` on the stack is the consent gate —
  check the flag, never the presence of dollars.

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

## Icon Migration

After seeding (or any time `iconUrl` rows on tools/models/bundles need to be
moved into Convex storage), run:

```sh
# Dev: auto-detects the running `convex dev` anonymous backend's admin key
# from ~/.convex/anonymous-convex-backend-state/<deployment>/config.json
pnpm tsx scripts/migrate-icons.ts

# Self-hosted prod — see "Prod database access": run prod operations on the
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

Idempotent — a second run skips every row that already has an
`iconStorageId`. Data URIs are decoded, http URLs are fetched (8s timeout),
ICOs are decoded via `decode-ico` (largest entry), and everything is sharp'd
to 512×512 WebP q80 and uploaded. Data-URI sources are cleared from
`iconUrl`; http-URL sources are kept as the canonical source.
