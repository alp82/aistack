// The detection primitive — wayfinder #101 (map #76), decided in #100.
//
// The property under test: recency, not existence. A root full of old files is
// the exact machine that used to scan, publish, ask and hook for a harness its
// owner had abandoned.

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
import { hasRecentFile } from "./recency.js";

const NOW = Date.UTC(2026, 7, 5, 12, 0, 0);
const DAY = 86_400_000;
const WINDOW_START = NOW - 29 * DAY;

const isJsonl = (name: string) => name.endsWith(".jsonl");

let root: string;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "aistack-recency-"));
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

function writeFile(relPath: string, mtimeMs: number): void {
	const full = join(root, relPath);
	mkdirSync(join(full, ".."), { recursive: true });
	writeFileSync(full, "{}\n");
	utimesSync(full, mtimeMs / 1000, mtimeMs / 1000);
}

describe("hasRecentFile", () => {
	it("a root that exists but holds only old files is not recent", async () => {
		writeFile("proj-a/sess-1.jsonl", NOW - 200 * DAY);
		writeFile("proj-b/sess-2.jsonl", NOW - 31 * DAY);
		expect(await hasRecentFile([root], isJsonl, WINDOW_START)).toBe(false);
	});

	it("one in-window file makes the whole root recent", async () => {
		writeFile("proj-a/sess-1.jsonl", NOW - 200 * DAY);
		writeFile("proj-b/sess-2.jsonl", NOW - DAY);
		expect(await hasRecentFile([root], isJsonl, WINDOW_START)).toBe(true);
	});

	it("a file exactly on the window edge counts", async () => {
		writeFile("proj-a/sess-1.jsonl", WINDOW_START);
		expect(await hasRecentFile([root], isJsonl, WINDOW_START)).toBe(true);
	});

	it("finds a recent file nested below the top level", async () => {
		writeFile("proj-a/sess-1/subagents/sub-1.jsonl", NOW - DAY);
		expect(await hasRecentFile([root], isJsonl, WINDOW_START)).toBe(true);
	});

	it("ignores recent files the matcher rejects", async () => {
		writeFile("proj-a/notes.md", NOW);
		expect(await hasRecentFile([root], isJsonl, WINDOW_START)).toBe(false);
	});

	it("a missing root is not recent, and does not throw", async () => {
		expect(
			await hasRecentFile([join(root, "nope")], isJsonl, WINDOW_START),
		).toBe(false);
	});

	it("an empty root list is not recent", async () => {
		expect(await hasRecentFile([], isJsonl, WINDOW_START)).toBe(false);
	});

	it("any one of several roots can carry the recent file", async () => {
		writeFile("a/old.jsonl", NOW - 200 * DAY);
		writeFile("b/new.jsonl", NOW - DAY);
		expect(
			await hasRecentFile(
				[join(root, "a"), join(root, "b")],
				isJsonl,
				WINDOW_START,
			),
		).toBe(true);
	});

	it("stops statting once it has its answer", async () => {
		for (let i = 0; i < 20; i++) writeFile(`proj/sess-${i}.jsonl`, NOW - DAY);
		let stats = 0;
		const found = await hasRecentFile([root], isJsonl, WINDOW_START, {
			statImpl: async (file) => {
				stats++;
				const { stat } = await import("node:fs/promises");
				return stat(file);
			},
		});
		expect(found).toBe(true);
		expect(stats).toBe(1);
	});
});
