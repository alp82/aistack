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

  test('a legacy false stack still exposes its reading', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t, { published: false })
    await publish(t, stackId, { machine: 'laptop' })
    expect(await t.query(api.workflow.getWorkflowByStackSlug, { slug })).not.toBeNull()
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

describe('the Context reading (#358)', () => {
  type Harness = Day['harnesses'][number]
  type Context = NonNullable<Harness['context']>

  /** One day of half-octave context atoms, buckets ascending. */
  function context(over: Partial<Context> = {}): Context {
    return {
      bucketRuleVersion: 'log-buckets/v2',
      calls: {
        main: [
          { bucket: 32, calls: 6 },
          { bucket: 34, calls: 4 },
        ],
        subagents: [{ bucket: 30, calls: 5 }],
      },
      firstCalls: { main: [{ bucket: 32, sessions: 10 }] },
      firstCallHarnessTokens: 230_000,
      firstCallInstructionsTokens: 220_000,
      firstCallCount: 10,
      maxContext: 180_000,
      compactions: 1,
      ...over,
    }
  }

  const seedModel = (t: Ctx, slug: string, contextWindow: number) =>
    t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: slug,
        slug,
        shortId: `m${Math.random().toString(36).slice(2, 8)}`,
        provider: 'Anthropic',
        category: 'language',
        contextWindow,
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })

  test('a day without the block reads null, and a harness without it is left out', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    const before = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(before?.context).toBeNull()

    const codex: Harness = {
      ...(day().harnesses[0] as Harness),
      harness: 'codex',
      routing: undefined,
      context: context({ window: 258_400 }),
    }
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire(
        [day({ harnesses: [day().harnesses[0] as Harness, codex] })],
        { aggregateVersion: 'workflow-aggregates/v3' },
      ),
    })
    const after = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(after?.context?.harnesses.map((h) => h.harness)).toEqual(['codex'])
  })

  test('folds the window into medians, the first-call split and the chat remainder, and keeps a logged window', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const withContext = (date: string): Day => {
      const base = day({ date })
      const harness = base.harnesses[0] as Harness
      return {
        ...base,
        harnesses: [
          { ...harness, context: context() },
          {
            ...harness,
            harness: 'codex',
            routing: undefined,
            context: context({ window: 258_400, compactions: 0 }),
          },
        ],
      }
    }
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([withContext(daysAgo(2)), withContext(daysAgo(1))], {
        aggregateVersion: 'workflow-aggregates/v3',
      }),
    })

    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    // Twenty main calls: the median falls in bucket 32, p90 in bucket 34.
    const medianCall = Math.round(2 ** ((32 - 0.5) / 2))
    const p90Call = Math.round(2 ** ((34 - 0.5) / 2))
    expect(view?.context?.harnesses.find((h) => h.harness === 'codex')).toEqual({
      harness: 'codex',
      window: 258_400,
      calls: 20,
      medianCall,
      p90Call,
      harnessTokens: 23_000,
      instructionsTokens: 22_000,
      usualChat: medianCall - 45_000,
      longChat: p90Call - 45_000,
      compactions: 0,
    })
    // Claude Code logs no window and the catalog has no row here: the
    // smallest tier that holds its largest call stands in.
    expect(
      view?.context?.harnesses.find((h) => h.harness === 'claude-code'),
    ).toMatchObject({ window: 200_000, compactions: 2 })
  })

  test('Claude Code takes the catalog window of its top model, stepped up when a call outgrows it', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await seedModel(t, 'claude-opus-5', 200_000)
    const withMax = (date: string, maxContext: number): Day => {
      const base = day({ date })
      const harness = base.harnesses[0] as Harness
      return { ...base, harnesses: [{ ...harness, context: context({ maxContext }) }] }
    }
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([withMax(daysAgo(1), 180_000)], {
        aggregateVersion: 'workflow-aggregates/v3',
      }),
    })
    const inside = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(inside?.context?.harnesses[0]?.window).toBe(200_000)

    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([withMax(daysAgo(1), 261_390)], {
        aggregateVersion: 'workflow-aggregates/v3',
      }),
    })
    const over = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(over?.context?.harnesses[0]?.window).toBe(1_000_000)
  })

  test('Grok uses its catalog window without inventing Claude tiers and discloses retained coverage', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const harness: Harness = {
      ...(day().harnesses[0] as Harness),
      harness: 'grok-build',
      routing: { main: [{ model: 'grok-4.6-build', tokens: 100 }], subagents: [] },
      context: context({ firstCallCount: 0, firstCallHarnessTokens: 0, firstCallInstructionsTokens: 0 }),
    }
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([day({ harnesses: [harness] })], { aggregateVersion: 'workflow-aggregates/v3' }),
    })
    const read = () => t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect((await read())?.context?.harnesses[0]).toMatchObject({
      harness: 'grok-build', window: null, retainedCallsOnly: true, breakdownAvailable: false,
    })
    await seedModel(t, 'grok-4.6-build', 256_000)
    expect((await read())?.context?.harnesses[0]?.window).toBe(256_000)
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([day({ harnesses: [{ ...harness, context: context({ maxContext: 300_000 }) }] })], { aggregateVersion: 'workflow-aggregates/v3' }),
    })
    expect((await read())?.context?.harnesses[0]?.window).toBeNull()
    await t.run(async (ctx) => ctx.db.patch(stackId, { publishWorkflow: false }))
    expect(await read()).toBeNull()
  })

  test('compaction-only Grok evidence cannot fabricate a zero-call map', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const harness: Harness = {
      ...(day().harnesses[0] as Harness), harness: 'grok-build',
      context: context({ calls: { main: [], subagents: [] } }),
    }
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([day({ harnesses: [harness] })], { aggregateVersion: 'workflow-aggregates/v3' }),
    })
    expect((await t.query(api.workflow.getWorkflowByStackSlug, { slug }))?.context).toBeNull()
  })

  test('the workflow switch off hides the reading with the rest', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const base = day()
    const harness = base.harnesses[0] as Harness
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: wire([{ ...base, harnesses: [{ ...harness, context: context() }] }], {
        aggregateVersion: 'workflow-aggregates/v3',
      }),
    })
    await t.run(async (ctx) => ctx.db.patch(stackId, { publishWorkflow: false }))
    expect(await t.query(api.workflow.getWorkflowByStackSlug, { slug })).toBeNull()
  })
})

describe('fixed 30-day all-machine web Stats', () => {
  const stats = (t: Ctx, slug: string) => t.query(api.workflow.getStatsByStackSlug, { slug })

  test('combines session atoms with unequal weights and keeps one coherent Git source', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const small = day()
    const large = day()
    const h = large.harnesses[0]
    h.activity[0].events = 360
    h.startHours[0].sessions = 90
    h.routing!.main[0].tokens = 7200
    h.phase!.phaseSec = { scout: 0, build: 9000, verify: 0, handoff: 0, unknown: 0 }
    h.phase!.lengths[0].sessions = 90
    h.phase!.lengths[0].bucket = 6
    // Same cloned Git history on both machines must count once.
    await publish(t, stackId, { machine: 'a', workflow: wire([small]) })
    await publish(t, stackId, { machine: 'b', workflow: wire([large], { utcOffsetMinutes: -300 }) })
    await t.run(async ctx => {
      for (const row of await ctx.db.query('measuredDays').collect()) {
        await ctx.db.patch(row._id, { receivedAt: row.machine === 'b' ? 20 : 10 })
      }
    })
    const view = await stats(t, slug)
    expect(view?.routing?.main).toEqual([{ model: 'claude-opus-5', tokens: 8000 }])
    expect(view?.activity).toEqual([{ weekdayUtc: 1, hourUtc: 21, events: 400 }])
    expect(view?.startHours).toEqual([{ hourUtc: 21, sessions: 100 }])
    expect(view?.utcOffsetMinutes).toBe(-300)
    expect(view?.phaseShare?.build).toBeCloseTo(9180 / 10000)
    expect(view?.medianSession.current).toEqual({ low: 32, high: 64, sessions: 100 })
    expect(view?.git).toMatchObject({ additions: 800, removals: 200, withheldExtensionLines: 100 })
    expect(view?.git?.changedLinesByExtension).toEqual([{ extension: '.ts', changedLines: 900 }])
    expect(view?.git?.days).toHaveLength(1)
    expect(view).not.toHaveProperty('machine')
    expect(view).not.toHaveProperty('thinking')
    expect(view).not.toHaveProperty('section')
    // The older consumer still sees just its selected machine.
    const legacy = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(legacy?.section.harnesses[0].routing?.main[0].tokens).toBe(7200)
  })

  test('median ranges use exact disjoint UTC windows and do not need balanced tracks', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    function at(age: number, bucket: number, sessions: number): Day {
      const d = day({ date: daysAgo(age) })
      d.harnesses[0].phase!.lengths[0] = {
        ...d.harnesses[0].phase!.lengths[0], bucket, sessions,
      }
      return d
    }
    await publish(t, stackId, { machine: 'a', workflow: wire([
      at(0, 5, 16), at(29, 3, 4), at(30, 2, 10), at(59, 2, 10), at(60, 9, 100),
    ]) })
    // Future rows must not enter the current range (insert directly to avoid publish's date gate).
    await t.run(async ctx => {
      const row = (await ctx.db.query('measuredDays').collect())[0]
      const { _id, _creationTime, ...fields } = row
      await ctx.db.insert('measuredDays', { ...fields, date: daysAgo(-1), workflow: at(-1, 10, 100) })
    })
    const view = await stats(t, slug)
    expect(view?.medianSession).toEqual({
      current: { low: 16, high: 32, sessions: 20 },
      previous: { low: 2, high: 4, sessions: 20 },
    })
    expect(view?.phaseTracks).toBeNull()
    expect(view?.window).toEqual({ from: daysAgo(29), to: daysAgo(0), previousFrom: daysAgo(59), previousTo: daysAgo(30) })
  })

  test('absent phase evidence, fewer than 20 sessions, and missing prior periods stay absent', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'a' })
    expect((await stats(t, slug))?.medianSession).toEqual({ current: null, previous: null })
    const noPhase = day()
    delete noPhase.harnesses[0].phase
    await publish(t, stackId, { machine: 'b', workflow: wire([noPhase]) })
    expect((await stats(t, slug))?.medianSession.current).toBeNull()
    // Actual measured sub-minute sessions retain the zero lower bound.
    const zero = day()
    zero.harnesses[0].phase!.lengths[0].sessions = 20
    zero.harnesses[0].phase!.lengths[0].bucket = 0
    await publish(t, stackId, { machine: 'a', workflow: wire([zero]) })
    expect((await stats(t, slug))?.medianSession.current).toEqual({ low: 0, high: 1, sessions: 20 })
  })

  test('inventory combines absolute counts and withheld denominators, retaining incomplete counts', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    async function inventory(machine: string, calls: number, total: number) {
      const p = payload()
      p.inventory.skills = [{ name: 'tdd', calls, callShare: calls / total }]
      p.inventory.mcpServers = [{ name: 'docs', calls, callShare: calls / total }]
      p.inventory.subagents = [{ name: 'review', calls, callShare: calls / total }]
      p.inventory.withheld.skills = 1
      p.inventory.calls = { builtinTools: 0, skills: total, mcpServers: total, subagents: total, slashCommands: 0 }
      await publish(t, stackId, { machine, payload: p })
    }
    await inventory('a', 9, 10)
    await inventory('b', 10, 100)
    let view = await stats(t, slug)
    for (const category of ['skills', 'mcpServers', 'subagents'] as const) {
      expect(view?.inventory[category].totalCalls).toBe(110)
      expect(view?.inventory[category].atoms[0]).toMatchObject({ knownCalls: 19, countsComplete: true, callShare: 19 / 110 })
    }
    expect(view?.inventory.skills.withheldNames).toBe(2)
    // Latest per source replaces the previous inventory instead of adding it again.
    await inventory('b', 20, 200)
    expect((await stats(t, slug))?.inventory.skills.atoms[0].knownCalls).toBe(29)
    const legacy = payload()
    legacy.inventory.skills = [{ name: 'tdd', callShare: 0.5 }, { name: 'legacy', callShare: 0.5 }]
    await publish(t, stackId, { machine: 'old', payload: legacy })
    view = await stats(t, slug)
    expect(view?.inventory.skills.totalCalls).toBeNull()
    expect(view?.inventory.skills.atoms).toEqual([
      { name: 'tdd', knownCalls: 29, countsComplete: false, callShare: null },
      { name: 'legacy', knownCalls: 0, countsComplete: false, callShare: null },
    ])
    expect(JSON.stringify(view)).not.toContain('withheld-secret')
  })

  test('Git selects newest eligible publication with stable ties and ignores empty machines', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const other = day()
    other.git.additions = 77
    other.git.changedLinesByExtension = [{ extension: '.rs', changedLines: 77 }]
    await publish(t, stackId, { machine: 'b', workflow: wire([other]) })
    await publish(t, stackId, { machine: 'a' })
    const empty = day()
    empty.git = { ...empty.git, commits: 0, additions: 0, removals: 0, changedLinesByExtension: [], withheldExtensionLines: 0 }
    await publish(t, stackId, { machine: 'new-empty', workflow: wire([empty]) })
    await t.run(async ctx => {
      for (const row of await ctx.db.query('measuredDays').collect())
        await ctx.db.patch(row._id, { receivedAt: row.machine === 'new-empty' ? 100 : 10 })
    })
    expect((await stats(t, slug))?.git?.additions).toBe(800)
    await t.run(async ctx => {
      for (const row of await ctx.db.query('measuredDays').collect())
        if (row.machine === 'b') await ctx.db.patch(row._id, { receivedAt: 20 })
    })
    expect((await stats(t, slug))?.git).toMatchObject({ additions: 77, changedLinesByExtension: [{ extension: '.rs', changedLines: 77 }] })
    // The newest publication of an eligible machine may itself be a zero-commit day.
    await t.run(async ctx => {
      const row = (await ctx.db.query('measuredDays').collect()).find(row => row.machine === 'a')!
      const { _id, _creationTime, ...fields } = row
      await ctx.db.insert('measuredDays', {
        ...fields, receivedAt: 200, date: daysAgo(0), workflow: { ...empty, date: daysAgo(0) },
      })
    })
    expect((await stats(t, slug))?.git?.additions).toBe(800)

  })

  test('Context shares Discord evidence ordering and weights first-call measurements', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    for (const [machine, calls, bucket, window] of [
      ['z', 1, 36, 200000], ['a', 9, 30, 100000],
    ] as const) {
      const d = day()
      d.harnesses[0].context = {
        bucketRuleVersion: 'log-buckets/v2',
        calls: { main: [{ bucket, calls }], subagents: [] },
        firstCalls: { main: [] },
        firstCallHarnessTokens: calls * (machine === 'z' ? 1000 : 100),
        firstCallInstructionsTokens: calls * 200,
        firstCallCount: calls, maxContext: 100000, compactions: calls, window,
      }
      await publish(t, stackId, { machine, workflow: wire([d], { aggregateVersion: 'workflow-aggregates/v3' }) })
    }
    await t.run(async ctx => {
      for (const row of await ctx.db.query('measuredDays').collect()) await ctx.db.patch(row._id, { receivedAt: 1 })
    })
    const context = (await stats(t, slug))?.context?.harnesses[0]
    expect(context).toMatchObject({ calls: 10, window: 200000, harnessTokens: 190, instructionsTokens: 200, compactions: 10 })
    expect(context?.medianCall).toBeLessThan(40000)
  })

  test('superseded untagged session sources do not inflate tagged readings', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId)
    await publish(t, stackId, { machine: 'tagged' })
    expect((await stats(t, slug))?.routing?.main[0].tokens).toBe(800)
    expect((await stats(t, slug))?.medianSession.current).toBeNull()
  })

  test('consent gates both stored days and window-free inventory for owner and public', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    expect(await stats(t, slug)).toBeNull()
    await publish(t, stackId, { machine: 'private-machine' })
    await t.run(async ctx => {
      for (const row of await ctx.db.query('measuredDays').collect()) await ctx.db.delete(row._id)
    })
    const sparse = await stats(t, slug)
    expect(sparse?.git).toBeNull()
    expect(sparse?.context).toBeNull()
    expect(sparse?.phaseShare).toBeNull()
    expect(sparse?.routing).toBeNull()
    expect(sparse?.utcOffsetMinutes).toBeNull()
    await t.run(async ctx => ctx.db.patch(stackId, { publishWorkflow: false }))
    expect(await stats(t, slug)).toBeNull()
    expect(await t.withIdentity(IDENTITY).query(api.workflow.getStatsByStackSlug, { slug })).toBeNull()
    expect(await stats(t, 'missing')).toBeNull()
  })
})

describe('owner-only token efficiency (workflow-aggregates/v4, v5)', () => {
  const OTHER = { tokenIdentifier: 'convex|user_other', subject: 'user_other' }
  const efficiency = (t: Ctx, slug: string, identity?: typeof IDENTITY) =>
    (identity ? t.withIdentity(identity) : t).query(api.workflow.getEfficiencyByStackSlug, { slug })
  const efficientDay = () => {
    const d = day()
    d.harnesses[0].efficiency = {
      countBucketRuleVersion: 'log-buckets/v1',
      sizeBucketRuleVersion: 'log-buckets/v2',
      callGaps: [
        { bucket: 5, calls: 60 },
        { bucket: 11, calls: 30 },
      ],
      callsAfterGap: 30,
      cacheWriteAfterGap: 3_000_000,
      inputAfterGap: 3_000,
      orphanCacheWrites: 0,
      orphanCacheWriteTokens: 0,
      sessionMaxContext: [{ bucket: 32, sessions: 10 }],
      sessionCalls: [{ bucket: 4, sessions: 10 }],
      shortSessions: 0,
      shortSessionFirstCallTokens: 0,
      sessionsCompacted: 0,
      toolResults: [
        { tool: 'Read', results: 40, bytes: 4_000_000, buckets: [{ bucket: 34, results: 40 }] },
      ],
      blocks: { thinking: 10, text: 20 },
    }
    return d
  }

  test('answers the owner with one ranked tile per lever and nobody else', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'a', workflow: wire([efficientDay()]) })
    await publish(t, stackId, { machine: 'b', workflow: wire([efficientDay()]) })
    expect(await efficiency(t, slug)).toBeNull()
    expect(await efficiency(t, slug, OTHER)).toBeNull()
    const view = await efficiency(t, slug, IDENTITY)
    expect(view?.rulesVersion).toBe('efficiency-rules/v1')
    const levers = view?.tiles.map((tile) => tile.lever) ?? []
    expect(new Set(levers).size).toBe(levers.length)
    expect(levers).toContain('cache')
    expect(levers).toContain('tools')
    // Two machines combine: 60 calls after a break over 180 main calls.
    const cache = view?.tiles.find((tile) => tile.lever === 'cache')
    expect(cache?.figure).toEqual({ value: '60', label: 'calls after a break' })
    expect(cache?.severity).toBe('high')
    expect(cache?.harness).toBe('claude-code')
    const tools = view?.tiles.find((tile) => tile.lever === 'tools')
    expect(tools?.fix).toBe('Read with offset and limit')
    expect(JSON.stringify(view)).not.toContain('machine')
  })

  test('prices a bound only under publishCost and cites the table', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    // Two machines clear the cache rule's 200-call evidence floor.
    await publish(t, stackId, { machine: 'a', workflow: wire([efficientDay()]) })
    await publish(t, stackId, { machine: 'b', workflow: wire([efficientDay()]) })
    const priced = await efficiency(t, slug, IDENTITY)
    const cache = priced?.tiles.find((tile) => tile.lever === 'cache')
    expect(cache?.usd).toBeGreaterThan(0)
    expect(cache?.usdNote).toContain('claude-opus-5')
    expect(priced?.recoverableUsd).toBeGreaterThan(0)
    expect(priced?.pricingTables.length).toBe(1)
    await t.run(async (ctx) => ctx.db.patch(stackId, { publishCost: false }))
    const unpriced = await efficiency(t, slug, IDENTITY)
    expect(unpriced?.tiles.find((tile) => tile.lever === 'cache')?.usd).toBeNull()
    expect(unpriced?.recoverableUsd).toBeNull()
    expect(unpriced?.pricingTables).toEqual([])
  })

  test('the account read folds the signed-in creator\'s stacks and answers nobody else', async () => {
    const t = convexTest(schema, modules)
    const mine = (identity?: typeof IDENTITY) =>
      (identity ? t.withIdentity(identity) : t).query(api.workflow.getMyEfficiency, {})
    expect(await mine(IDENTITY)).toBeNull()
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { workflow: wire([efficientDay()]) })
    expect(await mine()).toBeNull()
    expect(await mine(OTHER)).toBeNull()
    const view = await mine(IDENTITY)
    expect(view?.tiles.find((tile) => tile.lever === 'cache')?.figure.value).toBe('30')
    // A passing rule never prints a dollar bound.
    for (const tile of view?.tiles ?? []) {
      if (tile.severity === 'ok') expect(tile.usd).toBeNull()
    }
    await t.run(async (ctx) => ctx.db.patch(stackId, { publishCost: false }))
    expect((await mine(IDENTITY))?.recoverableUsd).toBeNull()
    await t.run(async (ctx) => ctx.db.patch(stackId, { publishWorkflow: false }))
    expect(await mine(IDENTITY)).toBeNull()
  })

  test('consent and an old wire both read as nothing', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    // A v3 day carries no efficiency block: no tiles.
    await publish(t, stackId, { workflow: wire([day()]) })
    expect(await efficiency(t, slug, IDENTITY)).toBeNull()
    await publish(t, stackId, { workflow: wire([efficientDay()]) })
    expect(await efficiency(t, slug, IDENTITY)).not.toBeNull()
    await t.run(async (ctx) => ctx.db.patch(stackId, { publishWorkflow: false }))
    expect(await efficiency(t, slug, IDENTITY)).toBeNull()
  })

  test('stores the v5 atoms and reads them into the rules', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const v5Day = () => {
      const d = efficientDay()
      const eff = d.harnesses[0].efficiency
      if (!eff) throw new Error('no efficiency block')
      Object.assign(eff, {
        orphanCacheWrites: 30,
        orphanCacheWriteTokens: 3_000_000,
        // Every orphan came after the cache expired: no warm switch.
        warmOrphanCacheWrites: 0,
        warmOrphanCacheWriteTokens: 0,
        gapBands: {
          short: { calls: 30, cacheWrite: 3_000_000, cacheRead: 0, input: 3_000 },
          long: { calls: 0, cacheWrite: 0, cacheRead: 0, input: 0 },
        },
        headlessSessions: 2,
        coldCompactions: 0,
        effortRaw: [{ level: 'xhigh', responses: 90, outputTokens: 100_000 }],
      })
      eff.toolResults = [
        { tool: 'read', results: 40, bytes: 4_000_000, buckets: [{ bucket: 34, results: 40 }] },
      ]
      return d
    }
    await publish(t, stackId, { machine: 'a', workflow: wire([v5Day()]) })
    await publish(t, stackId, { machine: 'b', workflow: wire([v5Day()]) })
    const view = await efficiency(t, slug, IDENTITY)
    expect(view?.tiles.find((tile) => tile.lever === 'switches')?.figure.value).toBe('0')
    expect(view?.tiles.find((tile) => tile.lever === 'tools')?.fix).toBe(
      'Read with offset and limit'
    )
    const sessions = view?.tiles.find((tile) => tile.lever === 'sessions')
    expect(sessions?.evidence).toContainEqual({ label: 'scripted sessions left out', value: '4' })
  })

  test('refuses an efficiency block with more raw effort rows than levels', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const d = efficientDay()
    const eff = d.harnesses[0].efficiency
    if (!eff) throw new Error('no efficiency block')
    eff.effortRaw = Array.from({ length: 7 }, () => ({
      level: 'high' as const,
      responses: 1,
      outputTokens: 1,
    }))
    await expect(publish(t, stackId, { workflow: wire([d]) })).rejects.toThrow(/effortRaw/)
  })
})
