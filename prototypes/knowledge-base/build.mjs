#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#212). Throwaway code, not production.
//
// Merges collected.json (the real items), picks.json (the curated stream) and
// stream.json (the drafting pass) into the demo data, and writes it into
// index.html between the two DATA markers. The page stays one self-contained
// file, which is what the operator opens on a phone.
//
// Run: node build.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (f) => JSON.parse(readFileSync(join(HERE, f), 'utf8'))

const collected = read('collected.json')
const picks = read('picks.json')
const drafted = read('stream.json')

// The items the owner approved this week and has not published yet. Explicit,
// because the whole publish demo turns on which items are still waiting.
const PENDING = new Set([
  'traycer',
  'claude-code-release',
  'qwen-reverse-eng',
  'fable5-longhorizon',
  'codex-rate-limit',
  'harness-gap',
  'cc-ab-effort',
  'harness-evolution',
  'codex-release',
  'sol-price-cut',
  'mcp-roadmap',
  'local-llm-dumber',
  'week-of-codex',
])

// The six items a compose run would put in issue #2. The rest of the week goes
// public with the send without appearing in the email.
const IN_ISSUE = new Set([
  'cc-ab-effort',
  'harness-evolution',
  'qwen-reverse-eng',
  'mcp-roadmap',
  'sol-price-cut',
  'local-llm-dumber',
])

/** The license notice a re-served body must carry. */
const ATTRIBUTION = {
  'gemini-changelog': 'Google, CC BY 4.0',
  opencode: 'opencode contributors, MIT',
  codex: 'OpenAI, Apache 2.0',
  'gemini-cli': 'Google, Apache 2.0',
}

/** Only these two classes may carry the source's own words as a body. */
const FULL_TEXT = new Set(['cc-by', 'permissive-release-notes'])

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')

const plain = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/** The re-servable body as blocks: headings, bullets and paragraphs. */
function toBlocks(html) {
  if (!html) return []
  const blocks = []
  const re = /<(h2|h3|li|p)\b[^>]*>([\s\S]*?)<\/\1>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const text = plain(m[2])
    if (!text) continue
    blocks.push({ kind: m[1] === 'li' ? 'li' : m[1] === 'p' ? 'p' : 'h', text })
  }
  if (!blocks.length) {
    const text = plain(html)
    if (text) blocks.push({ kind: 'p', text })
  }
  return blocks
}

const items = []
for (const p of picks) {
  const raw = collected.items.find(
    (i) =>
      i.sourceId === p.sourceId &&
      (p.headline ? i.headline === p.headline : i.headline.startsWith(p.headlineStartsWith))
  )
  if (!raw) throw new Error(`pick did not match: ${p.id}`)
  const draft = drafted.items[p.id]
  if (!draft) throw new Error(`pick has no draft: ${p.id}`)

  const body = FULL_TEXT.has(raw.licenseClass)
    ? toBlocks(raw.sourceText ? `<p>${raw.sourceText}</p>` : raw.feedText)
    : []

  items.push({
    id: p.id,
    headline: raw.headline,
    url: raw.url,
    source: raw.source,
    sourceId: raw.sourceId,
    licenseClass: raw.licenseClass,
    publishedAt: raw.publishedAt,
    topic: draft.topic,
    summary: draft.summary ?? null,
    note: draft.note ?? null,
    body,
    attribution: body.length ? (ATTRIBUTION[raw.sourceId] ?? null) : null,
    hn: raw.hnItemId
      ? {
          points: raw.hnPoints,
          comments: raw.hnComments,
          url: `https://news.ycombinator.com/item?id=${raw.hnItemId}`,
        }
      : null,
    xEmbed: raw.xEmbed ? { html: raw.xEmbed.html, authorName: raw.xEmbed.authorName } : null,
    pending: PENDING.has(p.id),
    inIssue: IN_ISSUE.has(p.id),
  })
}

items.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))

const data = {
  collectedAt: collected.collectedAt,
  windowDays: collected.windowDays,
  topics: drafted.topics,
  items,
}

const html = readFileSync(join(HERE, 'index.html'), 'utf8')
const START = '// ---- DATA START (written by build.mjs) ----'
const END = '// ---- DATA END ----'
const a = html.indexOf(START)
const b = html.indexOf(END)
if (a === -1 || b === -1) throw new Error('DATA markers not found in index.html')
const next =
  html.slice(0, a + START.length) +
  `\nconst DATA = ${JSON.stringify(data, null, 2)};\n` +
  html.slice(b)
writeFileSync(join(HERE, 'index.html'), next)

const counts = {}
for (const i of items) counts[i.topic] = (counts[i.topic] ?? 0) + 1
console.log(`${items.length} items, ${items.filter((i) => i.pending).length} pending`)
console.log(counts)
console.log(`wrote ${Math.round(next.length / 1024)} kB index.html`)
