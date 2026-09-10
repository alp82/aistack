import { createHash } from "node:crypto";
import { appendFile, mkdir, readdir, readFile, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { asObj, asStr } from "../shared/aggregate.js";

const DAY_MS = 86_400_000;
const hash = (value: string) =>
	createHash("sha256").update(value).digest("hex");

export type ContextCall = {
	id: string;
	session: string;
	tsMs: number;
	tokens: number;
};

/** Numeric projection of Grok's local inference log. Prompt tokens include caches. */
export function contextCall(value: unknown): ContextCall | null {
	const row = asObj(value);
	if (row?.src !== "shell" || row.msg !== "shell.turn.inference_done")
		return null;
	const session = asStr(row.sid);
	const ts = asStr(row.ts);
	const ctx = asObj(row.ctx);
	const tokens = ctx?.prompt_tokens;
	const loop = ctx?.loop_index;
	const tsMs = ts ? Date.parse(ts) : NaN;
	if (
		!session ||
		!Number.isFinite(tsMs) ||
		typeof tokens !== "number" ||
		!Number.isSafeInteger(tokens) ||
		tokens < 0 ||
		typeof loop !== "number" ||
		!Number.isSafeInteger(loop) ||
		loop < 0
	)
		return null;
	return {
		id: hash(JSON.stringify([session, tsMs, row.pid ?? null, loop, tokens])),
		session,
		tsMs,
		tokens,
	};
}

export function contextCacheDirectory(root: string): string {
	return path.join(
		homedir(),
		".config",
		"aistack",
		"grok-context",
		hash(path.resolve(root)),
	);
}

async function optionalRead(file: string): Promise<string> {
	try {
		return await readFile(file, "utf8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
		throw error;
	}
}

/**
 * Preserve only observed numeric calls, never raw log lines. Daily append files
 * tolerate concurrent readers appending the same call: the id deduplicates it.
 * Retention is independent of the requested display window. A short scan must
 * not erase calls that the next full sync needs after Grok rotates its log.
 */
export async function retainedContextCalls(
	root: string,
	sessions: ReadonlySet<string>,
	cacheDir = contextCacheDirectory(root),
	now = Date.now(),
): Promise<ContextCall[]> {
	const cutoff = now - 400 * DAY_MS;
	const calls = new Map<string, ContextCall>();
	let files: string[] = [];
	try {
		files = await readdir(cacheDir);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
	}
	for (const file of files) {
		if (!/^\d{4}-\d{2}-\d{2}\.jsonl$/.test(file)) continue;
		if (Date.parse(file.slice(0, 10)) + DAY_MS < cutoff) {
			await unlink(path.join(cacheDir, file)).catch(
				(error: NodeJS.ErrnoException) => {
					if (error.code !== "ENOENT") throw error;
				},
			);
			continue;
		}
		const raw = await optionalRead(path.join(cacheDir, file));
		// A partial cache write cannot silently replace a previously published day.
		if (raw && !raw.endsWith("\n"))
			throw new Error("Incomplete Grok context cache");
		for (const line of raw.split("\n").filter(Boolean)) {
			const call = asObj(JSON.parse(line));
			if (
				!call ||
				typeof call.id !== "string" ||
				!/^[a-f0-9]{64}$/.test(call.id) ||
				typeof call.session !== "string" ||
				typeof call.tsMs !== "number" ||
				!Number.isFinite(call.tsMs) ||
				typeof call.tokens !== "number" ||
				!Number.isSafeInteger(call.tokens) ||
				call.tokens < 0
			)
				throw new Error("Invalid Grok context cache");
			if (call.tsMs >= cutoff && call.tsMs <= now)
				calls.set(call.id, {
					id: call.id,
					session: call.session,
					tsMs: call.tsMs,
					tokens: call.tokens,
				});
		}
	}
	const raw = await optionalRead(
		path.join(root, "..", "logs", "unified.jsonl"),
	);
	const additions = new Map<string, string[]>();
	// Grok can be appending a line while we read. Pick it up on the next sync.
	for (const line of raw.slice(0, raw.lastIndexOf("\n") + 1).split("\n")) {
		let value: unknown;
		try {
			value = JSON.parse(line);
		} catch {
			continue;
		}
		const call = contextCall(value);
		if (
			!call ||
			!sessions.has(call.session) ||
			call.tsMs < cutoff ||
			call.tsMs > now ||
			calls.has(call.id)
		)
			continue;
		calls.set(call.id, call);
		const date = new Date(call.tsMs).toISOString().slice(0, 10);
		const lines = additions.get(date) ?? [];
		lines.push(JSON.stringify(call));
		additions.set(date, lines);
	}
	if (additions.size) {
		await mkdir(cacheDir, { recursive: true, mode: 0o700 });
		for (const [date, lines] of additions) {
			await appendFile(
				path.join(cacheDir, `${date}.jsonl`),
				`${lines.join("\n")}\n`,
				{ mode: 0o600 },
			);
		}
	}
	return [...calls.values()]
		.filter((call) => sessions.has(call.session))
		.sort((a, b) => a.tsMs - b.tsMs || a.id.localeCompare(b.id));
}
