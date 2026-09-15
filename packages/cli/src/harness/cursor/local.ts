import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import type {
	Session,
	SessionReadContext,
	SessionSummary,
	SourceReadLimitsOverride,
} from "cursor-history";
import {
	trace,
	traceEnabled,
	traceError,
	traceErrorCode,
	traceLine,
	traceRenderOptions,
	traceStartedAt,
	traceTimer,
} from "../../trace.js";
import { asObj, asStr } from "../shared/aggregate.js";
import { emptyScanStats, type ScanStats } from "../shared/window.js";
import {
	type LocalSession,
	slimSession,
	type TokenEvidence,
	tokenEvidence,
} from "./evidence.js";

/** Cursor's user-data override is a workspaceStorage path, as in cursor-history. */
export function dataPath(
	env = process.env,
	home = homedir(),
	platform = process.platform,
): string {
	if (env.CURSOR_DATA_PATH) return path.resolve(env.CURSOR_DATA_PATH);
	const base =
		platform === "darwin"
			? path.join(home, "Library", "Application Support")
			: platform === "win32"
				? env.APPDATA || path.join(home, "AppData", "Roaming")
				: env.XDG_CONFIG_HOME || path.join(home, ".config");
	return path.join(base, "Cursor", "User", "workspaceStorage");
}
export const storeRoot = () =>
	process.env.CURSOR_STORE_ROOT || path.join(homedir(), ".cursor");
export const globalDb = (root: string) =>
	path.join(path.dirname(root), "globalStorage", "state.vscdb");

async function exists(file: string): Promise<boolean> {
	try {
		await stat(file);
		return true;
	} catch (error) {
		return (error as NodeJS.ErrnoException).code !== "ENOENT";
	}
}
export async function hasLocalSource(root = dataPath()): Promise<boolean> {
	return (
		await Promise.all(
			[
				root,
				globalDb(root),
				path.join(storeRoot(), "projects"),
				path.join(storeRoot(), "chats"),
				path.join(storeRoot(), "acp-sessions"),
			].map(exists),
		)
	).some(Boolean);
}

type Sqlite = import("node:sqlite").DatabaseSync;
type Statement = import("node:sqlite").StatementSync;
/**
 * One read-only handle on the global database for the whole read. Opening a
 * handle is cheap; on a 20 GB `state.vscdb` opening one per session is not
 * (#445). The two statements are prepared once and the read transaction is
 * held open so every session sees the same snapshot. `close` ends it.
 */
export type EvidenceDb = {
	bubble: Statement;
	header: Statement;
	close(): void;
};
export async function openEvidenceDb(root: string): Promise<EvidenceDb | null> {
	const file = globalDb(root);
	if (!(await exists(file))) return null;
	const { DatabaseSync } = await import("node:sqlite");
	const db: Sqlite = new DatabaseSync(file, { readOnly: true });
	try {
		db.exec("BEGIN");
		const table = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cursorDiskKV'",
			)
			.get();
		if (!table) {
			db.close();
			return null;
		}
		return {
			bubble: db.prepare(`SELECT json_object(
				'tokenCount', json_extract(value, '$.tokenCount'),
				'usage', json_extract(value, '$.usage'),
				'contextWindowStatusAtCreation', json_extract(value, '$.contextWindowStatusAtCreation'),
				'promptDryRunInfo', json_extract(value, '$.promptDryRunInfo')) AS evidence
				FROM cursorDiskKV WHERE key = ?`),
			header: db.prepare(
				"SELECT json_extract(value, '$.conversation') AS conversation FROM cursorDiskKV WHERE key = ?",
			),
			close: () => db.close(),
		};
	} catch (error) {
		db.close();
		throw error;
	}
}

/** Supplemental read only for fields the selected reader flattens. No transcript parser. */
export function readTokenEvidence(
	session: Session,
	db: EvidenceDb | null,
): Map<string, TokenEvidence> {
	const out = new Map<string, TokenEvidence>();
	if (!db) return out;
	if (!session.messages.some((m) => m.identityOrigin?.startsWith("composer")))
		return out;
	for (const message of session.messages) {
		if (!message.id || message.identityOrigin !== "composer-native") continue;
		const row = db.bubble.get(`bubbleId:${session.id}:${message.id}`);
		if (typeof row?.evidence === "string")
			out.set(message.id, tokenEvidence(JSON.parse(row.evidence)));
	}
	// Older Composer headers can retain inline bubbles instead of split keys.
	const header = db.header.get(`composerData:${session.id}`);
	if (typeof header?.conversation === "string") {
		const conversation: unknown = JSON.parse(header.conversation);
		if (Array.isArray(conversation))
			for (const [index, raw] of conversation.entries()) {
				const obj = asObj(raw);
				const id = asStr(obj?.bubbleId) ?? asStr(obj?.id) ?? `msg:${index}`;
				if (!out.has(id)) out.set(id, tokenEvidence(raw));
			}
	}
	return out;
}

async function sourceStamp(root: string): Promise<string> {
	const values = await Promise.all(
		[globalDb(root), `${globalDb(root)}-wal`].map(async (file) => {
			try {
				const info = await stat(file);
				return `${info.size}:${info.mtimeMs}`;
			} catch {
				return "unavailable";
			}
		}),
	);
	return values.join("/");
}

export type LocalRead = {
	sessions: LocalSession[];
	complete: boolean;
	stats: ScanStats;
};
/**
 * One read per root per process.
 *
 * A sync asks this adapter four times (detect twice, scan twice), and every
 * read walks the whole global database: on a 1.6 GB `state.vscdb` the session
 * listing alone costs tens of seconds of CPU. Four walks read as a hang; one is
 * a wait. The memo is keyed by root alone, not by the source stamp: while
 * Cursor is open it appends to the write-ahead log continuously, so a stamp
 * taken after the first read never matches and the read would repeat. A sync
 * is one moment, and the read itself marks its result incomplete when the
 * source moved under it (see `readLocalOnce`).
 */
const localReads = new Map<
	string,
	{ stamp: string; sinceMs: number | undefined; read: Promise<LocalRead> }
>();

/**
 * The oldest moment this process needs a session for; undefined reads every
 * session. The sync stage sets it once, before any harness runs, to the
 * widest window of the run: the retention the day rows cover, not the 30-day
 * detection window. The read skips a session whose listing entry dates it
 * entirely before this moment (#445). The memo above holds one read per
 * root, so the window has to be the widest one BEFORE the first caller
 * arrives; a read taken with a narrower window is repeated, not reused, when
 * a wider one is asked for later (see `readLocal`).
 */
let readWindowSinceMs: number | undefined;
export function setCursorReadWindow(sinceMs: number | undefined): void {
	readWindowSinceMs = sinceMs;
}
/** Whether a read taken with window `held` has every session `wanted` needs. */
function covers(held: number | undefined, wanted: number | undefined): boolean {
	return held === undefined || (wanted !== undefined && held <= wanted);
}

/** Tests only: forget the reads this process made. */
export function forgetLocalReads(): void {
	localReads.clear();
	readWindowSinceMs = undefined;
}

/** Errors never escape with paths, prompts or database values. */
export async function readLocal(
	root = dataPath(),
	onProgress?: (files: number, total?: number) => void,
): Promise<LocalRead> {
	const held = localReads.get(root);
	if (held && covers(held.sinceMs, readWindowSinceMs)) {
		trace("cursor · reusing this run's history read");
		return held.read;
	}
	if (held) trace("cursor · widening this run's history read");
	// Nothing to walk, nothing to remember: an install that appears later in
	// the same process (tests do this) must still be read.
	if (!(await hasLocalSource(root))) {
		trace("cursor · no local source");
		return { sessions: [], complete: true, stats: emptyScanStats() };
	}
	const stamp = await sourceStamp(root);
	const read = readLocalOffThread(root, stamp, onProgress);
	localReads.set(root, { stamp, sinceMs: readWindowSinceMs, read });
	return read;
}

/**
 * The bundled worker next to the CLI entry (`tsup` emits `cursor-worker.js`
 * beside `index.js`). Absent when running from source, where the read stays
 * inline; `AISTACK_CURSOR_INLINE=1` forces inline in a build too.
 */
function workerFile(): URL | null {
	if (process.env.AISTACK_CURSOR_INLINE === "1") return null;
	const url = new URL("./cursor-worker.js", import.meta.url);
	return existsSync(url) ? url : null;
}

/**
 * The read walks the whole global database synchronously: cursor-history's
 * session listing alone is tens of seconds of CPU on a database past a
 * gigabyte. On the main thread that freezes the terminal; in a worker the
 * board keeps drawing and the other harnesses keep scanning (#420). The
 * worker returns the same `LocalRead` (sessions are plain data, token
 * evidence is a Map), so the caller cannot tell which thread read it.
 */
async function readLocalOffThread(
	root: string,
	before: string,
	onProgress?: (files: number, total?: number) => void,
): Promise<LocalRead> {
	const file = workerFile();
	if (!file) return readLocalOnce(root, before, onProgress);
	return new Promise<LocalRead>((resolve) => {
		const fallback = () => resolve(readLocalOnce(root, before, onProgress));
		// A worker that ran out of heap read the same database the main thread
		// would: retrying inline runs out too, and that takes the whole sync
		// down instead of one harness (#449). Report the read unreadable.
		const outOfMemory = () => {
			trace(
				"cursor worker out of memory · Cursor history not read this sync",
				"warn",
			);
			const stats = emptyScanStats();
			stats.filesUnreadable++;
			stats.unreadableFiles.push({ path: "history", reason: "OUT_OF_MEMORY" });
			resolve({ sessions: [], complete: false, stats });
		};
		let settled = false;
		const settle = (fn: () => void) => {
			if (settled) return;
			settled = true;
			fn();
		};
		const worker = new Worker(file, {
			workerData: {
				root,
				before,
				sinceMs: readWindowSinceMs,
				trace: traceEnabled(),
				traceStartedAt: traceStartedAt(),
				traceColor: traceRenderOptions().color,
				traceColumns: traceRenderOptions().columns,
			},
		});
		worker.on("message", (message: CursorWorkerMessage) => {
			if (message.kind === "trace") traceLine(message.line);
			else if (message.kind === "progress")
				onProgress?.(message.files, message.total);
			else if (message.kind === "result") settle(() => resolve(message.read));
			else
				settle(() => {
					trace("cursor · worker failed, reading inline");
					fallback();
				});
		});
		worker.on("error", (error) =>
			settle(() => {
				traceError("cursor worker", error);
				if (traceErrorCode(error) === "ERR_WORKER_OUT_OF_MEMORY") outOfMemory();
				else fallback();
			}),
		);
		worker.on("exit", (code) => {
			if (code !== 0)
				settle(() => {
					trace(`cursor worker exited · code=${code}; reading inline`, "warn");
					fallback();
				});
		});
	});
}

export type CursorWorkerMessage =
	| { kind: "progress"; files: number; total?: number }
	/** A formatted trace line, written by the main thread on receipt (see worker.ts). */
	| { kind: "trace"; line: string }
	| { kind: "result"; read: LocalRead }
	| { kind: "error" };

/**
 * How long the read may go without finishing a session or returning a
 * listing page before it is abandoned. A whole-read deadline was the wrong
 * tool: a 20 GB database with 721 sessions needs 106 s for the listing alone
 * and the read runs in a worker, so a long read freezes nothing (#445). A
 * stall is different: no progress for this long means the reader is stuck.
 */
export const STALL_MS = 120_000;

/**
 * A session slower than this gets its own trace line. On a 20 GB database
 * one session took 35 s and the log had nothing to say which of the 721 it
 * was or what made it heavy (#445). The line carries counts only.
 */
export const SLOW_SESSION_MS = 2_000;

/**
 * How far before the window a listing entry may date a session and still be
 * opened. `scan.ts` marks the read incomplete when a cached dashboard event
 * inside the window belongs to a session the read did not return, and a
 * session's dashboard-side event can post-date its local `lastUpdatedAt` by
 * a little. A day of slack keeps such a session in the read.
 */
export const READ_WINDOW_MARGIN_MS = 86_400_000;

/**
 * The newest moment a listing entry vouches for, or null when it has none.
 * The public listing carries the creation time as `timestamp` and the last
 * update as `metadata.lastModified`, each with its source. cursor-history
 * stamps a moment it cannot date with epoch zero and the source
 * `epoch-unknown`. A session with no dated moment is read: undated retained
 * history is real, and `detect` in adapter.ts counts it (it can gain its
 * first anchor from dashboard enrichment). An ambiguous entry has no dates.
 */
export function summaryNewestMs(summary: SessionSummary): number | null {
	if (summary.resolutionState === "ambiguous") return null;
	let newest: number | null = null;
	for (const [iso, source] of [
		[summary.metadata?.lastModified, summary.lastUpdatedAtSource],
		[summary.timestamp, summary.createdAtSource],
	] as const) {
		if (source === "epoch-unknown" || typeof iso !== "string") continue;
		const ms = Date.parse(iso);
		if (!Number.isFinite(ms) || ms <= 0) continue;
		newest = newest === null ? ms : Math.max(newest, ms);
	}
	return newest;
}
/**
 * A session the window cannot use: its listing entry dates its newest moment
 * more than `READ_WINDOW_MARGIN_MS` before the window opens. `getSession` is
 * the expensive half of the read on a large database (#445), so these are
 * never opened.
 */
function olderThanWindow(
	summary: SessionSummary,
	sinceMs: number | undefined,
): boolean {
	if (sinceMs === undefined) return false;
	const newest = summaryNewestMs(summary);
	return newest !== null && newest < sinceMs - READ_WINDOW_MARGIN_MS;
}

/** The read itself, on whichever thread called it. */
export async function readLocalOnce(
	root: string,
	before: string | undefined,
	onProgress?: (files: number, total?: number) => void,
	sourceReadLimits?: SourceReadLimitsOverride,
	stallMs = STALL_MS,
	sinceMs: number | undefined = readWindowSinceMs,
): Promise<LocalRead> {
	before ??= await sourceStamp(root);
	const stats = emptyScanStats();
	const out: LocalRead = { sessions: [], complete: true, stats };
	if (!(await hasLocalSource(root))) {
		trace("cursor · no local source");
		return out;
	}
	trace(`cursor · global database ${await globalDbSize(root)}`);
	const readDone = traceTimer("cursor history read");
	let context: SessionReadContext | undefined;
	let evidence: EvidenceDb | null | undefined;
	let retrySmallPage = false;
	let unresolved = 0;
	let corrupted = 0;
	let ambiguous = 0;
	let encodingInvalid = 0;
	let total: number | undefined;
	let stage = "reader setup";
	// The stall detector. Every completed session and every listing page
	// re-arms the timer; only silence for `stallMs` aborts. cursor-history
	// reads synchronously, so the timer cannot fire during a read: it fires
	// on the next turn of the event loop, after the blocking call returns.
	// Late is fine. The reader checks the signal before its next step, so a
	// stall still ends the read there instead of running on to the end.
	const stall = new AbortController();
	const { signal } = stall;
	let stallTimer: NodeJS.Timeout | undefined;
	const progressed = () => {
		if (signal.aborted) return;
		clearTimeout(stallTimer);
		stallTimer = setTimeout(() => {
			const error = new Error(
				`cursor read stalled: no progress for ${Math.round(stallMs / 1000)} s`,
			);
			error.name = "AbortError";
			stall.abort(error);
		}, stallMs);
		stallTimer.unref?.();
	};
	progressed();
	try {
		const reader = await import("cursor-history");
		const options = {
			dataPath: root,
			sqliteDriver: "node:sqlite" as const,
			onDiagnostic: (diagnostic: { code?: string }) => {
				if (signal.aborted) return;
				traceError("cursor source diagnostic", diagnostic, "warn");
				out.complete = false;
			},
			signal,
		};
		context = reader.createSessionReadContext({ ...options, sourceReadLimits });
		const config = { ...options, readContext: context };
		let offset = 0;
		while (true) {
			// The first page carries the whole workspace discovery, which walks
			// every bubble key in the global database before it returns.
			const pageDone = traceTimer(
				offset === 0 ? "cursor session listing" : "cursor session page",
			);
			stage = "session listing";
			const page = await reader.listSessionSummaries({
				...config,
				offset,
				limit: 100,
			});
			progressed();
			pageDone(`${page.data.length} of ${page.pagination.total} sessions`);
			total = page.pagination.total;
			if (offset === 0) onProgress?.(0, total);
			for (const summary of page.data) {
				// Skipped sessions are neither found nor unreadable: `filesFound`
				// counts what the read opened, so the read/found line stays
				// whole, and `filesSkippedByMtime` carries the count, as the
				// file-based harnesses use it. Nothing compares `filesFound`
				// with the listing total.
				if (olderThanWindow(summary, sinceMs)) {
					stats.filesSkippedByMtime++;
					onProgress?.(stats.filesRead + stats.filesSkippedByMtime, total);
					continue;
				}
				stats.filesFound++;
				if (summary.resolutionState === "ambiguous") {
					out.complete = false;
				}
				const position = `${stats.filesRead + stats.filesUnreadable + stats.filesSkippedByMtime + 1} of ${total}`;
				const sessionStartedMs = Date.now();
				try {
					stage = "session read";
					const session = await reader.getSession(summary.id, config);
					if (
						session.resolutionState !== "complete" ||
						session.messages.some((m) => m.metadata?.corrupted)
					) {
						if (session.resolutionState !== "complete") unresolved++;
						if (session.messages.some((m) => m.metadata?.corrupted))
							corrupted++;
						out.complete = false;
					}
					stage = "token evidence";
					if (evidence === undefined) evidence = await openEvidenceDb(root);
					const tokens = readTokenEvidence(session, evidence);
					// Slim before holding: the full session (text, thinking, tool
					// results) is released with `releaseSession` below.
					out.sessions.push({ session: slimSession(session), tokens });
					stats.filesRead++;
					const elapsedMs = Date.now() - sessionStartedMs;
					if (elapsedMs >= SLOW_SESSION_MS)
						trace(
							`cursor slow session · ${position} · ${elapsedMs} ms · ${session.messages.length} messages, ${tokens.size} bubbles with token evidence`,
							"warn",
						);
					onProgress?.(stats.filesRead + stats.filesSkippedByMtime, total);
				} catch (error) {
					// A stall ends the whole read; the outer catch reports it once.
					if (signal.aborted || isPageByteLimit(error)) throw error;
					const code = traceErrorCode(error);
					if (code === "SESSION_AMBIGUOUS") ambiguous++;
					// A bubble payload with a BOM inside the text or invalid UTF-8
					// drops the whole session in cursor-history. Counted apart
					// from the other rejections so the review can name it.
					else if (code === "SOURCE_ENCODING_INVALID") encodingInvalid++;
					else traceError(`cursor ${stage}`, error, "warn");
					out.complete = false;
					stats.filesUnreadable++;
				} finally {
					context.releaseSession(summary.id);
					progressed();
				}
			}
			if (!page.pagination.hasMore) break;
			if (page.data.length === 0 || offset >= 100_000) {
				trace(
					"cursor listing incomplete · empty page or pagination limit",
					"warn",
				);
				out.complete = false;
				break;
			}
			offset += page.data.length;
		}
	} catch (error) {
		if (signal.aborted) {
			// Sessions the loop never reached. A session that stalled mid-read
			// is counted under `history` below, not here.
			const inFlight = stage === "session listing" ? 0 : 1;
			const skipped = Math.max(
				0,
				(total ?? 0) -
					stats.filesRead -
					stats.filesUnreadable -
					stats.filesSkippedByMtime -
					inFlight,
			);
			trace(
				`cursor read stalled · no progress for ${Math.round(stallMs / 1000)} s during ${stage} · ${stats.filesRead} sessions kept, ${skipped} skipped`,
				"warn",
			);
			stats.unreadableFiles.push({ path: "history", reason: "STALLED" });
		} else {
			traceError(`cursor ${stage}`, error);
			retrySmallPage =
				isPageByteLimit(error) && sourceReadLimits?.sqlitePageRows !== 1;
			stats.unreadableFiles.push({
				path: "history",
				reason: traceErrorCode(error),
			});
		}
		out.complete = false;
		stats.filesUnreadable++;
	} finally {
		clearTimeout(stallTimer);
		try {
			evidence?.close();
		} catch (error) {
			traceError("cursor evidence database close", error, "warn");
		}
		try {
			await context?.dispose();
		} catch (error) {
			traceError("cursor reader disposal", error);
			out.complete = false;
		}
	}
	if (retrySmallPage) {
		readDone(
			"page byte limit reached; retrying with one SQLite row per page",
			"warn",
		);
		// Restart after disposing the context. No partially collected sessions
		// survive the retry, and the byte/value limits remain in force.
		return readLocalOnce(
			root,
			before,
			onProgress,
			{ ...sourceReadLimits, sqlitePageRows: 1 },
			stallMs,
			sinceMs,
		);
	}
	if (stats.filesSkippedByMtime)
		trace(
			`cursor · ${stats.filesSkippedByMtime} sessions older than the window skipped`,
		);
	if (before !== (await sourceStamp(root))) {
		trace(
			"cursor history incomplete · database changed during the read",
			"warn",
		);
		out.complete = false;
	}
	if (unresolved || corrupted || ambiguous || encodingInvalid) {
		trace(
			`cursor partial history · ${unresolved} sessions unresolved, ${corrupted} with corrupted messages, ${ambiguous} skipped with conflicting copies${ambiguous ? " (SESSION_AMBIGUOUS)" : ""}, ${encodingInvalid} skipped with non-UTF-8 payloads${encodingInvalid ? " (SOURCE_ENCODING_INVALID)" : ""} · available dated usage retained`,
			"warn",
		);
	}
	// The gate's local-only note behind the unreadable count. One line for
	// the group: a session has no path to name, and the count is the fact.
	if (encodingInvalid)
		stats.unreadableFiles.push({
			path: `${encodingInvalid} session${encodingInvalid === 1 ? "" : "s"} skipped`,
			reason: "non-UTF-8 payload",
		});
	readDone(
		`${stats.filesRead}/${stats.filesFound} sessions read, ${stats.filesUnreadable} unreadable${out.complete ? "" : ", incomplete"}`,
		out.complete ? "success" : "warn",
	);
	return out;
}

async function globalDbSize(root: string): Promise<string> {
	try {
		const info = await stat(globalDb(root));
		return `${(info.size / 1_048_576).toFixed(0)} MB`;
	} catch {
		return "absent";
	}
}

function isPageByteLimit(error: unknown): boolean {
	const details = asObj(asObj(error)?.details);
	return (
		traceErrorCode(error) === "SOURCE_LIMIT_EXCEEDED" &&
		details?.sourceKind === "sqlite" &&
		details.bound === "sqlite-page-bytes"
	);
}
