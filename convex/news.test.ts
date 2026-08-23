/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { ADMIN_EMAILS } from './lib/admin'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

const HOUR = 60 * 60 * 1000

function asAdmin(t: ReturnType<typeof convexTest>) {
  return t.withIdentity({
    tokenIdentifier: 'convex|admin',
    email: ADMIN_EMAILS[0],
  })
}

function feedXml(
  entries: Array<{ title: string; link: string; date?: string; body?: string }>,
): string {
  const items = entries
    .map(
      (e) => `<item>
    <title>${e.title}</title>
    <link>${e.link}</link>
    ${e.date ? `<pubDate>${e.date}</pubDate>` : ''}
    ${e.body ? `<description>${e.body}</description>` : ''}
  </item>`,
    )
    .join('\n')
  return `<rss version="2.0"><channel><title>Test feed</title>${items}</channel></rss>`
}

/** Answer every fetch with one body, or with a failure. */
function stubFetch(body: string | { status: number }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      if (typeof body !== 'string') {
        return new Response('nope', { status: body.status })
      }
      return new Response(body, { status: 200 })
    }),
  )
}

async function seedSource(
  t: ReturnType<typeof convexTest>,
  overrides: Record<string, unknown> = {},
): Promise<Id<'newsSources'>> {
  return await t.run(async (ctx: any) =>
    ctx.db.insert('newsSources', {
      name: 'Test feed',
      slug: 'test-feed',
      kind: 'feed',
      url: 'https://feed.test/rss',
      licenseClass: 'article',
      enabled: true,
      collectFrom: 0,
      consecutiveFailures: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Dedupe and the license class, which every write path goes through
// ---------------------------------------------------------------------------

describe('insertItem', () => {
  test('one post that arrives twice is one item', async () => {
    const t = convexTest(schema, modules)
    const base = {
      headline: 'A post',
      intake: 'collector' as const,
      licenseClass: 'article' as const,
    }

    const first = await t.mutation(internal.news.insertItem, {
      ...base,
      url: 'https://vendor.test/blog/thing',
    })
    // The aggregator reposted it with a campaign parameter and a trailing slash.
    const second = await t.mutation(internal.news.insertItem, {
      ...base,
      url: 'https://www.vendor.test/blog/thing/?utm_source=aicrier',
    })

    expect(first.added).toBe(true)
    expect(second.added).toBe(false)
    expect(second.duplicate).toBe(true)
    expect(second.itemId).toBe(first.itemId)
  })

  test('a permissive release note keeps its body', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.news.insertItem, {
      url: 'https://github.test/r/releases/tag/v1',
      headline: 'v1',
      intake: 'collector',
      licenseClass: 'permissive-release-notes',
      sourceText: 'Fixed the thing.',
    })

    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows[0].sourceText).toBe('Fixed the thing.')
  })

  test('an article body is dropped, because we may not re-serve it', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.news.insertItem, {
      url: 'https://vendor.test/blog/thing',
      headline: 'A post',
      intake: 'collector',
      licenseClass: 'article',
      sourceText: 'The whole article.',
    })

    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows[0].sourceText).toBeUndefined()
  })

  test('a new item lands in the inbox, never in the stream', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.news.insertItem, {
      url: 'https://vendor.test/blog/thing',
      headline: 'A post',
      intake: 'quick-add',
      licenseClass: 'article',
    })

    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows[0].state).toBe('inbox')
  })
})

// ---------------------------------------------------------------------------
// The collector
// ---------------------------------------------------------------------------

describe('collect', () => {
  test('an item older than collectFrom is not collected', async () => {
    const t = convexTest(schema, modules)
    const now = Date.now()
    await seedSource(t, { collectFrom: now - HOUR })
    stubFetch(
      feedXml([
        {
          title: 'Fresh',
          link: 'https://feed.test/fresh',
          date: new Date(now).toUTCString(),
        },
        {
          title: 'Archive',
          link: 'https://feed.test/archive',
          date: new Date(now - 400 * 24 * HOUR).toUTCString(),
        },
      ]),
    )

    const [report] = await t.action(internal.news.collect, {})

    expect(report.added).toBe(1)
    expect(report.skippedOld).toBe(1)
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows.map((r: any) => r.headline)).toEqual(['Fresh'])
  })

  test('an item with no date is collected, because silence is not age', async () => {
    const t = convexTest(schema, modules)
    await seedSource(t, { collectFrom: Date.now() })
    stubFetch(feedXml([{ title: 'Undated', link: 'https://feed.test/undated' }]))

    const [report] = await t.action(internal.news.collect, {})

    expect(report.added).toBe(1)
  })

  test('a second run collects nothing new', async () => {
    const t = convexTest(schema, modules)
    await seedSource(t)
    stubFetch(feedXml([{ title: 'One', link: 'https://feed.test/one' }]))

    await t.action(internal.news.collect, {})
    const [second] = await t.action(internal.news.collect, {})

    expect(second.added).toBe(0)
    expect(second.duplicates).toBe(1)
  })

  test('the collected item carries its source and license class', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t, {
      licenseClass: 'permissive-release-notes',
    })
    stubFetch(
      feedXml([
        { title: 'v1', link: 'https://feed.test/v1', body: 'Fixed the thing.' },
      ]),
    )

    await t.action(internal.news.collect, {})

    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows[0].sourceId).toBe(sourceId)
    expect(rows[0].licenseClass).toBe('permissive-release-notes')
    expect(rows[0].sourceText).toBe('Fixed the thing.')
    expect(rows[0].intake).toBe('collector')
  })

  test('a disabled source is not polled', async () => {
    const t = convexTest(schema, modules)
    await seedSource(t, { enabled: false })
    stubFetch(feedXml([{ title: 'One', link: 'https://feed.test/one' }]))

    const reports = await t.action(internal.news.collect, {})

    expect(reports).toEqual([])
  })

  test('a failing source records its error and counts up', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t)
    stubFetch({ status: 503 })

    const [report] = await t.action(internal.news.collect, {})

    expect(report.error).toContain('503')
    const source = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(source.consecutiveFailures).toBe(1)
    expect(source.lastError).toContain('503')
    expect(source.lastOkAt).toBeUndefined()
  })

  test('a source that recovers clears its failure count', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t, { consecutiveFailures: 3 })
    stubFetch(feedXml([{ title: 'One', link: 'https://feed.test/one' }]))

    await t.action(internal.news.collect, {})

    const source = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(source.consecutiveFailures).toBe(0)
    expect(source.lastError).toBeUndefined()
    expect(source.lastOkAt).toBeGreaterThan(0)
  })

  test('a page that is not a feed is a failure, not an empty success', async () => {
    const t = convexTest(schema, modules)
    await seedSource(t)
    stubFetch('<html><body>Blocked</body></html>')

    const [report] = await t.action(internal.news.collect, {})

    expect(report.error).not.toBeNull()
    expect(report.added).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Quick-add
// ---------------------------------------------------------------------------

describe('quickAdd', () => {
  test('the page title becomes the headline', async () => {
    const t = convexTest(schema, modules)
    stubFetch('<html><head><title>A real headline</title></head></html>')

    const result = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://vendor.test/blog/thing',
    })

    expect(result.added).toBe(true)
    expect(result.headline).toBe('A real headline')
  })

  test('a typed headline wins over the page', async () => {
    const t = convexTest(schema, modules)
    stubFetch('<html><head><title>Page says this</title></head></html>')

    const result = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://vendor.test/blog/thing',
      headline: 'Owner says this',
    })

    expect(result.headline).toBe('Owner says this')
  })

  test('a page that refuses us still yields an item', async () => {
    const t = convexTest(schema, modules)
    stubFetch({ status: 403 })

    const result = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://vendor.test/blog/thing',
    })

    expect(result.added).toBe(true)
    expect(result.headline).toBe('vendor.test')
  })

  test('a pasted link defaults to the class that permits the least', async () => {
    const t = convexTest(schema, modules)
    stubFetch({ status: 403 })

    await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://vendor.test/blog/thing',
    })

    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows[0].licenseClass).toBe('article')
    expect(rows[0].intake).toBe('quick-add')
  })

  test('a link already in the inbox reports itself as a duplicate', async () => {
    const t = convexTest(schema, modules)
    stubFetch('<html><head><title>A real headline</title></head></html>')

    await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://vendor.test/blog/thing',
    })
    const again = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://vendor.test/blog/thing',
    })

    expect(again.duplicate).toBe(true)
  })

  test('a non-http link is refused', async () => {
    const t = convexTest(schema, modules)

    await expect(
      asAdmin(t).action(api.news.quickAdd, { url: 'javascript:alert(1)' }),
    ).rejects.toThrow()
  })

  test('a stranger cannot quick-add', async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.action(api.news.quickAdd, { url: 'https://vendor.test/blog/thing' }),
    ).rejects.toThrow('Unauthorized')
  })
})

// ---------------------------------------------------------------------------
// Working the inbox
// ---------------------------------------------------------------------------

describe('the inbox', () => {
  async function seedItem(t: ReturnType<typeof convexTest>) {
    const result = await t.mutation(internal.news.insertItem, {
      url: 'https://vendor.test/blog/thing',
      headline: 'A post',
      intake: 'collector',
      licenseClass: 'article',
    })
    return result.itemId as Id<'newsItems'>
  }

  test('approve moves the item to the stream and stamps the decision', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)

    await asAdmin(t).mutation(api.news.setItemState, {
      itemId,
      state: 'approved',
    })

    const item = await t.run(async (ctx: any) => ctx.db.get(itemId))
    expect(item.state).toBe('approved')
    expect(item.decidedAt).toBeGreaterThan(0)
  })

  test('a restore to the inbox clears the decision stamp', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)

    await asAdmin(t).mutation(api.news.setItemState, {
      itemId,
      state: 'discarded',
    })
    await asAdmin(t).mutation(api.news.setItemState, { itemId, state: 'inbox' })

    const item = await t.run(async (ctx: any) => ctx.db.get(itemId))
    expect(item.state).toBe('inbox')
    expect(item.decidedAt).toBeUndefined()
  })

  test('the owner edits the summary and the topic', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)
    const topicId = await asAdmin(t).mutation(api.news.createTopic, {
      name: 'Skills',
    })

    await asAdmin(t).mutation(api.news.updateItem, {
      itemId,
      summary: '  Our own words.  ',
      topicId,
    })

    const item = await t.run(async (ctx: any) => ctx.db.get(itemId))
    expect(item.summary).toBe('Our own words.')
    expect(item.topicId).toBe(topicId)
  })

  test('an empty summary clears the draft rather than storing blank text', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)

    await asAdmin(t).mutation(api.news.updateItem, {
      itemId,
      summary: 'something',
    })
    await asAdmin(t).mutation(api.news.updateItem, { itemId, summary: '   ' })

    const item = await t.run(async (ctx: any) => ctx.db.get(itemId))
    expect(item.summary).toBeUndefined()
  })

  test('the topic can be cleared with an explicit null', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)
    const topicId = await asAdmin(t).mutation(api.news.createTopic, {
      name: 'Skills',
    })
    await asAdmin(t).mutation(api.news.updateItem, { itemId, topicId })

    await asAdmin(t).mutation(api.news.updateItem, { itemId, topicId: null })

    const item = await t.run(async (ctx: any) => ctx.db.get(itemId))
    expect(item.topicId).toBeUndefined()
  })

  test('the list names the source and the topic behind each item', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t)
    stubFetch(feedXml([{ title: 'One', link: 'https://feed.test/one' }]))
    await t.action(internal.news.collect, {})
    const topicId = await asAdmin(t).mutation(api.news.createTopic, {
      name: 'Skills',
    })
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    await asAdmin(t).mutation(api.news.updateItem, {
      itemId: rows[0]._id,
      topicId,
    })

    const listed = await asAdmin(t).query(api.news.listItems, { state: 'inbox' })

    expect(listed?.[0].sourceId).toBe(sourceId)
    expect(listed?.[0].sourceName).toBe('Test feed')
    expect(listed?.[0].topicName).toBe('Skills')
  })

  test('a stranger reads nothing', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t)

    expect(await t.query(api.news.listItems, { state: 'inbox' })).toBeNull()
    expect(await t.query(api.news.countItems, {})).toBeNull()
  })

  test('a stranger cannot move an item', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t)

    await expect(
      t.mutation(api.news.setItemState, { itemId, state: 'approved' }),
    ).rejects.toThrow('Unauthorized')
  })
})

// ---------------------------------------------------------------------------
// The source digest (#238): the inbox grouped by source, and bulk discard
// ---------------------------------------------------------------------------

describe('the source digest', () => {
  async function seedItems(
    t: ReturnType<typeof convexTest>,
    count: number,
    lane: string,
    fields: Record<string, unknown> = {},
  ): Promise<Id<'newsItems'>[]> {
    const ids: Id<'newsItems'>[] = []
    for (let n = 0; n < count; n++) {
      const url = `https://vendor.test/${lane}/${n}`
      ids.push(
        await t.run(async (ctx: any) =>
          ctx.db.insert('newsItems', {
            url,
            urlKey: url,
            headline: `Item ${n}`,
            collectedAt: 1_000 + n,
            publishedAt: 1_000 + n,
            intake: 'collector',
            licenseClass: 'article',
            state: 'inbox',
            updatedAt: 1_000 + n,
            ...fields,
          }),
        ),
      )
    }
    return ids
  }

  test('the groups come back biggest first', async () => {
    const t = convexTest(schema, modules)
    const loud = await seedSource(t, { name: 'Loud feed', slug: 'loud' })
    const quiet = await seedSource(t, {
      name: 'Quiet feed',
      slug: 'quiet',
      url: 'https://quiet.test/rss',
    })
    await seedItems(t, 5, 'loud', { sourceId: loud })
    await seedItems(t, 2, 'quiet', { sourceId: quiet })

    const groups = await asAdmin(t).query(api.news.inboxGroups, {})

    expect(groups?.map((g) => [g.name, g.count])).toEqual([
      ['Loud feed', 5],
      ['Quiet feed', 2],
    ])
  })

  test('a pasted item is its own group, not a source group', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t)
    await seedItems(t, 1, 'feed', { sourceId })
    await seedItems(t, 3, 'paste', { intake: 'quick-add' })

    const groups = await asAdmin(t).query(api.news.inboxGroups, {})

    expect(groups?.[0].key).toBe('quick-add')
    expect(groups?.[0].count).toBe(3)
    expect(groups?.[0].sourceId).toBeNull()
  })

  test('a decided item leaves the digest', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t)
    const ids = await seedItems(t, 3, 'feed', { sourceId })
    await asAdmin(t).mutation(api.news.setItemState, {
      itemId: ids[0],
      state: 'approved',
    })

    const groups = await asAdmin(t).query(api.news.inboxGroups, {})

    expect(groups?.[0].count).toBe(2)
  })

  test('one group serves its own rows, newest first', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t)
    const other = await seedSource(t, {
      name: 'Other',
      slug: 'other',
      url: 'https://other.test/rss',
    })
    await seedItems(t, 4, 'feed', { sourceId })
    await seedItems(t, 1, 'other', { sourceId: other })

    const rows = await asAdmin(t).query(api.news.listGroupItems, {
      key: `source:${sourceId}`,
      limit: 2,
    })

    expect(rows?.map((r) => r.headline)).toEqual(['Item 3', 'Item 2'])
    expect(rows?.[0].sourceName).toBe('Test feed')
  })

  test('a retry reads one source and leaves the others alone', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t, { lastError: 'HTTP 503' })
    const other = await seedSource(t, {
      name: 'Other',
      slug: 'other',
      url: 'https://other.test/rss',
    })
    stubFetch(feedXml([{ title: 'One', link: 'https://feed.test/one' }]))

    const report = await asAdmin(t).action(api.news.pollSourceNow, { sourceId })

    expect(report.added).toBe(1)
    expect(report.error).toBeNull()
    const rows = await t.run(async (ctx: any) => ({
      retried: await ctx.db.get(sourceId),
      untouched: await ctx.db.get(other),
    }))
    expect(rows.retried.lastError).toBeUndefined()
    expect(rows.untouched.lastPolledAt).toBeUndefined()
  })

  test('a stranger reads no digest and retries nothing', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t)
    await seedItems(t, 1, 'feed', { sourceId })

    expect(await t.query(api.news.inboxGroups, {})).toBeNull()
    expect(
      await t.query(api.news.listGroupItems, { key: `source:${sourceId}` }),
    ).toBeNull()
    await expect(t.action(api.news.pollSourceNow, { sourceId })).rejects.toThrow(
      'Unauthorized',
    )
  })
})

// ---------------------------------------------------------------------------
// Topics and sources
// ---------------------------------------------------------------------------

describe('topics', () => {
  test('the list starts empty and grows one topic at a time', async () => {
    const t = convexTest(schema, modules)

    expect(await asAdmin(t).query(api.news.listTopics, {})).toEqual([])

    await asAdmin(t).mutation(api.news.createTopic, { name: 'Skills' })
    await asAdmin(t).mutation(api.news.createTopic, { name: 'Harnesses' })

    const topics = await asAdmin(t).query(api.news.listTopics, {})
    expect(topics?.map((topic) => topic.name)).toEqual(['Skills', 'Harnesses'])
  })

  test('the same name twice is one topic', async () => {
    const t = convexTest(schema, modules)

    const first = await asAdmin(t).mutation(api.news.createTopic, {
      name: 'Skills',
    })
    const second = await asAdmin(t).mutation(api.news.createTopic, {
      name: 'skills',
    })

    expect(second).toBe(first)
  })

  test('a topic in use cannot be deleted', async () => {
    const t = convexTest(schema, modules)
    const topicId = await asAdmin(t).mutation(api.news.createTopic, {
      name: 'Skills',
    })
    const { itemId } = await t.mutation(internal.news.insertItem, {
      url: 'https://vendor.test/blog/thing',
      headline: 'A post',
      intake: 'collector',
      licenseClass: 'article',
    })
    await asAdmin(t).mutation(api.news.updateItem, {
      itemId: itemId as Id<'newsItems'>,
      topicId,
    })

    await expect(
      asAdmin(t).mutation(api.news.deleteTopic, { topicId }),
    ).rejects.toThrow('Move the items off this topic first')
  })

  test('an unused topic is deleted', async () => {
    const t = convexTest(schema, modules)
    const topicId = await asAdmin(t).mutation(api.news.createTopic, {
      name: 'Skills',
    })

    await asAdmin(t).mutation(api.news.deleteTopic, { topicId })

    expect(await asAdmin(t).query(api.news.listTopics, {})).toEqual([])
  })

  test('the counts view says how many items carry each topic', async () => {
    const t = convexTest(schema, modules)
    const topicId = await asAdmin(t).mutation(api.news.createTopic, {
      name: 'Skills',
    })
    const { itemId } = await t.mutation(internal.news.insertItem, {
      url: 'https://vendor.test/blog/thing',
      headline: 'A post',
      intake: 'collector',
      licenseClass: 'article',
    })
    await asAdmin(t).mutation(api.news.updateItem, {
      itemId: itemId as Id<'newsItems'>,
      topicId,
    })

    const topics = await asAdmin(t).query(api.news.listTopicsWithCounts, {})

    expect(topics?.[0].itemCount).toBe(1)
  })
})

describe('sources', () => {
  test('a new source starts collecting from now, not from the archive', async () => {
    const t = convexTest(schema, modules)
    const before = Date.now()

    const sourceId = await asAdmin(t).mutation(api.news.createSource, {
      name: 'Vendor blog',
      url: 'https://vendor.test/rss',
      kind: 'feed',
      licenseClass: 'article',
    })

    const source = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(source.collectFrom).toBeGreaterThanOrEqual(before)
    expect(source.enabled).toBe(true)
  })

  test('the same URL cannot be a source twice', async () => {
    const t = convexTest(schema, modules)
    const args = {
      name: 'Vendor blog',
      url: 'https://vendor.test/rss',
      kind: 'feed' as const,
      licenseClass: 'article' as const,
    }
    await asAdmin(t).mutation(api.news.createSource, args)

    await expect(
      asAdmin(t).mutation(api.news.createSource, args),
    ).rejects.toThrow('already a source')
  })

  test('deleting a source keeps its items and forgets the link', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t)
    stubFetch(feedXml([{ title: 'One', link: 'https://feed.test/one' }]))
    await t.action(internal.news.collect, {})

    const result = await asAdmin(t).mutation(api.news.deleteSource, {
      sourceId,
    })

    expect(result.keptItems).toBe(1)
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].sourceId).toBeUndefined()
  })

  test('a stranger cannot add a source', async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.mutation(api.news.createSource, {
        name: 'Vendor blog',
        url: 'https://vendor.test/rss',
        kind: 'feed',
        licenseClass: 'article',
      }),
    ).rejects.toThrow('Unauthorized')
  })
})

// ---------------------------------------------------------------------------
// The phase-1 seed
// ---------------------------------------------------------------------------

describe('the phase-1 source seed', () => {
  test('it seeds the 14 proved sources, enabled', async () => {
    const t = convexTest(schema, modules)

    const result = await t.mutation(
      internal.migrations['20260823_news_phase1_sources'].run,
      {},
    )

    expect(result.inserted).toBe(14)
    const sources = await t.run(async (ctx: any) =>
      ctx.db.query('newsSources').collect(),
    )
    expect(sources.every((s: any) => s.enabled)).toBe(true)
    expect(new Set(sources.map((s: any) => s.slug)).size).toBe(14)
  })

  test('a second run inserts nothing', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.migrations['20260823_news_phase1_sources'].run, {})
    const second = await t.mutation(
      internal.migrations['20260823_news_phase1_sources'].run,
      {},
    )

    expect(second.inserted).toBe(0)
    expect(second.skipped).toBe(14)
  })

  test('claude-code releases stay in the class that forbids full text', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.migrations['20260823_news_phase1_sources'].run, {})

    const sources = await t.run(async (ctx: any) =>
      ctx.db.query('newsSources').collect(),
    )
    const claudeCode = sources.find((s: any) =>
      s.url.includes('anthropics/claude-code'),
    )
    expect(claudeCode.licenseClass).toBe('unlicensed-release-notes')
  })
})
