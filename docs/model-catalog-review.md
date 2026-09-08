# Model catalog review

`models.name` is the canonical display name used across the site. Keep the
family name and version consistent with sibling models: `Claude Fable 5`,
`Claude Fable 5.1`, and `Claude Opus 5`.

Before approving an imported model, check its display name against the existing
family. Upstream datasets supply candidate names and may omit the family prefix
or use a raw API id. Correct those names in the catalog before approval. Review
every pending name before using **Approve all**. Existing rows keep their curated
names when the daily import updates prices and metadata.

Keep API ids in `slug` and alternate ids in `aliases`. A display-name correction
changes `name` only; it does not rename slugs or rewrite measured usage or prices.
Use an idempotent Convex migration for corrections to existing rows. Consumers
resolving measured ids use `resolveModelId` from `convex/lib/modelCatalog.ts` and
fall back to the raw id when the catalog has no match.

The correction for the older `Fable 5` row is
`migrations/20260908_model_display_names:run`. Run it locally after syncing the
production snapshot. For production, deploy through the GitHub Actions workflow
first, then run:

```sh
scripts/convex-prod.sh run migrations/20260908_model_display_names:run
```
