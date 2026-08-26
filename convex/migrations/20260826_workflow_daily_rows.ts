import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { internalMutation } from '../_generated/server'

/**
 * Clear the readings stored before the workflow wire moved to daily rows
 * (#285).
 *
 * Run with
 * `scripts/convex-prod.sh run migrations/20260826_workflow_daily_rows:run`.
 *
 * `measuredWorkflows` held one 30-day section per (stack, machine). A
 * section carries no dates, so it cannot be split into the days
 * `measuredWorkflowDays` now stores, and the next sync of each machine
 * rebuilds its series from local history anyway. The table is no longer in
 * the schema; this deletes what it still holds so no row lingers outside it.
 * A second run deletes nothing.
 */
const LEGACY_TABLE = 'measuredWorkflows'
const BATCH = 200

export const run = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    let deleted = 0
    for (;;) {
      // The table is undeclared, so the typed query API does not know it.
      const rows = (await ctx.db
        .query(LEGACY_TABLE as never)
        .take(BATCH)) as unknown as { _id: Id<'measuredWorkflowDays'> }[]
      if (rows.length === 0) break
      for (const row of rows) {
        await ctx.db.delete(row._id)
        deleted++
      }
      if (rows.length < BATCH) break
    }
    return { deleted }
  },
})
