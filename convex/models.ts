import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const ModelCategory = v.union(
  v.literal('language'),
  v.literal('coding'),
  v.literal('reasoning'),
  v.literal('vision'),
  v.literal('audio'),
  v.literal('image'),
  v.literal('video'),
  v.literal('embedding'),
  v.literal('other')
)

export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('models'),
      name: v.string(),
      slug: v.string(),
      provider: v.string(),
      category: ModelCategory,
      iconUrl: v.optional(v.string()),
      websiteUrl: v.optional(v.string()),
      contextWindow: v.optional(v.number()),
      description: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const models = await ctx.db
      .query('models')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'approved'))
      .collect()
    return models.map((m) => ({
      _id: m._id,
      name: m.name,
      slug: m.slug,
      provider: m.provider,
      category: m.category,
      iconUrl: m.iconUrl,
      websiteUrl: m.websiteUrl,
      contextWindow: m.contextWindow,
      description: m.description,
    }))
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    provider: v.string(),
    category: v.union(
      v.literal('language'),
      v.literal('coding'),
      v.literal('reasoning'),
      v.literal('vision'),
      v.literal('audio'),
      v.literal('image'),
      v.literal('video'),
      v.literal('embedding'),
      v.literal('other')
    ),
    websiteUrl: v.optional(v.string()),
    contextWindow: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  returns: v.id('models'),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')

    const baseSlug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    let slug = baseSlug
    let suffix = 2
    while (
      await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()
    ) {
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    const modelId = await ctx.db.insert('models', {
      name: args.name,
      slug,
      provider: args.provider,
      category: args.category,
      websiteUrl: args.websiteUrl,
      contextWindow: args.contextWindow,
      description: args.description,
      reviewStatus: 'pending',
      createdBy: user.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return modelId
  },
})
