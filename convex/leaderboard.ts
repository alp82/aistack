import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'
import { query } from './_generated/server'
import { repriceSnapshot, round2 } from './lib/reprice'
import { loadModelCatalog } from './measured'

/**
 * The read model behind `/leaderboard`. Wayfinder ticket #83 (map #76), spine
 * locked by #92, scope by #82.
 *
 * READS ARE LIVE, NOT PRECOMPUTED (#82, recorded consequence). No rollup table
 * and no cron: every figure is derived from `measuredSnapshots` at read time,
 * so the page can never disagree with the stack pages. The cost of that choice
 * is stated in #82 — one indexed read per measured stack caps this in the low
 * thousands of stacks, and a later rollup must reproduce these numbers exactly.
 * The shape here is the middle option the ticket named: INDEXED per-stack
 * reads over the population, never a full `measuredSnapshots` scan — the
 * population table (`stacks`) is the driver, and each stack's rows come from
 * `by_stack_capturedAt`, bounded by the GC to about one row per harness per
 * day.
 *
 * EXCLUSIONS (#82, applied here once so every figure agrees):
 *   - unpublished stacks and `isLowQuality` stacks do not exist here at all —
 *     the board is discovery, and the flag means hidden from discovery;
 *   - a harness reporting zero tokens is not a harness;
 *   - `unknown` is not a model name: its tokens count toward totals and the
 *     unattributed share, but it never ranks and never leads a row;
 *   - a stack with `publishCost` off has no cost, not a cost of zero;
 *   - no sync in 7 days means listed in the quiet line, never ranked.
 *
 * THE SERIES is the same fold `getHistoryByStackSlug` performs, reduced to the
 * one number a sparkline draws: the rolling 30-day total as it stood at each
 * sync, a harness that did not sync carrying its previous reading forward.
 * Tokens only — no catalog resolution and no pricing per point — so ten rows
 * cost ten short folds, not ten stack-page reads.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
/** Rows captured inside the same minute are one sync (matches the history). */
const SYNC_BUCKET_MS = 60_000
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
  /** How many stacks it leads — the honest population claim (#92). */
  leadsCount: v.number(),
})

const Row = v.object({
  rank: v.number(),
  /** Public slug, `${slug}-${shortId}` — what `/stacks/$slug` resolves. */
  slug: v.string(),
  name: v.string(),
  creatorName: v.string(),
  tokens: v.number(),
  lastSyncMs: v.number(),
  /** Every reading the stack has, even when `points` is capped. */
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
      /** True when the CLI priced every token — no "≥" needed. */
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
  /** Sum of every published lower bound — itself a lower bound. */
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

type Snapshot = Doc<'measuredSnapshots'>

const tokensOf = (t: {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}) => t.input + t.output + t.cacheWrite + t.cacheRead

/** Claude Code first (the documented default), then alphabetical. */
function harnessOrder(a: string, b: string): number {
  if (a === b) return 0
  if (a === 'claude-code') return -1
  if (b === 'claude-code') return 1
  return a.localeCompare(b)
}

/** The newest snapshot of each harness, the same rule the stack page reads. */
function newestPerHarness(rows: Snapshot[]): Snapshot[] {
  const byHarness = new Map<string, Snapshot>()
  for (const row of rows) {
    const held = byHarness.get(row.harness)
    if (!held || row.capturedAt > held.capturedAt) byHarness.set(row.harness, row)
  }
  return [...byHarness.values()].sort((a, b) =>
    harnessOrder(a.harness, b.harness)
  )
}

/**
 * The rolling total as it stood at each sync: fold the rows forward holding
 * the newest reading per harness, one point per sync minute.
 */
function seriesOf(rows: Snapshot[]): { at: number; tokens: number }[] {
  const ordered = [...rows].sort((a, b) => a.capturedAt - b.capturedAt)
  const held = new Map<string, number>()
  const points: { at: number; tokens: number }[] = []
  let bucket: number | null = null
  let bucketAt = 0

  const flush = () => {
    if (bucket === null) return
    let total = 0
    for (const tokens of held.values()) total += tokens
    points.push({ at: bucketAt, tokens: total })
    bucket = null
  }

  for (const row of ordered) {
    const key = Math.floor(row.capturedAt / SYNC_BUCKET_MS)
    if (key !== bucket) {
      flush()
      bucket = key
      bucketAt = row.capturedAt
    }
    held.set(row.harness, row.payload.activity.totalTokens)
  }
  flush()
  return points
}

type StackReading = {
  stack: Doc<'stacks'>
  creator: Doc<'creators'> | null
  living: boolean
  lastSyncMs: number
  tokens: number
  sessions: number
  points: { at: number; tokens: number }[]
  activeHarnesses: { name: string; tokens: number }[]
  /** Merged over the newest reading per harness; `unknown` kept for totals. */
  modelTokens: Map<string, number>
  spend: { lowerBoundUSD: number; coverage: number; exact: boolean } | null
}

async function readStack(
  ctx: QueryCtx,
  stack: Doc<'stacks'>,
  now: number
): Promise<StackReading | null> {
  const rows = await ctx.db
    .query('measuredSnapshots')
    .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', stack._id))
    .collect()
  if (rows.length === 0) return null

  const newest = newestPerHarness(rows)
  const lastSyncMs = Math.max(...rows.map((r) => r.receivedAt))

  let tokens = 0
  let sessions = 0
  const modelTokens = new Map<string, number>()
  const activeHarnesses: { name: string; tokens: number }[] = []
  const publishCost = stack.publishCost !== false
  const costs = []

  for (const snapshot of newest) {
    const p = snapshot.payload
    tokens += p.activity.totalTokens
    sessions += p.activity.sessions
    if (p.activity.totalTokens > 0) {
      activeHarnesses.push({
        name: p.harness.name,
        tokens: p.activity.totalTokens,
      })
    }
    for (const m of p.models) {
      modelTokens.set(m.id, (modelTokens.get(m.id) ?? 0) + tokensOf(m.tokens))
    }
    const { cost } = repriceSnapshot({
      models: p.models,
      window: p.window,
      publishedTable: p.pricingTable,
      publishCost,
    })
    if (cost) costs.push(cost)
  }

  let spend: StackReading['spend'] = null
  if (costs.length > 0) {
    const priced = costs.reduce((a, c) => a + c.pricedTokens, 0)
    const measured = costs.reduce((a, c) => a + c.measuredTokens, 0)
    spend = {
      lowerBoundUSD: round2(costs.reduce((a, c) => a + c.lowerBoundUSD, 0)),
      coverage: measured > 0 ? priced / measured : 0,
      exact:
        costs.every((c) => c.estimatedUSD === 0) &&
        measured > 0 &&
        priced >= measured,
    }
  }

  return {
    stack,
    creator: await ctx.db.get(stack.creatorId),
    living: now - lastSyncMs <= SEVEN_DAYS_MS,
    lastSyncMs,
    tokens,
    sessions,
    points: seriesOf(rows),
    activeHarnesses,
    modelTokens,
    spend,
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
    // public set; the quality flag is enforced HERE, not left to the client —
    // the board is discovery (#82), and a filter the frontend applies is a
    // filter a crawler does not.
    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_published', (q) => q.eq('published', true))
      .collect()

    const readings: StackReading[] = []
    for (const stack of stacks) {
      if (stack.isLowQuality === true) continue
      const reading = await readStack(ctx, stack, now)
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

    const catalog = await loadModelCatalog(ctx)
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
