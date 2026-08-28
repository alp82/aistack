/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { internal } from '../_generated/api'
import type { Doc, Id } from '../_generated/dataModel'
import schema from '../schema'

const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ])
)

const MIGRATION = internal.migrations['20260829_retire_snapshots']
const NOW = Date.parse('2026-08-29T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000

type Ctx = ReturnType<typeof convexTest>
type Payload = Doc<'measuredSnapshots'>['payload']

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

function payload(over: { harness?: string; tokens?: number; usd?: number } = {}): Payload {
  return {
    schemaVersion: 1,
    capturedAt: NOW - 1_000,
    window: { days: 30, from: '2026-07-31', to: '2026-08-29' },
    harness: { name: over.harness ?? 'claude-code', version: '2.1.220' },
    pricingTable: 'anthropic-list-2026-08-25',
    activity: {
      sessions: 3,
      activeDays: 2,
      projects: 1,
      totalTokens: over.tokens ?? 1_000,
      cacheHitShare: 0,
      subagentShare: 0,
    },
    models: [
      {
        id: 'model-nobody-prices',
        tokenShare: 1,
        tokens: { input: over.tokens ?? 1_000, output: 0, cacheWrite: 0, cacheRead: 0 },
        ...(over.usd === undefined ? {} : { apiEquivalentUSD: over.usd }),
      },
    ],
    inventory: {
      builtinTools: [{ name: 'Bash', callShare: 1 }],
      mcpServers: [],
      skills: [{ name: 'tdd', callShare: 1 }],
      subagents: [],
      slashCommands: [],
      withheld: { builtinTools: 0, mcpServers: 0, skills: 0, subagents: 0, slashCommands: 0 },
    },
    coverage: { filesScanned: 1, filesUnreadable: 0, linesParsed: 1, linesFailed: 0 },
    excludedTokens: { unpriced: 0, synthetic: 0 },
  }
}

let counter = 0
async function seedStack(t: Ctx, over: Partial<Doc<'stacks'>> = {}) {
  counter++
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: `owner-${counter}`,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: 1,
    })
    return await ctx.db.insert('stacks', {
      name: `Stack ${counter}`,
      slug: `stack-${counter}`,
      shortId: `sid${counter}`,
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      createdAt: 1,
      updatedAt: 1,
      ...over,
    })
  })
}

async function snapshot(
  t: Ctx,
  stackId: Id<'stacks'>,
  over: { machine?: string; receivedAgo?: number; harness?: string; tokens?: number; usd?: number } = {}
) {
  const p = payload(over)
  const receivedAt = NOW - (over.receivedAgo ?? DAY)
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredSnapshots', {
      stackId,
      capturedAt: receivedAt - 1_000,
      receivedAt,
      schemaVersion: 1,
      harness: p.harness.name,
      ...(over.machine === undefined ? {} : { machine: over.machine }),
      payload: { ...p, capturedAt: receivedAt - 1_000 },
    })
  })
}

async function day(t: Ctx, stackId: Id<'stacks'>, machine?: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredDays', {
      stackId,
      ...(machine === undefined ? {} : { machine }),
      date: '2026-08-28',
      capturedAt: NOW,
      receivedAt: NOW,
      aggregateVersion: 'measured-days/v1',
      fingerprint: 'fp',
      usage: { harnesses: [] },
    })
  })
}

const inventory = (t: Ctx) => t.run((ctx) => ctx.db.query('measuredInventory').collect())

test('refuses while a living stack has no days, naming it', async () => {
  const t = convexTest(schema, modules)
  const living = await seedStack(t)
  await snapshot(t, living, { receivedAgo: DAY })
  await expect(t.mutation(MIGRATION.run, {})).rejects.toThrow(/stack-1-sid1/)
  expect(await inventory(t)).toHaveLength(0)
})

test('copies the newest snapshot per source into a missing inventory row, with the legacy figure for a stack without days', async () => {
  const t = convexTest(schema, modules)
  const quiet = await seedStack(t)
  await snapshot(t, quiet, { machine: 'laptop', receivedAgo: 20 * DAY, tokens: 100 })
  await snapshot(t, quiet, { machine: 'laptop', receivedAgo: 10 * DAY, tokens: 700, usd: 2.5 })
  await snapshot(t, quiet, { machine: 'laptop', harness: 'codex', receivedAgo: 10 * DAY, tokens: 50 })
  await snapshot(t, quiet, { receivedAgo: 40 * DAY, tokens: 9 })

  const result = await t.mutation(MIGRATION.run, {})
  expect(result).toEqual({ inventoryWritten: 3, legacyWritten: 3, skipped: 0 })

  const rows = (await inventory(t)).sort(
    (a, b) => `${a.machine}:${a.harness}`.localeCompare(`${b.machine}:${b.harness}`)
  )
  expect(rows.map((r) => [r.machine, r.harness, r.legacy?.tokens, r.legacy?.usd])).toEqual([
    ['laptop', 'claude-code', 700, 2.5],
    ['laptop', 'codex', 50, undefined],
    [undefined, 'claude-code', 9, undefined],
  ])
  expect(rows[0]?.inventory.skills).toEqual([{ name: 'tdd', callShare: 1 }])
  expect(rows[0]?.modelsSeen).toEqual(['model-nobody-prices'])

  // Idempotent: a second run writes nothing.
  expect(await t.mutation(MIGRATION.run, {})).toEqual({
    inventoryWritten: 0,
    legacyWritten: 0,
    skipped: 3,
  })
})

test('a stack with days gets no legacy figure, and a synced inventory row is never touched', async () => {
  const t = convexTest(schema, modules)
  const converted = await seedStack(t)
  await snapshot(t, converted, { machine: 'laptop', receivedAgo: DAY, tokens: 100 })
  await snapshot(t, converted, { machine: 'vps', receivedAgo: 2 * DAY, tokens: 300 })
  await day(t, converted, 'laptop')
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredInventory', {
      stackId: converted,
      machine: 'laptop',
      harness: 'claude-code',
      harnessVersion: 'fresh',
      capturedAt: NOW,
      receivedAt: NOW,
      inventory: payload().inventory,
      modelsSeen: [],
      pricingTable: null,
    })
  })

  const result = await t.mutation(MIGRATION.run, {})
  expect(result).toEqual({ inventoryWritten: 1, legacyWritten: 0, skipped: 1 })
  const rows = await inventory(t)
  expect(rows.find((r) => r.machine === 'laptop')?.harnessVersion).toBe('fresh')
  expect(rows.find((r) => r.machine === 'vps')?.legacy).toBeUndefined()
})

test('withholds the legacy dollars when the owner turned cost off', async () => {
  const t = convexTest(schema, modules)
  const quiet = await seedStack(t, { publishCost: false })
  await snapshot(t, quiet, { receivedAgo: 10 * DAY, tokens: 700, usd: 2.5 })
  await t.mutation(MIGRATION.run, {})
  expect((await inventory(t))[0]?.legacy?.usd).toBeUndefined()
})

test('clear empties both retired tables in batches and reports when it is done', async () => {
  const t = convexTest(schema, modules)
  const quiet = await seedStack(t)
  await snapshot(t, quiet, { receivedAgo: 10 * DAY })
  await snapshot(t, quiet, { receivedAgo: 11 * DAY })
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredWorkflowDays', {
      stackId: quiet,
      date: '2026-08-01',
      capturedAt: NOW,
      receivedAt: NOW,
      aggregateVersion: 'workflow-aggregates/v2',
      day: {
        date: '2026-08-01',
        harnesses: [],
        git: {
          testFileRuleVersion: 'v1',
          fileTypeRuleVersion: 'v1',
          commitSetRuleVersion: 'v1',
          commits: 0,
          lateNightCommits: 0,
          additions: 0,
          removals: 0,
          changedLinesPerCommit: [],
          testFileCommits: 0,
          changedLinesByExtension: [],
          withheldExtensionLines: 0,
          weekdayHourCells: [],
        },
      },
    })
  })

  expect(await t.mutation(MIGRATION.clear, {})).toEqual({ deleted: 3, done: true })
  expect(await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())).toHaveLength(0)
  expect(await t.run((ctx) => ctx.db.query('measuredWorkflowDays').collect())).toHaveLength(0)
  expect(await t.mutation(MIGRATION.clear, {})).toEqual({ deleted: 0, done: true })
})
