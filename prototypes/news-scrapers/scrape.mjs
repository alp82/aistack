#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#180). Throwaway code, not production.
// Phase-3 scrapers from docs/specs/news-pipeline.md:
//   - sitemap-diff for anthropic.com/news and claude.com/blog
//   - page-diff for the Gemini API changelog (CC-BY 4.0)
//
// Usage:
//   node scrape.mjs run            # run all scrapers once against the live pages
//   node scrape.mjs simulate       # drop one known entry per source from state, then run
//   node scrape.mjs reset          # delete all state (next run is a cold run)
//
// State lives in ./state/<source>.json. A cold run seeds the baseline and
// emits no inbox items (255 news URLs are history, not news). Every later
// run emits one inbox item per NEW entry, extracted live from the page.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(HERE, 'state');
const UA = 'Mozilla/5.0 (compatible; aistack-news-collector-prototype; +https://use-aistack.com)';

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
   .replace(/&nbsp;/g, ' ');

async function fetchText(url) {
  // accept-language matters: without it (and ?hl=en on devsite pages) Google
  // sometimes serves a machine-translated page, which breaks content hashes.
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

const loadState = (name) => {
  const f = join(STATE_DIR, `${name}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
};
const saveState = (name, state) => {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(join(STATE_DIR, `${name}.json`), JSON.stringify(state, null, 2));
};

// ---------------------------------------------------------------- sitemap-diff

function parseSitemap(xml) {
  // <url><loc>..</loc><lastmod>..</lastmod>?</url>
  const out = new Map();
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;
    const lastmod = m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null;
    out.set(decode(loc.trim()), lastmod);
  }
  return out;
}

async function extractArticle(url) {
  // Headline from og:title, date from JSON-LD datePublished when present.
  const html = await fetchText(url);
  const og =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[1] ??
    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/)?.[1] ??
    html.match(/<title>([^<]*)<\/title>/)?.[1] ?? url;
  const published = html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? null;
  return { headline: decode(og).replace(/ [\\|] (Anthropic|Claude by Anthropic)$/, '').trim(), published };
}

async function runSitemapDiff({ name, sitemapUrl, filter }) {
  const t0 = Date.now();
  const sitemap = parseSitemap(await fetchText(sitemapUrl));
  const current = new Map([...sitemap].filter(([url]) => filter(url)));
  const prev = loadState(name);
  const result = {
    source: name, mechanism: 'sitemap-diff', url: sitemapUrl,
    fetchedAt: new Date().toISOString(),
    sitemapUrls: sitemap.size, matchedUrls: current.size,
    coldRun: prev === null, newItems: [], ms: 0,
  };
  if (prev !== null) {
    const known = new Set(prev.urls);
    const fresh = [...current.keys()].filter((u) => !known.has(u));
    for (const url of fresh) {
      const { headline, published } = await extractArticle(url);
      result.newItems.push({
        url, headline,
        date: published ?? current.get(url) ?? result.fetchedAt,
        dateSource: published ? 'datePublished' : current.get(url) ? 'sitemap lastmod' : 'first seen',
      });
    }
  }
  saveState(name, { updatedAt: result.fetchedAt, urls: [...current.keys()].sort() });
  result.ms = Date.now() - t0;
  return result;
}

// ------------------------------------------------------------------- page-diff

function parseChangelog(rawHtml) {
  // Sections: <h2 id="MM-DD-YYYY" data-text="Month D, YYYY">...</h2> then body
  // until the next h2. Key = id, content hash detects edits to a section.
  // Script and style bodies carry per-request noise (a random negotiated
  // locale in an analytics blob), so they go before hashing.
  // The footer after </article> (a language list) is not changelog content.
  const article = rawHtml.slice(0, rawHtml.indexOf('</article>') + 1 || undefined);
  const html = article.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
  const sections = [];
  const re = /<h2 id="(\d{2}-\d{2}-\d{4})"[^>]*data-text="([^"]+)"[^>]*>[\s\S]*?<\/h2>/g;
  const marks = [];
  let m;
  while ((m = re.exec(html)) !== null) marks.push({ id: m[1], label: decode(m[2]), end: re.lastIndex });
  for (let i = 0; i < marks.length; i++) {
    const body = html.slice(marks[i].end, i + 1 < marks.length ? marks[i].end + html.slice(marks[i].end).indexOf(`<h2 id="${marks[i + 1].id}"`) : undefined);
    const text = decode(body.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    sections.push({
      id: marks[i].id, label: marks[i].label,
      hash: createHash('sha256').update(text).digest('hex').slice(0, 16),
      text,
    });
  }
  return sections;
}

async function runPageDiff({ name, pageUrl }) {
  const t0 = Date.now();
  const sections = parseChangelog(await fetchText(pageUrl));
  const prev = loadState(name);
  const result = {
    source: name, mechanism: 'page-diff', url: pageUrl,
    fetchedAt: new Date().toISOString(),
    sections: sections.length, coldRun: prev === null,
    newItems: [], changedItems: [], ms: 0,
  };
  if (prev !== null) {
    const known = new Map(Object.entries(prev.sections));
    for (const s of sections) {
      const [mm, dd, yyyy] = s.id.split('-');
      const item = {
        url: `${pageUrl}#${s.id}`,
        headline: `Gemini API changelog: ${s.label}`,
        date: `${yyyy}-${mm}-${dd}`, dateSource: 'section heading',
        // CC-BY 4.0: full text is re-servable with attribution.
        fullText: s.text.length > 400 ? s.text.slice(0, 400) + ' …' : s.text,
      };
      if (!known.has(s.id)) result.newItems.push(item);
      else if (known.get(s.id) !== s.hash) result.changedItems.push(item);
    }
  }
  saveState(name, {
    updatedAt: result.fetchedAt,
    sections: Object.fromEntries(sections.map((s) => [s.id, s.hash])),
  });
  result.ms = Date.now() - t0;
  return result;
}

// ----------------------------------------------------------------------- main

const SOURCES = [
  {
    kind: 'sitemap', name: 'anthropic-news',
    sitemapUrl: 'https://www.anthropic.com/sitemap.xml',
    filter: (u) => u.startsWith('https://www.anthropic.com/news/'),
  },
  {
    kind: 'sitemap', name: 'claude-blog',
    sitemapUrl: 'https://claude.com/sitemap.xml',
    // Default locale only: /blog/<slug>, not /<locale>/blog/<slug>.
    filter: (u) => /^https:\/\/claude\.com\/blog\/[^/]+$/.test(u),
  },
  {
    kind: 'page', name: 'gemini-changelog',
    // ?hl=en pins the language; without it the served language is random.
    pageUrl: 'https://ai.google.dev/gemini-api/docs/changelog?hl=en',
  },
];

function simulateForgets() {
  // Drop one known entry per source from state. The live page still has it,
  // so the next run detects it as NEW and extracts it for real.
  const dropped = {};
  for (const src of SOURCES) {
    const state = loadState(src.name);
    if (!state) continue;
    if (src.kind === 'sitemap') {
      const drop = state.urls[Math.floor(state.urls.length / 2)];
      state.urls = state.urls.filter((u) => u !== drop);
      dropped[src.name] = drop;
    } else {
      const ids = Object.keys(state.sections);
      const drop = ids[0]; // the newest section
      delete state.sections[drop];
      dropped[src.name] = drop;
    }
    saveState(src.name, state);
  }
  return dropped;
}

const cmd = process.argv[2] ?? 'run';
if (cmd === 'reset') {
  rmSync(STATE_DIR, { recursive: true, force: true });
  console.log('state cleared');
  process.exit(0);
}
let dropped = null;
if (cmd === 'simulate') {
  dropped = simulateForgets();
  console.error('dropped from state:', dropped);
}
const results = [];
for (const src of SOURCES) {
  results.push(src.kind === 'sitemap' ? await runSitemapDiff(src) : await runPageDiff(src));
}
console.log(JSON.stringify({ command: cmd, dropped, results }, null, 2));
