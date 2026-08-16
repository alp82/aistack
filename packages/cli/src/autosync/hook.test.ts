import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	AUTO_SYNC_HOOK_COMMAND,
	autoSyncHookInstalled,
	installAutoSyncHook,
	removeAutoSyncHook,
} from "./hook.js";

/**
 * SessionStart hook install/remove - wayfinder #62 (map #60).
 *
 * ~/.claude/settings.json belongs to the user. The two rules these tests pin:
 * never rewrite a file we cannot parse, and never touch hooks that are not
 * ours.
 */

let dir: string;
let file: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-hook-"));
	file = join(dir, "settings.json");
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

function read(): Record<string, unknown> {
	return JSON.parse(readFileSync(file, "utf-8"));
}

describe("installAutoSyncHook", () => {
	test("creates the file when it is missing", () => {
		const res = installAutoSyncHook(file);
		expect(res.ok).toBe(true);
		const settings = read() as {
			hooks: {
				SessionStart: { hooks: { command: string; async: boolean }[] }[];
			};
		};
		const entry = settings.hooks.SessionStart[0].hooks[0];
		expect(entry.command).toBe(AUTO_SYNC_HOOK_COMMAND);
		expect(entry.async).toBe(true);
	});

	test("the command self-updates via @latest with an offline fallback", () => {
		expect(AUTO_SYNC_HOOK_COMMAND).toContain("@use-aistack/cli@latest");
		expect(AUTO_SYNC_HOOK_COMMAND).toContain("|| npx -y --prefer-offline");
	});

	test("preserves foreign hooks and other settings keys", () => {
		writeFileSync(
			file,
			JSON.stringify({
				model: "opus",
				hooks: {
					SessionStart: [{ hooks: [{ type: "command", command: "echo hi" }] }],
					PreToolUse: [
						{ matcher: "Bash", hooks: [{ type: "command", command: "lint" }] },
					],
				},
			}),
		);
		installAutoSyncHook(file);
		const settings = read() as {
			model: string;
			hooks: { SessionStart: unknown[]; PreToolUse: unknown[] };
		};
		expect(settings.model).toBe("opus");
		expect(settings.hooks.PreToolUse).toHaveLength(1);
		expect(settings.hooks.SessionStart).toHaveLength(2);
	});

	test("is idempotent - a second install does not duplicate the hook", () => {
		installAutoSyncHook(file);
		installAutoSyncHook(file);
		const settings = read() as {
			hooks: { SessionStart: { hooks: unknown[] }[] };
		};
		expect(settings.hooks.SessionStart).toHaveLength(1);
	});

	test("replaces an older version of our command instead of stacking", () => {
		writeFileSync(
			file,
			JSON.stringify({
				hooks: {
					SessionStart: [
						{
							hooks: [
								{
									type: "command",
									command: "npx -y @use-aistack/cli sync --auto",
								},
							],
						},
					],
				},
			}),
		);
		installAutoSyncHook(file);
		const settings = read() as {
			hooks: { SessionStart: { hooks: { command: string }[] }[] };
		};
		expect(settings.hooks.SessionStart).toHaveLength(1);
		expect(settings.hooks.SessionStart[0].hooks[0].command).toBe(
			AUTO_SYNC_HOOK_COMMAND,
		);
	});

	test("refuses to touch a file that is not valid JSON", () => {
		writeFileSync(file, "{not json");
		const res = installAutoSyncHook(file);
		expect(res.ok).toBe(false);
		expect(readFileSync(file, "utf-8")).toBe("{not json");
	});
});

describe("removeAutoSyncHook", () => {
	test("a missing file is already the goal state", () => {
		expect(removeAutoSyncHook(file).ok).toBe(true);
	});

	test("removes only our hook and cleans up empty containers", () => {
		installAutoSyncHook(file);
		const res = removeAutoSyncHook(file);
		expect(res.ok).toBe(true);
		expect(read()).toEqual({});
	});

	test("keeps foreign SessionStart hooks and other events", () => {
		writeFileSync(
			file,
			JSON.stringify({
				hooks: {
					SessionStart: [{ hooks: [{ type: "command", command: "echo hi" }] }],
					PreToolUse: [{ hooks: [{ type: "command", command: "lint" }] }],
				},
			}),
		);
		installAutoSyncHook(file);
		removeAutoSyncHook(file);
		const settings = read() as {
			hooks: {
				SessionStart: { hooks: { command: string }[] }[];
				PreToolUse: unknown[];
			};
		};
		expect(settings.hooks.SessionStart).toHaveLength(1);
		expect(settings.hooks.SessionStart[0].hooks[0].command).toBe("echo hi");
		expect(settings.hooks.PreToolUse).toHaveLength(1);
	});

	test("refuses to touch a file that is not valid JSON", () => {
		writeFileSync(file, "{not json");
		const res = removeAutoSyncHook(file);
		expect(res.ok).toBe(false);
		expect(readFileSync(file, "utf-8")).toBe("{not json");
	});
});

describe("autoSyncHookInstalled", () => {
	test("false before install, true after, false after remove", () => {
		expect(autoSyncHookInstalled(file)).toBe(false);
		installAutoSyncHook(file);
		expect(autoSyncHookInstalled(file)).toBe(true);
		removeAutoSyncHook(file);
		expect(autoSyncHookInstalled(file)).toBe(false);
	});
});
