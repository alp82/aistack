import {
  foldUsageDays,
  MEASURED_DAYS_V1,
  type RangeId,
  type UsageDay,
  addUsageTokens,
  emptyUsageTokens,
  inDateRange,
  previousRangeDates,
  rangeDates,
  totalOfTokens,
} from '@aistack/workflow-rules'
import { type Infer, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import {
  AutoSyncState,
  MeasuredDayWire,
  MeasuredPayload,
  PublishedNameCategory,
  ReconcileAtomKind,
  SyncTrigger,
  WorkflowWire,
} from './schema'
import { captureServerEvent } from './analytics'
import { emitActivityEvent } from './activity'
import { normalizeFrequencyHours } from './lib/autoSync'

import { extractShortId } from './lib/ids'
import {
  dayWireFromWorkflow,
  MEASURED_DAYS_RETENTION,
  measuredDaysForMachine,
  measuredDaysForStack,
  checkMeasuredDays,
  inventoryForStack,
  newestInventoryPerSource,
  storeMeasuredDays,
  legacyOf,
  upsertInventory,
  workflowWireOf,
} from './lib/measuredDays'
import { estimateModelUSD, round2 } from './lib/reprice'
import {
  type ModelCatalog,
  loadModelCatalog,
  resolveModelId,
} from './lib/modelCatalog'
import {
  MODEL_ID_MAX,
  NAME_MAX,
  isDisplaySafeName,
  isSanitizedModelId,
} from './lib/names'

/**
 * The measured layer: the days and the live inventory the sync client
 * publishes (ADR-0010, ADR-0011), plus the reconcile state that sits over the
 * authored<->measured overlap.
 *
 * Wayfinder ticket #38 (map #29) shaped the payload; #307 and #321 (map #302)
 * moved the store from whole-window snapshots to per-day rows. The payload is
 * produced by packages/cli/src/transcripts (#37) and still carries the
 * inventory and the bounds every publish is checked against.
 *
 * Three invariants worth stating up front, because each one is a decision that
 * looks like an omission:
 *
 *   1. TWO SHAPES, TWO TABLES. `measuredDays` holds combinable atoms, one row
 *      per (stack, machine, date), replaced per date and never pruned.
 *      `measuredInventory` holds one row per (stack, machine, harness),
 *      replaced on every sync. Every sum folds days; every "newest per source"
 *      reads inventory.
 *   2. `catalogSlug` IS RESOLVED AT READ TIME, never stored. A model that isn't
 *      in the catalog today resolves for free the day it is added, with no
 *      republish - which is why decision 3 could exempt model ids from the
 *      allowlist without their tokens silently vanishing.
 *   3. THE SERVER CLOCK DECIDES FRESHNESS. `capturedAt` comes from the client;
 *      `receivedAt` is ours and is what the living-stacks bar trusts.
 */

type Payload = Infer<typeof MeasuredPayload>

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** Payload schema versions this deployment accepts. */
const SUPPORTED_SCHEMA_VERSIONS = [1, 2]

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/** The client emits date-only UTC (`toISOString().slice(0, 10)`). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const PROJECT_KEY_RE = /^[A-Za-z0-9_-]{22}$/
const PROJECT_KEYS_MAX = 1_000
const DAY_MS = 24 * 60 * 60 * 1_000

function isCanonicalIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false
  const parsed = Date.parse(`${value}T00:00:00.000Z`)
  return (
    Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === value
  )
}

function checkSortedUnique(
  values: readonly string[],
  where: string,
  check: (value: string, index: number) => void
): void {
  values.forEach((value, index) => {
    check(value, index)
    if (index > 0 && values[index - 1] >= value) {
      throw new Error(`${where} must be sorted with no duplicates`)
    }
  })
}

/**
 * Say what a string in the payload may be (#45).
 *
 * The closed `MeasuredPayload` validator says which FIELDS a snapshot may
 * carry - #38 called that closedness the privacy claim. It cannot say what may
 * be inside a `v.string()`, and before #42 it did not have to: only names the
 * curated list already knew could reach here. #42 made arbitrary user-supplied
 * names a designed feature, so the public stack page now renders strings we
 * have never seen, on purpose. This states the bound those strings have.
 *
 * Two things it deliberately is NOT:
 *
 *   - NOT a re-check against the curated allowlist. That would defeat #42
 *     decision 1, which exists so a user can publish a name we never listed.
 *     Which names publish is judged on the machine, before the send, and stays
 *     there.
 *   - NOT a sanitizer. A violation REJECTS the snapshot. Rewriting a name
 *     server-side would publish a string the owner never saw at the approve
 *     gate, and snapshots are immutable, so there is no taking it back. A
 *     payload that trips this is a broken client, and the HTTP layer surfaces
 *     the reason as a 400.
 *
 * EVERY client-supplied string is covered, not only the five inventory
 * categories: `harness.name` and `pricingTable` are rendered on the same public
 * page from the same untrusted payload, so bounding the names and leaving those
 * open would close the hole only where it was noticed.
 *
 * `catalogSlug` and `catalogName` are NOT bounded here, because they are not in
 * the payload at all - `resolveModels` reads them from our own models catalog at
 * read time. They are a different trust class (admin-authored, not client-sent),
 * and asserting them inside a query would turn a catalog typo into a public page
 * that throws. Their bound belongs on the catalog write path, if anywhere.
 */
function checkPayloadStrings(
  payload: Payload
): void {
  const requireName = (value: string, where: string): void => {
    if (!isDisplaySafeName(value)) {
      throw new Error(
        `${where} must be 1-${NAME_MAX} characters and carry no control or bidi characters`
      )
    }
  }

  requireName(payload.harness.name, 'harness.name')
  if (payload.harness.version !== null) {
    requireName(payload.harness.version, 'harness.version')
  }
  if (payload.pricingTable !== null) {
    requireName(payload.pricingTable, 'pricingTable')
  }

  for (const key of ['from', 'to'] as const) {
    if (!ISO_DATE_RE.test(payload.window[key])) {
      throw new Error(`window.${key} must be an ISO date (YYYY-MM-DD)`)
    }
  }

  if (payload.schemaVersion === 2) {
    for (const key of ['from', 'to'] as const) {
      if (!isCanonicalIsoDate(payload.window[key])) {
        throw new Error(`window.${key} must be a real UTC date`)
      }
    }
    const fromMs = Date.parse(`${payload.window.from}T00:00:00.000Z`)
    const toMs = Date.parse(`${payload.window.to}T00:00:00.000Z`)
    const windowSpan = Math.floor((toMs - fromMs) / DAY_MS) + 1
    if (windowSpan < 1 || payload.window.days !== windowSpan) {
      throw new Error(
        'window.days must equal the inclusive span from window.from through window.to'
      )
    }
    checkSortedUnique(
      payload.activity.activeDayDates,
      'activity.activeDayDates',
      (date, index) => {
        if (!isCanonicalIsoDate(date)) {
          throw new Error(
            `activity.activeDayDates[${index}] must be an ISO date (YYYY-MM-DD)`
          )
        }
        if (date < payload.window.from || date > payload.window.to) {
          throw new Error(
            `activity.activeDayDates[${index}] must be inside the payload window`
          )
        }
      }
    )
    if (payload.activity.activeDayDates.length > payload.window.days) {
      throw new Error('activity.activeDayDates cannot exceed window.days')
    }
    if (payload.activity.projectKeys.length > PROJECT_KEYS_MAX) {
      throw new Error(
        `activity.projectKeys must contain at most ${PROJECT_KEYS_MAX} entries`
      )
    }
    checkSortedUnique(
      payload.activity.projectKeys,
      'activity.projectKeys',
      (key, index) => {
        if (!PROJECT_KEY_RE.test(key)) {
          throw new Error(
            `activity.projectKeys[${index}] must be 22 base64url characters`
          )
        }
      }
    )
  }

  payload.models.forEach((model, i) => {
    if (!isSanitizedModelId(model.id)) {
      throw new Error(
        `models[${i}].id must be 1-${MODEL_ID_MAX} characters of A-Z a-z 0-9 . _ : -`
      )
    }
    // The per-model citation (#136) renders on the same public page as the
    // payload-level one, so it clears the same bar.
    if (model.pricingTable !== undefined) {
      requireName(model.pricingTable, `models[${i}].pricingTable`)
    }
  })

  for (const category of INVENTORY_NAME_CATEGORIES) {
    payload.inventory[category].forEach((atom, i) => {
      requireName(atom.name, `inventory.${category}[${i}].name`)
    })
  }
}

/**
 * The workflow section's counterpart to `checkPayloadStrings` (#213).
 *
 * Same two jobs: bound every client-supplied string, and bound every array a
 * hostile client could grow without limit. The section is closed by its
 * validator like the payload is, and closedness again says nothing about what
 * sits inside a `v.string()` or how long an array runs.
 *
 * A violation REJECTS the whole publish rather than trimming the section. The
 * gate showed the owner the exact bytes; landing a shortened version of them
 * would publish something nobody approved.
 *
 * The caps are set well above real readings, not close to them. The proof run
 * behind `phase-rules/v1` saw 464 sessions across three harnesses in a 30-day
 * window, so a five-thousand-row cap per harness bounds the transaction without
 * ever meeting an honest client.
 */
const WORKFLOW_LIMITS = {
  /** More than a year of days. Retention deletes past 400 on store. */
  days: 400,
  harnesses: 8,
  /** Log buckets: 64 covers anything a clock can hold. */
  buckets: 64,
  /** Commits on one day, for the per-commit strip. */
  commitsPerDay: 5_000,
  /** A week of hours. Both heatmaps are keyed by (weekday, hour). */
  cells: 7 * 24,
  extensions: 128,
  routingModels: 64,
  effortLevels: 4,
} as const

const UTC_DATE = /^\d{4}-\d{2}-\d{2}$/

export function checkWorkflowDays(wire: Infer<typeof WorkflowWire>): void {
  const requireName = (value: string, where: string): void => {
    if (!isDisplaySafeName(value)) {
      throw new Error(
        `${where} must be 1-${NAME_MAX} characters and carry no control or bidi characters`
      )
    }
  }
  const requireSize = (length: number, max: number, where: string): void => {
    if (length > max) {
      throw new Error(`${where} must hold at most ${max} entries`)
    }
  }

  requireName(wire.aggregateVersion, 'workflow.aggregateVersion')
  requireSize(wire.days.length, WORKFLOW_LIMITS.days, 'workflow.days')

  const seenDates = new Set<string>()
  wire.days.forEach((day, d) => {
    const at = `workflow.days[${d}]`
    if (!UTC_DATE.test(day.date) || Number.isNaN(Date.parse(`${day.date}T00:00:00Z`))) {
      throw new Error(`${at}.date must be a UTC date as YYYY-MM-DD`)
    }
    // One row per date: two entries claiming the same day would make "the
    // reading for this day" depend on array order.
    if (seenDates.has(day.date)) {
      throw new Error('Each workflow day must carry a distinct date')
    }
    seenDates.add(day.date)

    requireSize(day.harnesses.length, WORKFLOW_LIMITS.harnesses, `${at}.harnesses`)
    const seen = new Set<string>()
    day.harnesses.forEach((harness, i) => {
      const here = `${at}.harnesses[${i}]`
      requireName(harness.harness, `${here}.harness`)
      if (seen.has(harness.harness)) {
        throw new Error('Each workflow harness entry must name a distinct harness')
      }
      seen.add(harness.harness)
      requireSize(harness.startHours.length, 24, `${here}.startHours`)
      if (harness.phase) {
        requireName(harness.phase.ruleVersion, `${here}.phase.ruleVersion`)
        requireName(
          harness.phase.bucketRuleVersion,
          `${here}.phase.bucketRuleVersion`
        )
        requireSize(
          harness.phase.lengths.length,
          WORKFLOW_LIMITS.buckets,
          `${here}.phase.lengths`
        )
      }
      if (harness.routing) {
        for (const side of ['main', 'subagents'] as const) {
          requireSize(
            harness.routing[side].length,
            WORKFLOW_LIMITS.routingModels,
            `${here}.routing.${side}`
          )
          harness.routing[side].forEach((row, j) => {
            if (!isSanitizedModelId(row.model)) {
              throw new Error(
                `${here}.routing.${side}[${j}].model must be 1-${MODEL_ID_MAX} characters of A-Z a-z 0-9 . _ : -`
              )
            }
          })
        }
      }
      requireSize(harness.activity.length, WORKFLOW_LIMITS.cells, `${here}.activity`)
      if (harness.effort) {
        requireSize(harness.effort.length, WORKFLOW_LIMITS.effortLevels, `${here}.effort`)
      }
      if (harness.turnDurations) {
        requireName(
          harness.turnDurations.bucketRuleVersion,
          `${here}.turnDurations.bucketRuleVersion`
        )
        requireSize(
          harness.turnDurations.buckets.length,
          WORKFLOW_LIMITS.buckets,
          `${here}.turnDurations.buckets`
        )
      }
    })

    requireName(day.git.testFileRuleVersion, `${at}.git.testFileRuleVersion`)
    requireName(day.git.fileTypeRuleVersion, `${at}.git.fileTypeRuleVersion`)
    requireName(day.git.commitSetRuleVersion, `${at}.git.commitSetRuleVersion`)
    requireSize(
      day.git.changedLinesPerCommit.length,
      WORKFLOW_LIMITS.commitsPerDay,
      `${at}.git.changedLinesPerCommit`
    )
    requireSize(
      day.git.changedLinesByExtension.length,
      WORKFLOW_LIMITS.extensions,
      `${at}.git.changedLinesByExtension`
    )
    day.git.changedLinesByExtension.forEach((row, i) => {
      requireName(row.extension, `${at}.git.changedLinesByExtension[${i}].extension`)
    })
    requireSize(
      day.git.weekdayHourCells.length,
      WORKFLOW_LIMITS.cells,
      `${at}.git.weekdayHourCells`
    )
  })
}

/**
 * The one path a payload takes into the measured layer: the version gate, the
 * string and array bounds, and the machine's stable position. Nothing is
 * inserted from the payload itself anymore (ADR-0011): the inventory row is
 * upserted beside it and the days arrive on their own wire.
 *
 * A plain function, not a mutation the other mutation calls: routing this
 * through `ctx.runMutation(internal.measured...)` makes `measured.ts`
 * reference its own module through the generated API, and TS resolves that
 * circularity by degrading the entire `internal` type to `any`.
 */
async function acceptPayload(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  payload: Payload,
  machine?: string
): Promise<{ receivedAt: number }> {
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(payload.schemaVersion)) {
    throw new Error(`Unsupported payload schemaVersion ${payload.schemaVersion}`)
  }
  // Here rather than in either mutation: this is the one path in, so a future
  // caller cannot acquire authority over a stack and skip the bound.
  checkPayloadStrings(payload)

  const receivedAt = Date.now()
  if (machine !== undefined) {
    await ensureMachineOrdinal(ctx, stackId, machine, receivedAt)
  }
  return { receivedAt }
}

/**
 * Insert one approved sync against an explicit stack.
 *
 * `publishForToken` is the path the HTTP layer actually uses; this one exists
 * for tests and for any future caller that has already established authority
 * over the target by other means. The payload never names its own destination -
 * that is the whole point of binding the stack at link time (#33 decision 7).
 */
export const publishSnapshot = internalMutation({
  args: {
    stackId: v.id('stacks'),
    payload: MeasuredPayload,
    /** Optional here and required nowhere: see `machine` in the schema. */
    machine: v.optional(v.string()),
    /** The legacy workflow section (#218, #285): stored as workflow-only days. */
    workflow: v.optional(WorkflowWire),
    /** The per-day wire (#307), both halves of each day. */
    measuredDays: v.optional(MeasuredDayWire),
  },
  returns: v.object({ receivedAt: v.number() }),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')
    checkDayArgs(args)
    const inserted = await acceptPayload(
      ctx,
      args.stackId,
      args.payload,
      args.machine
    )
    await upsertInventory(ctx, {
      stackId: args.stackId,
      machine: args.machine,
      payload: args.payload,
      capturedAt: args.payload.capturedAt,
      receivedAt: inserted.receivedAt,
      cliVersion: undefined,
      ...(args.measuredDays
        ? {}
        : {
            legacy: legacyOf(
              args.payload,
              stack.publishCost !== false,
              (await loadModelCatalog(ctx)).pricer
            ),
          }),
    })
    await storeDayArgs(ctx, args, {
      stackId: args.stackId,
      machine: args.machine,
      capturedAt: args.payload.capturedAt,
      receivedAt: inserted.receivedAt,
      cliVersion: undefined,
    })
    return inserted
  },
})

type DayArgs = {
  workflow?: Infer<typeof WorkflowWire>
  measuredDays?: Infer<typeof MeasuredDayWire>
}

/**
 * Bound both day-shaped args before any row is written. The workflow blocks
 * of a day wire pass through `checkWorkflowDays` like a legacy section does,
 * so the two paths share one set of limits.
 */
function checkDayArgs(args: DayArgs): void {
  if (args.workflow) checkWorkflowDays(args.workflow)
  if (args.measuredDays) {
    checkMeasuredDays(args.measuredDays)
    checkWorkflowDays(workflowWireOf(args.measuredDays))
  }
}

/**
 * Store the day wire, or the legacy workflow section as workflow-only days.
 * The legacy path keeps a row's usage block: that client never carried usage,
 * so its silence about usage is not a claim that there was none.
 */
async function storeDayArgs(
  ctx: MutationCtx,
  args: DayArgs,
  common: {
    stackId: Id<'stacks'>
    machine: string | undefined
    capturedAt: number
    receivedAt: number
    cliVersion: string | undefined
  }
): Promise<void> {
  if (args.measuredDays) {
    await storeMeasuredDays(ctx, { ...common, wire: args.measuredDays })
  } else if (args.workflow) {
    await storeMeasuredDays(ctx, {
      ...common,
      wire: dayWireFromWorkflow(args.workflow),
      keepUsage: true,
    })
  }
}

// ---------------------------------------------------------------------------
// Read - the catalog, the machines, the stack behind a slug
// ---------------------------------------------------------------------------

export {
  type ModelCatalog,
  catalogFrom,
  loadModelCatalog,
  resolveModelId,
} from './lib/modelCatalog'

/**
 * One published inventory name, as a surface reads it.
 *
 * `calls` is the absolute count behind the share (#213), optional because a
 * pre-#213 row carries the share alone. The kit component in the Workflow
 * section is what reads it.
 */
const PublicAtom = v.object({
  name: v.string(),
  callShare: v.number(),
  calls: v.optional(v.number()),
})

/** The published stack behind a public slug, or null. */
export async function publishedStackBySlug(ctx: QueryCtx, slug: string) {
  const stack = await ctx.db
    .query('stacks')
    .withIndex('by_shortId', (q) => q.eq('shortId', extractShortId(slug)))
    .first()
  if (!stack || !stack.published) return null
  return stack
}

async function machineOrdinalRows(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>
): Promise<Doc<'measuredMachineOrdinals'>[]> {
  return await ctx.db
    .query('measuredMachineOrdinals')
    .withIndex('by_stack', (q) => q.eq('stackId', stackId))
    .collect()
}

function machineOrdinals(
  rows: readonly Doc<'measuredMachineOrdinals'>[]
): Map<string, number> {
  return new Map(rows.map((row) => [row.machine, row.ordinal]))
}

async function ensureMachineOrdinal(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  machine: string,
  assignedAt: number
): Promise<number> {
  const existing = await ctx.db
    .query('measuredMachineOrdinals')
    .withIndex('by_stack_machine', (q) =>
      q.eq('stackId', stackId).eq('machine', machine)
    )
    .first()
  if (existing) return existing.ordinal

  const rows = await machineOrdinalRows(ctx, stackId)
  const nextOrdinal =
    rows.reduce((max, row) => Math.max(max, row.ordinal), 0) + 1
  const ordinal = nextOrdinal
  await ctx.db.insert('measuredMachineOrdinals', {
    stackId,
    machine,
    ordinal,
    assignedAt,
  })
  return ordinal
}

async function isStackOwner(
  ctx: QueryCtx,
  stack: Doc<'stacks'>
): Promise<boolean> {
  const user = await ctx.auth.getUserIdentity()
  if (!user) return false
  const creator = await ctx.db.get(stack.creatorId)
  return creator?.userId === user.tokenIdentifier.split('|')[1]
}

type MachinePublication = {
  owner: boolean
  published: Set<string>
  ordinals: Map<string, number>
}

export async function machinePublication(
  ctx: QueryCtx,
  stack: Doc<'stacks'>
): Promise<MachinePublication> {
  return {
    owner: await isStackOwner(ctx, stack),
    published: new Set((await optInsForStack(ctx, stack._id)).machines),
    ordinals: machineOrdinals(await machineOrdinalRows(ctx, stack._id)),
  }
}

export function publicMachine(
  machine: string | null,
  publication: MachinePublication
): { machine: string | null; machineOrdinal: number | null } {
  if (machine === null) return { machine: null, machineOrdinal: null }
  return {
    machine:
      publication.owner || publication.published.has(machine) ? machine : null,
    machineOrdinal: publication.ordinals.get(machine) ?? null,
  }
}

/**
 * The done-bar counter: stacks whose newest sync landed within 7 days.
 *
 * A query over the inventory rows, not a telemetry event - with n=1 user an
 * event would say nothing, and this reads the fact directly (#33 decision 13).
 * One indexed read per stack (#83): the population grows by stacks, and the
 * inventory table is bounded to one row per source.
 */
export const countLivingStacks = query({
  args: {},
  returns: v.object({ living: v.number(), everSynced: v.number() }),
  handler: async (ctx) => {
    const cutoff = Date.now() - SEVEN_DAYS_MS
    let living = 0
    let everSynced = 0
    for (const stack of await ctx.db.query('stacks').collect()) {
      const rows = await inventoryForStack(ctx, stack._id)
      if (rows.length === 0) continue
      everSynced += 1
      if (rows.some((r) => r.receivedAt > cutoff)) living += 1
    }
    return { living, everSynced }
  },
})

// ---------------------------------------------------------------------------
// Reconcile - suggestions derived on read, dismissals persisted
// ---------------------------------------------------------------------------

export async function requireStackOwner(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>
): Promise<Doc<'stacks'>> {
  const user = await ctx.auth.getUserIdentity()
  if (!user) throw new Error('Not authenticated')
  const userId = user.tokenIdentifier.split('|')[1]

  const stack = await ctx.db.get(stackId)
  if (!stack) throw new Error('Stack not found')
  const creator = await ctx.db.get(stack.creatorId)
  if (!creator || creator.userId !== userId) throw new Error('Not authorized')
  return stack
}

const ReconcileSuggestion = v.object({
  atomKind: ReconcileAtomKind,
  atomKey: v.string(),
  /** Display name resolved from the catalog, falling back to the key. */
  label: v.string(),
  // Authored carries the tool but its what-for is still blank. The measured
  // model kind (`missing_from_authored`) is gone: measured models fill the
  // stack's list by themselves (#338).
  kind: v.literal('missing_what_for'),
})

/**
 * Recompute the reconcile suggestions for a stack.
 *
 * Derived on read (#33 decision 12) - there is no queue and no merge step, so a
 * new sync needs no reconciliation logic of its own. The only durable state is
 * the dismissal set, which is exactly the state that should be durable: the
 * user's own explicit decisions.
 *
 * The overlap is CATALOG SLUGS ONLY. MCP servers and Skills appear in the
 * measured inventory but have nowhere to land in `toolSubscriptions`, so they
 * are deliberately not suggested here even though `ReconcileAtomKind` can name
 * them (#39 locks this).
 *
 * THE WHAT-FOR IS `description`, NOT `primaryUsageLabel` (corrects #33/#38/#39).
 * `primaryUsageLabel` looks like the what-for and is not: the tool picker writes
 * the TIER NAME into it (`defaultTier.name`, `"Custom"`) and rewrites it on
 * every tier change, and the stack page renders it as a tier name. Deriving the
 * suggestion from it would have fired almost never, and answering one would have
 * written a sentence into the tier line and lost it at the next tier change.
 * `toolSubscriptions[].description` is the free text the tool card already
 * renders under the tool name, which is what #39's copy promises the owner.
 */
export const getReconcileSuggestions = query({
  args: { stackId: v.id('stacks') },
  returns: v.object({
    /** True once any sync has landed. The name predates the day store. */
    hasSnapshot: v.boolean(),
    /** Server clock of the newest sync; `null` when none has ever landed. */
    receivedAt: v.union(v.number(), v.null()),
    /** True when that sync is inside the 7-day living-stacks window. */
    isFresh: v.boolean(),
    suggestions: v.array(ReconcileSuggestion),
    dismissedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)
    // One inventory row per source (#66, #243, ADR-0011): a model measured by
    // ANY harness on ANY machine is a reconcile candidate, and the surface's
    // freshness reads the newest sync.
    const inventory = newestInventoryPerSource(
      await inventoryForStack(ctx, args.stackId)
    )

    const dismissals = await ctx.db
      .query('reconcileDismissals')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    const dismissed = new Set(dismissals.map((d) => `${d.atomKind}:${d.atomKey}`))

    const suggestions: Array<{
      atomKind: 'model' | 'tool' | 'mcpServer' | 'skill'
      atomKey: string
      label: string
      kind: 'missing_what_for'
    }> = []

    // Authored-side: a subscribed tool with no what-for. Independent of whether
    // a snapshot exists - an empty what-for is worth filling in either way.
    for (const sub of stack.toolSubscriptions) {
      if ((sub.description ?? '').trim().length > 0) continue
      const key = `tool:${sub.toolSlug}`
      if (dismissed.has(key)) continue
      const tool = await ctx.db
        .query('tools')
        .withIndex('by_slug', (q) => q.eq('slug', sub.toolSlug))
        .first()
      suggestions.push({
        atomKind: 'tool',
        atomKey: sub.toolSlug,
        label: tool?.name ?? sub.toolSlug,
        kind: 'missing_what_for',
      })
    }

    suggestions.sort((a, b) => a.label.localeCompare(b.label))

    const newestReceivedAt =
      inventory.length > 0
        ? Math.max(...inventory.map((s) => s.receivedAt))
        : null
    return {
      hasSnapshot: inventory.length > 0,
      receivedAt: newestReceivedAt,
      isFresh:
        newestReceivedAt !== null &&
        Date.now() - newestReceivedAt <= SEVEN_DAYS_MS,
      suggestions,
      dismissedCount: dismissals.length,
    }
  },
})

/** Dismiss one suggestion. Idempotent - re-dismissing is a no-op, not a duplicate. */
export const dismissSuggestion = mutation({
  args: {
    stackId: v.id('stacks'),
    atomKind: ReconcileAtomKind,
    atomKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    const existing = await ctx.db
      .query('reconcileDismissals')
      .withIndex('by_stack_atom', (q) =>
        q
          .eq('stackId', args.stackId)
          .eq('atomKind', args.atomKind)
          .eq('atomKey', args.atomKey)
      )
      .first()
    if (existing) return null
    await ctx.db.insert('reconcileDismissals', {
      stackId: args.stackId,
      atomKind: args.atomKind,
      atomKey: args.atomKey,
      dismissedAt: Date.now(),
    })
    return null
  },
})

/** Undo a dismissal, so the suggestion recomputes on the next read. */
export const undismissSuggestion = mutation({
  args: {
    stackId: v.id('stacks'),
    atomKind: ReconcileAtomKind,
    atomKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    const existing = await ctx.db
      .query('reconcileDismissals')
      .withIndex('by_stack_atom', (q) =>
        q
          .eq('stackId', args.stackId)
          .eq('atomKind', args.atomKind)
          .eq('atomKey', args.atomKey)
      )
      .first()
    if (existing) await ctx.db.delete(existing._id)
    return null
  },
})

/**
 * Everything the reconcile surface needs to render its dismissed list.
 *
 * The label is resolved here rather than stored, for the same reason
 * `catalogSlug` is: a dismissal outlives any one snapshot, and a name that
 * changes in the catalog should change here too. A key with no catalog row
 * falls back to the key itself - never to nothing.
 */
export const listDismissals = query({
  args: { stackId: v.id('stacks') },
  returns: v.array(
    v.object({
      atomKind: ReconcileAtomKind,
      atomKey: v.string(),
      label: v.string(),
      dismissedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    const rows = await ctx.db
      .query('reconcileDismissals')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    const labelled = await Promise.all(
      rows.map(async (r) => ({
        atomKind: r.atomKind,
        atomKey: r.atomKey,
        label: await resolveAtomLabel(ctx, r.atomKind, r.atomKey),
        dismissedAt: r.dismissedAt,
      }))
    )
    return labelled.sort((a, b) => b.dismissedAt - a.dismissedAt)
  },
})

/** Catalog name for one reconcile atom, falling back to its key. */
async function resolveAtomLabel(
  ctx: QueryCtx,
  atomKind: 'model' | 'tool' | 'mcpServer' | 'skill',
  atomKey: string
): Promise<string> {
  if (atomKind === 'model') {
    const model = await ctx.db
      .query('models')
      .withIndex('by_slug', (q) => q.eq('slug', atomKey))
      .first()
    return model?.name ?? atomKey
  }
  if (atomKind === 'tool') {
    const tool = await ctx.db
      .query('tools')
      .withIndex('by_slug', (q) => q.eq('slug', atomKey))
      .first()
    return tool?.name ?? atomKey
  }
  return atomKey
}

// ---------------------------------------------------------------------------
// Answering a suggestion - the two writes into the authored layer
// ---------------------------------------------------------------------------

/**
 * Write the what-for the owner typed onto one subscribed tool.
 *
 * Narrow on purpose. `stacks.update` takes the whole `toolSubscriptions` array,
 * so answering one suggestion through it would send the entire authored list
 * back over the wire and overwrite anything a second tab changed meanwhile.
 *
 * The target is `description` - the free text the tool card renders - NOT
 * `primaryUsageLabel`, which carries the tier name. See `getReconcileSuggestions`.
 */
export const applyWhatFor = mutation({
  args: {
    stackId: v.id('stacks'),
    toolSlug: v.string(),
    whatFor: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)
    const whatFor = args.whatFor.trim()
    if (whatFor.length === 0) throw new Error('A what-for cannot be blank')

    const subs = stack.toolSubscriptions
    if (!subs.some((s) => s.toolSlug === args.toolSlug)) {
      throw new Error('Tool is not on this stack')
    }
    await ctx.db.patch(args.stackId, {
      toolSubscriptions: subs.map((s) =>
        s.toolSlug === args.toolSlug ? { ...s, description: whatFor } : s
      ),
      updatedAt: Date.now(),
    })
    return null
  },
})

// ---------------------------------------------------------------------------
// Sync config - the client's pre-send fetch
// ---------------------------------------------------------------------------

/**
 * The curated allowlist served to sync clients (#33 decision 4).
 *
 * THE BAR (settled by grilling #42): a name qualifies if the STRING carries no
 * private information no matter who typed it - a property of the string, not of
 * the user and not of the artifact. See the long rationale on the client's
 * bundled fallback (packages/cli/src/transcripts/bundled-allowlist.ts), which
 * this must stay byte-identical to; the two are the same policy, one served and
 * one for when the server can't be reached.
 *
 * This list is NOT the only road to publishing a name (#42 decision 1): the
 * approve gate offers every kept-private name as an explicit, default-off tick,
 * and those per-stack opt-ins ride down with the rest of the sync config for the
 * client to union in before its fail-closed filter. So this list stays strict -
 * it exists to spare users from ticking the obvious, not to carry coverage.
 *
 * Serving it from here rather than only bundling it is what makes the list
 * fixable at all: third-party marketplace plugin auto-update defaults to off,
 * so an installed user's bundled copy is otherwise frozen forever.
 */
const CURATED_ALLOWLIST = {
  mcpServers: [
    'chrome-devtools',
    'context7',
    'deepwiki',
    'figma',
    'filesystem',
    'git',
    'github',
    'huggingface',
    'ide',
    'linear',
    'notion',
    'playwright',
    'puppeteer',
    'sentry',
    'slack',
    'stripe',
  ],
  skills: [
    'artifact-capabilities',
    'artifact-design',
    'claude-api',
    'code-review',
    'codebase-design',
    'dataviz',
    'diagnosing-bugs',
    'domain-modeling',
    'fewer-permission-prompts',
    'grilling',
    'init',
    'keybindings-help',
    'loop',
    'prototype',
    'research',
    'review',
    'run',
    'schedule',
    'security-review',
    'simplify',
    'tdd',
    'update-config',
  ],
  subagents: [
    '(default)',
    'claude',
    'claude-code-guide',
    'Explore',
    'fork',
    'general-purpose',
    'Plan',
    'statusline-setup',
  ],
  slashCommands: [
    'add-dir',
    'agents',
    'bug',
    'clear',
    'compact',
    'config',
    'context',
    'cost',
    'doctor',
    'effort',
    'exit',
    'export',
    'fast',
    'help',
    'hooks',
    'ide',
    'init',
    'login',
    'logout',
    'mcp',
    'memory',
    'model',
    'output-style',
    'permissions',
    'plugin',
    'privacy-settings',
    'release-notes',
    'resume',
    'review',
    'rewind',
    'security-review',
    'status',
    'statusline',
    'terminal-setup',
    'todos',
    'upgrade',
    'usage',
    'vim',
    'workflows',
  ],
} as const

const AllowlistValidator = v.object({
  mcpServers: v.array(v.string()),
  skills: v.array(v.string()),
  subagents: v.array(v.string()),
  slashCommands: v.array(v.string()),
})

/**
 * Public, unauthenticated: the allowlist alone.
 *
 * `publishCost` is NOT here, and cannot be - it is a stack-level preference and
 * an unauthenticated caller has not said which stack it is. See
 * `getSyncConfigForToken` for the authenticated half; the HTTP route merges
 * them so a client with a bearer gets both in one request, and a client without
 * one still gets the allowlist it needs before the send.
 */
function allowlistPayload() {
  return {
    allowlist: {
      mcpServers: [...CURATED_ALLOWLIST.mcpServers],
      skills: [...CURATED_ALLOWLIST.skills],
      subagents: [...CURATED_ALLOWLIST.subagents],
      slashCommands: [...CURATED_ALLOWLIST.slashCommands],
    },
  }
}

export const getPublicSyncConfig = query({
  args: {},
  returns: v.object({ allowlist: AllowlistValidator }),
  handler: async () => allowlistPayload(),
})

/** Same value, reachable from the HTTP action that merges in the stack half. */
export const getPublicSyncConfigInternal = internalQuery({
  args: {},
  returns: v.object({ allowlist: AllowlistValidator }),
  handler: async () => allowlistPayload(),
})

// ---------------------------------------------------------------------------
// Published-name opt-ins - the per-stack tick set (#42 decision 2)
// ---------------------------------------------------------------------------

/**
 * The names the owner ticked at the approve gate, by publication class.
 *
 * Inventory opt-ins ride down with the sync config. The client unions them into
 * its curated list before the fail-closed filter (#44). Machine opt-ins use the
 * same store, but the server applies them when it builds a public response.
 *
 * Three properties this placement buys, all from #42 decision 2: the set
 * survives a reinstall and a second machine, a failed config fetch reverts every
 * ticked name to kept-private (losing the network publishes LESS), and the
 * reconcile page has somewhere to revoke a name the owner regrets.
 */
const NAME_CATEGORIES = [
  'builtinTools',
  'machines',
  'mcpServers',
  'skills',
  'subagents',
  'slashCommands',
] as const

/** The five inventory name classes carried in measured payloads. */
const INVENTORY_NAME_CATEGORIES = [
  'builtinTools',
  'mcpServers',
  'skills',
  'subagents',
  'slashCommands',
] as const

type NameCategory = (typeof NAME_CATEGORIES)[number]

const OptInNames = v.object({
  builtinTools: v.array(v.string()),
  machines: v.array(v.string()),
  mcpServers: v.array(v.string()),
  skills: v.array(v.string()),
  subagents: v.array(v.string()),
  slashCommands: v.array(v.string()),
})

const emptyOptIns = (): Record<NameCategory, string[]> => ({
  builtinTools: [],
  machines: [],
  mcpServers: [],
  skills: [],
  subagents: [],
  slashCommands: [],
})

/** A cap per call, so one request cannot write an unbounded transaction. */
const MAX_NAMES_PER_CALL = 500

const OptInName = v.object({ category: PublishedNameCategory, name: v.string() })

function checkNames(entries: ReadonlyArray<{ name: string }>): void {
  if (entries.length > MAX_NAMES_PER_CALL) {
    throw new Error(`At most ${MAX_NAMES_PER_CALL} names per call`)
  }
  for (const { name } of entries) {
    // The SAME bar the published payload is held to (convex/lib/names.ts) - a
    // tick the owner can store but the snapshot would then be rejected for is
    // worse than no tick at all.
    //
    // Loud, not silent: a name that cannot be stored is a tick the owner made
    // and would otherwise believe took effect.
    if (!isDisplaySafeName(name)) {
      throw new Error(
        `A published name must be 1-${NAME_MAX} characters and carry no control or bidi characters`
      )
    }
  }
}

async function findOptIn(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>,
  category: NameCategory,
  name: string
) {
  return await ctx.db
    .query('publishedNameOptIns')
    .withIndex('by_stack_name', (q) =>
      q.eq('stackId', stackId).eq('category', category).eq('name', name)
    )
    .first()
}

/**
 * Tick one or more names for publication. Owner-only, idempotent.
 *
 * Takes an array because the gate's bulk action ("tick all in `alp-river`")
 * stores every name in the group expanded - one click, 47 rows, one round trip.
 */
export const addPublishedNameOptIns = mutation({
  args: { stackId: v.id('stacks'), names: v.array(OptInName) },
  returns: v.object({ added: v.number() }),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    checkNames(args.names)

    const now = Date.now()
    let added = 0
    for (const entry of args.names) {
      if (await findOptIn(ctx, args.stackId, entry.category, entry.name)) continue
      await ctx.db.insert('publishedNameOptIns', {
        stackId: args.stackId,
        category: entry.category,
        name: entry.name,
        optedInAt: now,
      })
      added++
    }
    return { added }
  },
})

/**
 * Un-tick names. Owner-only, idempotent.
 *
 * This is the revoke path #42 decision 2 promised the reconcile page: the next
 * sync from ANY machine drops the name back to kept-private, rather than the
 * owner having to find the machine they ticked it on.
 */
export const removePublishedNameOptIns = mutation({
  args: { stackId: v.id('stacks'), names: v.array(OptInName) },
  returns: v.object({ removed: v.number() }),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    if (args.names.length > MAX_NAMES_PER_CALL) {
      throw new Error(`At most ${MAX_NAMES_PER_CALL} names per call`)
    }

    let removed = 0
    for (const entry of args.names) {
      const row = await findOptIn(ctx, args.stackId, entry.category, entry.name)
      if (!row) continue
      await ctx.db.delete(row._id)
      removed++
    }
    return { removed }
  },
})

/** The owner's own tick set, for a surface that shows or revokes it. */
export const listPublishedNameOptIns = query({
  args: { stackId: v.id('stacks') },
  returns: v.array(
    v.object({
      category: PublishedNameCategory,
      name: v.string(),
      optedInAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    const rows = await ctx.db
      .query('publishedNameOptIns')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    return rows
      .map((r) => ({
        category: r.category,
        name: r.name,
        optedInAt: r.optedInAt,
      }))
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      )
  },
})

async function optInsForStack(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>
): Promise<Record<NameCategory, string[]>> {
  const out = emptyOptIns()
  const rows = await ctx.db
    .query('publishedNameOptIns')
    .withIndex('by_stack', (q) => q.eq('stackId', stackId))
    .collect()
  for (const row of rows) out[row.category].push(row.name)
  for (const key of NAME_CATEGORIES) out[key].sort()
  return out
}

/** The stack-level half, resolved from a bearer token's bound stack. */
export const getSyncConfigForStack = internalQuery({
  args: { stackId: v.id('stacks') },
  returns: v.object({
    publishCost: v.boolean(),
    reviewKeptPrivate: v.boolean(),
    publishWorkflow: v.boolean(),
    stackName: v.string(),
    stackSlug: v.string(),
    optIns: OptInNames,
    /**
     * The server-side auto-sync permission (#102), or null when the stack has
     * never had one. NULL IS NOT `{enabled: false}` - the CLI has to tell
     * "nobody has decided yet", which its local flag may still seed, from "the
     * owner said no", which nothing on a machine may override.
     */
    autoSync: v.union(AutoSyncState, v.null()),
  }),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')
    // Absent reads as opted IN: the field records a refusal, and a stack that
    // has never seen the toggle has not refused.
    return {
      publishCost: stack.publishCost !== false,
      // Same rule, same shape, deliberately (#48): absent means on, and the
      // approve gate names the switch before the first upload.
      reviewKeptPrivate: stack.reviewKeptPrivate !== false,
      // The third bit, same rule again (#213): absent means the owner has never
      // refused, so the workflow section publishes and the gate says so.
      publishWorkflow: stack.publishWorkflow !== false,
      stackName: stack.name,
      // The approve gate points at `/stacks/{slug}/changes` BEFORE the first
      // send (#48 beat one), so the slug must be readable pre-publish (#41).
      // Composite like every public stack URL: the bare `slug` field is not
      // routable on its own - `publishForToken` below does the same.
      stackSlug: `${stack.slug}-${stack.shortId}`,
      optIns: await optInsForStack(ctx, args.stackId),
      autoSync: stack.autoSync ?? null,
    }
  },
})

// ---------------------------------------------------------------------------
// Kept-private staging - the names the owner has NOT published (#48)
// ---------------------------------------------------------------------------

/**
 * The unsealed half of a sync body.
 *
 * #38 and #45 hold that a payload carrying an extra key is REJECTED, and that
 * closedness is the privacy claim. So the staged names could not ride inside
 * the payload without breaking the sentence - they ride beside it, in the same
 * request, so the two halves can never drift against a newer snapshot.
 *
 * Every field is client-supplied and every field is bounded (`checkStagedNames`).
 * #45 bounds the payload; this is a second surface and needs its own assertion.
 */
const KeptPrivateAtom = v.object({
  name: v.string(),
  count: v.number(),
  group: v.union(v.string(), v.null()),
})

const KeptPrivateNames = v.object({
  builtinTools: v.array(KeptPrivateAtom),
  mcpServers: v.array(KeptPrivateAtom),
  skills: v.array(KeptPrivateAtom),
  subagents: v.array(KeptPrivateAtom),
  slashCommands: v.array(KeptPrivateAtom),
})

/** The name classes supplied by the CLI's unsealed inventory half. */
type StagedAtom = { name: string; count: number; group: string | null }
type KeptPrivateInsert = StagedAtom & { category: NameCategory }

/** A staged list is thrown away this long after the sync that wrote it. */
const KEPT_PRIVATE_TTL_MS = 30 * 24 * 60 * 60 * 1000

function flattenStaged(
  names: Record<(typeof INVENTORY_NAME_CATEGORIES)[number], StagedAtom[]>
): KeptPrivateInsert[] {
  const out: KeptPrivateInsert[] = []
  for (const category of INVENTORY_NAME_CATEGORIES) {
    for (const atom of names[category]) out.push({ ...atom, category })
  }
  return out
}

/**
 * The bound on the unsealed half.
 *
 * `checkNames` is reused rather than reimplemented so a name the owner can tick
 * and a name their machine can stage are held to ONE bar - two copies would
 * drift into a name that stages but can never be ticked. The group and the count
 * are bounded here because they are client strings and numbers too: #45's rule
 * is that EVERY client-supplied field gets a bound, not only the interesting one.
 */
function checkStagedNames(
  entries: readonly KeptPrivateInsert[]
): void {
  checkNames(entries)
  for (const entry of entries) {
    if (entry.group !== null && !isDisplaySafeName(entry.group)) {
      throw new Error(
        `A group must be 1-${NAME_MAX} characters and carry no control or bidi characters`
      )
    }
    if (!Number.isInteger(entry.count) || entry.count < 0) {
      throw new Error('A kept-private count must be a non-negative integer')
    }
  }
}

/**
 * Replace a stack's staged list.
 *
 * REPLACE, never merge. A name outside the current rolling window is not in the
 * snapshot either, so ticking it would publish nothing - which is what makes the
 * list mean exactly "names in your current window you have not published".
 */
async function replaceKeptPrivate(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  names: Record<(typeof INVENTORY_NAME_CATEGORIES)[number], StagedAtom[]>,
  stagedAt: number
): Promise<number> {
  await deleteKeptPrivate(ctx, stackId, INVENTORY_NAME_CATEGORIES)
  const flat = flattenStaged(names)
  checkStagedNames(flat)
  return await insertKeptPrivate(ctx, stackId, flat, stagedAt)
}

async function insertKeptPrivate(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  entries: readonly KeptPrivateInsert[],
  stagedAt: number
): Promise<number> {
  for (const entry of entries) {
    await ctx.db.insert('keptPrivateNames', {
      stackId,
      category: entry.category,
      name: entry.name,
      count: entry.count,
      group: entry.group,
      stagedAt,
    })
  }
  return entries.length
}

async function deleteKeptPrivate(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  categories: readonly NameCategory[] = NAME_CATEGORIES
): Promise<number> {
  const selected = new Set<NameCategory>(categories)
  const rows = await ctx.db
    .query('keptPrivateNames')
    .withIndex('by_stack', (q) => q.eq('stackId', stackId))
    .collect()
  const matching = rows.filter((row) => selected.has(row.category))
  for (const row of matching) await ctx.db.delete(row._id)
  return matching.length
}

/** Replace only the server-known machine half of the review list. */
async function replaceKeptPrivateMachines(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  stagedAt: number
): Promise<number> {
  await deleteKeptPrivate(ctx, stackId, ['machines'])
  const rows = await machineOrdinalRows(ctx, stackId)
  const published = new Set((await optInsForStack(ctx, stackId)).machines)
  const entries: KeptPrivateInsert[] = []
  for (const name of machineOrdinals(rows).keys()) {
    if (published.has(name)) continue
    entries.push({
      category: 'machines',
      name,
      count: 0,
      group: null,
    })
  }
  return await insertKeptPrivate(ctx, stackId, entries, stagedAt)
}

/**
 * Turn staging on or off. Owner-only.
 *
 * Off DELETES the list, in the same transaction. The switch says "off means we
 * never see them", and a switch that leaves the last upload sitting in the
 * database would make that sentence false the moment it is flipped.
 */
export const setReviewKeptPrivate = mutation({
  args: { stackId: v.id('stacks'), enabled: v.boolean() },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    await ctx.db.patch(args.stackId, { reviewKeptPrivate: args.enabled })
    // Ticks are untouched: a tick is a standing permission, not a name we hold.
    const deleted = args.enabled ? 0 : await deleteKeptPrivate(ctx, args.stackId)
    return { deleted }
  },
})

/**
 * The plugin a ticked name came from.
 *
 * The machine is the authority on grouping and sends `group` with every staged
 * name, so this covers only the other half of the view: a name that is already
 * ticked PUBLISHES, so it is never staged, so it arrives here with no group at
 * all. Mirrors `pluginGroup` in packages/cli/src/transcripts/allowlist.ts.
 */
function groupOfTickedName(name: string): string | null {
  return (
    /^plugin_([^_]+)_(.+)$/.exec(name)?.[1] ??
    /^([^:\s]+):(.+)$/.exec(name)?.[1] ??
    null
  )
}

const KeptPrivateRow = v.object({
  category: PublishedNameCategory,
  name: v.string(),
  /** Absent for a ticked name: it publishes, so no sync ever staged a count. */
  count: v.optional(v.number()),
  group: v.union(v.string(), v.null()),
  /** True when the owner has ticked it - the row the revoke action acts on. */
  published: v.boolean(),
})

/**
 * What the `Kept private` view renders. Owner-only, and joined into NO public
 * read - this store is the thing #48 rejected read-time promotion FROM.
 *
 * It is a union of two sets, because they are two halves of one question:
 * what the machine staged (not published), and what the owner has ticked
 * (published, and revocable only from here - a ticked name never stages again).
 */
export const listKeptPrivate = query({
  args: { stackId: v.id('stacks') },
  returns: v.object({
    reviewEnabled: v.boolean(),
    /** When the staged list arrived, or null when nothing is staged. */
    stagedAt: v.union(v.number(), v.null()),
    names: v.array(KeptPrivateRow),
  }),
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)

    const staged = await ctx.db
      .query('keptPrivateNames')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    const optIns = await ctx.db
      .query('publishedNameOptIns')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()

    type Row = {
      category: NameCategory
      name: string
      count?: number
      group: string | null
      published: boolean
    }
    const rows = new Map<string, Row>()
    for (const row of staged) {
      rows.set(`${row.category}:${row.name}`, {
        category: row.category,
        name: row.name,
        count: row.category === 'machines' ? undefined : row.count,
        group: row.group,
        published: false,
      })
    }
    for (const row of optIns) {
      const key = `${row.category}:${row.name}`
      const held = rows.get(key)
      // A staged row that is ALSO ticked keeps its count - the count is real
      // and the tick is what changed. It shows once, as published.
      rows.set(key, {
        category: row.category,
        name: row.name,
        count: held?.count,
        group: held?.group ?? groupOfTickedName(row.name),
        published: true,
      })
    }

    return {
      reviewEnabled: stack.reviewKeptPrivate !== false,
      stagedAt: staged[0]?.stagedAt ?? null,
      names: [...rows.values()].sort(
        (a, b) =>
          (b.count ?? 0) - (a.count ?? 0) || a.name.localeCompare(b.name)
      ),
    }
  },
})

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

const GC_BATCH = 500

/**
 * The nightly measured GC (ADR-0011). Only the kept-private half is left: the
 * snapshot downsample went with the snapshot table, and days are never pruned
 * server-side.
 */
export const gcMeasured = internalMutation({
  args: {},
  returns: v.object({
    /** Staged kept-private names aged out - see the note below. */
    keptPrivateDeleted: v.number(),
  }),
  handler: async (ctx) => {
    return { keptPrivateDeleted: await gcKeptPrivate(ctx) }
  },
})

/**
 * Age out staged kept-private names, in the same cron rather than a second one.
 *
 * These are DELETED, not downsampled. They are strings the owner never agreed to publish, and after 30
 * days every one of them is outside any rolling window it could describe - a
 * tick on it would publish nothing, so holding it buys the owner nothing and
 * costs them a name we should not have.
 *
 * This is also what covers a deleted stack. There is no stack-delete path in the
 * codebase today, so there is nothing to cascade from; if one lands, its rows
 * are already unreachable (every read is owner-gated) and expire within 30 days.
 */
async function gcKeptPrivate(ctx: MutationCtx): Promise<number> {
  const cutoff = Date.now() - KEPT_PRIVATE_TTL_MS
  const stale = await ctx.db
    .query('keptPrivateNames')
    .withIndex('by_stagedAt', (q) => q.lt('stagedAt', cutoff))
    .take(GC_BATCH)
  for (const row of stale) await ctx.db.delete(row._id)
  return stale.length
}

/**
 * Payloads per publish. Two harnesses exist today; the cap only bounds the
 * transaction a hostile client could ask for.
 */
const MAX_PAYLOADS_PER_PUBLISH = 8

/** Convenience for the HTTP layer: publish + report what the gate should show. */
export const publishForToken = internalMutation({
  args: {
    tokenId: v.id('cliTokens'),
    /**
     * Pre-#67 clients send exactly one payload here. An installed CLI keeps
     * working until a wire bump retires the field.
     */
    payload: v.optional(MeasuredPayload),
    /**
     * The batch (#66 decision 5): one payload per detected harness, landed in
     * ONE atomic mutation. Atomicity is what closes the staged-names wipe
     * hazard - `replaceKeptPrivate` is a whole-list replace per stack, so two
     * sequential per-harness publishes would have the second wipe the first's
     * names.
     */
    payloads: v.optional(v.array(MeasuredPayload)),
    /**
     * The unsealed half (#48), ONE union across harnesses - consent is per
     * name, not per harness. Optional, because a client with the switch off
     * sends the payloads alone - and because #41's gate must be able to sync
     * before this half exists on the machine.
     */
    keptPrivate: v.optional(KeptPrivateNames),
    /**
     * The machine's standing auto-sync opt-in, as it currently stands (#77).
     * Optional: the opt-in lives in `~/.config/aistack/settings.json` and older
     * clients report nothing, which reads as "never told us".
     */
    autoSync: v.optional(AutoSyncState),
    /**
     * How this sync fired (#102). Absent reads as `manual` - a 0.6.x CLI sends
     * nothing, and silence must not be read as a machine publishing on its own.
     */
    trigger: v.optional(SyncTrigger),
    /**
     * The measured workflow section (#213, spec "The wire"). ONE section per
     * publish, beside the payloads: the Git half is per machine and the metric
     * rows span every synced harness, so neither has a payload to sit in.
     *
     * Optional twice over. A pre-#213 CLI sends nothing, and a client whose
     * owner turned `publishWorkflow` off sends nothing either - the switch is
     * applied on the machine, so refusal and old-client look identical here, by
     * design: there is no server-side state saying a section was withheld.
     *
     * ACCEPTED AND CHECKED HERE, STORED IN #218. The wire has to take the shape
     * before anything can persist it, and the ticket that persists it also owns
     * the fit and rotation state it feeds. Until then a section is validated,
     * bounded, and dropped - so a CLI publishing one is never refused, and a
     * malformed one never becomes someone else's problem to discover.
     */
    workflow: v.optional(WorkflowWire),
    /**
     * The per-day wire (#307, ADR-0010): both halves of each day the client
     * found missing or changed against the manifest. When present it wins
     * over `workflow`, which a client on this wire no longer sends.
     */
    measuredDays: v.optional(MeasuredDayWire),
    /**
     * Which CLI is publishing (#213). Additive and optional like `trigger`: an
     * older client sends nothing, and an untagged row is exactly the answer -
     * that machine is on a wire older than this field.
     */
    cliVersion: v.optional(v.string()),
  },
  returns: v.object({
    receivedAt: v.number(),
    stackSlug: v.string(),
    /** How many staged names landed, and whether the switch refused them. */
    keptPrivate: v.object({ stored: v.number(), refused: v.boolean() }),
  }),
  handler: async (ctx, args) => {
    const payloads = args.payloads ?? (args.payload ? [args.payload] : [])
    if (payloads.length === 0) {
      throw new Error('A publish needs at least one payload')
    }
    if (payloads.length > MAX_PAYLOADS_PER_PUBLISH) {
      throw new Error(`At most ${MAX_PAYLOADS_PER_PUBLISH} payloads per publish`)
    }
    // One snapshot per harness per publish. Two payloads claiming the same
    // harness would make "current per harness" depend on insert order.
    const harnesses = new Set(payloads.map((p) => p.harness.name))
    if (harnesses.size !== payloads.length) {
      throw new Error('Each payload must name a distinct harness')
    }

    const token = await ctx.db.get(args.tokenId)
    if (!token) throw new Error('Token not found')
    if (!token.stackId) {
      throw new Error(
        'This machine is not linked to a stack. Run `aistack login` again to pick one.'
      )
    }
    const stack = await ctx.db.get(token.stackId)
    if (!stack) throw new Error('Linked stack no longer exists')

    // The token's owner must still own the stack. A stack can change hands or be
    // deleted and recreated between link time and send time, and an immutable
    // snapshot written to the wrong stack cannot be taken back.
    const creator = await ctx.db.get(stack.creatorId)
    if (!creator || creator.userId !== token.userId) {
      throw new Error('Token is no longer authorized for its linked stack')
    }

    // THE REVOKE IS ENFORCED HERE, not only in the client (#102). #103 makes
    // `sync --auto` exit before it reaches this route, so this is the second
    // lock: a machine with stale hooks and a stale answer publishes nothing.
    //
    // ONLY AN EXPLICIT `false` refuses. An absent field is "nobody has decided",
    // and refusing that would deadlock the seed below - the field is only ever
    // written by a sync that is allowed to land.
    //
    // A manual sync is untouched. The switch revokes automation, not the
    // owner's own `npx @use-aistack/cli sync`.
    if (args.trigger === 'auto' && stack.autoSync?.enabled === false) {
      throw new Error(
        'Auto-sync is off for this stack. Nothing was published. Turn it back on from the stack page, or run a sync yourself.'
      )
    }

    // Asked BEFORE the upserts, or every sync looks like the first one.
    const isFirstSync = (await inventoryForStack(ctx, stack._id)).length === 0

    // Bounded on the way in, the way the payloads are (#213). Checked here
    // rather than only inside `storeWorkflowDays` so a malformed section
    // refuses the publish before any row is written - the same fail-fast the
    // payload bound gets.
    checkDayArgs(args)

    // Same bar as any other name the wire carries: it is a string a client
    // chose. An unreadable one is dropped rather than refused - the sync is what
    // the owner approved, and a garbled version tag is not worth losing it.
    const cliVersion = isDisplaySafeName(args.cliVersion ?? '')
      ? args.cliVersion
      : undefined

    let receivedAt = 0
    for (const payload of payloads) {
      // The machine is the TOKEN'S name, never the payload's (#243). A client
      // that could name its own bucket could split one machine's history in
      // two, or merge itself into another machine's, and the token already
      // carries the name the owner typed at link time. An older token with no
      // name publishes untagged, which reads exactly like a pre-tagging row.
      const accepted = await acceptPayload(ctx, stack._id, payload, token.name)
      receivedAt = accepted.receivedAt
      // The live inventory row for this (machine, harness), replaced on every
      // sync (ADR-0011).
      // A client that sends no day wire is an old CLI: its stack has no days
      // to fold, so the payload's 30-day totals ride on the row as the legacy
      // figure (ADR-0011). A client on the day wire clears it.
      await upsertInventory(ctx, {
        stackId: stack._id,
        machine: token.name,
        payload,
        capturedAt: payload.capturedAt,
        receivedAt,
        cliVersion,
        ...(args.measuredDays
          ? {}
          : {
              legacy: legacyOf(
                payload,
                stack.publishCost !== false,
                (await loadModelCatalog(ctx)).pricer
              ),
            }),
      })
    }

    // The days, stored against the MACHINE (#285, #307). One row per
    // (machine, date): a re-synced day replaces that day, a new day appends,
    // and no day is pruned.
    await storeDayArgs(ctx, args, {
      stackId: stack._id,
      machine: token.name,
      capturedAt: Math.max(...payloads.map((p) => p.capturedAt)),
      receivedAt,
      cliVersion,
    })

    // ONE event per approved sync, never one per snapshot: this mutation lands
    // up to 8 payloads atomically, so a per-snapshot emit would fire 8 times for
    // one sync (#77). Summarizing the whole batch is also what lets the read
    // path drop its broken cross-page dedupe.
    //
    // Skipped for a draft. Visibility is re-checked at read time - this gate
    // only stops a week of drafting from filling the table with rows that can
    // never be shown.
    if (stack.published) {
      await emitActivityEvent(
        ctx,
        stack._id,
        {
          type: 'sync.landed',
          harnesses: payloads.map((p) => ({
            harness: p.harness.name,
            windowDays: p.window.days,
            sessions: p.activity.sessions,
            activeDays:
              p.schemaVersion === 2
                ? p.activity.activeDayDates.length
                : p.activity.activeDays,
            projects:
              p.schemaVersion === 2
                ? p.activity.projectKeys.length
                : p.activity.projects,
            totalTokens: p.activity.totalTokens,
          })),
        },
        receivedAt,
      )
    }

    if (isFirstSync) {
      await captureServerEvent(ctx, 'first_sync_completed', token.userId, {
        harnesses: payloads.map((p) => p.harness.name),
        windowDays: payloads[0]?.window.days ?? 0,
      })
    }

    // The transition from unknown-or-off to on, as the BACKEND sees it - so it
    // fires once and not on every subsequent sync.
    if (args.autoSync?.enabled && token.autoSync?.enabled !== true) {
      await captureServerEvent(ctx, 'auto_sync_enabled', token.userId, {
        frequencyHours: args.autoSync.frequencyHours,
      })
    }
    if (
      args.autoSync !== undefined &&
      (token.autoSync?.enabled !== args.autoSync.enabled ||
        token.autoSync?.frequencyHours !== args.autoSync.frequencyHours)
    ) {
      await ctx.db.patch(token._id, { autoSync: args.autoSync })
    }

    // SEED FROM LOCAL, ONCE (#102). A machine that opted in before the server
    // owned the permission would otherwise have its standing choice silently
    // dropped the moment the flag moved. The first sync that reports an ON
    // local flag against a stack that has never had one writes it.
    //
    // Only ON seeds. A reported OFF is indistinguishable from "this machine
    // never chose", and writing it would spend the one seed the stack gets on
    // an answer nobody gave.
    //
    // After this the SERVER ALWAYS WINS: no later sync touches the field, so a
    // web revoke cannot be undone by a machine that still has its local flag.
    if (stack.autoSync === undefined && args.autoSync?.enabled === true) {
      await ctx.db.patch(stack._id, {
        autoSync: {
          enabled: true,
          frequencyHours: normalizeFrequencyHours(args.autoSync.frequencyHours),
        },
      })
    }

    // The stamp the web switch reads (#102). Written only by an automatic sync,
    // so the switch can tell on-and-working from on-but-never-fired - the state
    // an unupgraded CLI leaves behind, and the one a hint has to name.
    if (args.trigger === 'auto') {
      await ctx.db.patch(stack._id, { lastAutoSyncAt: receivedAt })
    }

    // The switch is not client-side-only. A client that sends the half anyway -
    // a stale config fetch, or the owner flipping the switch mid-sync - has the
    // HALF refused, not the sync: losing the measurement over a race would cost
    // the owner the one thing they approved.
    const refused = args.keptPrivate !== undefined && stack.reviewKeptPrivate === false
    const inventoryStored =
      args.keptPrivate && !refused
        ? await replaceKeptPrivate(ctx, stack._id, args.keptPrivate, receivedAt)
        : 0
    const machineStored =
      stack.reviewKeptPrivate === false
        ? 0
        : await replaceKeptPrivateMachines(ctx, stack._id, receivedAt)

    return {
      receivedAt,
      stackSlug: `${stack.slug}-${stack.shortId}`,
      keptPrivate: { stored: inventoryStored + machineStored, refused },
    }
  },
})

// ---------------------------------------------------------------------------
// The day manifest (#307, ADR-0010) - what the server holds, so the CLI can
// ship only the days it lacks.
// ---------------------------------------------------------------------------

/**
 * The token's stack and machine, resolved the way `publishForToken` resolves
 * them, with the same not-linked and no-longer-authorized refusals so the
 * HTTP layer maps both paths to one status.
 */
async function stackAndMachineForToken(
  ctx: QueryCtx,
  tokenId: Id<'cliTokens'>
): Promise<{ stack: Doc<'stacks'>; machine: string | undefined }> {
  const token = await ctx.db.get(tokenId)
  if (!token) throw new Error('Token not found')
  if (!token.stackId) {
    throw new Error(
      'This machine is not linked to a stack. Run `aistack login` again to pick one.'
    )
  }
  const stack = await ctx.db.get(token.stackId)
  if (!stack) throw new Error('Linked stack no longer exists')
  const creator = await ctx.db.get(stack.creatorId)
  if (!creator || creator.userId !== token.userId) {
    throw new Error('Token is no longer authorized for its linked stack')
  }
  return { stack, machine: token.name }
}

/**
 * The dates one (stack, machine) holds, each with its content fingerprint.
 * The CLI hashes its own days the same way and sends only the dates missing
 * here or hashing differently. `retentionDays` names the send window.
 */
export const getDayManifestForToken = internalQuery({
  args: { tokenId: v.id('cliTokens') },
  returns: v.object({
    retentionDays: v.number(),
    aggregateVersion: v.string(),
    days: v.array(v.object({ date: v.string(), fingerprint: v.string() })),
  }),
  handler: async (ctx, args) => {
    const { stack, machine } = await stackAndMachineForToken(ctx, args.tokenId)
    const rows = await measuredDaysForMachine(ctx, stack._id, machine)
    return {
      retentionDays: MEASURED_DAYS_RETENTION,
      aggregateVersion: MEASURED_DAYS_V1,
      days: rows
        .map((row) => ({ date: row.date, fingerprint: row.fingerprint }))
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    }
  },
})

// ---------------------------------------------------------------------------
// Read - usage over a range, folded from days (#307, ADR-0011)
// ---------------------------------------------------------------------------

const UsageTokensOut = v.object({
  input: v.number(),
  output: v.number(),
  cacheWrite: v.number(),
  cacheRead: v.number(),
  cacheWriteTtl: v.optional(
    v.object({
      fiveMinute: v.number(),
      oneHour: v.number(),
      unsplit: v.number(),
    })
  ),
})

const UsageReading = v.object({
  dates: v.array(v.string()),
  activeDays: v.number(),
  sessions: v.number(),
  projects: v.number(),
  totalTokens: v.number(),
  cacheHitShare: v.number(),
  subagentShare: v.number(),
  models: v.array(
    v.object({
      id: v.string(),
      catalogSlug: v.union(v.string(), v.null()),
      catalogName: v.union(v.string(), v.null()),
      tokens: UsageTokensOut,
      totalTokens: v.number(),
      tokenShare: v.number(),
      /** Exact sum plus any per-day fill. Null when publishCost is off or nothing priced it. */
      usd: v.union(v.number(), v.null()),
      /** True when any day of this model was priced here instead of by the CLI. */
      estimated: v.boolean(),
      pricingTables: v.array(v.string()),
    })
  ),
  harnesses: v.array(
    v.object({
      harness: v.string(),
      sessions: v.number(),
      totalTokens: v.number(),
      tokenShare: v.number(),
    })
  ),
  cost: v.union(
    v.object({
      usd: v.number(),
      estimated: v.boolean(),
      /** Share of tokens the figure covers, 0..1. */
      pricedShare: v.number(),
      pricingTables: v.array(v.string()),
    }),
    v.null()
  ),
  excludedTokens: v.object({ unpriced: v.number(), synthetic: v.number() }),
})

const UsageRange = v.union(v.literal('30d'), v.literal('7d'), v.literal('24h'))

const MeasuredUsage = v.object({
  range: UsageRange,
  from: v.string(),
  to: v.string(),
  /** Newest `receivedAt` among the selected rows, or null with no days at all. */
  receivedAt: v.union(v.number(), v.null()),
  machines: v.array(
    v.object({
      machine: v.union(v.string(), v.null()),
      machineOrdinal: v.union(v.number(), v.null()),
    })
  ),
  /** False for a stack that has published no days for the selected machines. */
  hasDays: v.boolean(),
  /**
   * The retirement migration's fallback (ADR-0011): the last whole-window
   * snapshot's totals, summed over the selected sources. Non-null only while
   * `hasDays` is false and some selected inventory row carries one.
   */
  legacy: v.union(
    v.object({
      tokens: v.number(),
      sessions: v.number(),
      activeDays: v.number(),
      usd: v.union(v.number(), v.null()),
      capturedAt: v.number(),
      windowDays: v.number(),
    }),
    v.null()
  ),
  /** The live inventory, one entry per (machine, harness) among the selected machines. */
  inventory: v.array(
    v.object({
      harness: v.string(),
      harnessVersion: v.union(v.string(), v.null()),
      machine: v.union(v.string(), v.null()),
      machineOrdinal: v.union(v.number(), v.null()),
      capturedAt: v.number(),
      receivedAt: v.number(),
      isFresh: v.boolean(),
      cliVersion: v.union(v.string(), v.null()),
      builtinTools: v.array(PublicAtom),
      mcpServers: v.array(PublicAtom),
      skills: v.array(PublicAtom),
      subagents: v.array(PublicAtom),
      slashCommands: v.array(PublicAtom),
      withheld: v.object({
        builtinTools: v.number(),
        mcpServers: v.number(),
        skills: v.number(),
        subagents: v.number(),
        slashCommands: v.number(),
      }),
      /** Every observed call per category, the denominator behind `calls` (#213). */
      calls: v.optional(
        v.object({
          builtinTools: v.number(),
          mcpServers: v.number(),
          skills: v.number(),
          subagents: v.number(),
          slashCommands: v.number(),
        })
      ),
      modelsSeen: v.array(v.string()),
    })
  ),
  current: v.union(UsageReading, v.null()),
  previous: v.union(UsageReading, v.null()),
  series: v.array(
    v.object({ date: v.string(), tokens: v.number(), sessions: v.number() })
  ),
})

export type UsageRow = { date: string; usage: UsageDay }

/**
 * One window's reading over a set of day rows: the fold, the catalog names,
 * and the cost. Cost is the exact sum of the priced days plus a per-day fill
 * of ONLY the unpriced days' tokens at the table rate for that date. A fill
 * marks the figure estimated; unpriced tokens no table can price stay out of
 * `pricedShare`.
 */
export function readUsageWindow(
  rows: readonly UsageRow[],
  catalog: ModelCatalog,
  publishCost: boolean
): Infer<typeof UsageReading> | null {
  if (rows.length === 0) return null
  const fold = foldUsageDays(rows)

  // Per-day per-model tokens, for the fill. The fold knows which dates were
  // unpriced; the rows know what those dates held.
  const tokensByModelDate = new Map<string, Map<string, ReturnType<typeof emptyUsageTokens>>>()
  for (const row of rows) {
    for (const h of row.usage.harnesses) {
      for (const m of h.models) {
        if (m.usd !== undefined) continue
        const dates = tokensByModelDate.get(m.model) ?? new Map()
        const acc = dates.get(row.date) ?? emptyUsageTokens()
        addUsageTokens(acc, m.tokens)
        dates.set(row.date, acc)
        tokensByModelDate.set(m.model, dates)
      }
    }
  }

  let totalUSD = 0
  let anyUSD = false
  let anyEstimated = false
  let pricedTokens = 0
  const tables = new Set<string>()
  const models = fold.models.map((m) => {
    const resolved = resolveModelId(catalog, m.model)
    let usd: number | undefined = m.usd
    let estimated = false
    let unpricedRemaining = totalOfTokens(m.unpricedTokens)
    const modelTables = new Set(m.pricingTables)
    if (publishCost) {
      const byDate = tokensByModelDate.get(m.model)
      for (const date of m.unpricedDates) {
        const tokens = byDate?.get(date)
        if (!tokens) continue
        const fill = estimateModelUSD(catalog.pricer, m.model, tokens, { from: date, to: date })
        if (fill === null) continue
        usd = (usd ?? 0) + fill.usd
        estimated = true
        unpricedRemaining -= totalOfTokens(tokens)
        modelTables.add(fill.source)
      }
    }
    if (publishCost && usd !== undefined) {
      totalUSD += usd
      anyUSD = true
      anyEstimated ||= estimated
      pricedTokens += m.totalTokens - Math.max(0, unpricedRemaining)
      for (const table of modelTables) tables.add(table)
    }
    return {
      id: m.model,
      catalogSlug: resolved.catalogSlug,
      catalogName: resolved.catalogName,
      tokens: m.tokens,
      totalTokens: m.totalTokens,
      tokenShare: m.tokenShare,
      usd: publishCost && usd !== undefined ? round2(usd) : null,
      estimated: publishCost ? estimated : false,
      pricingTables: publishCost ? [...modelTables].sort() : [],
    }
  })

  return {
    dates: [...fold.dates],
    activeDays: fold.activeDays,
    sessions: fold.sessions,
    projects: fold.projectKeys.length,
    totalTokens: fold.totalTokens,
    cacheHitShare: fold.cacheHitShare,
    subagentShare: fold.subagentShare,
    models,
    harnesses: fold.harnesses.map((h) => ({ ...h })),
    cost:
      publishCost && anyUSD
        ? {
            usd: round2(totalUSD),
            estimated: anyEstimated || pricedTokens < fold.totalTokens,
            pricedShare: fold.totalTokens
              ? Math.round((pricedTokens / fold.totalTokens) * 10_000) / 10_000
              : 0,
            pricingTables: [...tables].sort(),
          }
        : null,
    excludedTokens: fold.excludedTokens,
  }
}

/**
 * The usage of a published stack over a range, folded from its days.
 *
 * Without `machineOrdinal` every machine folds together: usage atoms are
 * disjoint sessions and sum honestly, unlike the workflow half (ADR-0009).
 * With it, that machine alone. `previous` is the same-length range before
 * `from`; a side with no rows is null. A stack with no days at all answers
 * `hasDays: false` and both sides null, so the page keeps its snapshot path.
 *
 * The two consent bits read here: `publishCost` off strips every dollar.
 * The workflow bit does not apply; this read never touches that block.
 */
export const getUsageByStackSlug = query({
  args: {
    slug: v.string(),
    range: v.optional(UsageRange),
    machineOrdinal: v.optional(v.number()),
  },
  returns: v.union(MeasuredUsage, v.null()),
  handler: async (ctx, args) => {
    const stack = await publishedStackBySlug(ctx, args.slug)
    if (!stack) return null

    const publication = await machinePublication(ctx, stack)
    if (
      args.machineOrdinal !== undefined &&
      (!Number.isInteger(args.machineOrdinal) || args.machineOrdinal <= 0)
    ) {
      return null
    }
    const selectedMachine =
      args.machineOrdinal === undefined
        ? undefined
        : [...publication.ordinals.entries()].find(
            ([, ordinal]) => ordinal === args.machineOrdinal
          )?.[0]
    if (args.machineOrdinal !== undefined && selectedMachine === undefined) {
      return null
    }

    const range: RangeId = args.range ?? '30d'
    const now = Date.now()
    const current = rangeDates(range, now)
    const previous = previousRangeDates(range, now)

    const allRows = await measuredDaysForStack(ctx, stack._id)
    const allInventory = newestInventoryPerSource(
      await inventoryForStack(ctx, stack._id)
    )
    const machineNames = new Map<string | null, string | null>()
    for (const row of [...allRows, ...allInventory]) {
      machineNames.set(row.machine ?? null, row.machine ?? null)
    }
    const inventory = allInventory.filter(
      (row) => selectedMachine === undefined || row.machine === selectedMachine
    )
    const machines = [...machineNames.keys()]
      .map((machine) => publicMachine(machine, publication))
      .sort((a, b) => (a.machineOrdinal ?? Infinity) - (b.machineOrdinal ?? Infinity))

    const rows = allRows.filter(
      (row) =>
        row.usage !== undefined &&
        (selectedMachine === undefined || row.machine === selectedMachine)
    )
    const usageRows: (UsageRow & { receivedAt: number })[] = rows.map((row) => ({
      date: row.date,
      usage: row.usage as UsageDay,
      receivedAt: row.receivedAt,
    }))
    const inCurrent = usageRows.filter((row) => inDateRange(row.date, current))
    const inPrevious = usageRows.filter((row) => inDateRange(row.date, previous))

    const publishCost = stack.publishCost !== false
    const catalog = await loadModelCatalog(ctx)

    const hasDays = rows.length > 0
    const legacyRows = hasDays
      ? []
      : inventory.filter((row) => row.legacy !== undefined)
    const legacy =
      legacyRows.length === 0
        ? null
        : {
            tokens: legacyRows.reduce((a, r) => a + (r.legacy?.tokens ?? 0), 0),
            sessions: legacyRows.reduce((a, r) => a + (r.legacy?.sessions ?? 0), 0),
            // Tokens and sessions are disjoint across sources and sum. Active
            // days are not: two harnesses on one machine share their days, so
            // the merge is the largest count, a lower bound.
            activeDays: Math.max(...legacyRows.map((r) => r.legacy?.activeDays ?? 0)),
            usd:
              publishCost && legacyRows.some((r) => r.legacy?.usd !== undefined)
                ? round2(legacyRows.reduce((a, r) => a + (r.legacy?.usd ?? 0), 0))
                : null,
            capturedAt: Math.max(...legacyRows.map((r) => r.legacy?.capturedAt ?? 0)),
            windowDays: Math.max(...legacyRows.map((r) => r.legacy?.windowDays ?? 0)),
          }

    // One point per date with a row, summed across the selected machines.
    const byDate = new Map<string, { tokens: number; sessions: number }>()
    for (const row of inCurrent) {
      const point = byDate.get(row.date) ?? { tokens: 0, sessions: 0 }
      for (const h of row.usage.harnesses) {
        point.sessions += h.sessions
        for (const m of h.models) point.tokens += totalOfTokens(m.tokens)
      }
      byDate.set(row.date, point)
    }

    return {
      range,
      from: current.from,
      to: current.to,
      receivedAt: [...usageRows, ...inventory].reduce<number | null>(
        (max, row) => (max === null || row.receivedAt > max ? row.receivedAt : max),
        null
      ),
      machines,
      hasDays,
      legacy,
      inventory: inventory.map((row) => ({
        harness: row.harness,
        harnessVersion: row.harnessVersion,
        ...publicMachine(row.machine ?? null, publication),
        capturedAt: row.capturedAt,
        receivedAt: row.receivedAt,
        isFresh: now - row.receivedAt <= SEVEN_DAYS_MS,
        cliVersion: row.cliVersion ?? null,
        builtinTools: row.inventory.builtinTools,
        mcpServers: row.inventory.mcpServers,
        skills: row.inventory.skills,
        subagents: row.inventory.subagents,
        slashCommands: row.inventory.slashCommands,
        withheld: row.inventory.withheld,
        ...(row.inventory.calls === undefined ? {} : { calls: row.inventory.calls }),
        modelsSeen: row.modelsSeen,
      })),
      current: readUsageWindow(inCurrent, catalog, publishCost),
      previous: readUsageWindow(inPrevious, catalog, publishCost),
      series: [...byDate.entries()]
        .map(([date, point]) => ({ date, ...point }))
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    }
  },
})
