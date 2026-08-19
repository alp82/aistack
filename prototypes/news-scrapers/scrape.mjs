#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#180). Throwaway code, not production.
// Scrapers for the news pipeline (docs/specs/news-pipeline.md), extended per
// operator review from the three phase-3 sources to nine vendor sources.
//
// Mechanisms:
//   sitemap-diff  new <loc> in a sitemap (or sitemap index) = new item
//   link-diff     new article href on a server-rendered index page = new item
//   page-diff     new or changed dated section on one page = new item
//   feed-diff     new entry id in a releases.atom feed = new item
//
// Usage:
//   node scrape.mjs run            # run all scrapers once against the live pages
//   node scrape.mjs simulate       # drop one known entry per source from state, then run
//   node scrape.mjs reset          # delete all state (next run is a cold run)
//
// State lives in ./state/<source>.json. A cold run seeds the baseline and
// emits no inbox items (1300 OpenAI articles are history, not news). Every
// later run emits one inbox item per NEW entry, extracted live from the page.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(HERE, 'state');
// The honest bot UA passes every source. A faked full Chrome UA does NOT:
// ai.google.dev answers it with an endless redirect loop.
const UA = 'Mozilla/5.0 (compatible; aistack-news-collector-prototype; +https://use-aistack.com)';

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
   .replace(/&nbsp;/g, ' ').replace(/\u2014/g, '-');

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

const stripTags = (html) => decode(
  html.replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
).replace(/\s+/g, ' ').trim();

const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// ----------------------------------------------------- article extraction

const TITLE_SUFFIXES = / *[\\|-] *(Anthropic|Claude by Anthropic|DeepSeek API Docs|NOUS RESEARCH|OpenAI)$/;

async function extractArticle(url) {
  // Headline from og:title, date from JSON-LD datePublished when present.
  const html = await fetchText(url);
  const og =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[1] ??
    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/)?.[1] ??
    html.match(/<title>([^<]*)<\/title>/)?.[1] ?? url;
  const published = html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? null;
  return { headline: decode(og).replace(TITLE_SUFFIXES, '').trim(), published };
}

// ------------------------------------------- url-set diff (sitemap / links)

function parseSitemap(xml) {
  const out = new Map();
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;
    out.set(decode(loc.trim()), m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null);
  }
  return out;
}

// list(): Map(articleUrl -> dateHint|null), plus how many raw URLs were seen.
const LISTERS = {
  // One sitemap file, one filter.
  sitemap: async (src) => {
    const map = parseSitemap(await fetchText(src.url));
    return { raw: map.size, urls: new Map([...map].filter(([u]) => src.filter(u))) };
  },
  // A sitemap index: fetch every child sitemap, then filter.
  sitemapIndex: async (src) => {
    const idx = await fetchText(src.url);
    const children = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
    let raw = 0;
    const urls = new Map();
    for (const c of children) {
      const map = parseSitemap(await fetchText(c));
      raw += map.size;
      for (const [u, d] of map) if (src.filter(u)) urls.set(u, d);
    }
    return { raw, urls, children: children.length };
  },
  // A server-rendered index page with relative article links.
  links: async (src) => {
    const html = await fetchText(src.url);
    const hrefs = [...html.matchAll(src.linkRe)].map((m) => new URL(m[1], src.url).href);
    return { raw: hrefs.length, urls: new Map(hrefs.map((u) => [u, null])) };
  },
};

async function runUrlSetDiff(src) {
  const t0 = Date.now();
  const { raw, urls, children } = await LISTERS[src.kind](src);
  const prev = loadState(src.name);
  const result = {
    source: src.name, mechanism: src.mechanism, url: src.url,
    fetchedAt: new Date().toISOString(),
    rawUrls: raw, matchedUrls: urls.size,
    ...(children ? { childSitemaps: children } : {}),
    coldRun: prev === null, newItems: [], ms: 0,
  };
  if (prev !== null) {
    const known = new Set(prev.urls);
    const fresh = [...urls.keys()].filter((u) => !known.has(u));
    const enriched = fresh.length && src.enrich ? await src.enrich() : null;
    for (const url of fresh) {
      let item = null;
      const hint = enriched?.get(url.replace(/\/$/, ''));
      if (hint) {
        item = { url, headline: hint.headline, date: hint.date, dateSource: src.enrichLabel };
      } else {
        try {
          const { headline, published } = await extractArticle(url);
          item = {
            url, headline,
            date: published ?? urls.get(url) ?? result.fetchedAt,
            dateSource: published ? 'datePublished' : urls.get(url) ? 'sitemap lastmod' : 'first seen',
          };
        } catch (e) {
          // The article page refused the fetch. The item still exists: the
          // slug names it and the sitemap dates it. Extraction is best-effort.
          item = {
            url,
            headline: decodeURIComponent(url.replace(/\/$/, '').split('/').pop()).replace(/-/g, ' '),
            date: urls.get(url) ?? result.fetchedAt,
            dateSource: urls.get(url) ? 'sitemap lastmod' : 'first seen',
            extractionError: String(e.message ?? e),
          };
        }
      }
      result.newItems.push(item);
    }
  }
  saveState(src.name, { updatedAt: result.fetchedAt, urls: [...urls.keys()].sort() });
  result.ms = Date.now() - t0;
  return result;
}

// ------------------------------------------------------------- page-diff

// Split a page into keyed sections at <h2 id="...">. Key = id, content hash
// detects edits. src.section(id, heading) rejects non-content headings and
// names the section.
function parseSections(rawHtml, src) {
  const bound = src.endMarker ? rawHtml.slice(0, rawHtml.indexOf(src.endMarker) + 1 || undefined) : rawHtml;
  const html = bound.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
  const re = /<h2 [^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
  const marks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const meta = src.section(m[1], stripTags(m[2]) || decode(m[0].match(/data-text="([^"]+)"/)?.[1] ?? ''));
    if (meta) marks.push({ id: m[1], ...meta, end: re.lastIndex });
  }
  return marks.map((mk, i) => {
    const rest = html.slice(mk.end);
    const stop = i + 1 < marks.length ? rest.indexOf(`<h2`) : rest.length;
    const text = stripTags(rest.slice(0, stop === -1 ? undefined : stop));
    return { ...mk, hash: hash(text), text };
  });
}

async function runPageDiff(src) {
  const t0 = Date.now();
  const sections = parseSections(await fetchText(src.url), src);
  const prev = loadState(src.name);
  const result = {
    source: src.name, mechanism: 'page-diff', url: src.url,
    fetchedAt: new Date().toISOString(),
    sections: sections.length, coldRun: prev === null,
    newItems: [], changedItems: [], ms: 0,
  };
  if (prev !== null) {
    const known = new Map(Object.entries(prev.sections));
    for (const s of sections) {
      const item = {
        url: `${src.url}#${s.id}`,
        headline: `${src.itemPrefix}: ${s.label}`,
        date: s.date ?? result.fetchedAt.slice(0, 10),
        dateSource: s.date ? 'section heading' : 'first seen',
        fullText: s.text.length > 400 ? s.text.slice(0, 400) + ' …' : s.text,
      };
      if (!known.has(s.id)) result.newItems.push(item);
      else if (known.get(s.id) !== s.hash) result.changedItems.push(item);
    }
  }
  saveState(src.name, {
    updatedAt: result.fetchedAt,
    sections: Object.fromEntries(sections.map((s) => [s.id, s.hash])),
  });
  result.ms = Date.now() - t0;
  return result;
}

// ------------------------------------------------------------- feed-diff

async function runFeedDiff(src) {
  const t0 = Date.now();
  const xml = await fetchText(src.url);
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => ({
    id: m[1].match(/<id>([^<]+)<\/id>/)?.[1] ?? '',
    title: decode(m[1].match(/<title>([^<]+)<\/title>/)?.[1] ?? ''),
    updated: m[1].match(/<updated>([^<]+)<\/updated>/)?.[1] ?? null,
    link: m[1].match(/<link[^>]*href="([^"]+)"/)?.[1] ?? src.url,
  }));
  const prev = loadState(src.name);
  const result = {
    source: src.name, mechanism: 'feed-diff', url: src.url,
    fetchedAt: new Date().toISOString(),
    feedEntries: entries.length, coldRun: prev === null, newItems: [], ms: 0,
  };
  if (prev !== null) {
    const known = new Set(prev.ids);
    for (const e of entries.filter((e) => !known.has(e.id))) {
      result.newItems.push({
        url: e.link, headline: `${src.itemPrefix}: ${e.title}`,
        date: e.updated ?? result.fetchedAt, dateSource: e.updated ? 'feed updated' : 'first seen',
      });
    }
    // The feed only holds the last ~10 entries, so keep known ids forever.
    for (const e of entries) known.add(e.id);
    saveState(src.name, { updatedAt: result.fetchedAt, ids: [...known].sort() });
  } else {
    saveState(src.name, { updatedAt: result.fetchedAt, ids: entries.map((e) => e.id).sort() });
  }
  result.ms = Date.now() - t0;
  return result;
}

// ----------------------------------------------------------------------- main

const MONTHS = 'january february march april may june july august september october november december'.split(' ');

export const SOURCES = [
  {
    kind: 'sitemap', mechanism: 'sitemap-diff', name: 'anthropic-news',
    url: 'https://www.anthropic.com/sitemap.xml',
    filter: (u) => u.startsWith('https://www.anthropic.com/news/'),
  },
  {
    kind: 'sitemap', mechanism: 'sitemap-diff', name: 'claude-blog',
    url: 'https://claude.com/sitemap.xml',
    // Default locale only: /blog/<slug>, not /<locale>/blog/<slug>.
    filter: (u) => /^https:\/\/claude\.com\/blog\/[^/]+$/.test(u),
  },
  {
    kind: 'sitemapIndex', mechanism: 'sitemap-diff', name: 'openai-news',
    // A sitemap index with 35 category children. Articles live at /index/<slug>/.
    // Cloudflare blocks every article-page fetch (403 on any UA), but the RSS
    // passes and holds the full archive, so new items enrich from the feed.
    url: 'https://openai.com/sitemap.xml',
    filter: (u) => /^https:\/\/openai\.com\/index\/[^/]+\/$/.test(u),
    enrichLabel: 'news/rss.xml',
    enrich: async () => {
      const xml = await fetchText('https://openai.com/news/rss.xml');
      return new Map([...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => [
        (m[1].match(/<link>([^<]*)<\/link>/)?.[1] ?? '').replace(/\/$/, ''),
        {
          headline: decode(m[1].match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ?? m[1].match(/<title>([^<]*)<\/title>/)?.[1] ?? ''),
          date: new Date(m[1].match(/<pubDate>([^<]*)<\/pubDate>/)?.[1] ?? Date.now()).toISOString().slice(0, 10),
        },
      ]));
    },
  },
  {
    kind: 'sitemap', mechanism: 'sitemap-diff', name: 'nous-hermes',
    // Posts are top-level slugs. The sitemap does not separate posts from
    // pages, so a new site page also lands in the inbox. The curation gate
    // (owner approves or discards) absorbs that noise.
    url: 'https://nousresearch.com/sitemap.xml',
    filter: (u) => /^https:\/\/nousresearch\.com\/[^/]+\/$/.test(u),
  },
  {
    kind: 'sitemap', mechanism: 'sitemap-diff', name: 'deepseek-news',
    url: 'https://api-docs.deepseek.com/sitemap.xml',
    filter: (u) => u.startsWith('https://api-docs.deepseek.com/news/'),
  },
  {
    kind: 'links', mechanism: 'link-diff', name: 'kimi-blog',
    // No blog URLs in any Kimi sitemap. The index page is server-rendered,
    // so a new /blog/<slug> href is the newness signal.
    url: 'https://www.kimi.com/blog',
    linkRe: /href="(\/blog\/[^"]+)"/g,
  },
  {
    kind: 'page', name: 'gemini-changelog',
    // ?hl=en pins the language; without it the served language is random.
    url: 'https://ai.google.dev/gemini-api/docs/changelog?hl=en',
    endMarker: '</article>',
    itemPrefix: 'Gemini API changelog',
    section: (id, heading) => {
      const m = id.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      return m ? { label: heading, date: `${m[3]}-${m[1]}-${m[2]}` } : null;
    },
  },
  {
    kind: 'page', name: 'xai-release-notes',
    // x.ai itself refuses non-browser clients (403 on every path), but the
    // docs site serves plain HTML. Sections are months, not days.
    url: 'https://docs.x.ai/developers/release-notes',
    itemPrefix: 'xAI API release notes',
    section: (id, heading) => {
      const m = id.match(/^([a-z]+)(?:-(\d{4}))?$/);
      if (!m || !MONTHS.includes(m[1])) return null;
      return { label: heading + (m[2] ? ` ${m[2]}` : ''), date: null };
    },
  },
  {
    kind: 'feed', mechanism: 'feed-diff', name: 'pi-releases',
    // pi has no blog. Its news surface is GitHub releases (research doc §
    // harness vendors). Spec phase 1 covers this with the generic poller;
    // it rides here to show the diff mechanism on a feed.
    url: 'https://github.com/earendil-works/pi/releases.atom',
    itemPrefix: 'pi release',
  },
];

function simulateForgets() {
  // Drop one known entry per source from state. The live page still has it,
  // so the next run detects it as NEW and extracts it for real.
  const dropped = {};
  for (const src of SOURCES) {
    const state = loadState(src.name);
    if (!state) continue;
    if (state.urls) {
      const drop = state.urls[Math.floor(state.urls.length / 2)];
      state.urls = state.urls.filter((u) => u !== drop);
      dropped[src.name] = drop;
    } else if (state.sections) {
      const drop = Object.keys(state.sections)[0]; // the newest section
      delete state.sections[drop];
      dropped[src.name] = drop;
    } else if (state.ids) {
      const drop = state.ids[state.ids.length - 1];
      state.ids = state.ids.filter((i) => i !== drop);
      dropped[src.name] = drop;
    }
    saveState(src.name, state);
  }
  return dropped;
}

const RUNNERS = { sitemap: runUrlSetDiff, sitemapIndex: runUrlSetDiff, links: runUrlSetDiff, page: runPageDiff, feed: runFeedDiff };

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
  try {
    results.push(await RUNNERS[src.kind](src));
  } catch (e) {
    results.push({ source: src.name, error: String(e.message ?? e) });
  }
}
console.log(JSON.stringify({ command: cmd, dropped, results }, null, 2));
