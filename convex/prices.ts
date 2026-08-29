import { v } from 'convex/values'
import { httpAction, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { loadModelCatalog } from './lib/modelCatalog'

/**
 * The price table as the CLI receives it (#336): the `modelPrices` rows in the
 * wire shape `@aistack/pricing` parses, plus a table id. The CLI layers these
 * rows over its bundled constants before pricing at ingest, so a rate change
 * here reaches every sync without a CLI release.
 *
 * The bundled fallback rows are NOT merged in server-side. The CLI holds its
 * own copy and layers it itself, so what this serves is exactly what the table
 * holds, and its id changes only when a row does.
 */
export const currentPriceTable = internalQuery({
  args: {},
  returns: v.object({
    id: v.string(),
    rows: v.array(
      v.object({
        modelSlug: v.string(),
        provider: v.optional(v.string()),
        from: v.number(),
        input: v.number(),
        output: v.number(),
        cacheRead: v.optional(v.number()),
        cacheWrite5m: v.optional(v.number()),
        cacheWrite1h: v.optional(v.number()),
        source: v.string(),
        vendor: v.optional(v.string()),
      })
    ),
  }),
  handler: async (ctx) => {
    const catalog = await loadModelCatalog(ctx)
    return { id: catalog.priceTableId, rows: catalog.priceRows }
  },
})

export const PRICES_PATH = '/api/prices'

/**
 * GET /api/prices. Public and unauthenticated: the rates are list prices, and
 * the CLI fetches them before it has decided whether to log in. Cached for an
 * hour at the edge; the CLI re-fetches on every sync anyway.
 */
export const pricesGet = httpAction(async (ctx) => {
  const table = await ctx.runQuery(internal.prices.currentPriceTable, {})
  return new Response(JSON.stringify(table), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
})
