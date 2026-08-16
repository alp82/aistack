import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'
import { FULL_CLI_TOKEN_SCOPES } from '../lib/cliScopes'

/**
 * `cliTokens.scopes` - PHASE B of the repo's three-phase schema migration.
 *
 * Wayfinder ticket #52 (map #29). Phase A (optional `scopes`, written on every
 * mint) is in schema.ts. This fills in the rows minted before the field
 * existed. Phase C narrows to required, in the SAME deploy as the `tokenHash`
 * narrow - batching the two is the whole reason #49 split this ticket off.
 *
 * WHAT AN EXISTING ROW GETS: the FULL set. Those tokens were issued when there
 * was nothing to restrict, so they hold a full grant already - writing anything
 * narrower would revoke access the user never asked to revoke, silently, on a
 * machine that was working a minute ago.
 *
 * A MUTATION, NOT AN ACTION, and the contrast with the hash backfill is the
 * point: that one needed WebCrypto and therefore the action runtime. This one
 * derives nothing, so it stays in the database layer where it belongs.
 *
 * THE DIRTY-ROW CHECK TESTS PRESENCE, NOT TRUTHINESS. `scopes` is an array, and
 * `[]` is truthy in JavaScript while an empty grant is a perfectly real value
 * to store - so `!row.scopes` would be wrong in both directions. The check is
 * `=== undefined`. This is the failure that blocked a push on this repo before.
 *
 * IDEMPOTENT. A second run finds nothing to do.
 */

const BATCH = 500

export const report = internalQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    scoped: v.number(),
    unscoped: v.number(),
  }),
  handler: async (ctx) => {
    const tokens = await ctx.db.query('cliTokens').collect()
    let scoped = 0
    let unscoped = 0
    for (const token of tokens) {
      // PRESENCE, not truthiness.
      if (token.scopes !== undefined) scoped++
      else unscoped++
    }
    return { total: tokens.length, scoped, unscoped }
  },
})

export const backfill = internalMutation({
  args: {},
  returns: v.object({ patched: v.number(), remaining: v.number() }),
  handler: async (ctx) => {
    const tokens = await ctx.db.query('cliTokens').take(BATCH)
    let patched = 0
    for (const token of tokens) {
      if (token.scopes !== undefined) continue
      await ctx.db.patch(token._id, { scopes: FULL_CLI_TOKEN_SCOPES })
      patched++
    }
    const report = await ctx.db.query('cliTokens').collect()
    const remaining = report.filter((t) => t.scopes === undefined).length
    return { patched, remaining }
  },
})

/**
 * The apiRateLimits rename (#52) rides along, because it gates the same narrow.
 *
 * `apiRateLimits.ip` became `apiRateLimits.key`, and the usual three-phase data
 * migration does not apply: every row is dead 60 seconds after it is written,
 * so there is nothing to preserve. The hourly cleanup cron drains the keyless
 * rows on its own within the hour - this exists so the narrow does not have to
 * WAIT for it.
 *
 * Deletes rather than backfills. A row still holding `ip` is by definition
 * expired, and resurrecting an expired window as a `key` row would hand its
 * caller a stale count instead of the fresh one they have earned.
 */
export const purgeKeylessRateLimits = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number(), remaining: v.number() }),
  handler: async (ctx) => {
    const rows = await ctx.db.query('apiRateLimits').take(BATCH * 4)
    let deleted = 0
    for (const row of rows) {
      // PRESENCE, not truthiness - an empty-string key would survive `!row.key`
      // straight into the narrow.
      if (row.key !== undefined) continue
      await ctx.db.delete(row._id)
      deleted++
    }
    const all = await ctx.db.query('apiRateLimits').collect()
    return { deleted, remaining: all.filter((r) => r.key === undefined).length }
  },
})
