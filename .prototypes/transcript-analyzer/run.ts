// PROTOTYPE — throwaway. Wayfinder ticket #32 (map #29).
//
//   pnpm tsx .prototypes/transcript-analyzer/run.ts               # full history
//   pnpm tsx .prototypes/transcript-analyzer/run.ts --days=30     # rolling window
//   pnpm tsx .prototypes/transcript-analyzer/run.ts --names       # reveal skill/MCP names
//   pnpm tsx .prototypes/transcript-analyzer/run.ts --show-paths  # reveal scan roots
//
// Prints only. No network, no send channel, no approve-gate, no LLM.
//
// Two things are withheld from the default output because this report gets
// copied into tickets:
//   - Absolute scan roots leak the OS username and home layout.
//   - Names of skills / MCP servers / slash commands are user-chosen strings
//     that can leak client or project names; the publish path needs an
//     allowlist decision (#30) before they travel.
// Every transcript-derived string is also stripped of control characters
// before printing: a crafted skill or command name could otherwise emit
// cursor-movement escapes and rewrite the totals an operator reads back.

import { createAggregate, finalize } from "./analyzer";
import { PRICING_TABLE_NOTES, PRICING_TABLE_VERSION } from "./pricing";
import { readStatsCache, scan, transcriptRoots } from "./scan";

const B = (s: string) => `\x1b[1m${s}\x1b[0m`;
const D = (s: string) => `\x1b[2m${s}\x1b[0m`;
const L = (s: string) => `\x1b[38;5;190m${s}\x1b[0m`;

const args = process.argv.slice(2);
const daysArg = args.find((a) => a.startsWith("--days="));
const windowDays = daysArg ? Number(daysArg.split("=")[1]) : null;
// Reject a bad --days rather than producing a plausible-looking artifact from
// it. `--days=x` is NaN (falsy) and would silently scan FULL history while
// suppressing the recency figures with a false "scan window shorter" note;
// `--days=-3` skips every file by mtime and prints a complete $0.00 report
// labelled `rolling_-3_days`. These numbers get pasted into tickets — a typo
// must fail loudly, not publish quietly.
if (daysArg && !(Number.isInteger(windowDays) && (windowDays as number) > 0)) {
  console.error(
    `Invalid ${daysArg} — --days must be a positive integer (e.g. --days=30).`,
  );
  process.exit(1);
}
const showNames = args.includes("--names");
const showPaths = args.includes("--show-paths");

/**
 * Neutralize anything that came out of a transcript before it reaches a
 * terminal. Control characters (ESC, CR, BS) can move the cursor and overwrite
 * already-printed numbers; OSC sequences can reach the clipboard.
 */
const safe = (s: string, max = 60): string => {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
  const stripped = s.replace(/[\u0000-\u001f\u007f-\u009f]/g, "\uFFFD");
  return stripped.length > max ? `${stripped.slice(0, max - 1)}…` : stripped;
};

const nf = new Intl.NumberFormat("en-US");
const n = (v: number) => nf.format(Math.round(v));
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const usd = (v: number) => `$${v.toFixed(2)}`;
const day = (ts: number | null) =>
  ts === null ? "—" : new Date(ts).toISOString().slice(0, 10);

function bar(share: number, width = 24): string {
  const filled = Math.round(share * width);
  return L("█".repeat(filled)) + D("·".repeat(width - filled));
}

function section(title: string): void {
  console.log(`\n${B(title)}\n${D("─".repeat(72))}`);
}

function table(
  rows: Array<[string, number]>,
  total: number,
  limit = 12,
  mask = false,
): void {
  if (rows.length === 0) {
    console.log(D("  (none)"));
    return;
  }
  const shown = rows.slice(0, limit);
  const labels = shown.map(([k]) =>
    mask ? `${safe(k).slice(0, 2)}${"•".repeat(Math.max(1, safe(k).length - 2))}` : safe(k),
  );
  const width = Math.max(...labels.map((l) => l.length));
  shown.forEach(([, v], i) => {
    console.log(
      `  ${labels[i].padEnd(width)}  ${n(v).padStart(7)}  ${D(pct(total ? v / total : 0).padStart(6))}`,
    );
  });
  if (rows.length > limit) console.log(D(`  … and ${rows.length - limit} more`));
}

async function main(): Promise<void> {
  const now = Date.now();
  // A rolling window of N calendar days ending today, so --days=7 covers today
  // plus the six preceding days.
  const sinceMs = windowDays
    ? Date.parse(
        `${new Date(now - (windowDays - 1) * 86_400_000).toISOString().slice(0, 10)}T00:00:00Z`,
      )
    : undefined;

  console.log(B("\nLocal transcript analyzer — PROTOTYPE (ticket #32)"));
  const roots = transcriptRoots();
  console.log(
    D(showPaths ? `roots: ${roots.join(", ")}` : `roots: ${roots.length} (paths hidden — pass --show-paths)`),
  );
  console.log(
    D(windowDays ? `window: rolling ${windowDays} days` : "window: full local history"),
  );

  const agg = createAggregate();
  const t0 = performance.now();
  const scanStats = await scan(agg, {
    sinceMs,
    onProgress: (files) => process.stderr.write(`\r  scanning… ${files} files`),
  });
  const elapsed = performance.now() - t0;
  process.stderr.write("\r\x1b[K");

  const f = finalize(agg, now);

  // ---- scan health -------------------------------------------------------
  section("SCAN");
  console.log(
    `  ${n(agg.files)} files read of ${n(scanStats.filesFound)} found · ` +
      `${n(agg.lines)} lines · ${n(agg.records)} records · ${n(agg.assistantRecords)} assistant`,
  );
  if (
    scanStats.filesSkippedByMtime ||
    scanStats.filesSkippedAsDuplicate ||
    scanStats.filesUnreadable
  ) {
    console.log(
      D(
        `  skipped: ${n(scanStats.filesSkippedByMtime)} by mtime (outside window) · ` +
          `${n(scanStats.filesSkippedAsDuplicate)} as already-scanned paths · ` +
          `${n(scanStats.filesUnreadable)} unreadable`,
      ),
    );
  }
  console.log(
    `  ${D("parse errors")} ${agg.parseErrors}   ${D("elapsed")} ${(elapsed / 1000).toFixed(2)}s   ` +
      `${D("throughput")} ${n(agg.lines / (elapsed / 1000))} lines/s`,
  );
  console.log(
    `\n  ${B("Response folding")} ${D("— Claude Code writes one API response as several records")}`,
  );
  console.log(
    `  ${n(f.models.reduce((a, r) => a + r.messages, 0))} distinct responses counted ` +
      D(`(${n(agg.distinctResponses)} keyed, ${n(agg.unkeyedResponses)} unkeyed)`),
  );
  console.log(
    `  ${D("continuation records folded")} ${n(agg.continuationsFolded)} ` +
      `${D(`(${pct(agg.continuationsFolded / (agg.assistantRecords || 1))} of assistant records)`)}`,
  );
  console.log(
    `  ${D("genuine replays folded")} ${n(agg.realReplaysFolded)}   ` +
      `${D("superseded by larger snapshot")} ${n(agg.supersededByLarger)}`,
  );
  if (agg.syntheticRecords || agg.toolBlocksWithoutId) {
    console.log(
      D(
        `  excluded: ${n(agg.syntheticRecords)} <synthetic> records (${n(agg.syntheticTokens)} tokens) · ` +
          `${n(agg.toolBlocksWithoutId)} tool blocks without an id`,
      ),
    );
  }
  console.log(
    `\n  ${D("Claude Code versions seen")} ${[...agg.ccVersions].sort().map((v) => safe(v, 16)).join(", ") || "—"}`,
  );
  if ([...agg.unknownIterationTypes.values()].some((v) => v > 0)) {
    console.log(
      D(
        `  iterations[] mirroring top-level usage (not double-counted): ${[...agg.unknownIterationTypes]
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `${safe(k, 24)}×${n(v)}`)
          .join(", ")}`,
      ),
    );
  }

  // ---- recency -----------------------------------------------------------
  section("RECENCY  (deterministic, publishable as-is)");
  const daysSince = f.lastTs === null ? null : (now - f.lastTs) / 86_400_000;
  console.log(`  first activity     ${day(f.firstTs)}`);
  console.log(
    `  last activity      ${day(f.lastTs)}  ${D(
      daysSince === null ? "" : `(${daysSince < 1 ? "today" : `${daysSince.toFixed(1)}d ago`})`,
    )}`,
  );
  // A metric can only be reported when the scan actually covered its span —
  // otherwise `--days=7` would print a "30d" figure derived from 7 days of
  // data, which reads as measured and is wrong by several multiples.
  const spanCovered = (days: number) => windowDays === null || windowDays >= days;
  const recentParts = [
    spanCovered(7) ? `7d: ${f.activeDaysLast7}` : "7d: n/a",
    spanCovered(30) ? `30d: ${f.activeDaysLast30}` : "30d: n/a (scan window shorter)",
  ];
  console.log(
    `  active days        ${n(f.activeDays)}  ${D(`(${recentParts.join(" · ")})`)}`,
  );
  console.log(`  sessions           ${n(f.sessions)}`);
  console.log(
    `  projects           ${n(f.projects)}  ${D("(count only — dir names are munged paths, never published)")}`,
  );

  // ---- inventory ---------------------------------------------------------
  section("INVENTORY  (the (user, tool) atoms)");
  console.log(`  ${B("Claude Code")}  ${D(`${agg.ccVersions.size} version(s) observed`)}`);
  console.log(`  ${B("Models")}       ${f.models.length}`);
  console.log(`  ${B("Built-in tools")} ${agg.toolCalls.size}`);
  console.log(`  ${B("Skills")}       ${agg.skillCalls.size}`);
  console.log(
    `  ${B("MCP servers")}  ${agg.mcpServerCalls.size}  ${D(`(${agg.mcpToolCalls.size} distinct tools)`)}`,
  );
  console.log(`  ${B("Subagents")}    ${agg.subagentCalls.size}`);
  console.log(`  ${B("Slash cmds")}   ${agg.slashCommands.size}`);

  // ---- usage share -------------------------------------------------------
  section("USAGE-SHARE — models (share of all tokens)");
  for (const r of f.models) {
    const flag = r.costUSD === null ? ` ${D("[unpriced]")}` : "";
    console.log(`  ${bar(r.share)} ${pct(r.share).padStart(6)}  ${B(safe(r.model, 32))}${flag}`);
    console.log(
      D(
        `      in ${n(r.tokens.input)} · out ${n(r.tokens.output)} · ` +
          `cache-w ${n(r.tokens.cacheWrite5m + r.tokens.cacheWrite1h + r.tokens.cacheWriteUnsplit)} ` +
          `(5m ${n(r.tokens.cacheWrite5m)} / 1h ${n(r.tokens.cacheWrite1h)}` +
          (r.tokens.cacheWriteUnsplit ? ` / unsplit ${n(r.tokens.cacheWriteUnsplit)}` : "") +
          `) · cache-r ${n(r.tokens.cacheRead)} · ${n(r.messages)} responses`,
      ),
    );
  }
  console.log(
    `\n  ${D("total")} ${n(f.totalTokens)} tokens · ${D("cache-hit share")} ${pct(f.cacheHitShare)} · ` +
      `${D("subagent share")} ${pct(f.sidechainShare)}`,
  );

  section(`USAGE-SHARE — tools  (${n(f.totalToolCalls)} deduped tool calls)`);
  table(f.tools, f.totalToolCalls);
  console.log(
    D(
      `\n  thinking blocks ${n(agg.thinkingBlocks)} · text blocks ${n(agg.textBlocks)} · ` +
        `web_search ${n(agg.webSearchRequests)} · web_fetch ${n(agg.webFetchRequests)}`,
    ),
  );

  const sum = (rows: Array<[string, number]>) => rows.reduce((a, [, v]) => a + v, 0);
  const totalSkill = sum(f.skills);
  const totalMcp = sum(f.mcpServers);
  const totalSub = sum(f.subagents);
  const totalSlash = sum(f.slashCommands);

  section("USAGE-SHARE — skills / MCP / subagents / slash commands");
  if (!showNames) {
    console.log(
      D(
        "  names masked — these are user-chosen strings that can leak project or client\n" +
          "  names. Re-run with --names to review them locally.\n",
      ),
    );
  }
  console.log(`  ${B("Skills")} ${D(`(${n(totalSkill)} calls)`)}`);
  table(f.skills, totalSkill, 10, !showNames);
  console.log(`\n  ${B("MCP servers")} ${D(`(${n(totalMcp)} calls)`)}`);
  table(f.mcpServers, totalMcp, 10, !showNames);
  console.log(`\n  ${B("Subagent types")} ${D(`(${n(totalSub)} launches)`)}`);
  table(f.subagents, totalSub, 10, !showNames);
  console.log(`\n  ${B("Slash commands")} ${D(`(${n(totalSlash)} invocations)`)}`);
  table(f.slashCommands, totalSlash, 10, !showNames);

  // ---- cost --------------------------------------------------------------
  section("API-EQUIVALENT COST");
  console.log(
    D(
      "  What this usage WOULD cost at Anthropic's public API list prices, priced per\n" +
        "  token class. Not what was spent. On a subscription plan, actual spend is the\n" +
        `  subscription price.\n  Pricing table: ${PRICING_TABLE_VERSION}\n  Note: ${PRICING_TABLE_NOTES}\n`,
    ),
  );
  for (const r of f.models) {
    const cost = r.costUSD === null ? D("no pinned price") : usd(r.costUSD).padStart(10);
    console.log(`  ${safe(r.model, 26).padEnd(26)} ${cost}`);
  }
  console.log(`  ${"".padEnd(26)} ${D("─".repeat(10))}`);
  console.log(`  ${B("total".padEnd(26))} ${B(usd(f.totalCostUSD).padStart(10))}`);
  if (f.unpricedModels.length > 0) {
    console.log(
      `\n  ${D(`excluded: ${n(f.unpricedTokens)} tokens on unpriced models (${f.unpricedModels.map((m) => safe(m, 26)).join(", ")})`)}`,
    );
  }

  // ---- cross-check -------------------------------------------------------
  const cache = await readStatsCache();
  if (cache) {
    section("CROSS-CHECK — ~/.claude/stats-cache.json (advisory, undocumented)");
    const num = (v: unknown) => (typeof v === "number" ? n(v) : "—");
    console.log(
      `  ${D("stats-cache")} sessions ${num(cache.totalSessions)} · messages ${num(cache.totalMessages)} · ` +
        `first ${safe(String(cache.firstSessionDate ?? "—")).slice(0, 10)}`,
    );
    console.log(
      `  ${D("this scan ")} sessions ${n(f.sessions)} · records ${n(agg.records)} · first ${day(f.firstTs)}`,
    );
    const mu = cache.modelUsage;
    if (mu && typeof mu === "object") {
      console.log(
        D(
          `  stats-cache knows ${Object.keys(mu).length} models; this scan found ${f.models.length}`,
        ),
      );
    }
    console.log(
      D(
        "  Divergence is expected: stats-cache outlives pruned transcripts. Treat as a\n" +
          "  drift signal, not a source of record.",
      ),
    );
  }

  // ---- what a publish payload would carry --------------------------------
  section("PUBLISH PREVIEW — the measured layer, if this were sent");
  const preview = {
    window: windowDays ? `rolling_${windowDays}_days` : "local_history",
    observedFrom: day(f.firstTs),
    observedTo: day(f.lastTs),
    activeDays: f.activeDays,
    // Omitted rather than truncated when the scan window is narrower than the
    // metric's span — a field named for 30 days must never carry a 7-day value.
    ...(spanCovered(30) ? { activeDaysLast30: f.activeDaysLast30 } : {}),
    sessions: f.sessions,
    projects: f.projects,
    models: f.models.map((r) => ({
      model: safe(r.model, 32),
      tokenShare: Number(r.share.toFixed(4)),
      apiEquivalentUSD: r.costUSD === null ? null : Number(r.costUSD.toFixed(2)),
    })),
    tools: f.tools.slice(0, 10).map(([name, calls]) => ({
      name: safe(name, 32),
      callShare: Number((calls / (f.totalToolCalls || 1)).toFixed(4)),
    })),
    skillsCount: agg.skillCalls.size,
    mcpServersCount: agg.mcpServerCalls.size,
    // Carried so a consumer summing apiEquivalentUSD can tell whether tokens
    // were left out of that total, rather than inferring a complete figure.
    excludedTokens: {
      unpriced: f.unpricedTokens,
      synthetic: agg.syntheticTokens,
    },
    pricingTable: PRICING_TABLE_VERSION,
  };
  console.log(
    D(
      "  Skill / MCP / slash names are NOT in this payload — only counts, pending the\n" +
        "  allowlist decision (#30). No paths, no repo names, no prompts.\n" +
        "  NOTE: `tools` publishes built-in tool names verbatim — that channel is\n" +
        "  denylist-shaped (anything not mcp__/Skill/Agent falls through), which #33\n" +
        "  should close along with the freeform-name question.\n",
    ),
  );
  console.log(
    JSON.stringify(preview, null, 2)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n"),
  );
  console.log();
}

main().catch((err: unknown) => {
  // Never print the raw error: Node's fs errors carry an absolute `path`,
  // which would disclose the home layout and the munged project directory
  // that the rest of this report deliberately withholds.
  const name = err instanceof Error ? err.name : "Error";
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "unknown";
  console.error(`\n${name} (${code}) — details withheld (may contain local paths).`);
  console.error("Re-run with --show-paths if you need the full error locally.");
  if (showPaths) console.error(err);
  process.exit(1);
});
