import { dayFingerprint, MEASURED_DAYS_V1 } from '@aistack/workflow-rules'
import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { findMeasuredDay } from '../lib/measuredDays'

/**
 * Copy every `measuredWorkflowDays` row into `measuredDays` (#307, ADR-0010).
 *
 * Run with
 * `scripts/convex-prod.sh run migrations/20260828_measured_days:run`.
 *
 * Each copied row carries the workflow block only, under `measured-days/v1`
 * and the fingerprint the manifest will hand the CLI. A (stack, machine,
 * date) already present in `measuredDays` is skipped, so a second run copies
 * nothing and a sync that landed between runs is never overwritten. The old
 * table stays declared until a later change drops it.
 */
export const run = internalMutation({
  args: {},
  returns: v.object({ copied: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    let copied = 0
    let skipped = 0
    const rows = await ctx.db.query('measuredWorkflowDays').collect()
    for (const row of rows) {
      const existing = await findMeasuredDay(ctx, row.stackId, row.machine, row.date)
      if (existing) {
        skipped++
        continue
      }
      await ctx.db.insert('measuredDays', {
        stackId: row.stackId,
        ...(row.machine === undefined ? {} : { machine: row.machine }),
        date: row.date,
        capturedAt: row.capturedAt,
        receivedAt: row.receivedAt,
        ...(row.cliVersion === undefined ? {} : { cliVersion: row.cliVersion }),
        aggregateVersion: MEASURED_DAYS_V1,
        ...(row.utcOffsetMinutes === undefined
          ? {}
          : { utcOffsetMinutes: row.utcOffsetMinutes }),
        fingerprint: dayFingerprint({ date: row.date, workflow: row.day }),
        workflow: row.day,
      })
      copied++
    }
    return { copied, skipped }
  },
})
