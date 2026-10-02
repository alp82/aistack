import type { MutationCtx } from './_generated/server'
import {
  type BoardReading,
  boardWindow,
  buildBoard,
  deriveFigures,
  toReading,
} from './leaderboard'
import { measuredDaysForStack } from './lib/measuredDays'
import { loadModelCatalog } from './measured'

/**
 * TEST ONLY. The live leaderboard, derived from the measured rows at the
 * moment of the call. It is the oracle the rollup board is compared against
 * (ADR-0014): `leaderboard.get` must equal it field for field once every
 * refresh has run.
 *
 * This is the read path `leaderboard.get` had before the rollup. It scans
 * `stacks`, and for each stack that is not flagged it runs `deriveFigures`
 * over an UNBOUNDED read of the stack's days, with the stack's real
 * `publishCost` flag. That is how it differs from `refreshStack`, which reads
 * the window through `by_stack_date` and prices as if the flag were on. The
 * two day reads and the two ways of applying the flag must agree, and the
 * comparison is what proves it.
 *
 * It folds every stack in one call, which is why production cannot use it:
 * that fold is what exceeded the one-second limit.
 *
 * The file name has two dots, so the Convex bundler skips it and it is never
 * deployed. Call it inside `t.run`.
 */
export async function liveBoard(
  ctx: MutationCtx,
  page?: number
): Promise<BoardReading> {
  const now = Date.now()
  const window = boardWindow(now)
  const catalog = await loadModelCatalog(ctx)
  const readings: ReturnType<typeof toReading>[] = []
  for (const stack of await ctx.db.query('stacks').collect()) {
    if (stack.isLowQuality === true) continue
    const figures = await deriveFigures(
      ctx,
      stack._id,
      window,
      catalog,
      stack.publishCost !== false,
      () => measuredDaysForStack(ctx, stack._id)
    )
    if (figures === null) continue
    readings.push(
      toReading(stack, await ctx.db.get(stack.creatorId), figures, now)
    )
  }
  return buildBoard(readings, catalog, page)
}
