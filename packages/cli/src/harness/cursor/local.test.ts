import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { SessionSummary } from "cursor-history";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { stageSync } from "../../sync/stage.js";
import { disableTrace, enableTrace } from "../../trace.js";
import { BUNDLED_SYNC_CONFIG } from "../shared/allowlist.js";
import { cursorAdapter } from "./adapter.js";
import rows from "./fixtures/composer-rows.json";
import {
	dataPath,
	forgetLocalReads,
	READ_WINDOW_MARGIN_MS,
	readLocal,
	readLocalOnce,
	SLOW_SESSION_MS,
	setCursorReadWindow,
	summaryNewestMs,
} from "./local.js";
import { scan } from "./scan.js";

vi.mock("cursor-history", async (importOriginal) => ({
	...(await importOriginal<typeof import("cursor-history")>()),
}));

let dir: string;
let root: string;
beforeEach(async () => {
	dir = await mkdtemp(path.join(tmpdir(), "cursor-local-"));
	root = path.join(dir, "User", "workspaceStorage");
	vi.stubEnv("CURSOR_DATA_PATH", root);
	vi.stubEnv("CURSOR_STORE_ROOT", path.join(dir, "store"));
	forgetLocalReads();
});
afterEach(async () => {
	disableTrace();
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
	await rm(dir, { recursive: true, force: true });
});

async function createSource() {
	const workspace = path.join(root, "synthetic");
	await mkdir(workspace, { recursive: true });
	await mkdir(path.join(dir, "User", "globalStorage"), { recursive: true });
	await writeFile(
		path.join(workspace, "workspace.json"),
		JSON.stringify({ folder: "file:///synthetic/project" }),
	);
	const global = new DatabaseSync(
		path.join(dir, "User", "globalStorage", "state.vscdb"),
	);
	const local = new DatabaseSync(path.join(workspace, "state.vscdb"));
	global.exec(
		"CREATE TABLE cursorDiskKV (key TEXT PRIMARY KEY, value TEXT); CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value TEXT)",
	);
	local.exec("CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value TEXT)");
	for (const row of rows) {
		const target = row.table === "cursorDiskKV" ? global : local;
		target
			.prepare(`INSERT INTO ${row.table} VALUES (?, ?)`)
			.run(row.key, JSON.stringify(row.value));
	}
	local.close();
	global.close();
}

it("resolves the qualified Composer fixture with the packaged node:sqlite reader", async () => {
	await createSource();
	const reading = await readLocal(root);
	expect(
		reading.complete,
		JSON.stringify(reading.sessions.map((s) => s.session.resolutionState)),
	).toBe(true);
	expect(reading.sessions).toHaveLength(1);
	expect(reading.sessions[0].session.id).toBe(
		"11111111-1111-4111-8111-111111111111",
	);
	expect(reading.sessions[0].session.canonicalWorkspacePath).toBe(
		"/synthetic/project",
	);
	expect(reading.sessions[0].session.messages).toHaveLength(2);
	expect(reading.sessions[0].session.messages[1].toolCalls?.[0].name).toBe(
		"read_file",
	);
});
// A sync asks the adapter four times (detect twice, scan twice). Each read
// walks the whole global database, so the later three must be the first one's
// result, even after the source moved: an open Cursor appends to its
// write-ahead log the whole time, and a stamp check would defeat the memo.
it("reads a root once per process, even when the source moves", async () => {
	await createSource();
	const first = await readLocal(root);
	expect(first.sessions).toHaveLength(1);
	const global = new DatabaseSync(
		path.join(dir, "User", "globalStorage", "state.vscdb"),
	);
	global
		.prepare("INSERT INTO cursorDiskKV VALUES (?, ?)")
		.run("aistack:changed", JSON.stringify({ padding: "x".repeat(8192) }));
	global.close();
	expect(await readLocal(root)).toBe(first);
	forgetLocalReads();
	expect(await readLocal(root)).not.toBe(first);
});

it("reconciles a transcript copy once and retains explicit-zero raw token evidence", async () => {
	await createSource();
	const id = "11111111-1111-4111-8111-111111111111";
	const transcriptRoot = path.join(
		dir,
		"store",
		"projects",
		"synthetic",
		"agent-transcripts",
	);
	await mkdir(transcriptRoot, { recursive: true });
	await writeFile(
		path.join(transcriptRoot, `${id}.jsonl`),
		await readFile(
			new URL("./fixtures/transcript.jsonl", import.meta.url),
			"utf8",
		),
	);
	const db = new DatabaseSync(
		path.join(dir, "User", "globalStorage", "state.vscdb"),
	);
	const key = `bubbleId:${id}:assistant-1`;
	const record = rows.find((r) => r.key === key);
	if (!record) throw new Error("Expected fixture record");
	db.prepare("UPDATE cursorDiskKV SET value = ? WHERE key = ?").run(
		JSON.stringify({
			...record.value,
			tokenCount: { inputTokens: 50, outputTokens: 0 },
		}),
		key,
	);
	db.close();
	const reading = await readLocal(root);
	expect(
		reading.complete,
		JSON.stringify(reading.sessions.map((s) => s.session.resolutionState)),
	).toBe(true);
	expect(reading.sessions).toHaveLength(1);
	expect(reading.sessions[0].tokens.get("assistant-1")).toMatchObject({
		input: 50,
		output: 0,
		outputSource: "reported",
	});
});
it("distinguishes no installation from an unreadable retained database", async () => {
	expect((await readLocal(root)).complete).toBe(true);
	await mkdir(path.join(dir, "User", "globalStorage"), { recursive: true });
	await writeFile(
		path.join(dir, "User", "globalStorage", "state.vscdb"),
		"not a database",
	);
	expect((await readLocal(root)).complete).toBe(false);
});
it("discovers Windows, XDG and configured workspace roots without scanning another platform", () => {
	expect(dataPath({ APPDATA: "/windows/data" }, "/home/test", "win32")).toBe(
		"/windows/data/Cursor/User/workspaceStorage",
	);
	expect(dataPath({ XDG_CONFIG_HOME: "/config" }, "/home/test", "linux")).toBe(
		"/config/Cursor/User/workspaceStorage",
	);
	expect(dataPath({}, "/home/test", "darwin")).toBe(
		"/home/test/Library/Application Support/Cursor/User/workspaceStorage",
	);
	expect(
		dataPath({ CURSOR_DATA_PATH: "/configured" }, "/home/test", "linux"),
	).toBe("/configured");
});

it.each([false, true])(
	"publishes recovered token evidence, including partial transcripts (%s)",
	async (partial) => {
		await createSource();
		const db = new DatabaseSync(
			path.join(dir, "User", "globalStorage", "state.vscdb"),
		);
		// Each value fits on its own; the page of bubble metadata does not.
		db.prepare(
			"UPDATE cursorDiskKV SET value = json_set(value, '$.padding', ?) WHERE key LIKE 'bubbleId:%'",
		).run("x".repeat(1400));
		db.prepare(
			"UPDATE cursorDiskKV SET value = json_set(value, '$.tokenCount', json(?)) WHERE key LIKE '%assistant-1'",
		).run(JSON.stringify({ inputTokens: 123, outputTokens: 0 }));
		if (partial) {
			// Exercise the library's partial-resolution contract while retaining
			// its real SQLite token extraction for the surviving messages.
			const reader = await import("cursor-history");
			const getSession = reader.getSession;
			vi.spyOn(reader, "getSession").mockImplementation(async (...args) => ({
				...(await getSession(...args)),
				resolutionState: "partial",
			}));
		}
		const logs: string[] = [];
		enableTrace((line) => logs.push(line));
		db.close();
		const reading = await readLocalOnce(root, undefined, undefined, {
			sqlitePageBytes: 2048,
			sqliteValueBytes: 2048,
		});
		expect(reading.complete).toBe(!partial);
		expect(reading.sessions).toHaveLength(1);
		if (partial)
			expect(
				logs.filter((line) => line.includes("cursor partial history")),
			).toHaveLength(1);
		const staged = await stageSync({
			baseUrl: "https://cursor-recovery.invalid",
			now: () => Date.parse("2026-09-14T12:00:00Z"),
			getTokenImpl: () => "fixture-token",
			getProjectWorkspaceIdImpl: () => "AAAAAAAAAAAAAAAAAAAAAA",
			loadConfigImpl: async () => ({
				source: "fetched",
				config: {
					...BUNDLED_SYNC_CONFIG,
					publishWorkflow: false,
					stack: { name: "Fixture", slug: path.basename(dir) },
				},
			}),
			fetchManifestImpl: async () => null,
			fetchPricesImpl: async () => null,
			adaptersImpl: async () => [
				{
					...cursorAdapter,
					detect: async () => true,
					scan: (options) =>
						scan({
							...options,
							root,
							now: Date.parse("2026-09-14T12:00:00Z"),
							cachePath: path.join(dir, "usage-cache.json"),
							readLocalImpl: async () => reading,
							accountImpl: async () => null,
						}),
				},
			],
		});
		expect(staged.blockedReason).toBeNull();
		const day = staged.body.measuredDays?.days.find(
			(d) => d.date === "2026-09-10",
		);
		expect(day?.usage?.harnesses[0].models[0].tokens.input).toBe(123);
		expect(staged.body.measuredDays?.partial).toBe(partial || undefined);
	},
);

it("stops retrying when one record itself exceeds the page limit and logs safe details", async () => {
	await createSource();
	const db = new DatabaseSync(
		path.join(dir, "User", "globalStorage", "state.vscdb"),
	);
	db.prepare(
		"UPDATE cursorDiskKV SET value = json_set(value, '$.padding', ?) WHERE key LIKE 'bubbleId:%'",
	).run("private-message".repeat(300));
	db.close();
	const logs: string[] = [];
	enableTrace((line) => logs.push(line));
	const reading = await readLocalOnce(root, undefined, undefined, {
		sqlitePageBytes: 2048,
		sqliteValueBytes: 2048,
	});
	expect(reading.complete).toBe(false);
	expect(
		logs.filter((l) => l.includes("retrying with one SQLite row")),
	).toHaveLength(1);
	expect(logs.join("\n")).toContain(
		"SOURCE_LIMIT_EXCEEDED · sqlite-page-bytes · limit=2048",
	);
	expect(logs.join("\n")).not.toContain("private-message");
	expect(logs.join("\n")).not.toContain(dir);
	expect(reading.stats.unreadableFiles).toEqual([
		{ path: "history", reason: "SOURCE_LIMIT_EXCEEDED" },
	]);
});

it("names the failed discovery stage without exposing database contents", async () => {
	await createSource();
	const reader = await import("cursor-history");
	vi.spyOn(reader, "listSessionSummaries").mockRejectedValue(
		new Error("private prompt /private/db.sqlite"),
	);
	const logs: string[] = [];
	enableTrace((line) => logs.push(line));
	const reading = await readLocal(root);
	expect(reading.complete).toBe(false);
	expect(reading.stats.filesFound).toBe(0);
	expect(logs.join("\n")).toContain("cursor session listing failed");
	expect(logs.join("\n")).not.toContain("private");
});

// Fan the one fixture session out into `count` summaries, each read through
// the real reader with a per-session delay. The delays stand in for the slow
// pages of a 20 GB database, where a session read can take longer than the
// stall window and the listing alone runs past a minute.
async function fanOut(
	count: number,
	delayMs: (index: number) => number,
	failWith: (index: number) => string | undefined = () => undefined,
) {
	const reader = await import("cursor-history");
	const listSessionSummaries = reader.listSessionSummaries;
	const getSession = reader.getSession;
	let calls = 0;
	vi.spyOn(reader, "listSessionSummaries").mockImplementation(
		async (options) => {
			const page = await listSessionSummaries(options);
			const [summary] = page.data;
			return {
				...page,
				data: Array.from({ length: count }, (_, i) => ({
					...summary,
					id: `${summary.id.slice(0, -2)}${String(i).padStart(2, "0")}`,
				})),
				pagination: { ...page.pagination, total: count, hasMore: false },
			};
		},
	);
	vi.spyOn(reader, "getSession").mockImplementation(async (id, options) => {
		const index = calls++;
		const session = await getSession(
			"11111111-1111-4111-8111-111111111111",
			options,
		);
		await new Promise((resolve) => setTimeout(resolve, delayMs(index)));
		options?.signal?.throwIfAborted();
		const code = failWith(index);
		if (code) throw Object.assign(new Error("fixture rejection"), { code });
		return { ...session, id: String(id) };
	});
}

// The read window (#445). `getSession` is the expensive half of the read on
// a large database, so a session the listing dates entirely before the window
// is never opened. A session without a date is opened: undated retained
// history is real.
const RECENT = Date.UTC(2026, 8, 10, 12);
const OLD = Date.UTC(2025, 0, 1);
async function listDated(
	dates: Array<{ at: number | null; created?: number | null }>,
) {
	const reader = await import("cursor-history");
	const listSessionSummaries = reader.listSessionSummaries;
	const getSession = reader.getSession;
	const opened: string[] = [];
	vi.spyOn(reader, "listSessionSummaries").mockImplementation(
		async (options) => {
			const page = await listSessionSummaries(options);
			const [summary] = page.data;
			if (summary.resolutionState === "ambiguous")
				throw new Error("fixture summary");
			const stamp = (ms: number | null) =>
				ms === null
					? { iso: new Date(0).toISOString(), source: "epoch-unknown" as const }
					: {
							iso: new Date(ms).toISOString(),
							source: "composer-metadata" as const,
						};
			return {
				...page,
				data: dates.map(({ at, created }, i) => ({
					...summary,
					id: `${summary.id.slice(0, -2)}${String(i).padStart(2, "0")}`,
					metadata: { ...summary.metadata, lastModified: stamp(at).iso },
					lastUpdatedAtSource: stamp(at).source,
					timestamp: stamp(created ?? at).iso,
					createdAtSource: stamp(created ?? at).source,
				})),
				pagination: {
					...page.pagination,
					total: dates.length,
					hasMore: false,
				},
			};
		},
	);
	vi.spyOn(reader, "getSession").mockImplementation(async (id, options) => {
		opened.push(String(id).slice(-2));
		const session = await getSession(
			"11111111-1111-4111-8111-111111111111",
			options,
		);
		return { ...session, id: String(id) };
	});
	return opened;
}

it("skips the sessions the listing dates before the window and opens the rest", async () => {
	await createSource();
	const opened = await listDated([
		{ at: RECENT },
		{ at: OLD },
		{ at: null },
		// An entry dated only by its creation is judged by that.
		{ at: null, created: OLD },
		{ at: OLD, created: RECENT },
	]);
	const logs: string[] = [];
	enableTrace((line) => logs.push(line));
	const sinceMs = Date.UTC(2026, 7, 1);
	const reading = await readLocalOnce(
		root,
		undefined,
		undefined,
		undefined,
		undefined,
		sinceMs,
	);
	expect(opened).toEqual(["00", "02", "04"]);
	expect(reading.sessions.map((s) => s.session.id.slice(-2))).toEqual([
		"00",
		"02",
		"04",
	]);
	expect(reading.complete).toBe(true);
	expect(reading.stats).toMatchObject({
		filesFound: 3,
		filesRead: 3,
		filesUnreadable: 0,
		filesSkippedByMtime: 2,
	});
	expect(
		logs.filter((line) => line.includes("older than the window skipped")),
	).toEqual([
		expect.stringContaining(
			"cursor · 2 sessions older than the window skipped",
		),
	]);
});

it("opens a session dated within a day before the window (#445 margin)", async () => {
	await createSource();
	const sinceMs = Date.UTC(2026, 7, 1);
	// A dashboard event can post-date the local `lastUpdatedAt` slightly, and
	// scan.ts flags the read incomplete when such an event names a session the
	// read did not return. Half a day before the window is opened; two days
	// before is not.
	const opened = await listDated([
		{ at: sinceMs - READ_WINDOW_MARGIN_MS / 2 },
		{ at: sinceMs - 2 * READ_WINDOW_MARGIN_MS },
		{ at: sinceMs },
	]);
	const reading = await readLocalOnce(
		root,
		undefined,
		undefined,
		undefined,
		undefined,
		sinceMs,
	);
	expect(opened).toEqual(["00", "02"]);
	expect(reading.stats).toMatchObject({
		filesRead: 2,
		filesSkippedByMtime: 1,
	});
});

it("reads every session when no window is set", async () => {
	await createSource();
	const opened = await listDated([{ at: RECENT }, { at: OLD }, { at: null }]);
	const reading = await readLocalOnce(root, undefined);
	expect(opened).toEqual(["00", "01", "02"]);
	expect(reading.stats.filesSkippedByMtime).toBe(0);
});

it("the memo reuses a read whose window covers the caller and repeats a narrower one", async () => {
	await createSource();
	// The stage sets the widest window before the first caller; detect's
	// narrower window then reuses that read. A narrower read taken first is
	// repeated when a wider window follows.
	setCursorReadWindow(Date.UTC(2026, 7, 1));
	const narrow = await readLocal(root);
	setCursorReadWindow(Date.UTC(2025, 7, 1));
	const wide = await readLocal(root);
	expect(wide).not.toBe(narrow);
	setCursorReadWindow(Date.UTC(2026, 7, 1));
	expect(await readLocal(root)).toBe(wide);
	setCursorReadWindow(undefined);
	const all = await readLocal(root);
	expect(all).not.toBe(wide);
	setCursorReadWindow(Date.UTC(2020, 0, 1));
	expect(await readLocal(root)).toBe(all);
});

it("dates a listing entry by its newest stamp and never by epoch zero", () => {
	const iso = (ms: number) => new Date(ms).toISOString();
	const entry = (
		overrides: Partial<Extract<SessionSummary, { title: string | null }>>,
	): SessionSummary =>
		({ id: "s", resolutionState: "complete", ...overrides }) as SessionSummary;
	expect(
		summaryNewestMs(
			entry({
				timestamp: iso(RECENT),
				createdAtSource: "composer-metadata",
				metadata: { lastModified: iso(OLD) },
				lastUpdatedAtSource: "composer-metadata",
			}),
		),
	).toBe(RECENT);
	expect(
		summaryNewestMs(
			entry({
				timestamp: iso(0),
				createdAtSource: "epoch-unknown",
				metadata: { lastModified: iso(0) },
				lastUpdatedAtSource: "epoch-unknown",
			}),
		),
	).toBeNull();
	// A stamp the source vouches for still has to be a real moment.
	expect(
		summaryNewestMs(
			entry({
				timestamp: iso(0),
				createdAtSource: "composer-metadata",
				metadata: { lastModified: "not a date" },
				lastUpdatedAtSource: "composer-metadata",
			}),
		),
	).toBeNull();
	expect(summaryNewestMs(entry({ timestamp: iso(OLD) }))).toBe(OLD);
	expect(
		summaryNewestMs({
			id: "a",
			resolutionState: "ambiguous",
		} as SessionSummary),
	).toBeNull();
});

it("a stall aborts the read and keeps the sessions already read", async () => {
	await createSource();
	// Sessions 0 and 1 return quickly; session 2 runs past the stall window,
	// and sessions 3 to 9 are never read.
	await fanOut(10, (i) => (i === 2 ? 300 : 5));
	const logs: string[] = [];
	enableTrace((line) => logs.push(line));
	const reading = await readLocalOnce(
		root,
		undefined,
		undefined,
		undefined,
		80,
	);
	expect(reading.complete).toBe(false);
	expect(reading.sessions.map((s) => s.session.id.slice(-2))).toEqual([
		"00",
		"01",
	]);
	expect(reading.stats.filesRead).toBe(2);
	expect(reading.stats.unreadableFiles).toEqual([
		{ path: "history", reason: "STALLED" },
	]);
	const stalled = logs.filter((line) => line.includes("cursor read stalled"));
	expect(stalled).toHaveLength(1);
	expect(stalled[0]).toContain("2 sessions kept, 7 skipped");
	// Sessions 3 to 9 emit no warning of their own.
	expect(logs.filter((line) => line.includes("session read failed"))).toEqual(
		[],
	);
	expect(logs.filter((line) => line.includes("AbortError"))).toEqual([]);
});

it("counts a session with a non-UTF-8 payload apart and names it for the gate", async () => {
	await createSource();
	await fanOut(
		3,
		() => 1,
		(i) => (i === 1 ? "SOURCE_ENCODING_INVALID" : undefined),
	);
	const logs: string[] = [];
	enableTrace((line) => logs.push(line));
	const reading = await readLocalOnce(root, undefined);
	expect(reading.complete).toBe(false);
	expect(reading.sessions.map((s) => s.session.id.slice(-2))).toEqual([
		"00",
		"02",
	]);
	expect(reading.stats).toMatchObject({
		filesFound: 3,
		filesRead: 2,
		filesUnreadable: 1,
		unreadableFiles: [
			{ path: "1 session skipped", reason: "non-UTF-8 payload" },
		],
	});
	expect(
		logs.filter((line) => line.includes("cursor partial history")),
	).toEqual([
		expect.stringContaining(
			"1 skipped with non-UTF-8 payloads (SOURCE_ENCODING_INVALID)",
		),
	]);
	// The rejection is a count, never a per-session error line.
	expect(logs.filter((line) => line.includes("session read failed"))).toEqual(
		[],
	);
});

it("names a slow session by its place in the listing and its counts only", async () => {
	await createSource();
	await fanOut(2, (i) => (i === 1 ? SLOW_SESSION_MS + 100 : 1));
	const logs: string[] = [];
	enableTrace((line) => logs.push(line));
	const reading = await readLocalOnce(root, undefined);
	expect(reading.sessions).toHaveLength(2);
	const slow = logs.filter((line) => line.includes("cursor slow session"));
	expect(slow).toHaveLength(1);
	expect(slow[0]).toMatch(
		/cursor slow session · 2 of 2 · \d+ ms · \d+ messages, \d+ bubbles with token evidence$/,
	);
	expect(slow[0]).not.toContain("11111111");
}, 10_000);

it("progress resets the stall clock", async () => {
	await createSource();
	// Each session takes longer than half the window; only the sum exceeds it.
	await fanOut(6, () => 50);
	const reading = await readLocalOnce(
		root,
		undefined,
		undefined,
		undefined,
		120,
	);
	expect(reading.complete).toBe(true);
	expect(reading.sessions).toHaveLength(6);
	expect(reading.stats.unreadableFiles).toEqual([]);
});

it("a stalled listing reports once with nothing kept", async () => {
	await createSource();
	const reader = await import("cursor-history");
	vi.spyOn(reader, "listSessionSummaries").mockImplementation(
		async (options) => {
			await new Promise((resolve) => setTimeout(resolve, 200));
			options?.signal?.throwIfAborted();
			throw new Error("unreachable");
		},
	);
	const logs: string[] = [];
	enableTrace((line) => logs.push(line));
	const reading = await readLocalOnce(
		root,
		undefined,
		undefined,
		undefined,
		60,
	);
	expect(reading.sessions).toEqual([]);
	expect(reading.stats.unreadableFiles).toEqual([
		{ path: "history", reason: "STALLED" },
	]);
	const stalled = logs.filter((line) => line.includes("cursor read stalled"));
	expect(stalled).toHaveLength(1);
	expect(stalled[0]).toContain("during session listing");
	expect(stalled[0]).toContain("0 sessions kept, 0 skipped");
});
