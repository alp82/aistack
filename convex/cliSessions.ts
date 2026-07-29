import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { isDisplaySafeName } from './lib/names'
import { FULL_CLI_TOKEN_SCOPES } from './lib/cliScopes'

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

/**
 * What a pending session will call this machine, for the approval page (#49).
 *
 * Returns ONLY the proposed name — never the secretId, never the status. The
 * user code is a shared secret shown in the terminal, but it is six characters,
 * so this is gated on being signed in as well: a guessed code should not read
 * back a stranger's hostname.
 */
export const getPendingMachineName = query({
  args: { userCode: v.string() },
  returns: v.union(v.object({ machineName: v.optional(v.string()) }), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return null

    const session = await ctx.db
      .query('cliSessions')
      .withIndex('by_userCode', (q) => q.eq('userCode', args.userCode))
      .first()
    if (!session) return null
    if (session.status !== 'pending') return null
    if (session.expiresAt <= Date.now()) return null
    return { machineName: session.machineName }
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
    /**
     * The name the user settled on for this machine (#49), prefilled from the
     * CLI's proposal and editable. Optional because clearing the field is a
     * legitimate answer — `/settings/machines` then falls back to the linked
     * date.
     */
    machineName: v.optional(v.string()),
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

    // The name is the user's own string typed into a form, so it gets the same
    // bound as every other client-supplied name (#45). A blank field clears the
    // CLI's proposal rather than keeping it — the user deleted it on purpose.
    const proposed = args.machineName?.trim() ?? ''
    if (proposed.length > 0 && !isDisplaySafeName(proposed)) {
      throw new Error('Machine name must be 64 characters or fewer and printable')
    }

    await ctx.db.patch(session._id, {
      status: 'approved',
      userId,
      stackId: args.stackId,
      machineName: proposed.length > 0 ? proposed : undefined,
    })
    return null
  },
})

export const createSession = internalMutation({
  args: {
    userCode: v.string(),
    secretId: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('expired')),
    machineName: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  returns: v.id('cliSessions'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('cliSessions', {
      userCode: args.userCode,
      secretId: args.secretId,
      status: args.status,
      machineName: args.machineName,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
    })
  },
})

/**
 * Hourly GC for the device-code table (#52).
 *
 * `authStart` is UNAUTHENTICATED and inserts one row per call, so this table is
 * the unbounded-growth half of the login path. A rate limit does not close it:
 * even at the cap, a 15-minute TTL is long enough to accumulate a great many
 * rows, and nothing ever deleted them.
 *
 * It also collects abandoned MACHINE NAMES. #49 stores the CLI's proposed
 * hostname on the pending session, so a login the user never approves leaves
 * that string on the server indefinitely. Here it leaves with the row.
 *
 * A row is collectible once `expiresAt` has passed — `authPoll` already treats
 * that as expired, so nothing readable is lost. An APPROVED row is collected on
 * the same terms: `issueTokenAndDeleteSession` deletes it on success, so an
 * approved row that outlives its TTL is one the CLI stopped polling for.
 *
 * Modelled on `rateLimit.cleanupExpiredRateLimits`: index-driven, batched, and
 * never a full-table scan.
 */
export const cleanupExpiredSessions = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query('cliSessions')
      .withIndex('by_expiresAt', (q) => q.lte('expiresAt', Date.now()))
      .take(500)
    let deleted = 0
    for (const row of expired) {
      await ctx.db.delete(row._id)
      deleted++
    }
    return { deleted }
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

/**
 * Mint the token and consume the device-code session, in one transaction.
 *
 * TAKES THE DIGEST, NEVER THE TOKEN (#52). The raw bearer is generated in the
 * `httpAction` and hashed there, so it is returned to the CLI by the action
 * that already holds it and never enters the database layer at all. The
 * plaintext argument this used to carry went with the column.
 */
export const issueTokenAndDeleteSession = internalMutation({
  args: {
    sessionId: v.id('cliSessions'),
    tokenHash: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastUsedAt: v.number(),
  },
  returns: v.union(v.object({ issued: v.literal(true) }), v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session || session.status !== 'approved') return null

    await ctx.db.insert('cliTokens', {
      tokenHash: args.tokenHash,
      // Carried from the approval, which is the one moment the user was asked
      // what to call this machine (#49).
      name: session.machineName,
      userId: args.userId,
      // Full, always (#52) — see convex/lib/cliScopes.ts for why there is no
      // grant picker on the approval page.
      scopes: FULL_CLI_TOKEN_SCOPES,
      // Carried from the approval, which is the only moment the user was asked.
      // The token is the binding (#33 decision 7) — there is no `primary` flag
      // anywhere, and most-recent-wins was rejected as a footgun.
      stackId: session.stackId,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
      lastUsedAt: args.lastUsedAt,
    })

    await ctx.db.delete(args.sessionId)
    return { issued: true as const }
  },
})
