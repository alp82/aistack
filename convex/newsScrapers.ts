/**
 * The scraper lane of the news collector (#210, map #198).
 *
 * Phase 3 of docs/specs/news-pipeline.md. The feed lane in `convex/news.ts`
 * reads sources that publish a feed. This lane reads the vendors that publish
 * none, by noticing what changed on a page since the last run.
 *
 * Three parts:
 *
 *   1. The REGISTRY. One entry per scraped vendor, proved live in #180. Each
 *      entry needs a filter or a heading rule, so a scraper is code, not a row
 *      the owner types. The rows exist all the same: `ensureSourceRows` keeps
 *      one `newsSources` row per entry, which is where enable, health and the
 *      last error live, next to the feed sources in the same Sources view.
 *   2. The STATE. One `newsScraperState` row per source holds what the last run
 *      saw. A source with no state row is COLD: it seeds the baseline and emits
 *      nothing, because the archive behind a first read is history, not news.
 *   3. The RUN. `scrape` reads every enabled scraper and writes new items to
 *      the inbox through `internal.news.insertItem`, which owns the dedupe.
 *
 * The parsers are pure and live in `convex/lib/scrapers.ts`.
 */

import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server'
import { isAdmin } from './lib/admin'
import {
  SCRAPER_HEADERS,
  type SectionRule,
  extractLinks,
  headlineFromUrl,
  parseArticle,
  parseSections,
  parseSitemap,
} from './lib/scrapers'
import type { NewsLicenseClassType } from './schema'

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

interface ScraperBase {
  /** The stable identity of this scraper. It binds a source row to this entry. */
  slug: string
  name: string
  url: string
  licenseClass: NewsLicenseClassType
  /** The notice a full-text source must carry wherever we re-serve it. */
  attribution?: string
  /**
   * Read this source on Node instead of the default runtime (#262).
   *
   * The default runtime's fetch cannot reach every host. `claude.com` answers
   * it `HTTP 502` and answers Node 200. See `convex/newsFetch.ts` for why.
   *
   * Absent is the default, and it should stay the default. A Node action costs
   * a process hop per read, so a source earns this flag by failing without it.
   */
  runtime?: 'node'
}

interface UrlSetScraper extends ScraperBase {
  kind: 'sitemap' | 'links'
  /** Which of the listed URLs are articles. Everything else is a site page. */
  match: (url: string) => boolean
  /** `links` only: the href pattern of the index page. One capture group. */
  linkPattern?: RegExp
}

interface PageScraper extends ScraperBase {
  kind: 'page'
  /** Written in front of every item, because a section label alone is a date. */
  itemPrefix: string
  rule: SectionRule
}

export type ScraperDef = UrlSetScraper | PageScraper

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

/**
 * Every scraped vendor. All of these ran cold, steady and detection runs
 * against the live pages in the prototype (#180).
 *
 * Two sources the prototype proved are NOT here, and both are feeds:
 * openai.com publishes an RSS archive that the feed lane already reads, and pi
 * has no blog at all, so its `releases.atom` is a feed row. A scraper for
 * either would be a second, worse reader of a source we can read properly.
 */
export const SCRAPERS: ScraperDef[] = [
  {
    slug: 'anthropic-news',
    name: 'Anthropic news',
    kind: 'sitemap',
    url: 'https://www.anthropic.com/sitemap.xml',
    match: (u) => /^https:\/\/www\.anthropic\.com\/news\/[^/]+$/.test(u),
    licenseClass: 'article',
  },
  {
    slug: 'claude-blog',
    name: 'Claude blog',
    kind: 'sitemap',
    // Default locale only. The sitemap lists five localized copies per post,
    // and /<locale>/blog/<slug> is the same article in another language.
    url: 'https://claude.com/sitemap.xml',
    match: (u) => /^https:\/\/claude\.com\/blog\/[^/]+$/.test(u),
    licenseClass: 'article',
    // The default runtime gets HTTP 502 from claude.com, on the sitemap and on
    // every article page. Node gets 200 on both. This is the only source that
    // needs the hop, and claude.com/robots.txt allows every crawler on every
    // path, so the lane is reading what the site offers.
    runtime: 'node',
  },
  {
    slug: 'nous-hermes',
    name: 'Nous Research',
    kind: 'sitemap',
    // Posts are top-level slugs, and the sitemap does not separate them from
    // site pages. A new site page therefore reaches the inbox too. The
    // curation gate absorbs that, and a filter guessing at slugs would not.
    url: 'https://nousresearch.com/sitemap.xml',
    match: (u) => /^https:\/\/nousresearch\.com\/[^/]+\/$/.test(u),
    licenseClass: 'article',
  },
  {
    slug: 'deepseek-news',
    name: 'DeepSeek news',
    kind: 'sitemap',
    url: 'https://api-docs.deepseek.com/sitemap.xml',
    match: (u) => u.startsWith('https://api-docs.deepseek.com/news/'),
    licenseClass: 'article',
  },
  {
    slug: 'kimi-blog',
    name: 'Kimi blog',
    kind: 'links',
    // No Kimi sitemap covers the blog. The index page is server rendered, so a
    // new /blog/<slug> href is the whole signal.
    url: 'https://www.kimi.com/blog',
    linkPattern: /href="(\/blog\/[^"]+)"/g,
    match: (u) => /^https:\/\/www\.kimi\.com\/blog\/[^/]+$/.test(u),
    licenseClass: 'article',
  },
  {
    slug: 'gemini-changelog',
    name: 'Gemini API changelog',
    kind: 'page',
    // ?hl=en pins the language. Without it, and without the accept-language
    // header the lane sends, Google serves a machine-translated page and every
    // section hash changes.
    url: 'https://ai.google.dev/gemini-api/docs/changelog?hl=en',
    itemPrefix: 'Gemini API changelog',
    licenseClass: 'cc-by',
    attribution:
      'Google, Gemini API changelog, CC BY 4.0 (https://ai.google.dev/gemini-api/docs/changelog)',
    rule: {
      endMarker: '</article>',
      read: (id, heading) => {
        const m = id.match(/^(\d{2})-(\d{2})-(\d{4})$/)
        return m ? { label: heading, date: `${m[3]}-${m[1]}-${m[2]}` } : null
      },
    },
  },
  {
    slug: 'xai-release-notes',
    name: 'xAI API release notes',
    kind: 'page',
    // x.ai refuses every non-browser client, so the docs site is the only
    // scrapeable xAI surface. Its sections are MONTHS, not days: a release
    // lands as an edit inside the open month, never as a new heading.
    url: 'https://docs.x.ai/developers/release-notes',
    itemPrefix: 'xAI API release notes',
    licenseClass: 'unlicensed-release-notes',
    rule: {
      read: (id, heading) => {
        const m = id.match(/^([a-z]+)(?:-(\d{4}))?$/)
        if (!m || !MONTHS.includes(m[1])) return null
        // The heading of a past year already carries it: "November 2024". The
        // heading of the open month does not, so the id supplies the year and
        // two Augusts stay apart in the inbox.
        const year = m[2] ?? ''
        const label = !year || heading.includes(year) ? heading : `${heading} ${year}`
        return { label: label || id, date: null }
      },
    },
  },
]

const SCRAPERS_BY_SLUG = new Map(SCRAPERS.map((def) => [def.slug, def]))

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 25_000

/**
 * How many items one source may add in one run.
 *
 * A vendor that renames its URL scheme makes its whole archive look new. The
 * cap turns that from 250 inbox rows into ten runs of 25, and the uncollected
 * URLs stay OUT of the state, so the next run continues where this one stopped.
 */
const MAX_NEW_PER_RUN = 25

/**
 * When a baseline passes this, the source is close to the Convex array cap of
 * 8192. It is a warning line, not a limit: the run logs it and carries on.
 */
const KEY_COUNT_WARNING = 6000

// ---------------------------------------------------------------------------
// Source rows
// ---------------------------------------------------------------------------

/**
 * One `newsSources` row per registry entry, created on the first run.
 *
 * The row carries what the OWNER decides (enabled) and what the RUN writes
 * (health). Everything the code decides (name, url, kind, license) is patched
 * back from the registry, so editing an entry here moves production on the next
 * run instead of leaving a stale row behind.
 */
export const ensureSourceRows = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    for (const def of SCRAPERS) {
      const existing = await ctx.db
        .query('newsSources')
        .withIndex('by_scraperSlug', (q) => q.eq('scraperSlug', def.slug))
        .first()
      if (!existing) {
        await ctx.db.insert('newsSources', {
          name: def.name,
          slug: def.slug,
          scraperSlug: def.slug,
          kind: def.kind,
          url: def.url,
          licenseClass: def.licenseClass,
          attribution: def.attribution,
          enabled: true,
          // The scraper lane does not read this. Its floor is the baseline: a
          // cold run seeds every entry the page holds and emits none of them.
          collectFrom: now,
          consecutiveFailures: 0,
          createdAt: now,
          updatedAt: now,
        })
        continue
      }
      const drifted =
        existing.name !== def.name ||
        existing.url !== def.url ||
        existing.kind !== def.kind ||
        existing.licenseClass !== def.licenseClass ||
        existing.attribution !== def.attribution
      if (drifted) {
        await ctx.db.patch(existing._id, {
          name: def.name,
          url: def.url,
          kind: def.kind,
          licenseClass: def.licenseClass,
          attribution: def.attribution,
          updatedAt: now,
        })
      }
    }
  },
})

/** The enabled scraper rows, paired with their registry entry. */
export const enabledScraperSources = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('newsSources')
      .withIndex('by_enabled', (q) => q.eq('enabled', true))
      .collect()
    return rows.filter(
      (row) => row.scraperSlug && SCRAPERS_BY_SLUG.has(row.scraperSlug),
    )
  },
})

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export const readState = internalQuery({
  args: { sourceId: v.id('newsSources') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('newsScraperState')
      .withIndex('by_source', (q) => q.eq('sourceId', args.sourceId))
      .first()
  },
})

/**
 * Write the baseline back.
 *
 * `keys` REPLACES what was there, and the caller sends the union of the old
 * keys and the ones it just collected. A key is never dropped because an entry
 * left the page: a post pulled and restored is not news, and a month section
 * that scrolls off the page must not return as a new item a year later.
 */
export const writeState = internalMutation({
  args: {
    sourceId: v.id('newsSources'),
    keys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('newsScraperState')
      .withIndex('by_source', (q) => q.eq('sourceId', args.sourceId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { keys: args.keys, updatedAt: now })
      return
    }
    await ctx.db.insert('newsScraperState', {
      sourceId: args.sourceId,
      keys: args.keys,
      seededAt: now,
      updatedAt: now,
    })
  },
})

/** Forget one source's baseline. The next run is a cold run and emits nothing. */
export const resetState = internalMutation({
  args: { sourceId: v.id('newsSources') },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('newsScraperState')
      .withIndex('by_source', (q) => q.eq('sourceId', args.sourceId))
      .first()
    if (existing) await ctx.db.delete(existing._id)
  },
})

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

/**
 * Read one URL. The choke point of the whole lane.
 *
 * Every read goes through a `TextFetcher`: the sitemap, the index page, the
 * long page, and every article page. One seam is what let the Claude blog move
 * runtime without touching a parser (#262).
 */
type TextFetcher = (url: string) => Promise<string>

/** The default runtime's read. Every source but one uses this. */
async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: SCRAPER_HEADERS,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

/**
 * The read this source gets.
 *
 * A `node` source hops to `internal.newsFetch.fetchText`, which runs the same
 * request on undici. Everything else reads in place, because the hop costs a
 * process and buys nothing for a host that already answers.
 */
export function fetcherFor(ctx: ActionCtx, def: ScraperDef): TextFetcher {
  if (def.runtime !== 'node') return fetchText
  return (url) => ctx.runAction(internal.newsFetch.fetchText, { url })
}

/** Epoch ms from a date a page wrote, or null when it is not a date. */
function toEpoch(value: string | null): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

export interface ScrapeReport {
  source: string
  /** True on the run that seeded the baseline. It adds nothing on purpose. */
  seeded: boolean
  /** How many entries the page listed after the filter. */
  candidates: number
  added: number
  duplicates: number
  /** New entries this run left for the next one, because of MAX_NEW_PER_RUN. */
  deferred: number
  error: string | null
}

type ActionCtx = {
  runQuery: any
  runMutation: any
  runAction: any
}

/** List the article URLs of a sitemap, a sitemap index, or an index page. */
async function listUrls(
  def: UrlSetScraper,
  read: TextFetcher,
): Promise<Array<{ url: string; dateHint: string | null }>> {
  if (def.kind === 'links') {
    if (!def.linkPattern) throw new Error('a links scraper needs a linkPattern')
    const html = await read(def.url)
    return extractLinks(html, def.url, def.linkPattern)
      .filter(def.match)
      .map((url) => ({ url, dateHint: null }))
  }
  const out: Array<{ url: string; dateHint: string | null }> = []
  for (const entry of parseSitemap(await read(def.url))) {
    if (def.match(entry.loc)) {
      out.push({ url: entry.loc, dateHint: entry.lastmod })
    }
  }
  return out
}

/**
 * A sitemap or an index page: a URL we have not seen is a new item.
 *
 * The article page is read for its headline and its real publish date. That
 * read is best effort. A page that refuses us still yields an item, named by
 * its slug and dated by the sitemap, because dropping it would lose the news.
 */
async function runUrlSet(
  ctx: ActionCtx,
  source: Doc<'newsSources'>,
  def: UrlSetScraper,
  report: ScrapeReport,
  read: TextFetcher,
): Promise<void> {
  const listed = await listUrls(def, read)
  report.candidates = listed.length
  if (listed.length === 0) throw new Error('the page listed no articles')

  const state = await ctx.runQuery(internal.newsScrapers.readState, {
    sourceId: source._id,
  })
  if (state === null) {
    report.seeded = true
    await ctx.runMutation(internal.newsScrapers.writeState, {
      sourceId: source._id,
      keys: listed.map((entry) => entry.url),
    })
    return
  }

  const known = new Set<string>(state.keys)
  const fresh = listed.filter((entry) => !known.has(entry.url))
  report.deferred = Math.max(0, fresh.length - MAX_NEW_PER_RUN)

  for (const entry of fresh.slice(0, MAX_NEW_PER_RUN)) {
    let headline: string | null = null
    let published: number | null = null
    try {
      const meta = parseArticle(await read(entry.url))
      headline = meta.headline
      published = toEpoch(meta.published)
    } catch {
      // The article page refused us. The slug and the sitemap still name it.
    }
    const result = await ctx.runMutation(internal.news.insertItem, {
      url: entry.url,
      headline: headline ?? headlineFromUrl(entry.url),
      // The sitemap lastmod is an UPDATE time, so a real publish date wins.
      // With neither, the item carries no date and the collection time stands.
      publishedAt: published ?? toEpoch(entry.dateHint) ?? undefined,
      sourceId: source._id,
      intake: 'collector' as const,
      licenseClass: source.licenseClass,
    })
    if (result.added) report.added++
    else report.duplicates++
    known.add(entry.url)
  }

  await ctx.runMutation(internal.newsScrapers.writeState, {
    sourceId: source._id,
    keys: [...known],
  })
}

/**
 * One long page: a new dated section is a new item, and so is an edited one.
 *
 * An edit is not noise here, it is the main signal for a page that groups a
 * whole month under one heading. The state key carries the content hash, so a
 * section that changes twice reaches the inbox twice and a steady page reaches
 * it never.
 */
async function runPage(
  ctx: ActionCtx,
  source: Doc<'newsSources'>,
  def: PageScraper,
  report: ScrapeReport,
  read: TextFetcher,
): Promise<void> {
  const sections = parseSections(await read(def.url), def.rule)
  report.candidates = sections.length
  if (sections.length === 0) throw new Error('the page held no dated sections')

  const state = await ctx.runQuery(internal.newsScrapers.readState, {
    sourceId: source._id,
  })
  const keyOf = (section: { id: string; hash: string }) =>
    `${section.id}@${section.hash}`

  if (state === null) {
    report.seeded = true
    await ctx.runMutation(internal.newsScrapers.writeState, {
      sourceId: source._id,
      keys: sections.map(keyOf),
    })
    return
  }

  const known = new Set<string>(state.keys)
  const seenIds = new Set<string>(
    state.keys.map((key: string) => key.split('@')[0]),
  )
  const fresh = sections.filter((section) => !known.has(keyOf(section)))
  report.deferred = Math.max(0, fresh.length - MAX_NEW_PER_RUN)

  for (const section of fresh.slice(0, MAX_NEW_PER_RUN)) {
    const updated = seenIds.has(section.id)
    const result = await ctx.runMutation(internal.news.insertItem, {
      url: `${def.url}#${section.id}`,
      // The fragment is what separates one section from the next. Without it
      // every section of the page would dedupe onto one item, because the
      // dedupe key drops the fragment and the content hash both.
      fragmentKey: keyOf(section),
      headline: `${def.itemPrefix}: ${section.label}${updated ? ' (updated)' : ''}`,
      publishedAt: toEpoch(section.date) ?? undefined,
      sourceId: source._id,
      intake: 'collector' as const,
      licenseClass: source.licenseClass,
      // Kept only by a full-text license class. insertItem drops it otherwise.
      sourceText: section.text,
    })
    if (result.added) report.added++
    else report.duplicates++
    known.add(keyOf(section))
  }

  await ctx.runMutation(internal.newsScrapers.writeState, {
    sourceId: source._id,
    keys: [...known],
  })
}

async function scrapeOne(
  ctx: ActionCtx,
  source: Doc<'newsSources'>,
): Promise<ScrapeReport> {
  const report: ScrapeReport = {
    source: source.name,
    seeded: false,
    candidates: 0,
    added: 0,
    duplicates: 0,
    deferred: 0,
    error: null,
  }
  const def = source.scraperSlug
    ? SCRAPERS_BY_SLUG.get(source.scraperSlug)
    : undefined
  if (!def) {
    report.error = 'no scraper of that name'
    return report
  }
  const read = fetcherFor(ctx, def)
  try {
    if (def.kind === 'page') await runPage(ctx, source, def, report, read)
    else await runUrlSet(ctx, source, def, report, read)
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e)
  }
  await ctx.runMutation(internal.news.recordPoll, {
    sourceId: source._id,
    error: report.error,
  })
  return report
}

/**
 * The scraper run. One pass reads every enabled scraper.
 *
 * Serial, like the feed collector: nothing here races a deadline, and one slow
 * vendor is a poor reason to open eight connections at once. A failing source
 * never stops the run, and its error lands on its own row for the Sources view.
 */
export const scrape = internalAction({
  args: {},
  handler: async (ctx): Promise<ScrapeReport[]> => {
    await ctx.runMutation(internal.newsScrapers.ensureSourceRows, {})
    const sources: Doc<'newsSources'>[] = await ctx.runQuery(
      internal.newsScrapers.enabledScraperSources,
      {},
    )
    const reports: ScrapeReport[] = []
    for (const source of sources) {
      reports.push(await scrapeOne(ctx, source))
    }
    const added = reports.reduce((sum, r) => sum + r.added, 0)
    const failed = reports.filter((r) => r.error !== null).length
    const seeded = reports.filter((r) => r.seeded).length
    console.log(
      `news scrape: ${sources.length} sources, ${added} new items, ${seeded} seeded, ${failed} failed`,
    )
    for (const report of reports) {
      if (report.candidates > KEY_COUNT_WARNING) {
        console.warn(
          `news scrape: ${report.source} lists ${report.candidates} entries, near the state array cap`,
        )
      }
    }
    return reports
  },
})

/** Run the scrapers now, from the Sources view. The same path as the cron. */
export const scrapeNow = action({
  args: {},
  handler: async (ctx): Promise<ScrapeReport[]> => {
    if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
    return await ctx.runAction(internal.newsScrapers.scrape, {})
  },
})

/**
 * Forget one scraper's baseline, from the Sources view.
 *
 * The repair for a source whose page changed shape: the next run reads the page
 * cold, seeds the entries it holds now, and emits nothing. It is the only way
 * back from a baseline that no longer matches the page.
 */
export const resetBaseline = action({
  args: { sourceId: v.id('newsSources') },
  handler: async (ctx, args): Promise<null> => {
    if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
    await ctx.runMutation(internal.newsScrapers.resetState, {
      sourceId: args.sourceId as Id<'newsSources'>,
    })
    return null
  },
})
