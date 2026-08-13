// I/O shell around the pure pi analyzer: find session files, stream JSONL,
// hand each parsed entry to ingestEntry. Nothing leaves this machine.
//
// Wayfinder ticket #126 (map #121), semantics from
// docs/research/harness-adapters-2026-08.md (§pi-mono).
//
// STANDING NON-GOAL (locked in #13): raw transcripts, prompts, absolute paths,
// and repo names never leave the machine. pi's files are MORE sensitive than
// the other harnesses': there is no separate history file, so raw prompts,
// bashExecution output, base64 screenshots, provider error bodies and the
// munged-absolute-path directory names all sit on the same lines the scanner
// parses. The analyzer reads named fields only; the directory name is never
// even counted (the header's `cwd` is, as an opaque key). Streaming line by
// line keeps a pasted screenshot from pulling megabytes into memory.
// `~/.pi/agent/auth.json` holds credentials — only `sessions/` is ever walked.
// Read errors are swallowed, not thrown: the error object carries the path.

import { createReadStream, type Dirent } from "node:fs";
import { readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline";

import { asNum, asObj, asStr } from "../shared/aggregate.js";
import { emptyScanStats, type ScanStats } from "../shared/window.js";
import {
	type Aggregate,
	createFileState,
	createFoldState,
	type FoldState,
	ingestEntry,
} from "./analyzer.js";

/**
 * The newest session-format version this scanner understands. The vendor doc
 * states the ladder (v1 linear, v2 tree, v3 renamed hookMessage to custom);
 * none of the changes touched `usage`, `model` or `timestamp`, so v1-v3 all
 * read with one fold. A file ABOVE the ceiling may have reshaped those fields,
 * so it counts as unreadable — a visible coverage figure — rather than being
 * misread as zeros.
 */
export const MAX_SESSION_VERSION = 3;

/** `PI_CODING_AGENT_DIR` honored, `~/.pi/agent` the default — mirrors pi. */
export function piAgentDir(): string {
	return (
		process.env.PI_CODING_AGENT_DIR || path.join(homedir(), ".pi", "agent")
	);
}

/**
 * Only `sessions/` is read — `auth.json` (credentials), `settings.json` and
 * the ACP session map live beside it and are out of bounds. A run started
 * with `--session-dir` writes outside every discoverable root and is
 * invisible, which is silence — the direction #40 permits.
 */
export function sessionRoots(): string[] {
	const override = process.env.PI_CODING_AGENT_SESSION_DIR;
	return [override || path.join(piAgentDir(), "sessions")];
}

/**
 * pi names every session file `<munged-ISO-start>_<uuid>.jsonl`
 * (`2026-07-23T16-54-00-149Z_019f8fe5-….jsonl`). Shared with `detect` (#101).
 */
const SESSION_FILE_RE =
	/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/;

/** What counts as a pi session file. */
export function isSessionFile(basename: string): boolean {
	return SESSION_FILE_RE.test(basename);
}

/** Recursive walk — the real layout is two levels (one directory per cwd). */
async function* walkSessions(dir: string): AsyncGenerator<string> {
	let entries: Dirent[];
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) yield* walkSessions(full);
		else if (e.isFile() && isSessionFile(e.name)) yield full;
	}
}

export type ScanOptions = {
	/** Only count entries with a timestamp at or after this epoch ms. */
	sinceMs?: number;
	onProgress?: (files: number) => void;
	/** Override the discovered roots. Tests only. */
	roots?: string[];
};

export async function scan(
	agg: Aggregate,
	opts: ScanOptions = {},
): Promise<ScanStats> {
	const stats: ScanStats = emptyScanStats();
	const visited = new Set<string>();
	// /fork and /clone duplicate entries ACROSS files, so the dedup state is
	// one per scan, not one per file.
	const fold = createFoldState();

	for (const root of opts.roots ?? sessionRoots()) {
		if (!(await exists(root))) continue;
		for await (const file of walkSessions(root)) {
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

			// Session files are append-only, so a file untouched since the window
			// opened cannot hold an in-window entry.
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

			agg.files++;
			stats.filesRead++;
			if (opts.onProgress && agg.files % 200 === 0) opts.onProgress(agg.files);
			try {
				const verdict = await ingestFile(agg, fold, file, opts.sinceMs);
				if (verdict === "foreign") {
					// The first line is not a pi session header: another tool wrote
					// this file. Its usage stayed out of the aggregate entirely.
					stats.filesForeign++;
					stats.filesRead--;
					const seen = stats.foreignOriginators.get("(no-pi-header)") ?? 0;
					stats.foreignOriginators.set("(no-pi-header)", seen + 1);
				} else if (verdict === "version-too-new") {
					stats.filesUnreadable++;
					stats.filesRead--;
					stats.unreadableFiles.push({
						path: path.relative(root, file),
						reason: "version-too-new",
					});
				}
			} catch {
				// Swallow deliberately: the error object carries the absolute path.
				stats.filesUnreadable++;
				stats.filesRead--;
				stats.unreadableFiles.push({
					path: path.relative(root, file),
					reason: "read-error",
				});
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

/**
 * Stream one session file through the fold. The vendor put the fingerprint on
 * line 1 — `{"type":"session"}` with a numeric `version` — so the verdict
 * lands before any usage is folded, and a foreign or too-new file leaves the
 * aggregate untouched by construction (no parse-then-fold buffering needed).
 */
async function ingestFile(
	agg: Aggregate,
	fold: FoldState,
	file: string,
	sinceMs?: number,
): Promise<"ok" | "foreign" | "version-too-new"> {
	const rl = readline.createInterface({
		input: createReadStream(file, { encoding: "utf8" }),
		crlfDelay: Number.POSITIVE_INFINITY,
	});
	const state = createFileState();
	let first = true;
	try {
		for await (const line of rl) {
			if (!line) continue;
			agg.lines++;
			let entry: unknown;
			try {
				entry = JSON.parse(line);
			} catch {
				agg.parseErrors++;
				continue;
			}
			if (first) {
				first = false;
				const header = asObj(entry);
				const version = header ? asNum(header.version) : 0;
				if (!header || asStr(header.type) !== "session" || version < 1) {
					agg.lines--;
					return "foreign";
				}
				if (version > MAX_SESSION_VERSION) {
					agg.lines--;
					return "version-too-new";
				}
			}
			ingestEntry(agg, entry, state, fold, sinceMs);
		}
	} finally {
		rl.close();
	}
	return "ok";
}
