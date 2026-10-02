/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { liveBoard } from '../leaderboard.testOracle'
import schema from '../schema'

const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

const MIGRATION = internal.migrations['20261002_leaderboard_rollups']
const NOW = Date.parse('2026-10-02T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000

type Ctx = ReturnType<typeof convexTest>

const EMPTY_INVENTORY = {
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
}

/**
 * A stack as prod holds it before the backfill: measured rows written by
 * syncs that ran before the rollup existed, so nothing refreshed them.
 */
async function seedMeasuredStack(
  t: Ctx,
  name: string,
  days: { agoDays: number; tokens: number }[],
): Promise<Id<'stacks'>> {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: `Owner of ${name}`,
      slug: `owner-${name}`,
      userId: `user-${name}`,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: NOW,
    })
    const stackId = await ctx.db.insert('stacks', {
      name,
      slug: name,
      shortId: `sid-${name}`,
      creatorId,
      oneLiner: name,
      toolSubscriptions: [],
      hasUsageComponent: false,
      createdAt: NOW,
      updatedAt: NOW,
    })
    if (days.length === 0) return stackId
    await ctx.db.insert('measuredInventory', {
      stackId,
      harness: 'claude-code',
      harnessVersion: '2.1.220',
      capturedAt: NOW,
      receivedAt: NOW,
      inventory: EMPTY_INVENTORY,
      modelsSeen: ['model-alpha'],
      pricingTable: null,
    })
    for (const day of days) {
      const date = new Date(NOW - day.agoDays * DAY).toISOString().slice(0, 10)
      await ctx.db.insert('measuredDays', {
        stackId,
        date,
        capturedAt: NOW,
        receivedAt: NOW,
        aggregateVersion: 'measured-days/v1',
        fingerprint: `fp-${name}-${date}`,
        usage: {
          harnesses: [
            {
              harness: 'claude-code',
              sessions: 2,
              projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
              models: [
                {
                  model: 'model-alpha',
                  tokens: { input: day.tokens, output: 0, cacheWrite: 0, cacheRead: 0 },
                  usd: 1.5,
                  pricingTable: 'anthropic-list-2026-07-25',
                },
              ],
              subagentTokens: 0,
              excludedTokens: { unpriced: 0, synthetic: 0 },
            },
          ],
        },
      })
    }
    return stackId
  })
}

async function rollups(t: Ctx) {
  return await t.run(async (ctx) => ctx.db.query('leaderboardRollups').collect())
}

describe('20261002_leaderboard_rollups', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  test('fills the rollups so the served board equals the live board', async () => {
    const t = convexTest(schema, modules)
    const big = await seedMeasuredStack(t, 'big', [
      { agoDays: 0, tokens: 900 },
      { agoDays: 5, tokens: 100 },
      { agoDays: 45, tokens: 70_000 },
    ])
    const small = await seedMeasuredStack(t, 'small', [{ agoDays: 1, tokens: 300 }])
    // Measured only outside the window, and never measured: neither is on
    // the board, so neither gets a row.
    const old = await seedMeasuredStack(t, 'old', [{ agoDays: 90, tokens: 5 }])
    await seedMeasuredStack(t, 'unmeasured', [])

    expect(await rollups(t)).toEqual([])
    // Before the backfill the board is empty, while the live derivation over
    // the same rows already ranks two stacks.
    expect((await t.query(api.leaderboard.get, {})).stackCount).toBe(0)
    expect((await t.run((ctx) => liveBoard(ctx))).stackCount).toBe(2)

    // One refresh per stack that holds inventory. The stack with no measured
    // rows is not scheduled at all.
    expect(await t.mutation(MIGRATION.run, {})).toEqual({ scheduled: 3 })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const stored = await rollups(t)
    expect(stored.map((row) => row.stackId).sort()).toEqual([big, small].sort())
    expect(stored.some((row) => row.stackId === old)).toBe(false)
    expect(stored.find((row) => row.stackId === big)).toMatchObject({
      windowFrom: '2026-09-03',
      windowTo: '2026-10-02',
      computedAt: NOW,
      tokens: 1000,
      sessions: 4,
    })

    // `liveBoard` is the test oracle: the board derived from the measured rows.
    const live = await t.run((ctx) => liveBoard(ctx))
    const served = await t.query(api.leaderboard.get, {})
    expect(served).toEqual(live)
    expect(served.rows.map((r) => [r.name, r.tokens])).toEqual([
      ['big', 1000],
      ['small', 300],
    ])

    // IDEMPOTENT: a second run queues the same refreshes and writes no row.
    vi.setSystemTime(NOW + 60_000)
    expect(await t.mutation(MIGRATION.run, {})).toEqual({ scheduled: 3 })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect(await rollups(t)).toEqual(stored)
  })
})
