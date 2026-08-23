/// <reference types="vite/client" />
import { describe, expect, test } from 'vitest'
import {
  extractLinks,
  headlineFromUrl,
  parseArticle,
  parseSections,
  parseSitemap,
  plainText,
  textHash,
} from './scrapers'

// Every fixture below is cut down from the real body the scraper fetched on
// 2026-08-23. Keep them faithful rather than tidy: the parsers exist to survive
// the wild, and a hand-written shape proves nothing about the live page.

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://www.anthropic.com/</loc>
<lastmod>2026-08-23T13:00:57.295Z</lastmod>
</url>
<url>
<loc>https://www.anthropic.com/news/claude-opus-4-5</loc>
<lastmod>2026-08-21T09:12:00.000Z</lastmod>
</url>
<url>
<loc>https://www.anthropic.com/news/context-windows?ref=a&amp;b=2</loc>
</url>
</urlset>`

// The Gemini changelog. The heading carries the date twice: once in the id and
// once in data-text. The script tag is the analytics blob that would otherwise
// change every hash on every read.
const CHANGELOG = `<article>
<h2 id="08-13-2026" data-text="August 13, 2026" tabindex="-1">August 13, 2026</h2>
<ul><li>Gemini 3.7 Flash generally available.</li></ul>
<script>window.ping({t:1755950000})</script>
<h2 id="07-30-2026" data-text="July 30, 2026" tabindex="-1">July 30, 2026</h2>
<ul><li>Gemini Robotics ER 2 in public preview.</li></ul>
<h2 id="related-content" data-text="Related content" tabindex="-1">Related content</h2>
<p>Not a changelog entry.</p>
</article>
<footer><h2 id="09-09-2099">A heading past the article</h2></footer>`

// The xAI release notes. Sections are MONTHS, and the heading is a link.
const RELEASE_NOTES = `<div>
<h2 id="august" class="scroll-mt-28 text-xl"><a class="not-prose" href="#august">August</a></h2>
<div>August 12 Grok 4.6 is available.</div>
<h2 id="december-2025" class="text-xl"><a href="#december-2025">December</a></h2>
<div>December 2 grok-3 pricing changed.</div>
<h2 id="pricing" class="text-xl"><a href="#pricing">Pricing</a></h2>
<div>Not a month.</div>
</div>`

const MONTH_RULE = {
  read: (id: string, heading: string) => {
    const m = id.match(/^([a-z]+)(?:-(\d{4}))?$/)
    const months = ['august', 'december']
    if (!m || !months.includes(m[1])) return null
    return { label: heading + (m[2] ? ` ${m[2]}` : ''), date: null }
  },
}

const DAY_RULE = {
  endMarker: '</article>',
  read: (id: string, heading: string) => {
    const m = id.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    return m ? { label: heading, date: `${m[3]}-${m[1]}-${m[2]}` } : null
  },
}

describe('parseSitemap', () => {
  test('reads every url, with its lastmod when the file carries one', () => {
    const entries = parseSitemap(SITEMAP)
    expect(entries).toHaveLength(3)
    expect(entries[1]).toEqual({
      loc: 'https://www.anthropic.com/news/claude-opus-4-5',
      lastmod: '2026-08-21T09:12:00.000Z',
    })
    expect(entries[2].lastmod).toBeNull()
  })

  test('decodes the entities a sitemap escapes in a url', () => {
    expect(parseSitemap(SITEMAP)[2].loc).toBe(
      'https://www.anthropic.com/news/context-windows?ref=a&b=2',
    )
  })

  test('an unparseable body yields no entries rather than throwing', () => {
    expect(parseSitemap('<html>404 not found</html>')).toEqual([])
  })
})

describe('extractLinks', () => {
  const INDEX = `<a href="/blog/kimi-k3">K3</a>
    <a href="/blog/kimi-k3">K3 again</a>
    <a href="/blog/perception-bench">Bench</a>
    <a href="/about">About</a>`

  test('makes the hrefs absolute and keeps each one once', () => {
    expect(
      extractLinks(INDEX, 'https://www.kimi.com/blog', /href="(\/blog\/[^"]+)"/g),
    ).toEqual([
      'https://www.kimi.com/blog/kimi-k3',
      'https://www.kimi.com/blog/perception-bench',
    ])
  })

  test('the same pattern works twice, because lastIndex is reset', () => {
    const pattern = /href="(\/blog\/[^"]+)"/g
    const base = 'https://www.kimi.com/blog'
    expect(extractLinks(INDEX, base, pattern)).toEqual(
      extractLinks(INDEX, base, pattern),
    )
  })
})

describe('parseSections', () => {
  test('keys a dated section by its id and reads its date and body', () => {
    const sections = parseSections(CHANGELOG, DAY_RULE)
    expect(sections.map((s) => s.id)).toEqual(['08-13-2026', '07-30-2026'])
    expect(sections[0].date).toBe('2026-08-13')
    expect(sections[0].label).toBe('August 13, 2026')
    expect(sections[0].text).toContain('Gemini 3.7 Flash generally available.')
  })

  test('a section stops at the next heading', () => {
    const sections = parseSections(CHANGELOG, DAY_RULE)
    expect(sections[0].text).not.toContain('Robotics')
  })

  test('the end marker drops everything after the article', () => {
    expect(parseSections(CHANGELOG, DAY_RULE).map((s) => s.id)).not.toContain(
      '09-09-2099',
    )
  })

  test('a script body never reaches the hash', () => {
    const before = parseSections(CHANGELOG, DAY_RULE)[0]
    const after = parseSections(
      CHANGELOG.replace('t:1755950000', 't:1755960000'),
      DAY_RULE,
    )[0]
    expect(after.hash).toBe(before.hash)
  })

  test('an edited body changes the hash of that section alone', () => {
    const before = parseSections(CHANGELOG, DAY_RULE)
    const after = parseSections(
      CHANGELOG.replace('generally available', 'now generally available'),
      DAY_RULE,
    )
    expect(after[0].hash).not.toBe(before[0].hash)
    expect(after[1].hash).toBe(before[1].hash)
  })

  test('a month heading keeps its year and a non-month heading is dropped', () => {
    const sections = parseSections(RELEASE_NOTES, MONTH_RULE)
    expect(sections.map((s) => s.label)).toEqual(['August', 'December 2025'])
    expect(sections[0].date).toBeNull()
    expect(sections[0].text).toContain('Grok 4.6')
  })
})

describe('parseArticle', () => {
  test('prefers og:title and reads the JSON-LD publish date', () => {
    const html = `<head>
      <title>Claude Opus 4.5 \\ Anthropic</title>
      <meta property="og:title" content="Introducing Claude Opus 4.5"/>
      <script type="application/ld+json">{"datePublished":"2026-08-21T09:00:00Z"}</script>
    </head>`
    expect(parseArticle(html)).toEqual({
      headline: 'Introducing Claude Opus 4.5',
      published: '2026-08-21T09:00:00Z',
    })
  })

  test('falls back to the title tag and drops the vendor suffix', () => {
    const html = '<head><title>Kimi K3 Tech Blog - Kimi</title></head>'
    expect(parseArticle(html).headline).toBe('Kimi K3 Tech Blog')
  })

  test('a page with neither yields nulls rather than an invented headline', () => {
    expect(parseArticle('<html><body>nope</body></html>')).toEqual({
      headline: null,
      published: null,
    })
  })
})

describe('headlineFromUrl', () => {
  test('reads a slug as words', () => {
    expect(headlineFromUrl('https://www.anthropic.com/news/claude-opus-4-5')).toBe(
      'Claude opus 4 5',
    )
  })

  test('survives a trailing slash and a percent escape', () => {
    expect(headlineFromUrl('https://nousresearch.com/hermes%2D4/')).toBe('Hermes 4')
  })
})

describe('textHash', () => {
  test('the same text hashes the same way twice', () => {
    expect(textHash('one two')).toBe(textHash('one two'))
  })

  test('a one-character edit changes the hash', () => {
    expect(textHash('one two')).not.toBe(textHash('one twp'))
  })

  test('the length rides in front, so a length change always shows', () => {
    expect(textHash('abc').startsWith('3-')).toBe(true)
  })
})

describe('plainText', () => {
  test('collapses every run of whitespace to one space', () => {
    expect(plainText('<p>one\n\n  two</p>\n<p>three</p>')).toBe('one two three')
  })
})
