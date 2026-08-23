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
import { createAggregate, finalize } from "./analyzer.js";
import { assistant } from "./fixtures.js";
import { scan, windowStartMs } from "./scan.js";

const NOW = Date.UTC(2026, 6, 25, 12, 0, 0); // 2026-07-25T12:00:00Z
const DAY = 86_400_000;

let root: string;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "aistack-scan-"));
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

/** Write a JSONL transcript and set its mtime, which the window filter reads. */
function writeTranscript(
	relPath: string,
	records: unknown[],
	mtimeMs = NOW,
): string {
	const full = join(root, relPath);
	mkdirSync(join(full, ".."), { recursive: true });
	writeFileSync(full, `${records.map((r) => JSON.stringify(r)).join("\n")}\n`);
	const secs = mtimeMs / 1000;
	utimesSync(full, secs, secs);
	return full;
}

describe("windowStartMs", () => {
	it("opens the window at UTC midnight, `days-1` days back", () => {
		expect(new Date(windowStartMs(NOW, 30)).toISOString()).toBe(
			"2026-06-26T00:00:00.000Z",
		);
	});

	it("a 1-day window is today only", () => {
		expect(new Date(windowStartMs(NOW, 1)).toISOString()).toBe(
			"2026-07-25T00:00:00.000Z",
		);
	});
});

describe("scan", () => {
	it("walks nested subagent directories, not just the top level", () => {
		writeTranscript("proj-a/sess-1.jsonl", [assistant({})]);
		writeTranscript("proj-a/sess-1/subagents/sub-1.jsonl", [assistant({})]);
		const agg = createAggregate();
		return scan(agg, { roots: [root] }).then((stats) => {
			expect(stats.filesFound).toBe(2);
			expect(stats.filesRead).toBe(2);
			expect(agg.records).toBe(2);
		});
	});

	it("attributes records to the first path segment as the project", async () => {
		writeTranscript("proj-a/s.jsonl", [assistant({})]);
		writeTranscript("proj-b/s.jsonl", [assistant({})]);
		const agg = createAggregate();
		await scan(agg, { roots: [root] });
		expect(finalize(agg).projects).toBe(2);
	});

	it("replaces the munged fallback when a transcript provides raw cwd", async () => {
		writeTranscript("-work-acme/s.jsonl", [
			assistant({}),
			assistant({ cwd: "/work/acme" }),
		]);
		const agg = createAggregate();
		await scan(agg, { roots: [root] });
		expect([...agg.projectDirs]).toEqual(["/work/acme"]);
	});

	it("keeps each raw project workspace when cwd changes", async () => {
		writeTranscript("-work-acme/s.jsonl", [
			assistant({ cwd: "/work/acme-one" }),
			assistant({ cwd: "/work/acme-two" }),
		]);
		const agg = createAggregate();
		await scan(agg, { roots: [root] });
		expect([...agg.projectDirs].sort()).toEqual([
			"/work/acme-one",
			"/work/acme-two",
		]);
	});

	it("skips a file whose mtime predates the window, without reading it", async () => {
		// This is what makes a narrow window cheaper rather than merely narrower.
		writeTranscript(
			"old/s.jsonl",
			[assistant({ timestamp: "2026-01-01T00:00:00.000Z" })],
			NOW - 90 * DAY,
		);
		writeTranscript("new/s.jsonl", [
			assistant({ timestamp: "2026-07-25T00:00:00.000Z" }),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root],
			sinceMs: windowStartMs(NOW, 30),
		});
		expect(stats.filesFound).toBe(2);
		expect(stats.filesSkippedByMtime).toBe(1);
		expect(stats.filesRead).toBe(1);
		expect(agg.records).toBe(1);
	});

	it("still filters out-of-window records inside an in-window file", async () => {
		// A live file holds both old and new records; mtime only tells us the file
		// MIGHT contain in-window data.
		writeTranscript("live/s.jsonl", [
			assistant({
				timestamp: "2026-01-01T00:00:00.000Z",
				usage: { output_tokens: 500 },
			}),
			assistant({
				timestamp: "2026-07-25T00:00:00.000Z",
				usage: { output_tokens: 7 },
			}),
		]);
		const agg = createAggregate();
		await scan(agg, { roots: [root], sinceMs: windowStartMs(NOW, 30) });
		expect(agg.records).toBe(1);
		expect(finalize(agg).models[0].tokens.output).toBe(7);
	});

	it("drops a record with an unparseable timestamp when a window is set", async () => {
		writeTranscript("live/s.jsonl", [assistant({ timestamp: "garbage" })]);
		const agg = createAggregate();
		await scan(agg, { roots: [root], sinceMs: windowStartMs(NOW, 30) });
		expect(agg.records).toBe(0);
	});

	it("does not double-count a file reachable through two overlapping roots", async () => {
		// ~/.claude and ~/.config/claude can be symlinked together, and
		// CLAUDE_CONFIG_DIR can repeat a directory.
		writeTranscript("proj/s.jsonl", [
			assistant({ usage: { output_tokens: 100 } }),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root, root] });
		expect(stats.filesFound).toBe(2);
		expect(stats.filesSkippedAsDuplicate).toBe(1);
		expect(agg.records).toBe(1);
		expect(finalize(agg).models[0].tokens.output).toBe(100);
	});

	it("counts a malformed line as a parse error and keeps going", async () => {
		const full = join(root, "proj/s.jsonl");
		mkdirSync(join(full, ".."), { recursive: true });
		writeFileSync(
			full,
			`${JSON.stringify(assistant({}))}\n{not json\n${JSON.stringify(assistant({}))}\n`,
		);
		const agg = createAggregate();
		await scan(agg, { roots: [root] });
		expect(agg.lines).toBe(3);
		expect(agg.parseErrors).toBe(1);
		expect(agg.records).toBe(2);
	});

	it("ignores non-jsonl files and a missing root", async () => {
		writeFileSync(join(root, "stats-cache.json"), "{}");
		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root, join(root, "does-not-exist")],
		});
		expect(stats.filesFound).toBe(0);
		expect(agg.records).toBe(0);
	});

	it("reports progress on the caller's cadence without leaking paths", async () => {
		for (let i = 0; i < 401; i++) {
			writeTranscript(`proj/s-${i}.jsonl`, [assistant({})]);
		}
		const agg = createAggregate();
		const seen: number[] = [];
		await scan(agg, { roots: [root], onProgress: (n) => seen.push(n) });
		expect(seen).toEqual([200, 400]);
	});
});
