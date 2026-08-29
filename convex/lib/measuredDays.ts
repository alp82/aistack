/**
 * The measured day store and the live inventory (ADR-0010, ADR-0011, #307).
 *
 * One `measuredDays` row per (stack, machine, UTC date) holds `{ usage?,
 * workflow? }` under one version and one fingerprint. A publish REPLACES each
 * day it names and appends the rest. Nothing here prunes: the 400-day limit is
 * the CLI's send window and the page's read cap, never a delete.
 *
 * A READING IS ONE MACHINE'S, PER DAY (ADR-0009). Nothing here merges machines.
 */

import {
  dayFingerprint,
  MEASURED_DAYS_V1,
  type MeasuredDay,
} from '@aistack/workflow-rules'
import type { Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { MeasuredDayWire, MeasuredPayload, WorkflowWire } from '../schema'
import type { Pricer } from '@aistack/pricing'
import { repriceSnapshot } from './reprice'
import { sourceOrder, visibleSources } from './sources'
import {
  MODEL_ID_MAX,
  NAME_MAX,
  isDisplaySafeName,
  isSanitizedModelId,
} from './names'

export type MeasuredDayWireInput = Infer<typeof MeasuredDayWire>
type Payload = Infer<typeof MeasuredPayload>

/** The most days one publish may carry: the CLI's send window. */
export const MEASURED_DAYS_PER_PUBLISH = 400

/** What the manifest tells a client to keep: the same window. */
export const MEASURED_DAYS_RETENTION = 400

const UTC_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isUtcDate(date: string): boolean {
  if (!UTC_DATE.test(date)) return false
  const ms = Date.parse(`${date}T00:00:00Z`)
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === date
}

const USAGE_LIMITS = {
  harnesses: 16,
  models: 64,
  projectKeys: 1_000,
} as const

const PROJECT_KEY_RE = /^[A-Za-z0-9_-]{22}$/

function requireCount(value: number, where: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${where} must be a finite, non-negative number`)
  }
}

/** Bounds on one day's usage block: names, sizes, and every number finite and non-negative. */
export function checkUsageDay(
  usage: Infer<typeof MeasuredDayWire>['days'][number]['usage'] & object,
  at: string
): void {
  if (usage.harnesses.length > USAGE_LIMITS.harnesses) {
    throw new Error(`${at}.harnesses must hold at most ${USAGE_LIMITS.harnesses} entries`)
  }
  const seen = new Set<string>()
  usage.harnesses.forEach((h, i) => {
    const here = `${at}.harnesses[${i}]`
    if (!isDisplaySafeName(h.harness)) {
      throw new Error(
        `${here}.harness must be 1-${NAME_MAX} characters and carry no control or bidi characters`
      )
    }
    if (seen.has(h.harness)) {
      throw new Error('Each usage harness entry must name a distinct harness')
    }
    seen.add(h.harness)
    requireCount(h.sessions, `${here}.sessions`)
    requireCount(h.subagentTokens, `${here}.subagentTokens`)
    requireCount(h.excludedTokens.unpriced, `${here}.excludedTokens.unpriced`)
    requireCount(h.excludedTokens.synthetic, `${here}.excludedTokens.synthetic`)
    if (h.projectKeys.length > USAGE_LIMITS.projectKeys) {
      throw new Error(`${here}.projectKeys must hold at most ${USAGE_LIMITS.projectKeys} entries`)
    }
    h.projectKeys.forEach((key, k) => {
      if (!PROJECT_KEY_RE.test(key)) {
        throw new Error(`${here}.projectKeys[${k}] must be a 22-character url-safe key`)
      }
    })
    if (h.models.length > USAGE_LIMITS.models) {
      throw new Error(`${here}.models must hold at most ${USAGE_LIMITS.models} entries`)
    }
    const models = new Set<string>()
    h.models.forEach((m, j) => {
      const model = `${here}.models[${j}]`
      if (!isSanitizedModelId(m.model)) {
        throw new Error(
          `${model}.model must be 1-${MODEL_ID_MAX} characters of A-Z a-z 0-9 . _ : -`
        )
      }
      if (models.has(m.model)) {
        throw new Error('Each usage model entry must name a distinct model')
      }
      models.add(m.model)
      for (const key of ['input', 'output', 'cacheWrite', 'cacheRead'] as const) {
        requireCount(m.tokens[key], `${model}.tokens.${key}`)
      }
      if (m.tokens.cacheWriteTtl) {
        for (const key of ['fiveMinute', 'oneHour', 'unsplit'] as const) {
          requireCount(m.tokens.cacheWriteTtl[key], `${model}.tokens.cacheWriteTtl.${key}`)
        }
      }
      if (m.usd !== undefined) requireCount(m.usd, `${model}.usd`)
      if (m.pricingTable !== undefined && !isDisplaySafeName(m.pricingTable)) {
        throw new Error(
          `${model}.pricingTable must be 1-${NAME_MAX} characters and carry no control or bidi characters`
        )
      }
    })
  })
}

/**
 * The day-level checks: canonical unique dates, at most one publish window of
 * days, a workflow block that agrees with its row's date, and usage bounds.
 * The workflow block's own bounds are the caller's (`checkWorkflowDays` over
 * `workflowWireOf`), because that check already exists and stays in one place.
 */
export function checkMeasuredDays(wire: MeasuredDayWireInput): void {
  if (!isDisplaySafeName(wire.aggregateVersion)) {
    throw new Error(
      `measuredDays.aggregateVersion must be 1-${NAME_MAX} characters and carry no control or bidi characters`
    )
  }
  if (wire.days.length > MEASURED_DAYS_PER_PUBLISH) {
    throw new Error(
      `measuredDays.days must hold at most ${MEASURED_DAYS_PER_PUBLISH} entries`
    )
  }
  const seen = new Set<string>()
  wire.days.forEach((day, d) => {
    const at = `measuredDays.days[${d}]`
    if (!isUtcDate(day.date)) {
      throw new Error(`${at}.date must be a UTC date as YYYY-MM-DD`)
    }
    if (seen.has(day.date)) {
      throw new Error('Each measured day must carry a distinct date')
    }
    seen.add(day.date)
    if (day.workflow && day.workflow.date !== day.date) {
      throw new Error(`${at}.workflow.date must equal ${at}.date`)
    }
    if (day.usage) checkUsageDay(day.usage, `${at}.usage`)
  })
}

/** The workflow blocks of a day wire, in the shape `checkWorkflowDays` reads. */
export function workflowWireOf(
  wire: MeasuredDayWireInput
): Infer<typeof WorkflowWire> {
  return {
    aggregateVersion: wire.aggregateVersion,
    ...(wire.utcOffsetMinutes === undefined
      ? {}
      : { utcOffsetMinutes: wire.utcOffsetMinutes }),
    days: wire.days.flatMap((day) => (day.workflow ? [day.workflow] : [])),
  }
}

/**
 * A legacy `workflow` section as a day wire carrying ONLY workflow blocks. An
 * old client that sends this must not wipe a day's usage block, so the store
 * keeps the existing usage when the wire holds none (`keepUsage`).
 */
export function dayWireFromWorkflow(
  workflow: Infer<typeof WorkflowWire>
): MeasuredDayWireInput {
  return {
    aggregateVersion: MEASURED_DAYS_V1,
    ...(workflow.utcOffsetMinutes === undefined
      ? {}
      : { utcOffsetMinutes: workflow.utcOffsetMinutes }),
    days: workflow.days.map((day) => ({ date: day.date, workflow: day })),
  }
}

export type StoreMeasuredDaysArgs = {
  stackId: Id<'stacks'>
  machine: string | undefined
  wire: MeasuredDayWireInput
  capturedAt: number
  receivedAt: number
  cliVersion: string | undefined
  /**
   * True for a wire converted from the legacy `workflow` arg: a row's existing
   * usage block survives, because that client never carried usage at all. A
   * day wire replaces the whole row.
   */
  keepUsage?: boolean
}

export async function findMeasuredDay(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>,
  machine: string | undefined,
  date: string
): Promise<Doc<'measuredDays'> | null> {
  return await ctx.db
    .query('measuredDays')
    .withIndex('by_stack_machine_date', (q) =>
      q.eq('stackId', stackId).eq('machine', machine).eq('date', date)
    )
    .first()
}

/**
 * Store one machine's days: a re-synced day replaces that day, a new day is
 * appended, and NO day is pruned.
 *
 * REPLACE PER DAY, NEVER MERGE. The row the CLI sends for a date is the
 * complete reading of that date as the machine now sees it; adding it to the
 * stored row would double-count every session the machine still holds.
 */
export async function storeMeasuredDays(
  ctx: MutationCtx,
  args: StoreMeasuredDaysArgs
): Promise<{ replaced: number; inserted: number }> {
  checkMeasuredDays(args.wire)
  let replaced = 0
  let inserted = 0
  for (const day of args.wire.days) {
    const existing = await findMeasuredDay(ctx, args.stackId, args.machine, day.date)
    const usage =
      day.usage ?? (args.keepUsage && existing ? existing.usage : undefined)
    const content: MeasuredDay = {
      date: day.date,
      ...(usage === undefined ? {} : { usage }),
      ...(day.workflow === undefined ? {} : { workflow: day.workflow }),
    }
    const doc = {
      stackId: args.stackId,
      ...(args.machine === undefined ? {} : { machine: args.machine }),
      date: day.date,
      capturedAt: args.capturedAt,
      receivedAt: args.receivedAt,
      ...(args.cliVersion === undefined ? {} : { cliVersion: args.cliVersion }),
      aggregateVersion: args.wire.aggregateVersion,
      ...(args.wire.utcOffsetMinutes === undefined
        ? {}
        : { utcOffsetMinutes: args.wire.utcOffsetMinutes }),
      fingerprint: dayFingerprint(content),
      ...(usage === undefined ? {} : { usage }),
      ...(day.workflow === undefined ? {} : { workflow: day.workflow }),
    }
    if (existing) {
      await ctx.db.replace(existing._id, doc)
      replaced++
    } else {
      await ctx.db.insert('measuredDays', doc)
      inserted++
    }
  }
  return { replaced, inserted }
}

/** Every stored day row of one stack, across every machine. */
export async function measuredDaysForStack(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>
): Promise<Doc<'measuredDays'>[]> {
  return await ctx.db
    .query('measuredDays')
    .withIndex('by_stack', (q) => q.eq('stackId', stackId))
    .collect()
}

/** One machine's day rows, in date order. */
export async function measuredDaysForMachine(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>,
  machine: string | undefined
): Promise<Doc<'measuredDays'>[]> {
  return await ctx.db
    .query('measuredDays')
    .withIndex('by_stack_machine_date', (q) =>
      q.eq('stackId', stackId).eq('machine', machine)
    )
    .collect()
}

export type LegacyFigure = NonNullable<Doc<'measuredInventory'>['legacy']>

/**
 * The 30-day totals of one payload as a LEGACY figure (ADR-0011): what a
 * stack's page prints while it has no measured days. Written by the
 * retirement migration for the snapshots it copies, and by every publish from
 * a client that sends no day wire, so an old CLI keeps its stack readable.
 */
export function legacyOf(
  payload: Payload,
  publishCost: boolean,
  pricer: Pricer
): LegacyFigure {
  const { cost } = repriceSnapshot({
    pricer,
    models: payload.models,
    window: payload.window,
    publishedTable: payload.pricingTable,
    publishCost,
  })
  return {
    tokens: payload.activity.totalTokens,
    sessions: payload.activity.sessions,
    activeDays:
      payload.schemaVersion === 2
        ? payload.activity.activeDayDates.length
        : payload.activity.activeDays,
    ...(cost ? { usd: cost.lowerBoundUSD } : {}),
    capturedAt: payload.capturedAt,
    windowDays: payload.window.days,
  }
}

export type UpsertInventoryArgs = {
  stackId: Id<'stacks'>
  machine: string | undefined
  payload: Payload
  capturedAt: number
  receivedAt: number
  cliVersion: string | undefined
  /** Present on a publish that carries no day wire. Absent clears the field. */
  legacy?: LegacyFigure
}

/**
 * Replace the (stack, machine, harness) inventory row from one snapshot
 * payload. Latest per source, never a sum (ADR-0011).
 */
export async function upsertInventory(
  ctx: MutationCtx,
  args: UpsertInventoryArgs
): Promise<Id<'measuredInventory'>> {
  const existing = await ctx.db
    .query('measuredInventory')
    .withIndex('by_stack_machine_harness', (q) =>
      q
        .eq('stackId', args.stackId)
        .eq('machine', args.machine)
        .eq('harness', args.payload.harness.name)
    )
    .first()
  const doc = {
    stackId: args.stackId,
    ...(args.machine === undefined ? {} : { machine: args.machine }),
    harness: args.payload.harness.name,
    harnessVersion: args.payload.harness.version,
    capturedAt: args.capturedAt,
    receivedAt: args.receivedAt,
    ...(args.cliVersion === undefined ? {} : { cliVersion: args.cliVersion }),
    inventory: args.payload.inventory,
    modelsSeen: [...new Set(args.payload.models.map((m) => m.id))].sort(),
    pricingTable: args.payload.pricingTable,
    ...(args.legacy === undefined ? {} : { legacy: args.legacy }),
  }
  if (existing) {
    await ctx.db.replace(existing._id, doc)
    return existing._id
  }
  return await ctx.db.insert('measuredInventory', doc)
}

/** Every inventory row of one stack. */
export async function inventoryForStack(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>
): Promise<Doc<'measuredInventory'>[]> {
  return await ctx.db
    .query('measuredInventory')
    .withIndex('by_stack', (q) => q.eq('stackId', stackId))
    .collect()
}

/**
 * The inventory rows a stack currently publishes from, in source order.
 *
 * The table already holds one row per source, so the only fold left is the
 * eviction rule in `convex/lib/sources.ts`: an untagged row of a harness that
 * also has a tagged one is superseded, not merged.
 */
export function newestInventoryPerSource(
  rows: readonly Doc<'measuredInventory'>[]
): Doc<'measuredInventory'>[] {
  return visibleSources(rows, (row) => row).sort(sourceOrder)
}
