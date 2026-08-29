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

const MIGRATION = internal.migrations['20260829_vendor_model_ids']

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

describe('20260829_vendor_model_ids', () => {
  test('renames slugs, rewrites picks and dismissals, drops the duplicate and the dangling pick', async () => {
    const t = convexTest(schema, modules)
    const stackId = await t.run(async (ctx) => {
      await ctx.db.insert('models', modelRow('fable-5', 'Fable 5', ['claude-fable-5']))
      await ctx.db.insert('models', modelRow('claude-opus-48', 'Opus 4.8', ['claude-opus-4-8']))
      await ctx.db.insert('models', modelRow('opus-48', 'Opus 4.8 (dup)'))
      await ctx.db.insert('models', modelRow('gpt-5.4', 'GPT-5.4', ['gpt-54']))
      // Already carries the new slug: the rename is refused, picks still move.
      await ctx.db.insert('models', modelRow('gpt-5.2', 'GPT-5.2'))
      await ctx.db.insert('models', modelRow('gpt-5-2', 'GPT 5.2 (old)'))
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
          { modelSlug: 'fable-5', role: 'primary' },
          { modelSlug: 'claude-opus-48', role: 'secondary' },
          { modelSlug: 'gpt-5-2', role: 'secondary' },
          { modelSlug: 'gpt-5.2', role: 'secondary' },
          { modelSlug: 'qwen3.5-9b-(local)-4q', role: 'specialized' },
          { modelSlug: 'gpt-5.4', role: 'primary' },
        ],
        hasUsageComponent: false,
        published: true,
        createdAt: 1,
        updatedAt: 1,
      })
      await ctx.db.insert('reconcileDismissals', {
        stackId,
        atomKind: 'model',
        atomKey: 'fable-5',
        dismissedAt: 1,
      })
      return stackId
    })

    const first = await t.mutation(MIGRATION.run, {})
    expect(first.renamed).toEqual([
      'claude-opus-48 -> claude-opus-4-8',
      'fable-5 -> claude-fable-5',
    ])
    expect(first.skipped).toContain('gpt-5-2: gpt-5.2 already exists')
    expect(first.deleted).toEqual(['opus-48'])
    expect(first.stacksRewritten).toBe(1)
    expect(first.dismissalsRewritten).toBe(1)

    await t.run(async (ctx) => {
      const rows = await ctx.db.query('models').collect()
      expect(rows.map((r) => r.slug).sort()).toEqual([
        'claude-fable-5',
        'claude-opus-4-8',
        'gpt-5-2',
        'gpt-5.2',
        'gpt-5.4',
      ])
      // An alias that became the slug is gone; an unrelated alias stays.
      expect(rows.find((r) => r.slug === 'claude-fable-5')?.aliases).toBeUndefined()
      expect(rows.find((r) => r.slug === 'claude-opus-4-8')?.aliases).toBeUndefined()
      expect(rows.find((r) => r.slug === 'gpt-5.4')?.aliases).toEqual(['gpt-54'])
      const stack = await ctx.db.get(stackId)
      expect(stack?.modelSubscriptions).toEqual([
        { modelSlug: 'claude-fable-5', role: 'primary' },
        { modelSlug: 'claude-opus-4-8', role: 'secondary' },
        { modelSlug: 'gpt-5.2', role: 'secondary' },
        { modelSlug: 'gpt-5.4', role: 'primary' },
      ])
      const dismissals = await ctx.db.query('reconcileDismissals').collect()
      expect(dismissals.map((d) => d.atomKey)).toEqual(['claude-fable-5'])
    })

    const second = await t.mutation(MIGRATION.run, {})
    expect(second.renamed).toEqual([])
    expect(second.deleted).toEqual([])
    expect(second.stacksRewritten).toBe(0)
    expect(second.dismissalsRewritten).toBe(0)
  })
})
