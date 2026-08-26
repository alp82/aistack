/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

const USER = 'user_owner'
const IDENTITY = { tokenIdentifier: `convex|${USER}`, subject: USER }
const STRANGER = {
  tokenIdentifier: 'convex|user_stranger',
  subject: 'user_stranger',
}

type Ctx = Awaited<ReturnType<typeof convexTest>>
type StoredPayload = Doc<'measuredSnapshots'>['payload']
type Section = Doc<'measuredWorkflows'>['section']

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

function sessionRow(over: Record<string, unknown> = {}) {
  return {
    startHourUtc: 21,
    eventCount: 40,
    phaseSec: { ...PHASE_TOTALS },
    phaseEvents: { scout: 30, build: 10, verify: 2, handoff: 1, unknown: 1 },
    waitingSec: 20,
    idleSec: 5,
    merged: false,
    verifyRuns: 1,
    reviewRounds: 1,
    openedWithScout: true,
    ...over,
  }
}

/** A section shaped exactly like the wire's, with one measured pool metric. */
function section(over: Partial<Section> = {}): Section {
  return {
    aggregateVersion: 'workflow-aggregates/v1',
    utcOffsetMinutes: 120,
    harnesses: [
      {
        harness: 'claude-code',
        phase: {
          ruleVersion: 'phase-rules/v1',
          publishable: true,
          sessions: 2,
          phaseSec: { ...PHASE_TOTALS },
          phaseEvents: {
            scout: 60,
            build: 20,
            verify: 6,
            handoff: 5,
            unknown: 7,
          },
          waitingSec: 30,
          idleSec: 10,
          unknownShare: 0.07,
          sessionRows: [sessionRow(), sessionRow()],
        },
        activity: [{ weekdayUtc: 1, hourUtc: 21, events: 40 }],
      },
    ],
    git: {
      testFileRuleVersion: 'test-file-rules/v1',
      fileTypeRuleVersion: 'file-type-rules/v1',
      totalCommits: 20,
      lateNightCommits: 9,
      additions: 800,
      removals: 200,
      changedLinesPerCommit: [50, 50],
      testFileCommits: 4,
      changedLinesByExtension: [{ extension: '.ts', changedLines: 900 }],
      withheldExtensionLines: 100,
      weekdayHourCells: [{ weekdayUtc: 1, hourUtc: 23, commits: 9 }],
    },
    metrics: [
      {
        metricId: 'late-night-commits',
        ruleVersion: 'metric-rules/v1',
        value: 0.45,
        band: { low: 0, high: 0.15 },
        coverage: 1,
      },
    ],
    ...over,
  } as Section
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
  opts: {
    machine?: string
    workflow?: Section
    payload?: StoredPayload
  } = {},
) {
  await t.mutation(internal.measured.publishSnapshot, {
    stackId,
    payload: opts.payload ?? payload(),
    ...(opts.machine === undefined ? {} : { machine: opts.machine }),
    workflow: opts.workflow ?? section(),
  })
}

describe('storing a workflow section', () => {
  test('a publish stores one reading against the machine that sent it', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    const rows = await t.run(async (ctx) =>
      ctx.db.query('measuredWorkflows').collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      machine: 'laptop',
      section: expect.objectContaining({
        aggregateVersion: 'workflow-aggregates/v1',
      }),
    })
  })

  test('a second sync replaces the reading rather than appending one', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    await publish(t, stackId, {
      machine: 'laptop',
      workflow: section({
        metrics: [
          {
            metricId: 'late-night-commits',
            ruleVersion: 'metric-rules/v1',
            value: 0.6,
            band: { low: 0, high: 0.15 },
            coverage: 1,
          },
        ],
      }),
    })

    const rows = await t.run(async (ctx) =>
      ctx.db.query('measuredWorkflows').collect(),
    )
    expect(rows).toHaveLength(1)
    // The replaced reading survives only as the values the movement tie-break
    // compares against.
    expect(rows[0]?.previousRowValues).toContainEqual({
      rowId: 'metric:late-night-commits',
      value: 0.45,
      coverage: 1,
    })
    expect(rows[0]?.rowValues).toContainEqual({
      rowId: 'metric:late-night-commits',
      value: 0.6,
      coverage: 1,
    })
  })

  test('two machines keep two readings, because a reading is one machine’s', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    await publish(t, stackId, { machine: 'vps' })

    const rows = await t.run(async (ctx) =>
      ctx.db.query('measuredWorkflows').collect(),
    )
    expect(rows.map((row) => row.machine).sort()).toEqual(['laptop', 'vps'])
  })

  test('the podium is computed at the sync and stored', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    const row = await t.run(async (ctx) =>
      ctx.db.query('measuredWorkflows').first(),
    )
    expect(row?.highlightRowIds).toHaveLength(3)
    // Nothing has been displaced yet, so no swap has been spent.
    expect(row?.lastSwapDayUtc).toBeUndefined()
  })

  test('a section too large to store drops its heaviest detail instead of failing the sync', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const heavy = section()
    const harness = heavy.harnesses[0]
    if (harness?.phase) {
      harness.phase.sessionRows = Array.from({ length: 4_000 }, () =>
        sessionRow(),
      )
    }

    await publish(t, stackId, { machine: 'laptop', workflow: heavy })

    const row = await t.run(async (ctx) =>
      ctx.db.query('measuredWorkflows').first(),
    )
    expect(row?.trimmed).toEqual({ commitStrip: true, sessionRows: true })
    expect(row?.section.harnesses[0]?.phase?.sessionRows).toEqual([])
    // The harness-level totals are what the trim protects.
    expect(row?.section.harnesses[0]?.phase?.phaseSec.scout).toBe(640)
  })

  test('a malformed section refuses the publish, and nothing lands', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      publish(t, stackId, {
        machine: 'laptop',
        workflow: section({ aggregateVersion: '' }),
      }),
    ).rejects.toThrow(/aggregateVersion/)
    expect(
      await t.run(async (ctx) => ctx.db.query('measuredSnapshots').collect()),
    ).toHaveLength(0)
  })
})

describe('reading the section', () => {
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

  test('the reading ranks sixteen rows into the podium, the rest, and the fold', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.rows.filter((r) => r.placement === 'highlight')).toHaveLength(3)
    // Fit falls monotonically down the row order.
    const fits = view?.rows.map((r) => r.fit) ?? []
    expect([...fits].sort((a, b) => b - a)).toEqual(fits)
    // The one measured pool metric is on the podium: 0.45 against a 0 to 0.15
    // band is far outside it, at full coverage.
    const nightly = view?.rows.find(
      (r) => r.rowId === 'metric:late-night-commits',
    )
    expect(nightly?.surprise).toBeCloseTo(0.3 / 0.45, 10)
    expect(nightly?.fit).toBeCloseTo(0.3 / 0.45, 10)
    expect(nightly?.movement).toBeNull()
  })

  test('the lead facts count every synced session, gate-held harnesses included', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.lead).toMatchObject({
      sessionCount: 142,
      harnessCount: 1,
      playbookHarnessCount: 1,
      // 21:00 UTC on a machine two hours east.
      modalStartHourOwnerLocal: 23,
      ruleVersion: 'phase-rules/v1',
    })
    expect(view?.lead.phaseShare?.scout).toBeCloseTo(0.64, 10)
    expect(view?.mixedRuleVersions).toBe(false)
  })

  test('a reading classified by two rule sets is tagged as mixed', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    const twoVersions = section()
    const first = twoVersions.harnesses[0]
    twoVersions.harnesses = [
      first,
      {
        ...first,
        harness: 'codex',
        phase: { ...first?.phase, ruleVersion: 'phase-rules/v2' },
      },
    ] as Section['harnesses']

    await publish(t, stackId, { machine: 'laptop', workflow: twoVersions })
    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.mixedRuleVersions).toBe(true)
    expect(view?.phaseRuleVersions).toEqual([
      'phase-rules/v1',
      'phase-rules/v2',
    ])
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
      const vps = (await ctx.db.query('measuredWorkflows').collect()).find(
        (row) => row.machine === 'vps',
      )
      if (vps) await ctx.db.patch(vps._id, { receivedAt: vps.receivedAt + 1_000 })
    })

    const view = await t
      .withIdentity(IDENTITY)
      .query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.machine).toBe('vps')
    expect(view?.machines.map((m) => m.machine)).toEqual(['vps', 'laptop'])
    expect(view?.machines.filter((m) => m.isCurrent)).toHaveLength(1)
  })

  test('turning the workflow switch off hides the reading already sent', async () => {
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

  test('the kit reads skills out of the payload inventory', async () => {
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

describe('the owner controls', () => {
  test('a pin puts a low-fit row on the podium', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    const before = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    const folded = before?.rows.find((r) => r.placement !== 'highlight')
    expect(folded).toBeDefined()

    await t.withIdentity(IDENTITY).mutation(api.workflow.setWorkflowRowOverride, {
      stackId,
      rowId: folded?.rowId as string,
      state: 'pinned',
    })

    const after = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    const pinned = after?.rows.find((r) => r.rowId === folded?.rowId)
    expect(pinned?.placement).toBe('highlight')
    expect(pinned?.pinned).toBe(true)
    expect(after?.rows.filter((r) => r.placement === 'highlight')).toHaveLength(
      3,
    )
  })

  test('a hidden row leaves the public page and stays in the owner’s own view', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    await t.withIdentity(IDENTITY).mutation(api.workflow.setWorkflowRowOverride, {
      stackId,
      rowId: 'component:git-ledger',
      state: 'hidden',
    })

    const publicView = await t.query(api.workflow.getWorkflowByStackSlug, {
      slug,
    })
    expect(
      publicView?.rows.some((r) => r.rowId === 'component:git-ledger'),
    ).toBe(false)

    const ownerView = await t
      .withIdentity(IDENTITY)
      .query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(
      ownerView?.rows.find((r) => r.rowId === 'component:git-ledger')?.hidden,
    ).toBe(true)
  })

  test('clearing an override puts the row back', async () => {
    const t = convexTest(schema, modules)
    const { stackId, slug } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    const as = t.withIdentity(IDENTITY)

    await as.mutation(api.workflow.setWorkflowRowOverride, {
      stackId,
      rowId: 'component:git-ledger',
      state: 'hidden',
    })
    const cleared = await as.mutation(api.workflow.setWorkflowRowOverride, {
      stackId,
      rowId: 'component:git-ledger',
      state: null,
    })
    expect(cleared).toEqual({ pinned: [], hidden: [] })

    const view = await t.query(api.workflow.getWorkflowByStackSlug, { slug })
    expect(view?.rows.some((r) => r.rowId === 'component:git-ledger')).toBe(true)
  })

  test('a fourth pin is refused, because there is no fourth slot to promise', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })
    const as = t.withIdentity(IDENTITY)

    for (const rowId of [
      'component:git-ledger',
      'component:delegation',
      'component:kit',
    ]) {
      await as.mutation(api.workflow.setWorkflowRowOverride, {
        stackId,
        rowId,
        state: 'pinned',
      })
    }
    await expect(
      as.mutation(api.workflow.setWorkflowRowOverride, {
        stackId,
        rowId: 'component:phase-playbook',
        state: 'pinned',
      }),
    ).rejects.toThrow(/podium holds 3 rows/)
  })

  test('a row id no rule pool declares is refused', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    await expect(
      t.withIdentity(IDENTITY).mutation(api.workflow.setWorkflowRowOverride, {
        stackId,
        rowId: 'metric:whatever-i-like',
        state: 'hidden',
      }),
    ).rejects.toThrow(/Unknown workflow row/)
  })

  test('a stranger cannot pin or hide anything', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    await expect(
      t.withIdentity(STRANGER).mutation(api.workflow.setWorkflowRowOverride, {
        stackId,
        rowId: 'component:git-ledger',
        state: 'hidden',
      }),
    ).rejects.toThrow(/Not authorized/)
    await expect(
      t.mutation(api.workflow.setWorkflowRowOverride, {
        stackId,
        rowId: 'component:git-ledger',
        state: 'hidden',
      }),
    ).rejects.toThrow(/Not authenticated/)
  })

  test('a hidden incumbent leaves the podium at the next sync too', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await publish(t, stackId, { machine: 'laptop' })

    const before = await t.run(async (ctx) =>
      ctx.db.query('measuredWorkflows').first(),
    )
    const incumbent = before?.highlightRowIds[0] as string
    await t.withIdentity(IDENTITY).mutation(api.workflow.setWorkflowRowOverride, {
      stackId,
      rowId: incumbent,
      state: 'hidden',
    })
    await publish(t, stackId, { machine: 'laptop' })

    const after = await t.run(async (ctx) =>
      ctx.db.query('measuredWorkflows').first(),
    )
    expect(after?.highlightRowIds).not.toContain(incumbent)
    expect(after?.highlightRowIds).toHaveLength(3)
  })
})
