import { v } from 'convex/values'
import { internalAction, internalMutation, internalQuery } from '../_generated/server'
import { internal } from '../_generated/api'
import { sha256Hex } from '../httpCli'

/**
 * `cliTokens.tokenHash` - PHASE B of the repo's three-phase schema migration.
 *
 * Wayfinder ticket #49 (map #29). `cliTokens.token` holds the raw bearer with a
 * `by_token` index, so a database read discloses live credentials. Phase A
 * (optional `tokenHash` + `by_tokenHash`, dual write, read-by-hash-with-
 * fallback) is already in schema.ts; this file derives the digest for rows that
 * predate it. Phase C - narrow to required, drop `token` and `by_token` - is
 * ticket #52, batched with the scopes narrow so the two share one deploy cycle.
 *
 * NOBODY HAS TO LOG IN AGAIN, and that is the reason the plaintext column is
 * still there at this point. The digest is derived FROM the stored plaintext, so
 * a column that has already been dropped cannot be backfilled from. Deleting the
 * column and hashing are therefore two deploys, not one, in that order.
 *
 * WHY AN ACTION AND NOT A MUTATION
 * The hash comes from `crypto.subtle.digest`, which lives in the action runtime.
 * A mutation is the wrong place to reach for WebCrypto even where it happens to
 * resolve, so the action reads ids with a query, hashes them, and writes them
 * back with a mutation. The plaintext is in memory for exactly that hop.
 *
 * THE DIRTY-ROW CHECK TESTS PRESENCE, NOT TRUTHINESS
 * `tokenHash` is a string, so an empty string would pass `!row.tokenHash` and
 * silently survive into phase C, which is precisely the failure that blocked a
 * push once already on this repo. The check is `=== undefined`.
 *
 * IDEMPOTENT. A second run finds nothing to do. Safe to run before phase A has
 * finished rolling out and safe to run again afterwards.
 */

const BATCH = 200

export const report = internalQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    hashed: v.number(),
    unhashed: v.number(),
  }),
  handler: async (ctx) => {
    const tokens = await ctx.db.query('cliTokens').collect()
    let hashed = 0
    let unhashed = 0
    for (const token of tokens) {
      // PRESENCE, not truthiness.
      if (token.tokenHash !== undefined) hashed++
      else unhashed++
    }
    return { total: tokens.length, hashed, unhashed }
  },
})

/**
 * The one place the plaintext leaves the database during this migration.
 *
 * Bounded by `BATCH` so a large table does not exceed the action's read limits,
 * and so a failed run redoes at most one batch.
 */
export const listUnhashed = internalQuery({
  args: {},
  returns: v.array(v.object({ id: v.id('cliTokens'), token: v.string() })),
  handler: async (ctx) => {
    const tokens = await ctx.db.query('cliTokens').take(BATCH * 4)
    return tokens
      .filter((t) => t.tokenHash === undefined)
      .slice(0, BATCH)
      // Read through the document rather than the schema type. The narrow this
      // migration exists to unblock DELETES `token` from schema.ts, and this
      // file must still compile afterwards - see `clearPlaintext` for why the
      // two cannot land in one deploy.
      .map((t) => ({ id: t._id, token: String((t as Record<string, unknown>).token ?? '') }))
      .filter((t) => t.token.length > 0)
  },
})

export const setHashes = internalMutation({
  args: {
    rows: v.array(v.object({ id: v.id('cliTokens'), tokenHash: v.string() })),
  },
  returns: v.object({ patched: v.number() }),
  handler: async (ctx, args) => {
    let patched = 0
    for (const row of args.rows) {
      const existing = await ctx.db.get(row.id)
      // Revoked mid-migration, or hashed by a concurrent run. Either way there
      // is nothing to write.
      if (!existing || existing.tokenHash !== undefined) continue
      await ctx.db.patch(row.id, { tokenHash: row.tokenHash })
      patched++
    }
    return { patched }
  },
})

/**
 * THE STEP BETWEEN THE BACKFILL AND THE NARROW (#52).
 *
 * Convex validates every existing document against the new schema on push, and
 * a document carrying a field the schema no longer declares FAILS that check -
 * so dropping `token` from schema.ts is refused while any row still holds one.
 * This blanks the column so the narrow can land.
 *
 * ORDER IS FIXED AND NOT NEGOTIABLE: `backfill` first (the digest is derived
 * FROM the plaintext), then this, then the narrow push. Running this before the
 * backfill destroys the only copy of the plaintext and logs every machine out.
 *
 * PRESENCE, NOT TRUTHINESS. A row whose token is somehow `''` passes
 * `!row.token` and survives straight into a refused push - the exact failure
 * this repo has already hit twice.
 *
 * IDEMPOTENT. A second run finds nothing to clear.
 */
export const clearPlaintext = internalMutation({
  args: {},
  returns: v.object({ cleared: v.number(), remaining: v.number(), unhashed: v.number() }),
  handler: async (ctx) => {
    const tokens = await ctx.db.query('cliTokens').take(BATCH * 4)

    // REFUSE to clear while any row is still unhashed. Clearing one of those
    // would leave a row that can never authenticate and can never be repaired,
    // because the digest can only come from the plaintext being deleted here.
    const unhashed = tokens.filter((t) => t.tokenHash === undefined).length
    if (unhashed > 0) {
      return { cleared: 0, remaining: tokens.length, unhashed }
    }

    let cleared = 0
    for (const token of tokens) {
      // PRESENCE, not truthiness.
      if ((token as Record<string, unknown>).token === undefined) continue
      await ctx.db.patch(token._id, { token: undefined } as never)
      cleared++
    }

    const all = await ctx.db.query('cliTokens').collect()
    const remaining = all.filter(
      (t) => (t as Record<string, unknown>).token !== undefined,
    ).length
    return { cleared, remaining, unhashed: 0 }
  },
})

export const backfill = internalAction({
  args: {},
  returns: v.object({ patched: v.number(), rounds: v.number() }),
  handler: async (ctx) => {
    let patched = 0
    let rounds = 0

    // Loops because `listUnhashed` is batched. Terminates when a round finds
    // nothing left, which is also what makes a second invocation a no-op.
    for (;;) {
      const pending = await ctx.runQuery(
        internal.migrations['20260729_cli_token_hash'].listUnhashed,
        {},
      )
      if (pending.length === 0) break
      rounds++

      const rows = []
      for (const row of pending) {
        rows.push({ id: row.id, tokenHash: await sha256Hex(row.token) })
      }
      const result = await ctx.runMutation(
        internal.migrations['20260729_cli_token_hash'].setHashes,
        { rows },
      )
      patched += result.patched

      // Every row came back unhashed and none could be written - a revoked or
      // concurrently-hashed batch. Without this the loop would spin forever on
      // the same rows.
      if (result.patched === 0) break
    }

    return { patched, rounds }
  },
})
