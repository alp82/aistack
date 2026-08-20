#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#177). Throwaway code, not production.
// One generic RSS/Atom poller over the phase-1 source list from
// docs/specs/news-pipeline.md. Run: node poller.mjs
// Writes results.json and index.html (the self-contained demo) next to itself.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const SOURCES = [
  { id: "openai-news", kind: "vendor blog", url: "https://openai.com/news/rss.xml" },
  { id: "google-ai-blog", kind: "vendor blog", url: "https://blog.google/technology/ai/rss/" },
  { id: "latent-space", kind: "Substack", url: "https://www.latent.space/feed" },
  { id: "404-media", kind: "Ghost", url: "https://www.404media.co/rss/" },
  // ainews moved to news.smol.ai in 2025. The feed still serves, dated items
  // and all, which is exactly what a poller sees on a dormant source.
  { id: "ainews", kind: "Buttondown", url: "https://buttondown.com/ainews/rss" },
  { id: "computer-things", kind: "Buttondown", url: "https://buttondown.com/hillelwayne/rss" },
  { id: "simonwillison", kind: "personal blog", url: "https://simonwillison.net/atom/everything/" },
  {
    id: "youtube-channel",
    kind: "YouTube channel",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC0C-17n9iuUQPylguM1d-lQ",
  },
  { id: "aicrier", kind: "aggregator", url: "https://aicrier.com/feed.xml" },
  { id: "claude-code", kind: "GitHub releases", url: "https://github.com/anthropics/claude-code/releases.atom" },
  { id: "codex", kind: "GitHub releases", url: "https://github.com/openai/codex/releases.atom" },
  { id: "gemini-cli", kind: "GitHub releases", url: "https://github.com/google-gemini/gemini-cli/releases.atom" },
  // sst/opencode moved to anomalyco/opencode. The old URL stays on purpose:
  // it proves the poller survives a repo move through the 301.
  { id: "opencode", kind: "GitHub releases", url: "https://github.com/sst/opencode/releases.atom" },
  { id: "pi", kind: "GitHub releases", url: "https://github.com/earendil-works/pi/releases.atom" },
];

// ---- generic parsing ------------------------------------------------------

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function textOf(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return null;
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) v = cdata[1].trim();
  return decodeEntities(v.replace(/<[^>]+>/g, "").trim());
}

function atomLink(block) {
  const links = [...block.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const pick =
    links.find((l) => /rel=["']alternate["']/i.test(l)) ??
    links.find((l) => !/rel=/i.test(l)) ??
    links[0];
  const href = pick?.match(/href=["']([^"']+)["']/i);
  return href ? decodeEntities(href[1]) : null;
}

function parseFeed(xml) {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const format = isAtom ? "atom" : /<rss[\s>]/i.test(xml) ? "rss" : null;
  if (!format) throw new Error("neither <rss> nor <feed> found");

  const entryRe = isAtom
    ? /<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi
    : /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi;
  const blocks = xml.match(entryRe) ?? [];

  const head = xml.slice(0, blocks.length ? xml.indexOf(blocks[0]) : xml.length);
  const feedTitle = textOf(head, "title");

  const items = blocks.map((b) => {
    const rawDate = isAtom
      ? textOf(b, "published") ?? textOf(b, "updated")
      : textOf(b, "pubDate") ?? textOf(b, "dc:date");
    const parsed = rawDate ? new Date(rawDate) : null;
    return {
      title: textOf(b, "title"),
      link: isAtom ? atomLink(b) : textOf(b, "link") ?? atomLink(b),
      date: parsed && !Number.isNaN(+parsed) ? parsed.toISOString() : rawDate,
    };
  });
  return { format, feedTitle, items };
}

// ---- polling --------------------------------------------------------------

async function poll(source) {
  const started = Date.now();
  const out = { ...source, ok: false, status: null, finalUrl: null, format: null, feedTitle: null, itemCount: 0, items: [], error: null, ms: 0 };
  try {
    const res = await fetch(source.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
      headers: {
        "user-agent": UA,
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });
    out.status = res.status;
    out.finalUrl = res.url;
    const body = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const feed = parseFeed(body);
    out.format = feed.format;
    out.feedTitle = feed.feedTitle;
    out.itemCount = feed.items.length;
    out.items = feed.items.slice(0, 5);
    if (feed.items.length === 0) throw new Error("feed parsed but zero items");
    out.ok = true;
  } catch (e) {
    out.error = e?.message ?? String(e);
  }
  out.ms = Date.now() - started;
  return out;
}

const results = await Promise.all(SOURCES.map(poll));
const fetchedAt = new Date().toISOString();
writeFileSync(join(HERE, "results.json"), JSON.stringify({ fetchedAt, results }, null, 2));

for (const r of results) {
  const mark = r.ok ? "ok  " : "FAIL";
  console.log(`${mark} ${r.id.padEnd(16)} ${r.format ?? "-"}  ${String(r.itemCount).padStart(3)} items  ${r.ms}ms  ${r.error ?? ""}`);
}

// ---- demo page ------------------------------------------------------------

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const day = (iso) => (iso ? String(iso).slice(0, 10) : "no date");
const okCount = results.filter((r) => r.ok).length;
const failures = results.filter((r) => !r.ok);

const rows = results
  .map(
    (r) => `<tr class="${r.ok ? "ok" : "fail"}">
  <td>${r.ok ? "OK" : "FAIL"}</td>
  <td>${esc(r.id)}</td>
  <td>${esc(r.kind)}</td>
  <td>${esc(r.format ?? "-")}</td>
  <td class="num">${r.itemCount}</td>
  <td class="num">${r.ms}</td>
  <td>${esc(r.error ?? "")}</td>
</tr>`,
  )
  .join("\n");

const cards = results
  .map((r) => {
    const items = r.items
      .map(
        (i) => `<li><span class="date">${esc(day(i.date))}</span> <a href="${esc(i.link)}">${esc(i.title)}</a></li>`,
      )
      .join("\n");
    const moved = r.finalUrl && r.finalUrl !== r.url ? `<p class="note">redirected to ${esc(r.finalUrl)}</p>` : "";
    const body = r.ok
      ? `<ul>${items}</ul>`
      : `<p class="err">FAIL: ${esc(r.error)}</p>`;
    return `<section class="card ${r.ok ? "ok" : "fail"}">
  <h3>${esc(r.feedTitle ?? r.id)} <span class="tag">${esc(r.kind)}</span></h3>
  <p class="meta">${esc(r.url)} · ${esc(r.format ?? "?")} · HTTP ${esc(r.status)} · ${r.itemCount} items · ${r.ms}ms</p>
  ${moved}
  ${body}
</section>`;
  })
  .join("\n");

const failList = failures.length
  ? `<ul>${failures.map((r) => `<li><strong>${esc(r.id)}</strong> (${esc(r.kind)}): ${esc(r.error)}</li>`).join("")}</ul>`
  : "<p>None. Every source returned a parseable feed with items.</p>";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Feed poller prototype (#177)</title>
<style>
  * { box-sizing: border-box; border-radius: 0; }
  body { margin: 0; background: #0c0e0c; color: #d8ddd8; font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 900px; margin: 0 auto; padding: 1rem; }
  header { border-bottom: 2px solid #a3e635; padding: 1rem 0; margin-bottom: 1rem; }
  h1, h2, h3, .meta, .tag, .date, table { font-family: ui-monospace, monospace; }
  h1 { font-size: 1.2rem; margin: 0; }
  header p { margin: .4rem 0 0; color: #9aa39a; }
  .big { color: #a3e635; font-weight: bold; }
  table { border-collapse: collapse; width: 100%; font-size: .8rem; }
  th, td { border: 1px solid #2a2f2a; padding: .3rem .5rem; text-align: left; }
  td.num { text-align: right; }
  tr.fail td { color: #f87171; }
  .wrap { overflow-x: auto; }
  .card { border: 1px solid #2a2f2a; border-left: 4px solid #a3e635; padding: .8rem 1rem; margin: 1rem 0; }
  .card.fail { border-left-color: #f87171; }
  .card h3 { margin: 0 0 .2rem; font-size: 1rem; }
  .tag { color: #0c0e0c; background: #a3e635; padding: 0 .4rem; font-size: .7rem; vertical-align: middle; }
  .card.fail .tag { background: #f87171; }
  .meta { color: #9aa39a; font-size: .75rem; margin: 0 0 .5rem; word-break: break-all; }
  .note { color: #eab308; font-size: .75rem; margin: 0 0 .5rem; word-break: break-all; }
  ul { margin: 0; padding-left: 1.2rem; }
  li { margin: .25rem 0; }
  a { color: #a3e635; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .date { color: #9aa39a; font-size: .75rem; margin-right: .3rem; }
  .err { color: #f87171; }
</style>
</head>
<body>
<main>
<header>
  <h1>Feed poller prototype · alp82/aistack#177</h1>
  <p>One generic RSS/Atom poller over the phase-1 source list from the news pipeline spec.
     Real items, fetched live at ${esc(fetchedAt)}.
     Result: <span class="big">${okCount} of ${results.length} sources work</span>.</p>
</header>

<h2>Sources where the generic poller fails</h2>
${failList}

<h2>Findings</h2>
<ul>
  <li>openai.com sits behind Cloudflare. A browser user agent was enough, no block from this datacenter IP.</li>
  <li>Redirects matter. blog.google moved its RSS path, and sst/opencode moved to anomalyco/opencode. The poller follows both 301s.</li>
  <li>The AI News Buttondown feed is dormant. The newsletter moved to news.smol.ai in 2025. The feed still parses, and the item dates expose the dormancy. Computer Things proves a live Buttondown feed.</li>
  <li>The OpenAI feed returns its full archive (1139 items). The real collector needs a date cutoff or a seen-item store, not a count limit.</li>
  <li>Both formats appear in the wild set: RSS 2.0 on the blogs and newsletters, Atom on GitHub, YouTube, and simonwillison.net. One parser with two entry shapes covers all 14.</li>
</ul>

<h2>All sources</h2>
<div class="wrap">
<table>
  <tr><th></th><th>source</th><th>kind</th><th>format</th><th>items</th><th>ms</th><th>error</th></tr>
${rows}
</table>
</div>

<h2>Fetched items (5 newest per source)</h2>
${cards}

<footer>
  <p class="meta">PROTOTYPE, throwaway. Regenerate with: node prototypes/feed-poller/poller.mjs</p>
</footer>
</main>
</body>
</html>
`;

writeFileSync(join(HERE, "index.html"), html);
console.log(`\n${okCount}/${results.length} ok · wrote results.json and index.html`);
