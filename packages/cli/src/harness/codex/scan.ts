import { traceError } from "../../trace.js";
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

import { type createReadStream, type Dirent, readFileSync } from "node:fs";
import { open, readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
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

/** `$CODEX_HOME` honored, `~/.codex` the default - mirrors the Codex source. */
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

/** What counts as a Codex rollout. Shared with `detect` (#101). */
export function isRolloutFile(basename: string): boolean {
	return ROLLOUT_RE.test(basename);
}

/** Recursive rollout walk - the YYYY/MM/DD nesting is real. */
async function* walkRollouts(dir: string): AsyncGenerator<string> {
	let entries: Dirent[];
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code !== "ENOENT")
			traceError("codex rollout discovery", error, "warn");
		return;
	}
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) yield* walkRollouts(full);
		else if (e.isFile() && isRolloutFile(e.name)) yield full;
	}
}

/**
 * zstd support landed in node:zlib after the CLI's original Node 18 floor,
 * so it is feature-detected. On an old runtime a `.zst` rollout counts as
 * unreadable - a visible coverage figure, never a silent skip.
 */
const createZstdDecompress =
	typeof zlib.createZstdDecompress === "function"
		? zlib.createZstdDecompress
		: null;

// Bound even a corrupt or exceptionally large single JSONL record. Oversized
// records count as parse failures, and the next newline resumes the reading.
const MAX_LINE_BYTES = 64 * 1024 * 1024;

export type ScanOptions = {
	/** Only count records with a timestamp at or after this epoch ms. */
	sinceMs?: number;
	onProgress?: (files: number) => void;
	/** Override the discovered roots. Tests only. */
	roots?: string[];
	/** Override the config.toml path. Tests only. */
	configFile?: string;
	/** Override the stream factory. Tests only; bytes still use the real decoder. */
	readStreamImpl?: typeof createReadStream;
	/** Smaller limits exercise chunk and record boundaries in tests. */
	chunkBytes?: number;
	maxLineBytes?: number;
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
			} catch (error) {
				if ((error as NodeJS.ErrnoException)?.code !== "ENOENT")
					traceError("codex rollout path resolution", error, "warn");
				resolved = file;
			}
			// Dedup key = resolved path with `.zst` stripped. Codex's compression
			// worker leaves `foo.jsonl` and `foo.jsonl.zst` coexisting for a moment
			// (rename before unlink, #73 §4) - one session, two names. Keying on
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
				} catch (error) {
					if ((error as NodeJS.ErrnoException)?.code !== "ENOENT")
						traceError("codex rollout stat", error, "warn");
					/* unreadable stat - fall through and try to read it */
				}
			}

			agg.files++;
			stats.filesRead++;
			if (opts.onProgress && agg.files % 20 === 0) opts.onProgress(agg.files);
			const outcome = await ingestWithRetry(agg, file, opts);
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
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code !== "ENOENT")
			traceError("codex source stat", error, "warn");
		return false;
	}
}

type IngestOutcome =
	| { ok: true; genuine: true }
	| { ok: true; genuine: false; originator: string }
	| { ok: false; reason: string };

/**
 * A read failure classified WITHOUT the error object's message or stack -
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
async function ingestWithRetry(
	agg: Aggregate,
	file: string,
	opts: ScanOptions,
): Promise<IngestOutcome> {
	try {
		return await ingestFile(agg, file, opts);
	} catch (e) {
		traceError("codex rollout read", e);
		if (errorClass(e) === "ENOENT" && !file.endsWith(".zst")) {
			try {
				return await ingestFile(agg, `${file}.zst`, opts);
			} catch (e2) {
				traceError("codex compressed rollout retry", e2);
				return { ok: false, reason: errorClass(e2) };
			}
		}
		return { ok: false, reason: errorClass(e) };
	}
}

/**
 * Pin the append-only file and its length across two bounded streaming passes.
 * The first validates the entire fingerprint before any measurements enter the
 * aggregate. The second ingests without keeping raw bytes or parsed records.
 * An open descriptor survives the compression worker unlinking the plain file.
 */
async function ingestFile(
	agg: Aggregate,
	file: string,
	opts: ScanOptions,
): Promise<IngestOutcome> {
	const compressed = file.endsWith(".zst");
	if (compressed && !createZstdDecompress) throw readError("zstd-unsupported");
	const handle = await open(file, "r");
	try {
		const { size } = await handle.stat();
		let nonEmptyLines = 0;
		let parseErrors = 0;
		async function* records(count: boolean): AsyncGenerator<unknown> {
			if (size === 0) return;
			async function* chunks() {
				for (let position = 0; position < size; ) {
					const buffer = Buffer.allocUnsafe(
						Math.min(opts.chunkBytes ?? 64 * 1024, size - position),
					);
					const { bytesRead } = await handle.read(
						buffer,
						0,
						buffer.length,
						position,
					);
					if (bytesRead === 0) throw readError("rollout-truncated");
					position += bytesRead;
					yield buffer.subarray(0, bytesRead);
				}
			}
			const source = opts.readStreamImpl
				? opts.readStreamImpl(file, {
						start: 0,
						end: size - 1,
						highWaterMark: opts.chunkBytes ?? 64 * 1024,
					})
				: Readable.from(chunks(), { objectMode: false });
			let sourceError: unknown;
			const decoder = compressed ? createZstdDecompress?.() : undefined;
			source.on("error", (error: Error) => {
				sourceError = error;
				decoder?.destroy(error);
			});
			const stream: Readable = decoder ? source.pipe(decoder) : source;
			try {
				for await (const line of boundedLines(
					stream,
					opts.maxLineBytes ?? MAX_LINE_BYTES,
				)) {
					if (line === "") continue;
					if (count) nonEmptyLines++;
					let record: unknown;
					try {
						if (line === null) throw readError("record-too-large");
						record = JSON.parse(line);
					} catch (error) {
						if (count) {
							if (parseErrors === 0)
								traceError("codex rollout JSON (first failure)", error, "warn");
							parseErrors++;
						}
						continue;
					}
					yield record;
				}
			} catch (error) {
				if (decoder && !sourceError) {
					traceError("codex zstd decompression", error);
					throw readError("zstd-corrupt");
				}
				throw sourceError ?? error;
			} finally {
				source.destroy();
				decoder?.destroy();
			}
		}
		const verdict = await classifyRollout(records(true));
		if (!verdict.genuine) return { ok: true, ...verdict };
		agg.lines += nonEmptyLines;
		agg.parseErrors += parseErrors;
		const state = createFileState();
		for await (const rec of records(false))
			ingestLine(agg, rec, state, opts.sinceMs);
		return { ok: true, genuine: true };
	} finally {
		await handle.close();
	}
}

/** Decode only complete lines so UTF-8 characters may span stream chunks. */
async function* boundedLines(
	stream: Readable,
	limit: number,
): AsyncGenerator<string | null> {
	let parts: Buffer[] = [];
	let length = 0;
	let oversized = false;
	for await (const chunk of stream) {
		const bytes: Buffer = chunk;
		let start = 0;
		while (start < bytes.length) {
			const newline = bytes.indexOf(10, start);
			const end = newline < 0 ? bytes.length : newline;
			const part = bytes.subarray(start, end);
			if (!oversized) {
				length += part.length;
				if (length > limit) {
					oversized = true;
					parts = [];
				} else parts.push(part);
			}
			if (newline >= 0) {
				yield oversized ? null : Buffer.concat(parts, length).toString("utf8");
				parts = [];
				length = 0;
				oversized = false;
			}
			start = end + 1;
		}
	}
	if (oversized || length > 0)
		yield oversized ? null : Buffer.concat(parts, length).toString("utf8");
}

/**
 * The genuine-rollout fingerprint (#73, source-pinned at rust-v0.146.0): the
 * codex-rs recorder always writes `session_meta` first, and every real user
 * turn persists a `turn_context` before its usage lands. Newer Codex (observed
 * in 0.151.0) broke the ORDER half of that invariant: a forked thread replays
 * the parent's history - `token_count` events included - ahead of its first
 * new turn, so usage may sit before any `turn_context`. The analyzer skips
 * that replayed head; here the rule weakens to presence: a file that carries
 * a `token_count` but no `turn_context` ANYWHERE was not written by Codex
 * CLI. Negative by construction - it detects "not genuine", never "written by
 * tool X"; the originator label is diagnostic only.
 */
async function classifyRollout(
	records: AsyncIterable<unknown>,
): Promise<{ genuine: true } | { genuine: false; originator: string }> {
	let originator: string | null = null;
	let sawTurnContext = false;
	let sawTokenCount = false;
	let genuine = true;
	let count = 0;
	for await (const raw of records) {
		const rec = asObj(raw);
		const type = rec ? asStr(rec.type) : null;
		const payload = rec ? asObj(rec.payload) : null;
		if (count++ === 0 && type !== "session_meta") genuine = false;
		if (type === "session_meta" && payload && originator === null) {
			originator = asStr(payload.originator);
		} else if (type === "turn_context") {
			sawTurnContext = true;
		} else if (
			type === "event_msg" &&
			payload &&
			asStr(payload.type) === "token_count"
		) {
			sawTokenCount = true;
		}
	}
	if (count === 0 || (sawTokenCount && !sawTurnContext)) genuine = false;
	if (genuine) return { genuine: true };
	return { genuine: false, originator: originator ?? "(none)" };
}

/**
 * The static half of the MCP inventory (#66 decision 3): `[mcp_servers.*]`
 * in `~/.codex/config.toml`. Unreadable or absent config is silence, not an
 * error - the observed half stands on its own.
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
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code !== "ENOENT")
			traceError("codex MCP configuration", error, "warn");
		return;
	}
	noteConfiguredMcpServers(agg, names);
}
