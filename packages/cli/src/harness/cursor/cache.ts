import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { asObj } from "../shared/aggregate.js";
import { type Account, digest, fetchWindow } from "./account.js";
import { type Contribution, count, timestamp } from "./evidence.js";

export type CachedWindow = {
	from: number;
	to: number;
	fetchedAt: number;
	events: Contribution[];
};
export type CursorCache = {
	version: 1;
	account: string | null;
	windows: Record<string, CachedWindow>;
	local: Contribution[];
	sessions: string[];
};
export const emptyCache = (): CursorCache => ({
	version: 1,
	account: null,
	windows: {},
	local: [],
	sessions: [],
});
export const cacheFile = (root: string, store: string) =>
	path.join(
		homedir(),
		".config",
		"aistack",
		"cursor",
		`${digest(`${root}\0${store}`)}.json`,
	);

function validContribution(value: unknown): value is Contribution {
	const row = asObj(value);
	const buckets = asObj(row?.buckets);
	return (
		!!row &&
		typeof row.session === "string" &&
		typeof row.model === "string" &&
		timestamp(row.tsMs) !== null &&
		(row.id === undefined || typeof row.id === "string") &&
		(row.source === "api" || row.source === "local") &&
		!!buckets &&
		["input", "output", "cacheRead", "cacheWrite"].every(
			(k) => buckets[k] === undefined || count(buckets[k]) !== undefined,
		)
	);
}
export async function loadCache(
	file: string,
): Promise<{ value: CursorCache; complete: boolean }> {
	try {
		const raw = asObj(JSON.parse(await readFile(file, "utf8")));
		const windows = asObj(raw?.windows);
		if (
			raw?.version !== 1 ||
			!(raw.account === null || typeof raw.account === "string") ||
			!Array.isArray(raw.sessions) ||
			!raw.sessions.every((id) => typeof id === "string") ||
			!Array.isArray(raw.local) ||
			!raw.local.every(validContribution) ||
			!windows
		)
			throw new Error("Invalid cache");
		for (const value of Object.values(windows)) {
			const w = asObj(value);
			if (
				!w ||
				timestamp(w.from) === null ||
				timestamp(w.to) === null ||
				timestamp(w.fetchedAt) === null ||
				!Array.isArray(w.events) ||
				!w.events.every(validContribution)
			)
				throw new Error("Invalid window");
		}
		return { value: raw as CursorCache, complete: true };
	} catch (error) {
		return {
			value: emptyCache(),
			complete: (error as NodeJS.ErrnoException).code === "ENOENT",
		};
	}
}
export async function saveCache(
	file: string,
	value: CursorCache,
): Promise<void> {
	await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
	const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
	await rename(temporary, file);
}

const WINDOW_MS = 30 * 86_400_000;
/** Complete normalized windows replace atomically. ID-less multiplicity is never hashed away. */
export async function refreshAccount(input: {
	cache: CursorCache;
	account: Account | null;
	sinceMs: number;
	now: number;
	sessionIds: Set<string>;
	fetchImpl?: typeof fetch;
}): Promise<CursorCache> {
	const { cache, account, now, sessionIds } = input;
	if (!account) return cache;
	const changed = cache.account !== account.scope;
	const next: CursorCache = {
		...cache,
		account: account.scope,
		windows: changed ? {} : { ...cache.windows },
	};
	// A complete query can still omit activity older than the service's retention.
	// Preserve empty historical windows previously populated; refresh today's window normally.
	for (
		let from = Math.floor(input.sinceMs / WINDOW_MS) * WINDOW_MS;
		from <= now;
		from += WINDOW_MS
	) {
		const to = Math.min(from + WINDOW_MS, now + 1);
		const key = String(from);
		const previous = next.windows[key];
		if (previous && now - previous.fetchedAt < 300_000) continue;
		try {
			const events = (
				await fetchWindow(account, from, to, input.fetchImpl)
			).filter((e) => sessionIds.has(e.session));
			if (previous?.events.length && events.length === 0 && to <= now) continue;
			next.windows[key] = { from, to, fetchedAt: now, events };
		} catch {
			// A first run may still publish complete local evidence. Existing enrichment survives.
			// Stop after an auth/network failure, rather than retrying every historical window.
			break;
		}
	}
	return next;
}
export function cachedEvents(
	cache: CursorCache,
	sessionIds: Set<string>,
): Contribution[] {
	const seen = new Set<string>();
	return Object.values(cache.windows)
		.sort((a, b) => b.fetchedAt - a.fetchedAt || b.from - a.from)
		.flatMap((w) => w.events)
		.filter((e) => {
			if (!sessionIds.has(e.session) || (e.id && seen.has(e.id))) return false;
			if (e.id) seen.add(e.id);
			return true;
		});
}
