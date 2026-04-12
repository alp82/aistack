import { internalMutation, internalQuery, query } from './_generated/server'
import { v } from 'convex/values'

export const getByToken = internalQuery({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      userId: v.string(),
      _id: v.id('cliTokens'),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('cliTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first()
    if (!doc) return null
    if (doc.expiresAt <= Date.now()) return null
    return { userId: doc.userId, _id: doc._id }
  },
})

export const listByUser = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('cliTokens'),
      name: v.optional(v.string()),
      createdAt: v.number(),
      lastUsedAt: v.number(),
      expiresAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return []
    const userId = user.tokenIdentifier.split('|')[1]

    const tokens = await ctx.db
      .query('cliTokens')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()

    return tokens.map((t) => ({
      _id: t._id,
      name: t.name,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
      expiresAt: t.expiresAt,
    }))
  },
})

export const createToken = internalMutation({
  args: {
    token: v.string(),
    userId: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastUsedAt: v.number(),
  },
  returns: v.id('cliTokens'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('cliTokens', {
      token: args.token,
      userId: args.userId,
      name: args.name,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
      lastUsedAt: args.lastUsedAt,
    })
  },
})

export const refreshToken = internalMutation({
  args: {
    id: v.id('cliTokens'),
    lastUsedAt: v.number(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastUsedAt: args.lastUsedAt,
      expiresAt: args.expiresAt,
    })
    return null
  },
})
