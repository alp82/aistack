import { createHash } from "node:crypto";
import { trace, traceError, traceErrorCode } from "../../trace.js";
import { asObj, asStr } from "../shared/aggregate.js";
import { type Contribution, count, timestamp } from "./evidence.js";
import { globalDb } from "./local.js";

export type Account = { scope: string; cookie: string };
export const digest = (value: string) =>
	createHash("sha256").update(value).digest("hex");
/** Only the credential already stored in SQLite is unattended on every platform.
 * Keychain APIs may display an OS prompt, so this path deliberately never calls them.
 */
export async function existingAccount(root: string): Promise<Account | null> {
	let db: import("node:sqlite").DatabaseSync | undefined;
	try {
		const { DatabaseSync } = await import("node:sqlite");
		db = new DatabaseSync(globalDb(root), { readOnly: true });
		const row = db
			.prepare("SELECT value FROM ItemTable WHERE key = ?")
			.get("cursorAuth/accessToken");
		if (typeof row?.value !== "string") return null;
		const token = row.value.trim().replace(/^"|"$/g, "");
		const claims = asObj(
			JSON.parse(
				Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
			),
		);
		const subject = asStr(claims?.sub);
		if (
			!subject ||
			claims?.type === "api_key_token" ||
			!/^[\w|:-]+$/.test(subject) ||
			!/^[A-Za-z0-9_.-]+$/.test(token)
		)
			return null;
		const user = subject.split("|").at(-1);
		if (!user) return null;
		// Expired access still identifies the account, so it cannot fall back to a different account cache.
		return { scope: digest(subject), cookie: `${user}%3A%3A${token}` };
	} catch (error) {
		traceError("cursor account lookup", error, "warn");
		return null;
	} finally {
		db?.close();
	}
}

export function apiContribution(value: unknown): Contribution | null {
	const raw = asObj(value);
	if (!raw)
		throw Object.assign(new Error("Invalid Cursor event"), {
			code: "CURSOR_INVALID_EVENT",
		});
	const session = asStr(raw.conversationId);
	if (!session || raw.cloudAgentId || session.startsWith("bc-")) return null;
	const tsMs = timestamp(raw.timestamp);
	const usage = raw.tokenUsage == null ? {} : asObj(raw.tokenUsage);
	if (tsMs === null || !usage)
		throw Object.assign(new Error("Invalid Cursor event"), {
			code: "CURSOR_INVALID_EVENT",
		});
	const buckets: Contribution["buckets"] = {};
	for (const [key, field] of [
		["input", "inputTokens"],
		["output", "outputTokens"],
		["cacheRead", "cacheReadTokens"],
		["cacheWrite", "cacheWriteTokens"],
	] as const) {
		if (usage[field] === undefined || usage[field] === null) continue;
		const value = count(usage[field]);
		if (value === undefined)
			throw Object.assign(new Error("Invalid Cursor token bucket"), {
				code: "CURSOR_INVALID_TOKEN_BUCKET",
			});
		buckets[key] = value;
	}
	const id = asStr(raw.id) ?? asStr(raw.eventId);
	return {
		session,
		...(id ? { id } : {}),
		tsMs,
		model: asStr(raw.model) ?? "unknown",
		buckets,
		source: "api",
	};
}

/** Split capped windows into disjoint millisecond ranges. Only a complete query
 * escapes; a failed child cannot replace previously cached evidence.
 */
export async function fetchWindow(
	account: Account,
	from: number,
	to: number,
	fetchImpl: typeof fetch = fetch,
): Promise<Contribution[]> {
	const budget = { requests: 0, signal: AbortSignal.timeout(300_000) };
	async function read(start: number, end: number): Promise<Contribution[]> {
		try {
			return await fetchPages(account, start, end, fetchImpl, budget);
		} catch (error) {
			if (traceErrorCode(error) !== "CURSOR_PAGE_LIMIT" || end - start <= 1)
				throw error;
			const middle = start + Math.floor((end - start) / 2);
			trace("cursor account usage · splitting capped date window");
			const left = await read(start, middle);
			const right = await read(middle, end);
			return [...left, ...right];
		}
	}
	return read(from, to);
}

async function fetchPages(
	account: Account,
	from: number,
	to: number,
	fetchImpl: typeof fetch,
	budget: { requests: number; signal: AbortSignal },
): Promise<Contribution[]> {
	const out: Contribution[] = [];
	const pages = new Set<string>();
	const eventIds = new Set<string>();
	let total: number | undefined;
	let retrieved = 0;
	// Cursor supports 1000 events per page. Keep the same 10000-event
	// split threshold while avoiding ten network round trips per 1000 rows.
	const pageSize = 1000;
	const maxPages = 10;
	for (let page = 1; page <= maxPages; page++) {
		budget.signal.throwIfAborted();
		if (++budget.requests > 100)
			throw Object.assign(new Error("Cursor request budget"), {
				code: "CURSOR_REQUEST_LIMIT",
			});
		const response = await fetchImpl(
			"https://cursor.com/api/dashboard/get-filtered-usage-events",
			{
				method: "POST",
				redirect: "error",
				signal: AbortSignal.any([budget.signal, AbortSignal.timeout(15_000)]),
				headers: {
					"Content-Type": "application/json",
					Origin: "https://cursor.com",
					Cookie: `WorkosCursorSessionToken=${account.cookie}`,
				},
				body: JSON.stringify({
					startDate: from,
					endDate: to - 1,
					page,
					pageSize,
				}),
			},
		);
		if (!response.ok)
			throw Object.assign(new Error("Cursor usage unavailable"), {
				status: response.status,
			});
		const payload = asObj(await response.json());
		// Cursor omits the array for an empty query ({}) or a count-only
		// terminal page. Accept only those envelopes, never an error object
		// or an explicitly malformed array. The count checks below still
		// reject empty pages that cannot account for all earlier results.
		const omitted =
			payload !== null &&
			!Object.hasOwn(payload, "usageEventsDisplay") &&
			Object.keys(payload).every((key) => key === "totalUsageEventsCount");
		const events = omitted ? [] : payload?.usageEventsDisplay;
		if (!Array.isArray(events))
			throw Object.assign(new Error("Invalid Cursor page"), {
				code: "CURSOR_INVALID_PAGE_SHAPE",
			});
		if (events.length > pageSize)
			throw Object.assign(new Error("Cursor page exceeds requested size"), {
				code: "CURSOR_PAGE_TOO_LARGE",
			});
		if (omitted || payload?.totalUsageEventsCount !== undefined) {
			const reported = count(
				omitted && !Object.hasOwn(payload, "totalUsageEventsCount")
					? 0
					: payload?.totalUsageEventsCount,
			);
			if (
				reported === undefined ||
				!Number.isInteger(reported) ||
				(total !== undefined && total !== reported)
			)
				throw Object.assign(new Error("Cursor page count changed"), {
					code: "CURSOR_PAGE_COUNT_CHANGED",
				});
			total = reported;
			// Split immediately when the first page already proves the cap.
			if (total > maxPages * pageSize)
				throw Object.assign(new Error("Cursor page limit"), {
					code: "CURSOR_PAGE_LIMIT",
				});
		}
		if (events.length) {
			const key = digest(JSON.stringify(events));
			if (pages.has(key))
				throw Object.assign(new Error("Repeated Cursor page"), {
					code: "CURSOR_REPEATED_PAGE",
				});
			pages.add(key);
		}
		retrieved += events.length;
		for (const value of events) {
			const event = apiContribution(value);
			if (!event) continue;
			if (event.tsMs < from || event.tsMs >= to)
				throw Object.assign(new Error("Cursor event outside query"), {
					code: "CURSOR_EVENT_OUTSIDE_QUERY",
				});
			if (event.id && eventIds.has(event.id)) continue;
			if (event.id) eventIds.add(event.id);
			out.push(event);
		}
		if (total !== undefined && retrieved > total)
			throw Object.assign(new Error("Invalid Cursor page count"), {
				code: "CURSOR_INVALID_PAGE_COUNT",
			});
		if (
			(total !== undefined && retrieved === total) ||
			(total === undefined && events.length < pageSize)
		)
			return out;
		if (!events.length)
			throw Object.assign(new Error("Incomplete Cursor pages"), {
				code: "CURSOR_INCOMPLETE_PAGES",
			});
	}
	throw Object.assign(new Error("Cursor page limit"), {
		code: "CURSOR_PAGE_LIMIT",
	});
}
