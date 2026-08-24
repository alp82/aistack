/**
 * The scraper lane of the news collector (#210, map #198).
 *
 * Ported from the proved prototype in `prototypes/news-scrapers/scrape.mjs`
 * (#180), which ran all nine vendor sources cold, steady, and with a forced
 * detection run against the live pages on 2026-08-19.
 *
 * A scraper answers ONE question: which entries on this page did we not see
 * before? Three mechanisms cover every vendor that ships:
 *
 *   sitemap  a new <loc> in a sitemap file is a new item
 *   links    a new article href on a server-rendered index page
 *   page     a new or changed dated section on one long page
 *
 * Everything here is a PURE function over text, like `convex/lib/feed.ts`.
 * The fetching, the state and the writes live in `convex/newsScrapers.ts`, so
 * a parser regression fails a unit test instead of a cron.
 *
 * Regex parsing, not a DOM: the Convex default runtime has no DOMParser.
 */

import { decodeEntities, stripTags } from './feed'

/** How much section text a full-text source may keep. Mirrors MAX_BODY_TEXT. */
export const MAX_SECTION_TEXT = 20_000

/**
 * The user agent the scraper lane sends.
 *
 * NOT the browser string the feed lane uses. Prototype finding 1: the honest
 * bot agent passes every scraped source, and a faked Chrome agent answers with
 * an endless redirect loop on ai.google.dev. The two lanes read different
 * hosts, so they carry different agents on purpose.
 */
export const SCRAPER_USER_AGENT =
  'Mozilla/5.0 (compatible; aistack-news-collector; +https://use-aistack.com)'

/**
 * The headers every scraper read sends, on either runtime.
 *
 * Two runtimes read these now (#262). The default Convex runtime sends them
 * from `convex/newsScrapers.ts`, and Node sends them from `convex/newsFetch.ts`
 * for the sources that need undici. One definition keeps the two reads
 * identical, so a routed source is not quietly a differently shaped request.
 */
export const SCRAPER_HEADERS: Record<string, string> = {
  'user-agent': SCRAPER_USER_AGENT,
  // Google serves a random language without this, which rewrites the page.
  'accept-language': 'en',
  accept: 'text/html,application/xhtml+xml,application/xml,*/*',
}

/** How long one scraper read may take, on either runtime. */
export const SCRAPER_FETCH_TIMEOUT_MS = 25_000

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Tags out, entities decoded, every run of whitespace collapsed to one space. */
export function plainText(html: string): string {
  return stripTags(html).replace(/\s+/g, ' ').trim()
}

/**
 * A short content fingerprint, used to notice that a section was edited.
 *
 * FNV-1a with the character count in front of it, not SHA-256. The Convex
 * default runtime offers only the async `crypto.subtle` digest, and making
 * every parser async to detect an edited paragraph is a bad trade. A length
 * mismatch already separates almost every pair, and the hash separates the
 * rest.
 */
export function textHash(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `${input.length}-${h.toString(16)}`
}

// ---------------------------------------------------------------------------
// Sitemaps and link indexes
// ---------------------------------------------------------------------------

export interface SitemapEntry {
  loc: string
  /** The `<lastmod>` value as written, or null. An UPDATE time, not a date. */
  lastmod: string | null
}

/** Every `<url>` of a sitemap file, in document order. */
export function parseSitemap(xml: string): SitemapEntry[] {
  const out: SitemapEntry[] = []
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block[1].match(/<loc>([^<]+)<\/loc>/)?.[1]
    if (!loc) continue
    out.push({
      loc: decodeEntities(loc.trim()),
      lastmod: block[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() ?? null,
    })
  }
  return out
}

/**
 * Article links on a server-rendered index page, absolute and deduplicated.
 *
 * `pattern` must carry one capture group and the `g` flag. The regex is reused
 * across calls, so `lastIndex` is reset before the walk.
 */
export function extractLinks(
  html: string,
  baseUrl: string,
  pattern: RegExp,
): string[] {
  pattern.lastIndex = 0
  const seen = new Set<string>()
  for (const match of html.matchAll(pattern)) {
    try {
      seen.add(new URL(decodeEntities(match[1]), baseUrl).href)
    } catch {
      // A href the URL parser refuses is not a link we can follow.
    }
  }
  return [...seen]
}

// ---------------------------------------------------------------------------
// Article pages
// ---------------------------------------------------------------------------

/** Vendor suffixes an og:title carries. They repeat the source name we hold. */
const TITLE_SUFFIXES =
  / *[|\-–] *(Anthropic|Claude by Anthropic|DeepSeek API Docs|NOUS RESEARCH|OpenAI|Kimi)$/

export interface ArticleMeta {
  headline: string | null
  /** The JSON-LD `datePublished`, as written. A real publish date. */
  published: string | null
}

/** The headline and the publish date of one article page. */
export function parseArticle(html: string): ArticleMeta {
  const og =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[1] ??
    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/)?.[1] ??
    html.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)?.[1] ??
    null
  const headline = og
    ? decodeEntities(og).replace(/\s+/g, ' ').trim().replace(TITLE_SUFFIXES, '').trim()
    : null
  return {
    headline: headline || null,
    published: html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? null,
  }
}

/**
 * A readable headline from a slug, for an article page that refused the fetch.
 *
 * The item still exists: the slug names it and the sitemap dates it. Losing the
 * item because its own page blocks robots would be the worse answer.
 */
export function headlineFromUrl(url: string): string {
  const slug =
    url
      .replace(/[#?].*$/, '')
      .replace(/\/+$/, '')
      .split('/')
      .pop() || url
  let words = slug
  try {
    words = decodeURIComponent(slug)
  } catch {
    // A slug with a stray percent sign stays as written.
  }
  const text = words.replace(/[-_]+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : url
}

// ---------------------------------------------------------------------------
// Long pages split into dated sections
// ---------------------------------------------------------------------------

export interface PageSection {
  /** The `<h2 id>`, which is the stable key of the section. */
  id: string
  label: string
  /** ISO day from the heading, or null when the heading carries no date. */
  date: string | null
  hash: string
  text: string
}

export interface SectionRule {
  /** Cut the page here before parsing. Drops navigation and footer noise. */
  endMarker?: string
  /** Null rejects a heading that is not content. */
  read: (id: string, heading: string) => { label: string; date: string | null } | null
}

/**
 * Split a page into keyed sections at `<h2 id="...">`.
 *
 * Script and style bodies go first. Prototype finding 5: a per-request
 * analytics blob otherwise changes the hash of every section on every read,
 * and the whole page reports itself as edited once every six hours.
 */
export function parseSections(rawHtml: string, rule: SectionRule): PageSection[] {
  let bounded = rawHtml
  if (rule.endMarker) {
    const cut = rawHtml.indexOf(rule.endMarker)
    if (cut !== -1) bounded = rawHtml.slice(0, cut + rule.endMarker.length)
  }
  const html = bounded
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')

  const headingRe = /<h2 [^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g
  const marks: Array<{ id: string; label: string; date: string | null; end: number }> = []
  let match = headingRe.exec(html)
  while (match !== null) {
    const heading =
      plainText(match[2]) ||
      decodeEntities(match[0].match(/data-text="([^"]+)"/)?.[1] ?? '')
    const read = rule.read(match[1], heading)
    if (read) marks.push({ id: match[1], ...read, end: headingRe.lastIndex })
    match = headingRe.exec(html)
  }

  return marks.map((mark, i) => {
    const rest = html.slice(mark.end)
    const stop = i + 1 < marks.length ? rest.indexOf('<h2') : -1
    const text = plainText(rest.slice(0, stop === -1 ? undefined : stop))
    return {
      id: mark.id,
      label: mark.label,
      date: mark.date,
      hash: textHash(text),
      text: text.slice(0, MAX_SECTION_TEXT),
    }
  })
}
