#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#212). Throwaway code, not production.
//
// Collects a REAL item stream for the knowledge base demo: the phase-1 feeds,
// the Hacker News lane, one cc-by page source, and one X post through the
// official oEmbed endpoint. Every license class in the re-serving table
// (docs/specs/news-pipeline.md) gets at least one real row, because the page
// shape has to render all six.
//
// It also pulls a short text extract from each page, so the summaries in
// stream.json are written from the real article and not from the headline.
//
// Run: node collect.mjs   -> writes collected.json next to itself.

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

// A normal browser UA for the feed lane, an honest bot UA for the page lane:
// ai.google.dev answers a faked browser with a redirect loop (#210).
const BROWSER_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const BOT_UA =
  'Mozilla/5.0 (compatible; aistack-news-collector-prototype; +https://use-aistack.com)'

const WINDOW_DAYS = 21
const cutoff = Date.now() - WINDOW_DAYS * 24 * 3600 * 1000

const FEEDS = [
  { id: 'openai-news', name: 'OpenAI News', licenseClass: 'article', url: 'https://openai.com/news/rss.xml' },
  { id: 'google-ai-blog', name: 'Google AI Blog', licenseClass: 'article', url: 'https://blog.google/technology/ai/rss/' },
  { id: 'latent-space', name: 'Latent Space', licenseClass: 'article', url: 'https://www.latent.space/feed' },
  { id: 'simonwillison', name: 'Simon Willison', licenseClass: 'article', url: 'https://simonwillison.net/atom/everything/' },
  { id: 'aicrier', name: 'AI Crier', licenseClass: 'article', url: 'https://aicrier.com/feed.xml' },
  { id: 'claude-code', name: 'claude-code releases', licenseClass: 'unlicensed-release-notes', url: 'https://github.com/anthropics/claude-code/releases.atom' },
  { id: 'codex', name: 'codex releases', licenseClass: 'permissive-release-notes', url: 'https://github.com/openai/codex/releases.atom' },
  { id: 'gemini-cli', name: 'gemini-cli releases', licenseClass: 'permissive-release-notes', url: 'https://github.com/google-gemini/gemini-cli/releases.atom' },
  { id: 'opencode', name: 'opencode releases', licenseClass: 'permissive-release-notes', url: 'https://github.com/sst/opencode/releases.atom' },
  { id: 'pi', name: 'pi releases', licenseClass: 'permissive-release-notes', url: 'https://github.com/earendil-works/pi/releases.atom' },
]

// ---- parsing (lifted from prototypes/newsletter-compose/collect.mjs) ------

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function textOf(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!m) return null
  let v = m[1].trim()
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  if (cdata) v = cdata[1].trim()
  return decodeEntities(v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function rawOf(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!m) return null
  const cdata = m[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/)
  return cdata ? cdata[1] : m[1]
}

function atomLink(block) {
  const links = [...block.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0])
  const pick =
    links.find((l) => /rel=["']alternate["']/i.test(l)) ??
    links.find((l) => !/rel=/i.test(l)) ??
    links[0]
  const href = pick?.match(/href=["']([^"']+)["']/i)
  return href ? decodeEntities(href[1]) : null
}

const stripTags = (html) =>
  decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()

function parseFeed(xml) {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml)
  const entryRe = isAtom
    ? /<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi
    : /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi
  const blocks = xml.match(entryRe) ?? []
  return blocks.map((b) => {
    const rawDate = isAtom
      ? (textOf(b, 'published') ?? textOf(b, 'updated'))
      : (textOf(b, 'pubDate') ?? textOf(b, 'dc:date'))
    const parsed = rawDate ? new Date(rawDate) : null
    const body =
      rawOf(b, 'content') ?? rawOf(b, 'content:encoded') ?? rawOf(b, 'description') ?? ''
    return {
      headline: textOf(b, 'title'),
      url: isAtom ? atomLink(b) : (textOf(b, 'link') ?? atomLink(b)),
      publishedAt: parsed && !Number.isNaN(+parsed) ? parsed.toISOString() : null,
      feedText: stripTags(body).slice(0, 2400),
    }
  })
}

// ---- lanes ----------------------------------------------------------------

async function collectFeed(source) {
  try {
    const res = await fetch(source.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(25000),
      headers: {
        'user-agent': BROWSER_UA,
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const items = parseFeed(await res.text())
      .filter((i) => i.url && i.publishedAt && +new Date(i.publishedAt) >= cutoff)
      .map((i) => ({
        ...i,
        source: source.name,
        sourceId: source.id,
        licenseClass: source.licenseClass,
        lane: 'feed',
      }))
    console.log(`ok   feed ${source.id.padEnd(16)} ${items.length} items`)
    return items
  } catch (e) {
    console.log(`FAIL feed ${source.id.padEnd(16)} ${e?.message ?? e}`)
    return []
  }
}

// The keyword net, shortened from convex/lib/hackerNews.ts. A story has to
// match it AND clear the points gate, the same two tests the real lane runs.
const HN_NET =
  /\b(claude|anthropic|openai|gpt|codex|gemini|llm|agent|agentic|copilot|cursor|opencode|mcp|context window|prompt|fine-?tun|inference|rag|deepseek|qwen|kimi|mistral|llama|coding assistant|ai coding)\b/i

async function collectHn() {
  const url =
    'https://hn.algolia.com/api/v1/search_by_date?tags=story' +
    `&numericFilters=created_at_i>${Math.floor(cutoff / 1000)},points>60&hitsPerPage=200`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { hits } = await res.json()
    const items = hits
      .filter((h) => h.url && HN_NET.test(`${h.title} ${h.url}`))
      .map((h) => ({
        headline: h.title,
        url: h.url,
        publishedAt: new Date(h.created_at).toISOString(),
        source: 'Hacker News',
        sourceId: 'hn',
        licenseClass: 'hn',
        lane: 'hn',
        hnItemId: String(h.objectID),
        hnPoints: h.points,
        hnComments: h.num_comments,
        feedText: '',
      }))
    console.log(`ok   hn   ${'algolia'.padEnd(16)} ${items.length} items`)
    return items
  } catch (e) {
    console.log(`FAIL hn   ${'algolia'.padEnd(16)} ${e?.message ?? e}`)
    return []
  }
}

// The one cc-by source: full text is re-servable with attribution.
async function collectGeminiChangelog() {
  const url = 'https://ai.google.dev/gemini-api/docs/changelog?hl=en'
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': BOT_UA, 'accept-language': 'en' },
      redirect: 'follow',
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.text()
    const end = raw.indexOf('</article>')
    const html = (end === -1 ? raw : raw.slice(0, end))
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
    const re = /<h2 [^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g
    const marks = []
    let m
    while ((m = re.exec(html)) !== null) {
      const d = m[1].match(/^(\d{2})-(\d{2})-(\d{4})$/)
      if (d) marks.push({ id: m[1], date: `${d[3]}-${d[1]}-${d[2]}`, end: re.lastIndex })
    }
    const items = []
    for (let i = 0; i < marks.length && items.length < 2; i++) {
      const mk = marks[i]
      if (+new Date(mk.date) < cutoff) continue
      const rest = html.slice(mk.end)
      const stop = rest.indexOf('<h2')
      const text = stripTags(rest.slice(0, stop === -1 ? undefined : stop))
      items.push({
        headline: `Gemini API changelog: ${mk.date}`,
        url: `https://ai.google.dev/gemini-api/docs/changelog#${mk.id}`,
        publishedAt: new Date(`${mk.date}T12:00:00Z`).toISOString(),
        source: 'Gemini API changelog',
        sourceId: 'gemini-changelog',
        licenseClass: 'cc-by',
        lane: 'page',
        attribution: 'Google, CC BY 4.0',
        feedText: text.slice(0, 2400),
        sourceText: text.slice(0, 2400),
      })
    }
    console.log(`ok   page ${'gemini-changelog'.padEnd(16)} ${items.length} items`)
    return items
  } catch (e) {
    console.log(`FAIL page ${'gemini-changelog'.padEnd(16)} ${e?.message ?? e}`)
    return []
  }
}

// The X lane is owner paste: one post link in, the official embed stored.
// The post is found on Hacker News, so the link is real and on topic. When the
// link is one an HN story already carries, the embed MERGES onto that row:
// ADR-0004 says a story joins the item, and the X class is the stricter of the
// two, so the merged row may re-serve the embed and nothing else.
async function collectXPost(hnItems) {
  const fromHn = hnItems.find((i) => /^https?:\/\/(www\.|mobile\.)?(x|twitter)\.com\/[^/]+\/status\/\d+/.test(i.url))
  const candidates = [fromHn?.url, 'https://x.com/jack/status/20'].filter(Boolean)
  for (const link of candidates) {
    try {
      const api = `https://publish.x.com/oembed?url=${encodeURIComponent(link)}&omit_script=1&dnt=1`
      const res = await fetch(api, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!/twitter-tweet/.test(data.html ?? '')) throw new Error('not a post embed')
      const statusId = link.match(/status\/(\d+)/)[1]
      console.log(`ok   x    ${'oembed'.padEnd(16)} ${link}`)
      return [
        {
          headline: `${data.author_name} on X`,
          url: link,
          publishedAt: new Date().toISOString(),
          source: 'X (owner paste)',
          sourceId: 'x-paste',
          licenseClass: 'x',
          lane: 'x',
          feedText: stripTags(data.html).slice(0, 600),
          xEmbed: {
            statusId,
            html: data.html,
            authorName: data.author_name,
            authorUrl: data.author_url,
          },
        },
      ]
    } catch (e) {
      console.log(`FAIL x    ${'oembed'.padEnd(16)} ${link}: ${e?.message ?? e}`)
    }
  }
  return []
}

// ---- page extracts --------------------------------------------------------

// The drafting skill reads the page behind each item before it writes a
// summary. This is the cheap stand-in: enough real text to draft from.
async function extract(item) {
  if (item.sourceText) return item.sourceText
  try {
    const res = await fetch(item.url, {
      headers: { 'user-agent': BROWSER_UA, 'accept-language': 'en' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const body = html.match(/<(?:article|main)\b[\s\S]*?<\/(?:article|main)>/i)?.[0] ?? html
    const text = stripTags(body)
    return text.length > 200 ? text.slice(0, 2400) : (item.feedText ?? '')
  } catch {
    return item.feedText ?? ''
  }
}

// ---- run ------------------------------------------------------------------

const feedItems = (await Promise.all(FEEDS.map(collectFeed))).flat()
const hnItems = await collectHn()
const pageItems = await collectGeminiChangelog()
const xItems = await collectXPost(hnItems)

// Dedupe by URL across lanes, keeping the first (feed) row. An X embed for a
// link another lane already collected merges onto that row.
const urlKey = (u) => u.replace(/[?#].*$/, '').replace(/\/$/, '').replace(/^https?:\/\/(www\.|mobile\.)?(twitter\.com)/, 'https://x.com')
const seen = new Map()
const all = []
for (const item of [...feedItems, ...pageItems, ...hnItems]) {
  const key = urlKey(item.url)
  if (seen.has(key) && item.lane !== 'page') continue
  seen.set(key, item)
  all.push(item)
}
for (const x of xItems) {
  const host = seen.get(urlKey(x.url))
  if (host) {
    host.xEmbed = x.xEmbed
    host.licenseClass = 'x'
    host.lane = `${host.lane}+x`
    console.log(`merged x embed onto ${host.sourceId} item`)
  } else {
    all.push(x)
  }
}
all.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))

console.log(`\nextracting ${all.length} pages...`)
const withText = []
for (let i = 0; i < all.length; i += 8) {
  const batch = all.slice(i, i + 8)
  const texts = await Promise.all(batch.map(extract))
  batch.forEach((item, n) => withText.push({ ...item, extract: texts[n] }))
  process.stdout.write('.')
}

writeFileSync(
  join(HERE, 'collected.json'),
  JSON.stringify(
    { collectedAt: new Date().toISOString(), windowDays: WINDOW_DAYS, items: withText },
    null,
    2
  )
)
console.log(`\n${withText.length} real items in the last ${WINDOW_DAYS} days -> collected.json`)
