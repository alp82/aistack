/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { ADMIN_EMAILS } from './lib/admin'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

const ANTHROPIC = 'https://www.anthropic.com/sitemap.xml'
const KIMI = 'https://www.kimi.com/blog'
const GEMINI = 'https://ai.google.dev/gemini-api/docs/changelog?hl=en'
const XAI = 'https://docs.x.ai/developers/release-notes'

function asAdmin(t: ReturnType<typeof convexTest>) {
  return t.withIdentity({
    tokenIdentifier: 'convex|admin',
    email: ADMIN_EMAILS[0],
  })
}

/** A sitemap holding the given article slugs, plus one site page. */
function sitemap(entries: Array<{ slug: string; lastmod?: string }>): string {
  const urls = entries
    .map(
      (e) => `<url><loc>https://www.anthropic.com/news/${e.slug}</loc>${
        e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''
      }</url>`,
    )
    .join('')
  return `<urlset><url><loc>https://www.anthropic.com/</loc></url>${urls}</urlset>`
}

function article(title: string, published?: string): string {
  return `<head><meta property="og:title" content="${title}"/>${
    published ? `<script>{"datePublished":"${published}"}</script>` : ''
  }</head>`
}

/** A changelog page. Each entry becomes one dated `<h2 id>` section. */
function changelog(entries: Array<{ id: string; body: string }>): string {
  const sections = entries
    .map(
      (e) =>
        `<h2 id="${e.id}" data-text="${e.id}" tabindex="-1">${e.id}</h2><p>${e.body}</p>`,
    )
    .join('')
  return `<article>${sections}</article>`
}

/**
 * A month-sectioned release-notes page, like the xAI docs site. The heading is
 * a link, and a past year writes the year into the heading as well as the id.
 */
function releaseNotes(
  entries: Array<{ id: string; body: string; heading?: string }>,
): string {
  return entries
    .map(
      (e) =>
        `<h2 id="${e.id}" class="text-xl"><a href="#${e.id}">${
          e.heading ?? e.id
        }</a></h2><div>${e.body}</div>`,
    )
    .join('')
}

/**
 * Answer each URL with a body, or with a status. Anything not named 404s, so a
 * test that forgets a page fails loudly instead of collecting silence.
 */
function stubFetch(pages: Record<string, string | { status: number }>) {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push(url)
      const page = pages[url]
      if (page === undefined) return new Response('missing', { status: 404 })
      if (typeof page !== 'string') {
        return new Response('refused', { status: page.status })
      }
      return new Response(page, { status: 200 })
    }),
  )
  return calls
}

/**
 * Create the registry rows and leave exactly one of them enabled.
 *
 * Every test drives one lane. Without this, all seven sources would run and a
 * test would have to answer seven pages to say anything about one.
 */
async function onlyScraper(
  t: ReturnType<typeof convexTest>,
  slug: string,
): Promise<Id<'newsSources'>> {
  await t.mutation(internal.newsScrapers.ensureSourceRows, {})
  return await t.run(async (ctx: any) => {
    const rows = await ctx.db.query('newsSources').collect()
    let wanted: Id<'newsSources'> | null = null
    for (const row of rows) {
      if (row.scraperSlug === slug) wanted = row._id
      else await ctx.db.patch(row._id, { enabled: false })
    }
    if (!wanted) throw new Error(`no scraper named ${slug}`)
    return wanted
  })
}

async function items(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx: any) =>
    ctx.db.query('newsItems').withIndex('by_state_collectedAt').collect(),
  )
}

async function keys(
  t: ReturnType<typeof convexTest>,
  sourceId: Id<'newsSources'>,
): Promise<string[]> {
  return await t.run(async (ctx: any) => {
    const state = await ctx.db
      .query('newsScraperState')
      .withIndex('by_source', (q: any) => q.eq('sourceId', sourceId))
      .first()
    return state?.keys ?? []
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// The source rows
// ---------------------------------------------------------------------------

describe('the registry rows', () => {
  test('the first run creates one row per scraper, and a second creates none', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(internal.newsScrapers.ensureSourceRows, {})
    const first = await t.run(async (ctx: any) =>
      ctx.db.query('newsSources').collect(),
    )
    await t.mutation(internal.newsScrapers.ensureSourceRows, {})
    const second = await t.run(async (ctx: any) =>
      ctx.db.query('newsSources').collect(),
    )
    expect(first).toHaveLength(7)
    expect(second).toHaveLength(7)
    expect(first.every((row: any) => row.scraperSlug && row.enabled)).toBe(true)
  })

  test('a row edited away from the registry is patched back, except its pause', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    await t.run(async (ctx: any) =>
      ctx.db.patch(sourceId, { url: 'https://example.invalid/', enabled: false }),
    )
    await t.mutation(internal.newsScrapers.ensureSourceRows, {})
    const row = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(row.url).toBe(ANTHROPIC)
    expect(row.enabled).toBe(false)
  })

  test('the Gemini row carries the attribution its license needs', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(internal.newsScrapers.ensureSourceRows, {})
    const row = await t.run(async (ctx: any) =>
      ctx.db
        .query('newsSources')
        .withIndex('by_scraperSlug', (q: any) =>
          q.eq('scraperSlug', 'gemini-changelog'),
        )
        .first(),
    )
    expect(row.licenseClass).toBe('cc-by')
    expect(row.attribution).toContain('CC BY 4.0')
  })

  test('a scraper row cannot be deleted, because the next run recreates it', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    await expect(
      asAdmin(t).mutation(api.news.deleteSource, { sourceId }),
    ).rejects.toThrow(/Pause it instead/)
  })
})

// ---------------------------------------------------------------------------
// The sitemap and link lanes
// ---------------------------------------------------------------------------

describe('the sitemap lane', () => {
  test('a cold run seeds the baseline and adds nothing', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'one' }, { slug: 'two' }]) })

    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.seeded).toBe(true)
    expect(report.candidates).toBe(2)
    expect(report.added).toBe(0)
    expect(await items(t)).toHaveLength(0)
    expect(await keys(t, sourceId)).toHaveLength(2)
  })

  test('the site page is not an article, so the filter drops it', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'one' }]) })
    await t.action(internal.newsScrapers.scrape, {})
    expect(await keys(t, sourceId)).toEqual([
      'https://www.anthropic.com/news/one',
    ])
  })

  test('a url the baseline has not seen becomes one inbox item', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'one' }]) })
    await t.action(internal.newsScrapers.scrape, {})

    stubFetch({
      [ANTHROPIC]: sitemap([
        { slug: 'one' },
        { slug: 'two', lastmod: '2026-08-01T00:00:00Z' },
      ]),
      'https://www.anthropic.com/news/two': article(
        'Introducing two',
        '2026-08-20T09:00:00Z',
      ),
    })
    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.added).toBe(1)
    const rows = await items(t)
    expect(rows).toHaveLength(1)
    expect(rows[0].headline).toBe('Introducing two')
    expect(rows[0].state).toBe('inbox')
    expect(rows[0].intake).toBe('collector')
    // The publish date on the page wins over the sitemap lastmod, which is an
    // update time.
    expect(rows[0].publishedAt).toBe(Date.parse('2026-08-20T09:00:00Z'))
  })

  test('a steady page adds nothing on the next run', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'anthropic-news')
    const pages = { [ANTHROPIC]: sitemap([{ slug: 'one' }]) }
    stubFetch(pages)
    await t.action(internal.newsScrapers.scrape, {})
    stubFetch(pages)
    const [report] = await t.action(internal.newsScrapers.scrape, {})
    expect(report.added).toBe(0)
    expect(await items(t)).toHaveLength(0)
  })

  test('an article page that refuses us still yields an item', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'one' }]) })
    await t.action(internal.newsScrapers.scrape, {})

    stubFetch({
      [ANTHROPIC]: sitemap([
        { slug: 'one' },
        { slug: 'claude-opus-4-5', lastmod: '2026-08-21T09:12:00Z' },
      ]),
      'https://www.anthropic.com/news/claude-opus-4-5': { status: 403 },
    })
    await t.action(internal.newsScrapers.scrape, {})

    const rows = await items(t)
    expect(rows).toHaveLength(1)
    expect(rows[0].headline).toBe('Claude opus 4 5')
    expect(rows[0].publishedAt).toBe(Date.parse('2026-08-21T09:12:00Z'))
  })

  test('one run adds at most 25 items, and the next one continues', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'seed' }]) })
    await t.action(internal.newsScrapers.scrape, {})

    const many = [{ slug: 'seed' }]
    const pages: Record<string, string> = {}
    for (let n = 0; n < 30; n++) {
      many.push({ slug: `post-${n}` })
      pages[`https://www.anthropic.com/news/post-${n}`] = article(`Post ${n}`)
    }
    pages[ANTHROPIC] = sitemap(many)

    stubFetch(pages)
    const [first] = await t.action(internal.newsScrapers.scrape, {})
    expect(first.added).toBe(25)
    expect(first.deferred).toBe(5)

    stubFetch(pages)
    const [second] = await t.action(internal.newsScrapers.scrape, {})
    expect(second.added).toBe(5)
    expect(second.deferred).toBe(0)
    expect(await items(t)).toHaveLength(30)
  })

  test('a page that lists nothing is a failure, not an empty baseline', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: '<urlset></urlset>' })

    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.error).toBe('the page listed no articles')
    expect(await keys(t, sourceId)).toHaveLength(0)
    const row = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(row.consecutiveFailures).toBe(1)
    expect(row.lastError).toBe('the page listed no articles')
  })

  test('a source that fails does not stop the sources after it', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(internal.newsScrapers.ensureSourceRows, {})
    await t.run(async (ctx: any) => {
      const rows = await ctx.db.query('newsSources').collect()
      for (const row of rows) {
        const keep =
          row.scraperSlug === 'anthropic-news' || row.scraperSlug === 'kimi-blog'
        if (!keep) await ctx.db.patch(row._id, { enabled: false })
      }
    })
    stubFetch({
      [ANTHROPIC]: { status: 500 },
      [KIMI]: '<a href="/blog/kimi-k3">K3</a>',
    })

    const reports = await t.action(internal.newsScrapers.scrape, {})

    expect(reports).toHaveLength(2)
    expect(reports.find((r) => r.source === 'Anthropic news')?.error).toBe(
      'HTTP 500',
    )
    expect(reports.find((r) => r.source === 'Kimi blog')?.seeded).toBe(true)
  })

  test('a run that works clears the error the last one left', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: { status: 500 } })
    await t.action(internal.newsScrapers.scrape, {})
    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'one' }]) })
    await t.action(internal.newsScrapers.scrape, {})

    const row = await t.run(async (ctx: any) => ctx.db.get(sourceId))
    expect(row.lastError).toBeUndefined()
    expect(row.consecutiveFailures).toBe(0)
  })
})

describe('the link lane', () => {
  test('a new href on the index page becomes an item', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'kimi-blog')
    stubFetch({ [KIMI]: '<a href="/blog/kimi-k3">K3</a>' })
    await t.action(internal.newsScrapers.scrape, {})

    stubFetch({
      [KIMI]: '<a href="/blog/kimi-k3">K3</a><a href="/blog/kimi-k4">K4</a>',
      'https://www.kimi.com/blog/kimi-k4': article('Kimi K4 Tech Blog'),
    })
    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.added).toBe(1)
    expect((await items(t))[0].headline).toBe('Kimi K4 Tech Blog')
  })
})

// ---------------------------------------------------------------------------
// The page lane
// ---------------------------------------------------------------------------

describe('the page lane', () => {
  test('a cold run seeds every section and adds nothing', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'gemini-changelog')
    stubFetch({
      [GEMINI]: changelog([{ id: '08-13-2026', body: 'Flash is GA.' }]),
    })

    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.seeded).toBe(true)
    expect(await items(t)).toHaveLength(0)
    expect(await keys(t, sourceId)).toHaveLength(1)
  })

  test('a new dated section becomes one item, with the full text it may keep', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'gemini-changelog')
    stubFetch({
      [GEMINI]: changelog([{ id: '08-13-2026', body: 'Flash is GA.' }]),
    })
    await t.action(internal.newsScrapers.scrape, {})

    stubFetch({
      [GEMINI]: changelog([
        { id: '08-20-2026', body: 'Batch mode is GA.' },
        { id: '08-13-2026', body: 'Flash is GA.' },
      ]),
    })
    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.added).toBe(1)
    const rows = await items(t)
    expect(rows[0].headline).toBe('Gemini API changelog: 08-20-2026')
    expect(rows[0].url).toBe(`${GEMINI}#08-20-2026`)
    expect(rows[0].publishedAt).toBe(Date.parse('2026-08-20'))
    // cc-by: full text with attribution, so the body is kept.
    expect(rows[0].sourceText).toContain('Batch mode is GA.')
  })

  test('two sections of one page are two items, not one', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'gemini-changelog')
    stubFetch({ [GEMINI]: changelog([{ id: '08-13-2026', body: 'One.' }]) })
    await t.action(internal.newsScrapers.scrape, {})

    stubFetch({
      [GEMINI]: changelog([
        { id: '08-21-2026', body: 'Three.' },
        { id: '08-20-2026', body: 'Two.' },
        { id: '08-13-2026', body: 'One.' },
      ]),
    })
    await t.action(internal.newsScrapers.scrape, {})

    const rows = await items(t)
    expect(rows).toHaveLength(2)
    expect(new Set(rows.map((r: any) => r.urlKey)).size).toBe(2)
  })

  test('an unchanged page adds nothing on the next run', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'gemini-changelog')
    const page = changelog([{ id: '08-13-2026', body: 'Flash is GA.' }])
    stubFetch({ [GEMINI]: page })
    await t.action(internal.newsScrapers.scrape, {})
    stubFetch({ [GEMINI]: page })
    const [report] = await t.action(internal.newsScrapers.scrape, {})
    expect(report.added).toBe(0)
  })

  test('an edited section returns as an update, which is how a month page moves', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'xai-release-notes')
    stubFetch({
      [XAI]: releaseNotes([{ id: 'august', body: 'August 12 Grok 4.6.' }]),
    })
    await t.action(internal.newsScrapers.scrape, {})

    stubFetch({
      [XAI]: releaseNotes([
        { id: 'august', body: 'August 20 Grok 4.7. August 12 Grok 4.6.' },
      ]),
    })
    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.added).toBe(1)
    const rows = await items(t)
    expect(rows[0].headline).toBe('xAI API release notes: august (updated)')
    // Unlicensed release notes: our summary plus a link, never the body.
    expect(rows[0].sourceText).toBeUndefined()
    expect(rows[0].publishedAt).toBeUndefined()
  })

  test('a month heading says its year once, whichever half of the page wrote it', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'xai-release-notes')
    stubFetch({
      [XAI]: releaseNotes([{ id: 'august', heading: 'August', body: 'seed' }]),
    })
    await t.action(internal.newsScrapers.scrape, {})

    stubFetch({
      [XAI]: releaseNotes([
        { id: 'august', heading: 'August', body: 'seed' },
        // A past year writes the year into the heading AND the id.
        { id: 'november-2024', heading: 'November 2024', body: 'grok-2 beta.' },
      ]),
    })
    await t.action(internal.newsScrapers.scrape, {})

    const rows = await items(t)
    expect(rows[0].headline).toBe('xAI API release notes: November 2024')
  })

  test('a section edited twice reaches the inbox twice', async () => {
    const t = convexTest(schema, modules)
    await onlyScraper(t, 'xai-release-notes')
    for (const body of ['one', 'one two', 'one two three']) {
      stubFetch({ [XAI]: releaseNotes([{ id: 'august', body }]) })
      await t.action(internal.newsScrapers.scrape, {})
    }
    expect(await items(t)).toHaveLength(2)
  })

  test('a page with no dated section is a failure, not an empty baseline', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'gemini-changelog')
    stubFetch({ [GEMINI]: '<article><h2 id="intro">Intro</h2></article>' })

    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.error).toBe('the page held no dated sections')
    expect(await keys(t, sourceId)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// The owner's two controls
// ---------------------------------------------------------------------------

describe('the Sources view controls', () => {
  test('a paused scraper is not read', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    await t.run(async (ctx: any) => ctx.db.patch(sourceId, { enabled: false }))
    const calls = stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'one' }]) })

    const reports = await t.action(internal.newsScrapers.scrape, {})

    expect(reports).toHaveLength(0)
    expect(calls).toHaveLength(0)
  })

  test('a reset baseline makes the next run cold again', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'one' }]) })
    await t.action(internal.newsScrapers.scrape, {})

    await asAdmin(t).action(api.newsScrapers.resetBaseline, { sourceId })

    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'one' }, { slug: 'two' }]) })
    const [report] = await t.action(internal.newsScrapers.scrape, {})
    expect(report.seeded).toBe(true)
    expect(report.added).toBe(0)
  })

  test('only an admin may run the scrapers or reset a baseline', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    await expect(t.action(api.newsScrapers.scrapeNow, {})).rejects.toThrow(
      /Unauthorized/,
    )
    await expect(
      t.action(api.newsScrapers.resetBaseline, { sourceId }),
    ).rejects.toThrow(/Unauthorized/)
  })
})

// ---------------------------------------------------------------------------
// The two lanes stay apart
// ---------------------------------------------------------------------------

describe('the feed collector and the scrapers', () => {
  test('the feed collector never reads a scraper row', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(internal.newsScrapers.ensureSourceRows, {})
    const calls = stubFetch({})

    const reports = await t.action(internal.news.collect, {})

    expect(reports).toHaveLength(0)
    expect(calls).toHaveLength(0)
  })

  test('one item collected by both lanes is one row', async () => {
    const t = convexTest(schema, modules)
    const sourceId = await onlyScraper(t, 'anthropic-news')
    stubFetch({ [ANTHROPIC]: sitemap([{ slug: 'seed' }]) })
    await t.action(internal.newsScrapers.scrape, {})

    // The same post, already in the inbox from a feed that reposted it.
    await t.mutation(internal.news.insertItem, {
      url: 'https://www.anthropic.com/news/two/',
      headline: 'From the feed',
      intake: 'collector',
      licenseClass: 'article',
    })

    stubFetch({
      [ANTHROPIC]: sitemap([{ slug: 'seed' }, { slug: 'two' }]),
      'https://www.anthropic.com/news/two': article('From the scraper'),
    })
    const [report] = await t.action(internal.newsScrapers.scrape, {})

    expect(report.added).toBe(0)
    expect(report.duplicates).toBe(1)
    const rows = await items(t)
    expect(rows).toHaveLength(1)
    expect(rows[0].headline).toBe('From the feed')
    expect(rows[0].sourceId).toBeUndefined()
    expect(sourceId).toBeDefined()
  })
})
