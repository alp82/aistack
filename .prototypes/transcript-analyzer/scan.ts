// PROTOTYPE — throwaway. Wayfinder ticket #32 (map #29).
// I/O shell around the pure analyzer: find transcript roots, stream JSONL,
// hand each parsed record to ingestRecord. Nothing leaves this machine.

import { createReadStream } from "node:fs";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline";

import { type Aggregate, ingestRecord } from "./analyzer";

/** Discovery order mirrors ccusage's adapter: CLAUDE_CONFIG_DIR, then the defaults. */
export function transcriptRoots(): string[] {
  const env = process.env.CLAUDE_CONFIG_DIR;
  if (env) {
    return env
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => path.join(s, "projects"));
  }
  const roots = [path.join(homedir(), ".claude", "projects")];
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config");
  roots.push(path.join(xdg, "claude", "projects"));
  return roots;
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Recursive *.jsonl walk — the nested `<sessionId>/subagents/` layout is real. */
async function* walkJsonl(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkJsonl(full);
    else if (e.isFile() && e.name.endsWith(".jsonl")) yield full;
  }
}

export type ScanOptions = {
  /** Only ingest records with a timestamp at or after this epoch ms. */
  sinceMs?: number;
  onProgress?: (files: number) => void;
};

export type ScanStats = {
  /** Files found on disk before any window filter. */
  filesFound: number;
  /** Files skipped because their mtime predates the window. */
  filesSkippedByMtime: number;
  /** Files skipped because a resolved path was already scanned (overlapping roots). */
  filesSkippedAsDuplicate: number;
  /**
   * Files that could not be read (permissions, or pruned mid-scan). Counted
   * rather than thrown: an unhandled read error would surface the absolute
   * path AND the munged project directory in the crash output, which is
   * exactly what this tool promises never to print.
   */
  filesUnreadable: number;
};

export async function scan(
  agg: Aggregate,
  opts: ScanOptions = {},
): Promise<ScanStats> {
  const stats: ScanStats = {
    filesFound: 0,
    filesSkippedByMtime: 0,
    filesSkippedAsDuplicate: 0,
    filesUnreadable: 0,
  };
  // Roots can overlap (CLAUDE_CONFIG_DIR may repeat a dir; ~/.claude and
  // ~/.config/claude may be symlinked together). Without this guard the same
  // file is ingested twice and the record/line/block counters silently double.
  const visited = new Set<string>();

  for (const root of transcriptRoots()) {
    if (!(await exists(root))) continue;
    for await (const file of walkJsonl(root)) {
      stats.filesFound++;

      let resolved: string;
      try {
        resolved = await realpath(file);
      } catch {
        resolved = file;
      }
      if (visited.has(resolved)) {
        stats.filesSkippedAsDuplicate++;
        continue;
      }
      visited.add(resolved);

      // Transcripts are append-only and chronological, so a file untouched
      // since the window opened cannot hold an in-window record. This is what
      // makes --days actually cheaper rather than merely narrower.
      if (opts.sinceMs !== undefined) {
        try {
          const st = await stat(file);
          if (st.mtimeMs < opts.sinceMs) {
            stats.filesSkippedByMtime++;
            continue;
          }
        } catch {
          /* unreadable stat — fall through and try to read it */
        }
      }

      // Project dir = first path segment under projects/ (privacy-sensitive:
      // it is a munged absolute path, so it is only ever counted, never shown).
      const rel = path.relative(root, file);
      const projectDir = rel.split(path.sep)[0] ?? "(root)";
      agg.files++;
      if (opts.onProgress && agg.files % 200 === 0) opts.onProgress(agg.files);
      try {
        await ingestFile(agg, file, projectDir, opts.sinceMs);
      } catch {
        // Swallow deliberately: the error object carries the absolute path.
        stats.filesUnreadable++;
      }
    }
  }
  return stats;
}

async function ingestFile(
  agg: Aggregate,
  file: string,
  projectDir: string,
  sinceMs?: number,
): Promise<void> {
  const rl = readline.createInterface({
    input: createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  for await (const line of rl) {
    if (!line) continue;
    agg.lines++;
    let rec: unknown;
    try {
      rec = JSON.parse(line);
    } catch {
      agg.parseErrors++;
      continue;
    }
    if (sinceMs !== undefined) {
      const ts =
        rec && typeof rec === "object" && "timestamp" in rec &&
        typeof (rec as { timestamp?: unknown }).timestamp === "string"
          ? Date.parse((rec as { timestamp: string }).timestamp)
          : Number.NaN;
      if (Number.isNaN(ts) || ts < sinceMs) continue;
    }
    ingestRecord(agg, rec, { projectDir });
  }
}

/** Optional cross-check source. Its provenance is undocumented — advisory only. */
export async function readStatsCache(): Promise<Record<string, unknown> | null> {
  const candidates = [
    path.join(homedir(), ".claude", "stats-cache.json"),
    path.join(
      process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config"),
      "claude",
      "stats-cache.json",
    ),
  ];
  for (const p of candidates) {
    try {
      const parsed: unknown = JSON.parse(await readFile(p, "utf8"));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* keep looking */
    }
  }
  return null;
}
