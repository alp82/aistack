import { internalMutation, internalQuery, mutation } from './_generated/server'
import { v } from 'convex/values'

export const getByUserCode = internalQuery({
  args: { userCode: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('cliSessions'),
      userCode: v.string(),
      secretId: v.string(),
      status: v.union(v.literal('pending'), v.literal('approved'), v.literal('expired')),
      userId: v.optional(v.string()),
      createdAt: v.number(),
      expiresAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('cliSessions')
      .withIndex('by_userCode', (q) => q.eq('userCode', args.userCode))
      .first()
    if (!session) return null
    if (session.status !== 'pending') return null
    if (session.expiresAt <= Date.now()) return null
    return {
      _id: session._id,
      userCode: session.userCode,
      secretId: session.secretId,
      status: session.status,
      userId: session.userId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }
  },
})

export const getBySecretId = internalQuery({
  args: { secretId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('cliSessions'),
      userCode: v.string(),
      secretId: v.string(),
      status: v.union(v.literal('pending'), v.literal('approved'), v.literal('expired')),
      userId: v.optional(v.string()),
      createdAt: v.number(),
      expiresAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('cliSessions')
      .withIndex('by_secretId', (q) => q.eq('secretId', args.secretId))
      .first()
    if (!session) return null
    return {
      _id: session._id,
      userCode: session.userCode,
      secretId: session.secretId,
      status: session.status,
      userId: session.userId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }
  },
})

export const approveSession = mutation({
  args: { userCode: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const session = await ctx.db
      .query('cliSessions')
      .withIndex('by_userCode', (q) => q.eq('userCode', args.userCode))
      .first()
    if (!session) throw new Error('Session not found')
    if (session.status !== 'pending') throw new Error('Session is not pending')
    if (session.expiresAt <= Date.now()) throw new Error('Session has expired')

    await ctx.db.patch(session._id, { status: 'approved', userId })
    return null
  },
})

export const createSession = internalMutation({
  args: {
    userCode: v.string(),
    secretId: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('expired')),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  returns: v.id('cliSessions'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('cliSessions', {
      userCode: args.userCode,
      secretId: args.secretId,
      status: args.status,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
    })
  },
})

export const deleteSession = internalMutation({
  args: { id: v.id('cliSessions') },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return null
  },
})

export const issueTokenAndDeleteSession = internalMutation({
  args: {
    sessionId: v.id('cliSessions'),
    token: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastUsedAt: v.number(),
  },
  returns: v.union(v.object({ token: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session || session.status !== 'approved') return null

    await ctx.db.insert('cliTokens', {
      token: args.token,
      userId: args.userId,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
      lastUsedAt: args.lastUsedAt,
    })

    await ctx.db.delete(args.sessionId)
    return { token: args.token }
  },
})
