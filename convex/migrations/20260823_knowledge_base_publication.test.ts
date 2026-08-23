/// <reference types="vite/client" />
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

const MIGRATION = (internal.migrations as any)[
  '20260823_knowledge_base_publication'
]

describe('20260823_knowledge_base_publication', () => {
  test('reconstructs the first send after approval and drafting', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx: any) => {
      const topicId = await ctx.db.insert('newsTopics', {
        name: 'Agents',
        slug: 'agents',
        order: 0,
        createdAt: 1,
      })
      for (const sentAt of [100, 200]) {
        await ctx.db.insert('newsIssues', {
          number: sentAt / 100,
          slug: `issue-${sentAt}`,
          subject: `Issue ${sentAt}`,
          itemIds: [],
          status: 'sent',
          sentAt,
          createdAt: 1,
          updatedAt: sentAt,
        })
      }
      const insert = async (
        name: string,
        overrides: Record<string, unknown> = {},
      ) =>
        await ctx.db.insert('newsItems', {
          url: `https://example.com/${name}`,
          urlKey: name,
          headline: name,
          collectedAt: 1,
          intake: 'collector',
          licenseClass: 'article',
          state: 'approved',
          summary: 'Drafted.',
          topicId,
          decidedAt: 50,
          draftedAt: 50,
          updatedAt: 50,
          ...overrides,
        })
      return {
        first: await insert('first'),
        second: await insert('second', { draftedAt: 150 }),
        manualSecond: await insert('manual-second', {
          draftedAt: undefined,
          updatedAt: 150,
        }),
        waiting: await insert('waiting', { decidedAt: 250, updatedAt: 250 }),
        undrafted: await insert('undrafted', { summary: undefined }),
        ungrouped: await insert('ungrouped', { topicId: undefined }),
        existing: await insert('existing', { knowledgeBasePublishedAt: 75 }),
      }
    })

    const firstRun = await t.mutation(MIGRATION.run, {})
    const secondRun = await t.mutation(MIGRATION.run, {})
    const rows = await t.run(async (ctx: any) =>
      Object.fromEntries(
        await Promise.all(
          Object.entries(ids).map(async ([name, id]) => [name, await ctx.db.get(id)]),
        ),
      ),
    )

    expect(firstRun.published).toBe(3)
    expect(secondRun.published).toBe(0)
    expect(rows.first.knowledgeBasePublishedAt).toBe(100)
    expect(rows.second.knowledgeBasePublishedAt).toBe(200)
    expect(rows.manualSecond.knowledgeBasePublishedAt).toBe(200)
    expect(rows.waiting.knowledgeBasePublishedAt).toBeUndefined()
    expect(rows.undrafted.knowledgeBasePublishedAt).toBeUndefined()
    expect(rows.ungrouped.knowledgeBasePublishedAt).toBeUndefined()
    expect(rows.existing.knowledgeBasePublishedAt).toBe(75)
  })
})
