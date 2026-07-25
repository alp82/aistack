import { describe, expect, it, vi } from "vitest";
import {
	BUILTIN_TOOLS,
	BUNDLED_SYNC_CONFIG,
	filterAtoms,
	loadSyncConfig,
} from "./allowlist.js";
import { BUNDLED_CURATED_ALLOWLIST } from "./bundled-allowlist.js";

const jsonResponse = (body: unknown, status = 200): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

const GOOD_BODY = {
	allowlist: {
		mcpServers: ["github", "linear"],
		skills: ["grilling"],
		subagents: ["Explore"],
		slashCommands: ["clear"],
	},
	publishCost: true,
};

describe("BUILTIN_TOOLS", () => {
	it("covers every tool name observed in the real corpus", () => {
		// Measured on 235,961 records: these 22 names were the entire built-in
		// surface actually exercised. A miss here is a name silently withheld.
		const observed = [
			"Agent",
			"AskUserQuestion",
			"Bash",
			"Edit",
			"Glob",
			"Grep",
			"Monitor",
			"PushNotification",
			"Read",
			"ScheduleWakeup",
			"SendMessage",
			"SendUserFile",
			"Skill",
			"TaskCreate",
			"TaskGet",
			"TaskOutput",
			"TaskStop",
			"TaskUpdate",
			"ToolSearch",
			"WebFetch",
			"WebSearch",
			"Write",
		];
		for (const name of observed) expect(BUILTIN_TOOLS.has(name)).toBe(true);
	});

	it("is a literal set, not a pattern — a plausible fake is not a member", () => {
		expect(BUILTIN_TOOLS.has("ReadFile")).toBe(false);
		expect(BUILTIN_TOOLS.has("BashPlus")).toBe(false);
		expect(BUILTIN_TOOLS.has("bash")).toBe(false); // case-sensitive
	});
});

describe("filterAtoms", () => {
	it("keeps allowlisted atoms and counts distinct withheld names", () => {
		const result = filterAtoms(
			[
				{ name: "github", count: 10 },
				{ name: "acme-internal", count: 99 },
				{ name: "also-private", count: 1 },
			],
			new Set(["github"]),
		);
		expect(result.allowed).toEqual([{ name: "github", count: 10 }]);
		expect(result.withheld).toBe(2);
	});

	it("counts names, not calls, so withheld usage volume stays hidden", () => {
		const result = filterAtoms(
			[{ name: "private", count: 100_000 }],
			new Set(),
		);
		expect(result.withheld).toBe(1);
	});

	it("orders by count descending, then name, for a stable payload", () => {
		const result = filterAtoms(
			[
				{ name: "b", count: 5 },
				{ name: "a", count: 5 },
				{ name: "c", count: 9 },
			],
			new Set(["a", "b", "c"]),
		);
		expect(result.allowed.map((a) => a.name)).toEqual(["c", "a", "b"]);
	});
});

describe("loadSyncConfig", () => {
	it("uses the fetched list when the endpoint answers", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(GOOD_BODY));
		const loaded = await loadSyncConfig({
			baseUrl: "https://aistack.to",
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});
		expect(fetchImpl).toHaveBeenCalledWith(
			"https://aistack.to/api/sync-config",
			expect.objectContaining({ headers: { Accept: "application/json" } }),
		);
		expect(loaded.source).toBe("fetched");
		expect(loaded.config.allowlist.mcpServers).toEqual(["github", "linear"]);
		expect(loaded.config.publishCost).toBe(true);
	});

	it("falls back to the bundled copy on a network error, without throwing", async () => {
		// A bundled-only list is, for a user whose plugin never auto-updates,
		// frozen forever — but an unreachable aistack must never break the scan.
		const loaded = await loadSyncConfig({
			baseUrl: "https://aistack.to",
			fetchImpl: (() =>
				Promise.reject(new Error("ENOTFOUND"))) as unknown as typeof fetch,
		});
		expect(loaded.source).toBe("bundled");
		expect(loaded.error).toContain("ENOTFOUND");
		expect(loaded.config).toBe(BUNDLED_SYNC_CONFIG);
	});

	it("falls back on a non-2xx status", async () => {
		const loaded = await loadSyncConfig({
			baseUrl: "https://aistack.to",
			fetchImpl: (() =>
				Promise.resolve(jsonResponse({}, 503))) as unknown as typeof fetch,
		});
		expect(loaded.source).toBe("bundled");
		expect(loaded.error).toContain("503");
	});

	it("falls back on a body that is not the expected shape", async () => {
		for (const body of [null, [], "nope", { publishCost: true }]) {
			const loaded = await loadSyncConfig({
				baseUrl: "https://aistack.to",
				fetchImpl: (() =>
					Promise.resolve(jsonResponse(body))) as unknown as typeof fetch,
			});
			expect(loaded.source).toBe("bundled");
		}
	});

	it("withholds cost by default when the config could not be read", () => {
		// A preference we cannot read fails closed to the option that transmits
		// less; a snapshot is immutable, so over-publishing is unrecoverable.
		expect(BUNDLED_SYNC_CONFIG.publishCost).toBe(false);
	});

	it("requires publishCost to be exactly true", async () => {
		const loaded = await loadSyncConfig({
			baseUrl: "https://aistack.to",
			fetchImpl: (() =>
				Promise.resolve(
					jsonResponse({ ...GOOD_BODY, publishCost: "yes" }),
				)) as unknown as typeof fetch,
		});
		expect(loaded.source).toBe("fetched");
		expect(loaded.config.publishCost).toBe(false);
	});

	it("drops names from the server that fail the charset or length bound", async () => {
		// A server-supplied list can widen what publishes — that is accepted,
		// because the gate renders every name. It cannot smuggle a control
		// character, a wildcard, or an unbounded string.
		const loaded = await loadSyncConfig({
			baseUrl: "https://aistack.to",
			fetchImpl: (() =>
				Promise.resolve(
					jsonResponse({
						allowlist: {
							mcpServers: [
								"github",
								"*",
								"bad‮name",
								"x".repeat(200),
								"",
								42,
								null,
							],
							skills: "not-an-array",
							subagents: [],
							slashCommands: [],
						},
						publishCost: true,
					}),
				)) as unknown as typeof fetch,
		});
		expect(loaded.config.allowlist.mcpServers).toEqual(["github"]);
		expect(loaded.config.allowlist.skills).toEqual([]);
	});

	it("bounds the request with a timeout signal", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(GOOD_BODY));
		await loadSyncConfig({
			baseUrl: "https://aistack.to",
			fetchImpl: fetchImpl as unknown as typeof fetch,
			timeoutMs: 1_234,
		});
		const init = fetchImpl.mock.calls[0][1] as RequestInit;
		expect(init.signal).toBeInstanceOf(AbortSignal);
	});
});

describe("bundled curated allowlist", () => {
	it("holds only public artifacts — no author-specific plugin names", () => {
		const all = [
			...BUNDLED_CURATED_ALLOWLIST.mcpServers,
			...BUNDLED_CURATED_ALLOWLIST.skills,
			...BUNDLED_CURATED_ALLOWLIST.subagents,
			...BUNDLED_CURATED_ALLOWLIST.slashCommands,
		];
		// The owner's own plugin dominates their corpus and is deliberately NOT
		// seeded here: curation is server-side work (#38).
		expect(all.some((n) => n.startsWith("alp-river:"))).toBe(false);
	});

	it("keeps every entry inside the same charset the fetched list must satisfy", () => {
		const ok = /^[A-Za-z0-9][A-Za-z0-9 ._:@/-]{0,63}$|^\(default\)$/;
		for (const name of [
			...BUNDLED_CURATED_ALLOWLIST.mcpServers,
			...BUNDLED_CURATED_ALLOWLIST.skills,
			...BUNDLED_CURATED_ALLOWLIST.subagents,
			...BUNDLED_CURATED_ALLOWLIST.slashCommands,
		]) {
			expect(name).toMatch(ok);
		}
	});
});
