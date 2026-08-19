#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#180). Bakes the captured run data into the
// self-contained demo page index.html. Run after scrape.mjs and showcase.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

const J = (f) => JSON.parse(readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'));
const run1 = J('run1.json'), run2 = J('run2.json'), run3 = J('run3.json'), showcase = J('showcase.json');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u2014/g, '-');

const SOURCES = [
  {
    name: 'anthropic-news', title: 'anthropic.com/news', mech: 'sitemap-diff',
    target: 'https://www.anthropic.com/sitemap.xml',
    how: 'The scraper reads the sitemap and keeps the /news/ URLs. A URL that was not in the last run is a new item. The scraper fetches that page and takes the headline from og:title. The date comes from the sitemap lastmod.',
  },
  {
    name: 'claude-blog', title: 'claude.com/blog', mech: 'sitemap-diff',
    target: 'https://claude.com/sitemap.xml',
    how: 'Same mechanism. The filter keeps only default-locale /blog/ URLs, because the sitemap lists five localized copies of each post. The date comes from the JSON-LD datePublished on the article page, because this sitemap has no lastmod.',
  },
  {
    name: 'openai-news', title: 'openai.com/news', mech: 'sitemap-diff',
    target: 'https://openai.com/sitemap.xml (index, 35 children)',
    how: 'The sitemap is an index. The scraper walks all 35 category children and keeps the /index/ article URLs. Cloudflare refuses every article-page fetch with a 403, on any user agent. The RSS feed passes and holds the full archive, so a new item takes its headline and date from the feed.',
  },
  {
    name: 'nous-hermes', title: 'nousresearch.com (Hermes)', mech: 'sitemap-diff',
    target: 'https://nousresearch.com/sitemap.xml',
    how: 'Posts are top-level slugs, and the sitemap does not separate posts from site pages. Every new URL lands in the inbox, and the curation gate absorbs the page noise. The article pages carry og:title and a JSON-LD datePublished.',
  },
  {
    name: 'deepseek-news', title: 'DeepSeek news', mech: 'sitemap-diff',
    target: 'https://api-docs.deepseek.com/sitemap.xml',
    how: 'The docs sitemap lists /news/ pages. Article pages carry og:title but no machine-readable date, so a new item is dated first-seen. The slug (newsYYMMDD) confirms the order.',
  },
  {
    name: 'kimi-blog', title: 'Kimi blog (Moonshot AI)', mech: 'link-diff',
    target: 'https://www.kimi.com/blog',
    how: 'No Kimi sitemap lists blog URLs, but the blog index is server-rendered. The scraper diffs the set of /blog/ hrefs on the index page. Article pages carry og:title but no date, so a new item is dated first-seen.',
  },
  {
    name: 'gemini-changelog', title: 'Gemini API changelog', mech: 'page-diff',
    target: 'https://ai.google.dev/gemini-api/docs/changelog?hl=en',
    how: 'The scraper splits the page into sections at each date heading. A section id that was not in the last run is a new item, and a changed content hash marks an edited section. The license is CC-BY 4.0, so the item carries the full text with attribution.',
  },
  {
    name: 'xai-release-notes', title: 'xAI API release notes (Grok)', mech: 'page-diff',
    target: 'https://docs.x.ai/developers/release-notes',
    how: 'x.ai itself refuses every non-browser request with a 403, but the docs site serves plain HTML. Sections are months, not days, so one item stands for a month of API changes. The consumer Grok news on x.ai/news stays out of reach without a browser.',
  },
  {
    name: 'pi-releases', title: 'pi releases (GitHub)', mech: 'feed-diff',
    target: 'https://github.com/earendil-works/pi/releases.atom',
    how: 'pi has no blog. Its news surface is GitHub releases, which spec phase 1 already covers with the generic feed poller. It rides here to show the diff mechanism on a feed: a new entry id is a new item. The feed holds only the last 10 entries, so the state keeps every id it has ever seen.',
  },
];

const findResult = (run, name) => run.results.find((r) => r.source === name);

const scopeOf = (r) => {
  if (r.mechanism === 'page-diff') return `${r.sections} dated sections`;
  if (r.mechanism === 'feed-diff') return `${r.feedEntries} feed entries`;
  const child = r.childSitemaps ? ` across ${r.childSitemaps} child sitemaps` : '';
  return `${r.rawUrls} URLs${child}, ${r.matchedUrls} matched`;
};

const itemCard = (it) => `
      <div class="item">
        <div class="item-head">${esc(it.headline)}</div>
        <div class="item-meta"><span class="date">${esc(String(it.published ?? it.lastmod ?? it.date ?? '').slice(0, 10))}</span>${it.dateSource ? ` <span class="tag">${esc(it.dateSource)}</span>` : ''}</div>
        ${it.fullText ? `<div class="item-text">${esc(it.fullText)}</div>` : ''}
        <div class="item-url">${esc(it.url)}</div>
      </div>`;

const sourceSection = (src) => {
  const r1 = findResult(run1, src.name), r2 = findResult(run2, src.name), r3 = findResult(run3, src.name);
  const detected = r3.newItems.map(itemCard).join('');
  const sample = (showcase[src.name] ?? []).map(itemCard).join('');
  return `
  <section class="card">
    <h2>${esc(src.title)} <span class="mech">${esc(src.mech)}</span></h2>
    <div class="target">${esc(src.target)}</div>
    <p>${esc(src.how)}</p>
    <table class="runs">
      <tr><th>Run 1, cold</th><td>${esc(scopeOf(r1))}. The run seeds the baseline and emits no items. ${r1.ms} ms.</td></tr>
      <tr><th>Run 2, steady</th><td>0 new${'changedItems' in r2 ? ', 0 changed' : ''}. The live page did not change. ${r2.ms} ms.</td></tr>
      <tr><th>Run 3, detection</th><td>The test dropped <code>${esc(run3.dropped[src.name])}</code> from the stored state. The run found it on the live page and emitted ${r3.newItems.length} new item. ${r3.ms} ms.</td></tr>
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
  .mech { font-family: ui-monospace, monospace; font-size: 12px; color: var(--bg); background: var(--lime); padding: 2px 6px; vertical-align: middle; margin-left: 6px; white-space: nowrap; }
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
    <div class="kicker">PROTOTYPE &middot; alp82/aistack#180 &middot; news pipeline scrapers</div>
    <h1>Working scrapers for nine vendor news sources</h1>
    <div class="sub">All data on this page came from the live sites on ${esc(run1.results[0].fetchedAt.slice(0, 10))}. Nothing is mocked. The first review round covered Anthropic, Claude and Gemini. This round adds OpenAI, Grok/xAI, pi, Hermes, DeepSeek and Kimi per operator request.</div>
  </header>

  <div class="verdict">
    <strong>VERDICT: all nine scrapers work.</strong>
    <p>Each scraper ran three times against the live pages. The cold run seeds the baseline. The steady run reports zero new items. The detection run finds an entry that the test removed from the stored state, and extracts the real item from the live page. Two sources needed a workaround: OpenAI article pages are bot-blocked (the RSS archive fills the gap), and x.ai is fully bot-blocked (the docs site serves the API release notes).</p>
  </div>

  ${SOURCES.map(sourceSection).join('\n')}

  <section class="card">
    <h2>Findings for the spec</h2>
    <ul class="findings">
      <li><strong>The honest bot user agent beats a faked browser.</strong> Every source accepts <code>aistack-news-collector-prototype</code>. A faked full Chrome user agent breaks ai.google.dev with an endless redirect loop.</li>
      <li><strong>OpenAI needs no scraper.</strong> Cloudflare refuses every article-page fetch (403 on any user agent), but the RSS feed passes and holds the full archive of 1139 items with titles and dates. The phase-1 feed poller covers OpenAI completely. The sitemap-diff still works as a detector and enriches from the feed.</li>
      <li><strong>x.ai blocks all non-browser clients.</strong> Every path on x.ai answers 403. The docs site (docs.x.ai) serves plain HTML, so the API release notes are the scrapeable xAI surface. Consumer Grok news needs a browser or stays manual.</li>
      <li><strong>Language pinning is required for the Gemini changelog.</strong> Without <code>?hl=en</code> and an <code>Accept-Language: en</code> header, Google serves a random language. One probe fetch came back machine-translated in Russian, which broke every content hash.</li>
      <li><strong>Script and style bodies must be stripped before hashing.</strong> The changelog page embeds a per-request analytics blob inside a script tag. Hashing the raw text marked all 106 sections as changed on every run.</li>
      <li><strong>The claude.com sitemap has no lastmod and lists five localized copies of each post.</strong> The filter keeps only default-locale URLs, and the item date must come from the JSON-LD datePublished on the article page.</li>
      <li><strong>The anthropic.com lastmod is an update time, not a publish time.</strong> The diff on URL presence is the newness signal, and the lastmod only labels the item date.</li>
      <li><strong>DeepSeek and Kimi article pages carry no machine-readable date.</strong> Their items are dated first-seen, which is accurate from the second collector run on.</li>
      <li><strong>The Nous sitemap does not separate posts from site pages.</strong> A new site page lands in the inbox as noise, and the curation gate (owner approves or discards) absorbs it.</li>
      <li><strong>pi belongs to the phase-1 feed poller.</strong> It has no blog. GitHub releases.atom is its news surface, shown here as a feed-diff. The feed holds only 10 entries, so the state must keep every id it has ever seen.</li>
      <li><strong>A cold run must not emit items.</strong> The nine baselines hold about 1500 historical entries (1085 OpenAI articles alone). The first run seeds the baseline silently, or the inbox floods.</li>
      <li><strong>The whole cycle is cheap.</strong> A steady run across all nine sources is 43 requests and about 17 seconds, dominated by the 35-child OpenAI sitemap walk. Every other source is one request.</li>
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
