import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import type {
	Session,
	SessionReadContext,
	SourceReadLimitsOverride,
} from "cursor-history";
import {
	trace,
	traceEnabled,
	traceError,
	traceErrorCode,
	traceStartedAt,
	traceTimer,
} from "../../trace.js";
import { asObj, asStr } from "../shared/aggregate.js";
import { emptyScanStats, type ScanStats } from "../shared/window.js";
import {
	type LocalSession,
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
/** Supplemental read only for fields the selected reader flattens. No transcript parser. */
export async function readTokenEvidence(
	root: string,
	session: Session,
): Promise<Map<string, TokenEvidence>> {
	const out = new Map<string, TokenEvidence>();
	if (!session.messages.some((m) => m.identityOrigin?.startsWith("composer")))
		return out;
	const file = globalDb(root);
	if (!(await exists(file))) return out;
	const { DatabaseSync } = await import("node:sqlite");
	const db: Sqlite = new DatabaseSync(file, { readOnly: true });
	try {
		db.exec("BEGIN");
		const table = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cursorDiskKV'",
			)
			.get();
		if (!table) return out;
		const query = db.prepare(`SELECT json_object(
			'tokenCount', json_extract(value, '$.tokenCount'),
			'usage', json_extract(value, '$.usage'),
			'contextWindowStatusAtCreation', json_extract(value, '$.contextWindowStatusAtCreation'),
			'promptDryRunInfo', json_extract(value, '$.promptDryRunInfo')) AS evidence
			FROM cursorDiskKV WHERE key = ?`);
		for (const message of session.messages) {
			if (!message.id || message.identityOrigin !== "composer-native") continue;
			const row = query.get(`bubbleId:${session.id}:${message.id}`);
			if (typeof row?.evidence === "string")
				out.set(message.id, tokenEvidence(JSON.parse(row.evidence)));
		}
		// Older Composer headers can retain inline bubbles instead of split keys.
		const header = db
			.prepare(
				"SELECT json_extract(value, '$.conversation') AS conversation FROM cursorDiskKV WHERE key = ?",
			)
			.get(`composerData:${session.id}`);
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
	} finally {
		db.close();
	}
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
	{ stamp: string; read: Promise<LocalRead> }
>();

/** Tests only: forget the reads this process made. */
export function forgetLocalReads(): void {
	localReads.clear();
}

/** Errors never escape with paths, prompts or database values. */
export async function readLocal(
	root = dataPath(),
	onProgress?: (files: number, total?: number) => void,
): Promise<LocalRead> {
	const held = localReads.get(root);
	if (held) {
		trace("cursor · reusing this run's history read");
		return held.read;
	}
	// Nothing to walk, nothing to remember: an install that appears later in
	// the same process (tests do this) must still be read.
	if (!(await hasLocalSource(root))) {
		trace("cursor · no local source");
		return { sessions: [], complete: true, stats: emptyScanStats() };
	}
	const stamp = await sourceStamp(root);
	const read = readLocalOffThread(root, stamp, onProgress);
	localReads.set(root, { stamp, read });
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
				trace: traceEnabled(),
				traceStartedAt: traceStartedAt(),
			},
		});
		worker.on("message", (message: CursorWorkerMessage) => {
			if (message.kind === "progress")
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
				fallback();
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
	| { kind: "result"; read: LocalRead }
	| { kind: "error" };

/** The read itself, on whichever thread called it. */
export async function readLocalOnce(
	root: string,
	before: string | undefined,
	onProgress?: (files: number, total?: number) => void,
	sourceReadLimits?: SourceReadLimitsOverride,
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
	let retrySmallPage = false;
	let unresolved = 0;
	let corrupted = 0;
	let ambiguous = 0;
	let stage = "reader setup";
	const signal = AbortSignal.timeout(120_000);
	try {
		const reader = await import("cursor-history");
		const options = {
			dataPath: root,
			sqliteDriver: "node:sqlite" as const,
			onDiagnostic: (diagnostic: { code?: string }) => {
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
			pageDone(`${page.data.length} of ${page.pagination.total} sessions`);
			if (offset === 0) onProgress?.(0, page.pagination.total);
			for (const summary of page.data) {
				stats.filesFound++;
				if (summary.resolutionState === "ambiguous") {
					out.complete = false;
				}
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
					const tokens = await readTokenEvidence(root, session);
					out.sessions.push({ session, tokens });
					stats.filesRead++;
					onProgress?.(stats.filesRead, page.pagination.total);
				} catch (error) {
					if (isPageByteLimit(error)) throw error;
					if (traceErrorCode(error) === "SESSION_AMBIGUOUS") ambiguous++;
					else traceError(`cursor ${stage}`, error, "warn");
					out.complete = false;
					stats.filesUnreadable++;
				} finally {
					context.releaseSession(summary.id);
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
		traceError(`cursor ${stage}`, error);
		if (signal.aborted)
			traceError("cursor read deadline", signal.reason, "warn");
		retrySmallPage =
			isPageByteLimit(error) && sourceReadLimits?.sqlitePageRows !== 1;
		stats.unreadableFiles.push({
			path: "history",
			reason: traceErrorCode(error),
		});
		out.complete = false;
		stats.filesUnreadable++;
	} finally {
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
		return readLocalOnce(root, before, onProgress, {
			...sourceReadLimits,
			sqlitePageRows: 1,
		});
	}
	if (before !== (await sourceStamp(root))) {
		trace(
			"cursor history incomplete · database changed during the read",
			"warn",
		);
		out.complete = false;
	}
	if (unresolved || corrupted || ambiguous) {
		trace(
			`cursor partial history · ${unresolved} sessions unresolved, ${corrupted} with corrupted messages, ${ambiguous} skipped with conflicting copies${ambiguous ? " (SESSION_AMBIGUOUS)" : ""} · available dated usage retained`,
			"warn",
		);
	}
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
