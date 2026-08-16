import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveSettings } from "../config.js";
import {
	claudeOnPath,
	findSkillSource,
	installClaudeConnect,
	offerConnectUpsell,
	type Runner,
	type RunResult,
} from "./connect.js";

const selectMock = vi.hoisted(() => vi.fn());
vi.mock("@clack/prompts", () => ({
	select: selectMock,
	isCancel: (v: unknown) => typeof v === "symbol",
	log: { success: vi.fn(), error: vi.fn(), message: vi.fn(), warn: vi.fn() },
}));

const ok = (output = ""): RunResult => ({ notFound: false, status: 0, output });
const fail = (output: string): RunResult => ({
	notFound: false,
	status: 1,
	output,
});
const notFound: RunResult = { notFound: true, status: null, output: "" };

function recordingRunner(results: RunResult[]): {
	run: Runner;
	calls: string[][];
} {
	const calls: string[][] = [];
	const run: Runner = (args) => {
		calls.push(args);
		return results[Math.min(calls.length - 1, results.length - 1)];
	};
	return { run, calls };
}

/**
 * The upsell gate - wayfinder #101 (map #76). A Codex-only user with a
 * months-old Claude Code install got this ask, which is what opened #100. The
 * gate is now Claude activity inside the window, THEN the binary on PATH.
 */
describe("offerConnectUpsell", () => {
	let dir: string;
	let settingsFile: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "aistack-upsell-"));
		settingsFile = join(dir, "settings.json");
		selectMock.mockReset();
		selectMock.mockResolvedValue("later");
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("does not ask when Claude Code has not run inside the window", async () => {
		const claudeOnPathImpl = vi.fn(() => true);
		await offerConnectUpsell({
			settingsFile,
			claudeActiveImpl: async () => false,
			claudeOnPathImpl,
		});
		expect(selectMock).not.toHaveBeenCalled();
		// The stale check comes first, so the subprocess never even runs.
		expect(claudeOnPathImpl).not.toHaveBeenCalled();
	});

	it("does not ask when claude is not on PATH, however recent the logs", async () => {
		await offerConnectUpsell({
			settingsFile,
			claudeActiveImpl: async () => true,
			claudeOnPathImpl: () => false,
		});
		expect(selectMock).not.toHaveBeenCalled();
	});

	it("asks when Claude Code is both active and installed", async () => {
		await offerConnectUpsell({
			settingsFile,
			claudeActiveImpl: async () => true,
			claudeOnPathImpl: () => true,
		});
		expect(selectMock).toHaveBeenCalledOnce();
	});

	it("does not ask twice", async () => {
		saveSettings({ connectClaudeAnswered: true }, settingsFile);
		await offerConnectUpsell({
			settingsFile,
			claudeActiveImpl: async () => true,
			claudeOnPathImpl: () => true,
		});
		expect(selectMock).not.toHaveBeenCalled();
	});
});

describe("findSkillSource", () => {
	it("finds the bundled Skill from the source tree (dev layout)", () => {
		const source = findSkillSource();
		expect(source).not.toBeNull();
		expect(source).toContain(join("skills", "aistack-sync"));
	});

	it("returns null when no skills directory exists above", () => {
		expect(findSkillSource("/")).toBeNull();
	});
});

describe("claudeOnPath", () => {
	it("is false when the binary is missing", () => {
		expect(claudeOnPath(() => notFound)).toBe(false);
	});

	it("is true even when --version exits nonzero", () => {
		expect(claudeOnPath(() => fail("boom"))).toBe(true);
	});
});

describe("installClaudeConnect", () => {
	it("registers the server then copies the Skill (both halves)", () => {
		const { run, calls } = recordingRunner([ok()]);
		const copies: Array<[string, string]> = [];
		const result = installClaudeConnect(run, (src, dest) => {
			copies.push([src, dest]);
		});
		expect(result.ok).toBe(true);
		expect(calls).toHaveLength(1);
		expect(calls[0]).toEqual([
			"mcp",
			"add",
			"--scope",
			"user",
			"aistack",
			"--",
			"npx",
			"-y",
			"@use-aistack/cli",
			"mcp",
		]);
		expect(copies).toHaveLength(1);
		expect(copies[0][0]).toContain(join("skills", "aistack-sync"));
		expect(copies[0][1]).toContain(join(".claude", "skills", "aistack-sync"));
	});

	it("installs nothing when claude is not on PATH", () => {
		const copies: string[] = [];
		const result = installClaudeConnect(
			() => notFound,
			() => {
				copies.push("copied");
			},
		);
		expect(result.ok).toBe(false);
		expect(copies).toHaveLength(0);
		expect(result.message).toContain("nothing was installed");
		expect(result.message).toContain(
			"claude mcp add --scope user aistack -- npx -y @use-aistack/cli mcp",
		);
	});

	it("does not copy the Skill when mcp add fails (neither half)", () => {
		const copies: string[] = [];
		const result = installClaudeConnect(
			() => fail("some registration error"),
			() => {
				copies.push("copied");
			},
		);
		expect(result.ok).toBe(false);
		expect(copies).toHaveLength(0);
		expect(result.message).toContain("some registration error");
	});

	it("treats an already-registered server as success and still copies", () => {
		const copies: string[] = [];
		const result = installClaudeConnect(
			() => fail("A stdio MCP server named 'aistack' already exists"),
			() => {
				copies.push("copied");
			},
		);
		expect(result.ok).toBe(true);
		expect(copies).toHaveLength(1);
	});

	it("rolls back a fresh registration when the Skill copy fails", () => {
		const { run, calls } = recordingRunner([ok(), ok()]);
		const result = installClaudeConnect(run, () => {
			throw new Error("disk full");
		});
		expect(result.ok).toBe(false);
		expect(calls).toHaveLength(2);
		expect(calls[1]).toEqual(["mcp", "remove", "--scope", "user", "aistack"]);
		expect(result.message).toContain("rolled back");
		expect(result.message).toContain("disk full");
	});

	it("leaves a pre-existing registration alone when the Skill copy fails", () => {
		const { run, calls } = recordingRunner([fail("already exists"), ok()]);
		const result = installClaudeConnect(run, () => {
			throw new Error("disk full");
		});
		expect(result.ok).toBe(false);
		expect(calls).toHaveLength(1);
		expect(result.message).toContain("left as it was");
	});
});
