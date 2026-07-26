/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

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
  opts: { userId?: string; published?: boolean; name?: string } = {},
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
    // capturedAt is NOT clamped to the server clock — the divergence is signal.
    expect(rows[0].capturedAt).toBe(clientClock)
    expect(rows[0].receivedAt).toBe(result.receivedAt)
  })

  test('appends rather than replacing — history is the point', async () => {
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

describe('publishSnapshot — string bounds on the payload', () => {
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
    await t.run((ctx) =>
      ctx.db.insert('cliTokens', {
        token,
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
    // A broken client, so 400 with the reason — not an opaque 500.
    expect(resp.status).toBe(400)
    expect(JSON.stringify(await resp.json())).toMatch(/inventory\.mcpServers/)
    const rows = await t.run((ctx) => ctx.db.query('measuredSnapshots').collect())
    expect(rows).toHaveLength(0)
  })
})

describe('publishForToken — the destination comes from the token', () => {
  async function seedToken(
    t: Ctx,
    opts: { stackId?: Id<'stacks'>; userId?: string } = {},
  ) {
    return await t.run(async (ctx) =>
      ctx.db.insert('cliTokens', {
        token: `tok_${Math.random().toString(36).slice(2)}`,
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
  test('returns the newest snapshot by capturedAt, not by insertion order', async () => {
    const t = convexTest(schema, modules)
    const { stackId, shortId } = await seedStack(t)

    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payload({ capturedAt: 5000, activity: { ...payload().activity, sessions: 1 } }),
    })
    // Inserted second but OLDER — must not win.
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

    // Add the model to the catalog. The SAME immutable snapshot now resolves —
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
   * `whatFor` seeds `toolSubscriptions[].description` — the field the tool card
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
    // The overlap is catalog slugs only — an unresolved id has nowhere to land.
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

    // A new sync must not resurrect it — there is no pending state to merge.
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
    const { stackId } = await seedStack(t)
    const config = await t.query(internal.measured.getSyncConfigForStack, { stackId })
    expect(config).toEqual({
      publishCost: true,
      stackName: 'My Stack',
      optIns: EMPTY_OPT_INS,
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
    await t.run((ctx) =>
      ctx.db.insert('cliTokens', {
        token,
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
    await t.run(async (ctx) => {
      const row = await ctx.db
        .query('cliTokens')
        .withIndex('by_token', (q) => q.eq('token', token))
        .first()
      await ctx.db.patch(row!._id, { lastUsedAt: 0 })
    })

    await post(t, { payload: payload() }, token)
    const row = await t.run(async (ctx) =>
      ctx.db
        .query('cliTokens')
        .withIndex('by_token', (q) => q.eq('token', token))
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
    await t.run((ctx) =>
      ctx.db.insert('cliTokens', {
        token,
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
    // A tick does not widen the curated list — the two are separate on the
    // wire and the client unions them before its own fail-closed filter.
    expect(body.allowlist.skills).not.toContain('alp-river:crossfire')
  })

  test('adds the bound stack’s cost preference and name with a valid bearer', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t, { name: 'Owner Stack' })
    const token = `tok_${Math.random().toString(36).slice(2)}`
    await t.run((ctx) =>
      ctx.db.insert('cliTokens', {
        token,
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

  test('never deletes a stack’s newest row, however old it is', async () => {
    // "Current" is a query for this row — GC must not be able to empty the
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
