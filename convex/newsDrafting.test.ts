/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

type Ctx = ReturnType<typeof convexTest>

async function seedItem(
  t: Ctx,
  overrides: Record<string, unknown> = {},
): Promise<Id<'newsItems'>> {
  const url = (overrides.url as string) ?? 'https://vendor.test/blog/thing'
  const result = await t.mutation(internal.news.insertItem, {
    url,
    headline: (overrides.headline as string) ?? 'A post',
    intake: 'collector',
    licenseClass: (overrides.licenseClass as any) ?? 'article',
    sourceText: overrides.sourceText as string | undefined,
    sourceId: overrides.sourceId as Id<'newsSources'> | undefined,
  })
  const itemId = result.itemId as Id<'newsItems'>
  const rest = { ...overrides }
  for (const key of [
    'url',
    'headline',
    'licenseClass',
    'sourceText',
    'sourceId',
  ]) {
    delete rest[key]
  }
  if (Object.keys(rest).length > 0) {
    await t.run(async (ctx: any) => ctx.db.patch(itemId, rest))
  }
  return itemId
}

async function seedTopic(t: Ctx, name: string, slug: string, order = 0) {
  return await t.run(async (ctx: any) =>
    ctx.db.insert('newsTopics', { name, slug, order, createdAt: Date.now() }),
  )
}

// ---------------------------------------------------------------------------
// The read step: what the drafting run is given
// ---------------------------------------------------------------------------

describe('undrafted', () => {
  test('an inbox item with no summary is work for the next run', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, { headline: 'Undrafted post' })

    const batch = await t.query(internal.newsDrafting.undrafted, {})

    expect(batch.items).toHaveLength(1)
    expect(batch.items[0].headline).toBe('Undrafted post')
  })

  test('an item that already carries a summary is done', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, { summary: 'Already written', draftedAt: 1 })

    const batch = await t.query(internal.newsDrafting.undrafted, {})

    expect(batch.items).toHaveLength(0)
  })

  test('an approved item with a blank summary returns to the next drafting run', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, { state: 'approved', summary: '   ' })

    const batch = await t.query(internal.newsDrafting.undrafted, {})

    expect(batch.items).toHaveLength(1)
  })

  test('the batch carries the topic list the skill picks from', async () => {
    const t = convexTest(schema, modules)
    await seedTopic(t, 'Agents', 'agents', 0)
    await seedTopic(t, 'Models', 'models', 1)

    const batch = await t.query(internal.newsDrafting.undrafted, {})

    expect(batch.topics.map((topic) => topic.slug)).toEqual([
      'agents',
      'models',
    ])
  })

  test('an item names its source and its license class', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await t.run(async (ctx: any) =>
      ctx.db.insert('newsSources', {
        name: 'codex releases',
        slug: 'codex-releases',
        kind: 'feed',
        url: 'https://github.test/codex/releases.atom',
        licenseClass: 'permissive-release-notes',
        attribution: 'openai/codex, Apache-2.0',
        enabled: true,
        collectFrom: 0,
        consecutiveFailures: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    )
    await seedItem(t, {
      sourceId,
      licenseClass: 'permissive-release-notes',
      sourceText: 'the release body',
    })

    const batch = await t.query(internal.newsDrafting.undrafted, {})

    expect(batch.items[0].sourceName).toBe('codex releases')
    expect(batch.items[0].licenseClass).toBe('permissive-release-notes')
    expect(batch.items[0].attribution).toBe('openai/codex, Apache-2.0')
    expect(batch.items[0].sourceText).toBe('the release body')
  })

  test('the run takes the oldest items first, up to the limit', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, { url: 'https://a.test/1', headline: 'first' })
    await seedItem(t, { url: 'https://a.test/2', headline: 'second' })
    await seedItem(t, { url: 'https://a.test/3', headline: 'third' })

    const batch = await t.query(internal.newsDrafting.undrafted, { limit: 2 })

    expect(batch.items.map((item) => item.headline)).toEqual([
      'first',
      'second',
    ])
    expect(batch.remaining).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// The apply step: what the reviewed files do to the rows
// ---------------------------------------------------------------------------

describe('applyDrafts', () => {
  test('a merged draft lands on the row and stamps the run', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)
    const topicId = await seedTopic(t, 'Agents', 'agents')

    const report = await t.mutation(internal.newsDrafting.applyDrafts, {
      drafts: [{ itemId, summary: 'What the post says.', topic: 'Agents' }],
    })

    expect(report.applied).toBe(1)
    expect(report.results[0].outcome).toBe('applied')
    const item = await t.run(async (ctx: any) => ctx.db.get(itemId))
    expect(item.summary).toBe('What the post says.')
    expect(item.topicId).toBe(topicId)
    expect(item.draftedAt).toBeGreaterThan(0)
  })

  test('an applied item is no longer work for the next run', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)
    await seedTopic(t, 'Agents', 'agents')

    await t.mutation(internal.newsDrafting.applyDrafts, {
      drafts: [{ itemId, summary: 'What the post says.', topic: 'Agents' }],
    })

    const batch = await t.query(internal.newsDrafting.undrafted, {})
    expect(batch.items).toHaveLength(0)
  })

  test('a topic the list does not hold yet is created', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)

    const report = await t.mutation(internal.newsDrafting.applyDrafts, {
      drafts: [{ itemId, summary: 'A summary.', topic: 'Coding agents' }],
    })

    expect(report.results[0].topicCreated).toBe(true)
    const topics = await t.run(async (ctx: any) =>
      ctx.db.query('newsTopics').collect(),
    )
    expect(topics.map((topic: any) => topic.slug)).toEqual(['coding-agents'])
  })

  test('the same topic name twice creates one topic', async () => {
    const t = convexTest(schema, modules)
    const first = await seedItem(t, { url: 'https://a.test/1' })
    const second = await seedItem(t, { url: 'https://a.test/2' })

    await t.mutation(internal.newsDrafting.applyDrafts, {
      drafts: [
        { itemId: first, summary: 'One.', topic: 'Coding agents' },
        { itemId: second, summary: 'Two.', topic: 'Coding agents' },
      ],
    })

    const topics = await t.run(async (ctx: any) =>
      ctx.db.query('newsTopics').collect(),
    )
    expect(topics).toHaveLength(1)
  })

  test('a summary the owner already typed is kept, not overwritten', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t, { summary: 'The words I wrote myself.' })

    const report = await t.mutation(internal.newsDrafting.applyDrafts, {
      drafts: [{ itemId, summary: 'The machine draft.', topic: 'Agents' }],
    })

    expect(report.results[0].outcome).toBe('already-drafted')
    expect(report.applied).toBe(0)
    expect(report.skipped).toBe(1)
    const item = await t.run(async (ctx: any) => ctx.db.get(itemId))
    expect(item.summary).toBe('The words I wrote myself.')
  })

  test('a draft can replace a blank summary on an approved item', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t, { state: 'approved', summary: '   ' })

    const report = await t.mutation(internal.newsDrafting.applyDrafts, {
      drafts: [{ itemId, summary: 'The machine draft.', topic: 'Agents' }],
    })

    expect(report.results[0].outcome).toBe('applied')
    const item = await t.run(async (ctx: any) => ctx.db.get(itemId))
    expect(item.summary).toBe('The machine draft.')
  })

  test('a stale file naming a dead row reports itself, and the batch goes on', async () => {
    const t = convexTest(schema, modules)
    const live = await seedItem(t)

    const report = await t.mutation(internal.newsDrafting.applyDrafts, {
      drafts: [
        { itemId: 'not-an-id', summary: 'Orphan.', topic: 'Agents' },
        { itemId: live, summary: 'A summary.', topic: 'Agents' },
      ],
    })

    expect(report.results[0].outcome).toBe('unknown-item')
    expect(report.results[1].outcome).toBe('applied')
    expect(report.applied).toBe(1)
  })
})
