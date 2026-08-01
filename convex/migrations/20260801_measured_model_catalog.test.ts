/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import schema from '../schema'

// Same key remap every migrations test needs — see 20260725_cli_token_stack.
const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

const MIGRATION = internal.migrations['20260801_measured_model_catalog']

function modelRow(slug: string, name: string, aliases?: string[]) {
  return {
    name,
    slug,
    shortId: `sid-${slug}`.slice(0, 12),
    aliases,
    provider: 'Anthropic',
    category: 'coding' as const,
    reviewStatus: 'approved' as const,
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('20260801_measured_model_catalog', () => {
  test('adds aliases, inserts missing rows, and is idempotent', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', modelRow('fable-5', 'Fable 5'))
      await ctx.db.insert('models', modelRow('claude-opus-48', 'Claude Opus 4.8'))
      await ctx.db.insert('models', modelRow('claude-opus-5', 'Claude Opus 5'))
    })

    const first = await t.mutation(MIGRATION.run, {})
    expect(first.aliasesAdded.sort()).toEqual(['claude-fable-5', 'claude-opus-4-8'])
    expect(first.rowsInserted.sort()).toEqual(['claude-haiku-4-5', 'claude-sonnet-5'])

    // Every id in the owner's window now resolves the way resolveModels does:
    // slug first, then aliases.
    await t.run(async (ctx) => {
      const all = await ctx.db.query('models').collect()
      for (const id of [
        'claude-opus-5',
        'claude-fable-5',
        'claude-opus-4-8',
        'claude-sonnet-5',
        'claude-haiku-4-5',
        'claude-sonnet-4-6',
      ]) {
        const match =
          all.find((r) => r.slug === id) ??
          all.find((r) => r.aliases?.includes(id))
        // claude-sonnet-4-6 is not seeded here; on prod it resolves by slug.
        if (id === 'claude-sonnet-4-6') continue
        expect(match, id).toBeTruthy()
      }
    })

    const second = await t.mutation(MIGRATION.run, {})
    expect(second.aliasesAdded).toEqual([])
    expect(second.rowsInserted).toEqual([])
    expect(second.skipped.sort()).toEqual([
      'claude-fable-5',
      'claude-haiku-4-5',
      'claude-opus-4-8',
      'claude-sonnet-5',
    ])
  })

  test('inserts fallback rows under the vendor id when the alias target row is missing', async () => {
    const t = convexTest(schema, modules)
    const first = await t.mutation(MIGRATION.run, {})
    expect(first.aliasesAdded).toEqual([])
    expect(first.rowsInserted.sort()).toEqual([
      'claude-fable-5',
      'claude-haiku-4-5',
      'claude-opus-4-8',
      'claude-sonnet-5',
    ])

    const second = await t.mutation(MIGRATION.run, {})
    expect(second.rowsInserted).toEqual([])
    expect(second.aliasesAdded).toEqual([])
  })

  test('skips an alias that some other row already resolves', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert(
        'models',
        modelRow('fable-5', 'Fable 5', ['claude-fable-5']),
      )
    })
    const result = await t.mutation(MIGRATION.run, {})
    expect(result.aliasesAdded).toEqual([])
    expect(result.skipped).toContain('claude-fable-5')
    await t.run(async (ctx) => {
      const row = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', 'fable-5'))
        .first()
      expect(row?.aliases).toEqual(['claude-fable-5'])
    })
  })
})
