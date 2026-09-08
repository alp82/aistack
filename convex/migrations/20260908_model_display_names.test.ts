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
const migration = internal.migrations['20260908_model_display_names']

describe('model display name correction', () => {
  test('fixes alias resolution without changing identity and is idempotent', async () => {
    const t = convexTest(schema, modules)
    const id = await t.run((ctx) => ctx.db.insert('models', {
      slug: 'claude-fable-5',
      name: 'Fable 5',
      aliases: ['fable-5'],
      shortId: 'fable5',
      provider: 'Anthropic',
      category: 'coding',
      reviewStatus: 'approved',
      createdAt: 1,
      updatedAt: 1,
    }))
    const before = await t.run((ctx) => ctx.db.get(id))
    expect(await t.mutation(migration.run, {})).toEqual({ renamed: ['claude-fable-5'] })
    const after = await t.run((ctx) => ctx.db.get(id))
    expect(after).toEqual({ ...before, name: 'Claude Fable 5', updatedAt: expect.any(Number) })
    await t.run(async (ctx) => {
      const catalog = await loadModelCatalog(ctx)
      for (const key of ['claude-fable-5', 'fable-5', 'anthropic:claude-fable-5#fast']) {
        expect(resolveModelId(catalog, key)).toEqual({
          catalogSlug: 'claude-fable-5',
          catalogName: 'Claude Fable 5',
        })
      }
    })
    expect(await t.mutation(migration.run, {})).toEqual({ renamed: [] })
    expect(await t.run((ctx) => ctx.db.get(id))).toEqual(after)
  })

  test('does not create a row in an empty catalog', async () => {
    const t = convexTest(schema, modules)
    expect(await t.mutation(migration.run, {})).toEqual({ renamed: [] })
    expect(await t.run((ctx) => ctx.db.query('models').collect())).toEqual([])
  })
})
