import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import rows from "./fixtures/composer-rows.json";
import { dataPath, readLocal } from "./local.js";

let dir: string;
let root: string;
beforeEach(async () => {
	dir = await mkdtemp(path.join(tmpdir(), "cursor-local-"));
	root = path.join(dir, "User", "workspaceStorage");
	vi.stubEnv("CURSOR_DATA_PATH", root);
	vi.stubEnv("CURSOR_STORE_ROOT", path.join(dir, "store"));
});
afterEach(async () => {
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
