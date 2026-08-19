#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#180). Extract a sample of real items per source
// for the demo page. Not part of the diff loop.
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (compatible; aistack-news-collector-prototype; +https://use-aistack.com)';
const get = async (u) => (await fetch(u, { headers: { 'user-agent': UA, 'accept-language': 'en' } })).text();
const decode = (s) => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#39;/g,"'").replace(/&nbsp;/g,' ');

const sitemap = (xml) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: decode(m[1].match(/<loc>([^<]+)<\/loc>/)?.[1] ?? ''),
  lastmod: m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null,
}));

const article = async (url) => {
  const html = await get(url);
  const og = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[1]
    ?? html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/)?.[1]
    ?? html.match(/<title>([^<]*)<\/title>/)?.[1] ?? url;
  return {
    url,
    headline: decode(og).replace(/ [\\|] (Anthropic|Claude by Anthropic)$/, '').trim(),
    published: html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? null,
  };
};

const out = {};

// anthropic-news: the 5 newest by sitemap lastmod, extracted live.
const anth = sitemap(await get('https://www.anthropic.com/sitemap.xml'))
  .filter((e) => e.loc.startsWith('https://www.anthropic.com/news/'))
  .sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? ''))
  .slice(0, 5);
out['anthropic-news'] = [];
for (const e of anth) out['anthropic-news'].push({ ...(await article(e.loc)), lastmod: e.lastmod });

// claude-blog: no lastmod in this sitemap, so no order. Sample 5 URLs and
// extract; in production, newness comes only from the diff, never from order.
const blog = sitemap(await get('https://claude.com/sitemap.xml'))
  .map((e) => e.loc)
  .filter((u) => /^https:\/\/claude\.com\/blog\/[^/]+$/.test(u));
out['claude-blog'] = [];
for (const u of [blog[0], blog[Math.floor(blog.length*0.25)], blog[Math.floor(blog.length*0.5)], blog[Math.floor(blog.length*0.75)], blog[blog.length-1]])
  out['claude-blog'].push(await article(u));

// gemini-changelog: the 3 newest sections with full text (CC-BY 4.0).
const raw = await get('https://ai.google.dev/gemini-api/docs/changelog?hl=en');
const art = raw.slice(0, raw.indexOf('</article>') + 1 || undefined);
const html = art.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
const re = /<h2 id="(\d{2}-\d{2}-\d{4})"[^>]*data-text="([^"]+)"[^>]*>[\s\S]*?<\/h2>/g;
const marks = []; let m;
while ((m = re.exec(html)) !== null) marks.push({ id: m[1], label: decode(m[2]), end: re.lastIndex });
out['gemini-changelog'] = marks.slice(0, 3).map((mk, i) => {
  const rest = html.slice(mk.end);
  const stop = i + 1 < marks.length ? rest.indexOf(`<h2 id="${marks[i + 1].id}"`) : rest.length;
  const text = decode(rest.slice(0, stop).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const [mm, dd, yyyy] = mk.id.split('-');
  return { url: `https://ai.google.dev/gemini-api/docs/changelog?hl=en#${mk.id}`, headline: `Gemini API changelog: ${mk.label}`, date: `${yyyy}-${mm}-${dd}`, fullText: text };
});

writeFileSync(new URL('./showcase.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('wrote showcase.json:', Object.entries(out).map(([k, v]) => `${k}=${v.length}`).join(' '));
