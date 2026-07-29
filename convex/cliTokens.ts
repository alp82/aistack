import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { CliTokenScope, FULL_CLI_TOKEN_SCOPES } from './lib/cliScopes'

/**
 * The stored shape of a validated bearer, shared by both lookup paths.
 *
 * Deliberately narrow: an httpAction only ever needs to know who the caller is,
 * where their measured layer goes, and what they are allowed to do. Nothing
 * here can be widened into a credential.
 */
const TOKEN_LOOKUP = v.union(
  v.object({
    userId: v.string(),
    _id: v.id('cliTokens'),
    // The stack this machine syncs to, bound at link time (#33 decision 7).
    // Absent on tokens issued before that binding existed — those must
    // re-authenticate to pick one; see convex/migrations/20260725_cli_token_stack.ts.
    stackId: v.optional(v.id('stacks')),
    // What this machine may do (#52). Absent on rows the scopes backfill has
    // not reached, which the enforcement point reads as full access — those
    // tokens were minted before any scope existed and were granted everything.
    scopes: v.optional(v.array(CliTokenScope)),
  }),
  v.null(),
)

/**
 * PHASE A FALLBACK ONLY — the plaintext read, kept alive so a token minted
 * before the backfill still authenticates.
 *
 * This is the function whose existence is the security hole the migration
 * closes, so #52's narrow deletes it rather than leaving it to rot. Do not add
 * callers.
 */
export const getByToken = internalQuery({
  args: { token: v.string() },
  returns: TOKEN_LOOKUP,
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('cliTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first()
    if (!doc) return null
    if (doc.expiresAt <= Date.now()) return null
    return { userId: doc.userId, _id: doc._id, stackId: doc.stackId, scopes: doc.scopes }
  },
})

/**
 * The read path (#49). The caller hashes in the `httpAction` and passes only the
 * digest, so plaintext never reaches the database layer.
 *
 * `by_tokenHash` is a sparse index while `tokenHash` is optional: rows the
 * backfill has not reached yet are simply absent from it, which is why
 * `getByToken` still exists as a fallback until #52 runs the narrow.
 */
export const getByTokenHash = internalQuery({
  args: { tokenHash: v.string() },
  returns: TOKEN_LOOKUP,
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('cliTokens')
      .withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash))
      .first()
    if (!doc) return null
    if (doc.expiresAt <= Date.now()) return null
    return { userId: doc.userId, _id: doc._id, stackId: doc.stackId, scopes: doc.scopes }
  },
})

/**
 * The machines linked to the signed-in account, for `/settings/machines` (#49).
 *
 * Values-free by construction — no `token`, no `tokenHash`. A revoke surface
 * that echoed the credential back would hand every XSS a live bearer.
 *
 * The list is ACCOUNT-scoped, not stack-scoped, which is why this page exists
 * rather than a section on `/stacks/{slug}/changes`: `approveSession` allows a
 * stack-less link, so a per-stack list would leave those tokens with no page to
 * appear on and therefore no way to revoke them.
 */
export const listByUser = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('cliTokens'),
      name: v.optional(v.string()),
      createdAt: v.number(),
      lastUsedAt: v.number(),
      expiresAt: v.number(),
      // Resolved here rather than in the client: the page shows where a machine
      // publishes, and a raw Id says nothing. Null when the token predates
      // link-time binding, or when the stack has since been deleted — both of
      // which render as "not linked to a stack".
      stack: v.union(v.object({ name: v.string(), slug: v.string() }), v.null()),
      // What this machine may do (#52). Resolved to the full set for a row the
      // backfill has not reached, because that is what the page must say: an
      // unscoped token really can do everything, and rendering an empty line
      // would understate what the user is looking at.
      scopes: v.array(CliTokenScope),
    }),
  ),
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return []
    const userId = user.tokenIdentifier.split('|')[1]

    const tokens = await ctx.db
      .query('cliTokens')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()

    const rows = []
    for (const t of tokens) {
      const stack = t.stackId ? await ctx.db.get(t.stackId) : null
      rows.push({
        _id: t._id,
        name: t.name,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
        expiresAt: t.expiresAt,
        stack: stack ? { name: stack.name, slug: stack.slug } : null,
        scopes: t.scopes ?? FULL_CLI_TOKEN_SCOPES,
      })
    }
    // Most recently used first — the machine you are sitting at is the one you
    // are most likely to recognize, and it anchors the rest of the list.
    rows.sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    return rows
  },
})

/**
 * Revoke one machine (#49).
 *
 * DELETES THE ROW rather than flagging it. A revoked-but-present row can be
 * resurrected by a bug, nothing in the tree reads a revocation audit trail, and
 * after phase C the row holds no recoverable secret anyway — so keeping it would
 * buy a history no surface shows. Deletion is also exactly what the button
 * promises the user.
 *
 * This matters more than it looks because the TTL is SLIDING: `refreshToken`
 * pushes `expiresAt` out 90 days on every successful request, so a machine that
 * syncs weekly never expires and "wait it out" is not a remedy.
 */
export const revokeToken = mutation({
  args: { id: v.id('cliTokens') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const token = await ctx.db.get(args.id)
    // Already gone is a success: the user asked for this machine to stop
    // working, and it does not work. Throwing would make a double-click an
    // error dialog.
    if (!token) return null
    if (token.userId !== userId) throw new Error('Not authorized to revoke that machine')

    await ctx.db.delete(args.id)
    return null
  },
})

/**
 * DELETED BY #52's NARROW. No callers — `cliSessions.issueTokenAndDeleteSession`
 * is the one path that mints a token — but it does carry a `token: v.string()`
 * argument writing the plaintext column, so a dead second writer surviving the
 * narrow would be a way to put the credential back.
 */
export const createToken = internalMutation({
  args: {
    token: v.string(),
    tokenHash: v.string(),
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
      tokenHash: args.tokenHash,
      userId: args.userId,
      name: args.name,
      scopes: FULL_CLI_TOKEN_SCOPES,
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
    // A revoked machine that has a request in flight must not resurrect its own
    // row. `patch` on a deleted id throws, so the check is not decorative.
    const existing = await ctx.db.get(args.id)
    if (!existing) return null
    await ctx.db.patch(args.id, {
      lastUsedAt: args.lastUsedAt,
      expiresAt: args.expiresAt,
    })
    return null
  },
})
