// PROTOTYPE — throwaway. Wayfinder ticket #32 (map #29).
//
// QUESTION THIS ANSWERS
// Does deterministic extraction of the P0 capture set (inventory, usage-share,
// recency, cost) from real local Claude Code transcripts hold up — and what do
// the numbers actually look like on the owner's own history?
//
// This module is the part worth keeping: pure, no I/O, no console. It takes
// already-parsed JSONL records one at a time and folds them into an aggregate.
// The scanner and the report renderer around it are throwaway shell.
//
// Field semantics come from docs/research/claude-code-transcripts-2026-07.md
// (issue #30). Every field is treated as untrusted and optional: records arrive
// as `unknown` and are narrowed here, matching how the rest of this repo
// handles external JSON.
//
// THE LOAD-BEARING SUBTLETY — read before touching `foldUsage`.
// Claude Code writes ONE API response as SEVERAL JSONL records: each carries a
// distinct content block (thinking, then tool_use, then tool_use…) and a
// *cumulative* `usage` snapshot that grows with each record. Measured on a real
// corpus: 20,073 of 44,280 response groups have differing usage across their
// records, 20,071 of them monotonically increasing.
//
// So there are three wrong ways to count and one right way:
//   - sum every record          → 75.9M output tokens (≈2x over)
//   - keep the first record     → 19.1M output tokens (≈2.1x under)
//   - keep the last record      → 40.6M  (right, but relies on file order)
//   - keep the largest total    → 40.6M  (right, order-independent) ← this
// Keeping the largest total is also ccusage's documented rule
// (`should_replace_deduped_entry`).

import {
  type TokenCounts,
  apiEquivalentCost,
  normalizeModel,
} from "./pricing";

// ---------------------------------------------------------------------------
// Narrowing helpers — records are untrusted external JSON
// ---------------------------------------------------------------------------

type Obj = Record<string, unknown>;

const asObj = (v: unknown): Obj | null =>
  typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Obj) : null;
const asStr = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;
const asNum = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * Every name that becomes a Map key or leaves this module goes through here.
 *
 * These are user-chosen strings (skill names, MCP servers, subagent types,
 * slash commands, model ids) and a hostile one is a real vector: control
 * characters move a terminal cursor, and an unterminated bidi override
 * (U+202E) reorders the rest of the rendered line — including the count and
 * percentage printed beside the name. Both survive `JSON.stringify`, which
 * escapes C0 but not bidi. See CVE-2021-42574 ("Trojan Source").
 *
 * Sanitizing at ingest rather than at print means the guarantee travels with
 * the module: `finalize()`'s output is safe for any consumer, not just the
 * renderer that happens to sit in front of it today.
 */
const NAME_UNSAFE_RE =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
  /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;
const NAME_MAX = 64;

export function cleanName(s: string): string {
  const stripped = s.replace(NAME_UNSAFE_RE, "�").trim();
  if (stripped.length === 0) return "(unnamed)";
  return stripped.length > NAME_MAX
    ? `${stripped.slice(0, NAME_MAX - 1)}…`
    : stripped;
}

/** `asStr` for anything that will be used as a name. */
const asName = (v: unknown): string | null => {
  const s = asStr(v);
  return s === null ? null : cleanName(s);
};

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

export type ModelUsage = TokenCounts & { messages: number };

/** One API response's full contribution, kept so it can be un-applied on replace. */
type Contribution = {
  entries: Array<{ modelKey: string; counts: TokenCounts }>;
  total: number;
  sidechain: boolean;
  webSearch: number;
  webFetch: number;
  /** Non-advisor iteration types seen on this response, for the diagnostics line. */
  iterationTypes: Array<[string, number]>;
};

type SeenEntry = { requestId: string | null; contribution: Contribution };

export type Aggregate = {
  // provenance / scan health
  files: number;
  lines: number;
  parseErrors: number;
  records: number;
  assistantRecords: number;
  /** Distinct API responses actually counted. */
  distinctResponses: number;
  /** Extra records of a response already counted (same message.id AND requestId). */
  continuationsFolded: number;
  /** Same message.id under a NEW requestId — a genuine replay (e.g. /btw sidechain). */
  realReplaysFolded: number;
  /** Times a later record superseded an earlier one because it carried a larger total. */
  supersededByLarger: number;
  /** Assistant records with no message.id — counted without dedup protection. */
  unkeyedResponses: number;
  syntheticRecords: number;
  syntheticTokens: number;
  toolBlocksWithoutId: number;
  projectDirs: Set<string>; // held only to count — names never leave this module
  ccVersions: Set<string>;
  unknownIterationTypes: Map<string, number>;

  // tokens
  byModel: Map<string, ModelUsage>;
  sidechainTokens: number;
  mainTokens: number;

  // activity
  sessions: Set<string>;
  activeDays: Set<string>; // UTC YYYY-MM-DD
  firstTs: number | null;
  lastTs: number | null;

  // tools / skills / mcp / agents
  toolCalls: Map<string, number>;
  skillCalls: Map<string, number>;
  mcpServerCalls: Map<string, number>;
  mcpToolCalls: Map<string, number>;
  subagentCalls: Map<string, number>;
  slashCommands: Map<string, number>;
  toolCallDedup: Set<string>;

  // content-block shape
  thinkingBlocks: number;
  textBlocks: number;
  webSearchRequests: number;
  webFetchRequests: number;

  // dedup bookkeeping — keyed by message.id alone, so it covers BOTH the
  // continuation case (same requestId) and the replay case (new requestId).
  seen: Map<string, SeenEntry>;
};

export function createAggregate(): Aggregate {
  return {
    files: 0,
    lines: 0,
    parseErrors: 0,
    records: 0,
    assistantRecords: 0,
    distinctResponses: 0,
    continuationsFolded: 0,
    realReplaysFolded: 0,
    supersededByLarger: 0,
    unkeyedResponses: 0,
    syntheticRecords: 0,
    syntheticTokens: 0,
    toolBlocksWithoutId: 0,
    projectDirs: new Set(),
    ccVersions: new Set(),
    unknownIterationTypes: new Map(),
    byModel: new Map(),
    sidechainTokens: 0,
    mainTokens: 0,
    sessions: new Set(),
    activeDays: new Set(),
    firstTs: null,
    lastTs: null,
    toolCalls: new Map(),
    skillCalls: new Map(),
    mcpServerCalls: new Map(),
    mcpToolCalls: new Map(),
    subagentCalls: new Map(),
    slashCommands: new Map(),
    toolCallDedup: new Set(),
    thinkingBlocks: 0,
    textBlocks: 0,
    webSearchRequests: 0,
    webFetchRequests: 0,
    seen: new Map(),
  };
}

const bump = (m: Map<string, number>, k: string, n = 1) =>
  m.set(k, (m.get(k) ?? 0) + n);

function emptyUsage(): ModelUsage {
  return {
    input: 0,
    output: 0,
    cacheWrite5m: 0,
    cacheWrite1h: 0,
    cacheWriteUnsplit: 0,
    cacheRead: 0,
    messages: 0,
  };
}

const countsTotal = (t: TokenCounts): number =>
  t.input +
  t.output +
  t.cacheWrite5m +
  t.cacheWrite1h +
  t.cacheWriteUnsplit +
  t.cacheRead;

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export type IngestContext = { projectDir: string };

/** Fold one parsed JSONL record into the aggregate. */
export function ingestRecord(
  agg: Aggregate,
  raw: unknown,
  ctx: IngestContext,
): void {
  const rec = asObj(raw);
  if (!rec) return;

  agg.records++;
  agg.projectDirs.add(ctx.projectDir);

  const version = asStr(rec.version);
  if (version) agg.ccVersions.add(cleanName(version));
  const sessionId = asStr(rec.sessionId);
  if (sessionId) agg.sessions.add(sessionId);

  const timestamp = asStr(rec.timestamp);
  if (timestamp) {
    const ts = Date.parse(timestamp);
    if (!Number.isNaN(ts)) {
      agg.activeDays.add(timestamp.slice(0, 10));
      agg.firstTs = agg.firstTs === null ? ts : Math.min(agg.firstTs, ts);
      agg.lastTs = agg.lastTs === null ? ts : Math.max(agg.lastTs, ts);
    }
  }

  const type = asStr(rec.type);
  if (type === "assistant") ingestAssistant(agg, rec);
  else if (type === "user") ingestUser(agg, rec);
}

function ingestAssistant(agg: Aggregate, rec: Obj): void {
  agg.assistantRecords++;
  const msg = asObj(rec.message);
  if (!msg) return;

  const messageId = asStr(msg.id);
  const requestId = asStr(rec.requestId);
  const existing = messageId === null ? undefined : agg.seen.get(messageId);
  // A genuine replay is the same message.id under a NEW requestId. Its records
  // repeat content already counted; a continuation's records do not.
  const isReplay = existing !== undefined && existing.requestId !== requestId;

  // Content blocks are counted per RECORD, deliberately outside the token
  // fold: the records of ONE response carry disjoint blocks (verified across
  // 44,478 groups — zero overlap), so folding them would drop real blocks.
  // Replays are the exception and must be skipped, because `tool_use` has
  // `block.id` to dedup on but thinking/text blocks have no identity at all.
  if (!isReplay) ingestContentBlocks(agg, msg.content);

  const usage = asObj(msg.usage);
  if (!usage) return;

  const model = asName(msg.model) ?? "(unknown)";
  // `<synthetic>` is the harness's own pseudo-model for records it generates
  // itself. Not a tool the user chose — excluded from inventory and pricing,
  // but its tokens are surfaced rather than silently dropped.
  if (model.startsWith("<")) {
    agg.syntheticRecords++;
    agg.syntheticTokens += countsTotal(readCounts(usage));
    return;
  }

  const sidechain = rec.isSidechain === true;
  const contribution = buildContribution(usage, model, sidechain);

  if (messageId === null) {
    // No dedup key available — count it and record that we were unprotected.
    agg.unkeyedResponses++;
    acceptContribution(agg, contribution);
    return;
  }

  if (existing === undefined) {
    agg.distinctResponses++;
    acceptContribution(agg, contribution);
    agg.seen.set(messageId, { requestId, contribution });
    return;
  }

  if (isReplay) agg.realReplaysFolded++;
  else agg.continuationsFolded++;

  if (!supersedes(contribution, existing.contribution)) return;

  agg.supersededByLarger++;
  applyContribution(agg, existing.contribution, -1);
  retractIterationTypes(agg, existing.contribution);
  acceptContribution(agg, contribution);
  // Keep the FIRST-seen requestId, not this record's. If a genuine replay wins
  // on tokens, overwriting it would make the replay's own later records compare
  // equal to the stored id, read as continuations, and get their thinking/text
  // blocks counted a second time — reopening exactly what the `isReplay` gate
  // above exists to close. (tool_use survives either way via `block.id`.)
  agg.seen.set(messageId, { requestId: existing.requestId, contribution });
}

/**
 * Apply a contribution and tally its diagnostics. Paired with the `-1` +
 * `retractIterationTypes` path so the iteration-type census stays per-response
 * rather than per-record — it used to be bumped while merely *building* a
 * contribution, which counted every folded continuation too.
 */
function acceptContribution(agg: Aggregate, c: Contribution): void {
  applyContribution(agg, c, +1);
  for (const [type, count] of c.iterationTypes) bump(agg.unknownIterationTypes, type, count);
}

function retractIterationTypes(agg: Aggregate, c: Contribution): void {
  for (const [type, count] of c.iterationTypes) bump(agg.unknownIterationTypes, type, -count);
}

/**
 * ccusage's collision rule: a non-sidechain copy beats a sidechain one;
 * otherwise the larger token total wins. Order-independent by construction,
 * so the result does not depend on filesystem traversal order.
 */
function supersedes(next: Contribution, prev: Contribution): boolean {
  if (prev.sidechain !== next.sidechain) return prev.sidechain && !next.sidechain;
  return next.total > prev.total;
}

function readCounts(usage: Obj): TokenCounts {
  const t: TokenCounts = {
    input: asNum(usage.input_tokens),
    output: asNum(usage.output_tokens),
    cacheWrite5m: 0,
    cacheWrite1h: 0,
    cacheWriteUnsplit: 0,
    cacheRead: asNum(usage.cache_read_input_tokens),
  };
  const cacheWriteTotal = asNum(usage.cache_creation_input_tokens);
  const cc = asObj(usage.cache_creation);
  if (cc) {
    t.cacheWrite5m = asNum(cc.ephemeral_5m_input_tokens);
    t.cacheWrite1h = asNum(cc.ephemeral_1h_input_tokens);
    const residual = cacheWriteTotal - (t.cacheWrite5m + t.cacheWrite1h);
    if (residual > 0) t.cacheWriteUnsplit = residual;
  } else {
    t.cacheWriteUnsplit = cacheWriteTotal;
  }
  return t;
}

function buildContribution(
  usage: Obj,
  model: string,
  sidechain: boolean,
): Contribution {
  const speed = asStr(usage.speed) ?? "standard";
  const modelKey = normalizeModel(speed === "fast" ? `${model}#fast` : model);
  const counts = readCounts(usage);

  const entries = [{ modelKey, counts }];
  const iterationTypes = new Map<string, number>();

  // Advisor iterations are priced separately under their own model (ccusage).
  // Other iteration types mirror the top-level usage exactly — verified on a
  // real corpus (2,650,746,126 tokens both ways across 19,271 records) — so
  // adding them would double-bill. They are counted for visibility instead.
  for (const rawIt of asArr(usage.iterations)) {
    const it = asObj(rawIt);
    if (!it) continue;
    const itType = asName(it.type) ?? "(untyped)";
    if (itType === "advisor_message") {
      const itModel = asName(it.model);
      entries.push({
        modelKey: itModel ? normalizeModel(itModel) : modelKey,
        counts: readCounts(it),
      });
    } else {
      bump(iterationTypes, itType);
    }
  }

  const serverTools = asObj(usage.server_tool_use);
  return {
    entries,
    total: entries.reduce((a, e) => a + countsTotal(e.counts), 0),
    sidechain,
    webSearch: serverTools ? asNum(serverTools.web_search_requests) : 0,
    webFetch: serverTools ? asNum(serverTools.web_fetch_requests) : 0,
    iterationTypes: [...iterationTypes],
  };
}

/** Add (sign +1) or remove (sign -1) a response's contribution from the totals. */
function applyContribution(
  agg: Aggregate,
  c: Contribution,
  sign: 1 | -1,
): void {
  c.entries.forEach(({ modelKey, counts }, i) => {
    let m = agg.byModel.get(modelKey);
    if (!m) {
      m = emptyUsage();
      agg.byModel.set(modelKey, m);
    }
    // One response is one message, even when an advisor iteration prices it
    // under a second model — counting per entry would inflate the response
    // total past distinctResponses.
    if (i === 0) m.messages += sign;
    m.input += sign * counts.input;
    m.output += sign * counts.output;
    m.cacheWrite5m += sign * counts.cacheWrite5m;
    m.cacheWrite1h += sign * counts.cacheWrite1h;
    m.cacheWriteUnsplit += sign * counts.cacheWriteUnsplit;
    m.cacheRead += sign * counts.cacheRead;
  });
  if (c.sidechain) agg.sidechainTokens += sign * c.total;
  else agg.mainTokens += sign * c.total;
  agg.webSearchRequests += sign * c.webSearch;
  agg.webFetchRequests += sign * c.webFetch;
}

function ingestContentBlocks(agg: Aggregate, content: unknown): void {
  for (const rawBlock of asArr(content)) {
    const block = asObj(rawBlock);
    if (!block) continue;
    const type = asStr(block.type);
    if (type === "thinking") agg.thinkingBlocks++;
    else if (type === "text") agg.textBlocks++;
    else if (type === "tool_use") ingestToolUse(agg, block);
  }
}

function ingestToolUse(agg: Aggregate, block: Obj): void {
  const name = asName(block.name);
  if (!name) return;

  // `toolu_…` block ids are globally unique, which makes this key both
  // collision-proof and replay-proof without a record-level prefix. A block
  // with no id is skipped rather than folded under a name-only key, which
  // would silently collapse every call to that tool into one.
  const blockId = asStr(block.id);
  if (!blockId) {
    agg.toolBlocksWithoutId++;
    return;
  }
  if (agg.toolCallDedup.has(blockId)) return;
  agg.toolCallDedup.add(blockId);

  const input = asObj(block.input) ?? {};

  if (name.startsWith("mcp__")) {
    const parts = name.slice("mcp__".length).split("__");
    bump(agg.mcpServerCalls, parts[0] || "(unknown)");
    bump(agg.mcpToolCalls, name);
    return;
  }
  if (name === "Skill") {
    bump(agg.skillCalls, asName(input.skill) ?? "(unnamed)");
    bump(agg.toolCalls, "Skill");
    return;
  }
  // `Task` is the pre-rename spelling of `Agent`.
  if (name === "Agent" || name === "Task") {
    bump(agg.subagentCalls, asName(input.subagent_type) ?? "(default)");
    bump(agg.toolCalls, "Agent");
    return;
  }
  bump(agg.toolCalls, name);
}

const SLASH_RE = /<command-name>\/?([^<\n\r]{1,64})<\/command-name>/g;

function ingestUser(agg: Aggregate, rec: Obj): void {
  const msg = asObj(rec.message);
  if (!msg) return;
  const content = msg.content;

  let text = "";
  if (typeof content === "string") text = content;
  else {
    for (const rawBlock of asArr(content)) {
      const block = asObj(rawBlock);
      if (!block) continue;
      if (asStr(block.type) === "text") text += asStr(block.text) ?? "";
    }
  }
  if (!text.includes("<command-name>")) return;

  SLASH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SLASH_RE.exec(text)) !== null) bump(agg.slashCommands, cleanName(m[1]));
}

// ---------------------------------------------------------------------------
// Finalize — the shape a publish payload would be derived from
// ---------------------------------------------------------------------------

export type ModelRow = {
  model: string;
  tokens: TokenCounts;
  totalTokens: number;
  messages: number;
  share: number;
  costUSD: number | null; // null = no pinned price
};

export type Finalized = {
  models: ModelRow[];
  totalTokens: number;
  totalCostUSD: number;
  unpricedModels: string[];
  unpricedTokens: number;
  cacheHitShare: number;
  sidechainShare: number;
  activeDays: number;
  firstTs: number | null;
  lastTs: number | null;
  activeDaysLast7: number;
  activeDaysLast30: number;
  sessions: number;
  projects: number;
  tools: Array<[string, number]>;
  skills: Array<[string, number]>;
  mcpServers: Array<[string, number]>;
  subagents: Array<[string, number]>;
  slashCommands: Array<[string, number]>;
  totalToolCalls: number;
};

function buildModelRows(agg: Aggregate): {
  rows: ModelRow[];
  totalTokens: number;
  totalCostUSD: number;
  unpricedModels: string[];
  unpricedTokens: number;
} {
  const rows: ModelRow[] = [];
  let totalTokens = 0;
  let totalCostUSD = 0;
  const unpricedModels: string[] = [];
  let unpricedTokens = 0;

  for (const [model, u] of agg.byModel) {
    const tokens: TokenCounts = {
      input: u.input,
      output: u.output,
      cacheWrite5m: u.cacheWrite5m,
      cacheWrite1h: u.cacheWrite1h,
      cacheWriteUnsplit: u.cacheWriteUnsplit,
      cacheRead: u.cacheRead,
    };
    const sum = countsTotal(tokens);
    totalTokens += sum;
    const costUSD = apiEquivalentCost(model, tokens);
    if (costUSD === null) {
      unpricedModels.push(model);
      unpricedTokens += sum;
    } else {
      totalCostUSD += costUSD;
    }
    rows.push({
      model,
      tokens,
      totalTokens: sum,
      messages: u.messages,
      share: 0,
      costUSD,
    });
  }
  for (const r of rows) r.share = totalTokens ? r.totalTokens / totalTokens : 0;
  rows.sort((a, b) => b.totalTokens - a.totalTokens);
  return { rows, totalTokens, totalCostUSD, unpricedModels, unpricedTokens };
}

function computeCacheHitShare(rows: ModelRow[]): number {
  let cacheRead = 0;
  let inputClass = 0;
  for (const r of rows) {
    cacheRead += r.tokens.cacheRead;
    inputClass +=
      r.tokens.input +
      r.tokens.cacheRead +
      r.tokens.cacheWrite5m +
      r.tokens.cacheWrite1h +
      r.tokens.cacheWriteUnsplit;
  }
  return inputClass ? cacheRead / inputClass : 0;
}

/**
 * Count active days inside a rolling window of `days` calendar days ENDING
 * today (inclusive). `days = 7` therefore spans today plus the six preceding
 * days and can never exceed 7.
 */
function countActiveDaysWithin(agg: Aggregate, now: number, days: number): number {
  const cutoff = new Date(now - (days - 1) * 86_400_000)
    .toISOString()
    .slice(0, 10);
  // Bounded above as well: a clock-skewed, imported or restored transcript
  // dated in the future would otherwise push this past `days`, printing an
  // impossible value under a heading that calls the section deterministic.
  const today = new Date(now).toISOString().slice(0, 10);
  let n = 0;
  for (const d of agg.activeDays) if (d >= cutoff && d <= today) n++;
  return n;
}

export function finalize(agg: Aggregate, now: number): Finalized {
  const { rows, totalTokens, totalCostUSD, unpricedModels, unpricedTokens } =
    buildModelRows(agg);

  const byCount = (m: Map<string, number>): Array<[string, number]> =>
    [...m.entries()].sort((a, b) => b[1] - a[1]);

  let totalToolCalls = 0;
  for (const v of agg.toolCalls.values()) totalToolCalls += v;
  for (const v of agg.mcpToolCalls.values()) totalToolCalls += v;

  const sideTotal = agg.sidechainTokens + agg.mainTokens;

  return {
    models: rows,
    totalTokens,
    totalCostUSD,
    unpricedModels,
    unpricedTokens,
    cacheHitShare: computeCacheHitShare(rows),
    sidechainShare: sideTotal ? agg.sidechainTokens / sideTotal : 0,
    activeDays: agg.activeDays.size,
    firstTs: agg.firstTs,
    lastTs: agg.lastTs,
    activeDaysLast7: countActiveDaysWithin(agg, now, 7),
    activeDaysLast30: countActiveDaysWithin(agg, now, 30),
    sessions: agg.sessions.size,
    projects: agg.projectDirs.size,
    tools: byCount(agg.toolCalls),
    skills: byCount(agg.skillCalls),
    mcpServers: byCount(agg.mcpServerCalls),
    subagents: byCount(agg.subagentCalls),
    slashCommands: byCount(agg.slashCommands),
    totalToolCalls,
  };
}
