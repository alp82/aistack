/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import type { Infer } from 'convex/values'
import schema, { MeasuredPayload } from './schema'
import { sha256Hex } from './httpCli'

const modules = import.meta.glob('./**/*.{js,ts}')

const USER = 'user_owner'
const OTHER_USER = 'user_stranger'
const IDENTITY = { tokenIdentifier: `convex|${USER}`, subject: USER }
const OTHER_IDENTITY = {
  tokenIdentifier: `convex|${OTHER_USER}`,
  subject: OTHER_USER,
}

const DAY = 24 * 60 * 60 * 1000

const EMPTY_OPT_INS = {
  builtinTools: [],
  machines: [],
  mcpServers: [],
  skills: [],
  subagents: [],
  slashCommands: [],
}

/** A minimal but complete #33 payload. Overrides merge at the top level. */
type StoredPayload = Infer<typeof MeasuredPayload>
type PayloadV1 = Extract<StoredPayload, { schemaVersion: 1 }>
type PayloadV2 = Extract<StoredPayload, { schemaVersion: 2 }>

function payload(over: Record<string, unknown> = {}): PayloadV1 {
  return {
    schemaVersion: 1,
    capturedAt: Date.now(),
    window: { days: 30, from: '2026-06-26', to: '2026-07-25' },
    harness: { name: 'claude-code', version: '2.1.220' },
    pricingTable: 'anthropic-list-2026-07-25',
    activity: {
      sessions: 12,
      activeDays: 9,
      projects: 3,
      totalTokens: 1_000_000,
      cacheHitShare: 0.9,
      subagentShare: 0.3,
    },
    models: [
      {
        id: 'claude-opus-5',
        tokenShare: 1,
        tokens: { input: 10, output: 20, cacheWrite: 30, cacheRead: 40 },
        apiEquivalentUSD: 12.34,
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
        mcpServers: 2,
        skills: 3,
        subagents: 0,
        slashCommands: 1,
      },
    },
    coverage: {
      filesScanned: 100,
      filesUnreadable: 0,
      linesParsed: 9_999,
      linesFailed: 1,
    },
    excludedTokens: { unpriced: 0, synthetic: 5 },
    ...over,
  } as PayloadV1
}

/** A minimal v2 payload whose mergeable activity metrics carry sets. */
function payloadV2(over: Record<string, unknown> = {}): PayloadV2 {
  return payload({
    schemaVersion: 2,
    activity: {
      sessions: 12,
      activeDayDates: [
        '2026-07-20',
        '2026-07-21',
        '2026-07-22',
      ],
      projectKeys: [
        'AAAAAAAAAAAAAAAAAAAAAA',
        'BBBBBBBBBBBBBBBBBBBBBB',
      ],
      totalTokens: 1_000_000,
      cacheHitShare: 0.9,
      subagentShare: 0.3,
    },
    ...over,
  }) as unknown as PayloadV2
}

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedStack(
  t: Ctx,
  opts: {
    userId?: string
    published?: boolean
    name?: string
    publishCost?: boolean
  } = {},
) {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: `owner-${opts.userId ?? USER}-${Math.random().toString(36).slice(2, 8)}`,
      userId: opts.userId ?? USER,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    const stackId = await ctx.db.insert('stacks', {
      name: opts.name ?? 'My Stack',
      slug: 'my-stack',
      shortId: `sid${Math.random().toString(36).slice(2, 8)}`,
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: opts.published ?? true,
      ...(opts.publishCost === undefined
        ? {}
        : { publishCost: opts.publishCost }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    const stack = await ctx.db.get(stackId)
    return { creatorId, stackId, shortId: stack!.shortId }
  })
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

describe('publishSnapshot', () => {
  test('accepts a v2 payload with sorted activity sets', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payloadV2(),
      }),
    ).resolves.toMatchObject({ receivedAt: expect.any(Number) })
  })

  test.each([
    {
      name: 'an active day outside the payload window',
      activity: {
        ...payloadV2().activity,
        activeDayDates: ['2026-06-25'],
      },
    },
    {
      name: 'duplicate active days',
      activity: {
        ...payloadV2().activity,
        activeDayDates: ['2026-07-20', '2026-07-20'],
      },
    },
    {
      name: 'unsorted active days',
      activity: {
        ...payloadV2().activity,
        activeDayDates: ['2026-07-21', '2026-07-20'],
      },
    },
    {
      name: 'an invalid calendar date',
      activity: {
        ...payloadV2().activity,
        activeDayDates: ['2026-06-31'],
      },
    },
    {
      name: 'unsorted project workspace identifiers',
      activity: {
        ...payloadV2().activity,
        projectKeys: ['BBBBBBBBBBBBBBBBBBBBBB', 'AAAAAAAAAAAAAAAAAAAAAA'],
      },
    },
    {
      name: 'a malformed project workspace identifier',
      activity: {
        ...payloadV2().activity,
        projectKeys: ['short'],
      },
    },
    {
      name: 'duplicate project workspace identifiers',
      activity: {
        ...payloadV2().activity,
        projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA', 'AAAAAAAAAAAAAAAAAAAAAA'],
      },
    },
    {
      name: 'more than 1,000 project workspace identifiers',
      activity: {
        ...payloadV2().activity,
        projectKeys: Array.from(
          { length: 1_001 },
          (_, index) => `AAAAAAAAAAAAAAAAAA${index.toString().padStart(4, '0')}`,
        ),
      },
    },
  ])('rejects $name in a v2 set', async ({ activity }) => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payloadV2({ activity }),
      }),
    ).rejects.toThrow()
  })

  test('rejects a v2 shape under schema version 1', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payloadV2({ schemaVersion: 1 }),
      }),
    ).rejects.toThrow()
  })

  test.each([
    { days: 30, from: '2026-06-31', to: '2026-07-30' },
    { days: 30, from: '2026-06-26', to: '2026-07-32' },
  ])('rejects a noncanonical v2 window endpoint: $from to $to', async (window) => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payloadV2({ window }),
      }),
    ).rejects.toThrow(/window/)
  })

  test.each([
    { days: 31, from: '2026-06-26', to: '2026-07-25' },
    { days: 30, from: '2026-07-25', to: '2026-06-26' },
  ])('rejects inconsistent v2 window bounds: $from to $to over $days days', async (window) => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payloadV2({ window }),
      }),
    ).rejects.toThrow(/window/)
  })

  test('writes the inventory row and stamps a server receivedAt', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    const clientClock = Date.now() - 5 * 60_000
    const result = await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: clientClock }),
    })

    expect(result.receivedAt).toBeGreaterThan(clientClock)
    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows).toHaveLength(1)
    // capturedAt is NOT clamped to the server clock - the divergence is signal.
    expect(rows[0].capturedAt).toBe(clientClock)
    expect(rows[0].receivedAt).toBe(result.receivedAt)
  })

  test('a second sync of the same source REPLACES its inventory row (ADR-0011)', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: 1000 }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: 2000 }),
    })

    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows).toHaveLength(1)
    expect(rows[0].capturedAt).toBe(2000)
  })

  test('rejects an unsupported schemaVersion instead of storing it', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ schemaVersion: 99 }),
      }),
    ).rejects.toThrow(/Expected one of/)
  })

  test('rejects a payload carrying a field the closed validator does not name', async () => {
    // The closed validator is the privacy claim: "we accept exactly these
    // fields". A free-form blob would forfeit it.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ promptText: 'a leaked prompt' }) as never,
      }),
    ).rejects.toThrow()
  })

  test('rejects a payload missing a required block', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const p = payload() as Record<string, unknown>
    delete p.coverage
    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: p as never,
      }),
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// What a client-supplied string may be (#45)
// ---------------------------------------------------------------------------

describe('publishSnapshot - string bounds on the payload', () => {
  const BIDI_OVERRIDE = String.fromCodePoint(0x202e)
  const NUL = String.fromCodePoint(0x00)

  /** An inventory block carrying one atom in `category` and nothing else. */
  function inventoryWith(
    category:
      | 'builtinTools'
      | 'mcpServers'
      | 'skills'
      | 'subagents'
      | 'slashCommands',
    name: string,
  ) {
    const base = payload().inventory as Record<string, unknown>
    for (const key of [
      'builtinTools',
      'mcpServers',
      'skills',
      'subagents',
      'slashCommands',
    ]) {
      base[key] = []
    }
    base[category] = [{ name, callShare: 0.5 }]
    return base
  }

  const publish = (t: Ctx, stackId: Id<'stacks'>, over: Record<string, unknown>) =>
    t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload(over) as never,
    })

  const CATEGORIES = [
    'builtinTools',
    'mcpServers',
    'skills',
    'subagents',
    'slashCommands',
  ] as const

  test('every one of the five inventory categories is bounded, not just the first', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    for (const category of CATEGORIES) {
      await expect(
        publish(t, stackId, { inventory: inventoryWith(category, 'z'.repeat(65)) }),
      ).rejects.toThrow(new RegExp(`inventory\\.${category}\\[0\\]\\.name`))
    }
  })

  test('refuses a name that cannot be rendered safely', async () => {
    // A bidi override reorders the rest of the line, including the share printed
    // beside the name (CVE-2021-42574). It survives JSON.stringify.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    for (const bad of [`safe${BIDI_OVERRIDE}name`, `bell${NUL}`, '', '   ']) {
      await expect(
        publish(t, stackId, { inventory: inventoryWith('skills', bad) }),
      ).rejects.toThrow(/control or bidi/)
    }
  })

  test('rejects the snapshot instead of truncating the name', async () => {
    // Rewriting the name server-side would publish a string the owner never saw
    // at the approve gate, and a snapshot is immutable.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      publish(t, stackId, { inventory: inventoryWith('skills', 'z'.repeat(400)) }),
    ).rejects.toThrow()
    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows).toHaveLength(0)
  })

  test('is a bound on the string, NOT a second allowlist check', async () => {
    // #42 decision 1 exists so a user can publish a name the server has never
    // heard of. Accents, CJK and parentheses are all names people run, and the
    // curated charset would refuse every one of them.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    for (const name of ['(default)', 'dépendances', 'コード', 'alp-river:crossfire']) {
      await expect(
        publish(t, stackId, { inventory: inventoryWith('skills', name) }),
      ).resolves.toBeDefined()
    }
  })

  test('holds model ids to the vendor charset, and still exempts unknown ids', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const model = (id: string) => [
      {
        id,
        tokenShare: 1,
        tokens: { input: 1, output: 1, cacheWrite: 0, cacheRead: 0 },
      },
    ]

    for (const bad of ['', 'model id with spaces', `x${BIDI_OVERRIDE}`, 'x'.repeat(65)]) {
      await expect(publish(t, stackId, { models: model(bad) })).rejects.toThrow(
        /models\[0\]\.id/,
      )
    }
    // Exempt from the allowlist (#33 decision 3) is untouched: a model the
    // catalog has never seen still publishes, so its tokens cannot vanish.
    await expect(
      publish(t, stackId, { models: model('vendor-model-9.9:preview_2') }),
    ).resolves.toBeDefined()
  })

  test('bounds the other rendered strings, not only the names', async () => {
    // harness.name and pricingTable land on the same public page from the same
    // untrusted payload.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      publish(t, stackId, { harness: { name: 'z'.repeat(65), version: null } }),
    ).rejects.toThrow(/harness\.name/)
    await expect(
      publish(t, stackId, {
        harness: { name: 'claude-code', version: `2.1${BIDI_OVERRIDE}` },
      }),
    ).rejects.toThrow(/harness\.version/)
    await expect(
      publish(t, stackId, { pricingTable: 'z'.repeat(65) }),
    ).rejects.toThrow(/pricingTable/)
    // Both are legitimately absent, and absent is not a violation.
    await expect(
      publish(t, stackId, {
        harness: { name: 'claude-code', version: null },
        pricingTable: null,
      }),
    ).resolves.toBeDefined()
  })

  test('accepts and bounds a per-model pricingTable (#136)', async () => {
    // A mixed-vendor payload cites the table on the model, not on the payload.
    // The string renders on the same public page as the rest, so it clears the
    // same bar.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const model = (pricingTable: string) => [
      {
        id: 'openai:gpt-5.4',
        tokenShare: 1,
        tokens: { input: 1, output: 1, cacheWrite: 0, cacheRead: 0 },
        apiEquivalentUSD: 2.5,
        pricingTable,
      },
    ]

    await expect(
      publish(t, stackId, {
        pricingTable: null,
        models: model('openai-list-2026-08-02'),
      }),
    ).resolves.toBeDefined()
    await expect(
      publish(t, stackId, { models: model('z'.repeat(65)) }),
    ).rejects.toThrow(/models\[0\]\.pricingTable/)
    await expect(
      publish(t, stackId, { models: model(`x${BIDI_OVERRIDE}`) }),
    ).rejects.toThrow(/models\[0\]\.pricingTable/)
  })

  test('window bounds are dates, so the rendered window cannot be arbitrary text', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    await expect(
      publish(t, stackId, { window: { days: 30, from: 'yesterday', to: '2026-07-25' } }),
    ).rejects.toThrow(/window\.from/)
    await expect(
      publish(t, stackId, {
        window: { days: 30, from: '2026-06-26', to: '2026-07-25T00:00:00Z' },
      }),
    ).rejects.toThrow(/window\.to/)
  })

  test('the bound sits on the shared insert path, so the token route enforces it too', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = `tok_${Math.random().toString(36).slice(2)}`
    await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: await sha256Hex(token),
        scopes: ['collect', 'sync'],
        userId: USER,
        stackId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
        lastUsedAt: Date.now(),
      }),
    )

    const resp = await t.fetch('/api/cli/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        payload: payload({ inventory: inventoryWith('mcpServers', 'z'.repeat(200)) }),
      }),
    })
    // A broken client, so 400 with the reason - not an opaque 500.
    expect(resp.status).toBe(400)
    expect(JSON.stringify(await resp.json())).toMatch(/inventory\.mcpServers/)
    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows).toHaveLength(0)
  })
})

describe('publishForToken - the destination comes from the token', () => {
  async function seedToken(
    t: Ctx,
    opts: { stackId?: Id<'stacks'>; userId?: string } = {},
  ) {
    return await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: await sha256Hex(`tok_${Math.random().toString(36).slice(2)}`),
        scopes: ['collect', 'sync'],
        userId: opts.userId ?? USER,
        stackId: opts.stackId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
        lastUsedAt: Date.now(),
      }),
    )
  }

  test('publishes to the stack bound to the token', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    const result = await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payload: payload(),
    })
    expect(result.stackSlug).toBe(`my-stack-${shortId}`)

    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows[0].stackId).toBe(stackId)
  })

  test('refuses an unlinked token with an actionable message', async () => {
    const t = convexTest(schema, modules)
    await seedStack(t)
    const tokenId = await seedToken(t) // no stackId

    await expect(
      t.mutation(internal.measured.publishForToken, { tokenId, payload: payload() }),
    ).rejects.toThrow(/not linked to a stack/i)
  })

  test('refuses when the token owner no longer owns the linked stack', async () => {
    // A stack can change hands between link time and send time, and an immutable
    // snapshot written to the wrong stack cannot be taken back.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId, userId: OTHER_USER })

    await expect(
      t.mutation(internal.measured.publishForToken, { tokenId, payload: payload() }),
    ).rejects.toThrow(/no longer authorized/i)
  })

  test('refuses when the linked stack has been deleted', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })
    await t.run((ctx) => ctx.db.delete(stackId))

    await expect(
      t.mutation(internal.measured.publishForToken, { tokenId, payload: payload() }),
    ).rejects.toThrow(/no longer exists/i)
  })

  // -------------------------------------------------------------------------
  // The #213 wire: the workflow section and the publishing CLI's version
  // -------------------------------------------------------------------------

  const phaseTotals = () => ({
    scout: 640,
    build: 180,
    verify: 60,
    handoff: 50,
    unknown: 70,
  })

  const workflowDay = () => ({
      date: '2026-08-21',
      harnesses: [
        {
          harness: 'claude-code',
          sessions: 142,
          startHours: [{ hourUtc: 23, sessions: 142 }],
          phase: {
            ruleVersion: 'phase-rules/v1',
            sessions: 142,
            phaseSec: phaseTotals(),
            phaseEvents: phaseTotals(),
            waitingSec: 12,
            idleSec: 30,
            sessionsWithVerify: 40,
            sessionsWithHandoff: 60,
            bucketRuleVersion: 'log-buckets/v1',
            lengths: [],
          },
          activity: [{ weekdayUtc: 5, hourUtc: 23, events: 17 }],
        },
      ],
      git: {
        testFileRuleVersion: 'test-files/v2',
        fileTypeRuleVersion: 'file-types/v2',
        commitSetRuleVersion: 'commit-set/v1',
        commits: 214,
        lateNightCommits: 30,
        additions: 9000,
        removals: 3400,
        changedLinesPerCommit: [40, 12],
        testFileCommits: 5,
        changedLinesByExtension: [{ extension: '.ts', changedLines: 500 }],
        withheldExtensionLines: 20,
        weekdayHourCells: [{ weekdayUtc: 5, hourUtc: 23, commits: 3 }],
      },
      parallelProjects: 2,
    })

  const workflow = (over: Record<string, unknown> = {}) => ({
    aggregateVersion: 'workflow-aggregates/v2',
    utcOffsetMinutes: 120,
    days: [workflowDay()],
    ...over,
  })

  test('accepts a workflow section beside the payloads (#213)', async () => {
    // The wire has to take the shape before anything can persist it. #218 adds
    // the storage; until then the section is validated, bounded, and dropped,
    // so a CLI publishing one is never refused.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    const result = await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payloads: [payload()],
      workflow: workflow(),
    })
    expect(result.receivedAt).toBeGreaterThan(0)
  })

  test('refuses a workflow section that breaks its bounds (#213)', async () => {
    // Closedness says which fields may arrive, never how long an array runs.
    // A publish that trips this is refused whole: the gate showed the owner
    // these exact bytes, and landing a trimmed version of them would publish
    // something nobody approved.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await expect(
      t.mutation(internal.measured.publishForToken, {
        tokenId,
        payloads: [payload()],
        workflow: workflow({
          days: [
            {
              ...workflowDay(),
              harnesses: Array.from({ length: 9 }, (_, i) => ({
                ...workflowDay().harnesses[0],
                harness: `harness-${i}`,
              })),
            },
          ],
        }),
      }),
    ).rejects.toThrow(/workflow.days\[0\].harnesses must hold at most 8/)
  })

  test('refuses two workflow entries claiming one harness (#213)', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })
    const one = workflowDay()

    await expect(
      t.mutation(internal.measured.publishForToken, {
        tokenId,
        payloads: [payload()],
        workflow: workflow({
          days: [{ ...one, harnesses: [one.harnesses[0], one.harnesses[0]] }],
        }),
      }),
    ).rejects.toThrow(/distinct harness/i)
  })

  test('stamps the publishing CLI version on every row of the batch (#213)', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payloads: [payload(), payload({ harness: { name: 'codex', version: null } })],
      cliVersion: '0.8.0',
    })
    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows.map((r) => r.cliVersion)).toEqual(['0.8.0', '0.8.0'])
  })

  test('leaves the version absent when an older client sends none (#213)', async () => {
    // An untagged row IS the answer: that machine is on a wire older than the
    // field, which is the question a wire bump asks.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payload: payload(),
    })
    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows[0].cliVersion).toBeUndefined()
  })

  test('drops an unreadable version rather than losing the sync (#213)', async () => {
    // The sync is what the owner approved. A garbled version tag is not worth
    // refusing it over - unlike the workflow section, which is measurement.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payload: payload(),
      cliVersion: 'nine\u0000point\u0000one',
    })
    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows).toHaveLength(1)
    expect(rows[0].cliVersion).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Read - the series (#81)
// ---------------------------------------------------------------------------

describe('countLivingStacks', () => {
  test('counts distinct stacks whose newest sync landed within 7 days', async () => {
    const t = convexTest(schema, modules)
    const a = await seedStack(t)
    const b = await seedStack(t, { userId: OTHER_USER })

    await t.mutation(internal.measured.publishSnapshot, {
      stackId: a.stackId,
      payload: payload(),
    })
    // Two syncs from one stack still count once.
    await t.mutation(internal.measured.publishSnapshot, {
      stackId: a.stackId,
      payload: payload({ capturedAt: Date.now() + 1 }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId: b.stackId,
      payload: payload(),
    })
    await t.run(async (ctx) => {
      const rows = await ctx.db
        .query('measuredInventory')
        .withIndex('by_stack', (q) => q.eq('stackId', b.stackId))
        .collect()
      for (const r of rows) {
        await ctx.db.patch(r._id, { receivedAt: Date.now() - 8 * DAY })
      }
    })

    expect(await t.query(api.measured.countLivingStacks, {})).toEqual({
      living: 1,
      everSynced: 2,
    })
  })
})

// ---------------------------------------------------------------------------
// Reconcile
// ---------------------------------------------------------------------------

describe('reconcile', () => {
  /**
   * `whatFor` seeds `toolSubscriptions[].description` - the field the tool card
   * renders. `primaryUsageLabel` is the TIER NAME and is deliberately non-blank
   * in every case here, so a test that passes cannot be reading it.
   */
  async function seedStackWithTool(t: Ctx, whatFor: string | undefined) {
    return await t.run(async (ctx) => {
      const creatorId = await ctx.db.insert('creators', {
        name: 'Owner',
        slug: 'owner',
        userId: USER,
        verified: false,
        personalPages: [],
        projectPages: [],
        createdAt: Date.now(),
      })
      await ctx.db.insert('tools', {
        name: 'Cursor',
        slug: 'cursor',
        shortId: 'tcursor',
        categories: ['ide'],
        tiers: [],
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      const stackId = await ctx.db.insert('stacks', {
        name: 'My Stack',
        slug: 'my-stack',
        shortId: 'sidrec',
        creatorId,
        oneLiner: 'A stack',
        toolSubscriptions: [
          {
            toolSlug: 'cursor',
            kind: 'main' as const,
            primaryUsageLabel: 'Pro',
            description: whatFor,
            price: {
              pricingType: 'fixed' as const,
              fixed: { currency: 'USD', amount: 20, period: 'month' as const },
            },
            priceKind: 'regular' as const,
          },
        ],
        hasUsageComponent: false,
        published: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      return { stackId }
    })
  }

  test('suggests a what-for for an authored tool with a blank label', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, '   ')
    const asOwner = t.withIdentity(IDENTITY)

    const result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.hasSnapshot).toBe(false)
    expect(result.receivedAt).toBeNull()
    expect(result.isFresh).toBe(false)
    expect(result.suggestions).toEqual([
      {
        atomKind: 'tool',
        atomKey: 'cursor',
        label: 'Cursor',
        kind: 'missing_what_for',
      },
    ])
  })

  test('a tier name in primaryUsageLabel does not count as a what-for', async () => {
    // The correction that made this ticket buildable: every tool the picker adds
    // carries a non-blank primaryUsageLabel ("Pro", "Default", "Custom"), so the
    // old derivation fired almost never.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, undefined)
    const asOwner = t.withIdentity(IDENTITY)
    const result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.suggestions).toHaveLength(1)
    expect(result.suggestions[0].kind).toBe('missing_what_for')
  })

  test('does not suggest a what-for that is already written', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, 'Daily driver')
    const asOwner = t.withIdentity(IDENTITY)
    const result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.suggestions).toEqual([])
  })

  test('never asks to add a measured model: the model list derives it (#338)', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'Claude Opus 5',
        slug: 'claude-opus-5',
        shortId: 'mopus5',
        provider: 'anthropic',
        category: 'language',
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload(),
      measuredDays: usageWire(today(), { model: 'claude-opus-5', usd: 12.34 }),
    })

    const asOwner = t.withIdentity(IDENTITY)
    const result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.hasSnapshot).toBe(true)
    expect(result.isFresh).toBe(true)
    expect(result.suggestions).toEqual([])
  })

  test('reports an old snapshot as present but not fresh', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })
    await t.run(async (ctx) => {
      const row = await ctx.db.query('measuredInventory').first()
      await ctx.db.patch(row!._id, { receivedAt: Date.now() - 12 * DAY })
    })

    const result = await t
      .withIdentity(IDENTITY)
      .query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.hasSnapshot).toBe(true)
    expect(result.isFresh).toBe(false)
  })

  test('does not suggest a measured model that resolves to nothing in the catalog', async () => {
    // The overlap is catalog slugs only - an unresolved id has nowhere to land.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })
    const asOwner = t.withIdentity(IDENTITY)
    const result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.suggestions).toEqual([])
  })

  test('a dismissal removes the suggestion and recomputes after a new sync', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, '')
    const asOwner = t.withIdentity(IDENTITY)

    await asOwner.mutation(api.measured.dismissSuggestion, {
      stackId,
      atomKind: 'tool',
      atomKey: 'cursor',
    })
    let result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.suggestions).toEqual([])
    expect(result.dismissedCount).toBe(1)

    // A new sync must not resurrect it - there is no pending state to merge.
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })
    result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.suggestions).toEqual([])

    await asOwner.mutation(api.measured.undismissSuggestion, {
      stackId,
      atomKind: 'tool',
      atomKey: 'cursor',
    })
    result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.suggestions).toHaveLength(1)
  })

  test('dismissing twice does not create a duplicate row', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, '')
    const asOwner = t.withIdentity(IDENTITY)
    await asOwner.mutation(api.measured.dismissSuggestion, {
      stackId,
      atomKind: 'tool',
      atomKey: 'cursor',
    })
    await asOwner.mutation(api.measured.dismissSuggestion, {
      stackId,
      atomKind: 'tool',
      atomKey: 'cursor',
    })
    const rows = await t.run((ctx) => ctx.db.query('reconcileDismissals').collect())
    expect(rows).toHaveLength(1)
  })

  test('a dismissal carries the catalog name, so the hidden list is readable', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, '')
    const asOwner = t.withIdentity(IDENTITY)

    await asOwner.mutation(api.measured.dismissSuggestion, {
      stackId,
      atomKind: 'tool',
      atomKey: 'cursor',
    })
    await asOwner.mutation(api.measured.dismissSuggestion, {
      stackId,
      atomKind: 'model',
      atomKey: 'not-in-the-catalog',
    })

    const rows = await asOwner.query(api.measured.listDismissals, { stackId })
    expect(rows.map((r) => r.label).sort()).toEqual([
      'Cursor',
      // An unresolved key falls back to itself rather than to nothing.
      'not-in-the-catalog',
    ])
  })

  test('applyWhatFor writes the note the tool card renders, not the tier name', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, '')
    const asOwner = t.withIdentity(IDENTITY)

    await asOwner.mutation(api.measured.applyWhatFor, {
      stackId,
      toolSlug: 'cursor',
      whatFor: '  writing and reviewing code  ',
    })

    const stack = await t.run((ctx) => ctx.db.get(stackId))
    expect(stack!.toolSubscriptions[0].description).toBe(
      'writing and reviewing code',
    )
    // The tier name is untouched.
    expect(stack!.toolSubscriptions[0].primaryUsageLabel).toBe('Pro')

    const result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.suggestions).toEqual([])
  })

  test('applyWhatFor refuses a blank note and an unsubscribed tool', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, '')
    const asOwner = t.withIdentity(IDENTITY)

    await expect(
      asOwner.mutation(api.measured.applyWhatFor, {
        stackId,
        toolSlug: 'cursor',
        whatFor: '   ',
      }),
    ).rejects.toThrow(/blank/i)
    await expect(
      asOwner.mutation(api.measured.applyWhatFor, {
        stackId,
        toolSlug: 'linear',
        whatFor: 'tickets',
      }),
    ).rejects.toThrow(/not on this stack/i)
  })

  test('the what-for write into the authored layer is owner-only', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, '')
    const asStranger = t.withIdentity(OTHER_IDENTITY)

    await expect(
      asStranger.mutation(api.measured.applyWhatFor, {
        stackId,
        toolSlug: 'cursor',
        whatFor: 'mine now',
      }),
    ).rejects.toThrow(/not authorized/i)
  })

  test('reconcile state is owner-only for read, dismiss, and undismiss', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStackWithTool(t, '')
    const asStranger = t.withIdentity(OTHER_IDENTITY)

    await expect(
      asStranger.query(api.measured.getReconcileSuggestions, { stackId }),
    ).rejects.toThrow(/not authorized/i)
    await expect(
      asStranger.mutation(api.measured.dismissSuggestion, {
        stackId,
        atomKind: 'tool',
        atomKey: 'cursor',
      }),
    ).rejects.toThrow(/not authorized/i)
    await expect(
      asStranger.query(api.measured.listDismissals, { stackId }),
    ).rejects.toThrow(/not authorized/i)
    await expect(
      t.query(api.measured.getReconcileSuggestions, { stackId }),
    ).rejects.toThrow(/not authenticated/i)
  })
})

// ---------------------------------------------------------------------------
// Sync config
// ---------------------------------------------------------------------------

describe('sync config', () => {
  test('the public half serves the allowlist and no cost preference', async () => {
    const t = convexTest(schema, modules)
    const config = await t.query(api.measured.getPublicSyncConfig, {})
    expect(config.allowlist.skills).toContain('grilling')
    expect(config.allowlist.subagents).toContain('general-purpose')
    expect(config).not.toHaveProperty('publishCost')
  })

  test('the curated allowlist carries no author-specific plugin names', async () => {
    // Widening it is #42's decision, not a code change here.
    const t = convexTest(schema, modules)
    const { allowlist } = await t.query(api.measured.getPublicSyncConfig, {})
    const all = [
      ...allowlist.mcpServers,
      ...allowlist.skills,
      ...allowlist.subagents,
      ...allowlist.slashCommands,
    ]
    expect(all.some((n) => n.startsWith('alp-river:'))).toBe(false)
  })

  test('publishCost defaults to opted-IN when the stack has never set it', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const config = await t.query(internal.measured.getSyncConfigForStack, { stackId })
    expect(config).toEqual({
      publishCost: true,
      // #48 mirrors the same rule field-for-field: absent is on.
      reviewKeptPrivate: true,
      // #213 makes it three (spec, "The wire"): the workflow section is a
      // default-on opt-out too, so a stack that has never refused publishes it.
      publishWorkflow: true,
      stackName: 'My Stack',
      // Composite, like every public stack URL - the gate prints it (#41).
      stackSlug: `my-stack-${shortId}`,
      optIns: EMPTY_OPT_INS,
      // The auto-sync permission (#102). Null, not `{enabled: false}`: the CLI
      // has to tell "nobody has decided" from "the owner said no".
      autoSync: null,
    })
  })

  test('an explicit false is a refusal and is reported as one', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.run((ctx) => ctx.db.patch(stackId, { publishCost: false }))
    const config = await t.query(internal.measured.getSyncConfigForStack, { stackId })
    expect(config.publishCost).toBe(false)
  })

  test('the workflow switch refuses the same way cost does (#213)', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.run((ctx) => ctx.db.patch(stackId, { publishWorkflow: false }))
    const config = await t.query(internal.measured.getSyncConfigForStack, { stackId })
    expect(config.publishWorkflow).toBe(false)
    // The two switches are independent: refusing the workflow section says
    // nothing about cost, and a stack that turns one off keeps the other.
    expect(config.publishCost).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Published-name opt-ins (#42 decision 2)
// ---------------------------------------------------------------------------

describe('published-name opt-ins', () => {
  const skill = (name: string) => ({ category: 'skills' as const, name })
  const machine = (name: string) => ({ category: 'machines' as const, name })

  test('ticks and revokes a machine name through the published-name gate', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const as = t.withIdentity(IDENTITY)

    await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [machine('workstation')],
    })

    let config = await t.query(internal.measured.getSyncConfigForStack, {
      stackId,
    })
    expect(config.optIns.machines).toEqual(['workstation'])

    await as.mutation(api.measured.removePublishedNameOptIns, {
      stackId,
      names: [machine('workstation')],
    })

    config = await t.query(internal.measured.getSyncConfigForStack, { stackId })
    expect(config.optIns.machines).toEqual([])
  })

  test('ticked names ride down with the stack half of the sync config', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const as = t.withIdentity(IDENTITY)

    await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [
        skill('alp-river:crossfire'),
        { category: 'mcpServers', name: 'acme-internal' },
      ],
    })

    const config = await t.query(internal.measured.getSyncConfigForStack, { stackId })
    expect(config.optIns.skills).toEqual(['alp-river:crossfire'])
    expect(config.optIns.mcpServers).toEqual(['acme-internal'])
    expect(config.optIns.subagents).toEqual([])
  })

  test('adding is idempotent, so a second bulk tick writes no duplicates', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const as = t.withIdentity(IDENTITY)

    const first = await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [skill('a'), skill('b')],
    })
    const second = await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [skill('a'), skill('b'), skill('c')],
    })
    expect(first.added).toBe(2)
    expect(second.added).toBe(1)
    const rows = await t.run((ctx) =>
      ctx.db.query('publishedNameOptIns').collect(),
    )
    expect(rows).toHaveLength(3)
  })

  test('removing revokes the name for every machine, and is idempotent', async () => {
    // The revoke path #42 decision 2 promised: un-ticking is a server-side act,
    // not "find the machine you ticked it on".
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const as = t.withIdentity(IDENTITY)

    await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [skill('a'), skill('b')],
    })
    const gone = await as.mutation(api.measured.removePublishedNameOptIns, {
      stackId,
      names: [skill('a')],
    })
    const again = await as.mutation(api.measured.removePublishedNameOptIns, {
      stackId,
      names: [skill('a')],
    })
    expect(gone.removed).toBe(1)
    expect(again.removed).toBe(0)

    const config = await t.query(internal.measured.getSyncConfigForStack, { stackId })
    expect(config.optIns.skills).toEqual(['b'])
  })

  test('a name is addressed by class, so two classes can carry the same string', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const as = t.withIdentity(IDENTITY)

    await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [skill('review'), { category: 'slashCommands', name: 'review' }],
    })
    await as.mutation(api.measured.removePublishedNameOptIns, {
      stackId,
      names: [skill('review')],
    })

    const config = await t.query(internal.measured.getSyncConfigForStack, { stackId })
    expect(config.optIns.skills).toEqual([])
    expect(config.optIns.slashCommands).toEqual(['review'])
  })

  test('only the owner can tick, list or revoke', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const stranger = t.withIdentity(OTHER_IDENTITY)

    await expect(
      stranger.mutation(api.measured.addPublishedNameOptIns, {
        stackId,
        names: [skill('a')],
      }),
    ).rejects.toThrow(/not authorized/i)
    await expect(
      stranger.query(api.measured.listPublishedNameOptIns, { stackId }),
    ).rejects.toThrow(/not authorized/i)
    await expect(
      t.mutation(api.measured.removePublishedNameOptIns, {
        stackId,
        names: [skill('a')],
      }),
    ).rejects.toThrow(/not authenticated/i)
  })

  test('a name that could not be delivered is refused loudly, not stored', async () => {
    // A tick the owner made and believes took effect is worse than an error.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const as = t.withIdentity(IDENTITY)

    for (const bad of ['', '   ', 'z'.repeat(65), 'bidi‮name']) {
      await expect(
        as.mutation(api.measured.addPublishedNameOptIns, {
          stackId,
          names: [skill(bad)],
        }),
      ).rejects.toThrow()
    }
    const rows = await t.run((ctx) =>
      ctx.db.query('publishedNameOptIns').collect(),
    )
    expect(rows).toHaveLength(0)
  })

  test('accepts a name the curated charset would refuse', async () => {
    // An opt-in is the USER's own string. Parentheses, accents and CJK are all
    // names someone genuinely runs.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const as = t.withIdentity(IDENTITY)

    await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [skill('(default)'), skill('dépendances'), skill('コード')],
    })
    const listed = await as.query(api.measured.listPublishedNameOptIns, { stackId })
    expect(listed.map((r) => r.name)).toContain('(default)')
    expect(listed).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// HTTP surface
// ---------------------------------------------------------------------------

describe('POST /api/cli/sync', () => {
  async function seedLinkedToken(t: Ctx, stackId?: Id<'stacks'>) {
    const token = `tok_${Math.random().toString(36).slice(2)}`
    await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: await sha256Hex(token),
        scopes: ['collect', 'sync'],
        userId: USER,
        stackId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
        lastUsedAt: Date.now(),
      }),
    )
    return token
  }

  const post = (t: Ctx, body: unknown, token?: string) =>
    t.fetch('/api/cli/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

  test('publishes with a linked bearer and returns the stack it landed on', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const token = await seedLinkedToken(t, stackId)

    const resp = await post(t, { payload: payload() }, token)
    expect(resp.status).toBe(200)
    const body = (await resp.json()) as Record<string, unknown>
    expect(body.stackSlug).toBe(`my-stack-${shortId}`)
    expect(typeof body.receivedAt).toBe('number')
  })

  test('refreshes the token’s lastUsedAt so an active machine stays linked', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedLinkedToken(t, stackId)
    // By DIGEST - the plaintext column is gone (#52).
    const tokenHash = await sha256Hex(token)
    await t.run(async (ctx) => {
      const row = await ctx.db
        .query('cliTokens')
        .withIndex('by_tokenHash', (q) => q.eq('tokenHash', tokenHash))
        .first()
      await ctx.db.patch(row!._id, { lastUsedAt: 0 })
    })

    await post(t, { payload: payload() }, token)
    const row = await t.run(async (ctx) =>
      ctx.db
        .query('cliTokens')
        .withIndex('by_tokenHash', (q) => q.eq('tokenHash', tokenHash))
        .first(),
    )
    expect(row!.lastUsedAt).toBeGreaterThan(0)
  })

  test('401 without a bearer, 409 for an unlinked one', async () => {
    const t = convexTest(schema, modules)
    await seedStack(t)
    expect((await post(t, { payload: payload() })).status).toBe(401)

    const unlinked = await seedLinkedToken(t)
    const resp = await post(t, { payload: payload() }, unlinked)
    expect(resp.status).toBe(409)
    expect(JSON.stringify(await resp.json())).toMatch(/not linked to a stack/i)
  })

  test('400 for a malformed body or a payload the validator rejects', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedLinkedToken(t, stackId)

    expect((await post(t, {}, token)).status).toBe(400)
    const bad = await post(t, { payload: { schemaVersion: 1 } }, token)
    expect(bad.status).toBe(400)
    // A rejected payload must not leave a partial row behind.
    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows).toHaveLength(0)
  })

  test('a payload cannot name its own destination', async () => {
    // The body is attacker-controlled; the destination comes from the token.
    const t = convexTest(schema, modules)
    const mine = await seedStack(t)
    const theirs = await seedStack(t, { userId: OTHER_USER })
    const token = await seedLinkedToken(t, mine.stackId)

    const resp = await post(
      t,
      { payload: payload(), stackId: theirs.stackId },
      token,
    )
    expect(resp.status).toBe(200)
    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows).toHaveLength(1)
    expect(rows[0].stackId).toBe(mine.stackId)
  })
})

describe('GET /api/cli/sync-config', () => {
  test('serves the allowlist without a bearer, failing closed on cost', async () => {
    const t = convexTest(schema, modules)
    const resp = await t.fetch('/api/cli/sync-config', { method: 'GET' })
    expect(resp.status).toBe(200)
    const body = (await resp.json()) as {
      allowlist: { skills: string[] }
      publishCost: boolean
      optIns: Record<string, string[]>
      stack: null
    }
    expect(body.allowlist.skills).toContain('grilling')
    expect(body.publishCost).toBe(false)
    expect(body.stack).toBeNull()
    // Stack-scoped like publishCost, and it fails closed the same way: no
    // bearer, no ticked names, every user-chosen name kept private.
    expect(body.optIns).toEqual(EMPTY_OPT_INS)
  })

  test('carries the bound stack’s ticked names with a valid bearer', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.withIdentity(IDENTITY).mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [{ category: 'skills', name: 'alp-river:crossfire' }],
    })
    const token = `tok_${Math.random().toString(36).slice(2)}`
    await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: await sha256Hex(token),
        scopes: ['collect', 'sync'],
        userId: USER,
        stackId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
        lastUsedAt: Date.now(),
      }),
    )

    const resp = await t.fetch('/api/cli/sync-config', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = (await resp.json()) as {
      allowlist: { skills: string[] }
      optIns: Record<string, string[]>
    }
    expect(body.optIns.skills).toEqual(['alp-river:crossfire'])
    // A tick does not widen the curated list - the two are separate on the
    // wire and the client unions them before its own fail-closed filter.
    expect(body.allowlist.skills).not.toContain('alp-river:crossfire')
  })

  test('adds the bound stack’s cost preference and name with a valid bearer', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Owner Stack' })
    const token = `tok_${Math.random().toString(36).slice(2)}`
    await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: await sha256Hex(token),
        scopes: ['collect', 'sync'],
        userId: USER,
        stackId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
        lastUsedAt: Date.now(),
      }),
    )

    const resp = await t.fetch('/api/cli/sync-config', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = (await resp.json()) as {
      publishCost: boolean
      stack: { name: string }
    }
    // The gate needs the name to say truthfully where the data is going.
    expect(body.stack.name).toBe('Owner Stack')
    expect(body.publishCost).toBe(true)

    await t.run((ctx) => ctx.db.patch(stackId, { publishCost: false }))
    const second = await t.fetch('/api/cli/sync-config', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(((await second.json()) as { publishCost: boolean }).publishCost).toBe(
      false,
    )
  })

  test('an invalid or unlinked bearer degrades to the anonymous response', async () => {
    const t = convexTest(schema, modules)
    const resp = await t.fetch('/api/cli/sync-config', {
      method: 'GET',
      headers: { Authorization: 'Bearer nonsense' },
    })
    expect(resp.status).toBe(200)
    const body = (await resp.json()) as { publishCost: boolean; stack: null }
    expect(body.publishCost).toBe(false)
    expect(body.stack).toBeNull()
  })

  test('carries the workflow switch, and fails it closed without a bearer (#213)', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = `tok_${Math.random().toString(36).slice(2)}`
    await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: await sha256Hex(token),
        scopes: ['collect', 'sync'],
        userId: USER,
        stackId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
        lastUsedAt: Date.now(),
      }),
    )
    const read = async (headers: Record<string, string> = {}) => {
      const resp = await t.fetch('/api/cli/sync-config', { method: 'GET', headers })
      return ((await resp.json()) as { publishWorkflow: boolean }).publishWorkflow
    }

    // Absent on the stack reads as opted IN, like the two switches beside it.
    expect(await read({ Authorization: `Bearer ${token}` })).toBe(true)

    await t.run((ctx) => ctx.db.patch(stackId, { publishWorkflow: false }))
    expect(await read({ Authorization: `Bearer ${token}` })).toBe(false)

    // No bearer, no stack to ask - and the direction that transmits less wins.
    expect(await read()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Kept-private staging (#51, building #48)
// ---------------------------------------------------------------------------

const EMPTY_KEPT_PRIVATE = {
  builtinTools: [],
  mcpServers: [],
  skills: [],
  subagents: [],
  slashCommands: [],
}

function keptPrivate(over: Record<string, unknown> = {}) {
  return { ...EMPTY_KEPT_PRIVATE, ...over }
}

const atom = (name: string, count = 1, group: string | null = null) => ({
  name,
  count,
  group,
})

async function seedTokenFor(
  t: Ctx,
  stackId?: Id<'stacks'>,
  name?: string,
) {
  const token = `tok_${Math.random().toString(36).slice(2)}`
  await t.run(async (ctx) =>
    ctx.db.insert('cliTokens', {
      tokenHash: await sha256Hex(token),
      scopes: ['collect', 'sync'],
      userId: USER,
      stackId,
      name,
      createdAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
      lastUsedAt: Date.now(),
    }),
  )
  return token
}

const postSync = (t: Ctx, body: unknown, token?: string) =>
  t.fetch('/api/cli/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

describe('the unsealed kept-private half of a sync', () => {
  test('stages the names beside the snapshot, outside the sealed payload', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)

    const resp = await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({
          skills: [atom('alp-river:crossfire', 12, 'alp-river')],
          mcpServers: [atom('acme-internal', 3)],
        }),
      },
      token,
    )
    expect(resp.status).toBe(200)
    expect((await resp.json()) as Record<string, unknown>).toMatchObject({
      keptPrivate: { stored: 2, refused: false },
    })

    const rows = await t.run((ctx) => ctx.db.query('keptPrivateNames').collect())
    expect(rows.map((r) => r.name).sort()).toEqual([
      'acme-internal',
      'alp-river:crossfire',
    ])
    // The sealed payload is untouched by any of it - the closed validator is
    // the privacy claim, and a kept-private name never enters it.
    const snapshot = await t.run((ctx) =>
      ctx.db.query('measuredInventory').first(),
    )
    expect(JSON.stringify(snapshot!.inventory)).not.toContain('alp-river')
  })

  test('replaces the whole list every sync rather than accumulating', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)

    await postSync(
      t,
      { payload: payload(), keptPrivate: keptPrivate({ skills: [atom('old')] }) },
      token,
    )
    await postSync(
      t,
      { payload: payload(), keptPrivate: keptPrivate({ skills: [atom('new')] }) },
      token,
    )

    const rows = await t.run((ctx) => ctx.db.query('keptPrivateNames').collect())
    // A name outside the current window is not in the snapshot either, so
    // ticking it would publish nothing. The list means exactly "names in your
    // current window you have not published".
    expect(rows.map((r) => r.name)).toEqual(['new'])
  })

  test('an absent half leaves the staged list alone', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)

    await postSync(
      t,
      { payload: payload(), keptPrivate: keptPrivate({ skills: [atom('kept')] }) },
      token,
    )
    const resp = await postSync(t, { payload: payload() }, token)
    expect((await resp.json()) as Record<string, unknown>).toMatchObject({
      keptPrivate: { stored: 0, refused: false },
    })
    const rows = await t.run((ctx) => ctx.db.query('keptPrivateNames').collect())
    expect(rows).toHaveLength(1)
  })

  test('refuses the half - not the sync - when the switch is off', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)
    await t.run((ctx) => ctx.db.patch(stackId, { reviewKeptPrivate: false }))

    const resp = await postSync(
      t,
      { payload: payload(), keptPrivate: keptPrivate({ skills: [atom('nope')] }) },
      token,
    )
    // The snapshot still lands: an owner who flips the switch mid-sync must not
    // lose the measurement over it.
    expect(resp.status).toBe(200)
    expect((await resp.json()) as Record<string, unknown>).toMatchObject({
      keptPrivate: { stored: 0, refused: true },
    })
    expect(
      await t.run((ctx) => ctx.db.query('keptPrivateNames').collect()),
    ).toHaveLength(0)
    expect(
      await t.run((ctx) => ctx.db.query('measuredInventory').collect()),
    ).toHaveLength(1)
  })

  test('bounds the unsealed half - #45 bounds the payload, not this', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)

    const unrenderable = await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({ skills: [atom('bad‮name')] }),
      },
      token,
    )
    expect(unrenderable.status).toBe(400)

    const tooMany = await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({
          skills: Array.from({ length: 501 }, (_, i) => atom(`s${i}`)),
        }),
      },
      token,
    )
    expect(tooMany.status).toBe(400)

    const badGroup = await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({ skills: [atom('fine', 1, 'gr oup')] }),
      },
      token,
    )
    expect(badGroup.status).toBe(400)

    const badCount = await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({ skills: [atom('fine', -1)] }),
      },
      token,
    )
    expect(badCount.status).toBe(400)

    // A rejected half must not leave a snapshot behind either: the two travel
    // in one request and one transaction.
    expect(
      await t.run((ctx) => ctx.db.query('measuredInventory').collect()),
    ).toHaveLength(0)
    expect(
      await t.run((ctx) => ctx.db.query('keptPrivateNames').collect()),
    ).toHaveLength(0)
  })
})

describe('the review switch', () => {
  test('rides down the authenticated half of sync-config, absent means on', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)

    const read = async () => {
      const resp = await t.fetch('/api/cli/sync-config', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      return (await resp.json()) as { reviewKeptPrivate: boolean }
    }
    expect((await read()).reviewKeptPrivate).toBe(true)

    await t.run((ctx) => ctx.db.patch(stackId, { reviewKeptPrivate: false }))
    expect((await read()).reviewKeptPrivate).toBe(false)
  })

  test('fails closed without a bearer, exactly like publishCost', async () => {
    const t = convexTest(schema, modules)
    const resp = await t.fetch('/api/cli/sync-config', { method: 'GET' })
    const body = (await resp.json()) as { reviewKeptPrivate: boolean }
    expect(body.reviewKeptPrivate).toBe(false)
  })

  test('flipping it off deletes the staged list; ticks survive', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)
    const as = t.withIdentity(IDENTITY)

    await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({ skills: [atom('alp-river:crossfire', 4)] }),
      },
      token,
    )
    await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [{ category: 'skills', name: 'alp-river:crossfire' }],
    })

    const result = await as.mutation(api.measured.setReviewKeptPrivate, {
      stackId,
      enabled: false,
    })
    expect(result.deleted).toBe(1)
    expect(
      await t.run((ctx) => ctx.db.query('keptPrivateNames').collect()),
    ).toHaveLength(0)
    // A tick is a standing permission and outlives the staging store entirely.
    expect(
      await as.query(api.measured.listPublishedNameOptIns, { stackId }),
    ).toHaveLength(1)
  })

  test('only the owner may flip it or read the staged names', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const stranger = t.withIdentity(OTHER_IDENTITY)

    await expect(
      stranger.mutation(api.measured.setReviewKeptPrivate, {
        stackId,
        enabled: false,
      }),
    ).rejects.toThrow(/not authorized/i)
    await expect(
      stranger.query(api.measured.listKeptPrivate, { stackId }),
    ).rejects.toThrow(/not authorized/i)
  })

  test('the staged names never reach a public read', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)
    await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({ mcpServers: [atom('acme-internal')] }),
      },
      token,
    )

    const publicRead = await t.query(api.measured.getUsageByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(publicRead?.inventory).toHaveLength(1)
    expect(JSON.stringify(publicRead)).not.toContain('acme-internal')
  })
})

describe('listKeptPrivate', () => {
  test('stages the token machine name for the same review and revoke flow', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const workstation = await seedTokenFor(t, stackId, 'workstation')
    const vps = await seedTokenFor(t, stackId, 'vps')

    await postSync(t, { payload: payload() }, workstation)
    await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({ skills: [atom('private-skill')] }),
      },
      vps,
    )

    const listed = await t
      .withIdentity(IDENTITY)
      .query(api.measured.listKeptPrivate, { stackId })
    expect(listed.names.filter((name) => name.category === 'machines')).toEqual([
      {
        category: 'machines',
        name: 'vps',
        group: null,
        published: false,
      },
      {
        category: 'machines',
        name: 'workstation',
        group: null,
        published: false,
      },
    ])
  })

  test('returns the staged names with their counts and groups', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)
    await postSync(
      t,
      {
        payload: payload(),
        keptPrivate: keptPrivate({
          skills: [atom('alp-river:crossfire', 4, 'alp-river'), atom('solo', 9)],
        }),
      },
      token,
    )

    const listed = await t
      .withIdentity(IDENTITY)
      .query(api.measured.listKeptPrivate, { stackId })
    expect(listed.reviewEnabled).toBe(true)
    expect(listed.stagedAt).toBeGreaterThan(0)
    // Most-used first, the order the gate showed them in.
    expect(listed.names.map((n) => n.name)).toEqual(['solo', 'alp-river:crossfire'])
    expect(listed.names[1]).toMatchObject({
      category: 'skills',
      count: 4,
      group: 'alp-river',
      published: false,
    })
  })

  test('carries ticked names too, so a tick can be taken back', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const as = t.withIdentity(IDENTITY)
    await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [{ category: 'skills', name: 'alp-river:crossfire' }],
    })

    // A ticked name PUBLISHES, so the machine never stages it - the tick set is
    // the only place it can be revoked from.
    const listed = await as.query(api.measured.listKeptPrivate, { stackId })
    expect(listed.names).toHaveLength(1)
    expect(listed.names[0]).toMatchObject({
      name: 'alp-river:crossfire',
      published: true,
      group: 'alp-river',
    })
  })

  test('a name that is both staged and ticked appears once, as published', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)
    const as = t.withIdentity(IDENTITY)
    await postSync(
      t,
      { payload: payload(), keptPrivate: keptPrivate({ skills: [atom('dup', 7)] }) },
      token,
    )
    await as.mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [{ category: 'skills', name: 'dup' }],
    })

    const listed = await as.query(api.measured.listKeptPrivate, { stackId })
    expect(listed.names).toHaveLength(1)
    expect(listed.names[0]).toMatchObject({ published: true, count: 7 })
  })
})

describe('kept-private expiry', () => {
  test('the retention cron drops a list older than 30 days', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)
    await postSync(
      t,
      { payload: payload(), keptPrivate: keptPrivate({ skills: [atom('stale')] }) },
      token,
    )
    await t.run(async (ctx) => {
      for (const row of await ctx.db.query('keptPrivateNames').collect()) {
        await ctx.db.patch(row._id, { stagedAt: Date.now() - 31 * DAY })
      }
    })

    const result = await t.mutation(internal.measured.gcMeasured, {})
    expect(result.keptPrivateDeleted).toBe(1)
    expect(
      await t.run((ctx) => ctx.db.query('keptPrivateNames').collect()),
    ).toHaveLength(0)
  })

  test('a fresh list survives the cron', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const token = await seedTokenFor(t, stackId)
    await postSync(
      t,
      { payload: payload(), keptPrivate: keptPrivate({ skills: [atom('fresh')] }) },
      token,
    )

    const result = await t.mutation(internal.measured.gcMeasured, {})
    expect(result.keptPrivateDeleted).toBe(0)
    expect(
      await t.run((ctx) => ctx.db.query('keptPrivateNames').collect()),
    ).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Per-harness snapshots (#66, built in #67)
// ---------------------------------------------------------------------------

describe('batch publish + per-harness aggregation (#67)', () => {
  async function seedToken(
    t: Ctx,
    opts: { stackId?: Id<'stacks'>; userId?: string } = {},
  ) {
    return await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: await sha256Hex(`tok_${Math.random().toString(36).slice(2)}`),
        scopes: ['collect', 'sync'],
        userId: opts.userId ?? USER,
        stackId: opts.stackId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
        lastUsedAt: Date.now(),
      }),
    )
  }

  const codexPayload = (over: Record<string, unknown> = {}) =>
    payload({
      harness: { name: 'codex', version: '0.146.0' },
      pricingTable: 'openai-list-2026-08-01',
      activity: {
        sessions: 3,
        activeDays: 4,
        projects: 2,
        totalTokens: 500_000,
        cacheHitShare: 0.5,
        subagentShare: 0,
      },
      models: [
        {
          id: 'gpt-5.5',
          tokenShare: 1,
          tokens: { input: 100, output: 50, cacheWrite: 0, cacheRead: 200 },
          apiEquivalentUSD: 2,
        },
      ],
      ...over,
    })

  test('payloads[] lands one inventory row per harness, atomically, with the harness column', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    const result = await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payloads: [payload(), codexPayload()],
    })
    expect(result.receivedAt).toBeGreaterThan(0)

    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows.map((r) => r.harness).sort()).toEqual(['claude-code', 'codex'])
  })

  test('a v2 sync event carries set cardinalities, not the private members', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payloads: [payloadV2()],
    })

    const stream = await t.query(api.activityFeed.stream, {})
    const event = stream.rows.find((row) => row.stack.slug.endsWith(shortId))?.event
    expect(event).toMatchObject({
      type: 'sync.landed',
      harnesses: [{ activeDays: 3, projects: 2 }],
    })
    expect(JSON.stringify(event)).not.toContain('2026-07-20')
    expect(JSON.stringify(event)).not.toContain('AAAAAAAAAAAAAAAAAAAAAA')
  })

  test('two payloads naming the same harness are refused', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await expect(
      t.mutation(internal.measured.publishForToken, {
        tokenId,
        payloads: [payload(), payload()],
      }),
    ).rejects.toThrow(/distinct harness/i)
  })

  test('the legacy single-payload field still publishes (wire tolerance)', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    const result = await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payload: payload(),
    })
    expect(result.receivedAt).toBeGreaterThan(0)
  })

  test('a batch with no payloads is refused', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await expect(
      t.mutation(internal.measured.publishForToken, { tokenId, payloads: [] }),
    ).rejects.toThrow(/at least one payload/i)
  })

})

// ---------------------------------------------------------------------------
// Read-time repricing (#72)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Two machines, one harness (#243)
// ---------------------------------------------------------------------------

describe('two machines publishing the same harness (#243)', () => {
  async function seedToken(
    t: Ctx,
    opts: { stackId?: Id<'stacks'>; userId?: string; name?: string } = {},
  ) {
    return await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: await sha256Hex(`tok_${Math.random().toString(36).slice(2)}`),
        scopes: ['collect', 'sync'],
        userId: opts.userId ?? USER,
        stackId: opts.stackId,
        ...(opts.name === undefined ? {} : { name: opts.name }),
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
        lastUsedAt: Date.now(),
      }),
    )
  }

  test('stamps the machine from the TOKEN, never from the payload', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId, name: 'laptop' })

    await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payload: payload(),
    })

    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows[0].machine).toBe('laptop')
  })

  test('a token with no name publishes untagged, like a pre-tagging row', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payload: payload(),
    })

    const rows = await t.run((ctx) => ctx.db.query('measuredInventory').collect())
    expect(rows[0].machine).toBeUndefined()
  })

})

// ---------------------------------------------------------------------------
// The inventory and the machines, as `getUsageByStackSlug` publishes them
// (ADR-0011). The sums are covered in measuredDays.test.ts.
// ---------------------------------------------------------------------------

function usageWire(
  date: string,
  over: { harness?: string; input?: number; sessions?: number; model?: string; usd?: number } = {},
) {
  return {
    aggregateVersion: 'measured-days/v1',
    days: [
      {
        date,
        usage: {
          harnesses: [
            {
              harness: over.harness ?? 'claude-code',
              sessions: over.sessions ?? 1,
              projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
              models: [
                {
                  model: over.model ?? 'claude-haiku-4-5',
                  tokens: { input: over.input ?? 1_000, output: 0, cacheWrite: 0, cacheRead: 0 },
                  ...(over.usd === undefined
                    ? {}
                    : { usd: over.usd, pricingTable: 'anthropic-list-2026-08-25' }),
                },
              ],
              subagentTokens: 0,
              excludedTokens: { unpriced: 0, synthetic: 0 },
            },
          ],
        },
      },
    ],
  }
}

const today = () => new Date().toISOString().slice(0, 10)

describe('getUsageByStackSlug publishes the inventory and the machines', () => {
  test('assigns ordinals by first sight, not by the private machine name', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)

    for (const [capturedAt, machine] of [
      [1000, 'z-machine'],
      [2000, 'a-machine'],
    ] as const) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        machine,
        payload: payload({ capturedAt }),
      })
    }

    const usage = await t.query(api.measured.getUsageByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(usage?.inventory.map((h) => h.machineOrdinal)).toEqual([2, 1])
    expect(usage?.machines.map((m) => m.machineOrdinal)).toEqual([1, 2])
  })

  test('withholds unticked machine names, keeps stable ordinals, and names them for the owner', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const slug = `my-stack-${shortId}`

    for (const [harness, machine] of [
      ['claude-code', 'workstation'],
      ['codex', 'vps'],
      ['codex', 'workstation'],
    ] as const) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        machine,
        payload: payload({ harness: { name: harness, version: '1.0.0' } }),
      })
    }

    const publicView = await t.query(api.measured.getUsageByStackSlug, { slug })
    expect(
      publicView?.inventory.map((h) => [h.harness, h.machine, h.machineOrdinal]),
    ).toEqual([
      ['claude-code', null, 1],
      ['codex', null, 2],
      ['codex', null, 1],
    ])

    await t.withIdentity(IDENTITY).mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [{ category: 'machines', name: 'vps' }],
    })
    const readerView = await t
      .withIdentity(OTHER_IDENTITY)
      .query(api.measured.getUsageByStackSlug, { slug })
    expect(readerView?.inventory.map((h) => h.machine)).toEqual([null, 'vps', null])

    const ownerView = await t
      .withIdentity(IDENTITY)
      .query(api.measured.getUsageByStackSlug, { slug })
    expect(ownerView?.inventory.map((h) => h.machine)).toEqual([
      'workstation',
      'vps',
      'workstation',
    ])
  })

  test('narrows the inventory and the days to one machine ordinal', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)

    for (const [machine, harness, tokens] of [
      ['workstation', 'claude-code', 1_000],
      ['vps', 'claude-code', 2_000],
      ['workstation', 'codex', 3_000],
    ] as const) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        machine,
        payload: payload({ harness: { name: harness, version: '1.0.0' } }),
        measuredDays: usageWire(today(), { harness, input: tokens }),
      })
    }

    const usage = await t.query(api.measured.getUsageByStackSlug, {
      slug: `my-stack-${shortId}`,
      machineOrdinal: 1,
    })
    expect(usage?.inventory.map((h) => [h.harness, h.machineOrdinal])).toEqual([
      ['claude-code', 1],
      ['codex', 1],
    ])
    expect(usage?.current?.totalTokens).toBe(3_000)
    expect(usage?.legacy).toBeNull()
  })

  test('a legacy figure stands in for a stack with inventory but no days', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })
    await t.run(async (ctx) => {
      const row = await ctx.db.query('measuredInventory').first()
      await ctx.db.patch(row!._id, {
        legacy: { tokens: 5_000, sessions: 7, activeDays: 3, usd: 1.25, capturedAt: 10, windowDays: 30 },
      })
    })

    const usage = await t.query(api.measured.getUsageByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(usage?.hasDays).toBe(false)
    expect(usage?.current).toBeNull()
    expect(usage?.legacy).toEqual({
      tokens: 5_000,
      sessions: 7,
      activeDays: 3,
      usd: 1.25,
      capturedAt: 10,
      windowDays: 30,
    })
  })

  test('returns null for an unpublished stack, and answers no days for one that never synced', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const idle = await t.query(api.measured.getUsageByStackSlug, { slug: `my-stack-${shortId}` })
    expect(idle?.hasDays).toBe(false)
    expect(idle?.inventory).toEqual([])
    await t.run((ctx) => ctx.db.patch(stackId, { published: false }))
    expect(
      await t.query(api.measured.getUsageByStackSlug, { slug: `my-stack-${shortId}` }),
    ).toBeNull()
  })
})
