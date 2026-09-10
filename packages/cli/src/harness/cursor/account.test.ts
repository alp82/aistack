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
		pageSize: 100,
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
	const events = Array.from({ length: 100 }, (_, i) => ({
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
			Response.json({ usageEventsDisplay: events, totalUsageEventsCount: 101 }),
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
	put("auth0|synthetic-two");
	expect((await existingAccount(root))?.scope).not.toBe(first?.scope);
	db.close();
});
