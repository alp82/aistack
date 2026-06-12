import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * One-shot migration that retires the `projects.published` field. Every project
 * becomes live by default, so the flag has no remaining meaning. This run clears
 * the field on every row that still carries it and counts how many were drafts
 * (published === false) being revealed for observability.
 *
 * DEPLOY SEQUENCE — this runs in the EXISTING widened Deploy-A window. The
 * schema has already made projects.published optional (so patch({ published:
 * undefined }) is accepted); no further schema widening is needed before this
 * migration.
 *
 *   Then run:  npx convex run migrations/20260612b_drop_project_published:run
 *
 * projects.published is dropped from the schema in the SAME combined Deploy-B
 * narrow as the 20260612 retirement fields (source/cloneCount). That narrow
 * must NOT be deployed to prod until BOTH migrations (20260612 AND 20260612b)
 * have run against that deployment.
 *
 * WARNING: running this migration AFTER the Deploy-B narrow (published removed
 * from the schema) fails Convex schema validation — any legacy row still
 * carrying `published` is already schema-invalid at that point, and the patch
 * targets a removed field. Run it while the schema is still widened.
 *
 * Idempotent: a second run finds nothing to change and returns zeros.
 */

type LegacyShape = {
  published?: boolean
}

export const run = internalMutation({
  args: {},
  returns: v.object({
    publishedCleared: v.number(),
    draftsRevealed: v.number(),
  }),
  handler: async (ctx) => {
    let publishedCleared = 0
    let draftsRevealed = 0

    const projects = await ctx.db.query('projects').collect()
    for (const project of projects) {
      const legacy = project as unknown as LegacyShape
      if (legacy.published === undefined) continue
      if (legacy.published === false) draftsRevealed++
      await ctx.db.patch(project._id, { published: undefined } as never)
      publishedCleared++
    }

    return { publishedCleared, draftsRevealed }
  },
})
