import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

/**
 * Remove the retired stack draft flag and rename its creation activity.
 *
 * The application already treats every stack as public. This migration removes
 * the stale field so stored rows match that domain rule. The old activity name
 * described a publication transition that no longer exists.
 *
 * Run with `scripts/convex-prod.sh run migrations/20260831_stacks_always_public:run`.
 * IDEMPOTENT. A second run skips every normalized row.
 */
export const run = internalMutation({
  args: {},
  returns: v.object({
    stacksUpdated: v.number(),
    eventsUpdated: v.number(),
  }),
  handler: async (ctx) => {
    let stacksUpdated = 0
    let eventsUpdated = 0

    for (const stack of await ctx.db.query('stacks').collect()) {
      if (stack.published === undefined) continue
      await ctx.db.patch(stack._id, { published: undefined })
      stacksUpdated++
    }

    for (const row of await ctx.db.query('activityEvents').collect()) {
      if (row.event.type !== 'stack.published') continue
      await ctx.db.patch(row._id, {
        event: { type: 'stack.created', toolCount: row.event.toolCount },
      })
      eventsUpdated++
    }

    return { stacksUpdated, eventsUpdated }
  },
})
