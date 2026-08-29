/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
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

describe('leaderboard.get', () => {
  test('ranks living stacks by measured tokens and excludes drafts and low quality', async () => {
    const t = convexTest(schema, modules)
    const small = await seedStack(t, { name: 'Small' })
    const big = await seedStack(t, { name: 'Big' })
    const draft = await seedStack(t, { name: 'Draft', published: false })
    const spam = await seedStack(t, { name: 'Spam', isLowQuality: true })
    await sync(t, small.stackId, { totalTokens: 100 })
    await sync(t, big.stackId, { totalTokens: 900 })
    await sync(t, draft.stackId, { totalTokens: 5000 })
    await sync(t, spam.stackId, { totalTokens: 4000 })

    const board = await t.query(api.leaderboard.get, {})
    expect(board.rows.map((r) => [r.rank, r.name, r.tokens])).toEqual([
      [1, 'Big', 900],
      [2, 'Small', 100],
    ])
    expect(board.stackCount).toBe(2)
    expect(board.totalTokens).toBe(1000)
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

    const board = await t.query(api.leaderboard.get, {})
    const row = board.rows[0]
    expect(row.slug).toMatch(/^stack-\d+-sid\d+x$/)
    expect(row.creatorName).toMatch(/^Creator /)
  })
})

describe('leaderboard.model', () => {
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

