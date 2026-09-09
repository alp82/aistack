import { createReadStream, type Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import { parse as parseToml } from "smol-toml";
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
					} catch {
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
		} catch {
			/* retry a transient read or parse failure */
		}
	}
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

export async function scan(
	agg: Aggregate,
	opts: {
		sinceMs?: number;
		roots?: string[];
		onProgress?: (files: number) => void;
	} = {},
): Promise<{
	stats: ScanStats;
	complete: boolean;
	sessionDates: Map<string, Set<string>>;
}> {
	const stats = emptyScanStats();
	const sessionDates = new Map<string, Set<string>>();
	const candidates = new Map<
		string,
		{ precedence: number; rows: UsageContribution[] }
	>();
	let complete = true;
	for (const root of opts.roots ?? sessionRoots()) {
		const aliases = await modelAliasesForRoot(root);
		const dirs = await directories(root);
		if (dirs === null) {
			complete = false;
			continue;
		}
		for (const dir of dirs) {
			let entries: Dirent[];
			try {
				entries = await readdir(dir, { withFileTypes: true });
			} catch {
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
				if (rows.length > 0) precedence = 2;
			}
			if (child) {
				rows = [];
				precedence = 0;
			}
			const eventState = createGrokEventState(parentSession);
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
						agg.parseErrors++;
						continue;
					}
					ingestUpdate(agg, eventState, value, projectDir, opts.sinceMs);
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
					if (value === null) agg.parseErrors++;
					else
						ingestEvent(
							agg,
							eventState,
							value,
							sessionFallback,
							projectDir,
							opts.sinceMs,
						);
				}
			}
			rows = rows.filter(
				(row) => opts.sinceMs === undefined || row.tsMs >= opts.sinceMs,
			);
			rows = rows.map((row) => ({
				...row,
				models: row.models.map(({ model, counts }) => ({
					model: aliases.get(model) ?? model,
					counts,
				})),
			}));
			if (rows.length > 0) {
				const sessionId = rows[0]?.sessionId as string;
				const held = candidates.get(sessionId);
				const total = (values: UsageContribution[]) =>
					values
						.flatMap((value) => value.models)
						.reduce((sum, model) => sum + countsTotal(model.counts), 0);
				if (
					!held ||
					precedence > held.precedence ||
					(precedence === held.precedence && total(rows) > total(held.rows))
				)
					candidates.set(sessionId, { precedence, rows });
			}
			opts.onProgress?.(stats.filesFound);
		}
	}
	for (const { rows } of candidates.values()) {
		for (const row of rows) {
			ingestContribution(agg, row);
			const dates = sessionDates.get(row.sessionId) ?? new Set<string>();
			dates.add(new Date(row.tsMs).toISOString().slice(0, 10));
			sessionDates.set(row.sessionId, dates);
		}
	}
	return { stats, complete, sessionDates };
}
