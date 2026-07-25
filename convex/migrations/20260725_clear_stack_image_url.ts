import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

/**
 * `stacks.stackImageUrl` — the clear pass the profile-decoupling narrow needed
 * and never got. PHASE B of the repo's three-phase schema migration.
 *
 * WHAT WENT WRONG
 * The field was retired in 64ce4f1 (#22, profile decoupling): Phase B moved
 * stack avatars onto the creator and cleared the dying identity fields, Phase C
 * dropped the field from the validator. But Phase B's clear tested truthiness:
 *
 *   if (stack.stackImageUrl && clearImageUrl) patch.stackImageUrl = undefined
 *
 * A row holding the empty string is present-but-falsy. It was skipped, kept the
 * field, and survived the narrow — so every subsequent push to that deployment
 * dies on "Object contains extra field `stackImageUrl` that is not in the
 * validator". The migration and its script were deleted in the same commit as
 * the narrow, so there was nothing left to rerun.
 *
 * This is the same gotcha the repo has now hit twice; the check below is written
 * as `!== undefined` for that reason, and the report counts empty and non-empty
 * separately so a rerun cannot quietly discard a real image URL.
 *
 * NOTHING IS CONSUMED HERE
 * The original Phase B was careful: it only cleared `stackImageUrl` once the
 * creator actually had an avatar, so a failed image fetch kept the row dirty and
 * a rerun retried it. That care does not apply to an empty string — there is no
 * image to migrate — so the clear is unconditional for empty values. Rows with a
 * NON-empty URL are left alone and reported loudly: those predate the avatar
 * migration and want a human, not a blind unset.
 */

export const report = internalQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    clean: v.number(),
    dirtyEmpty: v.number(),
    dirtyNonEmpty: v.number(),
    nonEmptySlugs: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const stacks = await ctx.db.query('stacks').collect()
    let clean = 0
    let dirtyEmpty = 0
    let dirtyNonEmpty = 0
    const nonEmptySlugs: string[] = []

    for (const stack of stacks) {
      // PRESENCE, not truthiness. The empty string is the whole bug.
      if (stack.stackImageUrl === undefined) {
        clean++
      } else if (stack.stackImageUrl === '') {
        dirtyEmpty++
      } else {
        dirtyNonEmpty++
        nonEmptySlugs.push(stack.slug)
      }
    }

    return { total: stacks.length, clean, dirtyEmpty, dirtyNonEmpty, nonEmptySlugs }
  },
})

export const clearEmpty = internalMutation({
  args: {
    /**
     * Also unset rows whose `stackImageUrl` is a real URL. Off by default: those
     * rows carry an image the avatar migration never consumed, and dropping it
     * is unrecoverable. Set only after checking `report.nonEmptySlugs`.
     */
    includeNonEmpty: v.optional(v.boolean()),
  },
  returns: v.object({ cleared: v.number(), leftDirty: v.number() }),
  handler: async (ctx, args) => {
    const stacks = await ctx.db.query('stacks').collect()
    let cleared = 0
    let leftDirty = 0

    for (const stack of stacks) {
      if (stack.stackImageUrl === undefined) continue
      if (stack.stackImageUrl !== '' && args.includeNonEmpty !== true) {
        leftDirty++
        continue
      }
      await ctx.db.patch(stack._id, { stackImageUrl: undefined })
      cleared++
    }

    return { cleared, leftDirty }
  },
})
