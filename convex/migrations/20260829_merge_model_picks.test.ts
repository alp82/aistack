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

const MIGRATION = internal.migrations['20260829_merge_model_picks']

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

async function seed(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    await ctx.db.insert('models', modelRow('claude-fable-5', 'Fable 5'))
    await ctx.db.insert('models', modelRow('claude-opus-5', 'Opus 5', ['claude-opus-50']))
    await ctx.db.insert('models', modelRow('gpt-5.4', 'GPT-5.4'))
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
        // Still on the #334 rename map: the vendor-id migration did not run.
        { modelSlug: 'fable-5', role: 'primary', description: 'daily driver' },
        // An alias of a row becomes the row's slug.
        { modelSlug: 'claude-opus-50', role: 'secondary' },
        // A duplicate of the first after the rename.
        { modelSlug: 'claude-fable-5', role: 'secondary' },
        // Names no row anywhere.
        { modelSlug: 'nope-1', role: 'specialized' },
        { modelSlug: 'gpt-5.4', role: 'secondary' },
      ],
      hasUsageComponent: false,
      published: true,
      createdAt: 1,
      updatedAt: 1,
    })
    const untouchedId = await ctx.db.insert('stacks', {
      name: 'U',
      slug: 'u',
      shortId: 'sid-u',
      creatorId,
      oneLiner: 'Already merged',
      toolSubscriptions: [],
      modelSubscriptions: [{ modelSlug: 'gpt-5.4' }],
      hasUsageComponent: false,
      published: true,
      createdAt: 1,
      updatedAt: 1,
    })
    return { stackId, untouchedId }
  })
}

describe('20260829_merge_model_picks', () => {
  test('drops role, renames, dedupes and drops picks with no row', async () => {
    const t = convexTest(schema, modules)
    const { stackId, untouchedId } = await seed(t)

    const result = await t.mutation(MIGRATION.run, {})

    expect(result.stacksRewritten).toBe(1)
    expect(result.picksDropped).toEqual(['s: nope-1'])
    expect(result.picksRenamed).toEqual(['s: fable-5 -> claude-fable-5', 's: claude-opus-50 -> claude-opus-5'])
    const stack = await t.run((ctx) => ctx.db.get(stackId))
    expect(stack?.modelSubscriptions).toEqual([
      { modelSlug: 'claude-fable-5', description: 'daily driver' },
      { modelSlug: 'claude-opus-5' },
      { modelSlug: 'gpt-5.4' },
    ])
    const untouched = await t.run((ctx) => ctx.db.get(untouchedId))
    expect(untouched?.modelSubscriptions).toEqual([{ modelSlug: 'gpt-5.4' }])
  })

  test('a second run changes nothing', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    await t.mutation(MIGRATION.run, {})
    const again = await t.mutation(MIGRATION.run, {})
    expect(again).toEqual({ stacksRewritten: 0, picksDropped: [], picksRenamed: [] })
  })
})
