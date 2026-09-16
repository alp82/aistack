import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it, vi } from "vitest";
import { existingAccount, fetchWindow } from "./account.js";
import usagePage from "./fixtures/usage-page.json";

const directories: string[] = [];
afterEach(async () => {
	for (const d of directories.splice(0))
		await rm(d, { recursive: true, force: true });
});
const account = { scope: "synthetic-account", cookie: "synthetic-cookie" };
const from = Date.UTC(2026, 8, 10);
const to = from + 86_400_000;

it("reads 10000 account events in ten requests", async () => {
	const events = Array.from({ length: 10_000 }, (_, i) => ({
		...usagePage.usageEventsDisplay[0],
		id: String(i),
	}));
	const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_, init) => {
		const { page, pageSize } = JSON.parse(String(init?.body));
		return Response.json({
			usageEventsDisplay: events.slice((page - 1) * pageSize, page * pageSize),
			totalUsageEventsCount: events.length,
		});
	});
	expect(await fetchWindow(account, from, to, fetcher)).toHaveLength(
		events.length,
	);
	expect(fetcher).toHaveBeenCalledTimes(10);
});

it.each([{}, { totalUsageEventsCount: 0 }])(
	"accepts Cursor's empty usage window %j",
	async (payload) => {
		expect(
			await fetchWindow(account, from, to, async () => Response.json(payload)),
		).toEqual([]);
	},
);

it("accepts a count-only terminal page after a full page without a count", async () => {
	const events = Array.from({ length: 1000 }, (_, i) => ({
		...usagePage.usageEventsDisplay[0],
		id: String(i),
	}));
	const fetcher = vi
		.fn<typeof fetch>()
		.mockResolvedValueOnce(Response.json({ usageEventsDisplay: events }))
		.mockResolvedValueOnce(Response.json({ totalUsageEventsCount: 1000 }));
	expect(await fetchWindow(account, from, to, fetcher)).toHaveLength(1000);
});

it.each([{}, { totalUsageEventsCount: 1001 }, { totalUsageEventsCount: 0 }])(
	"rejects an omitted array that contradicts earlier counts: %j",
	async (payload) => {
		const events = Array.from({ length: 1000 }, (_, i) => ({
			...usagePage.usageEventsDisplay[0],
			id: String(i),
		}));
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				Response.json({
					usageEventsDisplay: events,
					totalUsageEventsCount: 1001,
				}),
			)
			.mockResolvedValueOnce(Response.json(payload));
		await expect(fetchWindow(account, from, to, fetcher)).rejects.toThrow();
	},
);

it("preserves two equal-timestamp ID-less events from qualified JSON and omits absent/cloud joins", async () => {
	const fetcher = vi
		.fn<typeof fetch>()
		.mockResolvedValue(Response.json(usagePage));
	const rows = await fetchWindow(account, from, to, fetcher);
	expect(rows).toHaveLength(2);
	expect(rows.map((r) => r.buckets.input)).toEqual([100, 80]);
	expect(rows[0].buckets.cacheWrite).toBe(40);
	expect(rows[1].buckets.cacheWrite).toBeUndefined();
	const [, request] = fetcher.mock.calls[0];
	expect(request?.redirect).toBe("error");
	expect(JSON.parse(String(request?.body))).toEqual({
		startDate: from,
		endDate: to - 1,
		page: 1,
		pageSize: 1000,
	});
});
it("deduplicates native IDs without deduplicating identical ID-less events", async () => {
	const event = usagePage.usageEventsDisplay[0];
	const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
		Response.json({
			usageEventsDisplay: [
				{ ...event, id: "a" },
				{ ...event, id: "a" },
				event,
				event,
			],
		}),
	);
	expect(await fetchWindow(account, from, to, fetcher)).toHaveLength(3);
});
it("rejects repeated pages, later-page failure, inconsistent totals and malformed token buckets", async () => {
	const events = Array.from({ length: 1000 }, (_, i) => ({
		...usagePage.usageEventsDisplay[0],
		id: String(i),
	}));
	const repeat = vi
		.fn<typeof fetch>()
		.mockImplementation(async () =>
			Response.json({ usageEventsDisplay: events }),
		);
	await expect(fetchWindow(account, from, to, repeat)).rejects.toThrow(
		"Repeated",
	);
	const fail = vi
		.fn<typeof fetch>()
		.mockResolvedValueOnce(
			Response.json({
				usageEventsDisplay: events,
				totalUsageEventsCount: 1001,
			}),
		)
		.mockResolvedValueOnce(new Response("", { status: 401 }));
	await expect(fetchWindow(account, from, to, fail)).rejects.toThrow(
		"unavailable",
	);
	const malformed = vi.fn<typeof fetch>().mockResolvedValue(
		Response.json({
			usageEventsDisplay: [{ ...events[0], tokenUsage: { inputTokens: -1 } }],
		}),
	);
	await expect(fetchWindow(account, from, to, malformed)).rejects.toThrow(
		"bucket",
	);
});
it("reuses only a synthetic existing SQLite login, identifies account changes and tolerates missing auth", async () => {
	const dir = await mkdtemp(path.join(tmpdir(), "cursor-auth-"));
	directories.push(dir);
	const root = path.join(dir, "workspaceStorage");
	await mkdir(path.join(dir, "globalStorage"));
	expect(await existingAccount(root)).toBeNull();
	const db = new DatabaseSync(path.join(dir, "globalStorage", "state.vscdb"));
	db.exec("CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value TEXT)");
	const token = (sub: string) =>
		`header.${Buffer.from(JSON.stringify({ sub })).toString("base64url")}.signature`;
	const put = (sub: string) =>
		db
			.prepare("INSERT OR REPLACE INTO ItemTable VALUES (?, ?)")
			.run("cursorAuth/accessToken", token(sub));
	put("auth0|synthetic-one");
	const first = await existingAccount(root);
	expect(first?.cookie).toBe(
		`synthetic-one%3A%3A${token("auth0|synthetic-one")}`,
	);
	expect(first?.scope).not.toContain("synthetic");
	// Cursor renews its own login; the next read uses the replacement token
	// without changing this account's cache scope or asking for authentication.
	const renewed = `${token("auth0|synthetic-one")}-renewed`;
	db.prepare("INSERT OR REPLACE INTO ItemTable VALUES (?, ?)").run(
		"cursorAuth/accessToken",
		renewed,
	);
	const refreshed = await existingAccount(root);
	expect(refreshed?.scope).toBe(first?.scope);
	expect(refreshed?.cookie).toBe(`synthetic-one%3A%3A${renewed}`);
	put("auth0|synthetic-two");
	expect((await existingAccount(root))?.scope).not.toBe(first?.scope);
	db.close();
});

it.each([
	[{ unexpected: true }, "CURSOR_INVALID_PAGE_SHAPE"],
	[{ usageEventsDisplay: null }, "CURSOR_INVALID_PAGE_SHAPE"],
	[{ usageEventsDisplay: {} }, "CURSOR_INVALID_PAGE_SHAPE"],
	[{ error: "denied", totalUsageEventsCount: 0 }, "CURSOR_INVALID_PAGE_SHAPE"],
	[{ totalUsageEventsCount: "bad" }, "CURSOR_PAGE_COUNT_CHANGED"],
	[
		{ usageEventsDisplay: Array.from({ length: 1001 }, () => ({})) },
		"CURSOR_PAGE_TOO_LARGE",
	],
])("distinguishes invalid account page responses", async (page, code) => {
	await expect(
		fetchWindow(account, from, to, async () => Response.json(page)),
	).rejects.toMatchObject({ code });
});

// More than 10000 events must be read in smaller, disjoint date windows.
it.each([true, false])(
	"recovers capped usage windows (reported total: %s)",
	async (reported) => {
		const events = Array.from({ length: 10_001 }, (_, i) => ({
			...usagePage.usageEventsDisplay[0],
			id: String(i),
			timestamp: from + i,
		}));
		const fetcher = vi
			.fn<typeof fetch>()
			.mockImplementation(async (_, init) => {
				const { startDate, endDate, page, pageSize } = JSON.parse(
					String(init?.body),
				);
				const selected = events.filter(
					(e) => e.timestamp >= startDate && e.timestamp <= endDate,
				);
				return Response.json({
					usageEventsDisplay: selected.slice(
						(page - 1) * pageSize,
						page * pageSize,
					),
					...(reported ? { totalUsageEventsCount: selected.length } : {}),
				});
			});
		const rows = await fetchWindow(
			account,
			from,
			from + events.length,
			fetcher,
		);
		expect(rows).toHaveLength(events.length);
		expect(new Set(rows.map((r) => r.id)).size).toBe(events.length);
		expect(fetcher.mock.calls.length).toBeLessThan(reported ? 20 : 30);
	},
);

it("stops splitting when a single millisecond itself exceeds the service cap", async () => {
	const fetcher = vi.fn<typeof fetch>().mockImplementation(async () =>
		Response.json({
			usageEventsDisplay: [],
			totalUsageEventsCount: 10_001,
		}),
	);
	await expect(
		fetchWindow(account, from, from + 8, fetcher),
	).rejects.toMatchObject({ code: "CURSOR_PAGE_LIMIT" });
	expect(fetcher).toHaveBeenCalledTimes(4);
});
it("rejects the whole split query when a child fails", async () => {
	const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_, init) => {
		const { startDate, endDate } = JSON.parse(String(init?.body));
		if (endDate - startDate > 1)
			return Response.json({
				usageEventsDisplay: [],
				totalUsageEventsCount: 10_001,
			});
		if (startDate > from) return new Response(null, { status: 401 });
		return Response.json({
			usageEventsDisplay: [
				{ ...usagePage.usageEventsDisplay[0], timestamp: from },
			],
		});
	});
	await expect(
		fetchWindow(account, from, from + 4, fetcher),
	).rejects.toMatchObject({ status: 401 });
	expect(fetcher).toHaveBeenCalledTimes(3);
});

it("bounds requests when repeatedly capped windows cannot establish completion", async () => {
	const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_, init) => {
		const { page } = JSON.parse(String(init?.body));
		return Response.json({
			usageEventsDisplay: Array.from({ length: 1000 }, (_, i) => ({
				cloudAgentId: "cloud",
				conversationId: "remote",
				id: `${page}-${i}`,
			})),
		});
	});
	await expect(fetchWindow(account, from, to, fetcher)).rejects.toMatchObject({
		code: "CURSOR_REQUEST_LIMIT",
	});
	expect(fetcher).toHaveBeenCalledTimes(100);
});
