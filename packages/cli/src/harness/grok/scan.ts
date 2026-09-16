import { createReadStream, type Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import { parse as parseToml } from "smol-toml";
import { trace, traceError } from "../../trace.js";
import { asObj, asStr, countsTotal } from "../shared/aggregate.js";
import { emptyScanStats, type ScanStats } from "../shared/window.js";
import type { Aggregate } from "./analyzer.js";
import {
	createGrokEventState,
	ingestContribution,
	ingestEvent,
	ingestUpdate,
	sidecarContributions,
	terminalContribution,
	type UsageContribution,
} from "./analyzer.js";
import { retainedContextCalls } from "./context.js";

export function sessionRoots(): string[] {
	return [
		path.join(
			process.env.GROK_HOME || path.join(homedir(), ".grok"),
			"sessions",
		),
	];
}

export const isGrokEvidenceFile = (name: string): boolean =>
	name === "usage.json" || name === "updates.jsonl" || name === "events.jsonl";

type FileRead = { lines?: unknown[]; json?: unknown; complete: boolean };
const delays = [0, 100, 300];
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function stableRead(file: string, jsonl: boolean): Promise<FileRead> {
	for (const delay of delays) {
		if (delay) await pause(delay);
		try {
			const before = await stat(file);
			if (!before.isFile()) return { complete: false };
			if (jsonl) {
				const lines: unknown[] = [];
				const input = readline.createInterface({
					input: createReadStream(file),
					crlfDelay: Infinity,
				});
				for await (const line of input) {
					if (!line.trim()) continue;
					try {
						lines.push(JSON.parse(line));
					} catch (error) {
						if (!lines.includes(null))
							traceError("grok evidence JSON (first failure)", error, "warn");
						lines.push(null);
					}
				}
				const after = await stat(file);
				if (before.size === after.size && before.mtimeMs === after.mtimeMs)
					return { lines, complete: true };
			} else {
				const raw = await readFile(file, "utf8");
				const after = await stat(file);
				if (before.size === after.size && before.mtimeMs === after.mtimeMs)
					return { json: JSON.parse(raw), complete: true };
			}
		} catch (error) {
			traceError("grok evidence read (will retry)", error, "warn");
			/* retry a transient read or parse failure */
		}
	}
	trace("grok evidence incomplete · retries exhausted", "error");
	return { complete: false };
}

async function directories(root: string): Promise<string[] | null> {
	try {
		const workspaces = await readdir(root, { withFileTypes: true });
		const out: string[] = [];
		for (const workspace of workspaces) {
			if (!workspace.isDirectory() || workspace.isSymbolicLink()) continue;
			const workspacePath = path.join(root, workspace.name);
			for (const session of await readdir(workspacePath, {
				withFileTypes: true,
			})) {
				if (session.isDirectory() && !session.isSymbolicLink())
					out.push(path.join(workspacePath, session.name));
			}
		}
		return out.sort();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT")
			traceError("grok session discovery", error);
		return (error as NodeJS.ErrnoException).code === "ENOENT" ? [] : null;
	}
}

/**
 * Read only aliases that still use xAI's normal endpoint. Routing overrides
 * remain under their recorded alias because no vendor rate is established.
 */
export async function modelAliasesForRoot(
	root: string,
): Promise<ReadonlyMap<string, string>> {
	if (process.env.GROK_MODELS_BASE_URL) return new Map();
	try {
		const parsed = asObj(
			parseToml(await readFile(path.join(root, "..", "config.toml"), "utf8")),
		);
		if (!parsed || asObj(parsed.endpoints)?.models_base_url) return new Map();
		const models = asObj(parsed.model);
		const aliases = new Map<string, string>();
		for (const [alias, raw] of Object.entries(models ?? {})) {
			const entry = asObj(raw);
			const model = entry && asStr(entry.model);
			if (!model || entry?.base_url || entry?.model_provider) continue;
			aliases.set(alias, model);
		}
		return aliases;
	} catch {
		return new Map();
	}
}

export type ScanWindow = {
	aggregate: Aggregate;
	sinceMs?: number;
	onProgress?: (files: number) => void;
};
export type ScanOptions = {
	sinceMs?: number;
	roots?: string[];
	onProgress?: (files: number) => void;
	contextCacheDir?: string;
};
export type ScanResult = {
	stats: ScanStats;
	complete: boolean;
	sessionDates: Map<string, Set<string>>;
};

export async function scan(
	agg: Aggregate,
	opts: ScanOptions = {},
): Promise<ScanResult> {
	return (
		await scanWindows(
			[{ aggregate: agg, sinceMs: opts.sinceMs, onProgress: opts.onProgress }],
			opts,
		)
	)[0];
}

/** Each stable file read feeds both folds before its parsed records are released. */
export async function scanWindows(
	windows: ScanWindow[],
	opts: ScanOptions = {},
): Promise<ScanResult[]> {
	const stats = emptyScanStats();
	const targets = windows.map((window) => ({
		...window,
		sessionDates: new Map<string, Set<string>>(),
		candidates: new Map<
			string,
			{ precedence: number; rows: UsageContribution[] }
		>(),
	}));
	let complete = true;
	for (const root of opts.roots ?? sessionRoots()) {
		const aliases = await modelAliasesForRoot(root);
		const contextSessions = new Map<
			string,
			{ projectDir: string; parentSession?: string }
		>();
		const dirs = await directories(root);
		if (dirs === null) {
			complete = false;
			continue;
		}
		for (const dir of dirs) {
			let entries: Dirent[];
			try {
				entries = await readdir(dir, { withFileTypes: true });
			} catch (error) {
				traceError("grok session listing", error);
				complete = false;
				continue;
			}
			const files = new Map(
				entries
					.filter(
						(e) =>
							e.isFile() &&
							(isGrokEvidenceFile(e.name) || e.name === "summary.json"),
					)
					.map((e) => [e.name, path.join(dir, e.name)]),
			);
			let projectDir = dir;
			let sessionFallback = path.basename(dir);
			let child = false;
			let parentSession: string | undefined;
			const summary = files.get("summary.json");
			if (summary) {
				const read = await stableRead(summary, false);
				if (!read.complete) {
					complete = false;
					stats.filesUnreadable++;
					continue;
				}
				const value = asObj(read.json);
				const info = value && asObj(value.info);
				projectDir = asStr(info?.cwd) ?? asStr(value?.cwd) ?? dir;
				sessionFallback = asStr(value?.sessionId) ?? sessionFallback;
				parentSession =
					asStr(value?.parentSessionId) ??
					asStr(value?.parent_session_id) ??
					asStr(info?.parentSessionId) ??
					asStr(info?.parent_session_id) ??
					undefined;
				child = parentSession !== undefined;
			}
			contextSessions.set(sessionFallback, { projectDir, parentSession });
			let rows = [] as ReturnType<typeof sidecarContributions>;
			let precedence = 0;
			const usage = files.get("usage.json");
			if (usage) {
				stats.filesFound++;
				const read = await stableRead(usage, false);
				if (!read.complete) {
					complete = false;
					stats.filesUnreadable++;
					continue;
				}
				stats.filesRead++;
				rows = sidecarContributions(read.json, projectDir);
				if (rows.length > 0) {
					precedence = 2;
					for (const row of rows)
						contextSessions.set(row.sessionId, { projectDir, parentSession });
				}
			}
			if (child) {
				rows = [];
				precedence = 0;
			}
			const eventTargets = targets.map((target) => ({
				...target,
				eventState: createGrokEventState(parentSession),
			}));
			const updates = files.get("updates.jsonl");
			if (updates) {
				const useTerminalUsage = rows.length === 0 && !child;
				stats.filesFound++;
				const read = await stableRead(updates, true);
				if (!read.complete) {
					complete = false;
					stats.filesUnreadable++;
					continue;
				}
				stats.filesRead++;
				for (const value of read.lines ?? []) {
					if (value === null) {
						for (const { aggregate } of targets) aggregate.parseErrors++;
						continue;
					}
					for (const { aggregate, eventState, sinceMs } of eventTargets)
						ingestUpdate(aggregate, eventState, value, projectDir, sinceMs);
					if (useTerminalUsage) {
						const row = terminalContribution(value, projectDir);
						if (row) rows.push(row);
					}
				}
				if (rows.length > 0) precedence = 1;
			}
			const events = files.get("events.jsonl");
			if (events) {
				stats.filesFound++;
				const read = await stableRead(events, true);
				if (!read.complete) {
					complete = false;
					stats.filesUnreadable++;
					continue;
				}
				stats.filesRead++;
				for (const value of read.lines ?? []) {
					if (value === null)
						for (const { aggregate } of targets) aggregate.parseErrors++;
					else
						for (const { aggregate, eventState, sinceMs } of eventTargets)
							ingestEvent(
								aggregate,
								eventState,
								value,
								sessionFallback,
								projectDir,
								sinceMs,
							);
				}
			}
			for (const { sinceMs, candidates, onProgress } of targets) {
				let windowRows = rows.filter(
					(row) => sinceMs === undefined || row.tsMs >= sinceMs,
				);
				windowRows = windowRows.map((row) => ({
					...row,
					models: row.models.map(({ model, counts }) => ({
						model: aliases.get(model) ?? model,
						counts,
					})),
				}));
				if (windowRows.length > 0) {
					const sessionId = windowRows[0]?.sessionId as string;
					const held = candidates.get(sessionId);
					const total = (values: UsageContribution[]) =>
						values
							.flatMap((value) => value.models)
							.reduce((sum, model) => sum + countsTotal(model.counts), 0);
					if (
						!held ||
						precedence > held.precedence ||
						(precedence === held.precedence &&
							total(windowRows) > total(held.rows))
					)
						candidates.set(sessionId, { precedence, rows: windowRows });
				}
				onProgress?.(stats.filesFound);
			}
		}
		try {
			const calls = await retainedContextCalls(
				root,
				new Set(contextSessions.keys()),
				opts.contextCacheDir,
			);
			for (const { aggregate, sinceMs, sessionDates } of targets) {
				for (const call of calls) {
					if (sinceMs !== undefined && call.tsMs < sinceMs) continue;
					const source = contextSessions.get(call.session);
					aggregate.workflow.ingest({
						type: "response",
						session: call.session,
						projectWorkspace: source?.projectDir,
						parentSession: source?.parentSession,
						tsMs: call.tsMs,
						responseId: `context:${call.id}`,
						contextTokens: call.tokens,
					});
					const dates = sessionDates.get(call.session) ?? new Set<string>();
					dates.add(new Date(call.tsMs).toISOString().slice(0, 10));
					sessionDates.set(call.session, dates);
				}
			}
		} catch (error) {
			traceError("grok retained context", error);
			complete = false;
			stats.filesUnreadable++;
		}
	}
	for (const { aggregate, candidates, sessionDates } of targets) {
		for (const { rows } of candidates.values()) {
			for (const row of rows) {
				ingestContribution(aggregate, row);
				const dates = sessionDates.get(row.sessionId) ?? new Set<string>();
				dates.add(new Date(row.tsMs).toISOString().slice(0, 10));
				sessionDates.set(row.sessionId, dates);
			}
		}
	}
	return targets.map(({ sessionDates }) => ({ stats, complete, sessionDates }));
}
