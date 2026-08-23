/// <reference types="vite/client" />
import { describe, expect, test } from 'vitest'
import { MAX_BODY_TEXT, newsUrlKey, parseFeed, stripTags } from './feed'

// The shapes below are cut down from the real bodies the prototype fetched
// (`prototypes/feed-poller/results.json`, 14 sources, 2026-08-19). Keep them
// representative rather than pretty: the parser exists to survive the wild.

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>OpenAI News</title>
  <link>https://openai.com/news/</link>
  <item>
    <title><![CDATA[Introducing something &amp; more]]></title>
    <link>https://openai.com/index/introducing-something/</link>
    <pubDate>Mon, 18 Aug 2026 10:00:00 GMT</pubDate>
    <description>A short teaser.</description>
    <content:encoded><![CDATA[<p>First para.</p><ul><li>one</li><li>two</li></ul>]]></content:encoded>
  </item>
  <item>
    <title>No date here</title>
    <link>https://openai.com/index/no-date/</link>
  </item>
</channel>
</rss>`

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Release notes from claude-code</title>
  <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-code/releases"/>
  <entry>
    <title>v2.4.0</title>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-code/releases/tag/v2.4.0"/>
    <link rel="edit" href="https://example.invalid/edit"/>
    <updated>2026-08-19T09:00:00Z</updated>
    <published>2026-08-18T09:00:00Z</published>
    <content type="html">&lt;p&gt;Fixed the thing.&lt;/p&gt;</content>
  </entry>
</feed>`

describe('parseFeed', () => {
  test('reads an RSS channel, its title, and its items', () => {
    const feed = parseFeed(RSS)
    expect(feed.format).toBe('rss')
    expect(feed.feedTitle).toBe('OpenAI News')
    expect(feed.items).toHaveLength(2)
  })

  test('unwraps CDATA and decodes entities in a title', () => {
    expect(parseFeed(RSS).items[0].title).toBe('Introducing something & more')
  })

  test('prefers the full content element over the teaser description', () => {
    expect(parseFeed(RSS).items[0].bodyText).toBe('First para.\n- one\n- two')
  })

  test('reads an RSS date as epoch milliseconds', () => {
    expect(parseFeed(RSS).items[0].publishedAt).toBe(
      Date.parse('Mon, 18 Aug 2026 10:00:00 GMT'),
    )
  })

  test('leaves publishedAt null when the entry carries no date', () => {
    const item = parseFeed(RSS).items[1]
    expect(item.publishedAt).toBeNull()
    expect(item.bodyText).toBeNull()
  })

  test('reads an Atom feed and picks the alternate link', () => {
    const feed = parseFeed(ATOM)
    expect(feed.format).toBe('atom')
    expect(feed.items[0].link).toBe(
      'https://github.com/anthropics/claude-code/releases/tag/v2.4.0',
    )
  })

  test('prefers published over updated on an Atom entry', () => {
    expect(parseFeed(ATOM).items[0].publishedAt).toBe(
      Date.parse('2026-08-18T09:00:00Z'),
    )
  })

  test('decodes escaped markup in Atom content', () => {
    expect(parseFeed(ATOM).items[0].bodyText).toBe('Fixed the thing.')
  })

  test('keeps a tag name that prose only mentions', () => {
    const feed = parseFeed(
      `<rss><channel><item><title>t</title><link>https://e.test/a</link><description>Write &lt;div&gt; by hand.</description></item></channel></rss>`,
    )
    expect(feed.items[0].bodyText).toBe('Write <div> by hand.')
  })

  test('drops an entry with no link, because nothing can dedupe it', () => {
    const feed = parseFeed(
      `<rss><channel><item><title>Orphan</title></item></channel></rss>`,
    )
    expect(feed.items).toHaveLength(0)
  })

  test('refuses a body that is neither RSS nor Atom', () => {
    expect(() => parseFeed('<html><body>Blocked</body></html>')).toThrow()
  })

  test('caps a very long body', () => {
    const long = 'x'.repeat(MAX_BODY_TEXT + 500)
    const feed = parseFeed(
      `<rss><channel><item><title>t</title><link>https://e.test/a</link><description>${long}</description></item></channel></rss>`,
    )
    expect(feed.items[0].bodyText).toHaveLength(MAX_BODY_TEXT)
  })
})

describe('stripTags', () => {
  test('drops script bodies rather than reading them as text', () => {
    expect(stripTags('<p>ok</p><script>alert(1)</script>')).toBe('ok')
  })

  test('turns a line break into a newline', () => {
    expect(stripTags('one<br />two')).toBe('one\ntwo')
  })
})

describe('newsUrlKey', () => {
  test('two links to one post agree once the campaign is dropped', () => {
    expect(newsUrlKey('https://www.example.com/post/?utm_source=aicrier')).toBe(
      newsUrlKey('https://example.com/post'),
    )
  })

  test('keeps a query parameter that names the item', () => {
    expect(newsUrlKey('https://www.youtube.com/watch?v=abc&utm_medium=x')).toBe(
      'youtube.com/watch?v=abc',
    )
  })

  test('orders query parameters, so argument order is not an identity', () => {
    expect(newsUrlKey('https://e.test/a?b=2&a=1')).toBe(
      newsUrlKey('https://e.test/a?a=1&b=2'),
    )
  })

  test('two different posts keep two different keys', () => {
    expect(newsUrlKey('https://e.test/a')).not.toBe(newsUrlKey('https://e.test/b'))
  })

  test('falls back to the trimmed string when the URL does not parse', () => {
    expect(newsUrlKey('  not a url  ')).toBe('not a url')
  })
})
