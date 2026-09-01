// The Codex hook file surgery - wayfinder #67 (map #60). Mirrors hook.test.ts:
// idempotent install, surgical remove, never rewrite unparseable JSON. Plus
// the two Codex-only properties: the self-detaching command text and the
// trust-hash check.

import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	CODEX_HOOK_COMMAND,
	codexAutoSyncHookInstalled,
	codexHookTrusted,
	installCodexAutoSyncHook,
	removeCodexAutoSyncHook,
} from "./codexHook.js";

let dir: string;
let file: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-codex-hook-"));
	file = join(dir, "hooks.json");
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("the command text", () => {
	test("self-detaches and exits - Codex does not honor async (#65 §6)", () => {
		expect(CODEX_HOOK_COMMAND).toContain("setsid nohup");
		expect(CODEX_HOOK_COMMAND).toContain("&'");
		expect(CODEX_HOOK_COMMAND).toContain(">/dev/null 2>&1");
	});

	test("uses @latest so the trust hash survives CLI updates", () => {
		expect(CODEX_HOOK_COMMAND).toContain("@use-aistack/cli@latest");
		expect(CODEX_HOOK_COMMAND).not.toMatch(/@\d/);
	});
});

describe("installCodexAutoSyncHook", () => {
	test("writes a startup-only SessionStart hook into a fresh file", () => {
		const res = installCodexAutoSyncHook(file);
		expect(res.ok).toBe(true);
		expect(res.message).toContain("/hooks");
		const parsed = JSON.parse(readFileSync(file, "utf-8"));
		const matchers = parsed.hooks.SessionStart;
		expect(matchers).toHaveLength(1);
		expect(matchers[0].matcher).toBe("startup");
		expect(matchers[0].hooks[0].command).toBe(CODEX_HOOK_COMMAND);
		expect(codexAutoSyncHookInstalled(file)).toBe(true);
	});

	test("is idempotent and preserves foreign hooks", () => {
		writeFileSync(
			file,
			JSON.stringify({
				hooks: {
					SessionStart: [
						{ hooks: [{ type: "command", command: "other-tool run" }] },
					],
					Stop: [{ hooks: [{ type: "command", command: "other-tool stop" }] }],
				},
			}),
		);
		installCodexAutoSyncHook(file);
		installCodexAutoSyncHook(file);
		const parsed = JSON.parse(readFileSync(file, "utf-8"));
		const commands = parsed.hooks.SessionStart.flatMap(
			(m: { hooks: Array<{ command: string }> }) =>
				m.hooks.map((h) => h.command),
		);
		expect(
			commands.filter((c: string) => c === CODEX_HOOK_COMMAND),
		).toHaveLength(1);
		expect(commands).toContain("other-tool run");
		expect(parsed.hooks.Stop).toHaveLength(1);
	});

	test("refuses to rewrite a file it cannot parse", () => {
		writeFileSync(file, "{not json");
		const res = installCodexAutoSyncHook(file);
		expect(res.ok).toBe(false);
		expect(readFileSync(file, "utf-8")).toBe("{not json");
	});
});

describe("removeCodexAutoSyncHook", () => {
	test("removes only our entry", () => {
		writeFileSync(
			file,
			JSON.stringify({
				hooks: {
					SessionStart: [
						{ hooks: [{ type: "command", command: "other-tool run" }] },
					],
				},
			}),
		);
		installCodexAutoSyncHook(file);
		const res = removeCodexAutoSyncHook(file);
		expect(res.ok).toBe(true);
		const parsed = JSON.parse(readFileSync(file, "utf-8"));
		const commands = parsed.hooks.SessionStart.flatMap(
			(m: { hooks: Array<{ command: string }> }) =>
				m.hooks.map((h) => h.command),
		);
		expect(commands).toEqual(["other-tool run"]);
		expect(codexAutoSyncHookInstalled(file)).toBe(false);
	});

	test("a missing file is success - the goal state holds", () => {
		expect(removeCodexAutoSyncHook(file).ok).toBe(true);
	});
});

describe("codexHookTrusted", () => {
	test("matches Codex's normalized full-definition hash at the hook key", () => {
		const config = join(dir, "config.toml");
		installCodexAutoSyncHook(file);
		const normalized = JSON.stringify({
			event_name: "session_start",
			hooks: [
				{
					async: false,
					command: CODEX_HOOK_COMMAND,
					timeout: 30,
					type: "command",
				},
			],
			matcher: "startup",
		});
		const hash = `sha256:${createHash("sha256").update(normalized).digest("hex")}`;
		writeFileSync(
			config,
			`[hooks.state."${file}:session_start:0:0"]\ntrusted_hash = "${hash}"\n`,
		);
		expect(codexHookTrusted(config, file)).toBe(true);
	});

	test("rejects the old command-only hash", () => {
		const config = join(dir, "config.toml");
		installCodexAutoSyncHook(file);
		const hash = createHash("sha256").update(CODEX_HOOK_COMMAND).digest("hex");
		writeFileSync(
			config,
			`[hooks.state."${file}:session_start:0:0"]\ntrusted_hash = "sha256:${hash}"\n`,
		);
		expect(codexHookTrusted(config, file)).toBe(false);
	});

	test("reports unknown for an unreadable config and false for a missing hook", () => {
		const config = join(dir, "config.toml");
		writeFileSync(config, "[hooks.state]\n");
		expect(codexHookTrusted(join(dir, "missing.toml"), file)).toBeNull();
		expect(codexHookTrusted(config, join(dir, "missing.json"))).toBe(false);
	});
});
