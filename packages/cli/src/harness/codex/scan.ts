// I/O shell around the pure Codex analyzer: find rollout files, stream JSONL
// (plain or zstd), hand each parsed line to ingestLine. Nothing leaves this
// machine.
//
// Wayfinder ticket #67 (map #60), semantics from #65/#66.
//
// STANDING NON-GOAL (locked in #13): raw transcripts, prompts, absolute paths,
// and repo names never leave the machine. `~/.codex/history.jsonl` holds raw
// prompt text and is NEVER opened here; read errors are swallowed rather than
// thrown, because the error object carries the absolute path.

import { type Dirent, readFileSync } from "node:fs";
import { readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import * as zlib from "node:zlib";

import { parse as parseToml } from "smol-toml";

import { emptyScanStats, type ScanStats } from "../shared/window.js";
import {
	type Aggregate,
	createFileState,
	ingestLine,
	noteConfiguredMcpServers,
} from "./analyzer.js";

/** `$CODEX_HOME` honored, `~/.codex` the default — mirrors the Codex source. */
export function codexHome(): string {
	return process.env.CODEX_HOME || path.join(homedir(), ".codex");
}

/**
 * Only `sessions/` is read. `archived_sessions/` is deliberately excluded: an
 * archived session was removed from the user's working set, and the rolling
 * window makes old ones irrelevant anyway. `history.jsonl` is raw prompts and
 * is out of bounds entirely.
 */
export function rolloutRoots(): string[] {
	return [path.join(codexHome(), "sessions")];
}

const ROLLOUT_RE = /^rollout-.*\.jsonl(\.zst)?$/;

/** Recursive rollout walk — the YYYY/MM/DD nesting is real. */
async function* walkRollouts(dir: string): AsyncGenerator<string> {
	let entries: Dirent[];
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) yield* walkRollouts(full);
		else if (e.isFile() && ROLLOUT_RE.test(e.name)) yield full;
	}
}

/**
 * zstd support landed in node:zlib after the CLI's floor (`engines: >=18`),
 * so it is feature-detected. On an old runtime a `.zst` rollout counts as
 * unreadable — a visible coverage figure, never a silent skip.
 */
const zstdDecompress: ((buf: Buffer) => Buffer) | null =
	typeof (zlib as { zstdDecompressSync?: unknown }).zstdDecompressSync ===
	"function"
		? (buf) =>
				(
					zlib as unknown as { zstdDecompressSync: (b: Buffer) => Buffer }
				).zstdDecompressSync(buf)
		: null;

export type ScanOptions = {
	/** Only count records with a timestamp at or after this epoch ms. */
	sinceMs?: number;
	onProgress?: (files: number) => void;
	/** Override the discovered roots. Tests only. */
	roots?: string[];
	/** Override the config.toml path. Tests only. */
	configFile?: string;
};

export async function scan(
	agg: Aggregate,
	opts: ScanOptions = {},
): Promise<ScanStats> {
	const stats: ScanStats = emptyScanStats();
	const visited = new Set<string>();

	for (const root of opts.roots ?? rolloutRoots()) {
		if (!(await exists(root))) continue;
		for await (const file of walkRollouts(root)) {
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

			// Rollouts are append-only and chronological, so a file untouched since
			// the window opened cannot hold an in-window record.
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
				ingestFile(agg, file, opts.sinceMs);
			} catch {
				// Swallow deliberately: the error object carries the absolute path.
				stats.filesUnreadable++;
				stats.filesRead--;
			}
		}
	}

	readConfiguredMcpServers(agg, opts.configFile);
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
 * Whole-file read rather than a stream: a `.zst` rollout must be decompressed
 * as one buffer anyway, and rollout files are single sessions — megabytes,
 * not gigabytes.
 */
function ingestFile(agg: Aggregate, file: string, sinceMs?: number): void {
	let text: string;
	if (file.endsWith(".zst")) {
		if (zstdDecompress === null) {
			throw new Error("zstd not supported by this Node runtime");
		}
		text = zstdDecompress(readFileSync(file)).toString("utf8");
	} else {
		text = readFileSync(file, "utf8");
	}

	const state = createFileState();
	for (const line of text.split("\n")) {
		if (!line) continue;
		agg.lines++;
		let rec: unknown;
		try {
			rec = JSON.parse(line);
		} catch {
			agg.parseErrors++;
			continue;
		}
		ingestLine(agg, rec, state, sinceMs);
	}
}

/**
 * The static half of the MCP inventory (#66 decision 3): `[mcp_servers.*]`
 * in `~/.codex/config.toml`. Unreadable or absent config is silence, not an
 * error — the observed half stands on its own.
 */
function readConfiguredMcpServers(agg: Aggregate, configFile?: string): void {
	const file = configFile ?? path.join(codexHome(), "config.toml");
	let names: string[] = [];
	try {
		const parsed = parseToml(readFileSync(file, "utf8"));
		const servers = parsed.mcp_servers;
		if (servers && typeof servers === "object" && !Array.isArray(servers)) {
			names = Object.keys(servers);
		}
	} catch {
		return;
	}
	noteConfiguredMcpServers(agg, names);
}
