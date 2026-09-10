import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { detectMcpServers } from "../../mcp.js";
import { scanLocal } from "../../scanner.js";
import { buildUsageDays } from "../../usage/days.js";
import { countsTotal, finalize } from "../shared/aggregate.js";
import { BUNDLED_SYNC_CONFIG } from "../shared/allowlist.js";
import { buildPayload } from "../shared/payload.js";
import { emptyScanStats } from "../shared/window.js";
import { CURSOR_BUILTIN_TOOLS } from "./adapter.js";
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

it("projects tools, questions and API routing through shared workflow while keeping accumulated Context absent", async () => {
	const reply = local.sessions[0].session.messages[1];
	reply.toolCalls = [
		{ id: "read", name: "read_file_v2", status: "completed" },
		{ id: "edit", name: "search_replace", status: "completed" },
		{
			id: "test",
			name: "run_terminal_cmd",
			status: "completed",
			params: { command: "pnpm test" },
		},
		{ id: "search", name: "web_search", status: "completed" },
		{ id: "ask", name: "ask_question", status: "completed" },
		{
			id: "skill",
			name: "skill",
			status: "completed",
			params: { skill: "code-review" },
		},
		{ id: "mcp", name: "mcp__context7__query_docs", status: "completed" },
	];
	options.accountImpl = async () => ({ scope: "account", cookie: "cookie" });
	options.fetchImpl = fetcher([event()]);
	const reading = await scan(options);
	const day = reading.workflow.days[0];
	expect(day.sessions).toBe(1);
	expect(day.startHours).toEqual([{ hourUtc: 12, sessions: 1 }]);
	expect(day.questions).toEqual({ asked: 1, turns: 1 });
	expect(day.webSearches).toBe(1);
	expect(day.routing).toEqual({
		main: [{ model: "claude-sonnet-4-6", tokens: 800 }],
		subagents: [],
	});
	expect(day.phase?.phaseEvents).toEqual({
		scout: 2,
		build: 1,
		verify: 2,
		handoff: 1,
		unknown: 1,
	});
	expect(day.activity.reduce((sum, cell) => sum + cell.events, 0)).toBe(7);
	for (const field of ["context", "turnDurations", "thinking", "effort"])
		expect(day).not.toHaveProperty(field);
	expect(reading.workflowLocal.projectWorkspaces).toEqual(
		new Set(["/synthetic/project"]),
	);
	expect(reading.workflowLocal.activeProjectDays.get("2026-09-10")).toEqual(
		new Set(["/synthetic/project"]),
	);
	expect(reading.aggregate.skillCalls.get("code-review")).toBe(1);
	expect(reading.aggregate.mcpServerCalls.get("context7")).toBe(1);
	expect(reading.aggregate.toolCalls.get("search_replace")).toBe(1);
	expect(JSON.stringify(reading.workflow)).not.toMatch(
		/synthetic|pnpm test|local-session|abcdefgh|query_docs/,
	);
});

it("deduplicates inherited native messages and tools and uses demonstrated sidechain parent references", async () => {
	const parent = session();
	for (const message of parent.messages)
		message.identityOrigin = "composer-native";
	parent.messages[1].toolCalls = [
		{
			id: "native-tool",
			identityOrigin: "source-native",
			name: "read_file",
			status: "completed",
		},
	];
	const child = session({
		id: "child",
		messages: [
			...parent.messages,
			{
				...parent.messages[1],
				id: "new-child",
				parentMessageId: "reply",
				isSidechain: true,
				toolCalls: [
					...parent.messages[1].toolCalls,
					{
						id: "new-tool",
						identityOrigin: "source-native",
						name: "edit_file",
						status: "completed",
					},
				],
			},
		],
	});
	local.sessions = [
		{ session: parent, tokens: new Map() },
		{ session: child, tokens: new Map() },
	];
	const reading = await scan(options);
	const day = reading.workflow.days[0];
	expect(day.delegation).toEqual({
		mainToolCalls: 1,
		subagentToolCalls: 1,
		widestFanOut: 1,
		mostSubagents: 1,
	});
	expect(day.routing?.main[0].tokens).toBe(4);
	expect(day.routing?.subagents[0].tokens).toBe(2);
	expect(day.questions?.turns).toBe(2);
	expect(reading.aggregate.toolCalls.get("read_file")).toBe(1);
});

it("skips Cursor workflow extraction with consent off while retaining observed inventory and usage", async () => {
	options.publishWorkflow = false;
	local.sessions[0].session.messages[1].toolCalls = [
		{ name: "read_file", status: "completed" },
	];
	const reading = await scan(options);
	expect(reading.workflow.days).toEqual([]);
	expect(reading.workflowLocal.projectWorkspaces.size).toBe(0);
	expect(reading.workflowLocal.activeProjectDays.size).toBe(0);
	expect(reading.aggregate.toolCalls.get("read_file")).toBe(1);
	expect(finalize(reading.aggregate).totalTokens).toBe(1000);
});

it("keeps undated tools in inventory without inventing workflow or a Git day", async () => {
	const localSession = local.sessions[0].session;
	localSession.createdAtSource = "epoch-unknown";
	localSession.messages = localSession.messages.map((m) => ({
		...m,
		timestampSource: "unknown",
	}));
	localSession.messages[1].toolCalls = [
		{ name: "read_file", status: "completed" },
	];
	const reading = await scan(options);
	expect(reading.aggregate.toolCalls.get("read_file")).toBe(1);
	expect(reading.workflow.days).toEqual([]);
	expect(reading.workflowLocal.activeProjectDays.size).toBe(0);
});

it("reuses configured Cursor resources without claiming use and publishes only consented observed names", async () => {
	const project = path.join(dir, "project");
	await mkdir(path.join(project, ".cursor", "skills", "private-skill"), {
		recursive: true,
	});
	await mkdir(path.join(project, ".cursor", "rules"), { recursive: true });
	await writeFile(
		path.join(project, ".cursor", "skills", "private-skill", "SKILL.md"),
		"skill body",
	);
	await writeFile(
		path.join(project, ".cursor", "rules", "project.mdc"),
		"rule body",
	);
	await writeFile(
		path.join(project, ".cursor", "mcp.json"),
		JSON.stringify({
			mcpServers: {
				private_docs: {
					command: "npx",
					args: ["-y", "example-mcp"],
					env: { TOKEN: "never-send" },
				},
				unused: { command: "npx", args: ["-y", "unused-mcp"] },
			},
		}),
	);
	const configured = detectMcpServers(project, dir);
	expect(
		configured.filter((r) => r.group === "cursor").map((r) => r.name),
	).toEqual(["private_docs", "unused"]);
	expect(JSON.stringify(configured)).not.toContain("never-send");
	expect(scanLocal(project).map((r) => [r.type, r.group])).toEqual([
		["rule", "cursor"],
		["skill", "cursor"],
	]);
	local.sessions[0].session.canonicalWorkspacePath = project;
	local.sessions[0].session.messages[1].toolCalls = [
		{ name: "read_file", status: "completed" },
		{ name: "private-tool", status: "completed" },
		{ name: "skill", status: "completed", params: { skill: "private-skill" } },
		{ name: "mcp_private_docs_search", status: "completed" },
	];
	const reading = await scan(options);
	expect(reading.aggregate.mcpServerCalls).toEqual(
		new Map([["private_docs", 1]]),
	);
	const projectId = vi.fn(() => "AAAAAAAAAAAAAAAAAAAAAA");
	const built = buildPayload({
		aggregate: reading.aggregate,
		stats: reading.stats,
		syncConfig: { ...BUNDLED_SYNC_CONFIG, publishCost: false },
		now: AT + 2000,
		windowDays: 30,
		harnessName: "cursor",
		builtinTools: CURSOR_BUILTIN_TOOLS,
		projectWorkspaceId: projectId,
	});
	expect(projectId).toHaveBeenCalledWith(project);
	expect(built.payload.activity.projectKeys).toEqual([
		"AAAAAAAAAAAAAAAAAAAAAA",
	]);
	expect(
		built.payload.inventory.builtinTools.map((tool) => tool.name),
	).toContain("read_file");
	expect(built.payload.inventory.mcpServers).toEqual([]);
	expect(built.payload.inventory.skills).toEqual([]);
	const wire = JSON.stringify(built.payload);
	expect(wire).not.toMatch(
		/private-tool|private-skill|private_docs|never-send|skill body|rule body/,
	);
	expect(wire).not.toContain(project);
});
