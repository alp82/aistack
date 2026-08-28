import { v } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, type MutationCtx } from '../_generated/server'
import { legacyOf, measuredDaysForStack } from '../lib/measuredDays'
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
 * still prints an approximate 30d reading. A living stack on an old CLI needs
 * no gate: every publish without a day wire rewrites the legacy figure from
 * its own payload (`publishForToken`), and a machine that upgrades clears it
 * by sending days.
 */

const CLEAR_BATCH = 500

type Snapshot = Doc<'measuredSnapshots'>

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
    const snapshots = await ctx.db.query('measuredSnapshots').collect()
    const byStack = new Map<Id<'stacks'>, Snapshot[]>()
    for (const row of snapshots) {
      const held = byStack.get(row.stackId)
      if (held) held.push(row)
      else byStack.set(row.stackId, [row])
    }

    const hasDays = new Map<Id<'stacks'>, boolean>()
    for (const stackId of byStack.keys()) {
      const days = await measuredDaysForStack(ctx, stackId)
      hasDays.set(stackId, days.length > 0)
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
        const legacy = stackHasDays ? undefined : legacyOf(snapshot.payload, publishCost)
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

