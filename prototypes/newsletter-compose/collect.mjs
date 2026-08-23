#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#202). Throwaway code, not production.
// Collects REAL items from the phase-1 source list (same parser as the
// feed-poller prototype, #177) so the compose demo runs on a real week.
// Run: node collect.mjs   -> writes collected.json next to itself.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Phase-1 sources with the license class each one freezes onto its items
// (docs/specs/news-pipeline.md, re-serving table).
const SOURCES = [
  { id: "openai-news", name: "OpenAI News", licenseClass: "article", url: "https://openai.com/news/rss.xml" },
  { id: "google-ai-blog", name: "Google AI Blog", licenseClass: "article", url: "https://blog.google/technology/ai/rss/" },
  { id: "latent-space", name: "Latent Space", licenseClass: "article", url: "https://www.latent.space/feed" },
  { id: "simonwillison", name: "Simon Willison", licenseClass: "article", url: "https://simonwillison.net/atom/everything/" },
  { id: "aicrier", name: "AI Crier", licenseClass: "article", url: "https://aicrier.com/feed.xml" },
  { id: "claude-code", name: "claude-code releases", licenseClass: "unlicensed-release-notes", url: "https://github.com/anthropics/claude-code/releases.atom" },
  { id: "codex", name: "codex releases", licenseClass: "permissive-release-notes", url: "https://github.com/openai/codex/releases.atom" },
  { id: "gemini-cli", name: "gemini-cli releases", licenseClass: "permissive-release-notes", url: "https://github.com/google-gemini/gemini-cli/releases.atom" },
  { id: "opencode", name: "opencode releases", licenseClass: "permissive-release-notes", url: "https://github.com/sst/opencode/releases.atom" },
  { id: "pi", name: "pi releases", licenseClass: "permissive-release-notes", url: "https://github.com/earendil-works/pi/releases.atom" },
];

// One compose window: everything published in the last N days.
const WINDOW_DAYS = 14;

// ---- generic parsing (lifted from prototypes/feed-poller/poller.mjs) ------

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
  const entryRe = isAtom
    ? /<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi
    : /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi;
  const blocks = xml.match(entryRe) ?? [];
  return blocks.map((b) => {
    const rawDate = isAtom
      ? textOf(b, "published") ?? textOf(b, "updated")
      : textOf(b, "pubDate") ?? textOf(b, "dc:date");
    const parsed = rawDate ? new Date(rawDate) : null;
    return {
      headline: textOf(b, "title"),
      url: isAtom ? atomLink(b) : textOf(b, "link") ?? atomLink(b),
      publishedAt: parsed && !Number.isNaN(+parsed) ? parsed.toISOString() : null,
    };
  });
}

// ---- collect --------------------------------------------------------------

const cutoff = Date.now() - WINDOW_DAYS * 24 * 3600 * 1000;

async function collect(source) {
  try {
    const res = await fetch(source.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
      headers: {
        "user-agent": UA,
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseFeed(await res.text())
      .filter((i) => i.publishedAt && +new Date(i.publishedAt) >= cutoff)
      .map((i) => ({ ...i, source: source.name, sourceId: source.id, licenseClass: source.licenseClass }));
    console.log(`ok   ${source.id.padEnd(16)} ${items.length} items in window`);
    return items;
  } catch (e) {
    console.log(`FAIL ${source.id.padEnd(16)} ${e?.message ?? e}`);
    return [];
  }
}

const all = (await Promise.all(SOURCES.map(collect))).flat();
all.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
writeFileSync(join(HERE, "collected.json"), JSON.stringify({ collectedAt: new Date().toISOString(), windowDays: WINDOW_DAYS, items: all }, null, 2));
console.log(`\n${all.length} real items in the last ${WINDOW_DAYS} days -> collected.json`);
