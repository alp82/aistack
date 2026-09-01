// The Codex scanner's file-level behavior (#75, map #60): the genuine-rollout
// fingerprint from #73, the compression-race retry, the `.zst`/`.jsonl`
// double-count guard, and named-not-swallowed read failures.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as zlib from "node:zlib";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { finalize } from "../shared/aggregate.js";
import { createAggregate } from "./analyzer.js";
import { scan } from "./scan.js";

const TS = "2026-07-20T12:00:00.000Z";

// 10s before TS: usage stamped within FORK_REPLAY_WINDOW_MS of session_meta
// is replayed parent history and does not count (see the analyzer).
const META_TS = "2026-07-20T11:59:50.000Z";

const sessionMeta = (originator = "codex-tui") => ({
	timestamp: META_TS,
	type: "session_meta",
	payload: {
		id: "0198c5b0-aaaa-7bbb-8ccc-0123456789ab",
		cwd: "/home/u/secret-project",
		cli_version: "0.146.0",
		originator,
	},
});

const turnContext = (model = "gpt-5.5-codex") => ({
	timestamp: TS,
	type: "turn_context",
	payload: { model },
});

const tokenCount = (output: number) => ({
	timestamp: TS,
	type: "event_msg",
	payload: {
		type: "token_count",
		info: {
			last_token_usage: {
				input_tokens: 0,
				cached_input_tokens: 0,
				output_tokens: output,
			},
		},
	},
});

const GENUINE = [sessionMeta(), turnContext(), tokenCount(100)];

let root: string;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "aistack-codex-scan-"));
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

function writeRollout(relPath: string, records: unknown[]): string {
	const full = join(root, relPath);
	mkdirSync(join(full, ".."), { recursive: true });
	const text = `${records.map((r) => JSON.stringify(r)).join("\n")}\n`;
	if (relPath.endsWith(".zst")) {
		writeFileSync(full, zstdCompress(Buffer.from(text)));
	} else {
		writeFileSync(full, text);
	}
	return full;
}

// Node >= 22.15 in CI and dev; the scanner's own runtime fallback is separate.
const zstdCompress = (buf: Buffer): Buffer =>
	(
		zlib as unknown as { zstdCompressSync: (b: Buffer) => Buffer }
	).zstdCompressSync(buf);

const missingConfig = { configFile: join("/nonexistent", "config.toml") };

describe("fingerprint gate (#73)", () => {
	it("ingests a genuine rollout: session_meta first, turn_context before usage", async () => {
		writeRollout("2026/07/20/rollout-a.jsonl", GENUINE);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root], ...missingConfig });
		expect(stats.filesRead).toBe(1);
		expect(stats.filesForeign).toBe(0);
		expect(finalize(agg).models[0].tokens.output).toBe(100);
	});

	it("excludes a file whose first line is not session_meta", async () => {
		writeRollout("2026/07/20/rollout-x.jsonl", [
			turnContext(),
			tokenCount(999),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root], ...missingConfig });
		expect(stats.filesForeign).toBe(1);
		expect(stats.filesRead).toBe(0);
		expect(stats.foreignOriginators.get("(none)")).toBe(1);
		expect(finalize(agg).totalTokens).toBe(0);
		expect(agg.lines).toBe(0);
	});

	it("excludes a file with usage but no turn_context anywhere, and names the originator", async () => {
		writeRollout("2026/07/20/rollout-y.jsonl", [
			sessionMeta("impostor-tool"),
			tokenCount(999),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root], ...missingConfig });
		expect(stats.filesForeign).toBe(1);
		expect(stats.foreignOriginators.get("impostor-tool")).toBe(1);
		expect(finalize(agg).totalTokens).toBe(0);
	});

	it("keeps a forked rollout where replayed usage precedes the first turn_context, counting only the fresh turn", async () => {
		// The replayed head re-stamps the parent's history at fork creation, so
		// it shares session_meta's timestamp; the fresh turn lands seconds later.
		writeRollout("2026/07/20/rollout-fork.jsonl", [
			sessionMeta(),
			{ ...tokenCount(999), timestamp: META_TS },
			turnContext(),
			tokenCount(100),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root], ...missingConfig });
		expect(stats.filesForeign).toBe(0);
		expect(stats.filesRead).toBe(1);
		expect(finalize(agg).models[0].tokens.output).toBe(100);
	});

	it("keeps a genuine no-usage file (session_meta only)", async () => {
		writeRollout("2026/07/20/rollout-idle.jsonl", [sessionMeta()]);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root], ...missingConfig });
		expect(stats.filesForeign).toBe(0);
		expect(stats.filesRead).toBe(1);
	});
});

describe("compressed rollouts", () => {
	it("reads a .zst rollout", async () => {
		writeRollout("2026/07/20/rollout-a.jsonl.zst", GENUINE);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root], ...missingConfig });
		expect(stats.filesRead).toBe(1);
		expect(finalize(agg).models[0].tokens.output).toBe(100);
	});

	it("counts a .jsonl and its .zst sibling once - the compression-worker window", async () => {
		writeRollout("2026/07/20/rollout-a.jsonl", GENUINE);
		writeRollout("2026/07/20/rollout-a.jsonl.zst", GENUINE);
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root], ...missingConfig });
		expect(stats.filesFound).toBe(2);
		expect(stats.filesSkippedAsDuplicate).toBe(1);
		expect(stats.filesRead).toBe(1);
		expect(finalize(agg).models[0].tokens.output).toBe(100);
	});

	it("retries the .zst sibling when the .jsonl vanished mid-scan (ENOENT)", async () => {
		const plain = writeRollout("2026/07/20/rollout-a.jsonl", GENUINE);
		writeRollout("2026/07/20/rollout-a.jsonl.zst", GENUINE);
		const { readFileSync } = await import("node:fs");
		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root],
			...missingConfig,
			readFileImpl: (file) => {
				if (file === plain) {
					throw Object.assign(new Error("gone"), { code: "ENOENT" });
				}
				return readFileSync(file);
			},
		});
		expect(stats.filesUnreadable).toBe(0);
		expect(stats.filesRead).toBe(1);
		expect(finalize(agg).models[0].tokens.output).toBe(100);
	});

	it("classifies a corrupt .zst without leaking the absolute path", async () => {
		const full = join(root, "2026/07/20/rollout-bad.jsonl.zst");
		mkdirSync(join(full, ".."), { recursive: true });
		writeFileSync(full, Buffer.from("not zstd at all"));
		const agg = createAggregate();
		const stats = await scan(agg, { roots: [root], ...missingConfig });
		expect(stats.filesUnreadable).toBe(1);
		expect(stats.unreadableFiles).toEqual([
			{
				path: join("2026/07/20", "rollout-bad.jsonl.zst"),
				reason: "zstd-corrupt",
			},
		]);
	});
});

describe("unreadable files are named locally (#75)", () => {
	it("records a relative path and a bare error class", async () => {
		const full = writeRollout("2026/07/20/rollout-a.jsonl", GENUINE);
		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root],
			...missingConfig,
			readFileImpl: () => {
				throw Object.assign(new Error(full), { code: "EACCES" });
			},
		});
		expect(stats.filesUnreadable).toBe(1);
		expect(stats.filesRead).toBe(0);
		expect(stats.unreadableFiles).toEqual([
			{ path: join("2026/07/20", "rollout-a.jsonl"), reason: "EACCES" },
		]);
	});
});
