import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ResolvedSessionSummary } from "cursor-history";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { hasComposerHalf, readComposerSession } from "./composer.js";
import rows from "./fixtures/composer-rows.json";
import { openEvidenceDb } from "./local.js";

let dir: string;
let root: string;
const ID = "11111111-1111-4111-8111-111111111111";
beforeEach(async () => {
	dir = await mkdtemp(path.join(tmpdir(), "cursor-composer-"));
	root = path.join(dir, "User", "workspaceStorage");
	vi.stubEnv("CURSOR_STORE_ROOT", path.join(dir, "store"));
	await mkdir(root, { recursive: true });
	await mkdir(path.join(dir, "User", "globalStorage"), { recursive: true });
	const global = new DatabaseSync(
		path.join(dir, "User", "globalStorage", "state.vscdb"),
	);
	global.exec("CREATE TABLE cursorDiskKV (key TEXT PRIMARY KEY, value TEXT)");
	for (const row of rows)
		if (row.table === "cursorDiskKV")
			global
				.prepare("INSERT INTO cursorDiskKV VALUES (?, ?)")
				.run(row.key, JSON.stringify(row.value));
	global.close();
});
afterEach(async () => {
	vi.unstubAllEnvs();
	await rm(dir, { recursive: true, force: true });
});

const summary = (
	overrides: Partial<ResolvedSessionSummary> = {},
): ResolvedSessionSummary =>
	({
		id: ID,
		index: 0,
		workspace: "/synthetic/project",
		canonicalWorkspacePath: "/synthetic/project",
		timestamp: "2026-09-09T00:00:00.000Z",
		messageCount: 2,
		resolutionState: "complete",
		createdAtSource: "composer-metadata",
		lastUpdatedAtSource: "direct-message",
		sources: ["composer"],
		...overrides,
	}) as ResolvedSessionSummary;

async function insert(key: string, value: string) {
	const global = new DatabaseSync(
		path.join(dir, "User", "globalStorage", "state.vscdb"),
	);
	global.prepare("INSERT INTO cursorDiskKV VALUES (?, ?)").run(key, value);
	global.close();
}

it("projects the fixture as the scan reads it, in insertion order", async () => {
	const db = await openEvidenceDb(root);
	if (!db) throw new Error("expected the global database");
	try {
		const local = readComposerSession(db, summary());
		if (!local) throw new Error("expected the composer half");
		expect(local.session).toEqual({
			id: ID,
			// The stored creation moment wins over the listing's.
			timestamp: "2026-09-10T00:00:00.000Z",
			createdAtSource: "composer-metadata",
			lastUpdatedAtSource: "direct-message",
			resolutionState: "complete",
			canonicalWorkspacePath: "/synthetic/project",
			metadata: { lastModified: "2026-09-10T00:00:01.000Z" },
			messages: [
				{
					id: "user-1",
					identityOrigin: "composer-native",
					role: "user",
					contentLength: "Read the example file.".length,
					timestamp: "2026-09-10T00:00:00.000Z",
					timestampSource: "composer-created-at",
				},
				{
					id: "assistant-1",
					identityOrigin: "composer-native",
					role: "assistant",
					contentLength: 0,
					timestamp: "2026-09-10T00:00:01.000Z",
					timestampSource: "composer-timing",
					model: "claude-sonnet-4-6",
					toolCalls: [{ name: "read_file" }],
				},
			],
		});
		expect(local.tokens.get("assistant-1")).toEqual({});
	} finally {
		db.close();
	}
});

it("keeps the params the reducer reads, the token evidence, and infers gaps from the neighbours", async () => {
	await insert(
		`bubbleId:${ID}:assistant-2`,
		JSON.stringify({
			bubbleId: "assistant-2",
			type: 2,
			text: "Running the tests.",
			codeBlocks: [{ languageId: "ts", content: "x".repeat(40) }],
			modelInfo: { modelName: "gpt-5.4" },
			toolFormerData: {
				name: " run_terminal_cmd ",
				rawArgs: JSON.stringify({
					command: "pnpm test",
					explanation: "long".repeat(100),
					subagent_type: 5,
				}),
				result: "r".repeat(5000),
			},
			tokenCount: { inputTokens: 1200, outputTokens: 30 },
		}),
	);
	await insert(
		`bubbleId:${ID}:user-2`,
		JSON.stringify({ bubbleId: "user-2", type: 1, text: "thanks" }),
	);
	const db = await openEvidenceDb(root);
	if (!db) throw new Error("expected the global database");
	try {
		const local = readComposerSession(db, summary());
		if (!local) throw new Error("expected the composer half");
		const [, , tool, user] = local.session.messages;
		expect(tool).toMatchObject({
			id: "assistant-2",
			role: "assistant",
			contentLength: "Running the tests.".length + 40,
			model: "gpt-5.4",
			toolCalls: [
				{ name: "run_terminal_cmd", params: { command: "pnpm test" } },
			],
			timestamp: "2026-09-10T00:00:01.000Z",
			timestampSource: "inferred-previous",
		});
		expect(user).toMatchObject({
			id: "user-2",
			role: "user",
			contentLength: 6,
			timestampSource: "inferred-previous",
		});
		expect(local.tokens.get("assistant-2")).toMatchObject({
			input: 1200,
			output: 30,
			inputSource: "reported",
		});
		expect(JSON.stringify(local)).not.toContain("rrrr");
		expect(JSON.stringify(local)).not.toContain("longlong");
	} finally {
		db.close();
	}
});

it("marks an undecodable row corrupted and returns null for a session with no bubbles", async () => {
	await insert(`bubbleId:${ID}:broken`, "{not json");
	const db = await openEvidenceDb(root);
	if (!db) throw new Error("expected the global database");
	try {
		const local = readComposerSession(db, summary());
		expect(local?.session.messages.at(-1)).toMatchObject({
			id: "broken",
			role: "assistant",
			metadata: { corrupted: true },
			timestampSource: "inferred-previous",
		});
		expect(readComposerSession(db, summary({ id: "no-such-session" }))).toBe(
			null,
		);
	} finally {
		db.close();
	}
});

it("names the sessions with a Composer half", () => {
	expect(hasComposerHalf(summary())).toBe(true);
	expect(hasComposerHalf(summary({ sources: ["composer", "store"] }))).toBe(
		true,
	);
	expect(hasComposerHalf(summary({ sources: ["store"] }))).toBe(false);
	expect(
		hasComposerHalf({ id: ID, resolutionState: "ambiguous" } as never),
	).toBe(false);
});
