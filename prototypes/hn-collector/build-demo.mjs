#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#178). Throwaway code, not production.
// Reads results.json (written by collector.mjs) and writes index.html,
// the one self-contained demo page. Run: node build-demo.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const d = JSON.parse(readFileSync(join(HERE, "results.json"), "utf8"));

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const POINT_STEPS = [0, 10, 20, 50, 100];

const matrixRows = Object.entries(d.matrix)
  .map(
    ([name, row]) => `<tr class="${name === "no keywords" ? "dim" : ""}">
  <td>${esc(name)}</td>
  ${POINT_STEPS.map((p) => `<td class="num${name === "all tiers" && p === 20 ? " pick" : ""}">${row[p]}</td>`).join("")}
</tr>`,
  )
  .join("\n");

const kwRows = d.perKeyword
  .filter((k) => k.total > 0)
  .sort((a, b) => b.total - a.total)
  .map(
    (k) => `<tr>
  <td><span class="tier t-${k.tier}">${esc(k.tier)}</span></td>
  <td>${esc(k.kw)}</td>
  <td class="num">${k.total}</td>
  <td class="num">${k.over20}</td>
  <td class="num">${k.over50}</td>
</tr>`,
  )
  .join("\n");

const settleRows = d.settle
  .map(
    (b) => `<tr>
  <td>${esc(b.label)}</td>
  <td class="num">${b.count}</td>
  <td class="num">${b.p10}%</td>
  <td class="num">${b.p20}%</td>
  <td class="num">${b.p50}%</td>
</tr>`,
  )
  .join("\n");

const missRows = d.unmatchedTop
  .slice(0, 40)
  .map(
    (s) => `<tr>
  <td class="num">${s.points}</td>
  <td><a href="https://news.ycombinator.com/item?id=${esc(s.id)}">${esc(s.title)}</a></td>
</tr>`,
  )
  .join("\n");

const inboxData = JSON.stringify(
  d.inbox.map((s) => ({
    id: s.id,
    t: s.title,
    u: s.url,
    p: s.points,
    c: s.comments,
    d: s.createdAt.slice(0, 10),
    k: s.matched,
    r: s.tier,
  })),
);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HN collector prototype (#178)</title>
<style>
  * { box-sizing: border-box; border-radius: 0; }
  body { margin: 0; background: #0c0e0c; color: #d8ddd8; font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 900px; margin: 0 auto; padding: 1rem; }
  header { border-bottom: 2px solid #a3e635; padding: 1rem 0; margin-bottom: 1rem; }
  h1, h2, .meta, table, button, .tier, .kw, .date { font-family: ui-monospace, monospace; }
  h1 { font-size: 1.2rem; margin: 0; }
  h2 { font-size: 1rem; margin: 1.6rem 0 .5rem; color: #a3e635; }
  header p { margin: .4rem 0 0; color: #9aa39a; }
  .big { color: #a3e635; font-weight: bold; }
  table { border-collapse: collapse; width: 100%; font-size: .8rem; }
  th, td { border: 1px solid #2a2f2a; padding: .3rem .5rem; text-align: left; }
  td.num, th.num { text-align: right; }
  td.pick { background: #a3e635; color: #0c0e0c; font-weight: bold; }
  tr.dim td { color: #6b736b; }
  .wrap { overflow-x: auto; }
  a { color: #a3e635; text-decoration: none; }
  a:hover { text-decoration: underline; }
  ul { margin: .3rem 0; padding-left: 1.2rem; }
  li { margin: .3rem 0; }
  .controls { border: 1px solid #2a2f2a; padding: .8rem 1rem; margin: .8rem 0; position: sticky; top: 0; background: #0c0e0c; z-index: 2; }
  .controls .row { margin: .3rem 0; display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
  .controls .lbl { color: #9aa39a; font-size: .75rem; font-family: ui-monospace, monospace; min-width: 7em; }
  button { background: #161916; color: #d8ddd8; border: 1px solid #2a2f2a; padding: .25rem .7rem; font-size: .8rem; cursor: pointer; }
  button.on { background: #a3e635; color: #0c0e0c; border-color: #a3e635; font-weight: bold; }
  #count { color: #a3e635; font-weight: bold; font-family: ui-monospace, monospace; }
  .item { border: 1px solid #2a2f2a; border-left: 4px solid #2a2f2a; padding: .5rem .8rem; margin: .5rem 0; }
  .item.t-tool { border-left-color: #a3e635; }
  .item.t-model { border-left-color: #60a5fa; }
  .item.t-broad { border-left-color: #eab308; }
  .item .top { font-size: .75rem; color: #9aa39a; font-family: ui-monospace, monospace; }
  .item .pts { color: #a3e635; font-weight: bold; }
  .item .title { display: block; margin: .15rem 0; }
  .kw { display: inline-block; background: #161916; border: 1px solid #2a2f2a; padding: 0 .35rem; font-size: .7rem; margin-right: .25rem; color: #9aa39a; }
  .tier { padding: 0 .35rem; font-size: .7rem; color: #0c0e0c; }
  .t-tool.tier { background: #a3e635; }
  .t-model.tier { background: #60a5fa; }
  .t-broad.tier { background: #eab308; }
  footer { margin-top: 2rem; color: #6b736b; font-size: .75rem; font-family: ui-monospace, monospace; }
</style>
</head>
<body>
<main>
<header>
  <h1>HN collector prototype · alp82/aistack#178</h1>
  <p>The Algolia <code>search_by_date</code> collector from the news pipeline spec, run against
     one real week of Hacker News (fetched ${esc(d.fetchedAt)}).
     ${d.requests} API requests pulled ${d.totalStories} stories.
     The keyword net matches <span class="big">${d.matchedStories}</span> of them.
     At 20 points or more, <span class="big">${d.matrix["all tiers"][20]}</span> items
     remain: the weekly inbox.</p>
</header>

<h2>Verdict</h2>
<ul>
  <li><strong>The filters work.</strong> Keywords cut ${d.totalStories} stories to ${d.matchedStories}. A 20-point gate cuts them to ${d.matrix["all tiers"][20]} per week, about ${Math.round(d.matrix["all tiers"][20] / 7)} per day. That is a skimmable inbox.</li>
  <li><strong>False matches are rare.</strong> This week, every "cursor" item over 20 points is Cursor the product. The noise that remains is vendor business and gossip stories, about 10 of the ${d.matrix["all tiers"][20]}. The owner discards those in the inbox.</li>
  <li><strong>The keyword net misses nameless AI stories.</strong> Essays like "AI;DR" or "AI isn't outthinking mathematicians" carry no product name. The miss list below shows the cost. A bare "ai" keyword would flood the inbox, so this stays a known limit.</li>
  <li><strong>Points settle slowly.</strong> Only ${d.settle[0].p20}% of 0-6h stories sit at 20 points or more, against ${d.settle[3].p20}% of settled ones. The collector must re-read points until an item is about 48 hours old, or apply the gate on a one-day delay.</li>
  <li><strong>Rate limits are a non-issue.</strong> A full week costs ${d.requests} requests against a 10,000 per hour limit. A daily cron over a trailing 48h window costs 2 to 3 requests per run.</li>
</ul>

<h2>The inbox, live</h2>
<p>These are the real ${d.matchedStories} keyword-matched stories. Pick the points gate and
   the keyword tiers. The spec values light up by default.</p>

<div class="controls">
  <div class="row"><span class="lbl">min points</span>
    ${POINT_STEPS.map((p) => `<button data-pts="${p}"${p === 20 ? ' class="on"' : ""}>${p === 0 ? "none" : `&ge;${p}`}</button>`).join("")}
  </div>
  <div class="row"><span class="lbl">keyword tiers</span>
    <button data-tier="tool" class="on">tool</button>
    <button data-tier="model" class="on">model</button>
    <button data-tier="broad" class="on">broad</button>
  </div>
  <div class="row"><span class="lbl">result</span> <span id="count"></span></div>
</div>

<div id="inbox"></div>

<h2>The filter matrix (items per week)</h2>
<div class="wrap">
<table>
  <tr><th>keyword set</th>${POINT_STEPS.map((p) => `<th class="num">${p === 0 ? "any pts" : `&ge;${p}`}</th>`).join("")}</tr>
${matrixRows}
</table>
</div>
<p class="meta">The lime cell is the recommended start: all tiers, 20 points or more.</p>

<h2>What each keyword catches</h2>
<div class="wrap">
<table>
  <tr><th>tier</th><th>keyword</th><th class="num">matched</th><th class="num">&ge;20 pts</th><th class="num">&ge;50 pts</th></tr>
${kwRows}
</table>
</div>

<h2>Points settle over time</h2>
<p>Share of stories at or over each gate, by story age at fetch time. Young stories have
   not collected their points yet. A collector that reads points too early drops keepers.</p>
<div class="wrap">
<table>
  <tr><th>age</th><th class="num">stories</th><th class="num">&ge;10 pts</th><th class="num">&ge;20 pts</th><th class="num">&ge;50 pts</th></tr>
${settleRows}
</table>
</div>

<h2>What the keyword net rejects (top 40 by points)</h2>
<p>The other side of the filter. A missed AI story would show up here. Most rows are
   ordinary HN. The nameless AI essays are the real misses.</p>
<div class="wrap">
<table>
  <tr><th class="num">pts</th><th>title</th></tr>
${missRows}
</table>
</div>

<footer>
  <p>PROTOTYPE, throwaway. Regenerate with: node collector.mjs &amp;&amp; node build-demo.mjs<br>
  Source: Algolia HN Search API, search_by_date, tags=story, numericFilters on created_at_i and points.<br>
  Re-serving per spec: titles and links only. Every link goes to the story or to HN.</p>
</footer>
</main>

<script>
const DATA = ${inboxData};
let minPts = 20;
const tiers = new Set(["tool", "model", "broad"]);

function render() {
  const rows = DATA.filter((s) => s.p >= minPts && tiers.has(s.r));
  document.getElementById("count").textContent =
    rows.length + " items per week (" + (rows.length / 7).toFixed(1) + " per day)";
  const html = rows
    .map((s) => {
      const link = s.u || "https://news.ycombinator.com/item?id=" + s.id;
      return '<div class="item t-' + s.r + '">' +
        '<span class="top"><span class="pts">' + s.p + ' pts</span> · ' + s.c +
        ' comments · ' + s.d + ' · <a href="https://news.ycombinator.com/item?id=' + s.id +
        '">HN thread</a></span>' +
        '<a class="title" href="' + link.replace(/"/g, "&quot;") + '">' +
        s.t.replace(/&/g, "&amp;").replace(/</g, "&lt;") + '</a>' +
        '<span class="tier t-' + s.r + '">' + s.r + '</span> ' +
        s.k.map((k) => '<span class="kw">' + k + '</span>').join("") +
        '</div>';
    })
    .join("");
  document.getElementById("inbox").innerHTML =
    html || "<p>No items pass these filters.</p>";
}

document.querySelectorAll("[data-pts]").forEach((b) =>
  b.addEventListener("click", () => {
    minPts = Number(b.dataset.pts);
    document.querySelectorAll("[data-pts]").forEach((x) => x.classList.toggle("on", x === b));
    render();
  }),
);
document.querySelectorAll("[data-tier]").forEach((b) =>
  b.addEventListener("click", () => {
    const t = b.dataset.tier;
    if (tiers.has(t)) tiers.delete(t); else tiers.add(t);
    b.classList.toggle("on", tiers.has(t));
    render();
  }),
);
render();
</script>
</body>
</html>
`;

writeFileSync(join(HERE, "index.html"), html);
console.log(`wrote index.html (${(html.length / 1024).toFixed(0)} KB)`);
