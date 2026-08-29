import {
  type PriceRow,
  type Pricer,
  type Vendor,
  layeredPricer,
  parseMeasuredId,
  priceTableId,
  vendorModelId,
} from '@aistack/pricing'
import type { Doc } from '../_generated/dataModel'
import type { QueryCtx, MutationCtx } from '../_generated/server'

/**
 * The single read seam over `models` and `modelPrices` (ADR-0012 decision 13,
 * #336). Nothing else reads `modelPrices`.
 *
 * READ ONCE, NOT ONCE PER MODEL. A single reading resolves a handful of ids,
 * so a per-id indexed read was fine; the series resolves every reading in the
 * window, and a per-id read there would multiply one page view by the number
 * of syncs. One collect per table answers all of them.
 *
 * PRICES LAYER OVER THE BUNDLED CONSTANTS. A key the table holds is priced by
 * the table; a key it lacks (the priced lanes, `#fast`, a model the import has
 * not reached) falls through to `packages/pricing`. Either way the figure
 * cites the period's own `source`.
 */
export type ModelCatalog = {
  bySlug: Map<string, Doc<'models'>>
  byAlias: Map<string, Doc<'models'>>
  /** The table id of the served rows, for the wire and the logs. */
  priceTableId: string
  /** The rows as the CLI receives them. */
  priceRows: PriceRow[]
  pricer: Pricer
  /** The rate in effect for a catalog slug at a moment, per the seam's contract. */
  priceAt: (slug: string, provider: string | null, atMs: number) => ReturnType<Pricer['priceAt']>
}

/** The catalog's provider name as the pricing vendor it stands for. */
export function vendorOfProvider(provider: string | undefined): Vendor | null {
  const p = (provider ?? '').trim().toLowerCase()
  if (p === 'anthropic') return 'anthropic'
  if (p === 'openai') return 'openai'
  if (p === 'google' || p === 'google deepmind') return 'google'
  return null
}

/** The served row for one stored period. Wire-only fields are added here. */
function toPriceRow(row: Doc<'modelPrices'>, vendor: Vendor | null): PriceRow {
  return {
    modelSlug: row.modelSlug,
    ...(row.provider !== undefined ? { provider: row.provider } : {}),
    from: row.from,
    input: row.input,
    output: row.output,
    ...(row.cacheRead !== undefined ? { cacheRead: row.cacheRead } : {}),
    ...(row.cacheWrite5m !== undefined ? { cacheWrite5m: row.cacheWrite5m } : {}),
    ...(row.cacheWrite1h !== undefined ? { cacheWrite1h: row.cacheWrite1h } : {}),
    source: row.source,
    ...(vendor && row.provider === undefined ? { vendor } : {}),
  }
}

/** Build the catalog from rows already in hand. Tests and the loader share it. */
export function catalogFrom(
  models: readonly Doc<'models'>[],
  prices: readonly Doc<'modelPrices'>[]
): ModelCatalog {
  const bySlug = new Map<string, Doc<'models'>>()
  const byAlias = new Map<string, Doc<'models'>>()
  for (const row of models) {
    if (!bySlug.has(row.slug)) bySlug.set(row.slug, row)
    for (const alias of row.aliases ?? []) {
      if (!byAlias.has(alias)) byAlias.set(alias, row)
    }
  }
  const vendorOf = (slug: string): Vendor | null =>
    vendorOfProvider((bySlug.get(slug) ?? byAlias.get(slug))?.provider)
  const priceRows = prices.map((row) => toPriceRow(row, vendorOf(row.modelSlug)))
  const id = priceTableId(priceRows)
  const pricer = layeredPricer({ id, rows: priceRows }, vendorOf)
  return {
    bySlug,
    byAlias,
    priceTableId: id,
    priceRows,
    pricer,
    priceAt: (slug, provider, atMs) =>
      pricer.priceAt(provider === null ? slug : `${provider}:${slug}`, atMs),
  }
}

export async function loadModelCatalog(ctx: QueryCtx | MutationCtx): Promise<ModelCatalog> {
  const [models, prices] = await Promise.all([
    ctx.db.query('models').collect(),
    ctx.db.query('modelPrices').collect(),
  ])
  return catalogFrom(models, prices)
}

/**
 * One measured id against the catalog (ADR-0012 decision 6): strip the
 * provider prefix, the `#fast` suffix and a dated suffix, then the slug, then
 * the stored aliases. The raw id is tried first so an alias that carries a
 * provider or a date still matches.
 *
 * An unresolved id keeps its tokens and its cost and reports a null slug. That
 * is the honest failure: the alternative, dropping it, is exactly the silent
 * disappearance #33 decision 3 exempted model ids to prevent.
 */
export function resolveModelId(
  catalog: ModelCatalog,
  id: string
): { catalogSlug: string | null; catalogName: string | null } {
  const bare = vendorModelId(id)
  const { slug } = parseMeasuredId(id)
  const match =
    catalog.bySlug.get(id) ??
    catalog.byAlias.get(id) ??
    catalog.bySlug.get(bare) ??
    catalog.byAlias.get(bare) ??
    catalog.bySlug.get(slug) ??
    catalog.byAlias.get(slug) ??
    null
  return {
    catalogSlug: match?.slug ?? null,
    catalogName: match?.name ?? null,
  }
}

/** The catalog row an authored pick names, by slug then alias. */
export function findInCatalog(catalog: ModelCatalog, slug: string): Doc<'models'> | null {
  return catalog.bySlug.get(slug) ?? catalog.byAlias.get(slug) ?? null
}
