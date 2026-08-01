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
