// The Codex scanner's file-level behavior (#75, map #60): the genuine-rollout
// fingerprint from #73, the compression-race retry, the `.zst`/`.jsonl`
// double-count guard, and named-not-swallowed read failures.

import {
	createReadStream,
	mkdirSync,
	mkdtempSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import * as zlib from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { finalize } from "../shared/aggregate.js";
import { createAggregate } from "./analyzer.js";
import { scan } from "./scan.js";

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	return {
		...actual,
		readFileSync: (...args: Parameters<typeof actual.readFileSync>) => {
			if (String(args[0]).endsWith("rollout-limited.jsonl")) {
				throw Object.assign(
					new RangeError("File size exceeds whole-file read limit"),
					{ code: "ERR_FS_FILE_TOO_LARGE" },
				);
			}
			return Reflect.apply(actual.readFileSync, actual, args);
		},
	};
});

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

		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root],
			...missingConfig,
			readStreamImpl: (file, options) => {
				if (file === plain) {
					throw Object.assign(new Error("gone"), { code: "ENOENT" });
				}
				return createReadStream(file, options);
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
			readStreamImpl: () => {
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

it("reads rollouts when the runtime rejects whole-file allocation", async () => {
	writeRollout("rollout-limited.jsonl", GENUINE);
	const agg = createAggregate();
	const stats = await scan(agg, { roots: [root], ...missingConfig });
	expect(stats.filesUnreadable).toBe(0);
	expect(finalize(agg).models[0]?.tokens.output).toBe(100);
});

describe("bounded rollout streams", () => {
	it.each(["jsonl", "jsonl.zst"])(
		"decodes %s across byte, UTF-8 and JSONL boundaries",
		async (suffix) => {
			const text = [
				JSON.stringify(sessionMeta("codex-é😀")),
				"",
				"{bad",
				...GENUINE.slice(1).map((r) => JSON.stringify(r)),
			].join("\n");
			writeFileSync(
				join(root, `rollout-chunks.${suffix}`),
				suffix.endsWith("zst") ? zstdCompress(Buffer.from(text)) : text,
			);
			const agg = createAggregate();
			const stats = await scan(agg, {
				roots: [root],
				...missingConfig,
				chunkBytes: 1,
			});
			expect(stats.filesRead).toBe(1);
			expect(agg.lines).toBe(4);
			expect(agg.parseErrors).toBe(1);
			expect(finalize(agg).models[0]?.tokens.output).toBe(100);
		},
	);

	it.each([true, false])(
		"waits until EOF for a late fingerprint, genuine=%s",
		async (genuine) => {
			const records = [
				sessionMeta("late-é😀"),
				{ ...tokenCount(999), timestamp: META_TS },
				...Array.from({ length: 100 }, () => ({ type: "unknown" })),
				...(genuine ? [turnContext(), tokenCount(100)] : []),
			];
			writeRollout("rollout-late.jsonl", records);
			const agg = createAggregate();
			const stats = await scan(agg, {
				roots: [root],
				...missingConfig,
				chunkBytes: 7,
			});
			expect(stats.filesForeign).toBe(genuine ? 0 : 1);
			expect(finalize(agg).totalTokens).toBe(genuine ? 100 : 0);
			if (!genuine) {
				expect(agg.lines).toBe(0);
				expect(agg.parseErrors).toBe(0);
				expect(stats.foreignOriginators.get("late-é😀")).toBe(1);
			}
		},
	);

	it("discards an oversized record through its newline and resumes with visible parse coverage", async () => {
		writeRollout("rollout-big-record.jsonl", [
			sessionMeta(),
			{ type: "unknown", text: "x".repeat(2048) },
			...GENUINE.slice(1),
		]);
		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root],
			...missingConfig,
			chunkBytes: 13,
			maxLineBytes: 512,
		});
		expect(stats.filesRead).toBe(1);
		expect(agg.lines).toBe(4);
		expect(agg.parseErrors).toBe(1);
		expect(finalize(agg).totalTokens).toBe(100);
	});

	it("rejects a corrupt compressed checksum before any usage enters the aggregate", async () => {
		const bytes = zlib.zstdCompressSync(
			Buffer.from(GENUINE.map((r) => JSON.stringify(r)).join("\n")),
			{ params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 } },
		);
		bytes[bytes.length - 1] ^= 255;
		writeFileSync(join(root, "rollout-corrupt.jsonl.zst"), bytes);
		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root],
			...missingConfig,
			chunkBytes: 3,
		});
		expect(stats.filesUnreadable).toBe(1);
		expect(stats.unreadableFiles[0].reason).toBe("zstd-corrupt");
		expect(finalize(agg).totalTokens).toBe(0);
	});

	it.each(["jsonl", "jsonl.zst"])(
		"preserves source I/O error classification for %s",
		async (suffix) => {
			writeRollout(`rollout-error.${suffix}`, GENUINE);
			const agg = createAggregate();
			const stats = await scan(agg, {
				roots: [root],
				...missingConfig,
				readStreamImpl: () =>
					Readable.from(
						(async function* () {
							yield Buffer.from("x");
							throw Object.assign(new Error("private path"), { code: "EIO" });
						})(),
					) as ReturnType<typeof createReadStream>,
			});
			expect(stats.filesUnreadable).toBe(1);
			expect(stats.unreadableFiles[0].reason).toBe("EIO");
			expect(finalize(agg).totalTokens).toBe(0);
		},
	);

	it("marks a second-pass interruption unreadable instead of reporting complete coverage", async () => {
		const file = writeRollout("rollout-interrupted.jsonl", GENUINE);
		let reads = 0;
		const agg = createAggregate();
		const stats = await scan(agg, {
			roots: [root],
			...missingConfig,
			readStreamImpl: (_file, options) => {
				if (++reads === 1) return createReadStream(file, options);
				return Readable.from(
					(async function* () {
						yield Buffer.from(
							`${GENUINE.map((r) => JSON.stringify(r)).join("\n")}\n`,
						);
						throw Object.assign(new Error("private path"), { code: "EIO" });
					})(),
				) as ReturnType<typeof createReadStream>;
			},
		});
		expect(stats.filesRead).toBe(0);
		expect(stats.filesUnreadable).toBe(1);
		expect(stats.unreadableFiles[0].reason).toBe("EIO");
	});

	it("skips unchanged files before opening a stream", async () => {
		const file = writeRollout("rollout-old.jsonl", GENUINE);
		utimesSync(file, new Date(META_TS), new Date(META_TS));
		const read = vi.fn();
		const stats = await scan(createAggregate(), {
			roots: [root],
			...missingConfig,
			sinceMs: Date.parse(TS),
			readStreamImpl: read,
		});
		expect(stats.filesSkippedByMtime).toBe(1);
		expect(read).not.toHaveBeenCalled();
	});
});
