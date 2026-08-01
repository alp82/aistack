// I/O shell around the pure analyzer: find transcript roots, stream JSONL, hand
// each parsed record to ingestRecord. Nothing leaves this machine.
//
// Wayfinder ticket #37 (map #29).
//
// STANDING NON-GOAL (locked in #13): raw transcripts, prompts, absolute paths,
// and repo names never leave the machine. Two consequences visible here:
// project directories are counted but their names never escape this module, and
// read errors are swallowed rather than thrown, because the error object carries
// the absolute path and the munged project directory.

import { createReadStream, type Dirent } from "node:fs";
import { readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline";

import {
	emptyScanStats,
	type ScanStats,
	windowStartMs,
} from "../shared/window.js";
import { type Aggregate, ingestRecord } from "./analyzer.js";

export { type ScanStats, windowStartMs };

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

/** Recursive *.jsonl walk — the nested `<sessionId>/subagents/` layout is real. */
async function* walkJsonl(dir: string): AsyncGenerator<string> {
	let entries: Dirent[];
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
	/** Override the discovered roots. Tests only. */
	roots?: string[];
};

/**
 * KNOWN PERFORMANCE FLOOR — measured, decided, deliberately not fixed.
 *
 * Enumeration walks every project directory and `realpath`+`stat`s every file
 * BEFORE the mtime filter can skip anything, so a narrow window still pays a
 * floor proportional to TOTAL history (~60 ms over 3,206 files today, growing
 * linearly). The obvious fix — prune whole project directories by directory
 * mtime — is UNSOUND, and this was verified rather than assumed: appending to a
 * file does not update its parent directory's mtime (only adding, removing, or
 * renaming an entry does). A session resumed with `--resume` appends to a
 * transcript created before the window opened, inside a directory whose mtime
 * never moves, so dir-mtime pruning would silently drop live in-window records
 * — a wrong number, which is worse than a slow one for a tool whose whole claim
 * is measured-not-claimed.
 *
 * The sound version is a persisted enumeration cache, which cuts against #33
 * decision 1 (a sync is a stateless snapshot-replace, no durable client scan
 * state). So: DEFERRED. 60 ms is two orders of magnitude under the ~3 s full
 * scan and invisible next to the send round-trip; it becomes worth revisiting
 * only when total history reaches a scale where the floor dominates.
 */
export async function scan(
	agg: Aggregate,
	opts: ScanOptions = {},
): Promise<ScanStats> {
	const stats: ScanStats = emptyScanStats();
	// Roots can overlap (CLAUDE_CONFIG_DIR may repeat a dir; ~/.claude and
	// ~/.config/claude may be symlinked together). Without this guard the same
	// file is ingested twice and the record/line/block counters silently double.
	const visited = new Set<string>();

	for (const root of opts.roots ?? transcriptRoots()) {
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
			// makes a narrow window actually cheaper rather than merely narrower.
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
			stats.filesRead++;
			if (opts.onProgress && agg.files % 200 === 0) opts.onProgress(agg.files);
			try {
				await ingestFile(agg, file, projectDir, opts.sinceMs);
			} catch {
				// Swallow deliberately: the error object carries the absolute path.
				stats.filesUnreadable++;
				stats.filesRead--;
			}
		}
	}
	return stats;
}

async function exists(p: string): Promise<boolean> {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
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
				rec &&
				typeof rec === "object" &&
				"timestamp" in rec &&
				typeof (rec as { timestamp?: unknown }).timestamp === "string"
					? Date.parse((rec as { timestamp: string }).timestamp)
					: Number.NaN;
			if (Number.isNaN(ts) || ts < sinceMs) continue;
		}
		ingestRecord(agg, rec, { projectDir });
	}
}
