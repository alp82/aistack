// The session cache (#452). A sync re-read every Cursor session on every
// run, and on a 20 GB database that was most of the run. A session the
// listing dates and counts exactly as the last run did has the same bubbles,
// so its slim projection is served from this file and its bubbles are never
// opened. Only a cleanly read session is stored: an unresolved or corrupted
// one is re-read every time, as before.

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import type { SessionSummary } from "cursor-history";
import { traceError } from "../../trace.js";
import { asObj } from "../shared/aggregate.js";
import { digest } from "./account.js";
import type {
	LocalSession,
	LocalSessionData,
	TokenEvidence,
} from "./evidence.js";

/** Bumped when the slim projection changes shape; an older file is ignored. */
export const SESSION_CACHE_FORMAT = 1;

export type SessionCacheEntry = {
	stamp: string;
	session: LocalSessionData;
	tokens: Record<string, TokenEvidence>;
};
export type SessionCache = Map<string, SessionCacheEntry>;

export const defaultSessionCacheDir = () =>
	path.join(homedir(), ".config", "aistack", "cursor");
export const sessionCacheFile = (dir: string, root: string, store: string) =>
	path.join(dir, `${digest(`${root}\0${store}`)}.sessions.json.gz`);

/**
 * What the listing vouches for: the newest stored moment, the bubble count
 * and the source stacks. Null when the entry dates nothing; such a session
 * cannot be told apart from its last read, so it is read every time.
 */
export function sessionStamp(
	summary: SessionSummary,
	newest: number | null,
): string | null {
	if (newest === null) return null;
	const count = (summary as { messageCount?: unknown }).messageCount;
	const sources = (summary as { sources?: unknown }).sources;
	return JSON.stringify([
		newest,
		typeof count === "number" ? count : null,
		Array.isArray(sources) ? sources : null,
		summary.resolutionState ?? null,
	]);
}

/** Whether a read session may be served from the cache next time. */
export function cacheable(local: LocalSession): boolean {
	return (
		local.session.resolutionState === "complete" &&
		!local.session.messages.some((m) => m.metadata?.corrupted)
	);
}

export function toEntry(stamp: string, local: LocalSession): SessionCacheEntry {
	return {
		stamp,
		session: local.session,
		tokens: Object.fromEntries(local.tokens),
	};
}
export function fromEntry(entry: SessionCacheEntry): LocalSession {
	return {
		session: entry.session,
		tokens: new Map(Object.entries(entry.tokens)),
	};
}

function validEntry(value: unknown): value is SessionCacheEntry {
	const entry = asObj(value);
	const session = asObj(entry?.session);
	return (
		!!entry &&
		typeof entry.stamp === "string" &&
		!!session &&
		typeof session.id === "string" &&
		typeof session.timestamp === "string" &&
		Array.isArray(session.messages) &&
		session.messages.every((m) => {
			const message = asObj(m);
			return (
				!!message &&
				(message.role === "user" || message.role === "assistant") &&
				typeof message.contentLength === "number" &&
				typeof message.timestamp === "string"
			);
		}) &&
		!!asObj(entry.tokens)
	);
}

/** An absent or unreadable file is an empty cache; the read goes on. */
export async function loadSessionCache(file: string): Promise<SessionCache> {
	const out: SessionCache = new Map();
	let raw: string;
	try {
		raw = gunzipSync(await readFile(file)).toString("utf8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT")
			traceError("cursor session cache read", error, "warn");
		return out;
	}
	try {
		const parsed = asObj(JSON.parse(raw));
		if (parsed?.format !== SESSION_CACHE_FORMAT) return out;
		const entries = asObj(parsed.sessions);
		if (!entries) return out;
		for (const [id, entry] of Object.entries(entries))
			if (validEntry(entry) && entry.session.id === id) out.set(id, entry);
	} catch (error) {
		traceError("cursor session cache read", error, "warn");
		out.clear();
	}
	return out;
}

export async function saveSessionCache(
	file: string,
	cache: SessionCache,
): Promise<void> {
	await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
	const body = gzipSync(
		JSON.stringify({
			format: SESSION_CACHE_FORMAT,
			sessions: Object.fromEntries(cache),
		}),
	);
	const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(temporary, body, { mode: 0o600 });
	await rename(temporary, file);
}
