#!/usr/bin/env node
// PROTOTYPE - alp82/aistack#196 - phase extraction from real chat histories, no LLM.
// Throwaway code. Run it on the machine that holds the transcripts:
//
//   node prototypes/phase-extraction/extract.mjs            # human-readable summary
//   node prototypes/phase-extraction/extract.mjs --json     # aggregate JSON to stdout
//   node prototypes/phase-extraction/extract.mjs --days 60  # window (default 90)
//
// Reads local session records of four harnesses (Claude Code, Codex, opencode, Pi),
// classifies every recorded tool event with the versioned phase rules, and prints
// AGGREGATES ONLY. No prompt text, no tool output, no full commands, no paths and
// no session identifiers leave this process. Shell commands reduce to a first-word
// head; session ids reduce to an 8-char hash.
//
// Rule sets:
//   phase-rules/v1  tool identity markers only (anatomy prototype, phases renamed)
//   phase-rules/v2  v1 + fixed command-head rules + forge stage markers (#166 round 3)
//   phase-rules/v3-draft  v2 + chain-segment matching + extended heads (revision draft,
//                         NOT decided - it exists to show what a revision would reclaim)

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

// ---------------------------------------------------------------------------
// Phase rules. Public phase set: scout, build, verify, handoff, unknown.
// (Spec renames: orient -> scout, gate -> handoff.)
// ---------------------------------------------------------------------------

const HANDOFF_TOOLS = [
  "mcp__curia__ask_human",
  "mcp__curia__request_review",
  "AskUserQuestion",
  "ExitPlanMode",
];
const HANDOFF_SURFACE_TOOLS = [
  "mcp__curia__open_pull_request",
  "mcp__curia__publish_preview",
  "mcp__curia__report_result",
];
const SCOUT_TOOLS = [
  "Read",
  "Grep",
  "Glob",
  "WebFetch",
  "WebSearch",
  "ToolSearch",
  // cross-harness spellings of the same read/search tools
  "read",
  "grep",
  "glob",
  "list",
  "ls",
  "webfetch",
  "websearch",
  "web_search",
  "tool_search",
  "codebase_search",
  "find",
];
const EDIT_TOOLS = [
  "Edit",
  "Write",
  "NotebookEdit",
  // cross-harness spellings
  "edit",
  "write",
  "patch",
  "multiedit",
  "apply_patch",
];
const REVIEW_SKILLS = ["code-review", "security-review", "review"];
const SCOUT_AGENTS = ["Explore", "Plan", "research"];
const SHELL_TOOLS = ["Bash", "bash", "shell", "local_shell"];
const SKILL_TOOLS = ["Skill", "skill"];
const AGENT_TOOLS = ["Agent", "Task", "task", "agent"];

function isShell(tool) {
  return SHELL_TOOLS.includes(tool);
}

// Exact anatomy matcher: raw prefix, first segment only.
function cmdIs(arg, heads) {
  for (const h of heads) if (arg === h || arg.startsWith(h + " ")) return true;
  return false;
}

const V2_TEST_HEADS = ["pnpm test", "vitest", "tsc", "biome", "pnpm build", "pnpm lint", "pnpm typecheck"];
const V2_PUBLISH_HEADS = ["git push", "gh pr create", "gh pr merge"];
const V2_CHANGE_HEADS = ["git add", "git commit", "mkdir", "cp", "mv", "rm", "touch", "sed", "pnpm add", "npm install"];
const V2_READ_HEADS = ["ls", "cat", "head", "tail", "wc", "grep", "rg", "find", "git log", "git show", "git diff", "git status", "gh issue view", "gh issue list", "gh pr view", "gh pr list", "curl"];

// v3-draft additions: chain-aware matching plus heads real histories use.
const V3_TEST_HEADS = V2_TEST_HEADS.concat(["npm test", "npm run test", "pnpm vitest", "npx vitest", "npx tsc", "pnpm exec", "pytest", "cargo test", "go test", "node --test", "make test", "pnpm check", "npm run build", "npm run lint"]);
const V3_PUBLISH_HEADS = V2_PUBLISH_HEADS.concat(["npm publish", "pnpm publish", "gh release"]);
const V3_CHANGE_HEADS = V2_CHANGE_HEADS.concat(["git checkout", "git restore", "git stash", "git mv", "git rm", "git rebase", "git merge", "git cherry-pick", "git init", "git branch", "git worktree", "pnpm install", "pnpm remove", "npm i", "npm ci", "yarn add", "chmod", "ln", "tee", "echo", "printf", "npx convex", "pnpm convex", "pnpm dlx", "npx create"]);
const V3_READ_HEADS = V2_READ_HEADS.concat(["pwd", "which", "whoami", "echo $", "env", "printenv", "node --version", "node -v", "pnpm --version", "df", "du", "ps", "top", "file", "stat", "tree", "jq", "sort", "uniq", "cut", "awk", "diff", "gh api", "gh run", "gh workflow", "gh search", "gh issue", "gh pr", "git remote", "git fetch", "git ls-files", "git blame", "git describe", "git rev-parse", "sqlite3", "date", "uname", "man", "history", "type"]);

// v3-draft: split a chain into segments, classify each, highest precedence wins.
function chainSegments(arg) {
  return arg
    .split(/(?:&&|\|\||;|\|)/)
    .map((s) => s.trim().replace(/^(?:\w+=\S*\s+)+/, "").replace(/^(?:cd\s+\S+\s*)$/, ""))
    .filter(Boolean);
}
function v3Shell(arg) {
  const segs = chainSegments(arg);
  let best = null;
  const rank = { verify: 4, handoff: 3, build: 2, scout: 1 };
  for (const seg of segs) {
    let p = null;
    if (cmdIs(seg, V3_TEST_HEADS)) p = "verify";
    else if (cmdIs(seg, V3_PUBLISH_HEADS)) p = "handoff";
    else if (cmdIs(seg, V3_CHANGE_HEADS)) p = "build";
    else if (cmdIs(seg, V3_READ_HEADS)) p = "scout";
    if (p && (!best || rank[p] > rank[best])) best = p;
  }
  return best;
}

// A rule: { id, phase, test(tool, arg) }. First match wins.
const MARKER_RULES = [
  { id: "handoff.blocking-call", phase: "handoff", test: (t) => HANDOFF_TOOLS.includes(t) },
  { id: "handoff.surface", phase: "handoff", test: (t) => HANDOFF_SURFACE_TOOLS.includes(t) },
  { id: "verify.review-skill", phase: "verify", test: (t, a) => SKILL_TOOLS.includes(t) && REVIEW_SKILLS.includes(a) },
  { id: "build.edit-tool", phase: "build", test: (t) => EDIT_TOOLS.includes(t) },
  { id: "scout.read-tool", phase: "scout", test: (t) => SCOUT_TOOLS.includes(t) },
  { id: "scout.skill-load", phase: "scout", test: (t) => SKILL_TOOLS.includes(t) },
  { id: "scout.scout-agent", phase: "scout", test: (t, a) => AGENT_TOOLS.includes(t) && SCOUT_AGENTS.includes(a) },
];

// Forge stage markers, #166 round 3: named v2 rules where the harness records
// the skill call. Default mapping (round 1 question): forge -> build,
// crossfire -> verify. They sit BEFORE the generic skill-load rule.
const FORGE_RULES = [
  { id: "verify.crossfire-skill", phase: "verify", test: (t, a) => SKILL_TOOLS.includes(t) && a === "crossfire" },
  { id: "build.forge-skill", phase: "build", test: (t, a) => SKILL_TOOLS.includes(t) && a === "forge" },
];

const V2_COMMAND_RULES = [
  { id: "verify.test-cmd", phase: "verify", test: (t, a) => isShell(t) && cmdIs(a, V2_TEST_HEADS) },
  { id: "handoff.publish-cmd", phase: "handoff", test: (t, a) => isShell(t) && cmdIs(a, V2_PUBLISH_HEADS) },
  { id: "build.change-cmd", phase: "build", test: (t, a) => isShell(t) && cmdIs(a, V2_CHANGE_HEADS) },
  { id: "scout.read-cmd", phase: "scout", test: (t, a) => isShell(t) && cmdIs(a, V2_READ_HEADS) },
  { id: "handoff.notify", phase: "handoff", test: (t) => t === "mcp__curia__notify" },
];

const V3_COMMAND_RULES = [
  {
    id: "v3.chain-cmd",
    phase: null, // phase comes from the winning segment
    test: (t, a) => (isShell(t) ? v3Shell(a) : null),
  },
];

const UNKNOWN_RULES = [
  { id: "unknown.shell", phase: "unknown", test: (t) => isShell(t) },
  { id: "unknown.agent", phase: "unknown", test: (t) => AGENT_TOOLS.includes(t) },
  { id: "unknown.tool", phase: "unknown", test: () => true },
];

function spliceForge(rules) {
  // forge markers go right after verify.review-skill, before scout.skill-load
  const i = rules.findIndex((r) => r.id === "verify.review-skill") + 1;
  return rules.slice(0, i).concat(FORGE_RULES, rules.slice(i));
}

const RULESETS = {
  "phase-rules/v1": MARKER_RULES.concat(UNKNOWN_RULES),
  "phase-rules/v2": spliceForge(MARKER_RULES).concat(V2_COMMAND_RULES, UNKNOWN_RULES),
  "phase-rules/v3-draft": spliceForge(MARKER_RULES).concat(
    V2_COMMAND_RULES.slice(0, 4),
    V3_COMMAND_RULES,
    [V2_COMMAND_RULES[4]],
    UNKNOWN_RULES,
  ),
};

function classify(tool, arg, version) {
  for (const r of RULESETS[version]) {
    const res = r.test(tool, arg || "");
    if (res === null || res === false || res === undefined) continue;
    if (r.phase === null) {
      if (typeof res === "string") return { rule: r.id + "." + res, phase: res };
      continue;
    }
    return { rule: r.id, phase: r.phase };
  }
  return { rule: "unknown.tool", phase: "unknown" };
}

// ---------------------------------------------------------------------------
// Time attribution: each event owns the gap to the next event, capped at 300s.
// Tail 60s. A blocking handoff call splits its overflow into a waiting slice.
// ---------------------------------------------------------------------------

const CAP_SEC = 300;
const TAIL_SEC = 60;
const PHASES = ["scout", "build", "verify", "handoff", "unknown"];

function deriveSession(events, version) {
  const by = { scout: 0, build: 0, verify: 0, handoff: 0, unknown: 0 };
  const evBy = { scout: 0, build: 0, verify: 0, handoff: 0, unknown: 0 };
  const ruleTally = {};
  let waiting = 0;
  let idle = 0;
  for (let i = 0; i < events.length; i++) {
    const [ts, tool, arg] = events[i];
    const gap = i + 1 < events.length ? (events[i + 1][0] - ts) / 1000 : TAIL_SEC;
    const own = Math.min(gap, CAP_SEC);
    const { rule, phase } = classify(tool, arg, version);
    ruleTally[rule] = (ruleTally[rule] || 0) + 1;
    by[phase] += own;
    evBy[phase] += 1;
    if (HANDOFF_TOOLS.includes(tool)) waiting += gap - own;
    else idle += gap - own;
  }
  return { phaseSec: by, phaseEvents: evBy, waitingSec: waiting, idleSec: idle, ruleTally };
}

// ---------------------------------------------------------------------------
// Privacy reducers
// ---------------------------------------------------------------------------

function hash8(s) {
  return createHash("sha256").update(String(s)).digest("hex").slice(0, 8);
}

// A single sanitized first word. Paths reduce to a basename.
function cmdHead(arg) {
  const seg = chainSegments(arg)[0] || arg;
  let head = (seg.trim().split(/\s+/)[0] || "").slice(0, 40);
  if (head.includes("/")) head = head.split("/").filter(Boolean).pop() || "";
  head = head.replace(/[^A-Za-z0-9_.:=-]/g, "");
  return head.slice(0, 24) || "(empty)";
}

// ---------------------------------------------------------------------------
// Harness readers. Each yields sessions: { id, startMs, events: [[ts, tool, arg]] }
// ---------------------------------------------------------------------------

function walk(dir, out, depth = 0) {
  if (depth > 6) return out;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, depth + 1);
    else out.push(p);
  }
  return out;
}

function readJsonl(file, onRec) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      onRec(JSON.parse(line));
    } catch {
      /* skip broken line */
    }
  }
}

function readClaude() {
  const roots = [];
  if (process.env.CLAUDE_CONFIG_DIR) roots.push(path.join(process.env.CLAUDE_CONFIG_DIR, "projects"));
  roots.push(path.join(homedir(), ".claude", "projects"));
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config");
  roots.push(path.join(xdg, "claude", "projects"));
  const files = [];
  for (const r of [...new Set(roots)]) if (existsSync(r)) walk(r, files);
  const sessions = new Map();
  const seenCalls = new Set();
  for (const f of files.filter((f) => f.endsWith(".jsonl"))) {
    readJsonl(f, (rec) => {
      if (rec.type !== "assistant" || !rec.message) return;
      const ts = Date.parse(rec.timestamp || "");
      if (!Number.isFinite(ts)) return;
      const sid = rec.sessionId || path.basename(f, ".jsonl");
      const content = Array.isArray(rec.message.content) ? rec.message.content : [];
      for (const b of content) {
        if (!b || b.type !== "tool_use" || !b.name) continue;
        if (b.id) {
          if (seenCalls.has(b.id)) continue;
          seenCalls.add(b.id);
        }
        const input = b.input || {};
        let arg = "";
        if (b.name === "Skill") arg = String(input.skill || "");
        else if (b.name === "Agent" || b.name === "Task") arg = String(input.subagent_type || "");
        else if (b.name === "Bash") arg = String(input.command || "");
        const name = b.name === "Task" ? "Agent" : b.name;
        if (!sessions.has(sid)) sessions.set(sid, []);
        sessions.get(sid).push([ts, name, arg]);
      }
    });
  }
  return finishSessions(sessions);
}

function readCodex() {
  const root = path.join(process.env.CODEX_HOME || path.join(homedir(), ".codex"), "sessions");
  if (!existsSync(root)) return [];
  const files = walk(root, []).filter((f) => f.endsWith(".jsonl"));
  const sessions = new Map();
  for (const f of files) {
    let sid = path.basename(f, ".jsonl");
    const events = [];
    readJsonl(f, (rec) => {
      const ts = Date.parse(rec.timestamp || "");
      const payload = rec.payload || {};
      if (rec.type === "session_meta" && (payload.id || payload.session_id)) {
        sid = payload.id || payload.session_id;
        return;
      }
      if (rec.type !== "response_item" || !Number.isFinite(ts)) return;
      const t = payload.type;
      if (t === "function_call" || t === "custom_tool_call") {
        let name = String(payload.name || "");
        let arg = "";
        if (name === "shell" || name === "container.exec" || name === "local_shell") {
          name = "shell";
          arg = codexCommand(payload.arguments);
        }
        events.push([ts, name, arg]);
      } else if (t === "local_shell_call") {
        const cmd = payload.action && Array.isArray(payload.action.command) ? payload.action.command : [];
        events.push([ts, "shell", codexJoin(cmd)]);
      } else if (t === "web_search_call") {
        events.push([ts, "web_search", ""]);
      } else if (t === "tool_search_call") {
        events.push([ts, "tool_search", ""]);
      }
    });
    if (events.length) {
      if (!sessions.has(sid)) sessions.set(sid, []);
      sessions.get(sid).push(...events);
    }
  }
  return finishSessions(sessions);
}

function codexCommand(argsRaw) {
  try {
    const a = JSON.parse(String(argsRaw || "{}"));
    if (Array.isArray(a.command)) return codexJoin(a.command);
    if (typeof a.command === "string") return a.command;
  } catch {
    /* fall through */
  }
  return "";
}
function codexJoin(cmd) {
  // ["bash","-lc","<real command>"] -> the real command
  if (cmd.length >= 3 && /^(bash|sh|zsh)$/.test(cmd[0]) && /^-l?c$/.test(cmd[1])) return cmd.slice(2).join(" ");
  return cmd.join(" ");
}

async function readOpencode() {
  let open = null;
  try {
    const mod = await import("node:sqlite");
    if (typeof mod.DatabaseSync === "function") open = (f) => new mod.DatabaseSync(f, { readOnly: true });
  } catch {
    /* no sqlite on this node */
  }
  if (!open) return { sessions: [], note: "skipped: node:sqlite unavailable (needs Node 22.5+)" };
  const base = process.env.XDG_DATA_HOME || path.join(homedir(), ".local", "share");
  const root = path.join(base, "opencode");
  if (!existsSync(root)) return { sessions: [], note: null };
  const dbs = walk(root, []).filter((f) => {
    const b = path.basename(f);
    return b === "opencode.db" || /^opencode-[^/]+\.db$/.test(b);
  });
  const sessions = new Map();
  const seen = new Set();
  for (const file of dbs) {
    let db;
    try {
      db = open(file);
    } catch {
      continue;
    }
    try {
      const cols = db.prepare("pragma table_info(part)").all().map((c) => c.name);
      const sidCol = cols.includes("session_id") ? "session_id" : cols.includes("session") ? "session" : null;
      const rows = db
        .prepare(
          `select ${sidCol ? sidCol + " as sid," : "'' as sid,"} time_created,
            json_extract(data, '$.tool') as tool,
            json_extract(data, '$.callID') as call_id,
            json_extract(data, '$.state.input.name') as input_name,
            json_extract(data, '$.state.input.subagent_type') as subagent_type,
            json_extract(data, '$.state.input.command') as command
          from part where json_extract(data, '$.type') = 'tool'`,
        )
        .all();
      for (const r of rows) {
        const key = String(r.call_id || "");
        if (key) {
          if (seen.has(key)) continue;
          seen.add(key);
        }
        const ts = Number(r.time_created);
        if (!Number.isFinite(ts) || ts <= 0) continue;
        const tool = String(r.tool || "").toLowerCase();
        let arg = "";
        if (tool === "skill") arg = String(r.input_name || "");
        else if (tool === "task") arg = String(r.subagent_type || "");
        else if (tool === "bash") arg = String(r.command || "");
        const sid = String(r.sid || path.basename(file));
        if (!sessions.has(sid)) sessions.set(sid, []);
        sessions.get(sid).push([ts < 1e12 ? ts * 1000 : ts, tool, arg]);
      }
    } catch {
      /* schema mismatch: skip this db */
    }
  }
  return { sessions: finishSessions(sessions), note: null };
}

function readPi() {
  const root = path.join(process.env.PI_CODING_AGENT_DIR || path.join(homedir(), ".pi", "agent"), "sessions");
  if (!existsSync(root)) return [];
  const files = walk(root, []).filter((f) => f.endsWith(".jsonl"));
  const sessions = new Map();
  const seen = new Set();
  for (const f of files) {
    let sid = path.basename(f, ".jsonl");
    readJsonl(f, (rec) => {
      if (rec.type === "session" && rec.id) {
        sid = String(rec.id);
        return;
      }
      const msg = rec.message || {};
      const ts = Date.parse(rec.timestamp || "") || Number(msg.timestamp) || NaN;
      if (!Number.isFinite(ts)) return;
      const content = Array.isArray(msg.content) ? msg.content : [];
      for (const b of content) {
        if (!b || b.type !== "toolCall" || !b.name) continue;
        if (b.id) {
          if (seen.has(b.id)) continue;
          seen.add(b.id);
        }
        const args = b.arguments || b.args || {};
        const arg = typeof args.command === "string" ? args.command : "";
        if (!sessions.has(sid)) sessions.set(sid, []);
        sessions.get(sid).push([ts, String(b.name).toLowerCase(), arg]);
      }
    });
  }
  return finishSessions(sessions);
}

function finishSessions(map) {
  const out = [];
  for (const [id, events] of map) {
    if (!events.length) continue;
    events.sort((a, b) => a[0] - b[0]);
    out.push({ id, startMs: events[0][0], events });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Aggregate and report
// ---------------------------------------------------------------------------

const VERSIONS = Object.keys(RULESETS);

function aggregate(harness, sessions, windowMs, nowMs) {
  const kept = sessions.filter((s) => s.startMs >= nowMs - windowMs && s.events.length >= 3);
  const out = { sessions: [], unknownHeads: {}, skillCalls: {}, droppedSessions: sessions.length - kept.length };
  for (const s of kept) {
    const wallSec = (s.events[s.events.length - 1][0] - s.events[0][0]) / 1000 + TAIL_SEC;
    const row = {
      id: hash8(s.id),
      day: new Date(s.startMs).toISOString().slice(0, 10),
      startHour: new Date(s.startMs).getUTCHours(),
      events: s.events.length,
      wallMin: Math.round(wallSec / 60),
    };
    for (const v of VERSIONS) {
      const d = deriveSession(s.events, v);
      row[v] = {
        phaseSec: Object.fromEntries(PHASES.map((p) => [p, Math.round(d.phaseSec[p])])),
        phaseEvents: d.phaseEvents,
        waitingSec: Math.round(d.waitingSec),
        idleSec: Math.round(d.idleSec),
        ruleTally: d.ruleTally,
      };
    }
    out.sessions.push(row);
    // work-order tallies from the strongest DECIDED version (v2)
    for (const [, tool, arg] of s.events) {
      const { phase } = classify(tool, arg, "phase-rules/v2");
      if (phase === "unknown" && isShell(tool) && arg) {
        const h = cmdHead(arg);
        out.unknownHeads[h] = (out.unknownHeads[h] || 0) + 1;
      }
      if (SKILL_TOOLS.includes(tool) && arg) out.skillCalls[arg] = (out.skillCalls[arg] || 0) + 1;
    }
  }
  // keep top 25 heads only
  out.unknownHeads = Object.fromEntries(
    Object.entries(out.unknownHeads).sort((a, b) => b[1] - a[1]).slice(0, 25),
  );
  return out;
}

function totals(harnesses) {
  const t = {};
  for (const v of VERSIONS) {
    const phaseSec = Object.fromEntries(PHASES.map((p) => [p, 0]));
    let waiting = 0;
    let sessions = 0;
    for (const h of Object.values(harnesses)) {
      for (const s of h.sessions) {
        sessions++;
        for (const p of PHASES) phaseSec[p] += s[v].phaseSec[p];
        waiting += s[v].waitingSec;
      }
    }
    const attributed = PHASES.reduce((a, p) => a + phaseSec[p], 0);
    t[v] = {
      sessions,
      phaseSec,
      waitingSec: waiting,
      attributedSec: attributed,
      unknownShare: attributed ? +(phaseSec.unknown / attributed).toFixed(4) : null,
    };
  }
  return t;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const daysIx = argv.indexOf("--days");
const days = daysIx >= 0 ? Number(argv[daysIx + 1]) || 90 : 90;
const windowMs = days * 86400_000;
const nowMs = Date.now();

const oc = await readOpencode();
const raw = {
  "claude-code": readClaude(),
  codex: readCodex(),
  opencode: oc.sessions,
  pi: readPi(),
};

const harnesses = {};
for (const [name, sessions] of Object.entries(raw)) {
  const agg = aggregate(name, sessions, windowMs, nowMs);
  if (agg.sessions.length || agg.droppedSessions) harnesses[name] = agg;
}

const result = {
  meta: {
    prototype: "alp82/aistack#196",
    extractor: "phase-extraction/0.1",
    generated: new Date(nowMs).toISOString(),
    windowDays: days,
    node: process.version,
    ruleVersions: VERSIONS,
    capSec: CAP_SEC,
    tailSec: TAIL_SEC,
    notes: [oc.note].filter(Boolean),
  },
  harnesses,
  totals: totals(harnesses),
};

if (asJson) {
  console.log(JSON.stringify(result));
} else {
  const t = result.totals;
  console.log(`phase extraction - ${days}d window - ${Object.keys(harnesses).join(", ") || "no harness data found"}`);
  for (const [name, h] of Object.entries(harnesses)) {
    console.log(`\n${name}: ${h.sessions.length} sessions (${h.droppedSessions} outside window or under 3 events)`);
  }
  for (const v of VERSIONS) {
    if (!t[v] || t[v].sessions === 0) continue;
    const ps = t[v].phaseSec;
    const att = t[v].attributedSec || 1;
    const line = PHASES.map((p) => `${p} ${Math.round((100 * ps[p]) / att)}%`).join("  ");
    console.log(`\n${v}: ${line}`);
  }
  console.log("\nRun with --json and paste the output back into the ticket thread.");
  console.log("The JSON holds aggregates only: no prompts, no full commands, no paths, no session ids.");
}
