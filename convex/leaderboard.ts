import {
  inDateRange,
  rangeDates,
  totalOfTokens,
  type UsageDay,
} from '@aistack/workflow-rules'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'
import { query } from './_generated/server'
import {
  inventoryForStack,
  measuredDaysForStack,
  newestInventoryPerSource,
} from './lib/measuredDays'
import { round2 } from './lib/reprice'
import { loadModelCatalog, type ModelCatalog, readUsageWindow } from './measured'

/**
 * The read model behind `/leaderboard`. Wayfinder ticket #83 (map #76), spine
 * locked by #92, scope by #82.
 *
 * READS ARE LIVE, NOT PRECOMPUTED (#82, recorded consequence). No rollup table
 * and no cron: every figure is derived from `measuredDays` and
 * `measuredInventory` at read time (ADR-0011), so the page can never disagree
 * with the stack pages. The cost of that choice is stated in #82 - two indexed
 * reads per measured stack cap this in the low thousands of stacks, and a
 * later rollup must reproduce these numbers exactly. The population table
 * (`stacks`) is the driver, never a full scan of the measured tables.
 *
 * EXCLUSIONS (#82, applied here once so every figure agrees):
 *   - unpublished stacks and `isLowQuality` stacks do not exist here at all -
 *     the board is discovery, and the flag means hidden from discovery;
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
  page: v.number(),
  pageSize: v.number(),
  totalPages: v.number(),
  rows: v.array(Row),
})

type StackReading = {
  stack: Doc<'stacks'>
  creator: Doc<'creators'> | null
  living: boolean
  lastSyncMs: number
  tokens: number
  sessions: number
  /** One point per measured UTC date in the window, oldest first. */
  points: { at: number; tokens: number }[]
  activeHarnesses: { name: string; tokens: number }[]
  /** Over the 30-day fold; `unknown` kept for totals. */
  modelTokens: Map<string, number>
  spend: { lowerBoundUSD: number; coverage: number; exact: boolean } | null
}

/**
 * One stack's board reading: freshness off the inventory rows, every sum off
 * the 30-day fold of its days (ADR-0011). A stack that published no days but
 * carries a legacy figure from the retirement migration reads that figure:
 * tokens and sessions only, no series and no price.
 */
async function readStack(
  ctx: QueryCtx,
  stack: Doc<'stacks'>,
  now: number,
  catalog: ModelCatalog
): Promise<StackReading | null> {
  const inventory = newestInventoryPerSource(
    await inventoryForStack(ctx, stack._id)
  )
  if (inventory.length === 0) return null
  const lastSyncMs = Math.max(...inventory.map((r) => r.receivedAt))

  const window = rangeDates('30d', now)
  const days = (await measuredDaysForStack(ctx, stack._id))
    .filter((row) => row.usage !== undefined && inDateRange(row.date, window))
    .map((row) => ({ date: row.date, usage: row.usage as UsageDay }))
  const publishCost = stack.publishCost !== false
  const reading = readUsageWindow(days, catalog, publishCost)

  const base = {
    stack,
    creator: await ctx.db.get(stack.creatorId),
    living: now - lastSyncMs <= SEVEN_DAYS_MS,
    lastSyncMs,
  }

  if (reading === null) {
    const legacy = inventory.filter((r) => r.legacy !== undefined)
    if (legacy.length === 0) return null
    return {
      ...base,
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
      modelTokens: new Map(),
      spend: null,
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
    ...base,
    tokens: reading.totalTokens,
    sessions: reading.sessions,
    points,
    activeHarnesses,
    modelTokens: new Map(reading.models.map((m) => [m.id, m.totalTokens])),
    spend: reading.cost
      ? {
          lowerBoundUSD: reading.cost.usd,
          coverage: reading.cost.pricedShare,
          exact: !reading.cost.estimated && reading.cost.pricedShare >= 1,
        }
      : null,
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

export const get = query({
  args: { page: v.optional(v.number()) },
  returns: Board,
  handler: async (ctx, args) => {
    const now = Date.now()

    // The population: published, not flagged. `by_published` narrows to the
    // public set; the quality flag is enforced HERE, not left to the client -
    // the board is discovery (#82), and a filter the frontend applies is a
    // filter a crawler does not.
    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_published', (q) => q.eq('published', true))
      .collect()

    const catalog = await loadModelCatalog(ctx)
    const readings: StackReading[] = []
    for (const stack of stacks) {
      if (stack.isLowQuality === true) continue
      const reading = await readStack(ctx, stack, now, catalog)
      if (reading) readings.push(reading)
    }

    const byTokens = (a: StackReading, b: StackReading) =>
      b.tokens - a.tokens || a.stack.name.localeCompare(b.stack.name)
    const living = readings.filter((r) => r.living).sort(byTokens)
    const quiet = readings.filter((r) => !r.living)

    // --- rail figures, over the whole measured population -------------------

    let totalTokens = 0
    let totalSessions = 0
    let attributed = 0
    let spendLowerBoundUSD = 0
    let costPublishers = 0
    const models = new Map<string, Bucket>()
    const harnesses = new Map<string, Bucket>()

    for (const r of readings) {
      totalTokens += r.tokens
      totalSessions += r.sessions
      if (r.spend) {
        spendLowerBoundUSD += r.spend.lowerBoundUSD
        costPublishers += 1
      }
      const named = [...r.modelTokens.entries()].filter(
        ([id]) => id !== 'unknown'
      )
      const lead = named.reduce(
        (a, b) => (a === null || b[1] > a[1] ? b : a),
        null as [string, number] | null
      )
      for (const [id, tokens] of named) {
        attributed += tokens
        bump(models, id, tokens, lead !== null && lead[0] === id)
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
      (catalog.bySlug.get(id) ?? catalog.byAlias.get(id))?.name ?? id

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
    const page = Math.min(Math.max(1, Math.round(args.page ?? 1)), totalPages)
    const rows = living
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      .map((r, i) => {
        const named = [...r.modelTokens.entries()].filter(
          ([id]) => id !== 'unknown'
        )
        const top = named.reduce(
          (a, b) => (a === null || b[1] > a[1] ? b : a),
          null as [string, number] | null
        )
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
      models: rankOf(models, attributed, modelName).slice(0, MAX_RAIL_MODELS),
      harnesses: rankOf(harnesses, totalTokens, (k) => k).slice(
        0,
        MAX_RAIL_HARNESSES
      ),
      quiet: {
        count: quiet.length,
        tokens: quiet.reduce((a, r) => a + r.tokens, 0),
      },
      page,
      pageSize: PAGE_SIZE,
      totalPages,
      rows,
    }
  },
})
