import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * One-shot data migration that clears the now-defunct embedded `resources`
 * array off every `stacks` and `projects` row. Resources moved to the
 * dedicated `resources` + `resourceLinks` tables; the embedded field is left
 * optional during Deploy A so the running backend keeps validating.
 *
 * Run this at the Deploy-A -> Deploy-B boundary (after the new code is live,
 * before the field is removed from `convex/schema.ts`):
 *
 *   npx convex run migrations/20260528_clear_embedded_resources:run
 *
 * Idempotent: rows whose `resources` is already undefined are skipped.
 */

type LegacyShape = {
  resources?: unknown
}

export const run = internalMutation({
  args: {},
  returns: v.object({
    stacksCleared: v.number(),
    projectsCleared: v.number(),
  }),
  handler: async (ctx) => {
    let stacksCleared = 0
    let projectsCleared = 0

    const stacks = await ctx.db.query('stacks').collect()
    for (const stack of stacks) {
      const legacy = stack as unknown as LegacyShape
      if (legacy.resources === undefined) continue
      await ctx.db.patch(stack._id, { resources: undefined } as never)
      stacksCleared++
    }

    const projects = await ctx.db.query('projects').collect()
    for (const project of projects) {
      const legacy = project as unknown as LegacyShape
      if (legacy.resources === undefined) continue
      await ctx.db.patch(project._id, { resources: undefined } as never)
      projectsCleared++
    }

    return { stacksCleared, projectsCleared }
  },
})
