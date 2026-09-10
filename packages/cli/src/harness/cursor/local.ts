import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { Session, SessionReadContext } from "cursor-history";
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
/** Errors never escape with paths, prompts or database values. */
export async function readLocal(
	root = dataPath(),
	onProgress?: (files: number) => void,
): Promise<LocalRead> {
	const stats = emptyScanStats();
	const out: LocalRead = { sessions: [], complete: true, stats };
	if (!(await hasLocalSource(root))) return out;
	const before = await sourceStamp(root);
	let context: SessionReadContext | undefined;
	try {
		const reader = await import("cursor-history");
		const options = {
			dataPath: root,
			sqliteDriver: "node:sqlite" as const,
			onDiagnostic: () => {
				out.complete = false;
			},
			signal: AbortSignal.timeout(120_000),
		};
		context = reader.createSessionReadContext(options);
		const config = { ...options, readContext: context };
		let offset = 0;
		while (true) {
			const page = await reader.listSessionSummaries({
				...config,
				offset,
				limit: 100,
			});
			for (const summary of page.data) {
				stats.filesFound++;
				if (summary.resolutionState === "ambiguous") {
					out.complete = false;
				}
				try {
					const session = await reader.getSession(summary.id, config);
					if (
						session.resolutionState !== "complete" ||
						session.messages.some((m) => m.metadata?.corrupted)
					)
						out.complete = false;
					const tokens = await readTokenEvidence(root, session);
					out.sessions.push({ session, tokens });
					stats.filesRead++;
					onProgress?.(stats.filesRead);
				} catch {
					out.complete = false;
					stats.filesUnreadable++;
				} finally {
					context.releaseSession(summary.id);
				}
			}
			if (!page.pagination.hasMore) break;
			if (page.data.length === 0 || offset >= 100_000) {
				out.complete = false;
				break;
			}
			offset += page.data.length;
		}
	} catch {
		out.complete = false;
		stats.filesUnreadable++;
	} finally {
		try {
			await context?.dispose();
		} catch {
			out.complete = false;
		}
	}
	if (before !== (await sourceStamp(root))) out.complete = false;
	return out;
}
