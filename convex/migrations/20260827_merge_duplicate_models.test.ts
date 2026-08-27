/// <reference types="vite/client" />
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

const MIGRATION = internal.migrations['20260827_merge_duplicate_models']

function modelRow(slug: string, name: string, iconUrl?: string) {
  return {
    name,
    slug,
    shortId: `sid-${slug}`.slice(0, 12),
    iconUrl,
    provider: 'OpenAI',
    category: 'coding' as const,
    reviewStatus: 'approved' as const,
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('20260827_merge_duplicate_models', () => {
  test('merges pairs, rewrites stacks and dismissals, and is idempotent', async () => {
    const t = convexTest(schema, modules)
    const stackId = await t.run(async (ctx) => {
      await ctx.db.insert('models', modelRow('gpt-5.6-sol', 'GPT-5.6 Sol'))
      await ctx.db.insert('models', modelRow('gpt-56-sol', 'GPT 5.6 Sol', 'https://x/sol.png'))
      await ctx.db.insert('models', modelRow('gpt-5.5', 'GPT-5.5'))
      await ctx.db.insert('models', modelRow('gpt-55', 'GPT 5.5'))
      const creatorId = await ctx.db.insert('creators', {
        name: 'Owner',
        slug: 'owner',
        userId: 'user_owner',
        verified: false,
        personalPages: [],
        projectPages: [],
        createdAt: 1,
      })
      const stackId = await ctx.db.insert('stacks', {
        name: 'S',
        slug: 's',
        shortId: 'sid-s',
        creatorId,
        oneLiner: 'A stack',
        toolSubscriptions: [],
        modelSubscriptions: [
          { modelSlug: 'gpt-56-sol', role: 'primary' },
          { modelSlug: 'gpt-5.6-sol', role: 'secondary' },
          { modelSlug: 'gpt-55', role: 'secondary' },
          { modelSlug: 'fable-5', role: 'primary' },
        ],
        hasUsageComponent: false,
        published: true,
        createdAt: 1,
        updatedAt: 1,
      })
      await ctx.db.insert('reconcileDismissals', {
        stackId,
        atomKind: 'model',
        atomKey: 'gpt-55',
        dismissedAt: 1,
      })
      return stackId
    })

    const first = await t.mutation(MIGRATION.run, {})
    expect(first.merged).toEqual(['gpt-56-sol -> gpt-5.6-sol', 'gpt-55 -> gpt-5.5'])
    expect(first.stacksRewritten).toBe(1)
    expect(first.dismissalsRewritten).toBe(1)

    await t.run(async (ctx) => {
      const rows = await ctx.db.query('models').collect()
      expect(rows.map((r) => r.slug).sort()).toEqual(['gpt-5.5', 'gpt-5.6-sol'])
      const sol = rows.find((r) => r.slug === 'gpt-5.6-sol')
      expect(sol?.aliases).toEqual(['gpt-56-sol'])
      expect(sol?.iconUrl).toBe('https://x/sol.png')
      const stack = await ctx.db.get(stackId)
      // The first spelling keeps its slot and role; the duplicate is dropped.
      expect(stack?.modelSubscriptions).toEqual([
        { modelSlug: 'gpt-5.6-sol', role: 'primary' },
        { modelSlug: 'gpt-5.5', role: 'secondary' },
        { modelSlug: 'fable-5', role: 'primary' },
      ])
      const dismissals = await ctx.db.query('reconcileDismissals').collect()
      expect(dismissals.map((d) => d.atomKey)).toEqual(['gpt-5.5'])
    })

    const second = await t.mutation(MIGRATION.run, {})
    expect(second.merged).toEqual([])
    expect(second.stacksRewritten).toBe(0)
    expect(second.dismissalsRewritten).toBe(0)
  })
})
