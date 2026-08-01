import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getSettings, saveSettings } from "../config.js";
import { disableAutoSync, enableAutoSync } from "./optin.js";

/**
 * Enable/disable the standing opt-in — wayfinder #62 (map #60).
 *
 * The invariants: enable is flag+hook or neither, disable flips the flag even
 * when the hook file resists (the flag is the publish gate, the hook is just
 * the trigger).
 */

let dir: string;
let settingsFile: string;

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
		const res = enableAutoSync(24, { settingsFile, installHook });
		expect(res.ok).toBe(true);
		expect(installHook).toHaveBeenCalledOnce();
		const s = getSettings(settingsFile);
		expect(s.autoSync).toEqual({ enabled: true, frequencyHours: 24 });
		expect(s.autoSyncAnswered).toBe(true);
	});

	test("a failed hook write persists nothing", () => {
		const installHook = vi.fn(() => ({ ok: false, message: "bad json" }));
		const res = enableAutoSync(24, { settingsFile, installHook });
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
		expect(getSettings(settingsFile).autoSyncAnswered).toBeUndefined();
	});

	test("a custom frequency persists", () => {
		enableAutoSync(6, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
		});
		expect(getSettings(settingsFile).autoSync?.frequencyHours).toBe(6);
	});
});

describe("disableAutoSync", () => {
	test("flips the flag and removes the hook", () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 6 } },
			settingsFile,
		);
		const removeHook = vi.fn(() => ({ ok: true, message: "removed" }));
		const res = disableAutoSync({ settingsFile, removeHook });
		expect(res.ok).toBe(true);
		expect(removeHook).toHaveBeenCalledOnce();
		const s = getSettings(settingsFile);
		expect(s.autoSync?.enabled).toBe(false);
		expect(s.autoSync?.frequencyHours).toBe(6);
	});

	test("flips the flag even when the hook cannot be removed", () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 24 } },
			settingsFile,
		);
		const res = disableAutoSync({
			settingsFile,
			removeHook: () => ({ ok: false, message: "bad json" }),
		});
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(false);
		expect(res.message).toContain("nothing will publish");
	});
});
