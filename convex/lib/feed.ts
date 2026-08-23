/**
 * The generic RSS/Atom reader behind the collector (#204, map #198).
 *
 * Ported from the proved prototype in `prototypes/feed-poller/poller.mjs`
 * (#177), which polled all 14 phase-1 sources of
 * `docs/specs/news-pipeline.md` and parsed every one. Two entry shapes cover
 * the whole set: RSS 2.0 on the blogs and newsletters, Atom on GitHub, YouTube
 * and simonwillison.net.
 *
 * Regex parsing, not a DOM. Convex's default runtime has no DOMParser, and a
 * real XML library is a dependency this one job does not earn. The shapes it
 * has to survive are narrow: feeds, not arbitrary markup.
 *
 * Pure functions only. Everything here is called from `convex/news.ts` and is
 * tested directly, so a feed regression fails a unit test instead of a cron.
 */

/** How much stored body text one item may carry. See `bodyText` below. */
export const MAX_BODY_TEXT = 20_000

export interface ParsedFeedItem {
  title: string
  link: string
  /** Epoch ms from the entry's own date. Null when the feed carries none. */
  publishedAt: number | null
  /**
   * The entry body as PLAIN TEXT, tags stripped.
   *
   * Deliberately not HTML. A feed body is attacker-shaped markup from a third
   * party, and the projections that re-serve it (`#211`) would have to sanitize
   * it on every read. Plain text loses list structure in release notes and
   * keeps every word, which is what "full text with attribution" needs.
   */
  bodyText: string | null
}

export interface ParsedFeed {
  format: 'rss' | 'atom'
  feedTitle: string | null
  items: ParsedFeedItem[]
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(Number.parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) => NAMED_ENTITIES[name])
}

/**
 * Markup to readable text. Block-level ends become newlines so a release-note
 * list does not collapse into one run-on line.
 */
export function stripTags(html: string): string {
  const withBreaks = html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote|pre)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ')
  return decodeEntities(withBreaks.replace(/<[^>]+>/g, ''))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * One decode pass over a body that arrived as ESCAPED markup.
 *
 * Atom `content type="html"` carries the body entity-escaped, which is how
 * GitHub serves release notes. Without this pass `stripTags` finds no tags to
 * remove and prints `<p>` as if it were prose.
 *
 * The trigger is an escaped CLOSING tag, not any escaped `<`. Prose that
 * mentions `&lt;div&gt;` in passing keeps its literal text, because prose
 * rarely closes the tag it names.
 */
function unescapeMarkup(raw: string): string {
  if (/<[a-z/][^>]*>/i.test(raw)) return raw
  return /&lt;\/[a-z]/i.test(raw) ? decodeEntities(raw) : raw
}

/** Raw inner text of the first `<tag>` in `block`, CDATA unwrapped. */
function rawOf(block: string, tag: string): string | null {
  const m = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'),
  )
  if (!m) return null
  const value = m[1].trim()
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  return cdata ? cdata[1].trim() : value
}

/** Inner text of the first `<tag>`, stripped to plain text. */
function textOf(block: string, tag: string): string | null {
  const raw = rawOf(block, tag)
  if (raw === null) return null
  const text = stripTags(raw)
  return text.length > 0 ? text : null
}

/**
 * The alternate link of an Atom entry. Atom writes the target in an attribute,
 * and an entry carries several `<link>` elements (alternate, replies, edit).
 */
function atomLink(block: string): string | null {
  const links = [...block.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0])
  const pick =
    links.find((l) => /rel=["']alternate["']/i.test(l)) ??
    links.find((l) => !/rel=/i.test(l)) ??
    links[0]
  const href = pick?.match(/href=["']([^"']+)["']/i)
  return href ? decodeEntities(href[1]) : null
}

function toEpochMs(raw: string | null): number | null {
  if (!raw) return null
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? null : parsed
}

function capped(text: string | null): string | null {
  if (text === null || text.length === 0) return null
  return text.length > MAX_BODY_TEXT ? text.slice(0, MAX_BODY_TEXT) : text
}

/**
 * Parse one feed document. Throws when the body is neither RSS nor Atom, which
 * is how a source that started serving an error page announces itself.
 *
 * Entries with no title or no link are dropped: an item with no link cannot be
 * deduped, approved, or published, so it is not an item.
 */
export function parseFeed(xml: string): ParsedFeed {
  const hasRss = /<rss[\s>]/i.test(xml)
  const isAtom = /<feed[\s>]/i.test(xml) && !hasRss
  if (!isAtom && !hasRss) {
    throw new Error('neither <rss> nor <feed> found')
  }
  const format: 'rss' | 'atom' = isAtom ? 'atom' : 'rss'

  const entryRe = isAtom
    ? /<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi
    : /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi
  const blocks = xml.match(entryRe) ?? []

  const firstBlock = blocks[0]
  const head = xml.slice(0, firstBlock ? xml.indexOf(firstBlock) : xml.length)
  const feedTitle = textOf(head, 'title')

  const items: ParsedFeedItem[] = []
  for (const block of blocks) {
    const title = textOf(block, 'title')
    const link = isAtom
      ? atomLink(block)
      : (rawOf(block, 'link') ?? atomLink(block))
    if (!title || !link) continue

    const rawDate = isAtom
      ? (rawOf(block, 'published') ?? rawOf(block, 'updated'))
      : (rawOf(block, 'pubDate') ?? rawOf(block, 'dc:date'))
    const rawBody = isAtom
      ? (rawOf(block, 'content') ?? rawOf(block, 'summary'))
      : (rawOf(block, 'content:encoded') ?? rawOf(block, 'description'))

    items.push({
      title,
      link: decodeEntities(link.trim()),
      publishedAt: toEpochMs(rawDate),
      bodyText: capped(
        rawBody === null ? null : stripTags(unescapeMarkup(rawBody)),
      ),
    })
  }

  return { format, feedTitle, items }
}

/**
 * Query keys that identify the campaign that sent a visitor, never the item.
 * Two links to the same post differing only in these are one news item.
 */
const TRACKING_PARAMS = [
  'fbclid',
  'gclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'ref',
  'ref_src',
  'source',
]

/**
 * The dedupe key for a link. One post reaches the collector by several routes
 * (a vendor feed and the aggregator that reposted it), so the raw URL is not
 * an identity.
 *
 * Lossy ON PURPOSE, and never shown: the item stores the URL it arrived with
 * and shows that one. This value only answers "have I seen this already".
 */
export function newsUrlKey(rawUrl: string): string {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return rawUrl.trim().toLowerCase()
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const params = [...url.searchParams.entries()]
    .filter(
      ([k]) =>
        !k.toLowerCase().startsWith('utm_') &&
        !TRACKING_PARAMS.includes(k.toLowerCase()),
    )
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const query = params.map(([k, val]) => `${k}=${val}`).join('&')
  const path = url.pathname.replace(/\/+$/, '')
  return `${host}${path}${query ? `?${query}` : ''}`
}
