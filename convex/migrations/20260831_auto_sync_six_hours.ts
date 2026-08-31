import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

/**
 * Move every enabled stack onto the new six-hour auto-sync cadence.
 *
 * Disabled and never-decided stacks keep their stored state. A later enable
 * uses the new six-hour default, while a deliberate refusal remains a refusal.
 *
 * IDEMPOTENT. Enabled rows already at six hours are counted and skipped.
 */
export const run = internalMutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    alreadySixHours: v.number(),
    disabledOrUnset: v.number(),
  }),
  handler: async (ctx) => {
    let updated = 0
    let alreadySixHours = 0
    let disabledOrUnset = 0

    for (const stack of await ctx.db.query('stacks').collect()) {
      if (stack.autoSync?.enabled !== true) {
        disabledOrUnset++
        continue
      }
      if (stack.autoSync.frequencyHours === 6) {
        alreadySixHours++
        continue
      }
      await ctx.db.patch(stack._id, {
        autoSync: { enabled: true, frequencyHours: 6 },
      })
      updated++
    }

    return { updated, alreadySixHours, disabledOrUnset }
  },
})
