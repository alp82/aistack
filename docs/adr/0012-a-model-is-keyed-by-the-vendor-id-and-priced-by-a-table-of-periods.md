# A model is keyed by the vendor's bare API id, and its price history is a table of dated periods

Before this decision the catalog slug was user-minted (`claude-opus-47`, `gpt-5-2`,
`fable-5`), the price table was a constant in `packages/pricing` keyed by the vendor id, and
`resolveModelId` guessed the join at read time through slug, then aliases, then the bare
id. 21 of 45 prod rows did not match the vendor id, 10 of 27 price keys reached no row,
and every dollar figure cited a per-vendor table constant.

We decided that **the catalog slug equals the vendor's bare API id**, dots included
(`gpt-5.4`, `kimi-k2.5`), and that **prices live in a `modelPrices` table** with one row per
dated period: `{modelSlug, provider?, from, input, output, cacheRead?, cacheWrite5m?,
cacheWrite1h?, source}`, indexed by `[modelSlug, provider, from]` and by `[from]`. A period
runs until the next period's `from`; there is no `to`. The `source` on each period is the
citation a surface prints, so the table id moves from a vendor constant to the row that
priced the tokens. Cache tiers are absolute rates per period, because models.dev reports
them that way and a vendor-level multiplier is wrong for at least one Google model. An
unset `provider` is the vendor's own rate; a gateway that re-serves a model gets its own
row or stays unpriced. `models` carries no price field at all: unpriced is an empty read,
free is a real zero-rate period cited `local-no-charge`.

Two alternatives lost. **A `vendorId` field beside a dashed slug** keeps two spellings of
one key, which is what the misalignment came from. **A `pricePeriods` array on the model
row** is readable in the dashboard but makes every import operation a read-modify-write
of one document: a cron append racing an admin edit loses a period silently, "what
changed this week" needs a second log table, and a backfill correction rewrites the
whole array. The table is the log, appends are single inserts, and a correction touches
one row. The read side hides the choice: `loadModelCatalog` collects both tables and
exposes one `priceAt(slug, provider, timestamp)`, and nothing else reads `modelPrices`.

`codex-auto-review` is Codex's review lane, not a model a person chooses. It is priced
and never a catalog row, so its spend counts and the model list stays honest. Measured ids
resolve by rule before lookup: strip the `provider:` prefix, a `#fast` suffix and a
trailing `-YYYYMMDD` date, then match the slug, then the stored `aliases`. A pending row
is auto-created only for a measured id with tokens in the days, never from inventory
`modelsSeen`, which lists what a harness offers rather than what it used.
