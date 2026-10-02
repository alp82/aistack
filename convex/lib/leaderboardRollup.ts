import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

/**
 * Scheduling for the leaderboard rollup (ADR-0014). The compute itself is
 * `leaderboard.refreshStack`; this file only decides WHEN it runs.
 *
 * A separate file for two reasons. `measured.ts` must not name `internal`
 * inside its own handlers (see `acceptPayload` there), and `leaderboard.ts`
 * imports `measured.ts`, so the writers and the compute meet here instead.
 */

/**
 * Refresh one stack's rollup, in its own mutation, right after the caller
 * commits.
 *
 * EVERY WRITER OF `measuredDays` OR `measuredInventory` CALLS THIS, once per
 * mutation. Scheduled at delay 0 instead of computed inline, so the caller
 * keeps its own one-second budget and a rollup failure cannot fail a sync. It
 * rides the caller's transaction: a publish that throws schedules nothing.
 */
export async function scheduleRollupRefresh(
  ctx: MutationCtx,
  stackId: Id<'stacks'>
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.leaderboard.refreshStack, { stackId })
}

/**
 * One scheduled refresh per stack that has measured data or already holds a
 * rollup. Each refresh is its own mutation with its own time budget; this one
 * only enumerates.
 *
 * Both tables are the driver on purpose. The inventory finds a stack whose
 * refresh never ran or failed, so the board heals within one run. The rollups
 * find a row whose stack or inventory is gone, so an orphan is deleted.
 */
export async function fanOutRollupRefresh(
  ctx: MutationCtx
): Promise<{ scheduled: number }> {
  const stackIds = new Set<Id<'stacks'>>()
  for (const row of await ctx.db.query('measuredInventory').collect()) {
    stackIds.add(row.stackId)
  }
  for (const row of await ctx.db.query('leaderboardRollups').collect()) {
    stackIds.add(row.stackId)
  }
  for (const stackId of stackIds) await scheduleRollupRefresh(ctx, stackId)
  return { scheduled: stackIds.size }
}
