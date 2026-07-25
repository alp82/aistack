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
  args: {
    userCode: v.string(),
    /**
     * The stack this machine will sync its measured layer to (#33 decision 7).
     * Optional because a profile with no stack yet can still authorize the CLI
     * for its other commands — such a token simply cannot publish until it is
     * re-linked.
     */
    stackId: v.optional(v.id('stacks')),
  },
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

    // Verify the chosen stack is actually the approving user's. Without this the
    // selector's value is caller-supplied and a token could be bound to someone
    // else's stack — and a snapshot written there is immutable.
    if (args.stackId) {
      const stack = await ctx.db.get(args.stackId)
      if (!stack) throw new Error('Stack not found')
      const creator = await ctx.db.get(stack.creatorId)
      if (!creator || creator.userId !== userId) {
        throw new Error('Not authorized to link that stack')
      }
    }

    await ctx.db.patch(session._id, {
      status: 'approved',
      userId,
      stackId: args.stackId,
    })
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
      // Carried from the approval, which is the only moment the user was asked.
      // The token is the binding (#33 decision 7) — there is no `primary` flag
      // anywhere, and most-recent-wins was rejected as a footgun.
      stackId: session.stackId,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
      lastUsedAt: args.lastUsedAt,
    })

    await ctx.db.delete(args.sessionId)
    return { token: args.token }
  },
})
