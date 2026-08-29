/// <reference types="vite/client" />
import { parsePriceTable } from '@aistack/pricing'
import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

describe('GET /api/prices (#336)', () => {
  it('serves the modelPrices rows with a table id, in the shape the CLI parses', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'Gemini X',
        slug: 'gemini-x',
        shortId: 'gemx',
        provider: 'Google',
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: 1,
        updatedAt: 1,
      })
      await ctx.db.insert('modelPrices', {
        modelSlug: 'gemini-x',
        from: 0,
        input: 1,
        output: 4,
        cacheRead: 0.1,
        source: 'models.dev-2026-08-29',
        createdAt: 1,
      })
    })
    const res = await t.fetch('/api/prices')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = await res.json()
    expect(body.id).toMatch(/^modelPrices\/1-[0-9a-f]{8}$/)
    expect(body.rows).toEqual([
      {
        modelSlug: 'gemini-x',
        from: 0,
        input: 1,
        output: 4,
        cacheRead: 0.1,
        source: 'models.dev-2026-08-29',
        vendor: 'google',
      },
    ])
    expect(parsePriceTable(body)?.rows).toHaveLength(1)
  })

  it('serves an empty table when nothing is seeded yet', async () => {
    const t = convexTest(schema, modules)
    const body = await (await t.fetch('/api/prices')).json()
    expect(body.rows).toEqual([])
  })
})
