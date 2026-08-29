/// <reference types="vite/client" />
import { BUNDLED_PRICE_TABLE_ID } from '@aistack/pricing'
import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import type { Doc } from '../_generated/dataModel'
import schema from '../schema'
import { catalogFrom, loadModelCatalog, resolveModelId } from './modelCatalog'

const modules = import.meta.glob('../**/*.{js,ts}')

const T1 = Date.UTC(2026, 6, 1)

function model(slug: string, over: Partial<Doc<'models'>> = {}): Doc<'models'> {
  return {
    _id: `models:${slug}` as Doc<'models'>['_id'],
    _creationTime: 1,
    name: slug,
    slug,
    shortId: slug.slice(0, 8),
    provider: 'Anthropic',
    category: 'coding',
    reviewStatus: 'approved',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }
}

function price(
  modelSlug: string,
  over: Partial<Doc<'modelPrices'>> = {}
): Doc<'modelPrices'> {
  return {
    _id: `modelPrices:${modelSlug}:${over.from ?? 0}` as Doc<'modelPrices'>['_id'],
    _creationTime: 1,
    modelSlug,
    from: 0,
    input: 7,
    output: 35,
    cacheRead: 0.7,
    cacheWrite5m: 8.75,
    cacheWrite1h: 14,
    source: 'test-src',
    createdAt: 1,
    ...over,
  }
}

describe('catalogFrom: the single read seam (ADR-0012 decision 13)', () => {
  it('prices from modelPrices first and cites the period source', () => {
    const c = catalogFrom([model('claude-opus-5')], [price('claude-opus-5')])
    expect(c.priceAt('claude-opus-5', null, T1)).toMatchObject({
      input: 7,
      source: 'test-src',
    })
    expect(c.pricer.tableFor('claude-opus-5')).toBe('test-src')
  })

  it('falls back to the bundled table for a key the table lacks', () => {
    const c = catalogFrom([], [])
    expect(c.priceAt('claude-opus-5', null, T1)?.input).toBe(5)
    expect(c.priceAt('codex-auto-review', null, T1)?.input).toBe(2.5)
    expect(c.pricer.tableIds).toEqual([c.priceTableId, BUNDLED_PRICE_TABLE_ID])
  })

  it('closes a period where the next one starts', () => {
    const c = catalogFrom(
      [],
      [
        price('m', { from: 0, input: 2, output: 10 }),
        price('m', { from: T1, input: 3, output: 15 }),
      ]
    )
    expect(c.priceAt('m', null, T1 - 1)?.input).toBe(2)
    expect(c.priceAt('m', null, T1)?.input).toBe(3)
  })

  it('takes the vendor from the catalog row so a vendor provider reaches the bare rate', () => {
    const c = catalogFrom(
      [model('gemini-x', { provider: 'Google' })],
      [price('gemini-x', { input: 1, output: 4 })]
    )
    expect(c.priceAt('gemini-x', 'google', T1)?.input).toBe(1)
    expect(c.priceAt('gemini-x', 'github-copilot', T1)).toBeNull()
    expect(c.priceAt('gemini-x', 'ollama', T1)?.source).toBe('local-no-charge')
    expect(c.priceRows[0].vendor).toBe('google')
  })

  it('serves the rows in the wire shape with a content-derived id', () => {
    const a = catalogFrom([], [price('m'), price('n')])
    const b = catalogFrom([], [price('n'), price('m')])
    expect(a.priceTableId).toBe(b.priceTableId)
    expect(a.priceRows).toHaveLength(2)
    expect(a.priceRows[0]).not.toHaveProperty('createdAt')
  })
})

describe('resolveModelId: the alias rules before lookup (ADR-0012 decision 6)', () => {
  const c = catalogFrom(
    [model('claude-opus-5'), model('gpt-5.4', { aliases: ['gpt-54'] })],
    []
  )

  it('strips the provider prefix, the fast suffix and a dated suffix', () => {
    expect(resolveModelId(c, 'anthropic:claude-opus-5').catalogSlug).toBe('claude-opus-5')
    expect(resolveModelId(c, 'claude-opus-5#fast').catalogSlug).toBe('claude-opus-5')
    expect(resolveModelId(c, 'claude-opus-5-20260101').catalogSlug).toBe('claude-opus-5')
  })

  it('matches the slug, then the stored aliases', () => {
    expect(resolveModelId(c, 'gpt-54').catalogSlug).toBe('gpt-5.4')
    expect(resolveModelId(c, 'openai:gpt-54').catalogSlug).toBe('gpt-5.4')
    expect(resolveModelId(c, 'unknown-9')).toEqual({ catalogSlug: null, catalogName: null })
  })
})

describe('loadModelCatalog', () => {
  it('collects both tables', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      const { _id, _creationTime, ...row } = model('claude-opus-5')
      await ctx.db.insert('models', row)
      const { _id: _p, _creationTime: _c, ...p } = price('claude-opus-5')
      await ctx.db.insert('modelPrices', p)
      const c = await loadModelCatalog(ctx)
      expect(c.bySlug.has('claude-opus-5')).toBe(true)
      expect(c.priceAt('claude-opus-5', null, T1)?.input).toBe(7)
    })
  })
})
