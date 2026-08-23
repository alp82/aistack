/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'
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
function payload(over: Record<string, unknown> = {}) {
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
  }
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
  test('inserts an immutable row and stamps a server receivedAt', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)

    const clientClock = Date.now() - 5 * 60_000
    const result = await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: clientClock }),
    })

    expect(result.receivedAt).toBeGreaterThan(clientClock)
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(rows).toHaveLength(1)
    // capturedAt is NOT clamped to the server clock - the divergence is signal.
    expect(rows[0].capturedAt).toBe(clientClock)
    expect(rows[0].receivedAt).toBe(result.receivedAt)
  })

  test('appends rather than replacing - history is the point', async () => {
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

    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(rows).toHaveLength(2)
  })

  test('rejects an unsupported schemaVersion instead of storing it', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await expect(
      t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ schemaVersion: 99 }),
      }),
    ).rejects.toThrow(/schemaVersion 99/)
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
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
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
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
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

    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
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
})

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

describe('getCurrentByStackSlug', () => {
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

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.harnesses.map((h) => h.machineOrdinal)).toEqual([2, 1])
  })

  test('keeps first-sight ordinals after retention deletes the first row', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const oldDay = Date.UTC(2026, 0, 15)

    for (const [offset, machine] of [
      [1, 'a-machine'],
      [2, 'b-machine'],
      [3, 'a-machine'],
    ] as const) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        machine,
        payload: payload({ capturedAt: oldDay + offset * 3_600_000 }),
      })
    }

    const before = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(before?.harnesses.map((h) => h.machineOrdinal)).toEqual([1, 2])

    await t.mutation(internal.measured.gcSnapshots, {})

    const after = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(after?.harnesses.map((h) => h.machineOrdinal)).toEqual([1, 2])
  })

  test('backfills legacy machines before a sync assigns a position', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.run(async (ctx) => {
      for (const [receivedAt, machine] of [
        [100, 'z-machine'],
        [200, 'a-machine'],
      ] as const) {
        await ctx.db.insert('measuredSnapshots', {
          stackId,
          capturedAt: receivedAt,
          receivedAt,
          schemaVersion: 1,
          harness: 'claude-code',
          machine,
          payload: payload({ capturedAt: receivedAt }),
        })
      }
    })

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      machine: 'a-machine',
      payload: payload({ capturedAt: 300 }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.harnesses.map((h) => h.machineOrdinal)).toEqual([2, 1])
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

    const publicView = await t.query(api.measured.getCurrentByStackSlug, { slug })
    expect(
      publicView?.harnesses.map((h) => [h.harness.name, h.machine, h.machineOrdinal]),
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
      .query(api.measured.getCurrentByStackSlug, { slug })
    expect(readerView?.harnesses.map((h) => h.machine)).toEqual([
      null,
      'vps',
      null,
    ])

    await t.withIdentity(IDENTITY).mutation(api.measured.removePublishedNameOptIns, {
      stackId,
      names: [{ category: 'machines', name: 'vps' }],
    })
    const revokedView = await t.query(api.measured.getCurrentByStackSlug, { slug })
    expect(revokedView?.harnesses.map((h) => h.machine)).toEqual([
      null,
      null,
      null,
    ])

    const ownerView = await t
      .withIdentity(IDENTITY)
      .query(api.measured.getCurrentByStackSlug, { slug })
    expect(ownerView?.harnesses.map((h) => h.machine)).toEqual([
      'workstation',
      'vps',
      'workstation',
    ])
  })

  test('returns the newest snapshot by capturedAt, not by insertion order', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: 5000, activity: { ...payload().activity, sessions: 1 } }),
    })
    // Inserted second but OLDER - must not win.
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: 1000, activity: { ...payload().activity, sessions: 99 } }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.activity.sessions).toBe(1)
  })

  test('resolves a model id against the catalog at READ time', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload(),
    })

    // Nothing in the catalog yet: published verbatim, tokens intact, slug null.
    let current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.models[0]).toMatchObject({
      id: 'claude-opus-5',
      catalogSlug: null,
      catalogName: null,
    })
    expect(current?.models[0].tokens.output).toBe(20)

    // Add the model to the catalog. The SAME immutable snapshot now resolves -
    // no republish. This is what let #33 exempt model ids from the allowlist.
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

    current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.models[0]).toMatchObject({
      catalogSlug: 'claude-opus-5',
      catalogName: 'Claude Opus 5',
    })
  })

  test('resolves via the catalog aliases array as well as the slug', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'Claude Haiku 4.5',
        slug: 'claude-haiku-4-5-20251001',
        shortId: 'mhaiku',
        aliases: ['claude-haiku-4-5'],
        provider: 'anthropic',
        category: 'language',
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        models: [
          {
            id: 'claude-haiku-4-5',
            tokenShare: 1,
            tokens: { input: 1, output: 1, cacheWrite: 0, cacheRead: 0 },
          },
        ],
      }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.models[0].catalogSlug).toBe('claude-haiku-4-5-20251001')
  })

  test('cites every per-model table in the cost reading (#136)', async () => {
    // One opencode snapshot prices OpenAI and Google rows from two tables and
    // its top-level pricingTable is null. Both citations must survive to the
    // surface - the old shape stamped one string over both.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        pricingTable: null,
        models: [
          {
            id: 'openai:gpt-5.4',
            tokenShare: 0.5,
            tokens: { input: 10, output: 10, cacheWrite: 0, cacheRead: 0 },
            apiEquivalentUSD: 2.5,
            pricingTable: 'openai-list-2026-08-02',
          },
          {
            id: 'google:gemini-3.6-flash',
            tokenShare: 0.5,
            tokens: { input: 10, output: 10, cacheWrite: 0, cacheRead: 0 },
            apiEquivalentUSD: 1.5,
            pricingTable: 'google-list-2026-08-09',
          },
        ],
      }) as never,
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.cost?.pricingTables).toEqual([
      'openai-list-2026-08-02',
      'google-list-2026-08-09',
    ])
    expect(current?.pricingTable).toBe(
      'openai-list-2026-08-02 + google-list-2026-08-09',
    )
    expect(current?.cost?.publishedUSD).toBe(4)
  })

  test('reports isFresh from the SERVER clock', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      // A client claiming to be from the future must not manufacture freshness…
      payload: payload({ capturedAt: Date.now() + 90 * DAY }),
    })
    let current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.isFresh).toBe(true) // receivedAt is now, so genuinely fresh

    // …and a stale receivedAt must not be rescued by a fresh capturedAt.
    await t.run(async (ctx) => {
      const row = await ctx.db.query('measuredSnapshots').first()
      await ctx.db.patch(row!._id, { receivedAt: Date.now() - 8 * DAY })
    })
    current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.isFresh).toBe(false)
  })

  test('returns null for an unpublished stack, and for one that never synced', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t, { published: false })
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })
    expect(
      await t.query(api.measured.getCurrentByStackSlug, { slug: `my-stack-${shortId}` }),
    ).toBeNull()

    const other = await seedStack(t, { userId: OTHER_USER })
    expect(
      await t.query(api.measured.getCurrentByStackSlug, {
        slug: `my-stack-${other.shortId}`,
      }),
    ).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Read - the series (#81)
// ---------------------------------------------------------------------------

describe('getHistoryByStackSlug', () => {
  const HOUR = 60 * 60 * 1000

  /** Tokens split across the four input classes, so totals stay checkable. */
  function models(over: Array<{ id: string; share: number; usd?: number }>) {
    return over.map((m) => ({
      id: m.id,
      tokenShare: m.share,
      tokens: { input: 1, output: 1, cacheWrite: 0, cacheRead: 0 },
      ...(m.usd === undefined ? {} : { apiEquivalentUSD: m.usd }),
    }))
  }

  test('uses the current machine ordinals in every point and gates each name', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const slug = `my-stack-${shortId}`
    const now = Date.now()

    for (const [ago, harness, machine] of [
      [3 * HOUR, 'claude-code', 'workstation'],
      [2 * HOUR, 'codex', 'vps'],
      [HOUR, 'codex', 'workstation'],
    ] as const) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        machine,
        payload: payload({
          capturedAt: now - ago,
          harness: { name: harness, version: '1.0.0' },
        }),
      })
    }

    const publicView = await t.query(api.measured.getHistoryByStackSlug, { slug })
    expect(
      publicView?.points.map((point) =>
        point.harnesses.map((h) => [h.name, h.machine, h.machineOrdinal]),
      ),
    ).toEqual([
      [['claude-code', null, 1]],
      [
        ['claude-code', null, 1],
        ['codex', null, 2],
      ],
      [
        ['claude-code', null, 1],
        ['codex', null, 2],
        ['codex', null, 1],
      ],
    ])

    await t.withIdentity(IDENTITY).mutation(api.measured.addPublishedNameOptIns, {
      stackId,
      names: [{ category: 'machines', name: 'vps' }],
    })
    const readerView = await t
      .withIdentity(OTHER_IDENTITY)
      .query(api.measured.getHistoryByStackSlug, { slug })
    expect(readerView?.points.at(-1)?.harnesses.map((h) => h.machine)).toEqual([
      null,
      'vps',
      null,
    ])

    const ownerView = await t
      .withIdentity(IDENTITY)
      .query(api.measured.getHistoryByStackSlug, { slug })
    expect(ownerView?.points.at(-1)?.harnesses.map((h) => h.machine)).toEqual([
      'workstation',
      'vps',
      'workstation',
    ])
  })

  test('returns one point per sync, oldest first', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const now = Date.now()

    for (const [ago, tokens] of [
      [3 * DAY, 100],
      [2 * DAY, 220],
      [1 * DAY, 180],
    ] as const) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({
          capturedAt: now - ago,
          activity: { ...payload().activity, totalTokens: tokens },
        }),
      })
    }

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    // A rolling window is a level, so it may fall. The series says so.
    expect(history?.points.map((p) => p.tokens)).toEqual([100, 220, 180])
    expect(history?.points.map((p) => p.at)).toEqual([
      now - 3 * DAY,
      now - 2 * DAY,
      now - 1 * DAY,
    ])
  })

  test('returns null for an unpublished stack, and for one that never synced', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t, { published: false })
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })
    expect(
      await t.query(api.measured.getHistoryByStackSlug, { slug: `my-stack-${shortId}` }),
    ).toBeNull()

    const other = await seedStack(t)
    expect(
      await t.query(api.measured.getHistoryByStackSlug, {
        slug: `my-stack-${other.shortId}`,
      }),
    ).toBeNull()
  })

  test('two syncs a minute apart are one reading, not two', async () => {
    // Real, from prod: 15:35 and 15:36 on 2026-08-01.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const at = Date.now() - HOUR

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: at }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: at + 61_000,
        activity: { ...payload().activity, totalTokens: 2_000_000 },
      }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      // Same minute as the second: an amended sync, not a new reading.
      payload: payload({
        capturedAt: at + 61_500,
        activity: { ...payload().activity, totalTokens: 3_000_000 },
      }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(history?.points).toHaveLength(2)
    expect(history?.points[1].tokens).toBe(3_000_000)
  })

  test('carries a harness that did not sync into the next reading', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const now = Date.now()

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - 2 * DAY,
        activity: { ...payload().activity, totalTokens: 1_000, sessions: 10 },
      }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - HOUR,
        harness: { name: 'codex', version: '0.9' },
        activity: { ...payload().activity, totalTokens: 40, sessions: 2 },
      }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    const last = history?.points[1]
    // Claude Code did not sync in this minute, and dropping it would make the
    // stack look like it shrank by three orders of magnitude.
    expect(last?.tokens).toBe(1_040)
    expect(last?.sessions).toBe(12)
    expect(last?.harnesses.map((h) => h.name).sort()).toEqual([
      'claude-code',
      'codex',
    ])
    // The carried reading says when it was actually taken.
    const cc = last?.harnesses.find((h) => h.name === 'claude-code')
    expect(cc?.capturedAt).toBe(now - 2 * DAY)
    expect(last?.at).toBe(now - HOUR)
  })

  test('the newest point states exactly what the headline states', async () => {
    // The page shows the headline and the trail together. If these two merges
    // could disagree, the number would restate itself differently every scroll.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const now = Date.now()

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - 3 * DAY,
        models: models([{ id: 'claude-opus-5', share: 1, usd: 5 }]),
      }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - 2 * DAY,
        harness: { name: 'codex', version: '0.9' },
        activity: { ...payload().activity, totalTokens: 500_000, sessions: 4 },
        models: models([{ id: 'gpt-5.5', share: 1, usd: 3 }]),
      }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - HOUR,
        models: models([
          { id: 'claude-opus-5', share: 0.8, usd: 8 },
          { id: 'claude-haiku-4-5', share: 0.2, usd: 1 },
        ]),
      }),
    })

    const slug = `my-stack-${shortId}`
    const current = await t.query(api.measured.getCurrentByStackSlug, { slug })
    const history = await t.query(api.measured.getHistoryByStackSlug, { slug })
    const points = history?.points ?? []
    const last = points[points.length - 1]

    expect(last.tokens).toBe(current?.activity.totalTokens)
    expect(last.sessions).toBe(current?.activity.sessions)
    expect(last.usd).toBe(
      current?.models.reduce((a, m) => a + (m.apiEquivalentUSD ?? 0), 0),
    )
    expect(last.models.map((m) => m.id)).toEqual(current?.models.map((m) => m.id))
    expect(last.models.map((m) => m.tokenShare)).toEqual(
      current?.models.map((m) => m.tokenShare),
    )
  })

  test('seeds the carry-forward from before the window', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const now = Date.now()

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - 200 * DAY,
        activity: { ...payload().activity, totalTokens: 1_000 },
      }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - HOUR,
        harness: { name: 'codex', version: '0.9' },
        activity: { ...payload().activity, totalTokens: 40 },
      }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
      days: 30,
    })
    // One point - the old row is out of the window - but it still contributes,
    // exactly as it does to the headline.
    expect(history?.points).toHaveLength(1)
    expect(history?.points[0].tokens).toBe(1_040)
    expect(history?.windowDays).toBe(30)
  })

  test('narrows to one harness, unmerged, when asked', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const now = Date.now()

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - 2 * DAY,
        activity: { ...payload().activity, totalTokens: 1_000 },
      }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - HOUR,
        harness: { name: 'codex', version: '0.9' },
        activity: { ...payload().activity, totalTokens: 40 },
      }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
      harness: 'codex',
    })
    expect(history?.harness).toBe('codex')
    expect(history?.points).toHaveLength(1)
    expect(history?.points[0].tokens).toBe(40)
    expect(history?.points[0].harnesses.map((h) => h.name)).toEqual(['codex'])
  })

  test('resolves the catalog at read time and keeps an unknown id as itself', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
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
      payload: payload({
        capturedAt: Date.now() - HOUR,
        models: models([
          { id: 'claude-opus-5', share: 0.5, usd: 1 },
          { id: 'some-unlisted-model', share: 0.5, usd: 1 },
        ]),
      }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(history?.points[0].models).toEqual([
      {
        id: 'claude-opus-5',
        catalogSlug: 'claude-opus-5',
        catalogName: 'Claude Opus 5',
        tokenShare: 0.5,
      },
      {
        id: 'some-unlisted-model',
        catalogSlug: null,
        catalogName: null,
        tokenShare: 0.5,
      },
    ])
  })

  test('estimates a reading that published no pricing table, citing our table', async () => {
    // Before #93 a table-less reading published no cost. The shared table can
    // now date an estimate itself, so the trail fills the gap instead of
    // showing dollars today and a hole for the same model yesterday.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const now = Date.now()

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - DAY,
        pricingTable: null,
        models: models([{ id: 'claude-opus-5', share: 1 }]),
      }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: now - HOUR,
        models: models([{ id: 'claude-opus-5', share: 1, usd: 7 }]),
      }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    // Two tokens of claude-opus-5 estimate to fractions of a cent, and the
    // estimate rounds to cents - so the honest figure here is $0, not null.
    expect(history?.points[0].usd).toBe(0)
    expect(history?.points[0].pricingTable).toBe('anthropic-list-2026-07-25')
    expect(history?.points[1].usd).toBe(7)
    expect(history?.points[1].pricingTable).toBe('anthropic-list-2026-07-25')
  })

  test('reprices an old unpriced row at read time, and says which table did it', async () => {
    // #72: rows landed before the CLI knew the price. Snapshots are immutable,
    // so the fix is at read time - and the trail must reprice too, or a page
    // shows dollars today and a gap for the same reading in its own history.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: Date.now() - HOUR,
        pricingTable: 'openai-list-2026-07-25',
        models: [
          {
            id: 'gpt-5.6-luna',
            tokenShare: 1,
            tokens: {
              input: 1_000_000,
              output: 1_000_000,
              cacheWrite: 0,
              cacheRead: 0,
            },
          },
        ],
      }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    // 1M input at $0.20 + 1M output at $1.20. The payload's own table priced
    // nothing here, so it is not cited (#93) - only the estimating table is.
    expect(history?.points[0].usd).toBeCloseTo(1.4, 6)
    expect(history?.points[0].pricingTable).toBe('openai-list-2026-08-02')
  })
})

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
        .query('measuredSnapshots')
        .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', b.stackId))
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

  test('suggests a measured model missing from the authored list', async () => {
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
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })

    const asOwner = t.withIdentity(IDENTITY)
    const result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.hasSnapshot).toBe(true)
    expect(result.isFresh).toBe(true)
    expect(result.receivedAt).toBeGreaterThan(0)
    expect(result.suggestions).toEqual([
      {
        atomKind: 'model',
        atomKey: 'claude-opus-5',
        label: 'Claude Opus 5',
        kind: 'missing_from_authored',
        tokenShare: 1,
        // The price line the card shows; absent when the client withheld cost.
        apiEquivalentUSD: 12.34,
      },
    ])
  })

  test('reports an old snapshot as present but not fresh', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })
    await t.run(async (ctx) => {
      const row = await ctx.db.query('measuredSnapshots').first()
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

  test('addMeasuredModel appends once, primary first, and clears the suggestion', async () => {
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
      await ctx.db.insert('models', {
        name: 'Claude Haiku 4.5',
        slug: 'claude-haiku-4-5',
        shortId: 'mhaiku',
        provider: 'anthropic',
        category: 'language',
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })
    await t.mutation(internal.measured.publishSnapshot, { stackId, payload: payload() })
    const asOwner = t.withIdentity(IDENTITY)

    await asOwner.mutation(api.measured.addMeasuredModel, {
      stackId,
      modelSlug: 'claude-opus-5',
    })
    // Idempotent: the same answer twice is one row.
    await asOwner.mutation(api.measured.addMeasuredModel, {
      stackId,
      modelSlug: 'claude-opus-5',
    })
    await asOwner.mutation(api.measured.addMeasuredModel, {
      stackId,
      modelSlug: 'claude-haiku-4-5',
    })

    const stack = await t.run((ctx) => ctx.db.get(stackId))
    expect(stack!.modelSubscriptions).toEqual([
      { modelSlug: 'claude-opus-5', role: 'primary' },
      { modelSlug: 'claude-haiku-4-5', role: 'secondary' },
    ])

    const result = await asOwner.query(api.measured.getReconcileSuggestions, { stackId })
    expect(result.suggestions).toEqual([])
  })

  test('addMeasuredModel refuses a model the catalog does not carry', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await expect(
      t.withIdentity(IDENTITY).mutation(api.measured.addMeasuredModel, {
        stackId,
        modelSlug: 'gpt-9',
      }),
    ).rejects.toThrow(/not in the catalog/i)
  })

  test('the two writes into the authored layer are owner-only', async () => {
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
    await expect(
      asStranger.mutation(api.measured.addMeasuredModel, {
        stackId,
        modelSlug: 'claude-opus-5',
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
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
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
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
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
})

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

describe('gcSnapshots', () => {
  test('keeps everything inside the 90-day fine-grain window', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const now = Date.now()
    for (const offset of [0, 1 * DAY, 30 * DAY, 89 * DAY]) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ capturedAt: now - offset }),
      })
    }

    const result = await t.mutation(internal.measured.gcSnapshots, {})
    expect(result.deleted).toBe(0)
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(rows).toHaveLength(4)
  })

  test('beyond 90 days, thins to the last snapshot of each UTC day', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const oldDay = Date.UTC(2026, 0, 15)
    // Three syncs on one old day, plus one on the day after.
    for (const at of [
      oldDay + 1 * 3_600_000,
      oldDay + 5 * 3_600_000,
      oldDay + 20 * 3_600_000,
      oldDay + DAY + 2 * 3_600_000,
    ]) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ capturedAt: at }),
      })
    }
    // A recent row, so the newest-row guard is not what saves the old ones.
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: Date.now() }),
    })

    const result = await t.mutation(internal.measured.gcSnapshots, {})
    expect(result.deleted).toBe(2)

    const kept = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    const keptOnOldDay = kept
      .filter((r) => r.capturedAt >= oldDay && r.capturedAt < oldDay + DAY)
      .map((r) => r.capturedAt)
    expect(keptOnOldDay).toEqual([oldDay + 20 * 3_600_000])
    expect(kept).toHaveLength(3)
  })


  test('thins per SOURCE, so an old day keeps one row for each of them', async () => {
    // Grouping on (stack, day) alone kept ONE row for the whole day, so a stack
    // syncing two sources lost one of them the moment that day aged past 90.
    // The fold carries the newest reading of each source forward, so a deleted
    // seed does not leave a gap - it subtracts a source from every later point.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const oldDay = Date.UTC(2026, 0, 15)

    for (const at of [oldDay + 1 * 3_600_000, oldDay + 20 * 3_600_000]) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ capturedAt: at }),
        machine: 'laptop',
      })
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ capturedAt: at }),
        machine: 'vps',
      })
    }
    // Recent rows for both, so the newest-row guard is not what saves the old.
    for (const machine of ['laptop', 'vps']) {
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ capturedAt: Date.now() }),
        machine,
      })
    }

    await t.mutation(internal.measured.gcSnapshots, {})

    const kept = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    const onOldDay = kept.filter(
      (r) => r.capturedAt >= oldDay && r.capturedAt < oldDay + DAY,
    )
    expect(onOldDay.map((r) => r.machine).sort()).toEqual(['laptop', 'vps'])
    expect(onOldDay.every((r) => r.capturedAt === oldDay + 20 * 3_600_000)).toBe(
      true,
    )
  })

  test('never deletes the newest row of a machine that stopped syncing', async () => {
    // Per stack, the guard protected only the last machine to sync. A server
    // that went quiet would lose its last row and vanish from the trail.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const oldDay = Date.UTC(2026, 0, 15)

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: oldDay }),
      machine: 'vps',
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: oldDay + 3_600_000 }),
      machine: 'laptop',
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: Date.now() }),
      machine: 'laptop',
    })

    await t.mutation(internal.measured.gcSnapshots, {})

    const kept = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(kept.some((r) => r.machine === 'vps')).toBe(true)
  })

  test('keeps a superseded untagged row - it still seeds the older points', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const oldDay = Date.UTC(2026, 0, 15)

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: oldDay }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: Date.now() }),
      machine: 'laptop',
    })

    await t.mutation(internal.measured.gcSnapshots, {})

    const kept = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(kept.some((r) => r.machine === undefined)).toBe(true)
  })

  test('never deletes a stack’s newest row, however old it is', async () => {
    // "Current" is a query for this row - GC must not be able to empty the
    // measured layer of a stack that simply stopped syncing.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const ancient = Date.UTC(2025, 0, 1)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: ancient }),
    })

    const result = await t.mutation(internal.measured.gcSnapshots, {})
    expect(result.deleted).toBe(0)
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(rows).toHaveLength(1)
  })

  test('thins per stack, not globally', async () => {
    const t = convexTest(schema, modules)
    const a = await seedStack(t)
    const b = await seedStack(t, { userId: OTHER_USER })
    const oldDay = Date.UTC(2026, 0, 15)
    for (const stackId of [a.stackId, b.stackId]) {
      for (const at of [oldDay + 3_600_000, oldDay + 7_200_000]) {
        await t.mutation(internal.measured.publishSnapshot, {
          stackId,
          payload: payload({ capturedAt: at }),
        })
      }
      await t.mutation(internal.measured.publishSnapshot, {
        stackId,
        payload: payload({ capturedAt: Date.now() }),
      })
    }

    await t.mutation(internal.measured.gcSnapshots, {})
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    // Each stack keeps one old-day row + its recent row.
    expect(rows.filter((r) => r.stackId === a.stackId)).toHaveLength(2)
    expect(rows.filter((r) => r.stackId === b.stackId)).toHaveLength(2)
  })
})

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
      ctx.db.query('measuredSnapshots').first(),
    )
    expect(JSON.stringify(snapshot!.payload)).not.toContain('alp-river')
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
      await t.run((ctx) => ctx.db.query('measuredSnapshots').collect()),
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
      await t.run((ctx) => ctx.db.query('measuredSnapshots').collect()),
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

    const publicRead = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
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

    const result = await t.mutation(internal.measured.gcSnapshots, {})
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

    const result = await t.mutation(internal.measured.gcSnapshots, {})
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

  test('payloads[] lands one snapshot per harness, atomically, with the harness column', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    const result = await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payloads: [payload(), codexPayload()],
    })
    expect(result.snapshotIds).toHaveLength(2)

    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(rows.map((r) => r.harness).sort()).toEqual(['claude-code', 'codex'])
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
    expect(result.snapshotIds).toHaveLength(1)
  })

  test('a batch with no payloads is refused', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId })

    await expect(
      t.mutation(internal.measured.publishForToken, { tokenId, payloads: [] }),
    ).rejects.toThrow(/at least one payload/i)
  })

  test('the combined headline sums tokens/sessions and keeps per-harness sections', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload(), // claude: 1M tokens, 12 sessions, opus @ $12.34
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: codexPayload(), // codex: 500k tokens, 3 sessions, gpt-5.5 @ $2
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.activity.totalTokens).toBe(1_500_000)
    expect(current?.activity.sessions).toBe(15)
    // Day and project sets can overlap across harnesses: max, never a sum.
    expect(current?.activity.activeDays).toBe(9)
    expect(current?.activity.projects).toBe(3)
    // Both price tables cited.
    expect(current?.pricingTable).toContain('anthropic-list')
    expect(current?.pricingTable).toContain('openai-list')
    // Models merged by id with recomputed shares over summed absolute tokens.
    expect(current?.models.map((m) => m.id).sort()).toEqual([
      'claude-opus-5',
      'gpt-5.5',
    ])
    const shareSum = current?.models.reduce((a, m) => a + m.tokenShare, 0)
    expect(shareSum).toBeCloseTo(1, 6)
    // Per-harness sections keep their own inventory and freshness.
    expect(current?.harnesses.map((h) => h.harness.name)).toEqual([
      'claude-code',
      'codex',
    ])
    expect(current?.harnesses[0].inventory.builtinTools[0].name).toBe('Bash')
  })

  test('the newest snapshot of EACH harness wins, independently', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: 1000 }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: 2000,
        activity: { ...payload().activity, sessions: 42 },
      }),
    })
    // A codex snapshot OLDER than claude's newest must still appear.
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: codexPayload({ capturedAt: 500 }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.harnesses).toHaveLength(2)
    const claude = current?.harnesses.find((h) => h.harness.name === 'claude-code')
    expect(claude?.activity.sessions).toBe(42)
    expect(current?.activity.sessions).toBe(42 + 3)
  })

  test('a mixed priced/unpriced merged model drops its dollars rather than understating', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)

    // A model NO table can price, so the read-time gap filler cannot rescue the
    // silent half - which is the only way the halves still disagree after #93.
    // It happens when the syncing CLI ships a newer table than the server holds.
    const unpriceable = 'gpt-5.7-unreleased'
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        models: [
          {
            id: unpriceable,
            tokenShare: 1,
            apiEquivalentUSD: 12.34,
            tokens: { input: 1, output: 1, cacheWrite: 0, cacheRead: 0 },
          },
        ],
      }),
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: codexPayload({
        models: [
          {
            id: unpriceable, // same id, cost withheld on this side
            tokenShare: 1,
            tokens: { input: 1, output: 1, cacheWrite: 0, cacheRead: 0 },
          },
        ],
      }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.models).toHaveLength(1)
    expect(current?.models[0].apiEquivalentUSD).toBeUndefined()
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

  const withTokens = (totalTokens: number, sessions: number) => ({
    activity: { ...payload().activity, totalTokens, sessions },
  })

  test('stamps the machine from the TOKEN, never from the payload', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    const tokenId = await seedToken(t, { stackId, name: 'laptop' })

    await t.mutation(internal.measured.publishForToken, {
      tokenId,
      payload: payload(),
    })

    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
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

    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(rows[0].machine).toBeUndefined()
  })

  test('the second machine ADDS to the reading instead of replacing it', async () => {
    // The bug this ticket exists for: a VPS syncing its own small window used to
    // knock the laptop's whole reading off the page, because "current" keyed on
    // the harness name alone.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const laptop = await seedToken(t, { stackId, name: 'laptop' })
    const vps = await seedToken(t, { stackId, name: 'vps' })

    await t.mutation(internal.measured.publishForToken, {
      tokenId: laptop,
      payload: payload({ capturedAt: 1000, ...withTokens(4_000_000, 500) }),
    })
    await t.mutation(internal.measured.publishForToken, {
      tokenId: vps,
      payload: payload({ capturedAt: 2000, ...withTokens(4_000, 19) }),
    })

    const current = await t
      .withIdentity(IDENTITY)
      .query(api.measured.getCurrentByStackSlug, {
        slug: `my-stack-${shortId}`,
      })
    expect(current!.activity.totalTokens).toBe(4_004_000)
    expect(current!.activity.sessions).toBe(519)
    expect(current!.harnesses).toHaveLength(2)
    expect(current!.harnesses.map((h) => h.machine)).toEqual(['laptop', 'vps'])
  })

  test('one machine syncing twice still holds only its newest reading', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const laptop = await seedToken(t, { stackId, name: 'laptop' })

    await t.mutation(internal.measured.publishForToken, {
      tokenId: laptop,
      payload: payload({ capturedAt: 1000, ...withTokens(1_000_000, 10) }),
    })
    await t.mutation(internal.measured.publishForToken, {
      tokenId: laptop,
      payload: payload({ capturedAt: 2000, ...withTokens(1_200_000, 12) }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current!.activity.totalTokens).toBe(1_200_000)
    expect(current!.harnesses).toHaveLength(1)
  })

  test('relinking a machine keeps one bucket, because the key is the NAME', async () => {
    // Two tokens, one machine - which is what `aistack login` a second time
    // leaves behind. Keyed by token id the dead one would carry a stale reading
    // forward beside the live one, forever.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const oldToken = await seedToken(t, { stackId, name: 'laptop' })
    const newToken = await seedToken(t, { stackId, name: 'laptop' })

    await t.mutation(internal.measured.publishForToken, {
      tokenId: oldToken,
      payload: payload({ capturedAt: 1000, ...withTokens(9_000_000, 900) }),
    })
    await t.mutation(internal.measured.publishForToken, {
      tokenId: newToken,
      payload: payload({ capturedAt: 2000, ...withTokens(1_000_000, 10) }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current!.harnesses).toHaveLength(1)
    expect(current!.activity.totalTokens).toBe(1_000_000)
  })

  test('a tagged reading supersedes the untagged history of its harness', async () => {
    // No backfill can say which machine wrote a pre-tagging row, so an untagged
    // row counts as the whole harness. Summing it with a tagged one would count
    // the same sessions twice, and carry-forward never expires.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const laptop = await seedToken(t, { stackId, name: 'laptop' })

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: 1000, ...withTokens(4_000_000, 500) }),
    })
    await t.mutation(internal.measured.publishForToken, {
      tokenId: laptop,
      payload: payload({ capturedAt: 2000, ...withTokens(4_100_000, 510) }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current!.harnesses).toHaveLength(1)
    expect(current!.activity.totalTokens).toBe(4_100_000)
  })

  test('an untagged reading of ANOTHER harness survives beside a tagged one', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const laptop = await seedToken(t, { stackId, name: 'laptop' })

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({
        capturedAt: 1000,
        harness: { name: 'codex', version: '0.146.0' },
        ...withTokens(500_000, 5),
      }),
    })
    await t.mutation(internal.measured.publishForToken, {
      tokenId: laptop,
      payload: payload({ capturedAt: 2000, ...withTokens(1_000_000, 10) }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current!.activity.totalTokens).toBe(1_500_000)
    expect(current!.harnesses.map((h) => h.harness.name)).toEqual([
      'claude-code',
      'codex',
    ])
  })

  test('the trail states what was true then: untagged points keep their reading', async () => {
    // The eviction moves through time. A point taken before any machine
    // reported must still show the untagged reading, or the chart would rewrite
    // history every time a machine is named for the first time.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const laptop = await seedToken(t, { stackId, name: 'laptop' })
    const now = Date.now()

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: now - 3 * DAY, ...withTokens(4_000_000, 500) }),
    })
    await t.mutation(internal.measured.publishForToken, {
      tokenId: laptop,
      payload: payload({ capturedAt: now - DAY, ...withTokens(4_100_000, 510) }),
    })

    const history = await t
      .withIdentity(IDENTITY)
      .query(api.measured.getHistoryByStackSlug, {
        slug: `my-stack-${shortId}`,
      })
    expect(history!.points.map((p) => p.tokens)).toEqual([4_000_000, 4_100_000])
    expect(history!.points[0].harnesses[0].machine).toBeNull()
    expect(history!.points[1].harnesses[0].machine).toBe('laptop')
  })

  test('the trail sums two machines from the point the second one lands', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const laptop = await seedToken(t, { stackId, name: 'laptop' })
    const vps = await seedToken(t, { stackId, name: 'vps' })
    const now = Date.now()

    await t.mutation(internal.measured.publishForToken, {
      tokenId: laptop,
      payload: payload({ capturedAt: now - 2 * DAY, ...withTokens(1_000_000, 10) }),
    })
    await t.mutation(internal.measured.publishForToken, {
      tokenId: vps,
      payload: payload({ capturedAt: now - DAY, ...withTokens(4_000, 2) }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(history!.points.map((p) => p.tokens)).toEqual([1_000_000, 1_004_000])
  })

  test('the trail narrows by ordinal without returning a machine name', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    const laptop = await seedToken(t, { stackId, name: 'laptop' })
    const vps = await seedToken(t, { stackId, name: 'vps' })
    const now = Date.now()

    await t.mutation(internal.measured.publishForToken, {
      tokenId: laptop,
      payload: payload({ capturedAt: now - 2 * DAY, ...withTokens(1_000_000, 10) }),
    })
    await t.mutation(internal.measured.publishForToken, {
      tokenId: vps,
      payload: payload({ capturedAt: now - DAY, ...withTokens(4_000, 2) }),
    })

    const history = await t.query(api.measured.getHistoryByStackSlug, {
      slug: `my-stack-${shortId}`,
      machineOrdinal: 2,
    })
    expect(history!.machineOrdinal).toBe(2)
    expect(history!.points.map((p) => p.tokens)).toEqual([4_000])
    expect(history!.points[0].harnesses[0].machine).toBeNull()
  })

  test('the trail rejects nonpositive and fractional ordinals', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      machine: 'laptop',
      payload: payload(),
    })

    for (const machineOrdinal of [0, -1, 1.5]) {
      const history = await t.query(api.measured.getHistoryByStackSlug, {
        slug: `my-stack-${shortId}`,
        machineOrdinal,
      })
      expect(history).toBeNull()
    }
  })
})

describe('read-time repricing of unpriced OpenAI rows (#72)', () => {
  const codexPayload = (over: Record<string, unknown> = {}) =>
    payload({
      harness: { name: 'codex', version: '0.146.0' },
      pricingTable: 'openai-list-2026-08-01',
      models: [
        {
          id: 'gpt-5.6-sol',
          tokenShare: 1,
          // No apiEquivalentUSD: the 0.6.0 CLI had no rate for this id.
          tokens: {
            input: 1_000_000,
            output: 100_000,
            cacheWrite: 0,
            cacheRead: 400_000,
          },
        },
      ],
      excludedTokens: { unpriced: 1_500_000, synthetic: 0 },
      ...over,
    })

  test('prices a landed gpt-5.6-sol row and shrinks the unpriced counter', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: codexPayload(),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    // 1M in × $5 + 100k out × $30 + 400k cached × $0.50, per 1M.
    expect(current?.models[0].apiEquivalentUSD).toBeCloseTo(5 + 3 + 0.2, 6)
    expect(current?.models[0].costEstimated).toBe(true)
    const harness = current?.harnesses[0]
    expect(harness?.models[0].apiEquivalentUSD).toBeCloseTo(8.2, 6)
    expect(harness?.excludedTokens.unpriced).toBe(0)
    // The footer cites the table the dollars came from, and ONLY that one: the
    // payload's own table priced nothing here, so naming it would date a figure
    // it did not produce.
    expect(harness?.pricingTable).toBe('openai-list-2026-08-02')
    expect(current?.cost).toMatchObject({
      publishedUSD: 0,
      estimatedUSD: 8.2,
      lowerBoundUSD: 8.2,
      coverage: 1,
    })
  })

  test('publishes no cost at all when the owner turned cost off', async () => {
    const t = convexTest(schema, modules)
    // The FLAG is the gate, not the payload's silence (#93). This snapshot even
    // carries dollars, and they must not reach the page.
    const { stackId, shortId } = await seedStack(t, { publishCost: false })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: codexPayload({
        models: [
          {
            id: 'gpt-5.6-sol',
            tokenShare: 1,
            apiEquivalentUSD: 8.2,
            tokens: {
              input: 1_000_000,
              output: 100_000,
              cacheWrite: 0,
              cacheRead: 400_000,
            },
          },
        ],
      }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.models[0].apiEquivalentUSD).toBeUndefined()
    expect(current?.cost).toBeNull()
    expect(current?.harnesses[0].pricingTable).toBeNull()
    expect(current?.harnesses[0].excludedTokens.unpriced).toBe(1_500_000)
  })

  test('leaves an id no table can price unpriced', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: codexPayload({
        models: [
          {
            id: 'gpt-5.7-unreleased',
            tokenShare: 1,
            tokens: { input: 100, output: 10, cacheWrite: 0, cacheRead: 0 },
          },
        ],
        excludedTokens: { unpriced: 110, synthetic: 0 },
      }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.models[0].apiEquivalentUSD).toBeUndefined()
    expect(current?.harnesses[0].excludedTokens.unpriced).toBe(110)
    // Nothing was priced, so no table is cited and no cost block exists.
    expect(current?.harnesses[0].pricingTable).toBeNull()
    expect(current?.cost).toBeNull()
  })

  test('reports the share of tokens it could price', async () => {
    // The prod shape: a named model our table covers, beside `unknown`, which
    // no table can ever cover. The figure is a lower bound and says by how much.
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: codexPayload({
        models: [
          {
            id: 'gpt-5.6-sol',
            tokenShare: 0.8,
            tokens: {
              input: 8_000_000,
              output: 0,
              cacheWrite: 0,
              cacheRead: 0,
            },
          },
          {
            id: 'unknown',
            tokenShare: 0.2,
            tokens: {
              input: 2_000_000,
              output: 0,
              cacheWrite: 0,
              cacheRead: 0,
            },
          },
        ],
      }),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: `my-stack-${shortId}`,
    })
    expect(current?.cost?.coverage).toBeCloseTo(0.8, 6)
    expect(current?.cost?.pricedTokens).toBe(8_000_000)
    expect(current?.cost?.measuredTokens).toBe(10_000_000)
    expect(current?.cost?.lowerBoundUSD).toBeCloseTo(40, 6)
  })
})
