import { PRICED_LANES, bundledPriceTable } from '@aistack/pricing'
import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

/**
 * Seed `modelPrices` from the bundled `@aistack/pricing` table (#336).
 *
 * Every constant becomes one row per period, cited by the vendor table it came
 * from (`anthropic-list-2026-07-25` and so on), with the cache tiers rendered
 * as absolute rates. Two kinds of key are left out on purpose: the priced
 * lanes (`codex-auto-review`, ADR-0012 decision 7) and the `#fast` variants,
 * which are not catalog slugs. Both keep pricing from the bundled fallback the
 * seam layers underneath the table.
 *
 * IDEMPOTENT. A (modelSlug, provider, from) that already has a row is skipped,
 * so a later import that appended periods is never overwritten.
 */
export const run = internalMutation({
  args: {},
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
    left: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const now = Date.now()
    let inserted = 0
    let skipped = 0
    const left: string[] = []
    for (const row of bundledPriceTable().rows) {
      if (PRICED_LANES.has(row.modelSlug) || row.modelSlug.includes('#')) {
        if (!left.includes(row.modelSlug)) left.push(row.modelSlug)
        continue
      }
      const existing = await ctx.db
        .query('modelPrices')
        .withIndex('by_model', (q) =>
          q.eq('modelSlug', row.modelSlug).eq('provider', row.provider).eq('from', row.from)
        )
        .first()
      if (existing) {
        skipped++
        continue
      }
      await ctx.db.insert('modelPrices', {
        modelSlug: row.modelSlug,
        ...(row.provider !== undefined ? { provider: row.provider } : {}),
        from: row.from,
        input: row.input,
        output: row.output,
        ...(row.cacheRead !== undefined ? { cacheRead: row.cacheRead } : {}),
        ...(row.cacheWrite5m !== undefined ? { cacheWrite5m: row.cacheWrite5m } : {}),
        ...(row.cacheWrite1h !== undefined ? { cacheWrite1h: row.cacheWrite1h } : {}),
        source: row.source,
        createdAt: now,
      })
      inserted++
    }
    return { inserted, skipped, left }
  },
})
