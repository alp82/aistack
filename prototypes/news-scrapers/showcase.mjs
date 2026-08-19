#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#180). Extract a sample of real items per source
// for the demo page. Not part of the diff loop.
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (compatible; aistack-news-collector-prototype; +https://use-aistack.com)';
const get = async (u) => (await fetch(u, { headers: { 'user-agent': UA, 'accept-language': 'en' } })).text();
const decode = (s) => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\u2014/g, '-');

const sitemap = (xml) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: decode(m[1].match(/<loc>([^<]+)<\/loc>/)?.[1] ?? ''),
  lastmod: m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null,
}));

const SUFFIX = / *[\\|-] *(Anthropic|Claude by Anthropic|DeepSeek API Docs|NOUS RESEARCH|OpenAI)$/;
const article = async (url) => {
  const html = await get(url);
  const og = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[1]
    ?? html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/)?.[1]
    ?? html.match(/<title>([^<]*)<\/title>/)?.[1] ?? url;
  return {
    url,
    headline: decode(og).replace(SUFFIX, '').trim(),
    published: html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? null,
  };
};

const sections = (rawHtml, endMarker) => {
  const bound = endMarker ? rawHtml.slice(0, rawHtml.indexOf(endMarker) + 1 || undefined) : rawHtml;
  const html = bound.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
  const re = /<h2 [^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
  const marks = []; let m;
  while ((m = re.exec(html)) !== null) marks.push({ id: m[1], head: decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() || decode(m[0].match(/data-text="([^"]+)"/)?.[1] ?? ''), end: re.lastIndex });
  return marks.map((mk, i) => {
    const rest = html.slice(mk.end);
    const stop = i + 1 < marks.length ? rest.indexOf('<h2') : rest.length;
    return { ...mk, text: decode(rest.slice(0, stop === -1 ? undefined : stop).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() };
  });
};

const clip = (s, n = 320) => (s.length > n ? s.slice(0, n) + ' …' : s);
const out = {};

// anthropic-news: the 3 newest by sitemap lastmod, extracted live.
const anth = sitemap(await get('https://www.anthropic.com/sitemap.xml'))
  .filter((e) => e.loc.startsWith('https://www.anthropic.com/news/'))
  .sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? '')).slice(0, 3);
out['anthropic-news'] = [];
for (const e of anth) out['anthropic-news'].push({ ...(await article(e.loc)), lastmod: e.lastmod });

// claude-blog: no lastmod and no order in this sitemap. Sample 3 posts.
const blog = sitemap(await get('https://claude.com/sitemap.xml')).map((e) => e.loc)
  .filter((u) => /^https:\/\/claude\.com\/blog\/[^/]+$/.test(u));
out['claude-blog'] = [];
for (const u of [blog[0], blog[Math.floor(blog.length / 2)], blog[blog.length - 1]])
  out['claude-blog'].push(await article(u));

// openai-news: article pages are blocked, so items come from the RSS archive.
const rss = await get('https://openai.com/news/rss.xml');
out['openai-news'] = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 3).map((m) => ({
  url: m[1].match(/<link>([^<]*)<\/link>/)?.[1],
  headline: decode(m[1].match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ?? ''),
  published: new Date(m[1].match(/<pubDate>([^<]*)<\/pubDate>/)?.[1]).toISOString().slice(0, 10),
}));

// nous-hermes: 3 posts from the sitemap, extracted live.
const nous = sitemap(await get('https://nousresearch.com/sitemap.xml')).map((e) => e.loc)
  .filter((u) => /^https:\/\/nousresearch\.com\/[^/]+\/$/.test(u));
out['nous-hermes'] = [];
for (const u of nous.filter((u) => /hermes|introducing|nouscoder/.test(u)).slice(0, 3))
  out['nous-hermes'].push(await article(u));

// deepseek-news: newest slugs (newsYYMMDD sorts by date), extracted live.
const ds = sitemap(await get('https://api-docs.deepseek.com/sitemap.xml')).map((e) => e.loc)
  .filter((u) => u.startsWith('https://api-docs.deepseek.com/news/')).sort().reverse().slice(0, 3);
out['deepseek-news'] = [];
for (const u of ds) out['deepseek-news'].push(await article(u));

// kimi-blog: 3 links from the server-rendered index, extracted live.
const kimiHtml = await get('https://www.kimi.com/blog');
const kimi = [...new Set([...kimiHtml.matchAll(/href="(\/blog\/[^"]+)"/g)].map((m) => 'https://www.kimi.com' + m[1]))].slice(0, 3);
out['kimi-blog'] = [];
for (const u of kimi) out['kimi-blog'].push(await article(u));

// gemini-changelog: the 3 newest sections with full text (CC-BY 4.0).
out['gemini-changelog'] = sections(await get('https://ai.google.dev/gemini-api/docs/changelog?hl=en'), '</article>')
  .filter((s) => /^\d{2}-\d{2}-\d{4}$/.test(s.id)).slice(0, 3)
  .map((s) => {
    const [mm, dd, yyyy] = s.id.split('-');
    return { url: `https://ai.google.dev/gemini-api/docs/changelog?hl=en#${s.id}`, headline: `Gemini API changelog: ${s.head}`, date: `${yyyy}-${mm}-${dd}`, fullText: clip(s.text) };
  });

// xai-release-notes: the 2 newest month sections.
out['xai-release-notes'] = sections(await get('https://docs.x.ai/developers/release-notes'))
  .filter((s) => /^[a-z]+(-\d{4})?$/.test(s.id)).slice(0, 2)
  .map((s) => ({ url: `https://docs.x.ai/developers/release-notes#${s.id}`, headline: `xAI API release notes: ${s.head}`, fullText: clip(s.text) }));

// pi-releases: the 3 newest feed entries.
const atom = await get('https://github.com/earendil-works/pi/releases.atom');
out['pi-releases'] = [...atom.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 3).map((m) => ({
  url: m[1].match(/<link[^>]*href="([^"]+)"/)?.[1],
  headline: 'pi release: ' + decode(m[1].match(/<title>([^<]+)<\/title>/)?.[1] ?? ''),
  published: (m[1].match(/<updated>([^<]+)<\/updated>/)?.[1] ?? '').slice(0, 10),
}));

writeFileSync(new URL('./showcase.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('wrote showcase.json:', Object.entries(out).map(([k, v]) => `${k}=${v.length}`).join(' '));
