/**
 * The measured day store and the live inventory (ADR-0010, ADR-0011, #307).
 *
 * One `measuredDays` row per (stack, machine, UTC date) holds `{ usage?,
 * workflow? }` under one version and one fingerprint. A complete publish replaces
 * each day it names; partial readings retain prior evidence. New days append.
 * Nothing here prunes: the 400-day limit is the CLI's send window and the
 * page's read cap, never a delete.
 *
 * A READING IS ONE MACHINE'S, PER DAY (ADR-0009). Nothing here merges machines.
 */

import {
  checkDenseMeasuredDaySize,
  DENSE_MEASURED_DAY_BYTES,
  dayFingerprint,
  INLINE_PROJECT_WORKSPACE_LIMIT,
  MEASURED_DAYS_V1,
  type MeasuredDay,
  PROJECT_WORKSPACE_ID_LENGTH,
  PROJECT_WORKSPACE_ID_RE,
  projectWorkspaceIds,
} from '@aistack/workflow-rules'
import { getDocumentSize, type Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { MeasuredDayWire, MeasuredPayload, WorkflowWire } from '../schema'
import type { Pricer } from '@aistack/pricing'
import { retainPartialDay } from './partialMeasuredDay'
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
type WorkspaceEvidence = Doc<'measuredWorkspaceEvidence'>['harnesses']

/** The most days one publish may carry: the CLI's send window. */
export const MEASURED_DAYS_PER_PUBLISH = 400

/** What the manifest tells a client to keep: the same window. */
export const MEASURED_DAYS_RETENTION = 400

const UTC_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isUtcDate(date: unknown): date is string {
  if (typeof date !== 'string' || !UTC_DATE.test(date)) return false
  const ms = Date.parse(`${date}T00:00:00Z`)
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === date
}

const USAGE_LIMITS = {
  harnesses: 16,
  models: 64,
} as const

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
    if (h.projectKeys.length > INLINE_PROJECT_WORKSPACE_LIMIT) {
      throw new Error(`${here}.projectKeys must hold at most ${INLINE_PROJECT_WORKSPACE_LIMIT} entries`)
    }
    if (h.projectKeysPacked !== undefined) {
      const length = h.projectKeysPacked.length
      if (
        h.projectKeys.length !== 0 ||
        length <= INLINE_PROJECT_WORKSPACE_LIMIT * PROJECT_WORKSPACE_ID_LENGTH ||
        length % PROJECT_WORKSPACE_ID_LENGTH !== 0
      ) {
        throw new Error(`${here}.projectKeysPacked requires more than ${INLINE_PROJECT_WORKSPACE_LIMIT} fixed-width IDs and an empty projectKeys array`)
      }
    }
    let previous: string | undefined
    for (const key of projectWorkspaceIds(h)) {
      if (!PROJECT_WORKSPACE_ID_RE.test(key)) {
        throw new Error(`${here} project workspace identifiers must be 22-character base64url strings`)
      }
      if (h.projectKeysPacked !== undefined && previous !== undefined && previous >= key) {
        throw new Error(`${here}.projectKeysPacked must be sorted with no duplicates`)
      }
      previous = key
    }
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
  checkMeasuredDayDates(wire.days)
  if (wire.partialHarnesses) {
    if (wire.partialHarnesses.length > USAGE_LIMITS.harnesses) {
      throw new Error(
        `measuredDays.partialHarnesses must hold at most ${USAGE_LIMITS.harnesses} entries`
      )
    }
    wire.partialHarnesses.forEach((name, i) => {
      if (!isDisplaySafeName(name)) {
        throw new Error(
          `measuredDays.partialHarnesses[${i}] must be 1-${NAME_MAX} characters and carry no control or bidi characters`
        )
      }
    })
  }
  wire.days.forEach((day, d) => {
    const at = `measuredDays.days[${d}]`
    if (day.workflow && day.workflow.date !== day.date) {
      throw new Error(`${at}.workflow.date must equal ${at}.date`)
    }
    checkDenseMeasuredDaySize(day)
    if (day.usage) checkUsageDay(day.usage, `${at}.usage`)
  })
}

/** Request-wide constraints that still apply when validation runs in batches. */
export function checkMeasuredDayDates(days: readonly { date: string }[]): void {
  if (days.length > MEASURED_DAYS_PER_PUBLISH) {
    throw new Error(
      `measuredDays.days must hold at most ${MEASURED_DAYS_PER_PUBLISH} entries`
    )
  }
  const seen = new Set<string>()
  days.forEach((day, i) => {
    if (!isUtcDate(day?.date)) {
      throw new Error(`measuredDays.days[${i}].date must be a UTC date as YYYY-MM-DD`)
    }
    if (seen.has(day.date)) {
      throw new Error('Each measured day must carry a distinct date')
    }
    seen.add(day.date)
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

function packedEvidenceOf(day: MeasuredDay): { harnesses: WorkspaceEvidence; bytes: number } {
  const harnesses = day.usage?.harnesses.flatMap(({ harness, projectKeysPacked }) =>
    projectKeysPacked === undefined ? [] : [{ harness, packed: projectKeysPacked }]
  ) ?? []
  const bytes = harnesses.reduce((sum, h) => sum + h.packed.length, 0)
  if (bytes > DENSE_MEASURED_DAY_BYTES) {
    throw new Error(`Measured day ${day.date} exceeds the 768 KiB stored workspace evidence limit. Retry with a complete reading of that day to replace partial evidence.`)
  }
  return { harnesses, bytes }
}

async function mergePartialDay(
  ctx: QueryCtx | MutationCtx,
  existing: Doc<'measuredDays'>,
  incoming: MeasuredDayWireInput['days'][number],
  partialHarnesses: ReadonlySet<string> | undefined,
) {
  const usage = await readMeasuredWorkspaceEvidence(ctx, existing)
  const day = retainPartialDay({ ...existing, usage }, incoming, partialHarnesses)
  if (day.usage) checkUsageDay(day.usage, `retained day ${day.date}`)
  return day
}

/** Surface a partial union that cannot fit before the part starts writing. */
export async function checkRetainedMeasuredDays(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>,
  machine: string | undefined,
  wire: MeasuredDayWireInput,
) {
  if (!wire.partial) return
  const harnesses = wire.partialHarnesses ? new Set(wire.partialHarnesses) : undefined
  for (const incoming of wire.days) {
    const existing = await findMeasuredDay(ctx, stackId, machine, incoming.date)
    if (existing) packedEvidenceOf(await mergePartialDay(ctx, existing, incoming, harnesses))
  }
}

/**
 * Store one machine's days: a re-synced day replaces that day, a new day is
 * appended, and NO day is pruned.
 *
 * Complete scans replace the day. Partial scans extend it conservatively:
 * missing entries survive and overlapping model records are never added.
 *
 * A caller that writes days also calls `scheduleRollupRefresh` for the stack,
 * once per mutation: the leaderboard reads a rollup of these rows (ADR-0014).
 */
export async function storeMeasuredDays(
  ctx: MutationCtx,
  args: StoreMeasuredDaysArgs
): Promise<{ replaced: number; inserted: number; writeBytes: number }> {
  checkMeasuredDays(args.wire)
  let replaced = 0
  let inserted = 0
  let writeBytes = 0
  const partialHarnesses = args.wire.partialHarnesses
    ? new Set(args.wire.partialHarnesses)
    : undefined
  for (const incoming of args.wire.days) {
    const existing = await findMeasuredDay(ctx, args.stackId, args.machine, incoming.date)
    if (args.keepUsage && existing?.workspaceEvidence) {
      // Legacy workflow requests never change usage. Hash their own block
      // alongside the stored usage identity without loading the sidecar.
      const workflowHash = dayFingerprint(incoming)
      const usageHash = existing.usageFingerprint ?? existing.fingerprint
      const patch = {
        workflow: incoming.workflow,
        fingerprint: `${usageHash}:${workflowHash}`,
        usageFingerprint: usageHash,
        capturedAt: args.capturedAt,
        receivedAt: args.receivedAt,
        cliVersion: args.cliVersion,
        utcOffsetMinutes: args.wire.utcOffsetMinutes,
        aggregateVersion: args.wire.aggregateVersion,
      }
      await ctx.db.patch(existing._id, patch)
      writeBytes += getDocumentSize(existing) + getDocumentSize({ ...(incoming.workflow ? { workflow: incoming.workflow } : {}) })
      replaced++
      continue
    }
    const day =
      args.wire.partial && existing
        ? await mergePartialDay(ctx, existing, incoming, partialHarnesses)
        : incoming
    const usage =
      day.usage ?? (args.keepUsage && existing ? await readMeasuredWorkspaceEvidence(ctx, existing) : undefined)
    const content: MeasuredDay = {
      date: day.date,
      ...(usage === undefined ? {} : { usage }),
      ...(day.workflow === undefined ? {} : { workflow: day.workflow }),
    }
    const { harnesses, bytes: workspaceEvidenceBytes } = packedEvidenceOf(content)
    let workspaceEvidence = existing?.workspaceEvidence
    if (harnesses.length) {
      if (workspaceEvidence) await ctx.db.replace(workspaceEvidence, { harnesses })
      else workspaceEvidence = await ctx.db.insert('measuredWorkspaceEvidence', { harnesses })
    } else if (workspaceEvidence) {
      await ctx.db.delete(workspaceEvidence)
      workspaceEvidence = undefined
    }
    const storedUsage = harnesses.length && usage
      ? { harnesses: usage.harnesses.map(({ projectKeysPacked: _, ...harness }) => harness) }
      : usage
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
      ...(storedUsage === undefined ? {} : { usage: storedUsage }),
      ...(workspaceEvidence ? {
        workspaceEvidence,
        workspaceEvidenceBytes,
        usageFingerprint: dayFingerprint({ date: day.date, usage }),
        largestWorkspaceSet: Math.max(...harnesses.map((h) => h.packed.length / PROJECT_WORKSPACE_ID_LENGTH)),
      } : {}),
      ...(day.workflow === undefined ? {} : { workflow: day.workflow }),
    }
    writeBytes += getDocumentSize(doc) + (harnesses.length ? getDocumentSize({ harnesses }) : 0)
    if (existing) {
      await ctx.db.replace(existing._id, doc)
      replaced++
    } else {
      await ctx.db.insert('measuredDays', doc)
      inserted++
    }
  }
  return { replaced, inserted, writeBytes }
}

/** Only consumers of exact workspace unions need to hydrate dense IDs. */
export async function readMeasuredWorkspaceEvidence(
  ctx: QueryCtx | MutationCtx,
  row: Doc<'measuredDays'>
): Promise<Doc<'measuredDays'>['usage']> {
  if (!row.usage || !row.workspaceEvidence) return row.usage
  const evidence = await ctx.db.get(row.workspaceEvidence)
  if (!evidence) throw new Error('Measured workspace evidence is missing')
  const byHarness = new Map(evidence.harnesses.map((h) => [h.harness, h.packed]))
  return {
    harnesses: row.usage.harnesses.map((harness) => {
      const packed = byHarness.get(harness.harness)
      return packed === undefined ? harness : { ...harness, projectKeysPacked: packed }
    }),
  }
}

/** Reserve transaction headroom for usage, workflow and ordinary DB reads. */
export function workspaceReadBudgetAllows(
  rows: readonly Doc<'measuredDays'>[],
  base: readonly Doc<'measuredDays'>[] = rows,
): boolean {
  const baseBytes = base.reduce((bytes, row) => bytes + getDocumentSize(row), 0)
  return rows.reduce((bytes, row) => bytes + (row.workspaceEvidenceBytes ?? 0), baseBytes) <= 12 * 1024 * 1024
}

/** A single known set proves a lower bound without claiming disjoint sets. */
export function workspaceCountLowerBound(rows: readonly Doc<'measuredDays'>[]): number {
  return rows.reduce((max, row) => Math.max(max, row.largestWorkspaceSet ?? 0), 0)
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

/**
 * One stack's day rows inside an inclusive date range, across every machine,
 * in the order `measuredDaysForStack` returns them.
 *
 * This is the bounded read: `by_stack_date` loads only the rows of the range,
 * where `by_stack` loads the stack's whole history. Convex cannot project
 * fields, so a row still arrives with its `workflow` block; reading fewer rows
 * is the only lever.
 *
 * The rows are put back into creation order because a fold sums dollars as
 * floats, and float addition depends on order. Same order, same sum.
 */
export async function measuredDaysForStackInRange(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>,
  range: { from: string; to: string }
): Promise<Doc<'measuredDays'>[]> {
  const rows = await ctx.db
    .query('measuredDays')
    .withIndex('by_stack_date', (q) =>
      q.eq('stackId', stackId).gte('date', range.from).lte('date', range.to)
    )
    .collect()
  return rows.sort(
    (a, b) =>
      a._creationTime - b._creationTime || (a._id < b._id ? -1 : a._id > b._id ? 1 : 0)
  )
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
 *
 * A caller that writes inventory also calls `scheduleRollupRefresh` for the
 * stack, once per mutation: the leaderboard's rollup stores the last sync
 * time and the legacy figure read from these rows (ADR-0014).
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
