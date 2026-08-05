import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getSettings, saveSettings } from "../config.js";
import { claudeAdapter, codexAdapter } from "../harness/index.js";
import {
	disableAutoSync,
	type EnableDeps,
	enableAutoSync,
	NOTHING_TO_TRIGGER,
	offerAutoSyncOptIn,
} from "./optin.js";

/**
 * Enable/disable the standing opt-in — wayfinder #62 (map #60), Codex half
 * added by #67, narrowed to ACTIVE harnesses by #101.
 *
 * The invariants: enable is flag+hooks or neither, a hook goes only to a
 * harness that ran inside the window, disable removes every hook it can reach,
 * and the flag flips even when a hook file resists (the flag is the publish
 * gate, the hooks are just the triggers). Every dep is injected — a test that
 * touches the REAL ~/.claude/settings.json or ~/.codex/hooks.json is a bug.
 */

const selectMock = vi.hoisted(() => vi.fn());
vi.mock("@clack/prompts", () => ({
	select: selectMock,
	isCancel: (v: unknown) => typeof v === "symbol",
	log: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

let dir: string;
let settingsFile: string;

/** Only Claude Code ran on the imaginary test machine unless a test says otherwise. */
const claudeOnly: Pick<EnableDeps, "detectedImpl"> = {
	detectedImpl: async () => [claudeAdapter],
};
const codexOnly: Pick<EnableDeps, "detectedImpl"> = {
	detectedImpl: async () => [codexAdapter],
};
const bothHarnesses: Pick<EnableDeps, "detectedImpl"> = {
	detectedImpl: async () => [claudeAdapter, codexAdapter],
};
const nothingActive: Pick<EnableDeps, "detectedImpl"> = {
	detectedImpl: async () => [],
};

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-optin-"));
	settingsFile = join(dir, "settings.json");
	selectMock.mockReset();
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("enableAutoSync", () => {
	test("writes the hook, then persists the flag and the answer", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "written" }));
		const res = await enableAutoSync(24, {
			settingsFile,
			installHook,
			...claudeOnly,
		});
		expect(res.ok).toBe(true);
		expect(installHook).toHaveBeenCalledOnce();
		const s = getSettings(settingsFile);
		expect(s.autoSync).toEqual({ enabled: true, frequencyHours: 24 });
		expect(s.autoSyncAnswered).toBe(true);
	});

	test("a failed hook write persists nothing", async () => {
		const installHook = vi.fn(() => ({ ok: false, message: "bad json" }));
		const res = await enableAutoSync(24, {
			settingsFile,
			installHook,
			...claudeOnly,
		});
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
		expect(getSettings(settingsFile).autoSyncAnswered).toBeUndefined();
	});

	test("a custom frequency persists", async () => {
		await enableAutoSync(6, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
			...claudeOnly,
		});
		expect(getSettings(settingsFile).autoSync?.frequencyHours).toBe(6);
	});

	test("with Codex active, the Codex hook is written and the trust step named", async () => {
		const installCodexHook = vi.fn(() => ({
			ok: true,
			message:
				"Codex hook written — open Codex and run /hooks once to trust it, or it will not run.",
		}));
		const res = await enableAutoSync(24, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
			installCodexHook,
			...bothHarnesses,
		});
		expect(res.ok).toBe(true);
		expect(installCodexHook).toHaveBeenCalledOnce();
		expect(res.message).toContain("/hooks");
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(true);
	});

	test("a failed Codex hook write persists nothing", async () => {
		const res = await enableAutoSync(24, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
			installCodexHook: () => ({ ok: false, message: "bad json" }),
			...bothHarnesses,
		});
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
	});

	// #101: the stale-harness machine. Claude Code is installed and its logs are
	// on disk, but nothing has run inside the window, so it gets no hook.
	test("a stale Claude Code gets no hook when only Codex is active", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const installCodexHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await enableAutoSync(24, {
			settingsFile,
			installHook,
			installCodexHook,
			...codexOnly,
		});
		expect(res.ok).toBe(true);
		expect(installHook).not.toHaveBeenCalled();
		expect(installCodexHook).toHaveBeenCalledOnce();
	});

	test("a stale Codex gets no hook when only Claude Code is active", async () => {
		const installCodexHook = vi.fn(() => ({ ok: true, message: "" }));
		await enableAutoSync(24, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
			installCodexHook,
			...claudeOnly,
		});
		expect(installCodexHook).not.toHaveBeenCalled();
	});

	test("the confirmation names the active harnesses, not Claude Code by default", async () => {
		const codex = await enableAutoSync(24, {
			settingsFile,
			installCodexHook: () => ({ ok: true, message: "" }),
			...codexOnly,
		});
		expect(codex.message).toContain("when a Codex session starts");
		expect(codex.message).not.toContain("Claude Code");

		const both = await enableAutoSync(24, {
			settingsFile,
			installHook: () => ({ ok: true, message: "" }),
			installCodexHook: () => ({ ok: true, message: "" }),
			...bothHarnesses,
		});
		expect(both.message).toContain(
			"when a Claude Code or Codex session starts",
		);
	});

	test("with no active harness it writes nothing and persists nothing", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const installCodexHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await enableAutoSync(24, {
			settingsFile,
			installHook,
			installCodexHook,
			...nothingActive,
		});
		expect(res.ok).toBe(false);
		expect(res.message).toBe(NOTHING_TO_TRIGGER);
		expect(installHook).not.toHaveBeenCalled();
		expect(installCodexHook).not.toHaveBeenCalled();
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
		const res = disableAutoSync({ settingsFile, removeHook, removeCodexHook });
		expect(res.ok).toBe(true);
		expect(removeHook).toHaveBeenCalledOnce();
		expect(removeCodexHook).toHaveBeenCalledOnce();
		const s = getSettings(settingsFile);
		expect(s.autoSync?.enabled).toBe(false);
		expect(s.autoSync?.frequencyHours).toBe(6);
	});

	// #101: a revoke must reach a hook whose harness has since gone quiet.
	test("removes both hooks even when neither harness is active", () => {
		const removeHook = vi.fn(() => ({ ok: true, message: "removed" }));
		const removeCodexHook = vi.fn(() => ({ ok: true, message: "removed" }));
		disableAutoSync({
			settingsFile,
			removeHook,
			removeCodexHook,
			...nothingActive,
		});
		expect(removeHook).toHaveBeenCalledOnce();
		expect(removeCodexHook).toHaveBeenCalledOnce();
	});

	test("flips the flag even when a hook cannot be removed", () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 24 } },
			settingsFile,
		);
		const res = disableAutoSync({
			settingsFile,
			removeHook: () => ({ ok: false, message: "bad json" }),
			removeCodexHook: () => ({ ok: true, message: "" }),
		});
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(false);
		expect(res.message).toContain("nothing will publish");
	});
});

/** The hint the ask renders — #101's fifth bullet. */
function hintOfEnableOption(): string {
	const arg = selectMock.mock.calls[0]?.[0] as {
		options: Array<{ value: string; hint?: string }>;
	};
	return arg.options.find((o) => o.value === "enable")?.hint ?? "";
}

describe("offerAutoSyncOptIn", () => {
	test("a Codex-only machine is asked about Codex sessions", async () => {
		selectMock.mockResolvedValue("later");
		const asked = await offerAutoSyncOptIn({ settingsFile, ...codexOnly });
		expect(asked).toBe(true);
		expect(hintOfEnableOption()).toBe(
			"a silent daily sync when a Codex session starts",
		);
	});

	test("a two-harness machine is asked about both", async () => {
		selectMock.mockResolvedValue("later");
		await offerAutoSyncOptIn({ settingsFile, ...bothHarnesses });
		expect(hintOfEnableOption()).toBe(
			"a silent daily sync when a Claude Code or Codex session starts",
		);
	});

	test("an answered machine is not asked again", async () => {
		saveSettings({ autoSyncAnswered: true }, settingsFile);
		expect(await offerAutoSyncOptIn({ settingsFile, ...claudeOnly })).toBe(
			false,
		);
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("with no active harness there is nothing to ask", async () => {
		expect(await offerAutoSyncOptIn({ settingsFile, ...nothingActive })).toBe(
			false,
		);
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("enabling reuses the harnesses the hint named", async () => {
		selectMock.mockResolvedValue("enable");
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const installCodexHook = vi.fn(() => ({ ok: true, message: "" }));
		await offerAutoSyncOptIn({
			settingsFile,
			installHook,
			installCodexHook,
			...codexOnly,
		});
		expect(installHook).not.toHaveBeenCalled();
		expect(installCodexHook).toHaveBeenCalledOnce();
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(true);
	});
});
