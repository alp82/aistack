import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * One-shot reset that wipes ALL resource data so the new three-axis model
 * (storage / owner / addedBy + global linked dedup) can be adopted from
 * scratch. Existing rows lack the new required `owner`/`addedBy`/`storage`
 * fields, so every `resourceLinks` row is deleted first, then every
 * `resources` row.
 *
 * Run this AFTER the new code is live but BEFORE the schema push completes
 * (the required new fields reject existing rows until the tables are empty):
 *
 *   npx convex run migrations/20260529_reset_resources:run
 *
 * Idempotent: a second run deletes nothing and returns zeros.
 */

export const run = internalMutation({
  args: {},
  returns: v.object({
    resourcesDeleted: v.number(),
    linksDeleted: v.number(),
  }),
  handler: async (ctx) => {
    let linksDeleted = 0
    let resourcesDeleted = 0

    const links = await ctx.db.query('resourceLinks').collect()
    for (const link of links) {
      await ctx.db.delete(link._id)
      linksDeleted++
    }

    const resources = await ctx.db.query('resources').collect()
    for (const resource of resources) {
      await ctx.db.delete(resource._id)
      resourcesDeleted++
    }

    return { resourcesDeleted, linksDeleted }
  },
})
