/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { render } from '@react-email/render'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'
import { newsUrlKey } from './lib/feed'
import { NewsletterIssueEmail } from '../src/emails/NewsletterIssueEmail'
import { UNSUBSCRIBE_PLACEHOLDER } from '../src/emails/styles'
import { getIssueDefinition, NEWSLETTER_ISSUES } from '../src/newsletter/issues'
import { signUnsubscribeToken } from './emailToken'

const modules = import.meta.glob('./**/*.{js,ts}')

const SECRET = 'test-secret-for-unsubscribe-tokens'
const ISSUE = NEWSLETTER_ISSUES[0]

type T = ReturnType<typeof convexTest>

/** Insert one collected item in the given state, keyed the way the collector keys it. */
async function seedItem(
  t: T,
  url: string,
  overrides: Record<string, unknown> = {},
): Promise<Id<'newsItems'>> {
  return await t.run(async (ctx: any) =>
    ctx.db.insert('newsItems', {
      url,
      urlKey: newsUrlKey(url),
      headline: `Headline for ${url}`,
      collectedAt: Date.now(),
      intake: 'collector',
      licenseClass: 'article',
      state: 'approved',
      summary: 'A summary in our own words.',
      updatedAt: Date.now(),
      ...overrides,
    }),
  )
}

async function readIssueRow(t: T, slug: string) {
  return await t.run(async (ctx: any) =>
    ctx.db
      .query('newsIssues')
      .withIndex('by_slug', (q: any) => q.eq('slug', slug))
      .first(),
  )
}

describe('the authored issue registry', () => {
  test('every issue has a unique number, a unique slug, and items', () => {
    const numbers = new Set<number>()
    const slugs = new Set<string>()
    for (const issue of NEWSLETTER_ISSUES) {
      expect(numbers.has(issue.number)).toBe(false)
      expect(slugs.has(issue.slug)).toBe(false)
      numbers.add(issue.number)
      slugs.add(issue.slug)
      expect(issue.subject.trim().length).toBeGreaterThan(0)
      expect(issue.itemUrls.length).toBeGreaterThan(0)
      // A duplicate URL would render the same item twice.
      expect(new Set(issue.itemUrls).size).toBe(issue.itemUrls.length)
    }
  })

  test('getIssueDefinition finds an authored issue and refuses an unknown one', () => {
    expect(getIssueDefinition(ISSUE.slug)?.number).toBe(ISSUE.number)
    expect(getIssueDefinition('issue-does-not-exist')).toBeNull()
  })
})

describe('prepareIssue', () => {
  test('resolves approved items into a draft row, in the authored order', async () => {
    const t = convexTest(schema, modules)
    const ids: Id<'newsItems'>[] = []
    for (const url of ISSUE.itemUrls) ids.push(await seedItem(t, url))

    const report = await t.mutation(internal.newsletter.prepareIssue, {
      slug: ISSUE.slug,
    })

    expect(report.ok).toBe(true)
    expect(report.resolved).toBe(ISSUE.itemUrls.length)
    expect(report.missing).toEqual([])
    const row = await readIssueRow(t, ISSUE.slug)
    expect(row.status).toBe('draft')
    expect(row.number).toBe(ISSUE.number)
    expect(row.subject).toBe(ISSUE.subject)
    expect(row.itemIds).toEqual(ids)
  })

  test('names the items it could not use instead of dropping them quietly', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, ISSUE.itemUrls[0])
    await seedItem(t, ISSUE.itemUrls[1], { state: 'inbox' })
    await seedItem(t, ISSUE.itemUrls[2], { summary: undefined })

    const report = await t.mutation(internal.newsletter.prepareIssue, {
      slug: ISSUE.slug,
    })

    expect(report.ok).toBe(false)
    expect(report.notApproved).toEqual([
      { url: ISSUE.itemUrls[1], state: 'inbox' },
    ])
    expect(report.undrafted).toEqual([ISSUE.itemUrls[2]])
    expect(report.missing).toEqual(ISSUE.itemUrls.slice(3))
    // The two usable items still landed, so a partial prepare is workable.
    expect(report.resolved).toBe(2)
  })

  test('matches an item collected under a tracking parameter', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, `${ISSUE.itemUrls[0]}?utm_source=rss`)

    const report = await t.mutation(internal.newsletter.prepareIssue, {
      slug: ISSUE.slug,
    })

    expect(report.missing).not.toContain(ISSUE.itemUrls[0])
  })

  test('is idempotent: a second run rewrites the same row', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, ISSUE.itemUrls[0])

    await t.mutation(internal.newsletter.prepareIssue, { slug: ISSUE.slug })
    const first = await readIssueRow(t, ISSUE.slug)
    await seedItem(t, ISSUE.itemUrls[1])
    await t.mutation(internal.newsletter.prepareIssue, { slug: ISSUE.slug })
    const second = await readIssueRow(t, ISSUE.slug)

    expect(second._id).toEqual(first._id)
    expect(second.itemIds).toHaveLength(2)
  })

  test('refuses a sent issue, because a sent issue is never edited', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, ISSUE.itemUrls[0])
    await t.mutation(internal.newsletter.prepareIssue, { slug: ISSUE.slug })
    await t.mutation(internal.newsletter.markSent, {
      slug: ISSUE.slug,
      sentCount: 3,
      failedCount: 0,
    })

    await seedItem(t, ISSUE.itemUrls[1])
    const report = await t.mutation(internal.newsletter.prepareIssue, {
      slug: ISSUE.slug,
    })

    expect(report.ok).toBe(false)
    expect(report.message).toMatch(/never edited/)
    const row = await readIssueRow(t, ISSUE.slug)
    expect(row.itemIds).toHaveLength(1)
  })

  test('refuses a slug nobody authored', async () => {
    const t = convexTest(schema, modules)
    const report = await t.mutation(internal.newsletter.prepareIssue, {
      slug: 'issue-99',
    })
    expect(report.ok).toBe(false)
    expect(report.message).toMatch(/No issue/)
  })
})

describe('knowledge base publication', () => {
  test('a completed send publishes every ready item and holds incomplete items', async () => {
    const t = convexTest(schema, modules)
    const topicId = await t.run(async (ctx: any) =>
      ctx.db.insert('newsTopics', {
        name: 'Agent harnesses',
        slug: 'agent-harnesses',
        order: 0,
        createdAt: 1,
      }),
    )
    const sourceId = await t.run(async (ctx: any) =>
      ctx.db.insert('newsSources', {
        name: 'opencode releases',
        slug: 'opencode-releases',
        kind: 'feed',
        url: 'https://example.com/releases',
        licenseClass: 'permissive-release-notes',
        attribution: 'opencode contributors, MIT',
        enabled: true,
        collectFrom: 0,
        consecutiveFailures: 0,
        createdAt: 1,
        updatedAt: 1,
      }),
    )
    const inIssue = await seedItem(t, ISSUE.itemUrls[0], { topicId })
    const outsideIssue = await seedItem(t, 'https://example.com/outside', {
      topicId,
      sourceId,
      licenseClass: 'permissive-release-notes',
      sourceText: 'Substantive release notes. '.repeat(8),
    })
    const undrafted = await seedItem(t, 'https://example.com/undrafted', {
      topicId,
      summary: undefined,
    })
    const ungrouped = await seedItem(t, 'https://example.com/ungrouped', {
      topicId: undefined,
    })
    const inbox = await seedItem(t, 'https://example.com/inbox', {
      topicId,
      state: 'inbox',
    })
    const alreadyPublished = await seedItem(
      t,
      'https://example.com/already-published',
      { topicId, knowledgeBasePublication: { publishedAt: 50 } },
    )
    await t.run(async (ctx: any) =>
      ctx.db.insert('newsIssues', {
        number: ISSUE.number,
        slug: ISSUE.slug,
        subject: ISSUE.subject,
        itemIds: [inIssue],
        status: 'draft',
        createdAt: 1,
        updatedAt: 1,
      }),
    )

    await t.mutation(internal.newsletter.markSent, {
      slug: ISSUE.slug,
      sentCount: 10,
      failedCount: 0,
    })

    const rows = await t.run(async (ctx: any) => {
      const ids = [
        inIssue,
        outsideIssue,
        undrafted,
        ungrouped,
        inbox,
        alreadyPublished,
      ]
      return await Promise.all(ids.map((id) => ctx.db.get(id)))
    })
    const issue = await readIssueRow(t, ISSUE.slug)
    expect(rows[0].knowledgeBasePublication).toEqual({ publishedAt: issue.sentAt })
    expect(rows[1].knowledgeBasePublication).toEqual({
      publishedAt: issue.sentAt,
      attribution: 'opencode contributors, MIT',
    })
    expect(rows[2].knowledgeBasePublication).toBeUndefined()
    expect(rows[3].knowledgeBasePublication).toBeUndefined()
    expect(rows[4].knowledgeBasePublication).toBeUndefined()
    expect(rows[5].knowledgeBasePublication).toEqual({ publishedAt: 50 })
  })
})

describe('issueForRender', () => {
  test('carries the source name and the license notice of each item', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await t.run(async (ctx: any) =>
      ctx.db.insert('newsSources', {
        name: 'codex releases',
        slug: 'codex-releases',
        kind: 'feed',
        url: 'https://github.com/openai/codex/releases.atom',
        licenseClass: 'permissive-release-notes',
        attribution: 'codex, Apache-2.0. Release notes by the codex authors.',
        enabled: true,
        collectFrom: 0,
        consecutiveFailures: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    )
    await seedItem(t, ISSUE.itemUrls[0], {
      sourceId,
      publishedAt: Date.UTC(2026, 7, 22),
    })
    await t.mutation(internal.newsletter.prepareIssue, { slug: ISSUE.slug })

    const data = await t.query(internal.newsletter.issueForRender, {
      slug: ISSUE.slug,
    })

    expect(data!.items).toHaveLength(1)
    expect(data!.items[0].sourceName).toBe('codex releases')
    expect(data!.items[0].attribution).toMatch(/Apache-2.0/)
    expect(data!.items[0].publishedAt).toBe(Date.UTC(2026, 7, 22))
  })

  test('drops an item deleted after prepare rather than rendering a hole', async () => {
    const t = convexTest(schema, modules)
    const keep = await seedItem(t, ISSUE.itemUrls[0])
    const drop = await seedItem(t, ISSUE.itemUrls[1])
    await t.mutation(internal.newsletter.prepareIssue, { slug: ISSUE.slug })
    await t.run(async (ctx: any) => ctx.db.delete(drop))

    const data = await t.query(internal.newsletter.issueForRender, {
      slug: ISSUE.slug,
    })

    expect(data!.items).toHaveLength(1)
    expect(data!.items[0].url).toBe(ISSUE.itemUrls[0])
    expect(keep).toBeTruthy()
  })

  test('returns null when nothing has been prepared', async () => {
    const t = convexTest(schema, modules)
    expect(
      await t.query(internal.newsletter.issueForRender, { slug: ISSUE.slug }),
    ).toBeNull()
  })
})

describe('the rendered issue', () => {
  test('carries the unsubscribe placeholder the send personalizes', async () => {
    const html = await render(
      NewsletterIssueEmail({
        number: 1,
        slug: 'issue-1',
        subject: 'Subject line',
        preview: 'Preview text',
        intro: 'The intro.',
        items: [
          {
            headline: 'A headline',
            url: 'https://example.com/post',
            summary: 'Our own summary.',
          },
        ],
      }),
    )
    expect(html).toContain(UNSUBSCRIBE_PLACEHOLDER)
  })

  test('links each item to its source, and the issue to the main page', async () => {
    const html = await render(
      NewsletterIssueEmail({
        number: 3,
        slug: 'issue-3',
        subject: 'Subject line',
        preview: 'Preview text',
        items: [
          {
            headline: 'A headline',
            url: 'https://example.com/post',
            summary: 'Our own summary.',
            sourceName: 'Example',
            publishedAt: Date.UTC(2026, 7, 22),
            attribution: 'CC BY 4.0, Example.',
          },
        ],
      }),
    )

    // The item link goes to the source, as the re-serving policy requires.
    expect(html).toContain('https://example.com/post')
    // #203: the default target is the main page, and one quieter link points
    // at this issue's own archive page.
    expect(html).toContain('https://aistack.to/news/issue-3')
    expect(html).toContain('Read this issue in your browser')
    expect(html).toMatch(/href="https:\/\/aistack\.to"/)
    expect(html).toContain('Our own summary.')
    expect(html).toContain('CC BY 4.0, Example.')
    expect(html).toContain('Aug 22, 2026')
  })

  test('renders an item with no summary as its headline and link', async () => {
    const html = await render(
      NewsletterIssueEmail({
        number: 1,
        slug: 'issue-1',
        subject: 'Subject line',
        preview: 'Preview',
        items: [{ headline: 'Undrafted item', url: 'https://example.com/x' }],
      }),
    )
    expect(html).toContain('Undrafted item')
    expect(html).toContain('https://example.com/x')
  })
})

describe('the public archive', () => {
  test('lists only sent issues, newest first', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx: any) => {
      const base = {
        itemIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await ctx.db.insert('newsIssues', {
        ...base,
        number: 1,
        slug: 'issue-1',
        subject: 'One',
        status: 'sent',
        sentAt: 1,
      })
      await ctx.db.insert('newsIssues', {
        ...base,
        number: 2,
        slug: 'issue-2',
        subject: 'Two',
        status: 'sent',
        sentAt: 2,
      })
      await ctx.db.insert('newsIssues', {
        ...base,
        number: 3,
        slug: 'issue-3',
        subject: 'Three, still a draft',
        status: 'draft',
      })
    })

    const list = await t.query(api.newsletter.listSentIssues, {})

    expect(list.map((i: any) => i.slug)).toEqual(['issue-2', 'issue-1'])
  })

  test('a sent issue page opens the way to the other issues (#203)', async () => {
    const t = convexTest(schema, modules)
    const itemId = await seedItem(t, 'https://example.com/one')
    await t.run(async (ctx: any) => {
      const base = { createdAt: Date.now(), updatedAt: Date.now() }
      await ctx.db.insert('newsIssues', {
        ...base,
        number: 1,
        slug: 'issue-1',
        subject: 'One',
        status: 'sent',
        sentAt: 1,
        itemIds: [itemId],
      })
      await ctx.db.insert('newsIssues', {
        ...base,
        number: 2,
        slug: 'issue-2',
        subject: 'Two',
        status: 'sent',
        sentAt: 2,
        itemIds: [],
      })
    })

    const page = await t.query(api.newsletter.getSentIssue, { slug: 'issue-1' })

    expect(page!.number).toBe(1)
    expect(page!.items).toHaveLength(1)
    expect(page!.newer?.slug).toBe('issue-2')
    expect(page!.older).toBeNull()
    expect(page!.others.map((o: any) => o.slug)).toEqual(['issue-2'])
  })

  test('a draft issue is not public', async () => {
    const t = convexTest(schema, modules)
    await seedItem(t, ISSUE.itemUrls[0])
    await t.mutation(internal.newsletter.prepareIssue, { slug: ISSUE.slug })

    expect(
      await t.query(api.newsletter.getSentIssue, { slug: ISSUE.slug }),
    ).toBeNull()
  })
})

describe('subscribe', () => {
  test('takes an address once and reports a repeat as already subscribed', async () => {
    const t = convexTest(schema, modules)

    const first = await t.mutation(api.newsletter.subscribe, {
      email: ' Reader@Example.com ',
      source: 'subscribe-page',
    })
    const second = await t.mutation(api.newsletter.subscribe, {
      email: 'reader@example.com',
    })

    expect(first).toEqual({ ok: true, alreadySubscribed: false })
    expect(second).toEqual({ ok: true, alreadySubscribed: true })
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsletterSubscribers').collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].email).toBe('reader@example.com')
  })

  test('refuses something that is not an address', async () => {
    const t = convexTest(schema, modules)
    const result = await t.mutation(api.newsletter.subscribe, {
      email: 'not-an-address',
    })
    expect(result.ok).toBe(false)
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('newsletterSubscribers').collect(),
    )
    expect(rows).toHaveLength(0)
  })

  test('lifts an earlier newsletter refusal, because subscribing is explicit', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx: any) =>
      ctx.db.insert('emailPreferences', {
        email: 'reader@example.com',
        newsletter: false,
        importantUpdates: false,
        updatedAt: Date.now(),
      }),
    )

    await t.mutation(api.newsletter.subscribe, { email: 'reader@example.com' })

    const pref = await t.run(async (ctx: any) =>
      ctx.db
        .query('emailPreferences')
        .withIndex('by_email', (q: any) => q.eq('email', 'reader@example.com'))
        .first(),
    )
    expect(pref.newsletter).toBe(true)
    // The other category is untouched: one toggle, one meaning.
    expect(pref.importantUpdates).toBe(false)
  })

  test('rate limits a form loop on one address', async () => {
    const t = convexTest(schema, modules)
    const results = []
    for (let i = 0; i < 7; i++) {
      results.push(
        await t.mutation(api.newsletter.subscribe, {
          email: 'reader@example.com',
        }),
      )
    }
    const last = results[results.length - 1]
    expect(last.ok).toBe(false)
    expect(last.message).toMatch(/Too many/)
  })
})

describe('the preferences page', () => {
  beforeEach(() => {
    vi.stubEnv('BETTER_AUTH_SECRET', SECRET)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('a signed token reads that address, and absent reads as subscribed', async () => {
    const t = convexTest(schema, modules)
    const token = await signUnsubscribeToken('reader@example.com', SECRET)

    const prefs = await t.action(api.newsletter.preferencesByToken, { token })

    expect(prefs).toEqual({
      email: 'reader@example.com',
      newsletter: true,
      importantUpdates: true,
    })
  })

  test('a tampered token reads nothing', async () => {
    const t = convexTest(schema, modules)
    const token = await signUnsubscribeToken('reader@example.com', SECRET)
    const lastChar = token[token.length - 1]
    const tampered = `${token.slice(0, -1)}${lastChar === 'a' ? 'b' : 'a'}`

    expect(
      await t.action(api.newsletter.preferencesByToken, { token: tampered }),
    ).toBeNull()
  })

  test('saving both toggles writes one row the send filters by', async () => {
    const t = convexTest(schema, modules)
    const token = await signUnsubscribeToken('reader@example.com', SECRET)

    const result = await t.action(api.newsletter.setPreferencesByToken, {
      token,
      newsletter: false,
      importantUpdates: true,
    })

    expect(result.ok).toBe(true)
    const suppressed = await t.query(internal.email.getSuppressedEmails, {
      category: 'newsletter',
    })
    expect(suppressed).toEqual(['reader@example.com'])
    const stillGets = await t.query(internal.email.getSuppressedEmails, {
      category: 'important-updates',
    })
    expect(stillGets).toEqual([])
  })

  test('a tampered token changes nothing', async () => {
    const t = convexTest(schema, modules)

    const result = await t.action(api.newsletter.setPreferencesByToken, {
      token: 'nonsense.0000',
      newsletter: false,
      importantUpdates: false,
    })

    expect(result.ok).toBe(false)
    const rows = await t.run(async (ctx: any) =>
      ctx.db.query('emailPreferences').collect(),
    )
    expect(rows).toHaveLength(0)
  })
})

describe('the send audience', () => {
  test('counts subscribers and the waitlist, minus the newsletter refusals', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx: any) => {
      await ctx.db.insert('waitlist', {
        email: 'member@example.com',
        provider: 'email',
        status: 'pending',
        joinedAt: Date.now(),
        lookupId: 'a',
      })
      await ctx.db.insert('newsletterSubscribers', {
        email: 'reader@example.com',
        createdAt: Date.now(),
      })
      await ctx.db.insert('newsletterSubscribers', {
        email: 'gone@example.com',
        createdAt: Date.now(),
      })
      await ctx.db.insert('emailPreferences', {
        email: 'gone@example.com',
        newsletter: false,
        importantUpdates: true,
        updatedAt: Date.now(),
      })
    })

    const subscribers = await t.query(
      internal.newsletter.getSubscriberEmails,
      {},
    )
    const suppressed = await t.query(internal.email.getSuppressedEmails, {
      category: 'newsletter',
    })

    expect(subscribers.sort()).toEqual([
      'gone@example.com',
      'reader@example.com',
    ])
    expect(suppressed).toEqual(['gone@example.com'])
  })
})
