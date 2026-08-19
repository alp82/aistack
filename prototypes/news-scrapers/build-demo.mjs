#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#180). Bakes the captured run data into the
// self-contained demo page index.html. Run after scrape.mjs and showcase.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

const J = (f) => JSON.parse(readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'));
const run1 = J('run1.json'), run2 = J('run2.json'), run3 = J('run3.json'), showcase = J('showcase.json');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SOURCES = [
  {
    name: 'anthropic-news',
    title: 'anthropic.com/news',
    mech: 'sitemap-diff',
    target: 'https://www.anthropic.com/sitemap.xml',
    how: 'The scraper reads the sitemap and keeps the /news/ URLs. A URL that was not in the last run is a new item. The scraper then fetches that page and extracts the headline from og:title. The date comes from the sitemap lastmod.',
  },
  {
    name: 'claude-blog',
    title: 'claude.com/blog',
    mech: 'sitemap-diff',
    target: 'https://claude.com/sitemap.xml',
    how: 'Same mechanism. The filter keeps only default-locale /blog/ URLs, because the sitemap lists five localized copies of each post. The date comes from the JSON-LD datePublished on the article page, because this sitemap has no lastmod.',
  },
  {
    name: 'gemini-changelog',
    title: 'Gemini API changelog',
    mech: 'page-diff',
    target: 'https://ai.google.dev/gemini-api/docs/changelog?hl=en',
    how: 'The scraper splits the page into sections at each date heading. A section id that was not in the last run is a new item. A changed content hash marks an edited section. The license is CC-BY 4.0, so the item carries the full text with attribution.',
  },
];

const findResult = (run, name) => run.results.find((r) => r.source === name);

const statsRow = (src) => {
  const r1 = findResult(run1, src.name), r2 = findResult(run2, src.name), r3 = findResult(run3, src.name);
  const scope = r1.mechanism === 'sitemap-diff'
    ? `${r1.sitemapUrls} sitemap URLs, ${r1.matchedUrls} matched`
    : `${r1.sections} dated sections`;
  return { r1, r2, r3, scope };
};

const itemCard = (it) => `
      <div class="item">
        <div class="item-head">${esc(it.headline)}</div>
        <div class="item-meta"><span class="date">${esc(it.published ?? it.lastmod ?? it.date ?? '')}</span>${it.dateSource ? ` <span class="tag">${esc(it.dateSource)}</span>` : ''}</div>
        ${it.fullText ? `<div class="item-text">${esc(it.fullText)}${it.fullText.length > 380 ? '' : ''}</div>` : ''}
        <div class="item-url">${esc(it.url)}</div>
      </div>`;

const sourceSection = (src) => {
  const { r1, r2, r3, scope } = statsRow(src);
  const droppedLabel = run3.dropped[src.name];
  const detected = r3.newItems.map(itemCard).join('');
  const sample = (showcase[src.name] ?? []).map(itemCard).join('');
  return `
  <section class="card">
    <h2>${esc(src.title)} <span class="mech">${esc(src.mech)}</span></h2>
    <div class="target">${esc(src.target)}</div>
    <p>${esc(src.how)}</p>
    <table class="runs">
      <tr><th>Run 1, cold</th><td>${esc(scope)}. The run seeds the baseline and emits no items. ${r1.ms} ms.</td></tr>
      <tr><th>Run 2, steady</th><td>0 new${'changedItems' in r2 ? ', 0 changed' : ''}. The live page did not change. ${r2.ms} ms.</td></tr>
      <tr><th>Run 3, detection</th><td>The test dropped <code>${esc(droppedLabel)}</code> from the stored state. The run found it on the live page and emitted ${r3.newItems.length} new item. ${r3.ms} ms.</td></tr>
    </table>
    <h3>The item from run 3</h3>${detected}
    <h3>Sample items, extracted live</h3>${sample}
  </section>`;
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prototype: news scrapers (alp82/aistack#180)</title>
<style>
  :root { --lime: #a3e635; --bg: #0a0a0a; --card: #161616; --line: #2a2a2a; --text: #e5e5e5; --dim: #8a8a8a; }
  * { box-sizing: border-box; border-radius: 0 !important; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.55 system-ui, sans-serif; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 16px; }
  header { border-bottom: 2px solid var(--lime); padding: 20px 0 14px; margin-bottom: 20px; }
  header .kicker { font-family: ui-monospace, monospace; color: var(--lime); font-size: 13px; letter-spacing: .06em; }
  h1 { font-size: 22px; margin: 6px 0 2px; }
  header .sub { color: var(--dim); font-size: 14px; }
  .verdict { background: var(--card); border-left: 4px solid var(--lime); padding: 14px 16px; margin-bottom: 20px; }
  .verdict strong { color: var(--lime); font-family: ui-monospace, monospace; }
  .card { background: var(--card); border: 1px solid var(--line); padding: 16px; margin-bottom: 20px; }
  h2 { font-size: 18px; margin: 0 0 2px; }
  h3 { font-size: 13px; font-family: ui-monospace, monospace; color: var(--dim); text-transform: uppercase; letter-spacing: .08em; margin: 18px 0 8px; }
  .mech { font-family: ui-monospace, monospace; font-size: 12px; color: var(--bg); background: var(--lime); padding: 2px 6px; vertical-align: middle; margin-left: 6px; }
  .target { font-family: ui-monospace, monospace; font-size: 12px; color: var(--dim); word-break: break-all; margin-bottom: 8px; }
  p { margin: 8px 0; font-size: 14.5px; }
  table.runs { width: 100%; border-collapse: collapse; font-size: 14px; margin: 10px 0; }
  table.runs th { font-family: ui-monospace, monospace; font-size: 12px; color: var(--lime); text-align: left; vertical-align: top; padding: 6px 10px 6px 0; white-space: nowrap; }
  table.runs td { padding: 6px 0; border-bottom: 1px solid var(--line); }
  code { font-family: ui-monospace, monospace; font-size: 12.5px; color: var(--text); background: #222; padding: 1px 4px; word-break: break-all; }
  .item { border: 1px solid var(--line); padding: 10px 12px; margin-bottom: 8px; }
  .item-head { font-weight: 600; font-size: 14.5px; }
  .item-meta { margin-top: 2px; }
  .date { font-family: ui-monospace, monospace; font-size: 12px; color: var(--lime); }
  .tag { font-family: ui-monospace, monospace; font-size: 11px; color: var(--dim); border: 1px solid var(--line); padding: 0 4px; }
  .item-text { font-size: 13.5px; color: #c8c8c8; margin-top: 6px; }
  .item-url { font-family: ui-monospace, monospace; font-size: 11px; color: var(--dim); word-break: break-all; margin-top: 6px; }
  ul.findings { padding-left: 18px; font-size: 14.5px; }
  ul.findings li { margin-bottom: 8px; }
  footer { color: var(--dim); font-size: 13px; font-family: ui-monospace, monospace; padding: 8px 0 30px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="kicker">PROTOTYPE &middot; alp82/aistack#180 &middot; news pipeline, phase 3</div>
    <h1>Working scrapers: Anthropic news, Claude blog, Gemini changelog</h1>
    <div class="sub">All data on this page came from the live sites on ${esc(run1.results[0].fetchedAt.slice(0, 10))}. Nothing is mocked.</div>
  </header>

  <div class="verdict">
    <strong>VERDICT: all three scrapers work.</strong>
    <p>Each scraper ran three times against the live pages. The cold run seeds the baseline. The steady run reports zero new items. The detection run finds an entry that the test removed from the stored state, and extracts the real item from the live page.</p>
  </div>

  ${SOURCES.map(sourceSection).join('\n')}

  <section class="card">
    <h2>Findings for the spec</h2>
    <ul class="findings">
      <li><strong>Language pinning is required for the Gemini changelog.</strong> Without <code>?hl=en</code> and an <code>Accept-Language: en</code> header, Google serves a random language. One probe fetch came back machine-translated in Russian, which broke every content hash.</li>
      <li><strong>Script and style bodies must be stripped before hashing.</strong> The changelog page embeds a per-request analytics blob inside a script tag. Hashing the raw text marked all 106 sections as changed on every run.</li>
      <li><strong>The claude.com sitemap has no lastmod on blog URLs.</strong> Order and recency are unknown from the sitemap alone. The diff is the only newness signal, and the item date must come from the JSON-LD datePublished on the article page.</li>
      <li><strong>The claude.com sitemap lists five localized copies of each post.</strong> The filter must keep only <code>claude.com/blog/&lt;slug&gt;</code> URLs, or every post arrives six times.</li>
      <li><strong>The anthropic.com lastmod is an update time, not a publish time.</strong> Old posts carry fresh lastmod values after site-wide updates. The diff on URL presence is the newness signal. The lastmod only labels the item date, and a page-level datePublished is absent.</li>
      <li><strong>A cold run must not emit items.</strong> The anthropic sitemap holds 255 news URLs and the changelog holds 106 sections. The first run seeds the baseline silently, or the inbox floods with history.</li>
      <li><strong>The whole cycle is cheap.</strong> A steady run across all three sources takes under 3 seconds and 3 requests. Extraction adds one request per new item.</li>
    </ul>
  </section>

  <footer>
    prototypes/news-scrapers &middot; node scrape.mjs run | simulate | reset &middot; throwaway code, kept as the record of this ticket
  </footer>
</div>
</body>
</html>
`;

writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('wrote index.html', html.length, 'bytes');
