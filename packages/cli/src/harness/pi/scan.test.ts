// The pi scanner's file-level behavior - wayfinder ticket #126 (map #121):
// the vendor's own version header as the genuineness fingerprint, the
// version ceiling (a newer schema reads as unreadable, never as zero), the
// cross-file /fork dedup, and swallowed-not-thrown read failures.

import {
	mkdirSync,
	mkdtempSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { finalize } from "../shared/aggregate.js";
import { createAggregate } from "./analyzer.js";
import { isSessionFile, scan, sessionRoots } from "./scan.js";

const TS = "2026-07-20T12:00:00.000Z";
const TS_MS = Date.parse(TS);

const header = (over: Record<string, unknown> = {}) => ({
	type: "session",
	version: 3,
	id: "019f8fe5-f4d5-744d-9b02-4a9bad77279d",
	timestamp: TS,
	cwd: "/home/u/secret-project",
	...over,
});

const assistant = (id: string, input: number) => ({
	type: "message",
	id,
	parentId: null,
	timestamp: TS,
	message: {
		role: "assistant",
		content: [],
		api: "anthropic-messages",
		provider: "anthropic",
		model: "claude-fable-5",
		usage: {
			input,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: input,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
		stopReason: "stop",
		timestamp: TS_MS,
	},
});

const FILE_A =
	"2026-07-20T12-00-00-000Z_019f8fe5-f4d5-744d-9b02-4a9bad77279d.jsonl";
const FILE_B =
	"2026-07-20T12-30-00-000Z_019f8fe6-a076-7626-b43c-68bb3b08976a.jsonl";

let root: string;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "aistack-pi-scan-"));
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

function writeSession(
	cwdDir: string,
	basename: string,
	records: unknown[],
): string {
	const dir = join(root, cwdDir);
	mkdirSync(dir, { recursive: true });
	const full = join(dir, basename);
	writeFileSync(full, `${records.map((r) => JSON.stringify(r)).join("\n")}\n`);
	return full;
}

describe("isSessionFile", () => {
	it("matches pi's timestamp_uuid.jsonl names and nothing else", () => {
		expect(isSessionFile(FILE_A)).toBe(true);
		expect(isSessionFile("notes.jsonl")).toBe(false);
		expect(isSessionFile("rollout-2026-07-20.jsonl")).toBe(false);
		expect(isSessionFile(FILE_A.replace(".jsonl", ".json"))).toBe(false);
	});
});

describe("sessionRoots", () => {
	it("honors PI_CODING_AGENT_SESSION_DIR over PI_CODING_AGENT_DIR over the default", () => {
		const prevDir = process.env.PI_CODING_AGENT_DIR;
		const prevSess = process.env.PI_CODING_AGENT_SESSION_DIR;
		try {
			process.env.PI_CODING_AGENT_DIR = "/custom/agent";
			delete process.env.PI_CODING_AGENT_SESSION_DIR;
			expect(sessionRoots()).toEqual([join("/custom/agent", "sessions")]);
			process.env.PI_CODING_AGENT_SESSION_DIR = "/custom/sessions";
			expect(sessionRoots()).toEqual(["/custom/sessions"]);
		} finally {
			if (prevDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
			else process.env.PI_CODING_AGENT_DIR = prevDir;
			if (prevSess === undefined)
				delete process.env.PI_CODING_AGENT_SESSION_DIR;
			else process.env.PI_CODING_AGENT_SESSION_DIR = prevSess;
		}
	});
});

describe("version-header gate", () => {
	it("ingests a genuine session file", async () => {
		writeSession("--home-u-secret-project--", FILE_A, [
			header(),
			assistant("a1", 100),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root] });
		expect(stats.filesRead).toBe(1);
		expect(stats.filesForeign).toBe(0);
		expect(finalize(agg).models[0].tokens.input).toBe(100);
		expect(finalize(agg).sessions).toBe(1);
	});

	it("excludes a file whose first line is not a pi session header", async () => {
		writeSession("--home-u-secret-project--", FILE_A, [
			{ type: "rollout", note: "someone else's log" },
			assistant("a1", 999),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root] });
		expect(stats.filesForeign).toBe(1);
		expect(stats.filesRead).toBe(0);
		expect(finalize(agg).totalTokens).toBe(0);
	});

	it("reads a session-format version above the known ceiling as unreadable, never as zero", async () => {
		writeSession("--home-u-secret-project--", FILE_A, [
			header({ version: 4 }),
			assistant("a1", 999),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root] });
		expect(stats.filesUnreadable).toBe(1);
		expect(stats.filesRead).toBe(0);
		expect(stats.unreadableFiles[0]?.reason).toBe("version-too-new");
		expect(finalize(agg).totalTokens).toBe(0);
	});

	it("still reads the older v1/v2 formats - their usage fields never changed", async () => {
		writeSession("--home-u-secret-project--", FILE_A, [
			header({ version: 1 }),
			assistant("a1", 50),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root] });
		expect(stats.filesRead).toBe(1);
		expect(finalize(agg).totalTokens).toBe(50);
	});
});

describe("cross-file dedup and window", () => {
	it("counts a /fork-duplicated response once across two files", async () => {
		writeSession("--home-u-secret-project--", FILE_A, [
			header(),
			assistant("a1", 100),
		]);
		writeSession("--home-u-secret-project--", FILE_B, [
			header({
				id: "019f8fe6-a076-7626-b43c-68bb3b08976a",
				parentSession: "/orig.jsonl",
			}),
			assistant("a1", 100),
			assistant("b2", 25),
		]);
		const agg = createAggregate();
		await scan(agg, { roots: [root] });
		expect(finalize(agg).totalTokens).toBe(125);
		expect(agg.continuationsFolded).toBe(1);
		// two real sessions, one project directory
		expect(finalize(agg).sessions).toBe(2);
		expect(finalize(agg).projects).toBe(1);
	});

	it("skips a file untouched since the window opened", async () => {
		const file = writeSession("--home-u-secret-project--", FILE_A, [
			header(),
			assistant("a1", 100),
		]);
		const old = new Date("2026-06-01T00:00:00Z");
		utimesSync(file, old, old);
		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root],
			sinceMs: Date.parse("2026-07-01T00:00:00Z"),
		});
		expect(stats.filesSkippedByMtime).toBe(1);
		expect(stats.filesRead).toBe(0);
	});

	it("counts parse errors per line without dropping the file", async () => {
		const dir = join(root, "--home-u-secret-project--");
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(dir, FILE_A),
			`${JSON.stringify(header())}\n{broken json\n${JSON.stringify(assistant("a1", 10))}\n`,
		);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root] });
		expect(stats.filesRead).toBe(1);
		expect(agg.parseErrors).toBe(1);
		expect(finalize(agg).totalTokens).toBe(10);
	});
});
