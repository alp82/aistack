// The opencode I/O shell against REAL temp SQLite files — wayfinder #124
// (map #121). The store is `opencode*.db` under the data dir (the JSON tree
// is dead storage, research §1); a locked, corrupt, or newer-schema DB counts
// as UNREADABLE, never as zero.

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAggregate } from "./analyzer.js";
import { detectOpencode, scan } from "./scan.js";

const NOW = Date.UTC(2026, 7, 5, 12, 0, 0);
const DAY = 86_400_000;
const SINCE = NOW - 29 * DAY;

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-opencode-"));
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

const MIGRATION_OK = "20260622202450_simplify_session_input";

type Db = InstanceType<typeof DatabaseSync>;

function createDb(name = "opencode.db"): { db: Db; file: string } {
	const file = join(dir, name);
	const db = new DatabaseSync(file);
	db.exec(`
		create table migration (id text primary key, time_completed integer);
		create table session (id text primary key, parent_id text, version text,
			title text, summary_diffs text);
		create table message (id text primary key, session_id text,
			time_created integer, time_updated integer, data text);
		create table part (id text primary key, message_id text, session_id text,
			time_created integer, time_updated integer, data text);
		create table session_message (id text primary key, session_id text,
			type text, time_created integer, time_updated integer, data text, seq integer);
	`);
	db.prepare("insert into migration values (?, ?)").run(MIGRATION_OK, NOW);
	return { db, file };
}

function insertAssistant(
	db: Db,
	over: {
		id?: string;
		sessionId?: string;
		ts?: number;
		provider?: string;
		model?: string;
		input?: number;
		output?: number;
		cacheRead?: number;
		cacheWrite?: number;
	} = {},
): void {
	const ts = over.ts ?? NOW - DAY;
	db.prepare("insert into message values (?, ?, ?, ?, ?)").run(
		over.id ?? "msg_1",
		over.sessionId ?? "ses_1",
		ts,
		ts,
		JSON.stringify({
			role: "assistant",
			time: { created: ts, completed: ts + 1000 },
			modelID: over.model ?? "claude-opus-4-6",
			providerID: over.provider ?? "anthropic",
			path: { cwd: "/home/u/secret-project" },
			cost: 0,
			tokens: {
				total: 999_999_999, // poison: reading `total` is a bug
				input: over.input ?? 100,
				output: over.output ?? 10,
				reasoning: 5_000_000, // poison: adding `reasoning` is a bug
				cache: {
					read: over.cacheRead ?? 1000,
					write: over.cacheWrite ?? 200,
				},
			},
		}),
	);
}

function insertToolPart(
	db: Db,
	over: { id?: string; ts?: number; tool?: string; callId?: string } = {},
): void {
	const ts = over.ts ?? NOW - DAY;
	db.prepare("insert into part values (?, ?, ?, ?, ?, ?)").run(
		over.id ?? "prt_1",
		"msg_1",
		"ses_1",
		ts,
		ts,
		JSON.stringify({
			type: "tool",
			tool: over.tool ?? "bash",
			callID: over.callId ?? `call_${over.id ?? "prt_1"}`,
			state: {
				input: { name: "tdd" },
				output: "SECRET COMMAND OUTPUT", // must never materialize
			},
		}),
	);
}

function insertSession(db: Db, id: string, parentId: string | null): void {
	db.prepare("insert into session values (?, ?, ?, ?, ?)").run(
		id,
		parentId,
		"1.18.11",
		"a secret title",
		"full file contents",
	);
}

describe("scan", () => {
	it("folds an in-window assistant message and its tool part from a real DB", async () => {
		const { db } = createDb();
		insertSession(db, "ses_1", null);
		insertAssistant(db);
		insertToolPart(db);
		db.close();

		const agg = createAggregate();
		const stats = await scan(agg, { sinceMs: SINCE, roots: [dir] });

		expect(stats.filesFound).toBe(1);
		expect(stats.filesRead).toBe(1);
		expect(stats.filesUnreadable).toBe(0);
		const m = agg.byModel.get("anthropic:claude-opus-4-6");
		expect(m).toMatchObject({
			input: 100,
			output: 10,
			cacheRead: 1000,
			cacheWriteUnsplit: 200,
			messages: 1,
		});
		expect(agg.toolCalls.get("bash")).toBe(1);
		expect(agg.ccVersions).toEqual(new Set(["1.18.11"]));
	});

	it("the window filter runs in SQL — an out-of-window row never reaches the fold", async () => {
		const { db } = createDb();
		insertSession(db, "ses_1", null);
		insertAssistant(db, { id: "msg_old", ts: NOW - 90 * DAY });
		insertToolPart(db, { id: "prt_old", ts: NOW - 90 * DAY });
		db.close();

		const agg = createAggregate();
		await scan(agg, { sinceMs: SINCE, roots: [dir] });

		expect(agg.byModel.size).toBe(0);
		expect(agg.toolCalls.size).toBe(0);
		expect(agg.sessions.size).toBe(0);
	});

	it("reads a v2 session_message row and dedups an id present in both generations", async () => {
		const ts = NOW - DAY;
		const { db } = createDb();
		insertSession(db, "ses_1", null);
		insertAssistant(db, { id: "msg_both" });
		db.prepare("insert into session_message values (?, ?, ?, ?, ?, ?, ?)").run(
			"msg_both",
			"ses_1",
			"assistant",
			ts,
			ts,
			JSON.stringify({
				role: "assistant",
				model: { id: "claude-opus-4-6", providerID: "anthropic" },
				time: { created: ts },
				tokens: {
					input: 7,
					output: 3,
					reasoning: 0,
					cache: { read: 0, write: 0 },
				},
				content: [],
			}),
			1,
		);
		db.prepare("insert into session_message values (?, ?, ?, ?, ?, ?, ?)").run(
			"msg_v2only",
			"ses_1",
			"assistant",
			ts,
			ts,
			JSON.stringify({
				role: "assistant",
				model: { id: "gpt-5.4", providerID: "openai" },
				time: { created: ts },
				tokens: {
					input: 7,
					output: 3,
					reasoning: 0,
					cache: { read: 0, write: 0 },
				},
				content: [],
			}),
			1,
		);
		db.close();

		const agg = createAggregate();
		await scan(agg, { sinceMs: SINCE, roots: [dir] });

		// msg_both counted once (from v1), msg_v2only from the v2 table.
		expect(agg.distinctResponses).toBe(2);
		expect(agg.byModel.get("anthropic:claude-opus-4-6")?.messages).toBe(1);
		expect(agg.byModel.get("openai:gpt-5.4")?.messages).toBe(1);
	});

	it("a corrupt DB counts as unreadable and leaks no path", async () => {
		writeFileSync(join(dir, "opencode.db"), "this is not sqlite at all");

		const agg = createAggregate();
		const stats = await scan(agg, { sinceMs: SINCE, roots: [dir] });

		expect(stats.filesFound).toBe(1);
		expect(stats.filesRead).toBe(0);
		expect(stats.filesUnreadable).toBe(1);
		for (const f of stats.unreadableFiles) {
			expect(f.path).not.toContain(dir);
			expect(f.reason).not.toContain(dir);
		}
	});

	it("a DB whose newest migration is past the pinned ceiling is unreadable, not misread", async () => {
		const { db } = createDb();
		db.prepare("insert into migration values (?, ?)").run(
			"20990101000000_from_the_future",
			NOW,
		);
		insertSession(db, "ses_1", null);
		insertAssistant(db);
		db.close();

		const agg = createAggregate();
		const stats = await scan(agg, { sinceMs: SINCE, roots: [dir] });

		expect(stats.filesUnreadable).toBe(1);
		expect(stats.unreadableFiles[0]?.reason).toBe("schema-too-new");
		expect(agg.byModel.size).toBe(0);
	});

	it("a missing data dir is silence", async () => {
		const agg = createAggregate();
		const stats = await scan(agg, {
			sinceMs: SINCE,
			roots: [join(dir, "does-not-exist")],
		});
		expect(stats.filesFound).toBe(0);
		expect(stats.filesUnreadable).toBe(0);
	});

	it("globs channel DBs but never WAL siblings", async () => {
		const { db } = createDb("opencode-nightly.db");
		insertSession(db, "ses_1", null);
		insertAssistant(db);
		db.close();
		writeFileSync(join(dir, "opencode.db-wal"), "not a db");
		writeFileSync(join(dir, "auth.json"), "{}");

		const agg = createAggregate();
		const stats = await scan(agg, { sinceMs: SINCE, roots: [dir] });

		expect(stats.filesFound).toBe(1);
		expect(stats.filesRead).toBe(1);
		expect(agg.distinctResponses).toBe(1);
	});

	it("reads MCP server names from a JSONC config with comments, trailing commas, and URLs", async () => {
		const { db } = createDb();
		insertSession(db, "ses_1", null);
		insertAssistant(db);
		db.close();
		const configFile = join(dir, "opencode.json");
		writeFileSync(
			configFile,
			`{
	// a comment with a URL: https://example.com/path
	"mcp": {
		"chrome-devtools": {
			"type": "local",
			"command": ["npx", "-y", "chrome-devtools-mcp@latest"], /* block */
		},
	},
}`,
		);

		const agg = createAggregate();
		await scan(agg, { sinceMs: SINCE, roots: [dir], configFile });

		expect(agg.mcpServerCalls.get("chrome-devtools")).toBe(0);
	});

	it("an unparseable config is silence, not an error", async () => {
		const { db } = createDb();
		insertSession(db, "ses_1", null);
		insertAssistant(db);
		db.close();
		const configFile = join(dir, "opencode.json");
		writeFileSync(configFile, "{ definitely broken");

		const agg = createAggregate();
		const stats = await scan(agg, { sinceMs: SINCE, roots: [dir], configFile });

		expect(stats.filesRead).toBe(1);
		expect(agg.mcpServerCalls.size).toBe(0);
	});
});

describe("detectOpencode", () => {
	it("a DB with only stale messages is not detected", async () => {
		const { db } = createDb();
		insertSession(db, "ses_1", null);
		insertAssistant(db, { ts: NOW - 90 * DAY });
		db.close();

		expect(await detectOpencode({ sinceMs: SINCE, roots: [dir] })).toBe(false);
	});

	it("one in-window message detects the harness", async () => {
		const { db } = createDb();
		insertSession(db, "ses_1", null);
		insertAssistant(db, { ts: NOW - 90 * DAY, id: "msg_old" });
		insertAssistant(db, { ts: NOW - DAY, id: "msg_new" });
		db.close();

		expect(await detectOpencode({ sinceMs: SINCE, roots: [dir] })).toBe(true);
	});

	it("an empty data dir, a missing dir, and a corrupt DB all read as absent", async () => {
		expect(await detectOpencode({ sinceMs: SINCE, roots: [dir] })).toBe(false);
		expect(
			await detectOpencode({ sinceMs: SINCE, roots: [join(dir, "nope")] }),
		).toBe(false);
		writeFileSync(join(dir, "opencode.db"), "junk");
		expect(await detectOpencode({ sinceMs: SINCE, roots: [dir] })).toBe(false);
	});

	it("a fresh DB mtime with no in-window rows is NOT detection — the probe is a query", async () => {
		// The #101 failure mode: `opencode --version` touches the DB file.
		const { db } = createDb();
		insertSession(db, "ses_1", null);
		insertAssistant(db, { ts: NOW - 120 * DAY });
		db.close();
		// The file's mtime is "now" (we just wrote it) yet nothing is in-window.
		expect(await detectOpencode({ sinceMs: SINCE, roots: [dir] })).toBe(false);
	});
});
