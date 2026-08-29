/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import { ADMIN_EMAILS } from './lib/admin'
import { LITELLM_URL, MODELS_DEV_URL } from './lib/modelImport'
import { measuredIdsWithTokens } from './modelImport'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

function asAdmin(t: ReturnType<typeof convexTest>) {
  return t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })
}

function stubFetch(pages: Record<string, unknown | { status: number }>) {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push(url)
      const page = pages[url]
      if (page === undefined) return new Response('missing', { status: 404 })
      if (typeof page === 'object' && page !== null && 'status' in page && Object.keys(page).length === 1) {
        return new Response('refused', { status: (page as { status: number }).status })
      }
      return new Response(JSON.stringify(page), { status: 200 })
    })
  )
  return calls
}

afterEach(() => vi.unstubAllGlobals())

const MODELS_DEV = {
  anthropic: {
    id: 'anthropic',
    models: {
      'claude-opus-4-7': {
        id: 'claude-opus-4-7',
        name: 'Claude Opus 4.7',
        release_date: '2026-04-14',
        modalities: { input: ['text'], output: ['text'] },
        limit: { context: 1000000 },
        cost: { input: 5, output: 25, cache_read: 0.5, cache_write: 6.25 },
      },
    },
  },
  openai: {
    id: 'openai',
    models: {
      'gpt-5.6-sol': {
        id: 'gpt-5.6-sol',
        name: 'GPT-5.6 Sol',
        release_date: '2026-07-29',
        modalities: { input: ['text'], output: ['text'] },
        cost: { input: 4, output: 20, cache_read: 0.4 },
      },
    },
  },
}

async function seed(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    const now = 1
    for (const [slug, provider] of [
      ['claude-opus-4-7', 'Anthropic'],
      ['gpt-5.6-sol', 'OpenAI'],
    ] as const) {
      await ctx.db.insert('models', {
        name: slug,
        slug,
        shortId: slug.slice(0, 6),
        provider,
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: now,
        updatedAt: now,
      })
    }
    await ctx.db.insert('modelPrices', {
      modelSlug: 'claude-opus-4-7',
      from: 0,
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
      cacheWrite1h: 10,
      source: 'anthropic-list-2026-07-25',
      createdAt: now,
    })
    await ctx.db.insert('modelPrices', {
      modelSlug: 'gpt-5.6-sol',
      from: 0,
      input: 5,
      output: 30,
      source: 'openai-list-2026-08-02',
      createdAt: now,
    })
  })
}

describe('modelImport (#337)', () => {
  test('an unchanged rate writes nothing but the run line', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    await t.run(async (ctx) => {
      // Make Sol match the dataset so the whole run is a no-op.
      const sol = await ctx.db
        .query('modelPrices')
        .withIndex('by_model', (q) => q.eq('modelSlug', 'gpt-5.6-sol'))
        .first()
      await ctx.db.patch(sol!._id, { input: 4, output: 20, cacheRead: 0.4 })
    })
    stubFetch({ [MODELS_DEV_URL]: MODELS_DEV })

    const result = await t.action(internal.modelImport.run, {})
    expect(result).toMatchObject({ periods: 0, models: 0 })
    expect(result.source).toMatch(/^models\.dev@\d{4}-\d{2}-\d{2}$/)

    await t.run(async (ctx) => {
      expect(await ctx.db.query('modelPrices').collect()).toHaveLength(2)
      expect(await ctx.db.query('models').collect()).toHaveLength(2)
      const log = await ctx.db.query('importLog').collect()
      expect(log.map((l) => l.kind)).toEqual(['run'])
      expect(log[0].detail).toMatch(/0 price changes, 0 new pending rows/)
    })
  })

  test('a changed rate appends a period dated to the run and logs it', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    stubFetch({ [MODELS_DEV_URL]: MODELS_DEV })
    const before = Date.now()

    const result = await t.action(internal.modelImport.run, {})
    expect(result).toMatchObject({ periods: 1, models: 0 })

    await t.run(async (ctx) => {
      const sol = await ctx.db
        .query('modelPrices')
        .withIndex('by_model', (q) => q.eq('modelSlug', 'gpt-5.6-sol'))
        .collect()
      expect(sol).toHaveLength(2)
      const added = sol.find((p) => p.from !== 0)!
      expect(added.from).toBeGreaterThanOrEqual(before)
      expect(added).toMatchObject({ input: 4, output: 20, cacheRead: 0.4, source: result.source })
      expect(added.provider).toBeUndefined()
      const log = await ctx.db.query('importLog').collect()
      expect(log.map((l) => l.kind).sort()).toEqual(['price', 'run'])
      const line = log.find((l) => l.kind === 'price')!
      expect(line.modelSlug).toBe('gpt-5.6-sol')
      expect(line.detail).toBe(`$5/$30 -> $4/$20, read $0.4 (${result.source})`)
    })

    // The same dataset again: nothing more.
    const again = await t.action(internal.modelImport.run, {})
    expect(again).toMatchObject({ periods: 0, models: 0 })
  })

  test('creates pending rows for a new dataset model and for a measured id, never for the review lane', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    await t.run(async (ctx) => {
      const creatorId = await ctx.db.insert('creators', {
        name: 'Owner',
        slug: 'owner',
        userId: 'user_1',
        verified: false,
        personalPages: [],
        projectPages: [],
        createdAt: 1,
      })
      const stackId = await ctx.db.insert('stacks', {
        name: 'S',
        slug: 's',
        shortId: 'ssssss',
        creatorId,
        oneLiner: 'A stack',
        toolSubscriptions: [],
        hasUsageComponent: false,
        published: true,
        createdAt: 1,
        updatedAt: 1,
      } as never)
      const usage = (models: Array<[string, number]>) => ({
        harnesses: [
          {
            harness: 'codex',
            sessions: 1,
            projectKeys: [],
            models: models.map(([model, input]) => ({
              model,
              tokens: { input, output: 0, cacheWrite: 0, cacheRead: 0 },
            })),
            subagentTokens: 0,
            excludedTokens: { unpriced: 0, synthetic: 0 },
          },
        ],
      })
      await ctx.db.insert('measuredDays', {
        stackId,
        machine: 'laptop',
        date: '2026-08-28',
        capturedAt: 1,
        receivedAt: 1,
        aggregateVersion: 'measured-days/v1',
        fingerprint: 'a',
        usage: usage([
          ['codex-auto-review', 100],
          ['openai-codex:gpt-daybreak-blue', 7],
          ['opencode-go:glm-5.2', 0],
          ['claude-opus-4-7', 50],
        ]),
      })
    })
    stubFetch({
      [MODELS_DEV_URL]: {
        ...MODELS_DEV,
        minimax: {
          id: 'minimax',
          models: {
            'MiniMax-M2.7': {
              id: 'MiniMax-M2.7',
              name: 'MiniMax M2.7',
              release_date: '2026-08-01',
              modalities: { input: ['text'], output: ['text'] },
              limit: { context: 204800 },
              cost: { input: 0.3, output: 1.2, cache_read: 0.06, cache_write: 0.375 },
            },
          },
        },
      },
    })

    const result = await t.action(internal.modelImport.run, {})
    expect(result).toMatchObject({ periods: 1, models: 2 })

    await t.run(async (ctx) => {
      const pending = await ctx.db
        .query('models')
        .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
        .collect()
      expect(pending.map((m) => m.slug).sort()).toEqual(['gpt-daybreak-blue', 'minimax-m2.7'])
      const mm = pending.find((m) => m.slug === 'minimax-m2.7')!
      expect(mm).toMatchObject({
        name: 'MiniMax M2.7',
        provider: 'MiniMax',
        aliases: ['MiniMax-M2.7'],
        iconUrl: 'https://models.dev/logos/minimax.svg',
        contextWindow: 204800,
        createdBy: 'import',
      })
      expect(mm.shortId).toHaveLength(6)
      const bare = pending.find((m) => m.slug === 'gpt-daybreak-blue')!
      expect(bare.provider).toBe('unknown')
      expect(bare.iconUrl).toBeUndefined()
      const mmPrices = await ctx.db
        .query('modelPrices')
        .withIndex('by_model', (q) => q.eq('modelSlug', 'minimax-m2.7'))
        .collect()
      expect(mmPrices).toHaveLength(1)
      expect(mmPrices[0]).toMatchObject({ input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite5m: 0.375 })
      const all = await ctx.db.query('models').collect()
      expect(all.some((m) => m.slug === 'codex-auto-review')).toBe(false)
      expect(all.some((m) => m.slug === 'glm-5.2')).toBe(false)
      const log = await ctx.db.query('importLog').collect()
      expect(log.filter((l) => l.kind === 'model').map((l) => l.modelSlug).sort()).toEqual([
        'gpt-daybreak-blue',
        'minimax-m2.7',
      ])
    })

    // A second run creates nothing more.
    const again = await t.action(internal.modelImport.run, {})
    expect(again).toMatchObject({ periods: 0, models: 0 })
  })

  test('falls back to LiteLLM when models.dev does not answer, and cites it', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const calls = stubFetch({
      [MODELS_DEV_URL]: { status: 503 },
      [LITELLM_URL]: {
        'gpt-5.6-sol': {
          litellm_provider: 'openai',
          mode: 'chat',
          input_cost_per_token: 0.000004,
          output_cost_per_token: 0.00002,
        },
      },
    })
    const result = await t.action(internal.modelImport.run, {})
    expect(calls).toEqual([MODELS_DEV_URL, LITELLM_URL])
    expect(result.source).toMatch(/^litellm@/)
    expect(result).toMatchObject({ periods: 1, models: 0 })
  })

  test('a run whose datasets both fail writes an error line and throws', async () => {
    const t = convexTest(schema, modules)
    stubFetch({})
    await expect(t.action(internal.modelImport.run, {})).rejects.toThrow(/HTTP 404/)
    await t.run(async (ctx) => {
      const log = await ctx.db.query('importLog').collect()
      expect(log.map((l) => l.kind)).toEqual(['error'])
    })
  })

  test('runNow and readLog are admin-only', async () => {
    const t = convexTest(schema, modules)
    stubFetch({ [MODELS_DEV_URL]: MODELS_DEV })
    await expect(t.action(api.modelImport.runNow, {})).rejects.toThrow(/Unauthorized/)
    expect(await t.query(api.modelImport.readLog, {})).toBeNull()

    const admin = asAdmin(t)
    const result = await admin.action(api.modelImport.runNow, {})
    expect(result.source).toMatch(/^models\.dev@/)
    const log = await admin.query(api.modelImport.readLog, {})
    expect(log?.map((l) => l.kind)).toContain('run')
  })
})

describe('measuredIdsWithTokens', () => {
  test('keeps an id only when a day holds tokens for it', () => {
    const day = (models: Array<[string, number]>) => ({
      usage: {
        harnesses: [
          {
            models: models.map(([model, n]) => ({
              model,
              tokens: { input: 0, output: 0, cacheWrite: 0, cacheRead: n },
            })),
          },
        ],
      },
    })
    expect(measuredIdsWithTokens([day([['a', 0], ['b', 1]]), day([['a', 2]]), {}])).toEqual(['a', 'b'])
  })
})
