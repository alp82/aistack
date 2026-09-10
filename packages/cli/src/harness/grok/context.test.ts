import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { contextCall, retainedContextCalls } from "./context.js";

const now = Date.parse("2026-09-10T12:00:00Z");
const entry = (ctx: Record<string, unknown> = {}) => ({
	ts: "2026-09-10T10:00:00Z",
	src: "shell",
	pid: 12,
	sid: "session",
	msg: "shell.turn.inference_done",
	ctx: {
		loop_index: 0,
		prompt_tokens: 40000,
		cached_prompt_tokens: 10000,
		...ctx,
	},
});
async function fixture() {
	const home = await mkdtemp(path.join(tmpdir(), "grok-context-log-"));
	await mkdir(path.join(home, "logs"));
	return {
		root: path.join(home, "sessions"),
		cache: path.join(home, "cache"),
		log: path.join(home, "logs", "unified.jsonl"),
	};
}

describe("Grok numeric context capture", () => {
	test("uses total prompt tokens without adding the cached subset again", () => {
		expect(contextCall(entry())?.tokens).toBe(40000);
		expect(contextCall(entry({ prompt_tokens: 0 }))?.tokens).toBe(0);
		for (const prompt_tokens of [
			undefined,
			null,
			"40000",
			-1,
			1.5,
			Infinity,
			Number.MAX_SAFE_INTEGER + 1,
		]) {
			expect(contextCall(entry({ prompt_tokens }))).toBeNull();
		}
		expect(contextCall({ ...entry(), ts: "invalid" })).toBeNull();
		expect(contextCall({ ...entry(), src: "grok-pager" })).toBeNull();
		expect(contextCall({ ...entry(), msg: "other" })).toBeNull();
	});

	test("retains only numeric projections for known sessions and deduplicates overlapping captures", async () => {
		const f = await fixture();
		const sessions = new Set(["session"]);
		const raw = JSON.stringify(
			entry({ secret: "private conversation", url: "https://private.example" }),
		);
		await writeFile(
			f.log,
			`${raw}\n${raw}\n${JSON.stringify({ ...entry(), sid: "unknown" })}\n`,
		);
		const first = await retainedContextCalls(f.root, sessions, f.cache, now);
		expect(first).toHaveLength(1);
		await retainedContextCalls(f.root, sessions, f.cache, now);
		expect(await readdir(f.cache)).toEqual(["2026-09-10.jsonl"]);
		const cache = await readFile(
			path.join(f.cache, "2026-09-10.jsonl"),
			"utf8",
		);
		expect(cache.trim().split("\n")).toHaveLength(1);
		expect(Object.keys(JSON.parse(cache))).toEqual([
			"id",
			"session",
			"tsMs",
			"tokens",
		]);
		expect(cache).not.toContain("private");
		await writeFile(f.log, "");
		expect(await retainedContextCalls(f.root, sessions, f.cache, now)).toEqual(
			first,
		);
	});

	test("ignores unfinished live log lines, but rejects damaged retained data", async () => {
		const f = await fixture();
		const sessions = new Set(["session"]);
		await writeFile(f.log, `${JSON.stringify(entry())}\n{"unfinished":`);
		expect(
			await retainedContextCalls(f.root, sessions, f.cache, now),
		).toHaveLength(1);
		await writeFile(path.join(f.cache, "2026-09-10.jsonl"), '{"unfinished":');
		await expect(
			retainedContextCalls(f.root, sessions, f.cache, now),
		).rejects.toThrow("Incomplete Grok context cache");
	});

	test("expires captured calls after 400 days, and missing logs need no cache", async () => {
		const f = await fixture();
		const sessions = new Set(["session"]);
		expect(await retainedContextCalls(f.root, sessions, f.cache, now)).toEqual(
			[],
		);
		await expect(readdir(f.cache)).rejects.toMatchObject({ code: "ENOENT" });
		await writeFile(f.log, `${JSON.stringify(entry())}\n`);
		await retainedContextCalls(f.root, sessions, f.cache, now);
		expect(
			await retainedContextCalls(
				f.root,
				sessions,
				f.cache,
				now + 401 * 86400000,
			),
		).toEqual([]);
		expect(await readdir(f.cache)).toEqual([]);
	});
});
