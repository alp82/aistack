/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'
import type { ActivityEventValue } from './activity'

const modules = import.meta.glob('./**/*.{js,ts}')

type Ctx = ReturnType<typeof convexTest>

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

let seedCounter = 0

async function seedStack(
  t: Ctx,
  opts: { name?: string; published?: boolean; isLowQuality?: boolean } = {}
): Promise<Id<'stacks'>> {
  seedCounter += 1
  const n = seedCounter
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: `Creator ${n}`,
      slug: `creator-${n}`,
      userId: `user_${n}`,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    return await ctx.db.insert('stacks', {
      name: opts.name ?? `Stack ${n}`,
      slug: `stack-${n}`,
      shortId: `sid${n}`,
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: opts.published ?? true,
      ...(opts.isLowQuality === undefined
        ? {}
        : { isLowQuality: opts.isLowQuality }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
}

function syncEvent(over: {
  harness?: string
  sessions?: number
  projects?: number
  totalTokens?: number
}): ActivityEventValue {
  return {
    type: 'sync.landed',
    harnesses: [
      {
        harness: over.harness ?? 'claude-code',
        windowDays: 30,
        sessions: over.sessions ?? 10,
        activeDays: 5,
        projects: over.projects ?? 2,
        totalTokens: over.totalTokens ?? 1000,
      },
    ],
  }
}

/** The watermark bucket holding `at`, keyed the way the query keys it: UTC day. */
function valueOn(
  points: { at: number; value: number }[],
  at: number
): number | undefined {
  return points.find((p) => p.at === Math.floor(at / DAY) * DAY)?.value
}

async function emit(
  t: Ctx,
  stackId: Id<'stacks'>,
  createdAt: number,
  event: ActivityEventValue
) {
  await t.run(async (ctx) => {
    await ctx.db.insert('activityEvents', { stackId, createdAt, event })
  })
}

let projectCounter = 0
const projectKey = () => `P${String(++projectCounter).padStart(21, '0')}`

/**
 * One measured day plus the inventory row it rode in with (ADR-0011): the
 * day carries the tokens, sessions, models and project keys the band folds,
 * the inventory row carries the tools it unions and the sync's server clock.
 */
async function snapshot(
  t: Ctx,
  stackId: Id<'stacks'>,
  over: {
    capturedAt?: number
    harness?: string
    models?: string[]
    tools?: string[]
    totalTokens?: number
    projects?: number
    projectKeys?: string[]
  }
) {
  await t.run(async (ctx) => {
    const harness = over.harness ?? 'claude-code'
    const at = over.capturedAt ?? Date.now()
    const date = new Date(at).toISOString().slice(0, 10)
    const models = over.models ?? ['opus']
    const total = over.totalTokens ?? 1000
    const each = Math.floor(total / models.length)
    const projectKeys =
      over.projectKeys ??
      Array.from({ length: over.projects ?? 2 }, () => projectKey()).sort()
    await ctx.db.insert('measuredDays', {
      stackId,
      date,
      capturedAt: at,
      receivedAt: at,
      aggregateVersion: 'measured-days/v1',
      fingerprint: `fp-${at}-${harness}`,
      usage: {
        harnesses: [
          {
            harness,
            sessions: 10,
            projectKeys,
            models: models.map((id, index) => ({
              model: id,
              tokens: {
                input: index === 0 ? total - each * (models.length - 1) : each,
                output: 0,
                cacheWrite: 0,
                cacheRead: 0,
              },
            })),
            subagentTokens: 0,
            excludedTokens: { unpriced: 0, synthetic: 0 },
          },
        ],
      },
    })
    const existing = (await ctx.db.query('measuredInventory').collect()).find(
      (row) =>
        row.stackId === stackId && row.machine === undefined && row.harness === harness
    )
    const inventoryRow = {
      stackId,
      harness,
      harnessVersion: '1.0.0',
      capturedAt: at,
      receivedAt: at,
      inventory: {
        builtinTools: (over.tools ?? ['Bash']).map((name) => ({
          name,
          callShare: 1,
        })),
        mcpServers: [],
        skills: [],
        subagents: [],
        slashCommands: [],
        withheld: {
          builtinTools: 0,
          mcpServers: 0,
          skills: 0,
          subagents: 0,
          slashCommands: 0,
        },
      },
      modelsSeen: [...models].sort(),
      pricingTable: null,
    }
    if (existing && existing.receivedAt <= at) await ctx.db.replace(existing._id, inventoryRow)
    else if (!existing) await ctx.db.insert('measuredInventory', inventoryRow)
  })
}

// ---------------------------------------------------------------------------
// Visibility. A stack stays visible until it is removed or quality-filtered.
// ---------------------------------------------------------------------------

describe('visibility', () => {
  test('a legacy false flag does not hide an event', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t, { name: 'Goes Private' })
    await emit(t, stackId, Date.now() - HOUR, { type: 'stack.published', toolCount: 3 })

    const before = await t.query(api.activityFeed.stream, {})
    expect(before.rows.map((r) => r.stack.name)).toEqual(['Goes Private'])

    await t.run(async (ctx) => {
      await ctx.db.patch(stackId, { published: false })
    })

    const after = await t.query(api.activityFeed.stream, {})
    expect(after.rows.map((row) => row.stack.name)).toEqual(['Goes Private'])
    const band = await t.query(api.activityFeed.band, {})
    expect(band.rows.map((row) => row.stack.name)).toEqual(['Goes Private'])
    expect(band.totals.updates).toBe(1)
  })

  test('a flagged stack is hidden from the feed the same way', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t, { name: 'Flagged' })
    await emit(t, stackId, Date.now() - HOUR, { type: 'stack.published', toolCount: 1 })
    await t.run(async (ctx) => {
      await ctx.db.patch(stackId, { isLowQuality: true })
    })

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows).toEqual([])
  })

  test('an event whose stack was deleted is dropped, not thrown', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    await emit(t, stackId, Date.now() - HOUR, { type: 'stack.published', toolCount: 1 })
    await t.run(async (ctx) => {
      await ctx.db.delete(stackId)
    })

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows).toEqual([])
  })

  test('hidden rows do not eat the page - the scan refills it', async () => {
    const t = convexTest(schema, modules)
    const hidden = await seedStack(t, { name: 'Hidden', isLowQuality: true })
    const shown = await seedStack(t, { name: 'Shown' })
    const now = Date.now()
    // Newest first: three hidden rows sit above the one visible row.
    for (let i = 0; i < 3; i += 1) {
      await emit(t, hidden, now - i * MINUTE, { type: 'stack.published', toolCount: 1 })
    }
    await emit(t, shown, now - 10 * MINUTE, { type: 'stack.published', toolCount: 2 })

    const feed = await t.query(api.activityFeed.stream, { limit: 1 })
    expect(feed.rows.map((r) => r.stack.name)).toEqual(['Shown'])
    expect(feed.hasMore).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// The stream - reverse-chronological, paged 25 at a time, filtered by chip.
// ---------------------------------------------------------------------------

describe('the stream', () => {
  test('reads newest first and reports whether more exist', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await emit(t, stackId, now - 3 * HOUR, { type: 'stack.published', toolCount: 1 })
    await emit(t, stackId, now - 2 * HOUR, syncEvent({ totalTokens: 100 }))
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 300 }))

    const page = await t.query(api.activityFeed.stream, { limit: 2 })
    expect(page.rows.map((r) => r.at)).toEqual([now - HOUR, now - 2 * HOUR])
    expect(page.hasMore).toBe(true)

    const all = await t.query(api.activityFeed.stream, { limit: 25 })
    expect(all.rows).toHaveLength(3)
    expect(all.hasMore).toBe(false)
  })

  test('a chip narrows the stream to one event type', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await emit(t, stackId, now - 3 * HOUR, { type: 'stack.published', toolCount: 1 })
    await emit(t, stackId, now - 2 * HOUR, syncEvent({}))
    await emit(t, stackId, now - HOUR, {
      type: 'stack.composition_changed',
      added: [{ kind: 'tool', slug: 'zed', name: 'Zed' }],
      removed: [],
    })

    const syncs = await t.query(api.activityFeed.stream, { type: 'sync.landed' })
    expect(syncs.rows.map((r) => r.event.type)).toEqual(['sync.landed'])

    const changes = await t.query(api.activityFeed.stream, {
      type: 'stack.composition_changed',
    })
    expect(changes.rows.map((r) => r.event.type)).toEqual([
      'stack.composition_changed',
    ])
  })

  test('a row links the stack by its public slug and names its creator', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t, { name: 'Named' })
    await emit(t, stackId, Date.now() - HOUR, { type: 'stack.published', toolCount: 1 })

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows[0].stack.slug).toMatch(/^stack-\d+-sid\d+$/)
    expect(feed.rows[0].stack.creator).toMatch(/^Creator /)
  })
})

// ---------------------------------------------------------------------------
// Movement - the delta is computed across the rows; the table has no delta
// column (#84).
// ---------------------------------------------------------------------------

describe('movement', () => {
  test('a sync reports its movement against the stack previous sync', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await emit(t, stackId, now - 2 * HOUR, syncEvent({ totalTokens: 1_000 }))
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 1_285 }))

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows[0].deltaTokens).toBe(285)
    expect(feed.rows[0].firstReading).toBe(false)
  })

  test('the first sync a stack ever published has no movement to claim', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await snapshot(t, stackId, { capturedAt: now - HOUR, totalTokens: 1_000 })
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 1_000 }))

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows[0].deltaTokens).toBeNull()
    expect(feed.rows[0].firstReading).toBe(true)
  })

  // -------------------------------------------------------------------------
  // "first reading" rests on the SNAPSHOTS, not on the events (#129).
  // `activityEvents` starts where #78 turned instrumentation on, so every
  // stack older than that had its first post-instrumentation sync called its
  // first reading. On prod the feed said so about OrcDev while its stack page
  // showed nine readings over six days.
  // -------------------------------------------------------------------------

  test('a sync with days older than the events table is not a first reading', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    // Three days the events table never saw.
    await snapshot(t, stackId, { capturedAt: now - 4 * DAY, totalTokens: 400 })
    await snapshot(t, stackId, { capturedAt: now - 3 * DAY, totalTokens: 700 })
    await snapshot(t, stackId, { capturedAt: now - 2 * DAY, totalTokens: 900 })
    await snapshot(t, stackId, { capturedAt: now - HOUR, totalTokens: 1_000 })
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 2_100 }))

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows[0].firstReading).toBe(false)
    // And it carries the real movement against the days that stood before it.
    expect(feed.rows[0].deltaTokens).toBe(100)
  })

  test('a movement recovered from the days may fall', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await snapshot(t, stackId, { capturedAt: now - 2 * DAY, totalTokens: 2_000 })
    await snapshot(t, stackId, { capturedAt: now - HOUR, totalTokens: 1_800 })
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 1_800 }))

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows[0].deltaTokens).toBe(-200)
    expect(feed.rows[0].firstReading).toBe(false)
  })

  test('the prior reading sums every earlier day, across harnesses', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await snapshot(t, stackId, {
      capturedAt: now - 3 * DAY,
      harness: 'claude-code',
      totalTokens: 600,
    })
    await snapshot(t, stackId, {
      capturedAt: now - 2 * DAY,
      harness: 'codex',
      totalTokens: 400,
    })
    await snapshot(t, stackId, {
      capturedAt: now - HOUR,
      harness: 'claude-code',
      totalTokens: 900,
    })
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 1_300 }))

    const feed = await t.query(api.activityFeed.stream, {})
    // 600 + 400 stood before this sync, so a 1,300 reading moved +300.
    expect(feed.rows[0].deltaTokens).toBe(300)
  })

  test('a sync that has an earlier EVENT never reads the days', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    // A snapshot that disagrees with the events, to prove which one is used.
    await snapshot(t, stackId, { capturedAt: now - 3 * HOUR, totalTokens: 99 })
    await emit(t, stackId, now - 2 * HOUR, syncEvent({ totalTokens: 1_000 }))
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 1_285 }))

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows[0].deltaTokens).toBe(285)
  })

  test('movement can fall - a 30-day window forgets its far end', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await emit(t, stackId, now - 2 * HOUR, syncEvent({ totalTokens: 2_000 }))
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 1_800 }))

    const feed = await t.query(api.activityFeed.stream, {})
    expect(feed.rows[0].deltaTokens).toBe(-200)
  })

  test('movement is measured per stack, never across stacks', async () => {
    const t = convexTest(schema, modules)
    const a = await seedStack(t, { name: 'A' })
    const b = await seedStack(t, { name: 'B' })
    const now = Date.now()
    await emit(t, a, now - 3 * HOUR, syncEvent({ totalTokens: 1_000 }))
    await emit(t, b, now - 2 * HOUR, syncEvent({ totalTokens: 9_000 }))
    await emit(t, a, now - HOUR, syncEvent({ totalTokens: 1_400 }))

    const feed = await t.query(api.activityFeed.stream, {})
    const rowA = feed.rows.find((r) => r.stack.name === 'A' && r.at === now - HOUR)
    expect(rowA?.deltaTokens).toBe(400)
  })

  test('a predecessor below the page still answers the row above it', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await emit(t, stackId, now - 3 * HOUR, syncEvent({ totalTokens: 1_000 }))
    await emit(t, stackId, now - 2 * HOUR, syncEvent({ totalTokens: 1_100 }))
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 1_500 }))

    const page = await t.query(api.activityFeed.stream, { limit: 1 })
    expect(page.rows[0].deltaTokens).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// The band - the last 24 hours, four measured numbers and three counts (#84).
// ---------------------------------------------------------------------------

describe('the band', () => {
  test('counts syncs and updates inside the 24-hour window only', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await emit(t, stackId, now - 30 * HOUR, syncEvent({ totalTokens: 500 }))
    await emit(t, stackId, now - 2 * HOUR, syncEvent({ totalTokens: 800 }))
    await emit(t, stackId, now - HOUR, {
      type: 'stack.composition_changed',
      added: [{ kind: 'tool', slug: 'zed', name: 'Zed' }],
      removed: [],
    })

    const band = await t.query(api.activityFeed.band, {})
    expect(band.totals.syncs).toBe(1)
    expect(band.totals.updates).toBe(1)
  })

  test('tokens measured is a LEVEL - the total the window carries, fallers and all', async () => {
    const t = convexTest(schema, modules)
    const a = await seedStack(t, { name: 'Up' })
    const b = await seedStack(t, { name: 'Down' })
    const now = Date.now()
    await emit(t, a, now - 4 * HOUR, syncEvent({ totalTokens: 1_000 }))
    await emit(t, a, now - 2 * HOUR, syncEvent({ totalTokens: 1_300 }))
    await emit(t, b, now - 4 * HOUR, syncEvent({ totalTokens: 5_000 }))
    await emit(t, b, now - 2 * HOUR, syncEvent({ totalTokens: 4_000 }))

    const band = await t.query(api.activityFeed.band, {})
    // The latest reading of each stack, summed. The stack that FELL is in it at
    // its 4,000 - it is not deleted, and neither is it counted at -1,000 (#128).
    expect(band.usage.tokens).toBe(5_300)
  })

  test('a stack that synced twice in the window counts once, at its latest', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await emit(t, stackId, now - 4 * HOUR, syncEvent({ totalTokens: 1_000 }))
    await emit(t, stackId, now - 2 * HOUR, syncEvent({ totalTokens: 1_300 }))

    const band = await t.query(api.activityFeed.band, {})
    expect(band.usage.tokens).toBe(1_300)
  })

  test('sessions and projects SUM, models and tools UNION', async () => {
    const t = convexTest(schema, modules)
    const a = await seedStack(t, { name: 'A' })
    const b = await seedStack(t, { name: 'B' })
    const now = Date.now()
    await snapshot(t, a, {
      models: ['opus', 'sonnet'],
      tools: ['Bash', 'Read'],
      projects: 5,
    })
    await snapshot(t, b, { models: ['opus'], tools: ['Bash', 'Edit'], projects: 3 })
    await emit(t, a, now - 2 * HOUR, syncEvent({ sessions: 100, projects: 5 }))
    await emit(t, b, now - HOUR, syncEvent({ sessions: 60, projects: 3 }))

    const band = await t.query(api.activityFeed.band, {})
    expect(band.usage.sessions).toBe(160)
    expect(band.usage.projects).toBe(8)
    // Two people running Opus is ONE model; two people running Bash is ONE tool.
    expect(band.usage.models).toBe(2)
    expect(band.usage.tools).toBe(3)
    expect(band.usage.stacks).toBe(2)
  })

  test('projects union across the current sources of each stack', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await snapshot(t, stackId, {
      harness: 'claude-code',
      projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA', 'BBBBBBBBBBBBBBBBBBBBBB'],
    })
    await snapshot(t, stackId, {
      harness: 'codex',
      projectKeys: ['BBBBBBBBBBBBBBBBBBBBBB', 'CCCCCCCCCCCCCCCCCCCCCC'],
    })
    await emit(t, stackId, now - HOUR, syncEvent({ projects: 99 }))

    const band = await t.query(api.activityFeed.band, {})
    expect(band.usage.projects).toBe(3)
  })

  test('each stack contributes only its latest sync in the window', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await snapshot(t, stackId, { projects: 41 })
    await emit(t, stackId, now - 20 * HOUR, syncEvent({ sessions: 596, projects: 41 }))
    await emit(t, stackId, now - HOUR, syncEvent({ sessions: 596, projects: 41 }))

    const band = await t.query(api.activityFeed.band, {})
    // Two syncs 19 hours apart are one reading, not 1192 sessions.
    expect(band.totals.syncs).toBe(2)
    expect(band.usage.sessions).toBe(596)
    expect(band.usage.projects).toBe(41)
  })

  test('an unnamed model never counts as a model', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    await snapshot(t, stackId, { models: ['opus', 'unknown'] })
    await emit(t, stackId, Date.now() - HOUR, syncEvent({}))

    const band = await t.query(api.activityFeed.band, {})
    expect(band.usage.models).toBe(1)
  })

  test('a quiet window reports no stacks, so the surface can render an em dash', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    await snapshot(t, stackId, {})
    await emit(t, stackId, Date.now() - 30 * HOUR, syncEvent({ sessions: 100 }))

    const band = await t.query(api.activityFeed.band, {})
    expect(band.usage.stacks).toBe(0)
    expect(band.usage.sessions).toBe(0)
    expect(band.usage.tokens).toBe(0)
    // The rows themselves still show: the band is quiet, not empty.
    expect(band.rows).toHaveLength(1)
  })

  test('carries at most four rows, newest first', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    for (let i = 0; i < 6; i += 1) {
      await emit(t, stackId, now - i * HOUR, { type: 'stack.published', toolCount: i })
    }

    const band = await t.query(api.activityFeed.band, {})
    expect(band.rows).toHaveLength(4)
    expect(band.rows[0].at).toBe(now)
  })

  test('the watermark plots the level measured each day, so its last point is the tile', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    const now = Date.now()
    await emit(t, stackId, now - 3 * DAY, syncEvent({ totalTokens: 1_000 }))
    await emit(t, stackId, now - 2 * DAY, syncEvent({ totalTokens: 1_500 }))
    await emit(t, stackId, now - HOUR, syncEvent({ totalTokens: 2_000 }))

    const band = await t.query(api.activityFeed.band, {})
    expect(band.points).toHaveLength(30)
    expect(band.points[band.points.length - 1].at).toBeGreaterThan(
      band.points[0].at
    )
    // Each day carries what it measured, not what it gained - so the first sync
    // is 1,000 rather than nothing, and the newest day equals the tile.
    expect(band.points.map((p) => p.value).filter((v) => v > 0)).toEqual([
      1_000, 1_500, 2_000,
    ])
    expect(valueOn(band.points, now - HOUR)).toBe(band.usage.tokens)
  })

  test('a day two stacks synced sums their levels, each at its latest', async () => {
    const t = convexTest(schema, modules)
    const a = await seedStack(t, { name: 'A' })
    const b = await seedStack(t, { name: 'B' })
    // Yesterday noon UTC: always in the past, always inside the watermark, and
    // far enough from a bucket boundary that the three events land together
    // whatever time of day the test runs.
    const noon = Math.floor(Date.now() / DAY) * DAY - 12 * HOUR
    await emit(t, a, noon - 3 * HOUR, syncEvent({ totalTokens: 1_000 }))
    await emit(t, a, noon - 2 * HOUR, syncEvent({ totalTokens: 1_200 }))
    await emit(t, b, noon - HOUR, syncEvent({ totalTokens: 500 }))

    const band = await t.query(api.activityFeed.band, {})
    // A's older 1,000 is dropped for its own 1,200; B adds its 500.
    expect(valueOn(band.points, noon)).toBe(1_700)
  })

  test('counts the stacks it measured across', async () => {
    const t = convexTest(schema, modules)
    const a = await seedStack(t)
    const b = await seedStack(t)
    const now = Date.now()
    await emit(t, a, now - 2 * DAY, syncEvent({}))
    await emit(t, b, now - HOUR, syncEvent({}))

    const band = await t.query(api.activityFeed.band, {})
    expect(band.totals.stacksSeen).toBe(2)
  })
})
