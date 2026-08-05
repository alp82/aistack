// Window-based harness detection — wayfinder #101 (map #76), decided in #100.
//
// "Detected" means active in the sync window, not "the log directory is still
// on disk". The machine this exists for: a Codex-only user whose months-old
// Claude Code install made the scan publish a dead snapshot, made the connect
// upsell appear, and made the opt-in write a Claude hook.

import {
	mkdirSync,
	mkdtempSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enableAutoSync } from "../autosync/optin.js";
import { claudeRecentlyActive } from "../commands/connect.js";
import { claudeAdapter } from "./claude/adapter.js";
import { codexAdapter } from "./codex/adapter.js";
import { detectedAdapters, detectionSinceMs } from "./index.js";

const NOW = Date.UTC(2026, 7, 5, 12, 0, 0);
const DAY = 86_400_000;
const SINCE = detectionSinceMs(NOW);

let dir: string;
const savedEnv = {
	CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
	CODEX_HOME: process.env.CODEX_HOME,
};

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-detect-"));
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
	for (const [key, value] of Object.entries(savedEnv)) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
});

/** Write a transcript under `dir` and stamp the mtime detection reads. */
function write(relPath: string, mtimeMs: number): void {
	const full = join(dir, relPath);
	mkdirSync(join(full, ".."), { recursive: true });
	writeFileSync(full, "{}\n");
	utimesSync(full, mtimeMs / 1000, mtimeMs / 1000);
}

const claudeRoot = () => join(dir, "claude");
const codexRoot = () => join(dir, "codex");

describe("detectionSinceMs", () => {
	it("opens the same 30-day window the scan uses", () => {
		expect(new Date(detectionSinceMs(NOW)).toISOString()).toBe(
			"2026-07-07T00:00:00.000Z",
		);
	});
});

describe("claudeAdapter.detect", () => {
	it("an existing root with only stale transcripts is not detected", async () => {
		write("claude/proj-a/sess-1.jsonl", NOW - 90 * DAY);
		expect(
			await claudeAdapter.detect({ sinceMs: SINCE, roots: [claudeRoot()] }),
		).toBe(false);
	});

	it("one in-window transcript detects the harness", async () => {
		write("claude/proj-a/sess-1.jsonl", NOW - 90 * DAY);
		write("claude/proj-b/sess-2.jsonl", NOW - DAY);
		expect(
			await claudeAdapter.detect({ sinceMs: SINCE, roots: [claudeRoot()] }),
		).toBe(true);
	});

	it("a missing root is not detected", async () => {
		expect(
			await claudeAdapter.detect({ sinceMs: SINCE, roots: [claudeRoot()] }),
		).toBe(false);
	});

	it("a recent non-transcript file does not detect the harness", async () => {
		write("claude/proj-a/notes.md", NOW);
		expect(
			await claudeAdapter.detect({ sinceMs: SINCE, roots: [claudeRoot()] }),
		).toBe(false);
	});
});

describe("codexAdapter.detect", () => {
	it("an existing root with only stale rollouts is not detected", async () => {
		write("codex/2026/01/02/rollout-old.jsonl", NOW - 200 * DAY);
		expect(
			await codexAdapter.detect({ sinceMs: SINCE, roots: [codexRoot()] }),
		).toBe(false);
	});

	it("one in-window rollout detects the harness", async () => {
		write("codex/2026/08/04/rollout-new.jsonl", NOW - DAY);
		expect(
			await codexAdapter.detect({ sinceMs: SINCE, roots: [codexRoot()] }),
		).toBe(true);
	});

	it("a compressed rollout counts", async () => {
		write("codex/2026/08/04/rollout-new.jsonl.zst", NOW - DAY);
		expect(
			await codexAdapter.detect({ sinceMs: SINCE, roots: [codexRoot()] }),
		).toBe(true);
	});

	it("a recent file that is not a rollout does not detect the harness", async () => {
		write("codex/history.jsonl", NOW);
		expect(
			await codexAdapter.detect({ sinceMs: SINCE, roots: [codexRoot()] }),
		).toBe(false);
	});
});

describe("detectedAdapters", () => {
	it("skips the stale harness and keeps the live one", async () => {
		process.env.CLAUDE_CONFIG_DIR = join(dir, "claude-home");
		process.env.CODEX_HOME = join(dir, "codex-home");
		write("claude-home/projects/proj-a/sess-1.jsonl", NOW - 90 * DAY);
		write("codex-home/sessions/2026/08/04/rollout-new.jsonl", NOW - DAY);

		const names = (await detectedAdapters(SINCE)).map((a) => a.name);
		expect(names).toEqual(["codex"]);
	});

	it("returns both when both are active, Claude Code first", async () => {
		process.env.CLAUDE_CONFIG_DIR = join(dir, "claude-home");
		process.env.CODEX_HOME = join(dir, "codex-home");
		write("claude-home/projects/proj-a/sess-1.jsonl", NOW - DAY);
		write("codex-home/sessions/2026/08/04/rollout-new.jsonl", NOW - DAY);

		const names = (await detectedAdapters(SINCE)).map((a) => a.name);
		expect(names).toEqual(["claude-code", "codex"]);
	});

	it("returns nothing when every harness is stale", async () => {
		process.env.CLAUDE_CONFIG_DIR = join(dir, "claude-home");
		process.env.CODEX_HOME = join(dir, "codex-home");
		write("claude-home/projects/proj-a/sess-1.jsonl", NOW - 90 * DAY);
		write("codex-home/sessions/2026/01/02/rollout-old.jsonl", NOW - 200 * DAY);

		expect(await detectedAdapters(SINCE)).toEqual([]);
	});
});

/**
 * The ticket's done-bar (#101), on a real filesystem and the real wall clock:
 * a machine with only stale Claude Code logs gets no Claude scan, no Claude
 * upsell, and no Claude hook. This is the machine from #100 — a Codex-only user
 * whose months-old Claude Code install drove all three.
 */
describe("a machine with only stale Claude logs", () => {
	const REAL_NOW = Date.now();
	let settingsFile: string;

	beforeEach(() => {
		settingsFile = join(dir, "settings.json");
		process.env.CLAUDE_CONFIG_DIR = join(dir, "claude-home");
		process.env.CODEX_HOME = join(dir, "codex-home");
		write("claude-home/projects/proj-a/sess-1.jsonl", REAL_NOW - 200 * DAY);
		write(
			"codex-home/sessions/2026/08/04/rollout-live.jsonl",
			REAL_NOW - 2 * 3_600_000,
		);
	});

	it("does not scan Claude Code", async () => {
		const scanned: string[] = [];
		for (const adapter of await detectedAdapters()) scanned.push(adapter.name);
		expect(scanned).toEqual(["codex"]);
	});

	it("does not offer the Claude connect upsell", async () => {
		expect(await claudeRecentlyActive()).toBe(false);
	});

	it("does not write the Claude hook", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const installCodexHook = vi.fn(() => ({ ok: true, message: "" }));
		const result = await enableAutoSync(24, {
			settingsFile,
			installHook,
			installCodexHook,
		});
		expect(result.ok).toBe(true);
		expect(installHook).not.toHaveBeenCalled();
		expect(installCodexHook).toHaveBeenCalledOnce();
		expect(result.message).toContain("when a Codex session starts");
	});
});
