import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

/**
 * `cliTokens.stackId` — PHASE B of the repo's three-phase schema migration.
 *
 * Wayfinder ticket #38 (map #29), decision 7 of the wire-format grilling #33:
 * the sync target is bound to the token at link time, so `cliTokens` gains a
 * `stackId`. Phase A (widen to `v.optional`) is already in schema.ts; this file
 * is the relink pass; phase C narrows to required.
 *
 * WHY THREE PHASES EVEN THOUGH THE FIELD IS NEW
 * The repo's migration gotcha, learned the hard way: convexTest runs in-memory
 * against a fresh database and passes green, while the real `convex deploy`
 * refuses a schema that existing rows violate — surfacing as an
 * ArgumentValidationError in the browser, not at deploy time. `cliTokens` has
 * live rows (every machine that ever ran `aistack login`), so a required field
 * cannot land in one step.
 *
 * THE DIRTY-ROW CHECK TESTS PRESENCE, NOT TRUTHINESS
 * `stackId` is an Id, so `!row.stackId` and `row.stackId === undefined` happen
 * to agree here — but the check is written as a presence test anyway, because
 * the last time this rule was ignored an empty-string field passed a truthiness
 * check and blocked the narrow.
 *
 * WHAT THIS BACKFILL WILL AND WILL NOT DO
 * A pre-existing token was issued before anyone was asked which stack it syncs
 * to, so there is no recorded intent to recover. Two cases:
 *
 *   - The owner has exactly ONE stack. The choice is unambiguous, so the token
 *     is linked to it. This is the case that made `getFirstStackByCreator`
 *     tolerable in the first place.
 *   - The owner has zero or several. There is no safe guess. Guessing here would
 *     silently point a machine's measured layer at a stack the user never chose,
 *     and snapshots are immutable — so the token is left unlinked and reported.
 *     `publishForToken` rejects it with an actionable message ("run login
 *     again"), and the user re-links by re-authenticating.
 *
 * Phase C is therefore gated on the ambiguous set being empty, which in practice
 * means waiting for those users to re-authenticate. Until then the field stays
 * optional — which is correct, not a leftover: a profile with no stack at all
 * has nothing to bind, so `stackId` may be legitimately absent forever. See the
 * deferral note in the resolution comment on #38.
 */

export const report = internalQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    alreadyLinked: v.number(),
    linkable: v.number(),
    ambiguous: v.number(),
    noCreator: v.number(),
  }),
  handler: async (ctx) => {
    const tokens = await ctx.db.query('cliTokens').collect()
    let alreadyLinked = 0
    let linkable = 0
    let ambiguous = 0
    let noCreator = 0

    for (const token of tokens) {
      // PRESENCE, not truthiness.
      if (token.stackId !== undefined) {
        alreadyLinked++
        continue
      }
      const creator = await ctx.db
        .query('creators')
        .withIndex('by_userId', (q) => q.eq('userId', token.userId))
        .first()
      if (!creator) {
        noCreator++
        continue
      }
      const stacks = await ctx.db
        .query('stacks')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
        .collect()
      if (stacks.length === 1) linkable++
      else ambiguous++
    }

    return {
      total: tokens.length,
      alreadyLinked,
      linkable,
      ambiguous,
      noCreator,
    }
  },
})

export const relinkUnambiguous = internalMutation({
  args: {},
  returns: v.object({
    linked: v.number(),
    leftUnlinked: v.number(),
  }),
  handler: async (ctx) => {
    const tokens = await ctx.db.query('cliTokens').collect()
    let linked = 0
    let leftUnlinked = 0

    for (const token of tokens) {
      if (token.stackId !== undefined) continue

      const creator = await ctx.db
        .query('creators')
        .withIndex('by_userId', (q) => q.eq('userId', token.userId))
        .first()
      if (!creator) {
        leftUnlinked++
        continue
      }
      const stacks = await ctx.db
        .query('stacks')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
        .collect()
      if (stacks.length !== 1) {
        leftUnlinked++
        continue
      }
      await ctx.db.patch(token._id, { stackId: stacks[0]._id })
      linked++
    }

    return { linked, leftUnlinked }
  },
})
