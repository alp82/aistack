/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import type { Infer } from 'convex/values'
import schema, { MeasuredPayload } from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

const USER = 'user_owner'
const IDENTITY = { tokenIdentifier: `convex|${USER}`, subject: USER }
type Ctx = Awaited<ReturnType<typeof convexTest>>
type StoredPayload = Infer<typeof MeasuredPayload>
type Day = NonNullable<Doc<'measuredDays'>['workflow']>
type Wire = { aggregateVersion: string; utcOffsetMinutes?: number; days: Day[] }

const DAY_MS = 24 * 60 * 60 * 1000
const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)
/** Dates relative to the test's own clock, so the window tests never age out. */
const daysAgo = (n: number) => utcDay(Date.now() - n * DAY_MS)

function payload(over: Record<string, unknown> = {}): StoredPayload {
  return {
    schemaVersion: 1,
    capturedAt: Date.now(),
    window: { days: 30, from: '2026-07-26', to: '2026-08-25' },
    harness: { name: 'claude-code', version: '2.1.220' },
    pricingTable: 'anthropic-list-2026-08-25',
    activity: {
      sessions: 142,
      activeDays: 22,
      projects: 4,
      totalTokens: 1_000_000,
      cacheHitShare: 0.9,
      subagentShare: 0.3,
    },
    models: [
      {
        id: 'claude-opus-5',
        tokenShare: 1,
        tokens: { input: 10, output: 20, cacheWrite: 30, cacheRead: 40 },
      },
    ],
    inventory: {
      builtinTools: [{ name: 'Bash', callShare: 0.5 }],
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
      filesScanned: 100,
      filesUnreadable: 0,
      linesParsed: 9_999,
      linesFailed: 1,
    },
    excludedTokens: { unpriced: 0, synthetic: 0 },
    ...over,
  } as StoredPayload
}

const PHASE_TOTALS = {
  scout: 640,
  build: 180,
  verify: 60,
  handoff: 50,
  unknown: 70,
}

/** One day shaped exactly like the wire's, with every optional block present. */
function day(over: Partial<Day> = {}): Day {
  return {
    date: daysAgo(1),
    harnesses: [
      {
        harness: 'claude-code',
        sessions: 10,
        startHours: [{ hourUtc: 21, sessions: 10 }],
        phase: {
          ruleVersion: 'phase-rules/v1',
          sessions: 10,
          phaseSec: { ...PHASE_TOTALS },
          phaseEvents: { scout: 60, build: 20, verify: 6, handoff: 5, unknown: 7 },
          waitingSec: 30,
          idleSec: 10,
          sessionsWithVerify: 4,
          sessionsWithHandoff: 6,
          bucketRuleVersion: 'log-buckets/v1',
          lengths: [
            {
              bucket: 4,
              sessions: 10,
              phaseSec: { ...PHASE_TOTALS },
              merged: 2,
              verified: 4,
              mergedVerified: 2,
              openedWithScout: 6,
            },
          ],
        },
        routing: {
          main: [{ model: 'claude-opus-5', tokens: 800 }],
          subagents: [{ model: 'claude-sonnet-5', tokens: 200 }],
        },
        delegation: {
          mainToolCalls: 90,
          subagentToolCalls: 10,
          widestFanOut: 2,
          mostSubagents: 3,
        },
        activity: [{ weekdayUtc: 1, hourUtc: 21, events: 40 }],
        effort: [
          { level: 'medium', turns: 4 },
          { level: 'high', turns: 6 },
        ],
        thinking: { thinkingTokens: 250, responseTokens: 1000 },
        turnDurations: {
          bucketRuleVersion: 'log-buckets/v1',
          buckets: [{ bucket: 6, turns: 10 }],
        },
        questions: { asked: 1, turns: 20 },
        webSearches: 2,
      },
    ],
    git: {
      testFileRuleVersion: 'test-files/v2',
      fileTypeRuleVersion: 'file-types/v2',
      commitSetRuleVersion: 'commit-set/v1',
      commits: 20,
      lateNightCommits: 9,
      additions: 800,
      removals: 200,
      changedLinesPerCommit: [50, 50],
      testFileCommits: 4,
      changedLinesByExtension: [{ extension: '.ts', changedLines: 900 }],
      withheldExtensionLines: 100,
      weekdayHourCells: [{ weekdayUtc: 1, hourUtc: 23, commits: 9 }],
    },
    parallelProjects: 2,
    ...over,
  }
}

function wire(days: Day[] = [day()], over: Partial<Wire> = {}): Wire {
  return {
    aggregateVersion: 'workflow-aggregates/v2',
    utcOffsetMinutes: 120,
    days,
    ...over,
  }
}

async function seedStack(
  t: Ctx,
  opts: { published?: boolean; publishWorkflow?: boolean } = {},
) {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: `owner-${Math.random().toString(36).slice(2, 8)}`,
      userId: USER,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'My Stack',
      slug: 'my-stack',
      shortId: `sid${Math.random().toString(36).slice(2, 8)}`,
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: opts.published ?? true,
      ...(opts.publishWorkflow === undefined
        ? {}
        : { publishWorkflow: opts.publishWorkflow }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    const stack = await ctx.db.get(stackId)
    return { stackId, slug: `${stack?.slug}-${stack?.shortId}` }
  })
}

async function publish(
  t: Ctx,
  stackId: Doc<'stacks'>['_id'],
  opts: { machine?: string; workflow?: Wire; payload?: StoredPayload } = {},
) {
  await t.mutation(internal.measured.publishSnapshot, {
    stackId,
    payload: opts.payload ?? payload(),
    ...(opts.machine === undefined ? {} : { machine: opts.machine }),
    workflow: opts.workflow ?? wire(),
  })
}

const storedDays = (t: Ctx) =>
  t.run(async (ctx) => ctx.db.query('measuredDays').collect())

describe('storing workflow days', () => {
  test('a publish stores one row per day against the machine that sent it', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([day({ date: daysAgo(2) }), day({ date: daysAgo(1) })]),
    })

    const rows = await storedDays(t)
    expect(rows.map((row) => [row.machine, row.date]).sort()).toEqual([
      ['laptop', daysAgo(2)],
      ['laptop', daysAgo(1)],
    ])
    // A legacy section lands as a day row under the day version (#307).
    expect(rows[0]).toMatchObject({
      aggregateVersion: 'measured-days/v1',
      utcOffsetMinutes: 120,
    })
    expect(rows[0]?.workflow).toBeDefined()
    expect(rows[0]?.usage).toBeUndefined()
  })

  test('a re-synced day replaces that day, and new days append', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([day({ date: daysAgo(3) }), day({ date: daysAgo(2) })]),
    })
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([
        day({ date: daysAgo(2), git: { ...day().git, commits: 1 } }),
        day({ date: daysAgo(1) }),
      ]),
    })

    const rows = await storedDays(t)
    expect(rows.map((row) => row.date).sort()).toEqual([
      daysAgo(3),
      daysAgo(2),
      daysAgo(1),
    ])
    // The replaced day holds the second sync's reading, not the sum of both.
    expect(rows.find((row) => row.date === daysAgo(2))?.workflow?.git.commits).toBe(1)
  })

  test('two machines keep two series, because a reading is one machine’s', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    await publish(t, stackId, { machine: 'vps' })

    const rows = await storedDays(t)
    expect(rows.map((row) => row.machine).sort()).toEqual(['laptop', 'vps'])
  })

  test('a day past the send window stays: nothing prunes server-side (ADR-0011)', async () => {
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
        workflow: day({ date: '2020-01-01' }),
      }),
    )
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([day({ date: daysAgo(1) })]),
    })
    expect((await storedDays(t)).map((row) => row.date).sort()).toEqual([
      '2020-01-01',
      daysAgo(1),
    ])
  })

  test('a malformed wire refuses the publish, and nothing lands', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      publish(t, stackId, {
        machine: 'laptop',
        workflow: wire([day({ date: 'yesterday' })]),
      }),
    ).rejects.toThrow(/date must be a UTC date/)
    await expect(
      publish(t, stackId, {
        machine: 'laptop',
        workflow: wire([day(), day()]),
      }),
    ).rejects.toThrow(/distinct date/)
    expect(
      await t.run(async (ctx) => ctx.db.query('measuredInventory').collect()),
    ).toHaveLength(0)
  })
})

describe('reading a window', () => {
  test('a stack that never synced a workflow has no section', async () => {
    const t = convexTest(schema, modules)
    const { slug, stackId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload(),
    })
    expect(
      await t.query(api.workflow.getWorkflowByStackSlug, { slug }),
    ).toBeNull()
  })

  test('the default window folds the last 30 days into the fixed row order', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([
        day({ date: daysAgo(40) }),
        day({ date: daysAgo(10) }),
        day({ date: daysAgo(1) }),
      ]),
    })

    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.window).toMatchObject({ id: '30d', days: 2 })
    // Two days folded: 40 commits, 20 sessions.
    expect(view?.section.git.commits).toBe(40)
    expect(view?.section.harnesses[0]?.sessions).toBe(20)
    expect(view?.section.dates).toEqual([daysAgo(10), daysAgo(1)])
    // The podium is the first three rows in the fixed order.
    expect(
      view?.rows.filter((r) => r.placement === 'highlight').map((r) => r.rowId),
    ).toEqual([
      'component:activity-heatmap',
      'component:start-hours',
      'metric:late-night-commits',
    ])
    const nightly = view?.rows.find((r) => r.rowId === 'metric:late-night-commits')
    expect(nightly?.value).toBeCloseTo(0.45, 10)
    expect(nightly?.name).toBe('Late-night commits')
    expect(nightly?.flat).toBe(true)
    // Fit rides along as a number nothing ranks by.
    expect(nightly?.fit).toBeCloseTo(0.3 / 0.45, 10)
  })

  test('the 7-day and 24-hour windows fold fewer days, and an empty one is the empty state', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([day({ date: daysAgo(10) }), day({ date: daysAgo(3) })]),
    })

    const week = await t.query(api.workflow.getWorkflowByStackSlug, {
      slug,
      window: '7d',
    })
    expect(week?.window).toMatchObject({ id: '7d', days: 1 })
    expect(week?.section.git.commits).toBe(20)

    const today = await t.query(api.workflow.getWorkflowByStackSlug, {
      slug,
      window: '24h',
    })
    expect(today?.window).toMatchObject({ id: '24h', days: 0 })
    expect(today?.rows).toEqual([])
    expect(today?.section.harnesses).toEqual([])
    // The machine list and the clock still describe the machine.
    expect(today?.machines).toHaveLength(1)
    expect(today?.utcOffsetMinutes).toBe(120)
  })

  test('the lead facts count every synced session, gate-held harnesses included', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    // The sessions come from the usage half of the same day (ADR-0010): a
    // harness the playbook gate holds back still counts here.
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      machine: 'laptop',
      payload: payload(),
      measuredDays: {
        aggregateVersion: 'measured-days/v1',
        utcOffsetMinutes: 120,
        days: [
          {
            date: daysAgo(1),
            usage: {
              harnesses: [
                {
                  harness: 'claude-code',
                  sessions: 100,
                  projectKeys: [],
                  models: [],
                  subagentTokens: 0,
                  excludedTokens: { unpriced: 0, synthetic: 0 },
                },
                {
                  harness: 'codex',
                  sessions: 42,
                  projectKeys: [],
                  models: [],
                  subagentTokens: 0,
                  excludedTokens: { unpriced: 0, synthetic: 0 },
                },
              ],
            },
            workflow: day(),
          },
        ],
      },
    })

    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.lead).toMatchObject({
      sessionCount: 142,
      harnessCount: 1,
      playbookHarnessCount: 1,
      verifySessionShare: 0.4,
      handoffSessionShare: 0.6,
      // 21:00 UTC on a machine two hours east.
      modalStartHourOwnerLocal: 23,
      ruleVersion: 'phase-rules/v1',
    })
    expect(view?.lead.phaseShare?.scout).toBeCloseTo(0.64, 10)
    expect(view?.mixedRuleVersions).toBe(false)
  })

  test('a window that straddles a rule bump is tagged as mixed', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const older = day({ date: daysAgo(2) })
    const newer = day({ date: daysAgo(1) })
    const phase = newer.harnesses[0]?.phase
    if (newer.harnesses[0] && phase) {
      newer.harnesses[0].phase = { ...phase, ruleVersion: 'phase-rules/v2' }
    }

    await publish(t, stackId, { machine: 'laptop', workflow: wire([older, newer]) })
    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.mixedRuleVersions).toBe(true)
    expect(view?.phaseRuleVersions).toEqual(['phase-rules/v1', 'phase-rules/v2'])
    expect(view?.lead.ruleVersion).toBe('phase-rules/v1 · phase-rules/v2')
  })

  test('an unpublished machine name is withheld, and its position still addresses it', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.machine).toBeNull()
    expect(view?.machineOrdinal).toBe(1)

    const byOrdinal = await t.query(api.workflow.getWorkflowByStackSlug, {
      slug,
      machineOrdinal: 1,
    })
    expect(byOrdinal?.receivedAt).toBe(view?.receivedAt)
    expect(
      await t.query(api.workflow.getWorkflowByStackSlug, {
        slug,
        machineOrdinal: 9,
      }),
    ).toBeNull()
  })

  test('the owner sees the machine name the public read withholds', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    const view = await t
      .withIdentity(IDENTITY)
      .query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.machine).toBe('laptop')
    expect(view?.isOwner).toBe(true)
  })

  test('the default reading is the machine that synced last, and the rest are listed', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    await publish(t, stackId, { machine: 'vps' })
    // Both landed inside one millisecond here, which no pair of real syncs does.
    await t.run(async (ctx) => {
      const rows = await ctx.db.query('measuredDays').collect()
      for (const row of rows.filter((r) => r.machine === 'vps')) {
        await ctx.db.patch(row._id, { receivedAt: row.receivedAt + 1_000 })
      }
    })

    const view = await t
      .withIdentity(IDENTITY)
      .query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.machine).toBe('vps')
    expect(view?.machines.map((m) => m.machine)).toEqual(['vps', 'laptop'])
    expect(view?.machines.filter((m) => m.isCurrent)).toHaveLength(1)
  })

  test('turning the workflow switch off hides the days already sent', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    await t.run(async (ctx) =>
      ctx.db.patch(stackId, { publishWorkflow: false }),
    )

    expect(
      await t.query(api.workflow.getWorkflowByStackSlug, { slug }),
    ).toBeNull()
    expect(
      await t
        .withIdentity(IDENTITY)
        .query(api.workflow.getWorkflowByStackSlug, { slug }),
    ).toBeNull()
  })

  test('a draft stack publishes no reading', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t, { published: false })
    await publish(t, stackId, { machine: 'laptop' })
    expect(
      await t.query(api.workflow.getWorkflowByStackSlug, { slug }),
    ).toBeNull()
  })

  test('the kit reads skills out of the inventory row', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, {
      machine: 'laptop',
      payload: payload({
        inventory: {
          ...(payload().inventory as Record<string, unknown>),
          skills: [
            { name: 'grilling', callShare: 0.24 },
            { name: 'tdd', callShare: 0.16 },
          ],
        },
      }),
    })

    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    const kit = view?.rows.find((r) => r.rowId === 'component:kit')
    expect(kit?.value).toBeCloseTo(0.6, 10)
    expect(kit?.coverage).toBe(1)
  })
})
