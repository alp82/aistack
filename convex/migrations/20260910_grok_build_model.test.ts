/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import { loadModelCatalog, resolveModelId } from '../lib/modelCatalog'
import schema from '../schema'

const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ])
)
const migration = internal.migrations['20260910_grok_build_model']

describe('Grok Build catalog model', () => {
  test('creates a distinct xAI model identity and is idempotent', async () => {
    const t = convexTest(schema, modules)
    expect(await t.mutation(migration.run, {})).toEqual({ inserted: true })
    await t.run(async (ctx) => {
      const catalog = await loadModelCatalog(ctx)
      expect(resolveModelId(catalog, 'grok-4.6-build')).toEqual({
        catalogSlug: 'grok-4.6-build',
        catalogName: 'Grok 4.6 Build',
      })
      expect(catalog.bySlug.get('grok-4.6-build')).toMatchObject({
        provider: 'xAI',
        category: 'coding',
        contextWindow: 500000,
      })
    })
    expect(await t.mutation(migration.run, {})).toEqual({ inserted: false })
    expect(
      await t.run((ctx) =>
        ctx.db
          .query('models')
          .withIndex('by_slug', (q) => q.eq('slug', 'grok-4.6-build'))
          .collect()
      )
    ).toHaveLength(1)
  })
})
