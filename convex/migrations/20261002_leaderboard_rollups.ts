import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { fanOutRollupRefresh } from '../lib/leaderboardRollup'

/**
 * Backfill `leaderboardRollups` (ADR-0014): schedule one
 * `leaderboard.refreshStack` per stack that has measured data.
 *
 * This is the hourly cron's fan-out, run once by hand so the table is full
 * right after the deploy instead of at the next full hour. It folds nothing
 * itself: each stack is recomputed in its own scheduled mutation with its own
 * time budget. `scheduled` is how many refreshes were queued. They finish a
 * moment after this returns.
 *
 * IDEMPOTENT. A refresh replaces its stack's row, and a recompute that equals
 * the stored row writes nothing. A second run queues the same refreshes and
 * changes no data.
 */
export const run = internalMutation({
  args: {},
  returns: v.object({ scheduled: v.number() }),
  handler: async (ctx): Promise<{ scheduled: number }> => {
    return await fanOutRollupRefresh(ctx)
  },
})
