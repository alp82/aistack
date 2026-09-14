import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { stageSync } from "../../sync/stage.js";
import { disableTrace, enableTrace } from "../../trace.js";
import { BUNDLED_SYNC_CONFIG } from "../shared/allowlist.js";
import { cursorAdapter } from "./adapter.js";
import rows from "./fixtures/composer-rows.json";
import {
	dataPath,
	forgetLocalReads,
	readLocal,
	readLocalOnce,
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
		JSON.stringify(reading.sessions.map((s) => s.session.resolution)),
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
		JSON.stringify(reading.sessions.map((s) => s.session.resolution)),
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
