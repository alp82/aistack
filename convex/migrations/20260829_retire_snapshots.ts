import { v } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, type MutationCtx } from '../_generated/server'
import { measuredDaysForStack } from '../lib/measuredDays'
import { repriceSnapshot } from '../lib/reprice'
import { newestBySource } from '../lib/sources'

/**
 * Retire `measuredSnapshots` (ADR-0011, #321).
 *
 * Run order, after the deploy that ships this file:
 *
 *   scripts/convex-prod.sh run migrations/20260829_retire_snapshots:run
 *   scripts/convex-prod.sh run migrations/20260829_retire_snapshots:clear
 *   (repeat `clear` until it answers `done: true`)
 *
 * then the narrow deploy drops `measuredSnapshots` and `measuredWorkflowDays`
 * from the schema.
 *
 * `run` copies the newest snapshot of every source into an inventory row where
 * none exists yet (a source that synced on CLI 0.10 already has one, and that
 * row is never touched). A stack with no measured days gets the snapshot's
 * 30-day totals as a LEGACY figure on each of its inventory rows, so its page
 * still prints an approximate 30d reading. It REFUSES while any living stack
 * (a snapshot received in the last 7 days) has no days: such a machine converts
 * itself on its next session start, and only a stack that never syncs again
 * should fall back to the legacy figure.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const CLEAR_BATCH = 500

type Snapshot = Doc<'measuredSnapshots'>

function legacyOf(snapshot: Snapshot, publishCost: boolean) {
  const p = snapshot.payload
  const { cost } = repriceSnapshot({
    models: p.models,
    window: p.window,
    publishedTable: p.pricingTable,
    publishCost,
  })
  return {
    tokens: p.activity.totalTokens,
    sessions: p.activity.sessions,
    activeDays:
      p.schemaVersion === 2
        ? p.activity.activeDayDates.length
        : p.activity.activeDays,
    ...(cost ? { usd: cost.lowerBoundUSD } : {}),
    capturedAt: p.capturedAt,
    windowDays: p.window.days,
  }
}

async function inventoryRowFor(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  machine: string | undefined,
  harness: string
): Promise<Doc<'measuredInventory'> | null> {
  return await ctx.db
    .query('measuredInventory')
    .withIndex('by_stack_machine_harness', (q) =>
      q.eq('stackId', stackId).eq('machine', machine).eq('harness', harness)
    )
    .first()
}

export const run = internalMutation({
  args: {},
  returns: v.object({
    inventoryWritten: v.number(),
    legacyWritten: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now()
    const snapshots = await ctx.db.query('measuredSnapshots').collect()
    const byStack = new Map<Id<'stacks'>, Snapshot[]>()
    for (const row of snapshots) {
      const held = byStack.get(row.stackId)
      if (held) held.push(row)
      else byStack.set(row.stackId, [row])
    }

    // The refusal comes first, before any row is written, so a partial run
    // cannot leave one stack converted and the next one blocked.
    const blocking: string[] = []
    const hasDays = new Map<Id<'stacks'>, boolean>()
    for (const [stackId, rows] of byStack) {
      const days = await measuredDaysForStack(ctx, stackId)
      hasDays.set(stackId, days.length > 0)
      const newest = Math.max(...rows.map((r) => r.receivedAt))
      if (now - newest <= SEVEN_DAYS_MS && days.length === 0) {
        const stack = await ctx.db.get(stackId)
        blocking.push(stack ? `${stack.slug}-${stack.shortId}` : String(stackId))
      }
    }
    if (blocking.length > 0) {
      throw new Error(
        `Refusing to retire snapshots: living stacks without measured days: ${blocking.join(', ')}. Sync them on CLI 0.10 or wait for them to go quiet.`
      )
    }

    let inventoryWritten = 0
    let legacyWritten = 0
    let skipped = 0
    for (const [stackId, rows] of byStack) {
      const stack = await ctx.db.get(stackId)
      if (!stack) {
        skipped += rows.length
        continue
      }
      const publishCost = stack.publishCost !== false
      const stackHasDays = hasDays.get(stackId) === true
      for (const snapshot of newestBySource(rows)) {
        const existing = await inventoryRowFor(
          ctx,
          stackId,
          snapshot.machine,
          snapshot.harness
        )
        const legacy = stackHasDays ? undefined : legacyOf(snapshot, publishCost)
        if (existing) {
          if (legacy !== undefined && existing.legacy === undefined) {
            await ctx.db.patch(existing._id, { legacy })
            legacyWritten++
          } else {
            skipped++
          }
          continue
        }
        const p = snapshot.payload
        await ctx.db.insert('measuredInventory', {
          stackId,
          ...(snapshot.machine === undefined ? {} : { machine: snapshot.machine }),
          harness: snapshot.harness,
          harnessVersion: p.harness.version,
          capturedAt: snapshot.capturedAt,
          receivedAt: snapshot.receivedAt,
          ...(snapshot.cliVersion === undefined
            ? {}
            : { cliVersion: snapshot.cliVersion }),
          inventory: p.inventory,
          modelsSeen: [...new Set(p.models.map((m) => m.id))].sort(),
          pricingTable: p.pricingTable,
          ...(legacy === undefined ? {} : { legacy }),
        })
        inventoryWritten++
        if (legacy !== undefined) legacyWritten++
      }
    }
    return { inventoryWritten, legacyWritten, skipped }
  },
})

/**
 * Empty the two retired tables, one batch per call. Re-run until `done`.
 * `workflowRowOverrides` left the schema in the same deploy and had no rows
 * worth keeping, so nothing clears it here.
 */
export const clear = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number(), done: v.boolean() }),
  handler: async (ctx) => {
    let deleted = 0
    for (const table of ['measuredSnapshots', 'measuredWorkflowDays'] as const) {
      const rows = await ctx.db.query(table).take(CLEAR_BATCH - deleted)
      for (const row of rows) await ctx.db.delete(row._id)
      deleted += rows.length
      if (deleted >= CLEAR_BATCH) return { deleted, done: false }
    }
    return { deleted, done: true }
  },
})

