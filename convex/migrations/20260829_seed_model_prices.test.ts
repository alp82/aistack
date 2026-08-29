/// <reference types="vite/client" />
import { bundledPriceTable, PRICED_LANES } from '@aistack/pricing'
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import schema from '../schema'

const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ])
)

const MIGRATION = internal.migrations['20260829_seed_model_prices']

describe('20260829_seed_model_prices', () => {
  test('seeds every bundled period except the priced lanes and fast variants, idempotently', async () => {
    const t = convexTest(schema, modules)
    const bundled = bundledPriceTable().rows
    const expected = bundled.filter(
      (r) => !PRICED_LANES.has(r.modelSlug) && !r.modelSlug.includes('#')
    )

    const first = await t.mutation(MIGRATION.run, {})
    expect(first.inserted).toBe(expected.length)
    expect(first.skipped).toBe(0)
    expect(first.left.sort()).toEqual(
      ['claude-opus-4-8#fast', 'claude-opus-5#fast', 'codex-auto-review'].sort()
    )

    await t.run(async (ctx) => {
      const rows = await ctx.db.query('modelPrices').collect()
      expect(rows).toHaveLength(expected.length)
      const sonnet = rows
        .filter((r) => r.modelSlug === 'claude-sonnet-5')
        .sort((a, b) => a.from - b.from)
      expect(sonnet.map((r) => [r.input, r.output, r.source])).toEqual([
        [2, 10, 'anthropic-list-2026-07-25'],
        [3, 15, 'anthropic-list-2026-07-25'],
      ])
      // Cache tiers are absolute (decision 4): Anthropic 0.1x / 1.25x / 2x of $5.
      const opus = rows.find((r) => r.modelSlug === 'claude-opus-5')
      expect(opus).toMatchObject({ cacheRead: 0.5, cacheWrite5m: 6.25, cacheWrite1h: 10 })
      // Google writes at the input rate, never Anthropic's premium.
      const flash = rows.find((r) => r.modelSlug === 'gemini-2.5-flash')
      expect(flash).toMatchObject({ input: 0.3, cacheWrite5m: 0.3, cacheWrite1h: 0.3 })
      expect(rows.every((r) => r.provider === undefined)).toBe(true)
    })

    const second = await t.mutation(MIGRATION.run, {})
    expect(second.inserted).toBe(0)
    expect(second.skipped).toBe(expected.length)
  })
})
