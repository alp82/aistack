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

    expect(result.kind).toBe('item')
    expect(result.item?.added).toBe(true)
    expect(result.item?.headline).toBe('A real headline')
  })

  test('a typed headline wins over the page', async () => {
    const t = convexTest(schema, modules)
    stubFetch('<html><head><title>Page says this</title></head></html>')

    const result = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://vendor.test/blog/thing',
      headline: 'Owner says this',
    })

    expect(result.item?.headline).toBe('Owner says this')
  })

  test('a page that refuses us still yields an item', async () => {
    const t = convexTest(schema, modules)
    stubFetch({ status: 403 })

    const result = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://vendor.test/blog/thing',
    })

    expect(result.item?.added).toBe(true)
    expect(result.item?.headline).toBe('vendor.test')
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

    expect(again.item?.duplicate).toBe(true)
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

  test('a retry of the Hacker News lane reads Hacker News, not a feed', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedHnLane(t, { lastError: 'HTTP 429' })
    stubAlgolia([{ hits: [hit()] }])

    const report = await asAdmin(t).action(api.news.pollSourceNow, { sourceId })

    expect(report.error).toBeNull()
    expect(report.added).toBe(1)
    const source = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(source.lastError).toBeUndefined()
  })

  test('a scraper row is refused here instead of failing as a feed', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t, {
      name: 'Anthropic news',
      slug: 'anthropic-news',
      kind: 'sitemap',
      url: 'https://www.anthropic.com/sitemap.xml',
    })

    await expect(
      asAdmin(t).action(api.news.pollSourceNow, { sourceId }),
    ).rejects.toThrow('Run scrapers')
    const source = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(source.consecutiveFailures).toBe(0)
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

// ---------------------------------------------------------------------------
// The Hacker News lane (#208)
// ---------------------------------------------------------------------------

/**
 * Answer each request by the URL it asks for. The two lanes call three
 * different hosts, and a test that stubs one body for all of them cannot tell
 * an Algolia answer from an oEmbed answer.
 */
function stubRoutes(routes: Array<[RegExp, () => Response]>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = String(input)
      for (const [pattern, answer] of routes) {
        if (pattern.test(url)) return answer()
      }
      return new Response('no route', { status: 404 })
    }),
  )
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

/** One Algolia hit. `points` and `title` are what the net judges. */
function hit(over: Record<string, unknown> = {}) {
  return {
    objectID: '100',
    title: 'Claude Code ships agent mode',
    url: 'https://anthropic.com/news/agent-mode',
    points: 40,
    num_comments: 12,
    created_at_i: Math.floor(Date.now() / 1000) - 3600,
    ...over,
  }
}

async function seedHnLane(
  t: ReturnType<typeof convexTest>,
  overrides: Record<string, unknown> = {},
): Promise<Id<'newsSources'>> {
  return await seedSource(t, {
    name: 'Hacker News',
    slug: 'hacker-news',
    kind: 'hn',
    url: 'https://hn.algolia.com/api/v1/search_by_date',
    licenseClass: 'hn',
    ...overrides,
  })
}

/** Answer one Algolia page, then an empty one, which ends the cursor walk. */
function stubAlgolia(pages: Array<{ hits: unknown[] }>) {
  let call = 0
  stubRoutes([
    [
      /hn\.algolia\.com/,
      () => json(pages[call++] ?? { hits: [] }),
    ],
  ])
}

describe('the Hacker News lane', () => {
  test('a story over the gate becomes an item, with the article as the link', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    stubAlgolia([{ hits: [hit()] }])

    const [report] = await t.action(internal.news.collectHackerNews, {})

    expect(report.added).toBe(1)
    const [item] = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(item.url).toBe('https://anthropic.com/news/agent-mode')
    expect(item.hnItemId).toBe('100')
    expect(item.hnPoints).toBe(40)
    expect(item.hnComments).toBe(12)
    expect(item.licenseClass).toBe('hn')
    expect(item.state).toBe('inbox')
  })

  test('a story under the points gate is left alone', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    stubAlgolia([{ hits: [hit({ points: 19 })] }])

    const [report] = await t.action(internal.news.collectHackerNews, {})

    expect(report.added).toBe(0)
    expect(report.filtered).toBe(1)
  })

  test('a story no keyword matched is left alone, whatever its points', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    stubAlgolia([
      { hits: [hit({ title: 'Show HN: a sourdough timer', url: null, points: 900 })] },
    ])

    const [report] = await t.action(internal.news.collectHackerNews, {})

    expect(report.added).toBe(0)
    expect(report.filtered).toBe(1)
  })

  test('the points gate on the row wins over the default', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t, { minPoints: 100 })
    stubAlgolia([{ hits: [hit({ points: 40 })] }])

    const [report] = await t.action(internal.news.collectHackerNews, {})

    expect(report.added).toBe(0)
  })

  test('a text post has no article, so its discussion is the link', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    stubAlgolia([
      { hits: [hit({ objectID: '777', title: 'Ask HN: which coding agent', url: null })] },
    ])

    await t.action(internal.news.collectHackerNews, {})

    const [item] = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(item.url).toBe('https://news.ycombinator.com/item?id=777')
    expect(item.hnItemId).toBe('777')
  })

  test('a story the feed lane already collected gains its discussion, not a twin row', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    await t.mutation(internal.news.insertItem, {
      url: 'https://anthropic.com/news/agent-mode',
      headline: 'Agent mode',
      intake: 'collector',
      licenseClass: 'article',
    })
    stubAlgolia([{ hits: [hit()] }])

    const [report] = await t.action(internal.news.collectHackerNews, {})

    expect(report.added).toBe(0)
    expect(report.duplicates).toBe(1)
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].hnItemId).toBe('100')
    expect(rows[0].hnPoints).toBe(40)
    // The feed collected it, so the feed's class and headline stand.
    expect(rows[0].licenseClass).toBe('article')
    expect(rows[0].headline).toBe('Agent mode')
  })

  test('points settle, so a later run refreshes them on the same item', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    stubAlgolia([{ hits: [hit({ points: 40 })] }])
    await t.action(internal.news.collectHackerNews, {})

    stubAlgolia([{ hits: [hit({ points: 210, num_comments: 88 })] }])
    await t.action(internal.news.collectHackerNews, {})

    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].hnPoints).toBe(210)
    expect(rows[0].hnComments).toBe(88)
  })

  test('a second discussion of one article does not take the row', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    stubAlgolia([{ hits: [hit({ objectID: '100', points: 200 })] }])
    await t.action(internal.news.collectHackerNews, {})

    stubAlgolia([{ hits: [hit({ objectID: '999', points: 25 })] }])
    await t.action(internal.news.collectHackerNews, {})

    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].hnItemId).toBe('100')
    expect(rows[0].hnPoints).toBe(200)
  })

  test('the cursor walks back through pages until the window is read', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    const nowSec = Math.floor(Date.now() / 1000)
    stubAlgolia([
      { hits: [hit({ objectID: '1', created_at_i: nowSec - 3600 })] },
      {
        hits: [
          hit({
            objectID: '2',
            title: 'Codex gets a new mode',
            url: 'https://openai.com/codex-mode',
            created_at_i: nowSec - 7200,
          }),
        ],
      },
    ])

    const [report] = await t.action(internal.news.collectHackerNews, {})

    expect(report.scanned).toBe(2)
    expect(report.added).toBe(2)
  })

  test('a refused API lands on the source row and adds nothing', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedHnLane(t)
    stubRoutes([[/hn\.algolia\.com/, () => json({ message: 'nope' }, 429)]])

    const [report] = await t.action(internal.news.collectHackerNews, {})

    expect(report.error).toContain('429')
    expect(report.added).toBe(0)
    const source = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(source.consecutiveFailures).toBe(1)
    expect(source.lastError).toContain('429')
  })

  test('an answer that is not an Algolia answer is a source failure', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t)
    stubRoutes([[/hn\.algolia\.com/, () => json({ message: 'nope' })]])

    const [report] = await t.action(internal.news.collectHackerNews, {})

    expect(report.error).toContain('hits')
  })

  test('each collector reads its own lane and leaves the other alone', async () => {
    const t = convexTest(schema, modules)
    await seedSource(t)
    await seedHnLane(t)
    stubRoutes([
      [/feed\.test/, () => new Response(feedXml([
        { title: 'A feed post', link: 'https://vendor.test/post' },
      ]))],
      [/hn\.algolia\.com/, () => json({ hits: [hit()] })],
    ])

    const feedReports = await t.action(internal.news.collect, {})
    const hnReports = await t.action(internal.news.collectHackerNews, {})

    expect(feedReports).toHaveLength(1)
    expect(feedReports[0].source).toBe('Test feed')
    expect(hnReports).toHaveLength(1)
    expect(hnReports[0].source).toBe('Hacker News')
  })

  test('a disabled lane is not read', async () => {
    const t = convexTest(schema, modules)
    await seedHnLane(t, { enabled: false })
    stubAlgolia([{ hits: [hit()] }])

    expect(await t.action(internal.news.collectHackerNews, {})).toEqual([])
  })
})

describe('setSourceMinPoints', () => {
  test('the owner moves the gate', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedHnLane(t)

    await asAdmin(t).mutation(api.news.setSourceMinPoints, {
      sourceId,
      minPoints: 50,
    })

    const source = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(source.minPoints).toBe(50)
  })

  test('a feed source has no points gate', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedSource(t)

    await expect(
      asAdmin(t).mutation(api.news.setSourceMinPoints, { sourceId, minPoints: 50 }),
    ).rejects.toThrow('Hacker News')
  })

  test('a negative gate is refused', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedHnLane(t)

    await expect(
      asAdmin(t).mutation(api.news.setSourceMinPoints, { sourceId, minPoints: -1 }),
    ).rejects.toThrow()
  })

  test('a stranger cannot move the gate', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await seedHnLane(t)

    await expect(
      t.mutation(api.news.setSourceMinPoints, { sourceId, minPoints: 50 }),
    ).rejects.toThrow('Unauthorized')
  })
})

// ---------------------------------------------------------------------------
// The X owner-paste lane (#208)
// ---------------------------------------------------------------------------

const EMBED_HTML =
  '<blockquote class="twitter-tweet" data-dnt="true"><p lang="en" dir="ltr">Opus 5 is out today</p>&mdash; Anthropic (@AnthropicAI) <a href="https://x.com/AnthropicAI/status/20">August 18, 2026</a></blockquote>'

const OEMBED = {
  url: 'https://x.com/AnthropicAI/status/20',
  author_name: 'Anthropic',
  author_url: 'https://x.com/AnthropicAI',
  html: EMBED_HTML,
}

describe('the X owner-paste lane', () => {
  test('a pasted post stores the ID, the official embed and the post text', async () => {
    const t = convexTest(schema, modules)
    stubRoutes([[/publish\.x\.com/, () => json(OEMBED)]])

    const result = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://x.com/AnthropicAI/status/20',
    })

    expect(result.kind).toBe('item')
    expect(result.item?.added).toBe(true)
    const [item] = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(item.licenseClass).toBe('x')
    expect(item.intake).toBe('quick-add')
    expect(item.headline).toBe('Opus 5 is out today')
    expect(item.xEmbed.statusId).toBe('20')
    expect(item.xEmbed.html).toBe(EMBED_HTML)
    expect(item.xEmbed.authorName).toBe('Anthropic')
  })

  test('a messy link and a clean one are one post', async () => {
    const t = convexTest(schema, modules)
    stubRoutes([[/publish\.x\.com/, () => json(OEMBED)]])

    await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://twitter.com/AnthropicAI/status/20?s=46&t=abc',
    })
    const again = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://x.com/AnthropicAI/status/20',
    })

    expect(again.item?.duplicate).toBe(true)
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].url).toBe('https://x.com/AnthropicAI/status/20')
  })

  test('an X embed joins an existing Hacker News item and its stricter class wins', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(internal.news.insertItem, {
      url: 'https://x.com/AnthropicAI/status/20',
      headline: 'Hacker News headline',
      intake: 'collector',
      licenseClass: 'hn',
      hnItemId: '900',
      hnPoints: 80,
      hnComments: 20,
    })
    stubRoutes([[/publish\.x\.com/, () => json(OEMBED)]])

    const result = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://x.com/AnthropicAI/status/20',
    })

    expect(result.item?.patched).toBe(true)
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].licenseClass).toBe('x')
    expect(rows[0].xEmbed.html).toBe(EMBED_HTML)
    expect(rows[0].hnItemId).toBe('900')
  })

  test('a dead post says so and stores nothing', async () => {
    const t = convexTest(schema, modules)
    // The real endpoint answers 404 with an HTML page, not with JSON.
    stubRoutes([
      [/publish\.x\.com/, () => new Response('<!DOCTYPE html>', { status: 404 })],
    ])

    await expect(
      asAdmin(t).action(api.news.quickAdd, {
        url: 'https://x.com/jack/status/99999999999999999999',
      }),
    ).rejects.toThrow('gone')
    expect(
      await t.run(async (ctx: any) => ctx.db.query('newsItems').collect()),
    ).toEqual([])
  })

  test('a timeline widget is not a post, so nothing is stored', async () => {
    const t = convexTest(schema, modules)
    stubRoutes([
      [
        /publish\.x\.com/,
        () =>
          json({
            url: 'https://x.com/AnthropicAI',
            html: '<a class="twitter-timeline" href="https://x.com/AnthropicAI">Posts</a>',
          }),
      ],
    ])

    await expect(
      asAdmin(t).action(api.news.quickAdd, {
        url: 'https://x.com/AnthropicAI/status/20',
      }),
    ).rejects.toThrow('post embed')
  })

  test('the pick list carries the date onto the item', async () => {
    const t = convexTest(schema, modules)
    stubRoutes([[/publish\.x\.com/, () => json(OEMBED)]])

    await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://x.com/AnthropicAI/status/20',
      publishedAt: 1_760_000_000_000,
    })

    const [item] = await t.run(async (ctx: any) =>
      ctx.db.query('newsItems').collect(),
    )
    expect(item.publishedAt).toBe(1_760_000_000_000)
  })
})

describe('the X profile paste', () => {
  const PROFILE = {
    results: [
      {
        id: '2089842395722678689',
        created_at: 'Tue Aug 18 2026 10:00:00 +0000',
        text: 'Opus 5 is out today',
        author: { screen_name: 'AnthropicAI' },
      },
    ],
  }

  test('a profile paste offers its posts and stores nothing', async () => {
    const t = convexTest(schema, modules)
    stubRoutes([[/api\.fxtwitter\.com/, () => json(PROFILE)]])

    const result = await asAdmin(t).action(api.news.quickAdd, {
      url: 'https://x.com/AnthropicAI',
    })

    expect(result.kind).toBe('profile')
    expect(result.profile?.screenName).toBe('AnthropicAI')
    expect(result.profile?.posts[0].url).toBe(
      'https://x.com/AnthropicAI/status/2089842395722678689',
    )
    expect(
      await t.run(async (ctx: any) => ctx.db.query('newsItems').collect()),
    ).toEqual([])
  })

  test('a profile lane that is down says so and blocks nothing else', async () => {
    const t = convexTest(schema, modules)
    stubRoutes([[/api\.fxtwitter\.com/, () => json({ code: 500 }, 500)]])

    await expect(
      asAdmin(t).action(api.news.quickAdd, { url: 'https://x.com/AnthropicAI' }),
    ).rejects.toThrow('500')
  })

  test('an unknown profile says so', async () => {
    const t = convexTest(schema, modules)
    stubRoutes([[/api\.fxtwitter\.com/, () => json({ code: 404 }, 404)]])

    await expect(
      asAdmin(t).action(api.news.quickAdd, { url: 'https://x.com/nobody' }),
    ).rejects.toThrow('No posts found')
  })

  test('a stranger cannot list a profile', async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.action(api.news.quickAdd, { url: 'https://x.com/AnthropicAI' }),
    ).rejects.toThrow('Unauthorized')
  })
})
