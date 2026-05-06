import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * One-shot data migration to rename the `instructions` array on `stacks` and
 * `projects` rows to `resources`. The schema only declares the new field name
 * (see `convex/schema.ts`), so any leftover `instructions` value on a row is
 * an out-of-schema field that this migration moves and clears.
 *
 * Idempotent: rows that already have `resources` populated and no
 * `instructions` are skipped silently. Run via:
 *
 *   npx convex run migrations/20260505_rename_instructions_to_resources:run
 *
 * after the schema/code is deployed.
 */

type LegacyShape = {
  instructions?: unknown
  resources?: unknown
}

export const run = internalMutation({
  args: {},
  returns: v.object({
    stacksMigrated: v.number(),
    projectsMigrated: v.number(),
  }),
  handler: async (ctx) => {
    let stacksMigrated = 0
    let projectsMigrated = 0

    const stacks = await ctx.db.query('stacks').collect()
    for (const stack of stacks) {
      const legacy = stack as unknown as LegacyShape
      if (legacy.instructions === undefined) continue
      // Only copy across when the new field hasn't been populated already —
      // protects callers that adopted `resources` before this migration ran.
      const next: Record<string, unknown> = { instructions: undefined }
      if (legacy.resources === undefined) {
        next.resources = legacy.instructions
      }
      await ctx.db.patch(stack._id, next as never)
      stacksMigrated++
    }

    const projects = await ctx.db.query('projects').collect()
    for (const project of projects) {
      const legacy = project as unknown as LegacyShape
      if (legacy.instructions === undefined) continue
      const next: Record<string, unknown> = { instructions: undefined }
      if (legacy.resources === undefined) {
        next.resources = legacy.instructions
      }
      await ctx.db.patch(project._id, next as never)
      projectsMigrated++
    }

    return { stacksMigrated, projectsMigrated }
  },
})
