// PROTOTYPE - throwaway. Serves the demo page and one live API:
//   GET /api/profile-posts?name=SCREEN_NAME
// It fetches the last posts of an X profile server side, where CORS and
// rate limits can be handled. The page falls back to a captured fixture
// when this server is absent (plain static serving).
//
// Run: node server.js  (port 9006, binds 0.0.0.0)
// No dependencies.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9006;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// name -> { at, posts } - profiles change slowly, a 10 minute cache is plenty
// for a demo and keeps the rate-limited endpoint calm.
const cache = new Map();
const CACHE_MS = 10 * 60 * 1000;

// FINDING (2026-08-19): the endpoint blocks by client fingerprint, not by
// rate. From the same IP, curl gets 200 every time while Node fetch and
// node:https get 429 every time, same User-Agent. So this prototype shells
// out to curl. A Convex action has no curl, which is a hard fact against
// this endpoint for the real collector. See the research file.
function curlGet(url) {
  return new Promise((resolve, reject) => {
    execFile("curl", ["-sS", "--max-time", "20", "-A", UA, "-w", "\n%{http_code}", url],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err && !stdout) return reject(err);
        const cut = stdout.lastIndexOf("\n");
        resolve({ status: Number(stdout.slice(cut + 1)), body: stdout.slice(0, cut) });
      });
  });
}

async function curlWithRetry(url, tries) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 5000 * i));
    last = await curlGet(url);
    if (last.status !== 429) return last;
  }
  return last;
}

// Primary path: the unofficial syndication timeline page. The __NEXT_DATA__
// JSON carries the last ~100 timeline entries.
async function profilePosts(name) {
  const url = "https://syndication.twitter.com/srv/timeline-profile/screen-name/" + encodeURIComponent(name);
  const res = await curlWithRetry(url, 3);
  if (res.status !== 200) return { error: "timeline endpoint answered " + res.status };
  const html = res.body;
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!m) return { error: "no __NEXT_DATA__ in the timeline page" };
  let data;
  try { data = JSON.parse(m[1]); } catch { return { error: "timeline JSON did not parse" }; }
  const entries = data?.props?.pageProps?.timeline?.entries || [];
  const posts = [];
  for (const e of entries) {
    const t = e?.content?.tweet;
    if (!t || !t.id_str) continue;
    posts.push({
      id: t.id_str,
      screenName: t.user?.screen_name || name,
      date: t.created_at || null,
      // Preview text only. The stored item stays ID plus official embed.
      text: String(t.full_text || "").slice(0, 200),
      isReply: Boolean(t.in_reply_to_status_id_str),
      isRepost: Boolean(t.retweeted_status),
    });
    if (posts.length >= 25) break;
  }
  if (!posts.length) return { error: "the timeline page carried no posts" };
  return { posts };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname === "/api/profile-posts") {
    const name = (u.searchParams.get("name") || "").trim();
    res.setHeader("content-type", "application/json");
    if (!/^[A-Za-z0-9_]{1,15}$/.test(name)) {
      res.writeHead(400); res.end(JSON.stringify({ error: "bad profile name" })); return;
    }
    const key = name.toLowerCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      res.writeHead(200); res.end(JSON.stringify({ ...hit.body, cached: true })); return;
    }
    try {
      const body = await profilePosts(name);
      if (!body.error) cache.set(key, { at: Date.now(), body });
      res.writeHead(body.error ? 502 : 200);
      res.end(JSON.stringify(body));
    } catch (e) {
      res.writeHead(502); res.end(JSON.stringify({ error: String(e && e.message || e) }));
    }
    return;
  }
  // Static: the demo page only.
  const file = u.pathname === "/" ? "/index.html" : u.pathname;
  const fp = path.join(__dirname, path.normalize(file).replace(/^([.][.][/\\])+/, ""));
  if (!fp.startsWith(__dirname) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); res.end("not found"); return;
  }
  const type = fp.endsWith(".html") ? "text/html; charset=utf-8" : "text/plain; charset=utf-8";
  res.writeHead(200, { "content-type": type });
  res.end(fs.readFileSync(fp));
});

server.listen(PORT, "0.0.0.0", () => console.log("demo on 0.0.0.0:" + PORT));
