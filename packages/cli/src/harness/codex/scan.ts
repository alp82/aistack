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

import { asObj, asStr } from "../shared/aggregate.js";
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
	/** Override the file reader. Tests only. */
	readFileImpl?: (file: string) => Buffer | string;
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
			// Dedup key = resolved path with `.zst` stripped. Codex's compression
			// worker leaves `foo.jsonl` and `foo.jsonl.zst` coexisting for a moment
			// (rename before unlink, #73 §4) — one session, two names. Keying on
			// the stem makes the second listing a duplicate, not a double count.
			const dedupKey = resolved.endsWith(".zst")
				? resolved.slice(0, -".zst".length)
				: resolved;
			if (visited.has(dedupKey)) {
				stats.filesSkippedAsDuplicate++;
				continue;
			}
			visited.add(dedupKey);

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
			const outcome = ingestWithRetry(agg, file, opts);
			if (!outcome.ok) {
				// Never rethrown: the error object carries the absolute path. The
				// stats keep a relative path and a bare error class instead (#75).
				stats.filesUnreadable++;
				stats.filesRead--;
				if (outcome.reason === "zstd-unsupported") stats.filesZstdUnsupported++;
				stats.unreadableFiles.push({
					path: path.relative(root, file),
					reason: outcome.reason,
				});
			} else if (!outcome.genuine) {
				// Fingerprint failure (#73): another tool wrote this file. Its usage
				// stayed out of the aggregate entirely.
				stats.filesForeign++;
				stats.filesRead--;
				const seen = stats.foreignOriginators.get(outcome.originator) ?? 0;
				stats.foreignOriginators.set(outcome.originator, seen + 1);
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

type IngestOutcome =
	| { ok: true; genuine: true }
	| { ok: true; genuine: false; originator: string }
	| { ok: false; reason: string };

/**
 * A read failure classified WITHOUT the error object's message or stack —
 * both carry the absolute path, which never leaves this module. `code` is a
 * bare class name (`ENOENT`, `EACCES`, `zstd-unsupported`, `zstd-corrupt`).
 */
function errorClass(e: unknown): string {
	const code = (e as { code?: unknown } | null)?.code;
	if (typeof code === "string" && code.length > 0) return code;
	return e instanceof Error ? e.constructor.name : "unknown";
}

const readError = (reason: string): Error =>
	Object.assign(new Error(reason), { code: reason });

/**
 * The compression race (#73 §4): codex's background worker compresses a
 * rollout to `.zst` and then unlinks the plain `.jsonl`, so a file listed by
 * the walk can be gone at read time. Mirror codex's own reader: on `ENOENT`,
 * try the `.zst` sibling once before counting the file unreadable.
 */
function ingestWithRetry(
	agg: Aggregate,
	file: string,
	opts: ScanOptions,
): IngestOutcome {
	try {
		return ingestFile(agg, file, opts);
	} catch (e) {
		if (errorClass(e) === "ENOENT" && !file.endsWith(".zst")) {
			try {
				return ingestFile(agg, `${file}.zst`, opts);
			} catch (e2) {
				return { ok: false, reason: errorClass(e2) };
			}
		}
		return { ok: false, reason: errorClass(e) };
	}
}

/**
 * Whole-file read rather than a stream: a `.zst` rollout must be decompressed
 * as one buffer anyway, and rollout files are single sessions — megabytes,
 * not gigabytes. The lines are parsed BEFORE any of them folds into the
 * aggregate, because the fingerprint verdict (#73) arrives only at end of
 * file: a foreign file must leave the aggregate untouched.
 */
function ingestFile(
	agg: Aggregate,
	file: string,
	opts: ScanOptions,
): IngestOutcome {
	const readFile = opts.readFileImpl ?? readFileSync;
	let text: string;
	if (file.endsWith(".zst")) {
		if (zstdDecompress === null) throw readError("zstd-unsupported");
		const raw = readFile(file);
		try {
			text = zstdDecompress(
				Buffer.isBuffer(raw) ? raw : Buffer.from(raw),
			).toString("utf8");
		} catch {
			throw readError("zstd-corrupt");
		}
	} else {
		text = readFile(file).toString("utf8");
	}

	const records: unknown[] = [];
	let nonEmptyLines = 0;
	let parseErrors = 0;
	for (const line of text.split("\n")) {
		if (!line) continue;
		nonEmptyLines++;
		try {
			records.push(JSON.parse(line));
		} catch {
			parseErrors++;
		}
	}

	const verdict = classifyRollout(records);
	if (!verdict.genuine) return { ok: true, ...verdict };

	agg.lines += nonEmptyLines;
	agg.parseErrors += parseErrors;
	const state = createFileState();
	for (const rec of records) ingestLine(agg, rec, state, opts.sinceMs);
	return { ok: true, genuine: true };
}

/**
 * The genuine-rollout fingerprint (#73, source-pinned at rust-v0.146.0): the
 * codex-rs recorder always writes `session_meta` first, and every real user
 * turn persists a `turn_context` before any usage lands. A file whose first
 * parsed line is not `session_meta`, or that carries a `token_count` with no
 * preceding `turn_context`, was not written by Codex CLI. Negative by
 * construction — it detects "not genuine", never "written by tool X"; the
 * originator label is diagnostic only.
 */
function classifyRollout(
	records: readonly unknown[],
): { genuine: true } | { genuine: false; originator: string } {
	let originator: string | null = null;
	let sawTurnContext = false;
	let genuine = records.length > 0;
	for (const [i, raw] of records.entries()) {
		const rec = asObj(raw);
		const type = rec ? asStr(rec.type) : null;
		const payload = rec ? asObj(rec.payload) : null;
		if (i === 0 && type !== "session_meta") genuine = false;
		if (type === "session_meta" && payload && originator === null) {
			originator = asStr(payload.originator);
		} else if (type === "turn_context") {
			sawTurnContext = true;
		} else if (
			type === "event_msg" &&
			payload &&
			asStr(payload.type) === "token_count" &&
			!sawTurnContext
		) {
			genuine = false;
		}
	}
	if (genuine) return { genuine: true };
	return { genuine: false, originator: originator ?? "(none)" };
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
