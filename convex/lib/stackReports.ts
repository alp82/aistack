import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

/**
 * Drop the `isLowQuality` mark an admin set from a stack's reports, and keep
 * the reports. The stack goes back into the admin flagged queue (which lists
 * flagged stacks that are not marked), so the admin judges it again: keep it,
 * or mark it low quality once more.
 *
 * Two callers share it. `stacks.update` runs it on a meaningful edit. The
 * measured sync path runs it on every sync: a machine publishing usage is new
 * evidence about the stack, and the admin decides what it is worth.
 *
 * Writes nothing when the stack is not marked, so a routine sync stays a no-op
 * on the stack row. Returns whether it cleared a mark.
 */
export async function reopenStackReports(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
): Promise<boolean> {
  const stack = await ctx.db.get(stackId)
  if (!stack?.isLowQuality) return false
  await ctx.db.patch(stackId, { isLowQuality: false, updatedAt: Date.now() })
  return true
}

/**
 * Undo every report against a stack: delete its `stackFlags` rows and drop the
 * `isLowQuality` mark. This is the admin's explicit "unmark", and it clears the
 * flags too so the stack does not reappear in the flagged queue.
 */
export async function clearStackReports(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
): Promise<number> {
  const flags = await ctx.db
    .query('stackFlags')
    .withIndex('by_stackId', (q) => q.eq('stackId', stackId))
    .collect()
  for (const flag of flags) {
    await ctx.db.delete(flag._id)
  }
  await reopenStackReports(ctx, stackId)
  return flags.length
}
