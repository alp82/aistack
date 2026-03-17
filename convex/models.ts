import { mutation, query, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { slugifyAscii } from '../src/lib/slug'

const SHORT_ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SHORT_ID_LENGTH = 6

async function generateUniqueShortId(ctx: QueryCtx): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let shortId = ''
    for (let i = 0; i < SHORT_ID_LENGTH; i++) {
      shortId += SHORT_ID_CHARS[Math.floor(Math.random() * SHORT_ID_CHARS.length)]
    }
    const existing = await ctx.db
      .query('models')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .first()
    if (!existing) return shortId
  }
  throw new Error('Failed to generate unique shortId after 10 attempts')
}

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
      shortId: v.optional(v.string()),
      aliases: v.optional(v.array(v.string())),
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
      shortId: m.shortId,
      aliases: m.aliases,
      provider: m.provider,
      category: m.category,
      iconUrl: m.iconUrl,
      websiteUrl: m.websiteUrl,
      contextWindow: m.contextWindow,
      description: m.description,
    }))
  },
})

export const listForEditor = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('models'),
      name: v.string(),
      slug: v.string(),
      shortId: v.optional(v.string()),
      aliases: v.optional(v.array(v.string())),
      provider: v.string(),
      category: ModelCategory,
      iconUrl: v.optional(v.string()),
      websiteUrl: v.optional(v.string()),
      contextWindow: v.optional(v.number()),
      description: v.optional(v.string()),
      reviewStatus: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const approved = await ctx.db
      .query('models')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'approved'))
      .collect()
    const pending = await ctx.db
      .query('models')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()
    const all = [...approved, ...pending]
    return all.map((m) => ({
      _id: m._id,
      name: m.name,
      slug: m.slug,
      shortId: m.shortId,
      aliases: m.aliases,
      provider: m.provider,
      category: m.category,
      iconUrl: m.iconUrl,
      websiteUrl: m.websiteUrl,
      contextWindow: m.contextWindow,
      description: m.description,
      reviewStatus: m.reviewStatus,
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

    // Check for existing model with same name (case-insensitive)
    const allModels = await ctx.db.query('models').collect()
    const normalizedName = args.name.trim().toLowerCase()
    const existingByName = allModels.find(
      (m) => m.name.trim().toLowerCase() === normalizedName
    )
    if (existingByName) {
      throw new Error(`A model with the name "${args.name}" already exists`)
    }

    const baseSlug = slugifyAscii(args.name, 'model')
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

    const shortId = await generateUniqueShortId(ctx)

    const modelId = await ctx.db.insert('models', {
      name: args.name,
      slug,
      shortId,
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
