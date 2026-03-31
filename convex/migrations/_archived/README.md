# Archived Migrations

These migrations have been applied to production and are kept for reference only. Do not re-run them.

| Migration | Purpose | Date archived |
|---|---|---|
| `populateShortIds.ts` | Backfilled `shortId` on tools, models, bundles | 2026-03-31 |
| `backup.ts` | Export/restore utilities for description and shortId migrations | 2026-03-31 |
| `migrateStackDescriptions.ts` | Rewrote inline HTML attributes to use `data-short-id` | 2026-03-31 |
| `migrateBlockToReference.ts` | Renamed `data-ai-*-block` attributes to `data-ai-*-reference` | 2026-03-31 |
| `migrateNotesToDescription.ts` | Renamed `notes` to `description` in subscription arrays | 2026-03-31 |
| `migrateInstructionModel.ts` | Restructured instructions from flat content to `files[]` array | 2026-03-31 |
