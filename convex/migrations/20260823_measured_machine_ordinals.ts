import { v } from 'convex/values'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '../_generated/server'
import { firstSeenMachines } from '../lib/machineOrdinals'

/**
 * Backfill stable machine positions for snapshots written before #250.
 *
 * Run with
 * `scripts/convex-prod.sh run migrations/20260823_measured_machine_ordinals:run`.
 *
 * First sight follows the server clock, then document creation order. The
 * migration corrects any position assigned during the deploy window. A second
 * run changes nothing.
 */
const STACK_BATCH = 100

export const listStackIds = internalQuery({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({
    ids: v.array(v.id('stacks')),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query('stacks').paginate({
      cursor: args.cursor,
      numItems: STACK_BATCH,
    })
    return {
      ids: page.page.map((stack) => stack._id),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

export const backfillStack = internalMutation({
  args: { stackId: v.id('stacks') },
  returns: v.object({ corrected: v.number(), inserted: v.number() }),
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query('measuredSnapshots')
      .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', args.stackId))
      .collect()
    const existing = await ctx.db
      .query('measuredMachineOrdinals')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    let corrected = 0
    let inserted = 0
    const registered = new Map(existing.map((row) => [row.machine, row]))
    const ordered = firstSeenMachines(snapshots)

    for (const [index, [machine, firstSeen]] of ordered.entries()) {
      const ordinal = index + 1
      const row = registered.get(machine)
      if (!row) {
        await ctx.db.insert('measuredMachineOrdinals', {
          stackId: args.stackId,
          machine,
          ordinal,
          assignedAt: firstSeen.assignedAt,
        })
        inserted++
        continue
      }
      if (row.ordinal !== ordinal || row.assignedAt !== firstSeen.assignedAt) {
        await ctx.db.patch(row._id, {
          ordinal,
          assignedAt: firstSeen.assignedAt,
        })
        corrected++
      }
    }

    return { corrected, inserted }
  },
})

export const run = internalAction({
  args: {},
  returns: v.object({ corrected: v.number(), inserted: v.number() }),
  handler: async (ctx) => {
    let cursor: string | null = null
    let corrected = 0
    let inserted = 0
    for (;;) {
      const page: {
        ids: Id<'stacks'>[]
        continueCursor: string
        isDone: boolean
      } = await ctx.runQuery(
        internal.migrations['20260823_measured_machine_ordinals'].listStackIds,
        { cursor }
      )
      for (const stackId of page.ids) {
        const result = await ctx.runMutation(
          internal.migrations['20260823_measured_machine_ordinals'].backfillStack,
          { stackId }
        )
        corrected += result.corrected
        inserted += result.inserted
      }
      if (page.isDone) break
      cursor = page.continueCursor
    }
    return { corrected, inserted }
  },
})
