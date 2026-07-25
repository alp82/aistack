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
  async function seedStackWithTool(t: Ctx, usageLabel: string) {
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
            primaryUsageLabel: usageLabel,
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
    expect(result.suggestions).toEqual([
      {
        atomKind: 'tool',
        atomKey: 'cursor',
        label: 'Cursor',
        kind: 'missing_what_for',
      },
    ])
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
    expect(result.suggestions).toEqual([
      {
        atomKind: 'model',
        atomKey: 'claude-opus-5',
        label: 'Claude Opus 5',
        kind: 'missing_from_authored',
        tokenShare: 1,
      },
    ])
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
    expect(config).toEqual({ publishCost: true, stackName: 'My Stack' })
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
      stack: null
    }
    expect(body.allowlist.skills).toContain('grilling')
    expect(body.publishCost).toBe(false)
    expect(body.stack).toBeNull()
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
