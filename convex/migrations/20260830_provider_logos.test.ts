import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import schema from '../schema'

const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

describe('20260830_provider_logos', () => {
  test('points every known-provider model at its models.dev logo, once', async () => {
    const t = convexTest(schema, modules)
    const now = 1_700_000_000_000
    await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(['x']))
      await ctx.db.insert('models', {
        name: 'GPT-5.4', slug: 'gpt-5.4', shortId: 'gpt54', provider: 'OpenAI', category: 'coding',
        reviewStatus: 'approved', iconStorageId: storageId, iconUrl: 'https://example.com/old.png',
        createdAt: now, updatedAt: now,
      })
      await ctx.db.insert('models', {
        name: 'GPT-5.6', slug: 'gpt-5.6', shortId: 'gpt56', provider: 'OpenAI', category: 'coding',
        reviewStatus: 'pending', iconUrl: 'https://models.dev/logos/openai.svg', createdAt: now, updatedAt: now,
      })
      await ctx.db.insert('models', {
        name: 'Mystery', slug: 'mystery', shortId: 'myst', provider: 'Nobody', category: 'other',
        reviewStatus: 'approved', iconUrl: 'https://example.com/keep.png', createdAt: now, updatedAt: now,
      })
    })
    const first = await t.mutation(internal.migrations['20260830_provider_logos'].run, {})
    expect(first).toEqual({ patched: 1, skipped: 1, unknown: ['mystery'] })
    const rows = await t.run(async (ctx) => ctx.db.query('models').collect())
    const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]))
    expect(bySlug['gpt-5.4'].iconUrl).toBe('https://models.dev/logos/openai.svg')
    expect(bySlug['gpt-5.4'].iconStorageId).toBeUndefined()
    expect(bySlug.mystery.iconUrl).toBe('https://example.com/keep.png')
    const second = await t.mutation(internal.migrations['20260830_provider_logos'].run, {})
    expect(second).toEqual({ patched: 0, skipped: 2, unknown: ['mystery'] })
  })
})
