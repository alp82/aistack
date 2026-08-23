import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'
import { query } from './_generated/server'
import type { ActivityEventValue } from './activity'
import { newestPerSource } from './lib/sources'
import { ActivityEvent } from './schema'

/**
 * The activity feed's READ side. Wayfinder ticket #85 (map #76), band locked by
 * #84, page locked by #96, data model by #77.
 *
 * Two surfaces, one table. `band` is the 24-hour claim that opens both the
 * landing page and `/activity`. `stream` is the day-grouped list under it, 25
 * rows per click of "older".
 *
 * VISIBILITY IS ENFORCED HERE, at read time (#77). That is the only place it
 * can be correct: a stack can be unpublished after its event is written, and
 * this table never mutates. A row shows only while its stack is `published` and
 * not `isLowQuality` - a deleted stack hides its rows the same way. The write
 * side's draft gate is not redundant, it only stops a week of drafting from
 * filling the table with rows that can never be shown.
 *
 * MOVEMENT IS DERIVED, NOT STORED (#84). `alp synced 4.99B` is the same
 * sentence every day, because a snapshot is a rolling 30-day total. What is
 * news is the change, so a sync row carries the difference against that stack's
 * previous visible sync - computed across the rows the scan already walks, so
 * the table needs no delta column and no second index.
 *
 * THE BAND'S FOUR NUMBERS COME FROM `measuredSnapshots`, not from the events
 * (#84 build rule 1): `tools` and `models` are not on `sync.landed` at all.
 * Sessions and projects SUM across stacks; models and tools UNION, because two
 * people running Opus is one model and two people running Bash is one tool.
 * Each stack contributes only its LATEST sync in the window, or a stack that
 * synced twice would report its sessions twice.
 *
 * A LEVEL OR A MOVEMENT, NEVER A THIRD THING (#128, built in #129). The band's
 * five tiles and the watermark behind them are LEVELS - they take no sign and
 * they may fall. The rows under them are MOVEMENTS, and a movement always
 * carries its sign. Nothing floors, and nothing drops the fallers before
 * summing.
 */

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** The band's claim, in words on the surface: "the last 24 hours". */
const BAND_WINDOW_MS = 24 * HOUR_MS
/**
 * How far back the daily points reach. They feed the /activity watermark and
 * the landing hero's trend chart, whose range select offers 30 days (#147) -
 * the SCAN_CAP below still bounds the walk.
 */
const WATERMARK_DAYS = 30
/** Evidence rows under the band. Four, locked in #84. */
const BAND_ROWS = 4
/** One click of "older" (#96). */
export const PAGE_SIZE = 25
/** The most rows one stream read returns, however many times "older" is hit. */
export const MAX_ROWS = 500
/**
 * The most events one read may walk. Hidden rows and delta lookups both scan
 * past the rows they return, so the walk is bounded rather than trusted to end.
 */
const SCAN_CAP = 2000

const EventType = v.union(
  v.literal('stack.published'),
  v.literal('stack.composition_changed'),
  v.literal('sync.landed')
)

const FeedRow = v.object({
  /** The event document id - stable, so a live insert keys correctly. */
  id: v.string(),
  at: v.number(),
  stack: v.object({
    name: v.string(),
    /** Public slug, `${slug}-${shortId}` - what `/stacks/$slug` resolves. */
    slug: v.string(),
    creator: v.string(),
  }),
  event: ActivityEvent,
  /**
   * Tokens gained or lost against this stack's previous visible sync. Null on
   * anything that is not a sync, and on a sync with no known predecessor.
   */
  deltaTokens: v.union(v.number(), v.null()),
  /**
   * True only when the walk reached the end of the table without finding an
   * earlier sync - so "first reading" is a fact, not the absence of one. A
   * `deltaTokens` of null with this false means the predecessor sits beyond the
   * scan bound, and the surface says nothing about movement rather than
   * claiming a first.
   */
  firstReading: v.boolean(),
})

const Band = v.object({
  totals: v.object({
    syncs: v.number(),
    /** Stacks published plus compositions changed - one number on the surface. */
    updates: v.number(),
    /** Distinct stacks with any activity in the watermark window. */
    stacksSeen: v.number(),
  }),
  usage: v.object({
    sessions: v.number(),
    projects: v.number(),
    models: v.number(),
    tools: v.number(),
    /**
     * The total the stacks that synced in the window are carrying - a LEVEL,
     * like its three neighbors, so it takes no sign and may fall (#128). It is
     * NOT a movement: the tile used to sum the risers and delete the fallers,
     * which no true sentence described.
     */
    tokens: v.number(),
    /** Stacks that synced in the window. Zero means quiet, and quiet is not 0. */
    stacks: v.number(),
  }),
  /** One point per UTC day, oldest first. The level measured that day. */
  points: v.array(v.object({ at: v.number(), value: v.number() })),
  rows: v.array(FeedRow),
})

type EventTypeValue = ActivityEventValue['type']

type VisibleStack = { name: string; slug: string; creator: string }

type ScanRow = {
  id: string
  at: number
  stackId: Id<'stacks'>
  stack: VisibleStack
  event: ActivityEventValue
  deltaTokens: number | null
  firstReading: boolean
}

/** The rolling total a sync reported, summed over the harnesses in its batch. */
function syncTokens(event: ActivityEventValue): number | null {
  if (event.type !== 'sync.landed') return null
  return event.harnesses.reduce((sum, h) => sum + h.totalTokens, 0)
}

/**
 * The stack behind an event, or null when it may not be shown.
 *
 * Cached per read: a feed page is mostly a handful of stacks repeating, so this
 * turns one point-read per row into one per distinct stack.
 */
async function visibleStack(
  ctx: QueryCtx,
  cache: Map<string, VisibleStack | null>,
  stackId: Id<'stacks'>
): Promise<VisibleStack | null> {
  const key = stackId as string
  const held = cache.get(key)
  if (held !== undefined) return held

  const stack = await ctx.db.get(stackId)
  let visible: VisibleStack | null = null
  if (stack && stack.published && stack.isLowQuality !== true) {
    const creator = await ctx.db.get(stack.creatorId)
    visible = {
      name: stack.name,
      slug: `${stack.slug}-${stack.shortId}`,
      creator: creator?.name ?? '',
    }
  }
  cache.set(key, visible)
  return visible
}

/**
 * Walk `by_createdAt` newest-first and return the rows a surface may show.
 *
 * One walk answers three questions at once, which is why it is not three
 * queries: which rows are visible, whether more exist below them, and what each
 * sync moved. The delta needs the NEXT older sync of the same stack, which the
 * descending walk reaches after the row itself - so a row is parked in
 * `pending` until its predecessor turns up, and the walk keeps going while any
 * row is still parked.
 */
async function scanFeed(
  ctx: QueryCtx,
  opts: { limit: number; since?: number; type?: EventTypeValue }
): Promise<{ rows: ScanRow[]; hasMore: boolean }> {
  const cache = new Map<string, VisibleStack | null>()
  const rows: ScanRow[] = []
  const pending = new Map<string, { index: number; tokens: number }>()
  let hasMore = false
  /** Set once nothing below can be wanted. The walk then only settles deltas. */
  let closed = false
  let scanned = 0

  for await (const event of ctx.db
    .query('activityEvents')
    .withIndex('by_createdAt')
    .order('desc')) {
    scanned += 1
    if (scanned > SCAN_CAP) break

    const stack = await visibleStack(ctx, cache, event.stackId)
    if (!stack) continue

    const key = event.stackId as string
    const tokens = syncTokens(event.event)
    if (tokens !== null) {
      const waiting = pending.get(key)
      if (waiting) {
        rows[waiting.index].deltaTokens = waiting.tokens - tokens
        pending.delete(key)
      }
    }

    if (opts.since !== undefined && event.createdAt < opts.since) closed = true
    const wanted =
      !closed && (opts.type === undefined || event.event.type === opts.type)

    if (wanted) {
      if (rows.length >= opts.limit) {
        // One row past the limit is proof that "older" has something to show.
        hasMore = true
        closed = true
      } else {
        rows.push({
          id: event._id,
          at: event.createdAt,
          stackId: event.stackId,
          stack,
          event: event.event,
          deltaTokens: null,
          firstReading: false,
        })
        if (tokens !== null) {
          pending.set(key, { index: rows.length - 1, tokens })
        }
      }
    }

    if (closed && pending.size === 0) break
  }

  // A row still parked found no earlier sync EVENT, which is not the same as no
  // earlier sync (#129). The events table starts where #78 turned
  // instrumentation on, and the walk is bounded, so neither the end of the
  // table nor the end of the walk can settle the claim. The snapshots can, so
  // the claim rests on them.
  for (const parked of pending.values()) {
    const row = rows[parked.index]
    const prior = await priorTotal(ctx, row.stackId, row.at)
    if (prior === null) row.firstReading = true
    else row.deltaTokens = parked.tokens - prior
  }

  return { rows, hasMore }
}

/**
 * The rolling total this stack carried BEFORE the sync stamped `before`, read
 * from `measuredSnapshots` - or null when no earlier reading exists at all.
 *
 * This is what makes "first reading" a fact (#129). `activityEvents` only
 * reaches back to #78, so a stack that synced nine times before that had every
 * one of those readings claimed as its first. The snapshots hold one immutable
 * row per approved sync since the stack began, and nothing prunes them.
 *
 * `receivedAt` is the server clock the event is stamped with, and every
 * snapshot of one batch shares it - so a strict `<` drops this sync's own rows
 * and keeps every earlier one. `capturedAt` is the client clock and cannot be
 * compared to an event timestamp at all.
 *
 * One indexed read per parked row, which is at most one per distinct stack in
 * the walk - the same bound `usageFor` already pays for the band.
 */
async function priorTotal(
  ctx: QueryCtx,
  stackId: Id<'stacks'>,
  before: number
): Promise<number | null> {
  const snapshots = await ctx.db
    .query('measuredSnapshots')
    .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', stackId))
    .collect()
  const earlier = snapshots.filter((row) => row.receivedAt < before)
  if (earlier.length === 0) return null
  return newestPerSource(earlier).reduce(
    (sum, row) => sum + row.payload.activity.totalTokens,
    0
  )
}

function toPublic(row: ScanRow) {
  return {
    id: row.id,
    at: row.at,
    stack: row.stack,
    event: row.event,
    deltaTokens: row.deltaTokens,
    firstReading: row.firstReading,
  }
}

/** UTC midnight, so a bucket boundary does not depend on who is reading. */
function dayStart(at: number): number {
  return Math.floor(at / DAY_MS) * DAY_MS
}

/**
 * One bucket per UTC day, oldest first, holding the LEVEL the stacks that
 * synced that day were carrying (#128, built in #129). The line therefore draws
 * the same quantity the tile above it states, and its last point IS the tile.
 *
 * It used to plot the tokens the site GAINED, floored at zero - a movement
 * under a tile that is a level, so the two were unrelated numbers stacked on
 * each other. Nothing floors anything now: a level cannot go negative, so the
 * old fear of a line dipping below its own baseline does not arise.
 *
 * A stack that synced twice in one day counts once, at that day's newest
 * reading - the same rule `usageFor` applies to the window.
 */
function pointsFor(
  rows: ScanRow[],
  now: number
): { at: number; value: number }[] {
  const today = dayStart(now)
  const buckets = new Map<number, number>()
  for (let back = WATERMARK_DAYS - 1; back >= 0; back -= 1) {
    buckets.set(today - back * DAY_MS, 0)
  }
  // Rows arrive newest-first, so the first sync seen per stack per day is that
  // day's latest reading.
  const counted = new Set<string>()
  for (const row of rows) {
    const tokens = syncTokens(row.event)
    if (tokens === null) continue
    const key = dayStart(row.at)
    if (!buckets.has(key)) continue
    const mark = `${key}:${row.stackId}`
    if (counted.has(mark)) continue
    counted.add(mark)
    buckets.set(key, (buckets.get(key) ?? 0) + tokens)
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([at, value]) => ({ at, value }))
}

/**
 * The five measured numbers. Four are joined from `measuredSnapshots`; the
 * token level comes off the sync events, which already carry it.
 *
 * The join is paid ONCE, here, for the whole band - which is exactly why the
 * rows below it stay on event-only facts (#84, #96). One indexed read per stack
 * that synced in the window, and nothing per row.
 */
async function usageFor(
  ctx: QueryCtx,
  rows: ScanRow[],
  since: number
): Promise<{
  sessions: number
  projects: number
  models: number
  tools: number
  tokens: number
  stacks: number
}> {
  // Rows arrive newest-first, so the first sync seen per stack is its latest.
  const latest = new Map<string, ScanRow>()
  for (const row of rows) {
    if (row.event.type !== 'sync.landed') continue
    if (row.at < since) continue
    if (!latest.has(row.stackId as string)) latest.set(row.stackId as string, row)
  }

  let sessions = 0
  let projects = 0
  let tokens = 0
  const models = new Set<string>()
  const tools = new Set<string>()

  for (const row of latest.values()) {
    if (row.event.type !== 'sync.landed') continue
    tokens += syncTokens(row.event) ?? 0
    for (const harness of row.event.harnesses) {
      sessions += harness.sessions
      projects += harness.projects
    }
    const snapshots = await ctx.db
      .query('measuredSnapshots')
      .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', row.stackId))
      .collect()
    for (const snapshot of newestPerSource(snapshots)) {
      for (const model of snapshot.payload.models) {
        // `unknown` is the CLI's spelling for tokens it could not attribute. It
        // is not a model, so it never swells the count of them.
        if (model.id !== 'unknown') models.add(model.id)
      }
      for (const tool of snapshot.payload.inventory.builtinTools) {
        tools.add(tool.name)
      }
    }
  }

  return {
    sessions,
    projects,
    models: models.size,
    tools: tools.size,
    tokens,
    stacks: latest.size,
  }
}

/**
 * The band that opens the landing page and `/activity` (#84 E1, #96 F).
 *
 * It reads the watermark window rather than the 24 hours it claims, because the
 * shape behind the numbers is 14 days long and the four evidence rows must
 * still show on a day nothing happened.
 *
 * The read is bounded at `MAX_ROWS` events, which is about two months of the
 * current volume. Past that the WATERMARK loses its oldest days - never the
 * 24-hour claim, which sits at the top of a newest-first walk. The map already
 * carries when read-time aggregation has to become a rollup.
 */
export const band = query({
  args: {},
  returns: Band,
  handler: async (ctx) => {
    const now = Date.now()
    const windowStart = now - BAND_WINDOW_MS
    const { rows } = await scanFeed(ctx, {
      limit: MAX_ROWS,
      since: now - WATERMARK_DAYS * DAY_MS,
    })

    const inWindow = rows.filter((row) => row.at >= windowStart)

    return {
      totals: {
        syncs: inWindow.filter((r) => r.event.type === 'sync.landed').length,
        updates: inWindow.filter((r) => r.event.type !== 'sync.landed').length,
        stacksSeen: new Set(rows.map((r) => r.stackId as string)).size,
      },
      usage: await usageFor(ctx, rows, windowStart),
      points: pointsFor(rows, now),
      rows: rows.slice(0, BAND_ROWS).map(toPublic),
    }
  },
})

/**
 * The day-grouped stream under the band on `/activity` (#96).
 *
 * `limit` grows by `PAGE_SIZE` on every "older" - one cursor read, no numbered
 * pages and no infinite scroll, which is the shape `by_createdAt` serves
 * directly. A chip narrows the stream through `type`; it never touches the
 * band, because the band states the whole site's 24 hours.
 */
export const stream = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(EventType),
  },
  returns: v.object({
    rows: v.array(FeedRow),
    hasMore: v.boolean(),
    /** One click of "older". The server owns it, so the surface cannot drift. */
    pageSize: v.number(),
    /** The ceiling one read will return, so the surface can say it was hit. */
    maxRows: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(
      MAX_ROWS,
      Math.max(1, Math.round(args.limit ?? PAGE_SIZE))
    )
    const { rows, hasMore } = await scanFeed(ctx, { limit, type: args.type })
    return {
      rows: rows.map(toPublic),
      hasMore,
      pageSize: PAGE_SIZE,
      maxRows: MAX_ROWS,
    }
  },
})
