/// <reference types="vite/client" />
import { dayFingerprint } from '@aistack/workflow-rules'
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import schema from './schema'
import { sha256Hex } from './httpCli'
import { FULL_CLI_TOKEN_SCOPES } from './lib/cliScopes'

/**
 * The measured day store, the manifest and the range-folded usage read
 * (#307, ADR-0010, ADR-0011).
 *
 * The clock is pinned: every range test folds against a fixed "now", so the
 * dates in the fixtures never age out of the window they were written for.
 */

const modules = import.meta.glob('./**/*.{js,ts}')

const USER = 'user_owner'
const IDENTITY = { tokenIdentifier: `convex|${USER}`, subject: USER }
const NOW = Date.parse('2026-08-28T12:00:00Z')

type Ctx = Awaited<ReturnType<typeof convexTest>>
type StoredPayload = Doc<'measuredSnapshots'>['payload']
type WorkflowDay = NonNullable<Doc<'measuredDays'>['workflow']>
type UsageDay = NonNullable<Doc<'measuredDays'>['usage']>

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

function payload(over: Partial<StoredPayload> = {}): StoredPayload {
  return {
    schemaVersion: 1,
    capturedAt: NOW - 1_000,
    window: { days: 30, from: '2026-07-30', to: '2026-08-28' },
    harness: { name: 'claude-code', version: '2.1.220' },
    pricingTable: 'anthropic-list-2026-08-25',
    activity: {
      sessions: 3,
      activeDays: 2,
      projects: 1,
      totalTokens: 1_000,
      cacheHitShare: 0,
      subagentShare: 0,
    },
    models: [
      {
        id: 'claude-haiku-4-5',
        tokenShare: 1,
        tokens: { input: 1_000, output: 0, cacheWrite: 0, cacheRead: 0 },
      },
    ],
    inventory: {
      builtinTools: [{ name: 'Bash', callShare: 0.5 }],
      mcpServers: [],
      skills: [{ name: 'tdd', callShare: 1 }],
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
    coverage: { filesScanned: 1, filesUnreadable: 0, linesParsed: 1, linesFailed: 0 },
    excludedTokens: { unpriced: 0, synthetic: 0 },
    ...over,
  } as StoredPayload
}

function workflowDay(date: string): WorkflowDay {
  return {
    date,
    harnesses: [
      {
        harness: 'claude-code',
        sessions: 2,
        startHours: [{ hourUtc: 9, sessions: 2 }],
        activity: [{ weekdayUtc: 1, hourUtc: 9, events: 4 }],
      },
    ],
    git: {
      testFileRuleVersion: 'test-file-rules/v1',
      fileTypeRuleVersion: 'file-type-rules/v1',
      commitSetRuleVersion: 'commit-set-rules/v1',
      commits: 1,
      lateNightCommits: 0,
      additions: 10,
      removals: 2,
      changedLinesPerCommit: [12],
      testFileCommits: 0,
      changedLinesByExtension: [{ extension: 'ts', changedLines: 12 }],
      withheldExtensionLines: 0,
      weekdayHourCells: [{ weekdayUtc: 1, hourUtc: 10, commits: 1 }],
    },
  }
}

type UsageOver = {
  sessions?: number
  input?: number
  usd?: number
  model?: string
  harness?: string
  subagentTokens?: number
}

function usageDay(over: UsageOver = {}): UsageDay {
  const input = over.input ?? 1_000
  return {
    harnesses: [
      {
        harness: over.harness ?? 'claude-code',
        sessions: over.sessions ?? 1,
        projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
        models: [
          {
            model: over.model ?? 'claude-haiku-4-5',
            tokens: { input, output: 0, cacheWrite: 0, cacheRead: 0 },
            ...(over.usd === undefined
              ? {}
              : { usd: over.usd, pricingTable: 'anthropic-list-2026-08-25' }),
          },
        ],
        subagentTokens: over.subagentTokens ?? 0,
        excludedTokens: { unpriced: 0, synthetic: 0 },
      },
    ],
  }
}

type DayIn = { date: string; usage?: UsageDay; workflow?: WorkflowDay }

function dayWire(days: DayIn[], utcOffsetMinutes = 120) {
  return { aggregateVersion: 'measured-days/v1', utcOffsetMinutes, days }
}

async function seedStack(t: Ctx, over: Partial<Doc<'stacks'>> = {}) {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: `owner-${Math.random().toString(36).slice(2, 8)}`,
      userId: USER,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: NOW,
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'My Stack',
      slug: 'my-stack',
      shortId: `sid${Math.random().toString(36).slice(2, 8)}`,
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      createdAt: NOW,
      updatedAt: NOW,
      ...over,
    })
    const stack = await ctx.db.get(stackId)
    return { stackId, slug: `${stack?.slug}-${stack?.shortId}` }
  })
}

async function seedToken(t: Ctx, token: string, stackId: Id<'stacks'>, name?: string) {
  return await t.run(async (ctx) =>
    ctx.db.insert('cliTokens', {
      tokenHash: await sha256Hex(token),
      userId: USER,
      scopes: FULL_CLI_TOKEN_SCOPES,
      stackId,
      ...(name === undefined ? {} : { name }),
      createdAt: NOW,
      lastUsedAt: NOW,
      expiresAt: NOW + 90 * 24 * 60 * 60 * 1000,
    })
  )
}

async function publish(
  t: Ctx,
  stackId: Id<'stacks'>,
  opts: {
    machine?: string
    measuredDays?: ReturnType<typeof dayWire>
    workflow?: { aggregateVersion: string; utcOffsetMinutes?: number; days: WorkflowDay[] }
    payload?: StoredPayload
  } = {}
) {
  await t.mutation(internal.measured.publishSnapshot, {
    stackId,
    payload: opts.payload ?? payload(),
    ...(opts.machine === undefined ? {} : { machine: opts.machine }),
    ...(opts.measuredDays === undefined ? {} : { measuredDays: opts.measuredDays }),
    ...(opts.workflow === undefined ? {} : { workflow: opts.workflow }),
  })
}

const storedDays = (t: Ctx) =>
  t.run(async (ctx) => ctx.db.query('measuredDays').collect())

describe('storing measured days', () => {
  test('a publish stores one row per day with both blocks and a fingerprint', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const days: DayIn[] = [
      { date: '2026-08-27', usage: usageDay(), workflow: workflowDay('2026-08-27') },
      { date: '2026-08-28', usage: usageDay() },
    ]
    await publish(t, stackId, { machine: 'laptop', measuredDays: dayWire(days) })

    const rows = await storedDays(t)
    expect(rows.map((row) => [row.machine, row.date]).sort()).toEqual([
      ['laptop', '2026-08-27'],
      ['laptop', '2026-08-28'],
    ])
    const first = rows.find((row) => row.date === '2026-08-27')
    expect(first).toMatchObject({
      aggregateVersion: 'measured-days/v1',
      utcOffsetMinutes: 120,
      fingerprint: dayFingerprint(days[0] as never),
    })
    expect(first?.usage).toBeDefined()
    expect(first?.workflow).toBeDefined()
  })

  test('a re-synced day replaces the row, and the fingerprint follows the content', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([{ date: '2026-08-28', usage: usageDay({ sessions: 1 }) }]),
    })
    const before = (await storedDays(t))[0]
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([{ date: '2026-08-28', usage: usageDay({ sessions: 5 }) }]),
    })
    const rows = await storedDays(t)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.usage?.harnesses[0]?.sessions).toBe(5)
    expect(rows[0]?.fingerprint).not.toBe(before?.fingerprint)
  })

  test('a legacy workflow section keeps the usage block an older client never carried', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([{ date: '2026-08-28', usage: usageDay({ sessions: 3 }) }]),
    })
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: {
        aggregateVersion: 'workflow-aggregates/v2',
        days: [workflowDay('2026-08-28')],
      },
    })
    const rows = await storedDays(t)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.usage?.harnesses[0]?.sessions).toBe(3)
    expect(rows[0]?.workflow?.git.commits).toBe(1)
  })

  test('a day wire that omits usage clears it: the row is the day as the machine now sees it', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([{ date: '2026-08-28', usage: usageDay() }]),
    })
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([{ date: '2026-08-28', workflow: workflowDay('2026-08-28') }]),
    })
    const rows = await storedDays(t)
    expect(rows[0]?.usage).toBeUndefined()
    expect(rows[0]?.workflow).toBeDefined()
  })

  test('days older than the send window are never pruned', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.run(async (ctx) =>
      ctx.db.insert('measuredDays', {
        stackId,
        machine: 'laptop',
        date: '2020-01-01',
        capturedAt: 0,
        receivedAt: 0,
        aggregateVersion: 'measured-days/v1',
        fingerprint: 'old',
        usage: usageDay(),
      })
    )
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([{ date: '2026-08-28', usage: usageDay() }]),
    })
    expect((await storedDays(t)).map((row) => row.date).sort()).toEqual([
      '2020-01-01',
      '2026-08-28',
    ])
  })

  test('a malformed wire refuses the publish before any row lands', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await expect(
      publish(t, stackId, {
        measuredDays: dayWire([{ date: '2026-02-30', usage: usageDay() }]),
      })
    ).rejects.toThrow(/date must be a UTC date/)
    await expect(
      publish(t, stackId, {
        measuredDays: dayWire([
          { date: '2026-08-28', workflow: workflowDay('2026-08-27') },
        ]),
      })
    ).rejects.toThrow(/workflow.date must equal/)
    await expect(
      publish(t, stackId, {
        measuredDays: dayWire([
          { date: '2026-08-28', usage: usageDay() },
          { date: '2026-08-28', usage: usageDay() },
        ]),
      })
    ).rejects.toThrow(/distinct date/)
    await expect(
      publish(t, stackId, {
        measuredDays: dayWire([{ date: '2026-08-28', usage: usageDay({ input: -1 }) }]),
      })
    ).rejects.toThrow(/non-negative/)
    expect(await storedDays(t)).toEqual([])
  })

  test('every publish replaces the (machine, harness) inventory row', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    await publish(t, stackId, {
      machine: 'laptop',
      payload: payload({
        models: [
          { id: 'claude-opus-4-5', tokenShare: 1, tokens: { input: 1, output: 0, cacheWrite: 0, cacheRead: 0 } },
        ],
      }),
    })
    await publish(t, stackId, { machine: 'vps' })
    const rows = await t.run(async (ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows.map((row) => [row.machine, row.harness]).sort()).toEqual([
      ['laptop', 'claude-code'],
      ['vps', 'claude-code'],
    ])
    const laptop = rows.find((row) => row.machine === 'laptop')
    expect(laptop?.modelsSeen).toEqual(['claude-opus-4-5'])
    expect(laptop?.inventory.skills).toEqual([{ name: 'tdd', callShare: 1 }])
    expect(laptop?.harnessVersion).toBe('2.1.220')
  })
})

describe('the day manifest', () => {
  test('lists the machine’s dates with fingerprints, stable across an identical re-publish', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, 'tok', stackId, 'laptop')
    const days: DayIn[] = [
      { date: '2026-08-28', usage: usageDay() },
      { date: '2026-08-27', usage: usageDay(), workflow: workflowDay('2026-08-27') },
    ]
    await publish(t, stackId, { machine: 'laptop', measuredDays: dayWire(days) })
    await publish(t, stackId, {
      machine: 'vps',
      measuredDays: dayWire([{ date: '2026-08-20', usage: usageDay() }]),
    })

    const first = await t.query(internal.measured.getDayManifestForToken, { tokenId })
    expect(first.retentionDays).toBe(400)
    expect(first.aggregateVersion).toBe('measured-days/v1')
    expect(first.days.map((d) => d.date)).toEqual(['2026-08-27', '2026-08-28'])

    vi.setSystemTime(NOW + 60_000)
    await publish(t, stackId, { machine: 'laptop', measuredDays: dayWire(days) })
    const second = await t.query(internal.measured.getDayManifestForToken, { tokenId })
    expect(second.days).toEqual(first.days)
  })

  test('refuses a token that is not linked to a stack', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, 'tok', stackId, 'laptop')
    await t.run(async (ctx) => ctx.db.patch(tokenId, { stackId: undefined }))
    await expect(
      t.query(internal.measured.getDayManifestForToken, { tokenId })
    ).rejects.toThrow(/not linked/)
  })
})

describe('getUsageByStackSlug', () => {
  async function seedRanges(t: Ctx, stackId: Id<'stacks'>) {
    // Today, yesterday, 8 days ago (inside 30d, outside 7d) and 40 days ago
    // (previous 30d only). All on the laptop; the vps has today only.
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([
        { date: '2026-08-28', usage: usageDay({ sessions: 1, input: 100, usd: 0.1 }) },
        { date: '2026-08-27', usage: usageDay({ sessions: 2, input: 200, usd: 0.2 }) },
        { date: '2026-08-20', usage: usageDay({ sessions: 4, input: 400, usd: 0.4 }) },
        { date: '2026-07-19', usage: usageDay({ sessions: 8, input: 800, usd: 0.8 }) },
      ]),
    })
    await publish(t, stackId, {
      machine: 'vps',
      measuredDays: dayWire([
        { date: '2026-08-28', usage: usageDay({ sessions: 16, input: 1_600, usd: 1.6 }) },
      ]),
    })
  }

  test('30d folds every machine and reads the previous 30 days', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await seedRanges(t, stackId)

    const read = await t.query(api.measured.getUsageByStackSlug, { slug })
    expect(read).toMatchObject({
      range: '30d',
      from: '2026-07-30',
      to: '2026-08-28',
      hasDays: true,
    })
    expect(read?.current).toMatchObject({
      sessions: 23,
      totalTokens: 2_300,
      activeDays: 3,
      projects: 1,
      cost: { usd: 2.3, estimated: false, pricedShare: 1 },
    })
    expect(read?.current?.dates).toEqual(['2026-08-20', '2026-08-27', '2026-08-28'])
    expect(read?.previous).toMatchObject({ sessions: 8, totalTokens: 800 })
    expect(read?.series).toEqual([
      { date: '2026-08-20', tokens: 400, sessions: 4 },
      { date: '2026-08-27', tokens: 200, sessions: 2 },
      { date: '2026-08-28', tokens: 1_700, sessions: 17 },
    ])
    expect(read?.receivedAt).toBe(NOW)
  })

  test('7d and 24h narrow the window, and an empty previous side is null', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await seedRanges(t, stackId)

    const week = await t.query(api.measured.getUsageByStackSlug, { slug, range: '7d' })
    expect(week).toMatchObject({ from: '2026-08-22', to: '2026-08-28' })
    expect(week?.current?.sessions).toBe(19)
    expect(week?.previous?.sessions).toBe(4)

    const day = await t.query(api.measured.getUsageByStackSlug, { slug, range: '24h' })
    expect(day).toMatchObject({ from: '2026-08-28', to: '2026-08-28' })
    expect(day?.current?.sessions).toBe(17)
    expect(day?.previous?.sessions).toBe(2)

    vi.setSystemTime(Date.parse('2026-09-20T00:00:00Z'))
    const later = await t.query(api.measured.getUsageByStackSlug, { slug, range: '7d' })
    expect(later?.current).toBeNull()
    expect(later?.previous).toBeNull()
    expect(later?.hasDays).toBe(true)
  })

  test('a machine ordinal narrows to that machine, and the list names both', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await seedRanges(t, stackId)
    const read = await t
      .withIdentity(IDENTITY)
      .query(api.measured.getUsageByStackSlug, { slug, machineOrdinal: 2 })
    expect(read?.machines).toEqual([
      { machine: 'laptop', machineOrdinal: 1 },
      { machine: 'vps', machineOrdinal: 2 },
    ])
    expect(read?.current?.sessions).toBe(16)
    expect(
      await t.query(api.measured.getUsageByStackSlug, { slug, machineOrdinal: 9 })
    ).toBeNull()
    // The public read withholds the names and keeps the positions.
    const anon = await t.query(api.measured.getUsageByStackSlug, { slug })
    expect(anon?.machines).toEqual([
      { machine: null, machineOrdinal: 1 },
      { machine: null, machineOrdinal: 2 },
    ])
  })

  test('publishCost off strips every dollar', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t, { publishCost: false })
    await seedRanges(t, stackId)
    const read = await t.query(api.measured.getUsageByStackSlug, { slug })
    expect(read?.current?.cost).toBeNull()
    expect(read?.current?.models.map((m) => m.usd)).toEqual([null])
    expect(read?.current?.models[0]?.pricingTables).toEqual([])
    expect(read?.current?.totalTokens).toBe(2_300)
  })

  test('an unpriced day is filled at the table rate for that day, and the figure says so', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([
        { date: '2026-08-28', usage: usageDay({ input: 1_000_000, usd: 1.5 }) },
        // claude-haiku-4-5 is $1 per million input tokens in the shared table.
        { date: '2026-08-27', usage: usageDay({ input: 1_000_000 }) },
      ]),
    })
    const read = await t.query(api.measured.getUsageByStackSlug, { slug })
    expect(read?.current?.models[0]).toMatchObject({
      id: 'claude-haiku-4-5',
      usd: 2.5,
      estimated: true,
    })
    expect(read?.current?.cost).toMatchObject({ usd: 2.5, estimated: true, pricedShare: 1 })
  })

  test('a model no table prices leaves its tokens out of the priced share', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([
        { date: '2026-08-28', usage: usageDay({ input: 1_000, usd: 1 }) },
        { date: '2026-08-27', usage: usageDay({ input: 1_000, model: 'mystery-model' }) },
      ]),
    })
    const read = await t.query(api.measured.getUsageByStackSlug, { slug })
    expect(read?.current?.cost).toMatchObject({ usd: 1, estimated: true, pricedShare: 0.5 })
    expect(read?.current?.models.find((m) => m.id === 'mystery-model')?.usd).toBeNull()
  })

  test('a stack with only snapshots answers hasDays false with no reading', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    const read = await t.query(api.measured.getUsageByStackSlug, { slug })
    expect(read).toMatchObject({ hasDays: false, current: null, previous: null, series: [] })
    expect(read?.machines).toEqual([{ machine: null, machineOrdinal: 1 }])
  })

  test('an unpublished stack answers null', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t, { published: false })
    await seedRanges(t, stackId)
    expect(await t.query(api.measured.getUsageByStackSlug, { slug })).toBeNull()
  })
})

describe('the workflow read over the new table', () => {
  test('folds the workflow blocks of the day rows', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      measuredDays: dayWire([
        { date: '2026-08-28', usage: usageDay(), workflow: workflowDay('2026-08-28') },
        { date: '2026-08-27', workflow: workflowDay('2026-08-27') },
        { date: '2026-08-26', usage: usageDay() },
      ]),
    })
    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.window.days).toBe(2)
    expect(view?.section.git.commits).toBe(2)
  })
})
