// I/O shell around the pure opencode analyzer: find `opencode*.db`, open it
// read-only with node:sqlite, project NAMED COLUMNS through json_extract, and
// hand plain values to the fold. Nothing leaves this machine.
//
// Wayfinder ticket #124 (map #121), semantics from
// docs/research/harness-adapters-2026-08.md (§opencode).
//
// STANDING NON-GOAL (locked in #13): raw transcripts, prompts, absolute paths
// and repo names never leave the machine. The SAME FILE this module opens
// also holds `account.refresh_token`, `credential.value`,
// `session_input.prompt` and full file contents in `session.summary_diffs`
// and `part.data.state.output`. The rule that keeps them out: never
// `SELECT *` — every query names its columns, and `part.data` reaches JS only
// as four json_extract'ed scalars. Errors are swallowed, not thrown, because
// a node:sqlite error message carries the DB path.

import { readFileSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import { emptyScanStats, type ScanStats } from "../shared/window.js";
import {
	type Aggregate,
	createDbFoldState,
	type DbFoldState,
	ingestMessageRow,
	ingestToolPart,
	noteConfiguredMcpServers,
	noteSessions,
} from "./analyzer.js";

/**
 * Newest migration id this build understands, from the probe DB (research
 * §1). A DB migrated past it may hold the same table names with different
 * semantics, so it counts as UNREADABLE — a visible coverage figure — rather
 * than being read on the guess that nothing moved.
 */
export const OPENCODE_MIGRATION_CEILING = 20260622202450;

/** `$XDG_DATA_HOME/opencode` or `~/.local/share/opencode` — opencode's own rule. */
export function opencodeDataDirs(): string[] {
	const xdg = process.env.XDG_DATA_HOME;
	const base = xdg || path.join(homedir(), ".local", "share");
	return [path.join(base, "opencode")];
}

/**
 * The store is `opencode.db` on release channels, `opencode-<channel>.db`
 * otherwise, and `$OPENCODE_DB` overrides both. WAL siblings (`-wal`,
 * `-shm`) are opened by SQLite itself, never listed as stores.
 */
function isStoreFile(basename: string): boolean {
	return basename === "opencode.db" || /^opencode-[^/]+\.db$/.test(basename);
}

async function dbFilesIn(root: string): Promise<string[]> {
	const override = process.env.OPENCODE_DB;
	if (override) return [override];
	try {
		const entries = await readdir(root, { withFileTypes: true });
		return entries
			.filter((e) => e.isFile() && isStoreFile(e.name))
			.map((e) => path.join(root, e.name))
			.sort();
	} catch {
		return [];
	}
}

// ---------------------------------------------------------------------------
// node:sqlite, feature-detected
// ---------------------------------------------------------------------------

type SqliteDb = {
	prepare(sql: string): {
		all(...params: unknown[]): Record<string, unknown>[];
		get(...params: unknown[]): Record<string, unknown> | undefined;
	};
	close(): void;
};

/**
 * `node:sqlite` landed in Node 22.5 while this CLI's floor is 18, so it is
 * feature-detected in the shape of the codex scanner's zstd check. On a
 * runtime without it, a found DB counts as unreadable — a visible coverage
 * figure, never a silent skip.
 */
async function loadSqlite(): Promise<((file: string) => SqliteDb) | null> {
	try {
		const mod = (await import("node:sqlite")) as {
			DatabaseSync: new (file: string, opts: { readOnly: boolean }) => SqliteDb;
		};
		if (typeof mod.DatabaseSync !== "function") return null;
		return (file) => new mod.DatabaseSync(file, { readOnly: true });
	} catch {
		return null;
	}
}

/**
 * A read failure classified WITHOUT the error object's message or stack —
 * both can carry the absolute DB path, which never leaves this module.
 */
function errorClass(e: unknown): string {
	const code = (e as { code?: unknown } | null)?.code;
	if (typeof code === "string" && code.length > 0) return code;
	return e instanceof Error ? e.constructor.name : "unknown";
}

const readError = (reason: string): Error =>
	Object.assign(new Error(reason), { code: reason });

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

export type ScanOptions = {
	/** Only count records with a timestamp at or after this epoch ms. */
	sinceMs?: number;
	onProgress?: (files: number) => void;
	/** Override the discovered data dirs. Tests only. */
	roots?: string[];
	/** Override the opencode.json path. Tests only. */
	configFile?: string;
};

export async function scan(
	agg: Aggregate,
	opts: ScanOptions = {},
): Promise<ScanStats> {
	const stats: ScanStats = emptyScanStats();
	const open = await loadSqlite();
	const sinceMs = opts.sinceMs ?? 0;

	const state = createDbFoldState();
	readConfiguredMcpServers(agg, state, opts.configFile);

	for (const root of opts.roots ?? opencodeDataDirs()) {
		for (const file of await dbFilesIn(root)) {
			stats.filesFound++;
			agg.files++;
			try {
				if (open === null) throw readError("sqlite-unsupported");
				readDb(agg, state, open, file, sinceMs);
				stats.filesRead++;
			} catch (e) {
				stats.filesUnreadable++;
				stats.unreadableFiles.push({
					path: path.basename(file),
					reason: errorClass(e),
				});
			}
			if (opts.onProgress) opts.onProgress(stats.filesFound);
		}
	}
	return stats;
}

/** Refuse a DB whose newest migration this build has never seen. */
function checkMigrationCeiling(db: SqliteDb): void {
	let newest: unknown;
	try {
		newest = db.prepare("select max(id) as id from migration").get()?.id;
	} catch {
		throw readError("schema-unversioned");
	}
	const prefix = Number.parseInt(String(newest ?? ""), 10);
	if (!Number.isFinite(prefix)) throw readError("schema-unversioned");
	if (prefix > OPENCODE_MIGRATION_CEILING) throw readError("schema-too-new");
}

function readDb(
	agg: Aggregate,
	state: DbFoldState,
	open: (file: string) => SqliteDb,
	file: string,
	sinceMs: number,
): void {
	const db = open(file);
	try {
		checkMigrationCeiling(db);

		noteSessions(
			state,
			db
				.prepare("select id, parent_id, version from session")
				.all()
				.map((r) => ({ id: r.id, parentId: r.parent_id, version: r.version })),
		);

		// v1 messages. `time.created` (epoch ms, in the blob) prices the
		// response; the indexed integer column runs the window filter and backs
		// a blob whose clock field is missing or malformed.
		const v1 = db.prepare(
			`select id, session_id, time_created,
				json_extract(data, '$.role') as role,
				json_extract(data, '$.providerID') as provider_id,
				json_extract(data, '$.modelID') as model_id,
				json_extract(data, '$.time.created') as ts_ms,
				json_extract(data, '$.tokens.input') as tok_input,
				json_extract(data, '$.tokens.output') as tok_output,
				json_extract(data, '$.tokens.cache.read') as tok_cache_read,
				json_extract(data, '$.tokens.cache.write') as tok_cache_write,
				json_extract(data, '$.path.cwd') as cwd
			from message where time_created >= ?`,
		);
		for (const r of v1.all(sinceMs)) {
			agg.lines++;
			ingestMessageRow(agg, state, {
				id: r.id,
				sessionId: r.session_id,
				role: r.role,
				providerId: r.provider_id,
				modelId: r.model_id,
				tsMs: pickTs(r.ts_ms, r.time_created),
				input: r.tok_input,
				output: r.tok_output,
				cacheRead: r.tok_cache_read,
				cacheWrite: r.tok_cache_write,
				cwd: r.cwd,
			});
		}

		// v2 (`session_message`) — the other live generation (research §1: which
		// one current opencode writes is unproven, so both are read and message
		// ids dedup across them). The assistant shape differs: `model: {id,
		// providerID}`, role in the `type` column.
		const v2 = db.prepare(
			`select id, session_id, type, time_created,
				json_extract(data, '$.model.providerID') as provider_id,
				json_extract(data, '$.model.id') as model_id,
				json_extract(data, '$.time.created') as ts_ms,
				json_extract(data, '$.tokens.input') as tok_input,
				json_extract(data, '$.tokens.output') as tok_output,
				json_extract(data, '$.tokens.cache.read') as tok_cache_read,
				json_extract(data, '$.tokens.cache.write') as tok_cache_write,
				json_extract(data, '$.path.cwd') as cwd
			from session_message where time_created >= ?`,
		);
		for (const r of v2.all(sinceMs)) {
			agg.lines++;
			ingestMessageRow(agg, state, {
				id: r.id,
				sessionId: r.session_id,
				role: r.type,
				providerId: r.provider_id,
				modelId: r.model_id,
				tsMs: pickTs(r.ts_ms, r.time_created),
				input: r.tok_input,
				output: r.tok_output,
				cacheRead: r.tok_cache_read,
				cacheWrite: r.tok_cache_write,
				cwd: r.cwd,
			});
		}

		// v1 tool parts. Only these four scalar paths of `part.data` ever reach
		// JS — `$.state.output` holds full command output and stays in SQLite.
		const parts = db.prepare(
			`select id,
				json_extract(data, '$.type') as part_type,
				json_extract(data, '$.tool') as tool,
				json_extract(data, '$.callID') as call_id,
				json_extract(data, '$.state.input.name') as input_name,
				json_extract(data, '$.state.input.subagent_type') as subagent_type
			from part
			where time_created >= ? and json_extract(data, '$.type') = 'tool'`,
		);
		for (const r of parts.all(sinceMs)) {
			agg.lines++;
			ingestToolPart(agg, state, {
				id: r.id,
				partType: r.part_type,
				tool: r.tool,
				callId: r.call_id,
				inputName: r.input_name,
				subagentType: r.subagent_type,
			});
		}

		// v2 inline tool content, same named-scalar rule via json_each. The v2
		// content shape is unverified on any real machine, so a query error here
		// is tolerated — the tokens above are the load-bearing read.
		try {
			const v2parts = db.prepare(
				`select sm.id || ':' || je.key as id,
					json_extract(je.value, '$.type') as part_type,
					json_extract(je.value, '$.tool') as tool,
					json_extract(je.value, '$.callID') as call_id,
					json_extract(je.value, '$.state.input.name') as input_name,
					json_extract(je.value, '$.state.input.subagent_type') as subagent_type
				from session_message sm, json_each(sm.data, '$.content') je
				where sm.time_created >= ? and sm.type = 'assistant'`,
			);
			for (const r of v2parts.all(sinceMs)) {
				ingestToolPart(agg, state, {
					id: r.id,
					partType: r.part_type,
					tool: r.tool,
					callId: r.call_id,
					inputName: r.input_name,
					subagentType: r.subagent_type,
				});
			}
		} catch {
			/* v2 content unreadable — the message tokens already counted */
		}
	} finally {
		try {
			db.close();
		} catch {
			/* already closed or never opened fully */
		}
	}
}

/** The blob's own clock when it is a finite number, else the indexed column. */
function pickTs(jsonTs: unknown, columnTs: unknown): number | null {
	if (typeof jsonTs === "number" && Number.isFinite(jsonTs)) return jsonTs;
	if (typeof columnTs === "number" && Number.isFinite(columnTs))
		return columnTs;
	// node:sqlite may hand integers back as bigint depending on flags.
	if (typeof columnTs === "bigint") return Number(columnTs);
	if (typeof jsonTs === "bigint") return Number(jsonTs);
	return null;
}

// ---------------------------------------------------------------------------
// Config — the static MCP inventory
// ---------------------------------------------------------------------------

/** `$XDG_CONFIG_HOME/opencode/opencode.json` or `~/.config/opencode/opencode.json`. */
export function opencodeConfigFile(): string {
	const xdg = process.env.XDG_CONFIG_HOME;
	const base = xdg || path.join(homedir(), ".config");
	return path.join(base, "opencode", "opencode.json");
}

/**
 * The real config is JSONC — comments and trailing commas (research
 * §inventory) — so `JSON.parse` alone throws on it. The strip below is
 * string-aware: a `//` inside a quoted URL survives. Any remaining parse
 * failure is silence, not an error: the observed half of the MCP inventory
 * stands on its own.
 */
function readConfiguredMcpServers(
	agg: Aggregate,
	state: DbFoldState,
	configFile?: string,
): void {
	const file = configFile ?? opencodeConfigFile();
	try {
		const parsed: unknown = JSON.parse(stripJsonc(readFileSync(file, "utf8")));
		const mcp = (parsed as { mcp?: unknown } | null)?.mcp;
		if (mcp && typeof mcp === "object" && !Array.isArray(mcp)) {
			noteConfiguredMcpServers(agg, state, Object.keys(mcp));
		}
	} catch {
		return;
	}
}

export function stripJsonc(text: string): string {
	let out = "";
	let i = 0;
	let inString = false;
	while (i < text.length) {
		const ch = text[i];
		const next = text[i + 1];
		if (inString) {
			out += ch;
			if (ch === "\\") {
				out += next ?? "";
				i += 2;
				continue;
			}
			if (ch === '"') inString = false;
			i++;
		} else if (ch === '"') {
			inString = true;
			out += ch;
			i++;
		} else if (ch === "/" && next === "/") {
			while (i < text.length && text[i] !== "\n") i++;
		} else if (ch === "/" && next === "*") {
			i += 2;
			while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
			i += 2;
		} else {
			out += ch;
			i++;
		}
	}
	// Trailing commas: `, }` and `, ]` with any whitespace between.
	return out.replace(/,(\s*[}\]])/g, "$1");
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Detection is a QUERY, not a stat walk (#101, research §6): every opencode
 * start — including `opencode --version` — touches the DB file, and the probe
 * machine showed a four-month gap between the file's mtime and the newest
 * real message. The indexed probe costs 0.02 ms.
 */
export async function detectOpencode(opts: {
	sinceMs: number;
	roots?: string[];
}): Promise<boolean> {
	const open = await loadSqlite();
	if (open === null) return false;

	for (const root of opts.roots ?? opencodeDataDirs()) {
		for (const file of await dbFilesIn(root)) {
			if (!(await exists(file))) continue;
			let db: SqliteDb | null = null;
			try {
				db = open(file);
				checkMigrationCeiling(db);
				const probe = (table: string) =>
					db
						?.prepare(
							`select 1 as hit from ${table} where time_created >= ? limit 1`,
						)
						.get(opts.sinceMs) !== undefined;
				if (probe("message") || probe("session_message")) return true;
			} catch {
				/* unreadable or foreign DB — not detection */
			} finally {
				try {
					db?.close();
				} catch {
					/* ignore */
				}
			}
		}
	}
	return false;
}

async function exists(p: string): Promise<boolean> {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
}
