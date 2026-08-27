import type { Doc } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

/**
 * Find a catalog model by slug, then by alias.
 *
 * The authored side (`modelSubscriptions[].modelSlug`) and the measured side
 * both go through the catalog's aliases, so a stack that stored an older
 * spelling shows the model and is not asked to add it again (#294).
 */
export async function findModelBySlugOrAlias(
  ctx: QueryCtx,
  slug: string
): Promise<Doc<'models'> | null> {
  const exact = await ctx.db
    .query('models')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .first()
  if (exact) return exact
  const all = await ctx.db.query('models').collect()
  return all.find((m) => m.aliases?.includes(slug)) ?? null
}
