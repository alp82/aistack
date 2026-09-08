import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

/** Correct the catalog display name seeded before the vendor-id migration. */
export const run = internalMutation({
  args: {},
  returns: v.object({ renamed: v.array(v.string()) }),
  handler: async (ctx) => {
    const row = await ctx.db
      .query('models')
      .withIndex('by_slug', (q) => q.eq('slug', 'claude-fable-5'))
      .unique()
    if (!row || row.name === 'Claude Fable 5') return { renamed: [] }
    await ctx.db.patch(row._id, {
      name: 'Claude Fable 5',
      updatedAt: Date.now(),
    })
    return { renamed: [row.slug] }
  },
})
