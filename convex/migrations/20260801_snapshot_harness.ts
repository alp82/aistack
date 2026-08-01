import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

/**
 * Backfill the denormalized `harness` column on measuredSnapshots.
 *
 * Wayfinder ticket #67 (map #60), decision 1 of the wire-format grilling #66:
 * `measuredSnapshots` gains a top-level `harness: v.string()` plus the
 * `by_stack_harness_capturedAt` index. New rows get the column at insert; this
 * copies it onto existing rows from `payload.harness.name`, which is present
 * on every row (the payload validator has always required it).
 *
 * 3-phase rule (repo gotcha): the schema ships with `harness` OPTIONAL, this
 * runs on dev and prod, and only then may a second deployable revision narrow
 * the field to required. The dirty-row check tests field PRESENCE
 * (`=== undefined`), not truthiness.
 *
 * IDEMPOTENT. A second run finds zero rows without the column.
 */
export const run = internalMutation({
  args: {},
  returns: v.object({ patched: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    let patched = 0
    let skipped = 0
    for (const row of await ctx.db.query('measuredSnapshots').collect()) {
      if (row.harness !== undefined) {
        skipped++
        continue
      }
      await ctx.db.patch(row._id, { harness: row.payload.harness.name })
      patched++
    }
    return { patched, skipped }
  },
})
