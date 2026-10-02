import {
  inDateRange,
  rangeDates,
  totalOfTokens,
  type UsageDay,
} from '@aistack/workflow-rules'
import { type Infer, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { internalMutation, query } from './_generated/server'
import { fanOutRollupRefresh } from './lib/leaderboardRollup'
import {
  inventoryForStack,
  measuredDaysForStackInRange,
  newestInventoryPerSource,
} from './lib/measuredDays'
import {
  loadModelNames,
  type ModelNames,
  resolveModelId,
} from './lib/modelCatalog'
import { round2 } from './lib/reprice'
import { loadModelCatalog, type ModelCatalog, readUsageWindow } from './measured'

/**
 * The read model behind `/leaderboard`. Wayfinder ticket #83 (map #76), spine
 * locked by #92, scope by #82.
 *
 * THE BOARD READS A PER-STACK ROLLUP (ADR-0014). #82 recorded that reads are
 * live and that "a later rollup must reproduce these numbers exactly". The
 * live read folded every measured stack's days inside one query. With 9
 * measured stacks that already cost about one second of JS time, which is the
 * Convex limit per function, and about half of the `/leaderboard` requests on
 * prod returned HTTP 500. That read path is gone.
 *
 * ONE DERIVATION, WRITTEN AHEAD OF THE READ. `deriveFigures` is the only code
 * that turns a stack's inventory and days into board figures (ADR-0011).
 *   - `refreshStack` runs it for one stack, at sync time and hourly, over a
 *     day read bounded to the window, and stores the result in
 *     `leaderboardRollups`.
 *   - `readRollupPopulation` reads those rows for `get` and `model`. No day
 *     is folded at read time, so a stack is on the board only once its
 *     refresh has run.
 *
 * THE LIVE BOARD SURVIVES IN THE TESTS ONLY, as the oracle the rollup board
 * is compared against (`leaderboard.testOracle.ts`). It is assembled from the
 * same `deriveFigures`, `toReading` and `buildBoard`, which are exported for
 * that reason alone.
 *
 * WHAT A ROLLUP STORES AND WHAT IS READ LIVE is decided in `StackFigures` and
 * `toReading`. Stored: the figures of the 30-day fold. Read live: everything
 * that changes outside a sync (the stack's name, slug, quality flag and
 * `publishCost`, the creator, the model display names) and `living`, which
 * depends on the clock.
 *
 * EXCLUSIONS (#82, applied here once so every figure agrees):
 *   - `isLowQuality` stacks do not exist here at all. The board is discovery,
 *     and the flag means hidden from discovery;
 *   - a harness reporting zero tokens is not a harness;
 *   - `unknown` is not a model name: its tokens count toward totals and the
 *     unattributed share, but it never ranks and never leads a row;
 *   - a stack with `publishCost` off has no cost, not a cost of zero;
 *   - no sync in 7 days means listed in the quiet line, never ranked.
 *
 * THE SERIES is the per-day token total over the same 30-day window the row's
 * number folds, one point per measured UTC date. Tokens only per point.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
export const PAGE_SIZE = 10
/** The most points a row's sparkline carries; the newest win. */
const MAX_POINTS = 60
const MAX_RAIL_MODELS = 6
const MAX_RAIL_HARNESSES = 5

const Ranking = v.object({
  key: v.string(),
  /** Catalog display name where one resolves, the raw key otherwise. */
  name: v.string(),
  /** Models: share of attributed tokens. Harnesses: share of all tokens. */
  tokenShare: v.number(),
  stackCount: v.number(),
  /** How many stacks it leads - the honest population claim (#92). */
  leadsCount: v.number(),
})

const Row = v.object({
  rank: v.number(),
  /** Public slug, `${slug}-${shortId}` - what `/stacks/$slug` resolves. */
  slug: v.string(),
  name: v.string(),
  creatorName: v.string(),
  tokens: v.number(),
  lastSyncMs: v.number(),
  /** Every measured day in the window, even when `points` is capped. */
  syncCount: v.number(),
  points: v.array(v.object({ at: v.number(), tokens: v.number() })),
  topModel: v.union(
    v.object({ name: v.string(), share: v.number() }),
    v.null()
  ),
  harnesses: v.array(v.string()),
  spend: v.union(
    v.object({
      lowerBoundUSD: v.number(),
      coverage: v.number(),
      /** True when the CLI priced every token - no "≥" needed. */
      exact: v.boolean(),
    }),
    v.null()
  ),
})

const Board = v.object({
  /** The whole measured population, living and quiet. */
  stackCount: v.number(),
  livingCount: v.number(),
  totalTokens: v.number(),
  totalSessions: v.number(),
  /** Sum of every published lower bound - itself a lower bound. */
  spendLowerBoundUSD: v.number(),
  costPublishers: v.number(),
  /** Share of measured tokens carrying no model name. */
  unattributedShare: v.number(),
  /** Widest gap between two stacks' last syncs, in days. */
  windowSpreadDays: v.number(),
  models: v.array(Ranking),
  harnesses: v.array(Ranking),
  quiet: v.object({ count: v.number(), tokens: v.number() }),
  /** Every price table behind `spendLowerBoundUSD`, sorted. */
  pricingTables: v.array(v.string()),
  page: v.number(),
  pageSize: v.number(),
  totalPages: v.number(),
  rows: v.array(Row),
})

export type BoardReading = Infer<typeof Board>
export type ModelRanking = Infer<typeof Ranking>

/**
 * What one stack's inventory and 30-day fold contribute to the board. This is
 * exactly what a `leaderboardRollups` row stores (ADR-0014).
 *
 * WHAT IS IN HERE depends only on the stack's measured rows, the window and
 * the price table:
 *   - `lastSyncMs`, `tokens`, `sessions`, `points`, `activeHarnesses` and
 *     `modelTokens` change only when a sync writes rows or the window slides
 *     at UTC midnight. The model keys are the RAW measured ids, so a catalog
 *     rename cannot touch them.
 *   - `spend` and `pricingTables` also depend on `modelPrices`, for the days
 *     the CLI left unpriced and the backend fills. A stored copy is stale
 *     after a price change until the next refresh, at most one hour.
 *
 * WHAT IS NOT IN HERE is read or evaluated when the board is assembled, in
 * `toReading`, so it cannot go stale at all.
 */
type StackFigures = {
  lastSyncMs: number
  tokens: number
  sessions: number
  /** One point per measured UTC date in the window, oldest first. */
  points: { at: number; tokens: number }[]
  activeHarnesses: { name: string; tokens: number }[]
  /** Over the 30-day fold, in fold order; `unknown` kept for totals. */
  modelTokens: { id: string; tokens: number }[]
  spend: { lowerBoundUSD: number; coverage: number; exact: boolean } | null
  pricingTables: string[]
}

type StackReading = StackFigures & {
  stack: Doc<'stacks'>
  creator: Doc<'creators'> | null
  living: boolean
}

type DateWindow = { from: string; to: string }

/** The 30 UTC dates the board folds, ending today. Exported for the test oracle. */
export function boardWindow(now: number): DateWindow {
  return rangeDates('30d', now)
}

/**
 * One stack's board figures: freshness off the inventory rows, every sum off
 * the 30-day fold of its days (ADR-0011). A stack that published no days but
 * carries a legacy figure from the retirement migration reads that figure:
 * tokens and sessions only, no series and no price.
 *
 * `null` means the stack is not on the board: it has no inventory, or neither
 * a usage day inside the window nor a legacy figure.
 *
 * `loadDays` is the caller's day read. `refreshStack` loads the window through
 * `by_stack_date`. The test oracle loads the stack's whole history, as the
 * retired live read did. Both are filtered to the window here and arrive in
 * the same order, so the fold sees identical rows.
 *
 * Exported for the test oracle. `refreshStack` is the only production caller.
 */
export async function deriveFigures(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>,
  window: DateWindow,
  catalog: ModelCatalog,
  publishCost: boolean,
  loadDays: (window: DateWindow) => Promise<Doc<'measuredDays'>[]>
): Promise<StackFigures | null> {
  const inventory = newestInventoryPerSource(
    await inventoryForStack(ctx, stackId)
  )
  if (inventory.length === 0) return null
  const lastSyncMs = Math.max(...inventory.map((r) => r.receivedAt))

  const days = (await loadDays(window))
    .filter((row) => row.usage !== undefined && inDateRange(row.date, window))
    .map((row) => ({ date: row.date, usage: row.usage as UsageDay }))
  const reading = readUsageWindow(days, catalog, publishCost)

  if (reading === null) {
    const legacy = inventory.filter((r) => r.legacy !== undefined)
    if (legacy.length === 0) return null
    return {
      lastSyncMs,
      tokens: legacy.reduce((a, r) => a + (r.legacy?.tokens ?? 0), 0),
      sessions: legacy.reduce((a, r) => a + (r.legacy?.sessions ?? 0), 0),
      points: [],
      // `newestInventoryPerSource` already ordered the sources, so first
      // sighting of each name preserves Claude-Code-first.
      activeHarnesses: [...new Set(legacy.map((r) => r.harness))].map((name) => ({
        name,
        tokens: legacy
          .filter((r) => r.harness === name)
          .reduce((a, r) => a + (r.legacy?.tokens ?? 0), 0),
      })).filter((h) => h.tokens > 0),
      modelTokens: [],
      spend: null,
      pricingTables: [],
    }
  }

  // BY HARNESS NAME, not by source (#243). The board ranks harnesses and prints
  // "Claude Code + Codex" under a row; a stack running one harness on two
  // machines is one harness there. The fold already sums machines.
  const harnessOrder = new Map(inventory.map((r, i) => [r.harness, i]))
  const activeHarnesses = reading.harnesses
    .filter((h) => h.totalTokens > 0)
    .map((h) => ({ name: h.harness, tokens: h.totalTokens }))
    .sort(
      (a, b) =>
        (harnessOrder.get(a.name) ?? Infinity) - (harnessOrder.get(b.name) ?? Infinity)
    )

  const byDate = new Map<string, number>()
  for (const row of days) {
    let tokens = 0
    for (const h of row.usage.harnesses) {
      for (const m of h.models) tokens += totalOfTokens(m.tokens)
    }
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + tokens)
  }
  const points = [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, tokens]) => ({ at: Date.parse(`${date}T00:00:00.000Z`), tokens }))

  return {
    lastSyncMs,
    tokens: reading.totalTokens,
    sessions: reading.sessions,
    points,
    activeHarnesses,
    modelTokens: reading.models.map((m) => ({ id: m.id, tokens: m.totalTokens })),
    spend: reading.cost
      ? {
          lowerBoundUSD: reading.cost.usd,
          coverage: reading.cost.pricedShare,
          exact: !reading.cost.estimated && reading.cost.pricedShare >= 1,
        }
      : null,
    pricingTables: reading.cost?.pricingTables ?? [],
  }
}

/**
 * A stack's figures as the board reads them at `now`. Everything decided here
 * is decided at READ time, so none of it can be stale:
 *
 *   - `living` compares the stored `lastSyncMs` against the clock. A stack
 *     goes quiet 7 days after its last sync with no write anywhere.
 *   - `publishCost` is the consent gate (AGENTS.md, Pricing: check the flag).
 *     The flag changes nothing in a reading except the cost: with it off,
 *     `readUsageWindow` returns the same tokens, sessions, models and
 *     harnesses and a null cost. So the rollup stores the priced figures and
 *     the flag is checked here, on the live stack row. A toggle takes effect
 *     on the next read, and no writer of the flag needs a hook.
 *   - `stack` and `creator` are the live rows. The board takes the name, slug
 *     and creator name from them when it builds a row.
 *
 * Exported for the test oracle.
 */
export function toReading(
  stack: Doc<'stacks'>,
  creator: Doc<'creators'> | null,
  figures: StackFigures,
  now: number
): StackReading {
  const publishCost = stack.publishCost !== false
  return {
    ...figures,
    spend: publishCost ? figures.spend : null,
    pricingTables: publishCost ? figures.pricingTables : [],
    stack,
    creator,
    living: now - figures.lastSyncMs <= SEVEN_DAYS_MS,
  }
}

type Bucket = { tokens: number; stacks: number; leads: number }

function bump(
  map: Map<string, Bucket>,
  key: string,
  tokens: number,
  leads: boolean
) {
  const cur = map.get(key) ?? { tokens: 0, stacks: 0, leads: 0 }
  cur.tokens += tokens
  cur.stacks += 1
  if (leads) cur.leads += 1
  map.set(key, cur)
}

/** A rollup row back in the shape the derivation produced it. */
function figuresOfRollup(rollup: Doc<'leaderboardRollups'>): StackFigures {
  return {
    lastSyncMs: rollup.lastSyncMs,
    tokens: rollup.tokens,
    sessions: rollup.sessions,
    points: rollup.points,
    activeHarnesses: rollup.activeHarnesses,
    modelTokens: rollup.modelTokens,
    spend: rollup.spend,
    pricingTables: rollup.pricingTables,
  }
}

/**
 * The measured population: every stack with a rollup that is not flagged
 * (ADR-0014). No day is folded here.
 *
 * The quality flag is enforced HERE, not left to the client. The board is
 * discovery (#82), and a filter the frontend applies is a filter a crawler
 * does not. `/model` (#223) reads the same population, so the two can never
 * disagree on a share.
 *
 * THE ROLLUP TABLE IS THE DRIVER. `refreshStack` keeps a rollup exactly for
 * the stacks that have a board reading, so there is no scan of `stacks` and
 * no read of a measured table. Per rollup the query gets two rows by id:
 *
 *   - the stack, for `isLowQuality`, `publishCost`, the name and the slug.
 *     These change outside a sync (an admin flags a stack, the owner renames
 *     it or turns cost off). Reading the row is the option that cannot go
 *     stale, and it needs no hook in any of those writers. A rollup whose
 *     stack is gone is skipped, so an orphan never reaches the board;
 *   - the creator, for the name on the row.
 *
 * MODEL NAMES resolve here, from `models`, so a catalog rename shows on the
 * next read. `modelPrices` is not read at all: prices are already inside the
 * stored spend.
 *
 * THE ORDER IS THE STACKS' CREATION ORDER. That order breaks ties in the
 * board (two stacks with the same tokens and name, two models with the same
 * share). Rollups are created in sync order, so the readings are sorted back
 * by the stack's creation time.
 *
 * WHAT CAN BE BEHIND, and for how long: a rollup holds the window and the
 * prices of its last refresh. After UTC midnight, or after a price change, it
 * is stale until the hourly cron reaches it.
 *
 * A STALE WINDOW IS LOGGED AND STILL SERVED. A rollup whose `windowTo` is not
 * today's is behind by at least one refresh. Right after UTC midnight that is
 * the cron's normal lag of a few seconds. If the warning keeps appearing, a
 * `refreshStack` keeps failing (a stack too heavy for the one-second limit,
 * for example) and the board serves that stack's old window. The rows are
 * neither dropped nor changed: an old figure is better than a missing stack.
 */
async function readRollupPopulation(ctx: QueryCtx, now: number) {
  const [rollups, catalog] = await Promise.all([
    ctx.db.query('leaderboardRollups').collect(),
    loadModelNames(ctx),
  ])

  const windowTo = boardWindow(now).to
  const stale = rollups.filter((r) => r.windowTo !== windowTo)
  if (stale.length > 0) {
    console.warn(
      `leaderboard: ${stale.length} of ${rollups.length} rollups hold a window that does not end ${windowTo}, for example stack ${stale[0].stackId} (window ends ${stale[0].windowTo})`
    )
  }

  const stacks = await Promise.all(rollups.map((r) => ctx.db.get(r.stackId)))

  // One reading per stack. `refreshStack` keeps one row per stack; a second
  // one would double the stack's tokens, so the read does not trust that.
  const seen = new Set<Id<'stacks'>>()
  const visible: { stack: Doc<'stacks'>; rollup: Doc<'leaderboardRollups'> }[] = []
  rollups.forEach((rollup, i) => {
    const stack = stacks[i]
    if (!stack || stack.isLowQuality === true || seen.has(stack._id)) return
    seen.add(stack._id)
    visible.push({ stack, rollup })
  })
  const creators = await Promise.all(
    visible.map(({ stack }) => ctx.db.get(stack.creatorId))
  )

  const readings = visible
    .map(({ stack, rollup }, i) =>
      toReading(stack, creators[i], figuresOfRollup(rollup), now)
    )
    .sort(
      (a, b) =>
        a.stack._creationTime - b.stack._creationTime ||
        (a.stack._id < b.stack._id ? -1 : a.stack._id > b.stack._id ? 1 : 0)
    )
  return { readings, catalog }
}

function namedModels(r: StackReading): [string, number][] {
  return r.modelTokens
    .filter((m) => m.id !== 'unknown')
    .map((m) => [m.id, m.tokens])
}

function leadOf(named: [string, number][]): [string, number] | null {
  return named.reduce(
    (a, b) => (a === null || b[1] > a[1] ? b : a),
    null as [string, number] | null
  )
}

/** Every named model over the population, token-weighted over attributed tokens. */
function rankModels(readings: StackReading[], catalog: ModelNames) {
  let attributed = 0
  const models = new Map<string, Bucket>()
  for (const r of readings) {
    const named = namedModels(r)
    const lead = leadOf(named)
    for (const [id, tokens] of named) {
      attributed += tokens
      bump(models, id, tokens, lead !== null && lead[0] === id)
    }
  }
  const modelName = (id: string) =>
    resolveModelId(catalog, id).catalogName ?? id
  return {
    attributed,
    models: [...models.entries()]
      .map(([key, b]) => ({
        key,
        name: modelName(key),
        tokenShare: attributed > 0 ? b.tokens / attributed : 0,
        stackCount: b.stacks,
        leadsCount: b.leads,
      }))
      .sort((a, b) => b.tokenShare - a.tokenShare || b.stackCount - a.stackCount),
  }
}

/**
 * One model's adoption, for `/model` (#223). The name resolves against the
 * catalog (slug, alias, or display name, case-insensitive) and then against
 * the raw measured ids, so a model the catalog has not filed still answers.
 * `null` means no model of that name exists anywhere; a catalog model no
 * stack ran comes back with a zero `stackCount`.
 */
export const model = query({
  args: { name: v.string() },
  returns: v.union(Ranking, v.null()),
  handler: async (ctx, args) => {
    const wanted = args.name.trim().toLowerCase()
    if (wanted === '' || wanted === 'unknown') return null
    const { readings, catalog } = await readRollupPopulation(ctx, Date.now())
    const ranked = rankModels(readings, catalog)

    const catalogRow =
      catalog.bySlug.get(wanted) ??
      catalog.byAlias.get(wanted) ??
      [...catalog.bySlug.values()].find((m) => m.name.toLowerCase() === wanted)
    const keys = new Set<string>()
    if (catalogRow) {
      keys.add(catalogRow.slug)
      for (const [alias, row] of catalog.byAlias) {
        if (row._id === catalogRow._id) keys.add(alias)
      }
    }
    const hit =
      ranked.models.find((m) => keys.has(m.key)) ??
      ranked.models.find((m) => m.key.toLowerCase() === wanted)
    if (hit) return hit
    if (!catalogRow) return null
    return {
      key: catalogRow.slug,
      name: catalogRow.name,
      tokenShare: 0,
      stackCount: 0,
      leadsCount: 0,
    }
  },
})

/**
 * The board over one population. Exported for the test oracle, which hands it
 * live readings, so the oracle board and the served board are assembled by
 * the same code.
 */
export function buildBoard(
  readings: StackReading[],
  catalog: ModelNames,
  requestedPage: number | undefined
): BoardReading {
  const byTokens = (a: StackReading, b: StackReading) =>
    b.tokens - a.tokens || a.stack.name.localeCompare(b.stack.name)
  const living = readings.filter((r) => r.living).sort(byTokens)
  const quiet = readings.filter((r) => !r.living)

  // --- rail figures, over the whole measured population -------------------

  let totalTokens = 0
  let totalSessions = 0
  let spendLowerBoundUSD = 0
  let costPublishers = 0
  const pricingTables = new Set<string>()
  const harnesses = new Map<string, Bucket>()
  const { attributed, models } = rankModels(readings, catalog)

  for (const r of readings) {
    totalTokens += r.tokens
    totalSessions += r.sessions
    if (r.spend) {
      spendLowerBoundUSD += r.spend.lowerBoundUSD
      costPublishers += 1
      for (const table of r.pricingTables) pricingTables.add(table)
    }
    const leadHarness = r.activeHarnesses.reduce(
      (a, b) => (a === null || b.tokens > a.tokens ? b : a),
      null as { name: string; tokens: number } | null
    )
    for (const h of r.activeHarnesses) {
      bump(harnesses, h.name, h.tokens, leadHarness?.name === h.name)
    }
  }

  const modelName = (id: string) =>
    resolveModelId(catalog, id).catalogName ?? id

  const rankOf = (
    map: Map<string, Bucket>,
    denominator: number,
    name: (key: string) => string
  ) =>
    [...map.entries()]
      .map(([key, b]) => ({
        key,
        name: name(key),
        tokenShare: denominator > 0 ? b.tokens / denominator : 0,
        stackCount: b.stacks,
        leadsCount: b.leads,
      }))
      .sort(
        (a, b) => b.tokenShare - a.tokenShare || b.stackCount - a.stackCount
      )

  const syncs = readings.map((r) => r.lastSyncMs)
  const windowSpreadDays =
    syncs.length > 1
      ? (Math.max(...syncs) - Math.min(...syncs)) / DAY_MS
      : 0

  // --- the board ----------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(living.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Math.round(requestedPage ?? 1)), totalPages)
  const rows = living
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((r, i) => {
      const top = leadOf(namedModels(r))
      return {
        rank: (page - 1) * PAGE_SIZE + i + 1,
        slug: `${r.stack.slug}-${r.stack.shortId}`,
        name: r.stack.name,
        creatorName: r.creator?.name ?? '',
        tokens: r.tokens,
        lastSyncMs: r.lastSyncMs,
        syncCount: r.points.length,
        points: r.points.slice(-MAX_POINTS),
        topModel:
          top && r.tokens > 0
            ? { name: modelName(top[0]), share: top[1] / r.tokens }
            : null,
        harnesses: r.activeHarnesses.map((h) => h.name),
        spend: r.spend,
      }
    })

  return {
    stackCount: readings.length,
    livingCount: living.length,
    totalTokens,
    totalSessions,
    spendLowerBoundUSD: round2(spendLowerBoundUSD),
    costPublishers,
    unattributedShare:
      totalTokens > 0 ? (totalTokens - attributed) / totalTokens : 0,
    windowSpreadDays,
    models: models.slice(0, MAX_RAIL_MODELS),
    harnesses: rankOf(harnesses, totalTokens, (k) => k).slice(
      0,
      MAX_RAIL_HARNESSES
    ),
    quiet: {
      count: quiet.length,
      tokens: quiet.reduce((a, r) => a + r.tokens, 0),
    },
    pricingTables: [...pricingTables].sort(),
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    rows,
  }
}

export const get = query({
  args: { page: v.optional(v.number()) },
  returns: Board,
  handler: async (ctx, args) => {
    const { readings, catalog } = await readRollupPopulation(ctx, Date.now())
    return buildBoard(readings, catalog, args.page)
  },
})

// ---------------------------------------------------------------------------
// The rollup write (ADR-0014)
// ---------------------------------------------------------------------------

type RollupContent = StackFigures & {
  stackId: Id<'stacks'>
  windowFrom: string
  windowTo: string
}

/**
 * The content of a rollup in one fixed key order, so two of them compare as
 * strings. `computedAt` is left out on purpose: it is when the content last
 * changed, and it must not make an unchanged recompute look like a change.
 */
function rollupContent(row: RollupContent): RollupContent {
  return {
    stackId: row.stackId,
    windowFrom: row.windowFrom,
    windowTo: row.windowTo,
    lastSyncMs: row.lastSyncMs,
    tokens: row.tokens,
    sessions: row.sessions,
    points: row.points.map((p) => ({ at: p.at, tokens: p.tokens })),
    activeHarnesses: row.activeHarnesses.map((h) => ({
      name: h.name,
      tokens: h.tokens,
    })),
    modelTokens: row.modelTokens.map((m) => ({ id: m.id, tokens: m.tokens })),
    spend: row.spend
      ? {
          lowerBoundUSD: row.spend.lowerBoundUSD,
          coverage: row.spend.coverage,
          exact: row.spend.exact,
        }
      : null,
    pricingTables: [...row.pricingTables],
  }
}

const RefreshOutcome = v.union(
  /** The rollup was inserted or replaced. */
  v.literal('written'),
  /** The recompute equals the stored row. Nothing was written. */
  v.literal('unchanged'),
  /** The stack has no board reading anymore, or is gone. The row was removed. */
  v.literal('deleted'),
  /** No board reading and no row. Nothing to do. */
  v.literal('absent')
)

/**
 * Recompute one stack's rollup and store it. One stack per mutation, so each
 * refresh has its own one-second budget however many stacks there are.
 *
 * The day read is bounded to the window through `by_stack_date`. A stack with
 * a year of history reads at most 30 dates per machine here, where the
 * retired live read loaded every day the stack ever published.
 *
 * PRICED AS IF `publishCost` WERE ON. The flag is checked at read time
 * (`toReading`), so the stored row does not depend on it and a toggle needs no
 * refresh. For a stack with the flag off, the row therefore holds dollars the
 * stack never published, including the backend's estimate for days the CLI
 * left unpriced. `toReading` is the only way out of this table: any new
 * reader must go through it, or it bypasses the consent gate.
 *
 * AN UNCHANGED RECOMPUTE WRITES NOTHING. A write to the table invalidates the
 * board's cached query result, so an idle hour of the cron must not write.
 *
 * A stack that lost its reading (no inventory, no day in the window and no
 * legacy figure) or that no longer exists has its row deleted, so no orphan
 * outlives the next refresh.
 */
export const refreshStack = internalMutation({
  args: { stackId: v.id('stacks') },
  returns: RefreshOutcome,
  handler: async (ctx, args) => {
    const [existing, ...duplicates] = await ctx.db
      .query('leaderboardRollups')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    for (const row of duplicates) await ctx.db.delete(row._id)

    const now = Date.now()
    const window = boardWindow(now)
    const stack = await ctx.db.get(args.stackId)
    const figures = stack
      ? await deriveFigures(
          ctx,
          stack._id,
          window,
          await loadModelCatalog(ctx),
          true,
          (range) => measuredDaysForStackInRange(ctx, stack._id, range)
        )
      : null

    if (figures === null) {
      if (!existing) return 'absent' as const
      await ctx.db.delete(existing._id)
      return 'deleted' as const
    }

    const next = rollupContent({
      stackId: args.stackId,
      windowFrom: window.from,
      windowTo: window.to,
      ...figures,
    })
    if (!existing) {
      await ctx.db.insert('leaderboardRollups', { ...next, computedAt: now })
      return 'written' as const
    }
    if (JSON.stringify(rollupContent(existing)) === JSON.stringify(next)) {
      return 'unchanged' as const
    }
    await ctx.db.replace(existing._id, { ...next, computedAt: now })
    return 'written' as const
  },
})

/**
 * The hourly cron's function: schedule one `refreshStack` per measured stack.
 * It folds nothing itself. See `fanOutRollupRefresh`.
 *
 * Two things move a rollup without a sync, and this is what catches both: the
 * window slides at UTC midnight, and a price change re-prices the days the
 * backend fills. Either is on the board within one run.
 */
export const refreshAll = internalMutation({
  args: {},
  returns: v.object({ scheduled: v.number() }),
  handler: async (ctx): Promise<{ scheduled: number }> => {
    return await fanOutRollupRefresh(ctx)
  },
})
