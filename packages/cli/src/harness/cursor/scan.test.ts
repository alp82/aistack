import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { buildUsageDays } from "../../usage/days.js";
import { countsTotal, finalize } from "../shared/aggregate.js";
import { emptyScanStats } from "../shared/window.js";
import { loadCache } from "./cache.js";
import { AT, session } from "./fixtures.js";
import type { LocalRead } from "./local.js";
import { type ScanOptions, scan } from "./scan.js";

let dir: string;
let options: ScanOptions;
let local: LocalRead;
beforeEach(async () => {
	dir = await mkdtemp(path.join(tmpdir(), "cursor-scan-"));
	local = {
		sessions: [
			{
				session: session(),
				tokens: new Map([
					[
						"reply",
						{
							input: 1000,
							inputSource: "context",
							output: 0,
							outputSource: "reported",
						},
					],
				]),
			},
		],
		complete: true,
		stats: emptyScanStats(),
	};
	options = {
		root: path.join(dir, "root"),
		cachePath: path.join(dir, "cache.json"),
		now: AT + 2000,
		sinceMs: AT - 86_400_000,
		readLocalImpl: async () => local,
		accountImpl: async () => null,
	};
});
afterEach(async () => {
	await rm(dir, { recursive: true, force: true });
});
const event = (overrides: Record<string, unknown> = {}) => ({
	id: "event-1",
	conversationId: "local-session",
	timestamp: AT + 1000,
	model: "claude-sonnet-4-6",
	tokenUsage: { inputTokens: 800, outputTokens: 0 },
	...overrides,
});
const fetcher = (events: unknown[]) =>
	vi.fn<typeof fetch>().mockImplementation(async () =>
		Response.json({
			usageEventsDisplay: events,
			totalUsageEventsCount: events.length,
		}),
	);
const total = async () => finalize((await scan(options)).aggregate).totalTokens;

it("publishes useful local-only counts then replaces them with matched API usage through shared days", async () => {
	expect(await total()).toBe(1000);
	options.accountImpl = async () => ({
		scope: "account-a",
		cookie: "not-persisted",
	});
	options.fetchImpl = fetcher([
		event(),
		event({ id: "other", conversationId: "unmatched" }),
		event({ id: "cloud", cloudAgentId: "cloud" }),
	]);
	const reading = await scan(options);
	expect(reading.scanComplete).toBe(true);
	expect(finalize(reading.aggregate).totalTokens).toBe(800);
	const days = buildUsageDays({
		aggregate: reading.aggregate,
		harness: "cursor",
		publishCost: false,
		projectWorkspaceId: () => "opaque-workspace",
	});
	expect(days.size).toBe(1);
	const wire = JSON.stringify([...days.values()]);
	expect(wire).toContain('"harness":"cursor"');
	expect(wire).not.toContain("/synthetic");
	expect(wire).not.toContain('"usd"');
	const stored = await readFile(path.join(dir, "cache.json"), "utf8");
	expect(stored).not.toContain("not-persisted");
	expect(stored).not.toContain("abcdefgh");
});
it("preserves complete enrichment on a later-page failure and on missing login", async () => {
	options.accountImpl = async () => ({ scope: "account-a", cookie: "cookie" });
	options.fetchImpl = fetcher([event()]);
	expect(await total()).toBe(800);
	options.now = AT + 600_000;
	const page = Array.from({ length: 100 }, (_, i) =>
		event({ id: String(i), tokenUsage: { inputTokens: 1 } }),
	);
	options.fetchImpl = vi
		.fn<typeof fetch>()
		.mockResolvedValueOnce(
			Response.json({ usageEventsDisplay: page, totalUsageEventsCount: 101 }),
		)
		.mockResolvedValueOnce(new Response(null, { status: 401 }));
	expect(await total()).toBe(800);
	options.accountImpl = async () => null;
	expect(await total()).toBe(800);
});
it("does not reuse another account's enrichment and keeps ID-less multiplicity across repeated refreshes", async () => {
	options.accountImpl = async () => ({ scope: "account-a", cookie: "cookie" });
	options.fetchImpl = fetcher([
		event({ id: undefined }),
		event({ id: undefined }),
	]);
	expect(await total()).toBe(1600);
	options.now = AT + 600_000;
	expect(await total()).toBe(1600);
	options.accountImpl = async () => ({
		scope: "account-b",
		cookie: "different",
	});
	options.fetchImpl = vi
		.fn<typeof fetch>()
		.mockRejectedValue(new Error("offline"));
	expect(await total()).toBe(1000);
});
it("keeps a temporarily missing source unsafe on repeated scans and never commits the partial cache", async () => {
	await scan(options);
	local.sessions = [];
	expect((await scan(options)).scanComplete).toBe(false);
	expect((await scan(options)).scanComplete).toBe(false);
	expect(
		(await loadCache(path.join(dir, "cache.json"))).value.sessions,
	).toEqual(["local-session"]);
});
it("withholds replacement when a retained source or cache is malformed", async () => {
	local.complete = false;
	expect((await scan(options)).scanComplete).toBe(false);
	local.complete = true;
	await writeFile(path.join(dir, "cache.json"), "broken cache");
	expect((await scan(options)).scanComplete).toBe(false);
});
it("returns both UTC dates when a refreshed native event moves to the next day", async () => {
	const old = Date.UTC(2026, 8, 9, 23, 59);
	options.sinceMs = Date.UTC(2026, 8, 9);
	options.accountImpl = async () => ({ scope: "account-a", cookie: "cookie" });
	options.fetchImpl = fetcher([event({ timestamp: old })]);
	await scan(options);
	options.now = AT + 600_000;
	options.fetchImpl = fetcher([event({ timestamp: AT })]);
	const reading = await scan(options);
	expect(
		[...(reading.sessionDates?.get("local-session") ?? [])].sort(),
	).toEqual(["2026-09-09", "2026-09-10"]);
	expect(reading.aggregate.usageDays.has("2026-09-09")).toBe(false);
});
it("attributes two equal-timestamp conversations separately", async () => {
	local.sessions.push({
		...local.sessions[0],
		session: session({ id: "second" }),
	});
	options.accountImpl = async () => ({ scope: "account-a", cookie: "cookie" });
	options.fetchImpl = fetcher([
		event(),
		event({ id: "event-2", conversationId: "second" }),
	]);
	const reading = await scan(options);
	expect(reading.aggregate.sessions.size).toBe(2);
	expect(countsTotal([...reading.aggregate.byModel.values()][0])).toBe(1600);
});

it("preserves copied native response prefixes once while counting newly performed child activity", async () => {
	const parent = session();
	parent.messages[1].identityOrigin = "composer-native";
	const child = session({
		id: "child",
		messages: [
			...parent.messages,
			{
				...parent.messages[1],
				id: "child-new",
				isSidechain: true,
				content: "new text",
			},
		],
	});
	local.sessions = [
		{ session: parent, tokens: new Map() },
		{ session: child, tokens: new Map() },
	];
	const reading = await scan(options);
	expect(reading.aggregate.distinctResponses).toBe(2);
	expect(finalize(reading.aggregate).totalTokens).toBe(6);
	expect(reading.aggregate.sidechainTokens).toBe(2);
});
it("does not replace usable local counts with a billing-only account event", async () => {
	options.accountImpl = async () => ({ scope: "account", cookie: "cookie" });
	options.fetchImpl = fetcher([event({ tokenUsage: { totalCents: 5 } })]);
	expect(await total()).toBe(1000);
});
it("retains untimed model inventory without inventing a dated usage row", async () => {
	local.sessions[0].session.createdAtSource = "epoch-unknown";
	local.sessions[0].session.messages = local.sessions[0].session.messages.map(
		(m) => ({ ...m, timestampSource: "unknown" }),
	);
	const reading = await scan(options);
	expect(reading.aggregate.usageDays.size).toBe(0);
	expect(reading.aggregate.byModel.has("claude-sonnet-4-6")).toBe(true);
	expect(finalize(reading.aggregate).totalTokens).toBe(0);
});
