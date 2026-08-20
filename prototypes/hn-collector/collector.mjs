#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#178). Throwaway code, not production.
// The HN collector from docs/specs/news-pipeline.md phase 2: Algolia
// search_by_date with keyword and points filters. Run: node collector.mjs
// Pulls one real week of HN stories, applies the filter matrix, and writes
// results.json and index.html (the self-contained demo) next to itself.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const API = "https://hn.algolia.com/api/v1/search_by_date";
const WINDOW_DAYS = 7;

// ---- keywords ---------------------------------------------------------------
// Three tiers. "tool" and "model" name the products the site covers. "broad"
// is the generic AI vocabulary. The matrix below shows what each tier costs.

const KEYWORDS = [
  { kw: "claude code", tier: "tool", re: /\bclaude[\s-]*code\b/i },
  { kw: "codex", tier: "tool", re: /\bcodex\b/i },
  { kw: "gemini cli", tier: "tool", re: /\bgemini[\s-]*cli\b/i },
  { kw: "copilot", tier: "tool", re: /\bcopilot\b/i },
  { kw: "cursor", tier: "tool", re: /\bcursor\b/i },
  { kw: "windsurf", tier: "tool", re: /\bwindsurf\b/i },
  { kw: "opencode", tier: "tool", re: /\bopencode\b/i },
  { kw: "aider", tier: "tool", re: /\baider\b/i },
  { kw: "cline", tier: "tool", re: /\bcline\b/i },
  { kw: "mcp", tier: "tool", re: /\bmcp\b/i },

  { kw: "claude", tier: "model", re: /\bclaude\b/i },
  { kw: "anthropic", tier: "model", re: /\banthropic\b/i },
  { kw: "openai", tier: "model", re: /\bopenai\b/i },
  { kw: "chatgpt", tier: "model", re: /\bchatgpt\b/i },
  { kw: "gpt-*", tier: "model", re: /\bgpt[\s-]?[0-9o]/i },
  { kw: "gemini", tier: "model", re: /\bgemini\b/i },
  { kw: "deepseek", tier: "model", re: /\bdeepseek\b/i },
  { kw: "qwen", tier: "model", re: /\bqwen\b/i },
  { kw: "llama", tier: "model", re: /\bllama\b/i },
  { kw: "mistral", tier: "model", re: /\bmistral\b/i },
  { kw: "grok", tier: "model", re: /\bgrok\b/i },
  { kw: "ollama", tier: "model", re: /\bollama\b/i },
  { kw: "kimi", tier: "model", re: /\bkimi\b/i },
  // Bare model names. "opus" and "sonnet" carry a poetry/music ambiguity, and
  // the per-keyword table shows what that costs. "glm" needs a version digit
  // to dodge generalized linear models.
  { kw: "opus", tier: "model", re: /\bopus\b/i },
  { kw: "sonnet", tier: "model", re: /\bsonnet\b/i },
  { kw: "glm-*", tier: "model", re: /\bglm[\s-]?[0-9]/i },
  { kw: "openrouter", tier: "tool", re: /\bopenrouter\b/i },

  { kw: "llm", tier: "broad", re: /\bllms?\b/i },
  { kw: "ai agent", tier: "broad", re: /\bai agents?\b/i },
  { kw: "coding agent", tier: "broad", re: /\bcoding agents?\b/i },
  { kw: "agentic", tier: "broad", re: /\bagentic\b/i },
  { kw: "vibe coding", tier: "broad", re: /\bvibe[\s-]?cod(e|ed|ing)\b/i },
  { kw: "code assistant", tier: "broad", re: /\b(code|coding) assistants?\b/i },
];

const TIER_ORDER = ["tool", "model", "broad"];

function matchStory(s) {
  const hay = `${s.title ?? ""} ${s.url ?? ""}`;
  const matched = KEYWORDS.filter((k) => k.re.test(hay)).map((k) => k.kw);
  return matched;
}

function topTier(matchedKws) {
  const tiers = new Set(
    matchedKws.map((kw) => KEYWORDS.find((k) => k.kw === kw).tier),
  );
  return TIER_ORDER.find((t) => tiers.has(t)) ?? null;
}

// ---- fetch ------------------------------------------------------------------

async function page(params) {
  const url = `${API}?${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json();
}

// Cursor pagination over created_at_i, newest first, strict < on the cursor.
async function pullWindow(tags, startSec, endSec) {
  const all = new Map();
  let cursor = endSec;
  let requests = 0;
  for (;;) {
    const filters = `created_at_i>=${startSec},created_at_i<${cursor}`;
    const d = await page(
      `tags=${tags}&hitsPerPage=1000&numericFilters=${encodeURIComponent(filters)}`,
    );
    requests += 1;
    if (d.hits.length === 0) break;
    for (const h of d.hits) {
      all.set(h.objectID, {
        id: h.objectID,
        title: h.title,
        url: h.url ?? null,
        points: h.points ?? 0,
        comments: h.num_comments ?? 0,
        createdAt: h.created_at,
        createdAtI: h.created_at_i,
        author: h.author,
      });
    }
    const oldest = Math.min(...d.hits.map((h) => h.created_at_i));
    if (oldest <= startSec || oldest >= cursor) break;
    cursor = oldest;
  }
  return { stories: [...all.values()], requests };
}

const nowSec = Math.floor(Date.now() / 1000);
const startSec = nowSec - WINDOW_DAYS * 86400;

console.log(`pulling ${WINDOW_DAYS} days of stories...`);
const { stories, requests } = await pullWindow("story", startSec, nowSec);
console.log(`  ${stories.length} stories in ${requests} requests`);

console.log("pulling front_page stories for the same window...");
const { stories: frontPage, requests: fpRequests } = await pullWindow(
  "front_page",
  startSec,
  nowSec,
);
console.log(`  ${frontPage.length} front-page stories in ${fpRequests} requests`);

// ---- filter -----------------------------------------------------------------

for (const s of stories) {
  s.matched = matchStory(s);
  s.tier = topTier(s.matched);
  s.ageHours = Math.round((nowSec - s.createdAtI) / 3600);
}
const matched = stories.filter((s) => s.matched.length > 0);

// The filter matrix: keyword set x minimum points.
const POINT_STEPS = [0, 10, 20, 50, 100];
const SETS = {
  "tool only": (s) => s.tier === "tool",
  "tool+model": (s) => s.tier === "tool" || s.tier === "model",
  "all tiers": (s) => s.tier !== null,
  "no keywords": () => true,
};
const matrix = {};
for (const [name, pred] of Object.entries(SETS)) {
  matrix[name] = {};
  for (const p of POINT_STEPS) {
    matrix[name][p] = stories.filter((s) => pred(s) && s.points >= p).length;
  }
}

// Per-keyword counts, with and without the points gate.
const perKeyword = KEYWORDS.map((k) => {
  const hits = matched.filter((s) => s.matched.includes(k.kw));
  return {
    kw: k.kw,
    tier: k.tier,
    total: hits.length,
    over20: hits.filter((s) => s.points >= 20).length,
    over50: hits.filter((s) => s.points >= 50).length,
  };
});

// Recall proxy: AI stories that reached the HN front page. Which points
// threshold keeps them, and does the keyword net catch them at all?
const fpIds = new Set(frontPage.map((s) => s.id));
const aiFront = frontPage
  .map((s) => ({ ...s, matched: matchStory(s), points: s.points ?? 0 }))
  .filter((s) => s.matched.length > 0);
for (const s of aiFront) s.tier = topTier(s.matched);

// Points settle over time. Share of stories at or over each threshold by age.
const AGE_BUCKETS = [
  { label: "0-6h", min: 0, max: 6 },
  { label: "6-24h", min: 6, max: 24 },
  { label: "1-2d", min: 24, max: 48 },
  { label: "2-7d", min: 48, max: 24 * 7 },
];
const settle = AGE_BUCKETS.map((b) => {
  const inB = stories.filter((s) => s.ageHours >= b.min && s.ageHours < b.max);
  const n = inB.length || 1;
  return {
    label: b.label,
    count: inB.length,
    p10: Math.round((100 * inB.filter((s) => s.points >= 10).length) / n),
    p20: Math.round((100 * inB.filter((s) => s.points >= 20).length) / n),
    p50: Math.round((100 * inB.filter((s) => s.points >= 50).length) / n),
  };
});

const fetchedAt = new Date().toISOString();
const out = {
  fetchedAt,
  windowDays: WINDOW_DAYS,
  requests: requests + fpRequests,
  totalStories: stories.length,
  matchedStories: matched.length,
  frontPageStories: frontPage.length,
  aiFrontPageStories: aiFront.length,
  matrix,
  perKeyword,
  settle,
  aiFront: aiFront
    .sort((a, b) => b.points - a.points)
    .map(({ id, title, url, points, comments, createdAt, matched: m, tier }) => ({
      id, title, url, points, comments, createdAt, matched: m, tier,
    })),
  inbox: matched
    .sort((a, b) => b.points - a.points)
    .map(({ id, title, url, points, comments, createdAt, matched: m, tier, ageHours }) => ({
      id, title, url, points, comments, createdAt, matched: m, tier, ageHours,
    })),
  // The other side of the net: what the keywords reject. The top of this list
  // is where a missed AI story would show up.
  unmatchedTop: stories
    .filter((s) => s.matched.length === 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 80)
    .map(({ id, title, url, points, comments, createdAt }) => ({
      id, title, url, points, comments, createdAt,
    })),
};
writeFileSync(join(HERE, "results.json"), JSON.stringify(out, null, 2));
console.log(
  `matched ${matched.length} of ${stories.length}; ` +
    `AI front-page ${aiFront.length} of ${frontPage.length}; wrote results.json`,
);
console.log("now run: node build-demo.mjs");
