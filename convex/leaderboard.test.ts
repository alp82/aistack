/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { liveBoard } from './leaderboard.testOracle'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

type Ctx = ReturnType<typeof convexTest>

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

/**
 * The board ranks stacks the site has never priced, so the fixture models use
 * ids no pricing table knows: their dollars are exactly what the payload
 * carries, and a missing price stays missing. `unknown` is the CLI's literal
 * spelling for unattributable tokens.
 */
type FixtureModel = {
  id: string
  tokens: number
  usd?: number
}

function payload(over: {
  capturedAt?: number
  harness?: string
  totalTokens?: number
  sessions?: number
  models?: FixtureModel[]
  pricingTable?: string | null
}) {
  const models = (
    over.models ?? [{ id: 'model-alpha', tokens: over.totalTokens ?? 1000 }]
  ).map((m) => ({
    id: m.id,
    tokenShare: 0,
    tokens: { input: m.tokens, output: 0, cacheWrite: 0, cacheRead: 0 },
    ...(m.usd === undefined ? {} : { apiEquivalentUSD: m.usd }),
  }))
  return {
    schemaVersion: 1 as const,
    capturedAt: over.capturedAt ?? Date.now(),
    window: { days: 30, from: '2026-07-05', to: '2026-08-03' },
    harness: { name: over.harness ?? 'claude-code', version: '2.1.220' },
    pricingTable:
      over.pricingTable === undefined
        ? 'anthropic-list-2026-07-25'
        : over.pricingTable,
    activity: {
      sessions: over.sessions ?? 10,
      activeDays: 5,
      projects: 2,
      totalTokens:
        over.totalTokens ?? models.reduce((a, m) => a + m.tokens.input, 0),
      cacheHitShare: 0.9,
      subagentShare: 0.1,
    },
    models,
    inventory: {
      builtinTools: [],
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
    coverage: {
      filesScanned: 10,
      filesUnreadable: 0,
      linesParsed: 1000,
      linesFailed: 0,
    },
    excludedTokens: { unpriced: 0, synthetic: 0 },
  }
}

let seedCounter = 0

async function seedStack(
  t: Ctx,
  opts: {
    name?: string
    published?: boolean
    isLowQuality?: boolean
    publishCost?: boolean
  } = {}
) {
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
    const stackId = await ctx.db.insert('stacks', {
      name: opts.name ?? `Stack ${n}`,
      slug: `stack-${n}`,
      shortId: `sid${n}x`,
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: opts.published ?? true,
      ...(opts.isLowQuality === undefined
        ? {}
        : { isLowQuality: opts.isLowQuality }),
      ...(opts.publishCost === undefined
        ? {}
        : { publishCost: opts.publishCost }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return { stackId }
  })
}

/** The day wire a payload's models fold to: one UTC day, today unless dated. */
function dayWireOf(p: ReturnType<typeof payload>, at: number) {
  return {
    aggregateVersion: 'measured-days/v1',
    days: [
      {
        date: new Date(at).toISOString().slice(0, 10),
        usage: {
          harnesses: [
            {
              harness: p.harness.name,
              sessions: p.activity.sessions,
              projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
              models: p.models.map((m) => ({
                model: m.id,
                tokens: m.tokens,
                ...(m.apiEquivalentUSD === undefined
                  ? {}
                  : {
                      usd: m.apiEquivalentUSD,
                      pricingTable: p.pricingTable ?? 'anthropic-list-2026-07-25',
                    }),
              })),
              subagentTokens: 0,
              excludedTokens: { unpriced: 0, synthetic: 0 },
            },
          ],
        },
      },
    ],
  }
}

async function sync(
  t: Ctx,
  stackId: Id<'stacks'>,
  over: Parameters<typeof payload>[0] & { machine?: string } = {}
) {
  const { machine, ...rest } = over
  const p = payload(rest)
  const wire = dayWireOf(p, p.capturedAt)
  // A real CLI ships every harness of a day in one publish, and a re-synced
  // day REPLACES the row. Two `sync` calls on one day therefore merge here,
  // the way the client's own day would carry both harnesses.
  const day = wire.days[0]
  const held = await t.run(async (ctx) =>
    (await ctx.db.query('measuredDays').collect()).find(
      (row) => row.stackId === stackId && row.machine === machine && row.date === day.date
    )
  )
  for (const h of held?.usage?.harnesses ?? []) {
    if (!day.usage.harnesses.some((mine) => mine.harness === h.harness)) {
      day.usage.harnesses.push(h as (typeof day.usage.harnesses)[number])
    }
  }
  await t.mutation(internal.measured.publishSnapshot, {
    stackId,
    payload: p,
    ...(machine === undefined ? {} : { machine }),
    measuredDays: wire,
  })
}

/** A sync whose server clock is in the past - only a direct insert can. */
async function staleSync(
  t: Ctx,
  stackId: Id<'stacks'>,
  receivedAgoMs: number,
  over: Parameters<typeof payload>[0] = {}
) {
  const at = Date.now() - receivedAgoMs
  const p = payload({ capturedAt: at, ...over })
  const wire = dayWireOf(p, at)
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredInventory', {
      stackId,
      harness: p.harness.name,
      harnessVersion: p.harness.version,
      capturedAt: at,
      receivedAt: at,
      inventory: p.inventory,
      modelsSeen: p.models.map((m) => m.id).sort(),
      pricingTable: p.pricingTable,
    })
    for (const day of wire.days) {
      await ctx.db.insert('measuredDays', {
        stackId,
        date: day.date,
        capturedAt: at,
        receivedAt: at,
        aggregateVersion: wire.aggregateVersion,
        fingerprint: `fp-${at}`,
        usage: day.usage,
      })
    }
  })
}

// `get` and `model` read the rollups (ADR-0014). A sync only schedules its
// stack's refresh, so every test runs the scheduled functions before it reads:
// `settle` after a `sync`, `runCron` when a row was inserted with no write hook.
describe('leaderboard.get', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  test('is empty until the scheduled refresh has run, and populated after', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Just Synced' })
    await sync(t, stackId, { totalTokens: 1234 })

    // The measured rows are there, and the live derivation already ranks the
    // stack. The board does not: its rollup is not written yet.
    expect((await t.run((ctx) => liveBoard(ctx))).rows).toHaveLength(1)
    const before = await t.query(api.leaderboard.get, {})
    expect(before).toMatchObject({ stackCount: 0, totalTokens: 0, rows: [] })
    expect(await t.query(api.leaderboard.model, { name: 'model-alpha' })).toBeNull()

    await settle(t)
    const after = await t.query(api.leaderboard.get, {})
    expect(after.stackCount).toBe(1)
    expect(after.rows[0]).toMatchObject({ name: 'Just Synced', tokens: 1234 })
    expect(await t.query(api.leaderboard.model, { name: 'model-alpha' })).toMatchObject({
      stackCount: 1,
    })
  })

  test('includes Cursor tokens and history in the normal harness filter', async () => {
    const t = convexTest(schema, modules)
    const stack = await seedStack(t, { name: 'Cursor Stack' })
    await sync(t, stack.stackId, { totalTokens: 1234, harness: 'cursor' })
    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows[0]).toMatchObject({ tokens: 1234, harnesses: ['cursor'] })
    expect(board.harnesses.some(h => h.key === 'cursor')).toBe(true)
  })

  test('ranks living stacks by measured tokens and excludes low quality', async () => {
    const t = convexTest(schema, modules)
    const small = await seedStack(t, { name: 'Small' })
    const big = await seedStack(t, { name: 'Big' })
    const draft = await seedStack(t, { name: 'Draft', published: false })
    const spam = await seedStack(t, { name: 'Spam' })
    await sync(t, small.stackId, { totalTokens: 100 })
    await sync(t, big.stackId, { totalTokens: 900 })
    await sync(t, draft.stackId, { totalTokens: 5000 })
    await sync(t, spam.stackId, { totalTokens: 4000 })
    // Flagged after the sync: a sync reopens the stack's reports and clears
    // the flag (#444), so a flag set before it would not survive.
    await patchStack(t, spam.stackId, { isLowQuality: true })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows.map((r) => [r.rank, r.name, r.tokens])).toEqual([
      [1, 'Draft', 5000],
      [2, 'Big', 900],
      [3, 'Small', 100],
    ])
    expect(board.stackCount).toBe(3)
    expect(board.totalTokens).toBe(6000)
  })


  test('sums two machines of one harness rather than replacing (#243)', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Two Machines' })
    await sync(t, stackId, {
      capturedAt: Date.now() - HOUR,
      totalTokens: 900,
      machine: 'laptop',
    })
    await sync(t, stackId, { totalTokens: 100, machine: 'vps' })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows[0].tokens).toBe(1000)
  })

  test('names a harness once however many machines run it', async () => {
    // The row prints "Claude Code + Codex" under a stack, and the harness
    // ranking counts stacks - both would double a stack keyed per source.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Two Machines' })
    await sync(t, stackId, {
      capturedAt: Date.now() - HOUR,
      totalTokens: 900,
      machine: 'laptop',
    })
    await sync(t, stackId, { totalTokens: 100, machine: 'vps' })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows[0].harnesses).toEqual(['claude-code'])
    const claudeCode = board.harnesses.find((h) => h.key === 'claude-code')
    expect(claudeCode?.stackCount).toBe(1)
    expect(claudeCode?.leadsCount).toBe(1)
  })

  test('lists the quiet group as a count and a token mass, not rows', async () => {
    const t = convexTest(schema, modules)
    const living = await seedStack(t, { name: 'Living' })
    const quiet = await seedStack(t, { name: 'Quiet' })
    await sync(t, living.stackId, { totalTokens: 100 })
    await staleSync(t, quiet.stackId, 8 * DAY, { totalTokens: 700 })

    await runCron(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows).toHaveLength(1)
    expect(board.livingCount).toBe(1)
    expect(board.quiet).toEqual({ count: 1, tokens: 700 })
    // The rail still counts the whole measured population.
    expect(board.stackCount).toBe(2)
    expect(board.totalTokens).toBe(800)
  })

  test('returns no rows when every stack is quiet', async () => {
    const t = convexTest(schema, modules)
    const quiet = await seedStack(t)
    await staleSync(t, quiet.stackId, 8 * DAY, { totalTokens: 700 })

    await runCron(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows).toEqual([])
    expect(board.livingCount).toBe(0)
    expect(board.quiet).toEqual({ count: 1, tokens: 700 })
  })

  test('draws one point per measured day, oldest first, summing harnesses', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const now = Date.now()
    await sync(t, stackId, {
      capturedAt: now - 2 * DAY,
      harness: 'claude-code',
      totalTokens: 100,
    })
    await sync(t, stackId, {
      capturedAt: now - 2 * DAY,
      harness: 'codex',
      totalTokens: 50,
    })
    await sync(t, stackId, {
      capturedAt: now - HOUR,
      harness: 'claude-code',
      totalTokens: 120,
    })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    const row = board.rows[0]
    expect(row.points.map((p) => p.tokens)).toEqual([150, 120])
    expect(row.syncCount).toBe(2)
    expect(row.tokens).toBe(270)
  })

  test('prices a row as a lower bound and obeys the publishCost flag', async () => {
    const t = convexTest(schema, modules)
    const priced = await seedStack(t, { name: 'Priced' })
    const privately = await seedStack(t, {
      name: 'Private',
      publishCost: false,
    })
    // Half the tokens carry exact dollars, half match no table: a lower
    // bound at 50% coverage.
    const models = [
      { id: 'model-alpha', tokens: 500, usd: 5 },
      { id: 'model-mystery', tokens: 500 },
    ]
    await sync(t, priced.stackId, { totalTokens: 1000, models })
    await sync(t, privately.stackId, { totalTokens: 1000, models })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    const byName = new Map(board.rows.map((r) => [r.name, r]))
    expect(byName.get('Priced')?.spend).toEqual({
      lowerBoundUSD: 5,
      coverage: 0.5,
      exact: false,
    })
    expect(byName.get('Private')?.spend).toBeNull()
    expect(board.costPublishers).toBe(1)
    expect(board.spendLowerBoundUSD).toBe(5)
  })

  test('calls a fully priced row exact', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await sync(t, stackId, {
      totalTokens: 1000,
      models: [{ id: 'model-alpha', tokens: 1000, usd: 12 }],
    })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows[0].spend).toEqual({
      lowerBoundUSD: 12,
      coverage: 1,
      exact: true,
    })
  })

  test('never lets unknown lead a row, and states the unattributed share', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await sync(t, stackId, {
      totalTokens: 1000,
      models: [
        { id: 'unknown', tokens: 900 },
        { id: 'model-alpha', tokens: 100 },
      ],
    })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows[0].topModel).toEqual({ name: 'model-alpha', share: 0.1 })
    expect(board.unattributedShare).toBeCloseTo(0.9, 6)
    expect(board.models.map((m) => m.key)).toEqual(['model-alpha'])
  })

  test('shows no top model when every token is unattributed', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await sync(t, stackId, {
      totalTokens: 1000,
      models: [{ id: 'unknown', tokens: 1000 }],
    })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows[0].topModel).toBeNull()
  })

  test('token-weights the rail rankings over attributed tokens and counts leads', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'GPT X',
        slug: 'gpt-x',
        shortId: 'gptx1',
        provider: 'openai',
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })
    const one = await seedStack(t, { name: 'One' })
    const two = await seedStack(t, { name: 'Two' })
    await sync(t, one.stackId, {
      totalTokens: 300,
      models: [{ id: 'gpt-x', tokens: 300 }],
    })
    await sync(t, two.stackId, {
      totalTokens: 300,
      models: [
        { id: 'gpt-x', tokens: 100 },
        { id: 'claude-y', tokens: 200 },
      ],
    })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    const gptX = board.models.find((m) => m.key === 'gpt-x')
    // 400 of 600 attributed tokens, on both stacks, leading one of them -
    // and the catalog names it.
    expect(gptX).toEqual({
      key: 'gpt-x',
      name: 'GPT X',
      tokenShare: 400 / 600,
      stackCount: 2,
      leadsCount: 1,
    })
    const claudeY = board.models.find((m) => m.key === 'claude-y')
    expect(claudeY?.leadsCount).toBe(1)
    expect(claudeY?.name).toBe('claude-y')
  })

  test('ranks harnesses over measured tokens and drops a zero-token harness', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const now = Date.now()
    await sync(t, stackId, {
      capturedAt: now - HOUR,
      harness: 'claude-code',
      totalTokens: 300,
    })
    // A harness reporting zero tokens is not a harness (#82).
    await sync(t, stackId, {
      capturedAt: now - HOUR / 2,
      harness: 'codex',
      totalTokens: 0,
      sessions: 0,
      models: [],
    })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    expect(board.harnesses.map((h) => h.key)).toEqual(['claude-code'])
    expect(board.rows[0].harnesses).toEqual(['claude-code'])
  })

  test('pages ten rows at a time, rank continuing across pages', async () => {
    const t = convexTest(schema, modules)
    for (let i = 0; i < 12; i++) {
      const { stackId } = await seedStack(t, { name: `S${i}` })
      await sync(t, stackId, { totalTokens: 1000 - i })
    }

    await settle(t)
    const first = await t.query(api.leaderboard.get, {})
    expect(first.rows).toHaveLength(10)
    expect(first.totalPages).toBe(2)
    expect(first.rows[0].rank).toBe(1)

    const second = await t.query(api.leaderboard.get, { page: 2 })
    expect(second.rows).toHaveLength(2)
    expect(second.rows[0].rank).toBe(11)
    expect(second.rows[1].tokens).toBe(989)

    // A page past the end clamps rather than 404s: the URL survives shrinkage.
    const far = await t.query(api.leaderboard.get, { page: 9 })
    expect(far.page).toBe(2)
    expect(far.rows).toHaveLength(2)
  })

  test('links a row by its public slug', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await sync(t, stackId, { totalTokens: 10 })

    await settle(t)
    const board = await t.query(api.leaderboard.get, {})
    const row = board.rows[0]
    expect(row.slug).toMatch(/^stack-\d+-sid\d+x$/)
    expect(row.creatorName).toMatch(/^Creator /)
  })
})

describe('leaderboard.model', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  test('resolves a catalog name case-insensitively and a raw id as itself', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'GPT X',
        slug: 'gpt-x',
        shortId: 'gptx1',
        provider: 'openai',
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })
    const one = await seedStack(t)
    await sync(t, one.stackId, {
      totalTokens: 300,
      models: [
        { id: 'gpt-x', tokens: 100 },
        { id: 'claude-y', tokens: 200 },
      ],
    })
    await settle(t)
    expect(await t.query(api.leaderboard.model, { name: 'gpt x' })).toEqual({
      key: 'gpt-x',
      name: 'GPT X',
      tokenShare: 100 / 300,
      stackCount: 1,
      leadsCount: 0,
    })
    expect(await t.query(api.leaderboard.model, { name: 'Claude-Y' })).toMatchObject({
      key: 'claude-y',
      leadsCount: 1,
    })
    expect(await t.query(api.leaderboard.model, { name: 'unknown' })).toBeNull()
    expect(await t.query(api.leaderboard.model, { name: 'gpt-9' })).toBeNull()
  })

  test('a catalog model no stack ran answers with zero stacks, not null', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'GPT X',
        slug: 'gpt-x',
        shortId: 'gptx1',
        provider: 'openai',
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })
    expect(await t.query(api.leaderboard.model, { name: 'GPT X' })).toEqual({
      key: 'gpt-x',
      name: 'GPT X',
      tokenShare: 0,
      stackCount: 0,
      leadsCount: 0,
    })
  })
})

// ---------------------------------------------------------------------------
// The rollup (ADR-0014). Every test here compares `get`, which reads the
// rollups, with `liveBoard`, the live derivation kept for tests as the oracle,
// at one frozen instant. The served board must equal the live board field for
// field.
// ---------------------------------------------------------------------------

const NOW = Date.parse('2026-08-03T12:00:00Z')

const dateOf = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Run every scheduled function, and the ones those schedule, to the end. */
async function settle(t: Ctx) {
  await t.finishAllScheduledFunctions(vi.runAllTimers)
}

/** The hourly cron's function, run to completion. */
async function runCron(t: Ctx) {
  const result = await t.mutation(internal.leaderboard.refreshAll, {})
  await settle(t)
  return result
}

async function rollups(t: Ctx) {
  return await t.run(async (ctx) => ctx.db.query('leaderboardRollups').collect())
}

async function rollupOf(t: Ctx, stackId: Id<'stacks'>) {
  return (await rollups(t)).find((row) => row.stackId === stackId) ?? null
}

/** The oracle: the board derived live from the measured rows, right now. */
async function live(t: Ctx, page?: number) {
  return await t.run((ctx) => liveBoard(ctx, page))
}

/**
 * The served board and the live board at the same instant, asserted equal on
 * every page. Returns the first served page so a test can also assert what
 * the board says.
 */
async function sameBoard(t: Ctx) {
  const expected = await live(t)
  const served = await t.query(api.leaderboard.get, {})
  expect(served).toEqual(expected)
  for (let page = 2; page <= expected.totalPages; page++) {
    expect(await t.query(api.leaderboard.get, { page })).toEqual(
      await live(t, page)
    )
  }
  return served
}

/** Capture the stale-window warning of a read, and keep it off the test log. */
function spyOnWarn() {
  return vi.spyOn(console, 'warn').mockImplementation(() => {})
}

/** One day row, inserted directly: any date, any machine, and no write hook. */
async function insertDay(
  t: Ctx,
  stackId: Id<'stacks'>,
  day: {
    date: string
    machine?: string
    harness?: string
    sessions?: number
    models: FixtureModel[]
  }
) {
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredDays', {
      stackId,
      ...(day.machine === undefined ? {} : { machine: day.machine }),
      date: day.date,
      capturedAt: Date.now(),
      receivedAt: Date.now(),
      aggregateVersion: 'measured-days/v1',
      fingerprint: `fp-${day.date}-${day.machine ?? ''}`,
      usage: {
        harnesses: [
          {
            harness: day.harness ?? 'claude-code',
            sessions: day.sessions ?? 1,
            projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
            models: day.models.map((m) => ({
              model: m.id,
              tokens: { input: m.tokens, output: 0, cacheWrite: 0, cacheRead: 0 },
              ...(m.usd === undefined
                ? {}
                : { usd: m.usd, pricingTable: 'anthropic-list-2026-07-25' }),
            })),
            subagentTokens: 0,
            excludedTokens: { unpriced: 0, synthetic: 0 },
          },
        ],
      },
    })
  })
}

/** One inventory row, inserted directly: any sync time, and no write hook. */
async function insertInventory(
  t: Ctx,
  stackId: Id<'stacks'>,
  row: {
    receivedAt: number
    harness?: string
    machine?: string
    legacy?: { tokens: number; sessions: number }
  }
) {
  const p = payload({ harness: row.harness })
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredInventory', {
      stackId,
      ...(row.machine === undefined ? {} : { machine: row.machine }),
      harness: p.harness.name,
      harnessVersion: p.harness.version,
      capturedAt: row.receivedAt,
      receivedAt: row.receivedAt,
      inventory: p.inventory,
      modelsSeen: [],
      pricingTable: p.pricingTable,
      ...(row.legacy === undefined
        ? {}
        : {
            legacy: {
              ...row.legacy,
              activeDays: 5,
              capturedAt: row.receivedAt,
              windowDays: 30,
            },
          }),
    })
  })
}

async function patchStack(
  t: Ctx,
  stackId: Id<'stacks'>,
  patch: { publishCost?: boolean; isLowQuality?: boolean; name?: string; slug?: string }
) {
  await t.run(async (ctx) => ctx.db.patch(stackId, patch))
}

describe('leaderboard rollup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('serves the live board, field for field, over a mixed population', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'GPT X',
        slug: 'gpt-x',
        shortId: 'gptx1',
        provider: 'openai',
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: NOW,
        updatedAt: NOW,
      })
      // A rate for `gpt-x`, so a day the CLI left unpriced is filled by the
      // backend: the one figure in a rollup that depends on `modelPrices`.
      await ctx.db.insert('modelPrices', {
        modelSlug: 'gpt-x',
        from: 0,
        input: 3,
        output: 15,
        source: 'test-rates',
        createdAt: NOW,
      })
    })

    // Two machines, two harnesses, days across the window, a day on its first
    // date and days before it. The live path loads all of them and filters;
    // the rollup reads the window alone.
    const wide = await seedStack(t, { name: 'Wide' })
    await insertInventory(t, wide.stackId, { receivedAt: NOW - HOUR, machine: 'laptop' })
    await insertInventory(t, wide.stackId, { receivedAt: NOW - 2 * DAY, machine: 'vps' })
    await insertInventory(t, wide.stackId, {
      receivedAt: NOW - 3 * HOUR,
      machine: 'laptop',
      harness: 'codex',
    })
    await insertDay(t, wide.stackId, {
      date: dateOf(NOW),
      machine: 'laptop',
      models: [
        { id: 'model-alpha', tokens: 700, usd: 0.1 },
        { id: 'unknown', tokens: 50 },
      ],
    })
    await insertDay(t, wide.stackId, {
      date: dateOf(NOW),
      machine: 'vps',
      models: [{ id: 'model-alpha', tokens: 300, usd: 0.2 }],
    })
    await insertDay(t, wide.stackId, {
      date: dateOf(NOW - 3 * DAY),
      machine: 'laptop',
      harness: 'codex',
      sessions: 4,
      models: [{ id: 'gpt-x', tokens: 2_000_000 }],
    })
    await insertDay(t, wide.stackId, {
      date: dateOf(NOW - 29 * DAY),
      machine: 'vps',
      models: [{ id: 'model-alpha', tokens: 11, usd: 0.3 }],
    })
    await insertDay(t, wide.stackId, {
      date: dateOf(NOW - 30 * DAY),
      machine: 'vps',
      models: [{ id: 'model-alpha', tokens: 90_000, usd: 40 }],
    })
    await insertDay(t, wide.stackId, {
      date: dateOf(NOW - 200 * DAY),
      machine: 'laptop',
      models: [{ id: 'model-old', tokens: 80_000, usd: 30 }],
    })

    // Cost off: same tokens, no dollars.
    const privately = await seedStack(t, { name: 'Private', publishCost: false })
    await sync(t, privately.stackId, {
      models: [{ id: 'model-alpha', tokens: 400, usd: 9 }],
    })

    // Quiet: last sync 8 days ago, still inside the window.
    const quiet = await seedStack(t, { name: 'Quiet' })
    await insertInventory(t, quiet.stackId, { receivedAt: NOW - 8 * DAY })
    await insertDay(t, quiet.stackId, {
      date: dateOf(NOW - 8 * DAY),
      models: [{ id: 'claude-y', tokens: 600 }],
    })

    // Legacy: an inventory figure and no days.
    const legacy = await seedStack(t, { name: 'Legacy' })
    await insertInventory(t, legacy.stackId, {
      receivedAt: NOW - DAY,
      legacy: { tokens: 5000, sessions: 7 },
    })

    // Measured once, long ago: inventory, but no day in the window.
    const gone = await seedStack(t, { name: 'Gone' })
    await insertInventory(t, gone.stackId, { receivedAt: NOW - 60 * DAY })
    await insertDay(t, gone.stackId, {
      date: dateOf(NOW - 60 * DAY),
      models: [{ id: 'model-alpha', tokens: 999 }],
    })

    // Never measured.
    await seedStack(t, { name: 'Unmeasured' })

    // Two stacks the board cannot tell apart by tokens or name, and enough
    // rows for a second page. Synced newest stack first, so the rollups are
    // created in the opposite order to the stacks.
    const filler: Id<'stacks'>[] = []
    for (let i = 0; i < 12; i++) {
      filler.push((await seedStack(t, { name: i < 2 ? 'Twin' : `S${i}` })).stackId)
    }
    for (const [i, stackId] of [...filler.entries()].reverse()) {
      await sync(t, stackId, {
        models: [
          { id: 'gpt-x', tokens: i < 2 ? 500 : 100 + i },
          { id: 'claude-y', tokens: i < 2 ? 500 : 100 + i },
        ],
      })
    }

    const spam = await seedStack(t, { name: 'Spam' })
    await sync(t, spam.stackId, { totalTokens: 9000 })
    await patchStack(t, spam.stackId, { isLowQuality: true })

    await runCron(t)
    const board = await sameBoard(t)

    // The comparison is not vacuous: every case above is on the board, or
    // off it, for the reason it was seeded.
    expect(board.stackCount).toBe(16)
    expect(board.totalPages).toBe(2)
    expect(board.quiet).toEqual({ count: 1, tokens: 600 })
    const byName = new Map(board.rows.map((r) => [r.name, r]))
    expect(byName.has('Spam')).toBe(false)
    expect(byName.has('Gone')).toBe(false)
    expect(byName.get('Legacy')).toMatchObject({ tokens: 5000, points: [], spend: null })
    expect(byName.get('Private')?.spend).toBeNull()
    const wideRow = byName.get('Wide')
    expect(wideRow?.tokens).toBe(700 + 50 + 300 + 2_000_000 + 11)
    expect(wideRow?.syncCount).toBe(3)
    expect(wideRow?.harnesses).toEqual(['claude-code', 'codex'])
    expect(wideRow?.topModel?.name).toBe('GPT X')
    // 0.1 + 0.2 + 0.3 from the CLI, plus the backend's fill of the gpt-x day.
    expect(wideRow?.spend).toEqual({ lowerBoundUSD: 6.6, coverage: 1, exact: false })
    expect(board.pricingTables).toEqual(['anthropic-list-2026-07-25', 'test-rates'])

    // One row per stack with a reading, the flagged one included (the flag
    // is read live). A stack with no reading holds no row.
    expect(await rollupOf(t, gone.stackId)).toBeNull()
    expect(await rollups(t)).toHaveLength(17)
  })

  test('a sync refreshes its own stack, in a mutation of its own', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Synced' })
    await sync(t, stackId, { totalTokens: 100 })

    // The publish only scheduled the refresh: nothing is rolled up yet.
    expect(await rollupOf(t, stackId)).toBeNull()
    expect((await t.query(api.leaderboard.get, {})).stackCount).toBe(0)

    await settle(t)
    expect((await sameBoard(t)).rows[0]).toMatchObject({ name: 'Synced', tokens: 100 })
    expect(await rollupOf(t, stackId)).toMatchObject({
      windowFrom: '2026-07-05',
      windowTo: '2026-08-03',
      computedAt: NOW,
      lastSyncMs: NOW,
    })

    vi.setSystemTime(NOW + HOUR)
    await sync(t, stackId, { totalTokens: 250 })
    await settle(t)
    expect((await sameBoard(t)).rows[0]).toMatchObject({
      tokens: 250,
      lastSyncMs: NOW + HOUR,
    })
    expect(await rollups(t)).toHaveLength(1)
  })

  test('the CLI publish path refreshes the rollup too', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'From The CLI' })
    const userId = await t.run(async (ctx) => {
      const stack = await ctx.db.get(stackId)
      if (!stack) throw new Error('stack missing')
      return (await ctx.db.get(stack.creatorId))?.userId ?? ''
    })
    const tokenId = await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: `hash-${userId}`,
        userId,
        name: 'laptop',
        scopes: ['collect', 'sync'],
        stackId,
        createdAt: NOW,
        expiresAt: NOW + DAY,
        lastUsedAt: NOW,
      })
    )
    const p = payload({ totalTokens: 640 })
    await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payloads: [p],
      measuredDays: dayWireOf(p, NOW),
    })
    await settle(t)

    expect((await sameBoard(t)).rows[0]).toMatchObject({
      name: 'From The CLI',
      tokens: 640,
    })
  })

  test('reads the legacy figure of a stack that published no days', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Old CLI' })
    // A publish with no day wire is an old client: the payload's totals ride
    // on the inventory row as the legacy figure.
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ totalTokens: 4321, sessions: 12 }),
    })
    await settle(t)

    const board = await sameBoard(t)
    expect(board.rows[0]).toMatchObject({
      name: 'Old CLI',
      tokens: 4321,
      points: [],
      syncCount: 0,
      topModel: null,
      harnesses: ['claude-code'],
      spend: null,
    })
    expect(board.totalSessions).toBe(12)
    expect(await rollupOf(t, stackId)).toMatchObject({ modelTokens: [], spend: null })
  })

  test('publishCost is checked at read time: a toggle needs no refresh', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Priced' })
    await sync(t, stackId, { models: [{ id: 'model-alpha', tokens: 1000, usd: 12 }] })
    await settle(t)
    const spend = { lowerBoundUSD: 12, coverage: 1, exact: true }
    const stored = await rollupOf(t, stackId)
    expect(stored?.spend).toEqual(spend)

    let board = await sameBoard(t)
    expect(board.rows[0].spend).toEqual(spend)
    expect(board.costPublishers).toBe(1)

    await patchStack(t, stackId, { publishCost: false })
    board = await sameBoard(t)
    expect(board.rows[0].spend).toBeNull()
    expect(board.costPublishers).toBe(0)
    expect(board.spendLowerBoundUSD).toBe(0)
    expect(board.pricingTables).toEqual([])
    // Nothing was recomputed: the row is the one the sync wrote.
    expect(await rollupOf(t, stackId)).toEqual(stored)

    await patchStack(t, stackId, { publishCost: true })
    board = await sameBoard(t)
    expect(board.rows[0].spend).toEqual(spend)
    expect(board.pricingTables).toEqual(['anthropic-list-2026-07-25'])
  })

  test('a stack synced with cost off stores the priced figure and shows none', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Private', publishCost: false })
    await sync(t, stackId, { models: [{ id: 'model-alpha', tokens: 1000, usd: 12 }] })
    await settle(t)

    expect((await sameBoard(t)).rows[0].spend).toBeNull()
    await patchStack(t, stackId, { publishCost: true })
    expect((await sameBoard(t)).rows[0].spend).toEqual({
      lowerBoundUSD: 12,
      coverage: 1,
      exact: true,
    })
  })

  test('the quality flag, the names and the slug are read live', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Before' })
    const other = await seedStack(t, { name: 'Other' })
    await sync(t, stackId, { totalTokens: 300 })
    await sync(t, other.stackId, { totalTokens: 100 })
    await settle(t)
    const stored = await rollups(t)

    await patchStack(t, stackId, { isLowQuality: true })
    let board = await sameBoard(t)
    expect(board.rows.map((r) => r.name)).toEqual(['Other'])
    expect(board.totalTokens).toBe(100)

    await patchStack(t, stackId, { isLowQuality: false, name: 'After', slug: 'after' })
    await t.run(async (ctx) => {
      const stack = await ctx.db.get(stackId)
      if (stack) await ctx.db.patch(stack.creatorId, { name: 'Renamed Creator' })
    })
    board = await sameBoard(t)
    expect(board.rows[0]).toMatchObject({
      name: 'After',
      creatorName: 'Renamed Creator',
    })
    expect(board.rows[0].slug).toMatch(/^after-sid\d+x$/)

    // A catalog row filed after the sync names the model on the next read.
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'Model Alpha',
        slug: 'model-alpha',
        shortId: 'malph',
        provider: 'openai',
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: NOW,
        updatedAt: NOW,
      })
    })
    board = await sameBoard(t)
    expect(board.rows[0].topModel?.name).toBe('Model Alpha')
    expect(board.models[0].name).toBe('Model Alpha')

    expect(await rollups(t)).toEqual(stored)
  })

  test('living is evaluated against the clock, with no write', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Fading' })
    await sync(t, stackId, { totalTokens: 100 })
    await settle(t)
    const stored = await rollupOf(t, stackId)
    expect((await sameBoard(t)).livingCount).toBe(1)

    // Seven days and a second later, same UTC date range for the stored day.
    // No cron ran, so the read reports the old window. That is expected here.
    spyOnWarn()
    vi.setSystemTime(NOW + 7 * DAY + 1000)
    const board = await sameBoard(t)
    expect(board.livingCount).toBe(0)
    expect(board.quiet).toEqual({ count: 1, tokens: 100 })
    expect(await rollupOf(t, stackId)).toEqual(stored)
  })

  test('the cron slides the window at UTC midnight', async () => {
    const t = convexTest(schema, modules)
    const sliding = await seedStack(t, { name: 'Sliding' })
    await insertInventory(t, sliding.stackId, { receivedAt: NOW })
    await insertDay(t, sliding.stackId, {
      date: dateOf(NOW - 29 * DAY),
      models: [{ id: 'model-alpha', tokens: 1000 }],
    })
    await insertDay(t, sliding.stackId, {
      date: dateOf(NOW),
      models: [{ id: 'model-alpha', tokens: 10 }],
    })
    // Its only day is the window's first date: tomorrow it has no reading.
    const leaving = await seedStack(t, { name: 'Leaving' })
    await insertInventory(t, leaving.stackId, { receivedAt: NOW })
    await insertDay(t, leaving.stackId, {
      date: dateOf(NOW - 29 * DAY),
      models: [{ id: 'model-alpha', tokens: 77 }],
    })
    await runCron(t)
    expect((await sameBoard(t)).totalTokens).toBe(1087)

    // Past midnight UTC, before the cron: the live board already dropped the
    // oldest date, the rollups still hold yesterday's window. The served
    // board is behind, and the read says so.
    const warn = spyOnWarn()
    vi.setSystemTime(Date.parse('2026-08-04T00:00:30Z'))
    expect((await live(t)).totalTokens).toBe(10)
    expect((await t.query(api.leaderboard.get, {})).totalTokens).toBe(1087)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockClear()

    expect(await runCron(t)).toEqual({ scheduled: 2 })
    const board = await sameBoard(t)
    expect(warn).not.toHaveBeenCalled()
    expect(board.totalTokens).toBe(10)
    expect(board.stackCount).toBe(1)
    expect(await rollupOf(t, sliding.stackId)).toMatchObject({
      windowFrom: '2026-07-06',
      windowTo: '2026-08-04',
      tokens: 10,
    })
    expect(await rollupOf(t, leaving.stackId)).toBeNull()
  })

  test('the cron picks up a price change for the days the backend fills', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'GPT X',
        slug: 'gpt-x',
        shortId: 'gptx1',
        provider: 'openai',
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: NOW,
        updatedAt: NOW,
      })
    })
    const { stackId } = await seedStack(t, { name: 'Unpriced' })
    await sync(t, stackId, { models: [{ id: 'gpt-x', tokens: 1_000_000 }] })
    await settle(t)
    expect((await sameBoard(t)).rows[0].spend).toBeNull()

    await t.run(async (ctx) => {
      await ctx.db.insert('modelPrices', {
        modelSlug: 'gpt-x',
        from: 0,
        input: 3,
        output: 15,
        source: 'test-rates',
        createdAt: NOW,
      })
    })
    // The live board prices it at once. The served board is behind until the cron.
    expect((await live(t)).rows[0].spend).not.toBeNull()
    expect((await t.query(api.leaderboard.get, {})).rows[0].spend).toBeNull()

    await runCron(t)
    const board = await sameBoard(t)
    expect(board.rows[0].spend).toEqual({ lowerBoundUSD: 3, coverage: 1, exact: false })
    expect(board.pricingTables).toEqual(['test-rates'])
  })

  test('an unchanged recompute writes nothing', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Idle' })
    await sync(t, stackId, { totalTokens: 100 })
    await settle(t)
    const stored = await rollupOf(t, stackId)
    expect(stored?.computedAt).toBe(NOW)

    // An hour later, same UTC date: the cron finds nothing to change.
    vi.setSystemTime(NOW + HOUR)
    expect(await t.mutation(internal.leaderboard.refreshStack, { stackId })).toBe(
      'unchanged'
    )
    expect(await runCron(t)).toEqual({ scheduled: 1 })
    expect(await rollupOf(t, stackId)).toEqual(stored)

    // A change is written, and stamped with the time it was computed.
    await insertDay(t, stackId, {
      date: dateOf(NOW - DAY),
      models: [{ id: 'model-alpha', tokens: 5 }],
    })
    expect(await t.mutation(internal.leaderboard.refreshStack, { stackId })).toBe(
      'written'
    )
    const rewritten = await rollupOf(t, stackId)
    expect(rewritten?._id).toBe(stored?._id)
    expect(rewritten).toMatchObject({ tokens: 105, computedAt: NOW + HOUR })
    await sameBoard(t)
  })

  test('deleted days update the rollup, and a stack with none left loses it', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Shrinking' })
    await insertInventory(t, stackId, { receivedAt: NOW })
    await insertDay(t, stackId, {
      date: dateOf(NOW),
      models: [{ id: 'model-alpha', tokens: 100 }],
    })
    await insertDay(t, stackId, {
      date: dateOf(NOW - DAY),
      models: [{ id: 'model-alpha', tokens: 40 }],
    })
    await runCron(t)
    expect((await sameBoard(t)).totalTokens).toBe(140)

    await t.run(async (ctx) => {
      const rows = await ctx.db.query('measuredDays').collect()
      const yesterday = rows.find((row) => row.date === dateOf(NOW - DAY))
      if (yesterday) await ctx.db.delete(yesterday._id)
    })
    expect(await t.mutation(internal.leaderboard.refreshStack, { stackId })).toBe(
      'written'
    )
    expect((await sameBoard(t)).totalTokens).toBe(100)

    await t.run(async (ctx) => {
      for (const row of await ctx.db.query('measuredDays').collect()) {
        await ctx.db.delete(row._id)
      }
    })
    expect(await t.mutation(internal.leaderboard.refreshStack, { stackId })).toBe(
      'deleted'
    )
    expect(await rollups(t)).toEqual([])
    expect((await sameBoard(t)).stackCount).toBe(0)
    expect(await t.mutation(internal.leaderboard.refreshStack, { stackId })).toBe(
      'absent'
    )
  })

  test('a deleted stack is skipped by the read and its rollup is removed', async () => {
    const t = convexTest(schema, modules)
    const kept = await seedStack(t, { name: 'Kept' })
    const doomed = await seedStack(t, { name: 'Doomed' })
    await sync(t, kept.stackId, { totalTokens: 100 })
    await sync(t, doomed.stackId, { totalTokens: 900 })
    await settle(t)
    expect((await sameBoard(t)).stackCount).toBe(2)

    // The stack and its measured rows go; the rollup is left behind.
    await t.run(async (ctx) => {
      await ctx.db.delete(doomed.stackId)
      for (const table of ['measuredDays', 'measuredInventory'] as const) {
        for (const row of await ctx.db.query(table).collect()) {
          if (row.stackId === doomed.stackId) await ctx.db.delete(row._id)
        }
      }
    })
    expect(await rollupOf(t, doomed.stackId)).not.toBeNull()
    const board = await sameBoard(t)
    expect(board.rows.map((r) => r.name)).toEqual(['Kept'])
    expect(board.totalTokens).toBe(100)

    // The cron finds the orphan through the rollup table itself.
    expect(await runCron(t)).toEqual({ scheduled: 2 })
    expect(await rollupOf(t, doomed.stackId)).toBeNull()
    expect(await rollups(t)).toHaveLength(1)
    await sameBoard(t)
  })

  test('a second rollup of one stack is never counted and is removed', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Once' })
    await sync(t, stackId, { totalTokens: 100 })
    await settle(t)
    await t.run(async (ctx) => {
      const row = await ctx.db
        .query('leaderboardRollups')
        .withIndex('by_stack', (q) => q.eq('stackId', stackId))
        .first()
      if (!row) throw new Error('rollup missing')
      const { _id, _creationTime, ...content } = row
      await ctx.db.insert('leaderboardRollups', content)
    })
    expect(await rollups(t)).toHaveLength(2)
    expect((await sameBoard(t)).totalTokens).toBe(100)

    await t.mutation(internal.leaderboard.refreshStack, { stackId })
    expect(await rollups(t)).toHaveLength(1)
  })

  test('a rollup holding an old window is served unchanged and logged once per read', async () => {
    const t = convexTest(schema, modules)
    const stuck = await seedStack(t, { name: 'Stuck' })
    const fresh = await seedStack(t, { name: 'Fresh' })
    await sync(t, stuck.stackId, { totalTokens: 300 })
    await sync(t, fresh.stackId, { totalTokens: 100 })
    await settle(t)

    // Every rollup ends today: a read logs nothing.
    const warn = spyOnWarn()
    await t.query(api.leaderboard.get, {})
    await t.query(api.leaderboard.model, { name: 'model-alpha' })
    expect(warn).not.toHaveBeenCalled()

    // The next UTC day. One stack syncs and is refreshed. The other stack's
    // refresh never ran, as if it kept failing.
    vi.setSystemTime(Date.parse('2026-08-04T09:00:00Z'))
    await sync(t, fresh.stackId, { totalTokens: 50 })
    await settle(t)
    const stored = await rollupOf(t, stuck.stackId)
    expect(stored?.windowTo).toBe('2026-08-03')
    expect((await rollupOf(t, fresh.stackId))?.windowTo).toBe('2026-08-04')

    const board = await t.query(api.leaderboard.get, {})
    expect(warn).toHaveBeenCalledTimes(1)
    const message = String(warn.mock.calls[0][0])
    expect(message).toContain('1 of 2 rollups')
    expect(message).toContain('2026-08-04')
    expect(message).toContain(stuck.stackId)

    // The stale row is neither dropped nor altered, and the board carries no
    // trace of the warning.
    expect(board.rows.map((r) => [r.name, r.tokens])).toEqual([
      ['Stuck', 300],
      ['Fresh', 150],
    ])
    expect(board.stackCount).toBe(2)
    expect(await rollupOf(t, stuck.stackId)).toEqual(stored)

    // `model` reads the same population and logs the same way, once.
    await t.query(api.leaderboard.model, { name: 'model-alpha' })
    expect(warn).toHaveBeenCalledTimes(2)

    // The cron reaches the stack: the window is current and the log is quiet.
    warn.mockClear()
    await runCron(t)
    await sameBoard(t)
    expect(warn).not.toHaveBeenCalled()
  })
})
