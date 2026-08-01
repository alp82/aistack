import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getSettings, saveSettings } from "../config.js";
import { disableAutoSync, type EnableDeps, enableAutoSync } from "./optin.js";

/**
 * Enable/disable the standing opt-in — wayfinder #62 (map #60), Codex half
 * added by #67.
 *
 * The invariants: enable is flag+hooks or neither, disable flips the flag even
 * when a hook file resists (the flag is the publish gate, the hooks are just
 * the triggers). Every dep is injected — a test that touches the REAL
 * ~/.claude/settings.json or ~/.codex/hooks.json is a bug.
 */

let dir: string;
let settingsFile: string;

/** No Codex on the imaginary test machine unless a test says otherwise. */
const noCodex: Pick<EnableDeps, "codexPresentImpl"> = {
	codexPresentImpl: () => false,
};

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-optin-"));
	settingsFile = join(dir, "settings.json");
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("enableAutoSync", () => {
	test("writes the hook, then persists the flag and the answer", () => {
		const installHook = vi.fn(() => ({ ok: true, message: "written" }));
		const res = enableAutoSync(24, { settingsFile, installHook, ...noCodex });
		expect(res.ok).toBe(true);
		expect(installHook).toHaveBeenCalledOnce();
		const s = getSettings(settingsFile);
		expect(s.autoSync).toEqual({ enabled: true, frequencyHours: 24 });
		expect(s.autoSyncAnswered).toBe(true);
	});

	test("a failed hook write persists nothing", () => {
		const installHook = vi.fn(() => ({ ok: false, message: "bad json" }));
		const res = enableAutoSync(24, { settingsFile, installHook, ...noCodex });
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
		expect(getSettings(settingsFile).autoSyncAnswered).toBeUndefined();
	});

	test("a custom frequency persists", () => {
		enableAutoSync(6, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
			...noCodex,
		});
		expect(getSettings(settingsFile).autoSync?.frequencyHours).toBe(6);
	});

	test("with Codex present, the Codex hook is written and the trust step named", () => {
		const installCodexHook = vi.fn(() => ({
			ok: true,
			message:
				"Codex hook written — open Codex and run /hooks once to trust it, or it will not run.",
		}));
		const res = enableAutoSync(24, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
			installCodexHook,
			codexPresentImpl: () => true,
		});
		expect(res.ok).toBe(true);
		expect(installCodexHook).toHaveBeenCalledOnce();
		expect(res.message).toContain("/hooks");
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(true);
	});

	test("a failed Codex hook write persists nothing", () => {
		const res = enableAutoSync(24, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
			installCodexHook: () => ({ ok: false, message: "bad json" }),
			codexPresentImpl: () => true,
		});
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
	});
});

describe("disableAutoSync", () => {
	test("flips the flag and removes the hooks", () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 6 } },
			settingsFile,
		);
		const removeHook = vi.fn(() => ({ ok: true, message: "removed" }));
		const removeCodexHook = vi.fn(() => ({ ok: true, message: "removed" }));
		const res = disableAutoSync({
			settingsFile,
			removeHook,
			removeCodexHook,
			codexPresentImpl: () => true,
		});
		expect(res.ok).toBe(true);
		expect(removeHook).toHaveBeenCalledOnce();
		expect(removeCodexHook).toHaveBeenCalledOnce();
		const s = getSettings(settingsFile);
		expect(s.autoSync?.enabled).toBe(false);
		expect(s.autoSync?.frequencyHours).toBe(6);
	});

	test("flips the flag even when a hook cannot be removed", () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 24 } },
			settingsFile,
		);
		const res = disableAutoSync({
			settingsFile,
			removeHook: () => ({ ok: false, message: "bad json" }),
			...noCodex,
		});
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(false);
		expect(res.message).toContain("nothing will publish");
	});
});
