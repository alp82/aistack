import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { generateUniqueShortId } from '../lib/ids'

/** Add the distinct model identity emitted by released Grok Build usage files. */
export const run = internalMutation({
  args: {},
  returns: v.object({ inserted: v.boolean() }),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('models')
      .withIndex('by_slug', (q) => q.eq('slug', 'grok-4.6-build'))
      .first()
    if (existing) return { inserted: false }

    const now = Date.now()
    await ctx.db.insert('models', {
      name: 'Grok 4.6 Build',
      slug: 'grok-4.6-build',
      shortId: await generateUniqueShortId(ctx, 'models'),
      provider: 'xAI',
      category: 'coding',
      contextWindow: 500000,
      websiteUrl: 'https://x.ai/cli',
      description: 'Grok model identity recorded by the Grok Build coding agent',
      iconUrl: 'https://models.dev/logos/xai.svg',
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    })
    return { inserted: true }
  },
})
