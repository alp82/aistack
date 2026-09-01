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
	reconcileAutoSync,
	settleAutoSync,
} from "./optin.js";

/**
 * Enable/disable the standing opt-in - wayfinder #62 (map #60), Codex half
 * added by #67, narrowed to ACTIVE harnesses by #101.
 *
 * The invariants: enable is flag+hooks or neither, a hook goes only to a
 * harness that ran inside the window, disable removes every hook it can reach,
 * and the flag flips even when a hook file resists (the flag is the publish
 * gate, the hooks are just the triggers). Every dep is injected - a test that
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

/** What aistack.to did with the permission. Re-armed per test. */
let setAutoSyncMock: ReturnType<typeof vi.fn>;

/**
 * A linked machine whose server write succeeds. The permission lives on the
 * stack now (#102/#103), so every enable and every revoke has a server half.
 */
const linked: Pick<EnableDeps, "getTokenImpl" | "setAutoSyncImpl"> = {
	getTokenImpl: () => "tok",
	setAutoSyncImpl: (token, flag) => setAutoSyncMock(token, flag),
};

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
	setAutoSyncMock = vi.fn(async () => ({
		autoSync: { enabled: true, frequencyHours: 24 },
		lastAutoSyncAt: null,
	}));
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("enableAutoSync", () => {
	test("writes the hook, then persists the flag and the answer", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "written" }));
		const res = await enableAutoSync(24, {
			settingsFile,
			...linked,
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
			...linked,
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
			...linked,
			installHook: () => ({ ok: true, message: "" }),
			...claudeOnly,
		});
		expect(getSettings(settingsFile).autoSync?.frequencyHours).toBe(6);
	});

	test("a custom frequency is capped at one day", async () => {
		await enableAutoSync(48, {
			settingsFile,
			...linked,
			installHook: () => ({ ok: true, message: "" }),
			...claudeOnly,
		});
		expect(setAutoSyncMock).toHaveBeenCalledWith("tok", {
			enabled: true,
			frequencyHours: 24,
		});
		expect(getSettings(settingsFile).autoSync?.frequencyHours).toBe(24);
	});

	test("with Codex active, the Codex hook is written and the trust step named", async () => {
		const installCodexHook = vi.fn(() => ({
			ok: true,
			message:
				"Codex hook written - open Codex and run /hooks once to trust it, or it will not run.",
		}));
		const res = await enableAutoSync(24, {
			settingsFile,
			...linked,
			installHook: () => ({ ok: true, message: "" }),
			installCodexHook,
			codexHookTrustedImpl: () => false,
			...bothHarnesses,
		});
		expect(res.ok).toBe(true);
		expect(installCodexHook).toHaveBeenCalledOnce();
		expect(res.message).toContain("/hooks");
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(true);
	});

	test("does not repeat the Codex trust step when the hook is already trusted", async () => {
		const res = await enableAutoSync(24, {
			settingsFile,
			...linked,
			installCodexHook: () => ({
				ok: true,
				message:
					"Codex hook written - open Codex and run /hooks once to trust it, or it will not run.",
			}),
			codexHookTrustedImpl: () => true,
			...codexOnly,
		});
		expect(res.ok).toBe(true);
		expect(res.message).not.toContain("/hooks");
	});

	test("a failed Codex hook write persists nothing", async () => {
		const res = await enableAutoSync(24, {
			settingsFile,
			...linked,
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
			...linked,
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
			...linked,
			installHook: () => ({ ok: true, message: "" }),
			installCodexHook,
			...claudeOnly,
		});
		expect(installCodexHook).not.toHaveBeenCalled();
	});

	test("the confirmation names the active harnesses, not Claude Code by default", async () => {
		const codex = await enableAutoSync(24, {
			settingsFile,
			...linked,
			installCodexHook: () => ({ ok: true, message: "" }),
			...codexOnly,
		});
		expect(codex.message).toContain("when a Codex session starts");
		expect(codex.message).not.toContain("Claude Code");

		const both = await enableAutoSync(24, {
			settingsFile,
			...linked,
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
			...linked,
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
	test("flips the flag and removes the hooks", async () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 6 } },
			settingsFile,
		);
		const removeHook = vi.fn(() => ({ ok: true, message: "removed" }));
		const removeCodexHook = vi.fn(() => ({ ok: true, message: "removed" }));
		const res = await disableAutoSync({
			settingsFile,
			...linked,
			removeHook,
			removeCodexHook,
		});
		expect(res.ok).toBe(true);
		expect(removeHook).toHaveBeenCalledOnce();
		expect(removeCodexHook).toHaveBeenCalledOnce();
		const s = getSettings(settingsFile);
		expect(s.autoSync?.enabled).toBe(false);
		expect(s.autoSync?.frequencyHours).toBe(6);
	});

	// #101: a revoke must reach a hook whose harness has since gone quiet.
	test("removes both hooks even when neither harness is active", async () => {
		const removeHook = vi.fn(() => ({ ok: true, message: "removed" }));
		const removeCodexHook = vi.fn(() => ({ ok: true, message: "removed" }));
		await disableAutoSync({
			settingsFile,
			...linked,
			removeHook,
			removeCodexHook,
			...nothingActive,
		});
		expect(removeHook).toHaveBeenCalledOnce();
		expect(removeCodexHook).toHaveBeenCalledOnce();
	});

	test("flips the flag even when a hook cannot be removed", async () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 24 } },
			settingsFile,
		);
		const res = await disableAutoSync({
			settingsFile,
			...linked,
			removeHook: () => ({ ok: false, message: "bad json" }),
			removeCodexHook: () => ({ ok: true, message: "" }),
		});
		expect(res.ok).toBe(false);
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(false);
		expect(res.message).toContain("nothing will publish");
	});
});

/**
 * The server half (#103). The stack holds the permission, the hooks are dumb
 * local triggers, and the two are written in an order that leaves no state
 * claiming more than the machine can deliver.
 */
describe("the server half of enable and revoke", () => {
	test("enable grants the permission on the stack before it writes a hook", async () => {
		const order: string[] = [];
		setAutoSyncMock = vi.fn(async () => {
			order.push("server");
			return {
				autoSync: { enabled: true, frequencyHours: 6 },
				lastAutoSyncAt: null,
			};
		});
		await enableAutoSync(6, {
			settingsFile,
			...linked,
			installHook: () => {
				order.push("hook");
				return { ok: true, message: "" };
			},
			...claudeOnly,
		});
		expect(setAutoSyncMock).toHaveBeenCalledWith("tok", {
			enabled: true,
			frequencyHours: 6,
		});
		// Server first: a refusal there must leave the machine untouched.
		expect(order).toEqual(["server", "hook"]);
	});

	test("a refused server write changes nothing on the machine", async () => {
		setAutoSyncMock = vi.fn(async () => {
			throw new Error("This machine is not linked");
		});
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await enableAutoSync(24, {
			settingsFile,
			...linked,
			installHook,
			...claudeOnly,
		});
		expect(res.ok).toBe(false);
		expect(res.message).toContain("not linked");
		expect(installHook).not.toHaveBeenCalled();
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
	});

	test("an unlinked machine cannot enable, and is told to sync first", async () => {
		// The permission lives on a stack. With no token there is no stack to
		// grant it on, so there is no half of this the machine can do alone.
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await enableAutoSync(24, {
			settingsFile,
			getTokenImpl: () => null,
			setAutoSyncImpl: (token, flag) => setAutoSyncMock(token, flag),
			installHook,
			...claudeOnly,
		});
		expect(res.ok).toBe(false);
		expect(res.message).toContain("sync");
		expect(setAutoSyncMock).not.toHaveBeenCalled();
		expect(installHook).not.toHaveBeenCalled();
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
	});

	test("revoke takes the permission off the stack too", async () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 6 } },
			settingsFile,
		);
		const res = await disableAutoSync({
			settingsFile,
			...linked,
			removeHook: () => ({ ok: true, message: "" }),
			removeCodexHook: () => ({ ok: true, message: "" }),
		});
		expect(res.ok).toBe(true);
		expect(setAutoSyncMock).toHaveBeenCalledWith("tok", { enabled: false });
	});

	test("a revoke lands on this machine even when the server cannot be told", async () => {
		// A revoke must never be blocked by the network. The local half runs
		// first and is complete on its own - `sync --auto` gates on it.
		setAutoSyncMock = vi.fn(async () => {
			throw new Error("ENOTFOUND");
		});
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 6 } },
			settingsFile,
		);
		const removeHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await disableAutoSync({
			settingsFile,
			...linked,
			removeHook,
			removeCodexHook: () => ({ ok: true, message: "" }),
		});
		expect(removeHook).toHaveBeenCalledOnce();
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(false);
		// Reported, not hidden: other machines still hold the permission.
		expect(res.ok).toBe(false);
		expect(res.message).toContain("ENOTFOUND");
	});

	test("an unlinked machine can still revoke locally", async () => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 6 } },
			settingsFile,
		);
		const res = await disableAutoSync({
			settingsFile,
			getTokenImpl: () => null,
			setAutoSyncImpl: (token, flag) => setAutoSyncMock(token, flag),
			removeHook: () => ({ ok: true, message: "" }),
			removeCodexHook: () => ({ ok: true, message: "" }),
		});
		expect(res.ok).toBe(true);
		expect(setAutoSyncMock).not.toHaveBeenCalled();
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(false);
	});
});

/**
 * The reconcile (#103). Not a prompt and not an ask: the owner already
 * answered on the web, and this is the machine catching up with them.
 */
describe("reconcileAutoSync", () => {
	test("the stack says on and a hook is missing: it installs one and says so", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await reconcileAutoSync(
			{ enabled: true, frequencyHours: 24 },
			{
				settingsFile,
				installHook,
				hookInstalledImpl: () => false,
				...claudeOnly,
			},
		);
		expect(installHook).toHaveBeenCalledOnce();
		expect(res?.ok).toBe(true);
		expect(res?.message).toContain("Claude Code");
		// The local flag mirrors the server's, or `sync --auto` stops at its own
		// gate and the web switch never takes effect.
		expect(getSettings(settingsFile).autoSync).toEqual({
			enabled: true,
			frequencyHours: 24,
		});
	});

	test("a hook that is already there is not rewritten, and nothing is said", async () => {
		saveSettings(
			{
				autoSync: { enabled: true, frequencyHours: 24 },
				autoSyncAnswered: true,
			},
			settingsFile,
		);
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await reconcileAutoSync(
			{ enabled: true, frequencyHours: 24 },
			{
				settingsFile,
				installHook,
				hookInstalledImpl: () => true,
				...claudeOnly,
			},
		);
		expect(installHook).not.toHaveBeenCalled();
		expect(res).toBeNull();
	});

	// The late second-harness adopter (#100 decision 6): Codex arrives months
	// after the opt-in, and one interactive sync gives it its trigger.
	test("a harness adopted later gets its trigger on the next sync", async () => {
		saveSettings(
			{
				autoSync: { enabled: true, frequencyHours: 24 },
				autoSyncAnswered: true,
			},
			settingsFile,
		);
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const installCodexHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await reconcileAutoSync(
			{ enabled: true, frequencyHours: 24 },
			{
				settingsFile,
				installHook,
				installCodexHook,
				hookInstalledImpl: () => true,
				codexHookInstalledImpl: () => false,
				...bothHarnesses,
			},
		);
		expect(installHook).not.toHaveBeenCalled();
		expect(installCodexHook).toHaveBeenCalledOnce();
		expect(res?.message).toContain("Codex");
	});

	test("the stack says off: it touches nothing", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await reconcileAutoSync(
			{ enabled: false, frequencyHours: 24 },
			{
				settingsFile,
				installHook,
				hookInstalledImpl: () => false,
				...claudeOnly,
			},
		);
		expect(installHook).not.toHaveBeenCalled();
		expect(res).toBeNull();
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
	});

	test("no stack has decided: it touches nothing, and the ask still owns this", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const res = await reconcileAutoSync(null, {
			settingsFile,
			installHook,
			hookInstalledImpl: () => false,
			...claudeOnly,
		});
		expect(installHook).not.toHaveBeenCalled();
		expect(res).toBeNull();
		expect(getSettings(settingsFile).autoSyncAnswered).toBeUndefined();
	});

	test("a hook that cannot be written is reported, and the flag is not mirrored", async () => {
		const res = await reconcileAutoSync(
			{ enabled: true, frequencyHours: 24 },
			{
				settingsFile,
				installHook: () => ({ ok: false, message: "bad json" }),
				hookInstalledImpl: () => false,
				...claudeOnly,
			},
		);
		expect(res?.ok).toBe(false);
		expect(res?.message).toContain("bad json");
		expect(getSettings(settingsFile).autoSync).toBeUndefined();
	});
});

/**
 * What an interactive sync does about auto-sync after it publishes (#103).
 * One step, three inputs: the stack decided, the stack refused, or nobody has.
 */
describe("settleAutoSync", () => {
	test("the stack has decided, so the machine reconciles and is not asked", async () => {
		const installHook = vi.fn(() => ({ ok: true, message: "" }));
		const asked = await settleAutoSync(
			{ enabled: true, frequencyHours: 24 },
			{
				settingsFile,
				installHook,
				hookInstalledImpl: () => false,
				...claudeOnly,
			},
		);
		expect(asked).toBe(false);
		expect(selectMock).not.toHaveBeenCalled();
		expect(installHook).toHaveBeenCalledOnce();
	});

	test("the stack refused, so the machine is not asked either", async () => {
		const asked = await settleAutoSync(
			{ enabled: false, frequencyHours: 24 },
			{ settingsFile, hookInstalledImpl: () => false, ...claudeOnly },
		);
		expect(asked).toBe(false);
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("nobody has decided, so the ask runs", async () => {
		selectMock.mockResolvedValue("later");
		const asked = await settleAutoSync(null, { settingsFile, ...claudeOnly });
		expect(asked).toBe(true);
		expect(selectMock).toHaveBeenCalledOnce();
	});
});

/** The hint the ask renders - #101's fifth bullet. */
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
			"a silent sync at most every 6 hours when a Codex session starts",
		);
	});

	test("a two-harness machine is asked about both", async () => {
		selectMock.mockResolvedValue("later");
		await offerAutoSyncOptIn({ settingsFile, ...bothHarnesses });
		expect(hintOfEnableOption()).toBe(
			"a silent sync at most every 6 hours when a Claude Code or Codex session starts",
		);
	});

	test("enable is the opt-out prompt default", async () => {
		selectMock.mockResolvedValue("later");
		await offerAutoSyncOptIn({ settingsFile, ...claudeOnly });
		expect(selectMock).toHaveBeenCalledWith(
			expect.objectContaining({ initialValue: "enable" }),
		);
	});

	test("never ask again suppresses later prompts", async () => {
		saveSettings({ autoSyncNeverAskAgain: true }, settingsFile);
		expect(await offerAutoSyncOptIn({ settingsFile, ...claudeOnly })).toBe(
			false,
		);
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("maybe later asks again after the next manual sync", async () => {
		selectMock.mockResolvedValue("later");
		expect(await offerAutoSyncOptIn({ settingsFile, ...claudeOnly })).toBe(
			true,
		);
		expect(getSettings(settingsFile).autoSyncNeverAskAgain).toBeUndefined();

		selectMock.mockClear();
		expect(await offerAutoSyncOptIn({ settingsFile, ...claudeOnly })).toBe(
			true,
		);
		expect(selectMock).toHaveBeenCalledOnce();
	});

	test("legacy binary declines are treated as maybe later", async () => {
		saveSettings({ autoSyncAnswered: true }, settingsFile);
		selectMock.mockResolvedValue("later");
		expect(await offerAutoSyncOptIn({ settingsFile, ...claudeOnly })).toBe(
			true,
		);
		expect(selectMock).toHaveBeenCalledOnce();
	});

	test("offers maybe later and a permanent refusal separately", async () => {
		selectMock.mockResolvedValue("never");
		await offerAutoSyncOptIn({ settingsFile, ...claudeOnly });
		const prompt = selectMock.mock.calls[0]?.[0] as {
			options: Array<{ value: string; label: string }>;
		};
		expect(
			prompt.options.map(({ value, label }) => ({ value, label })),
		).toEqual([
			{ value: "enable", label: "Enable" },
			{ value: "later", label: "Maybe later" },
			{ value: "never", label: "Never ask again" },
		]);
		expect(getSettings(settingsFile).autoSyncNeverAskAgain).toBe(true);
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
			...linked,
			installHook,
			installCodexHook,
			...codexOnly,
		});
		expect(installHook).not.toHaveBeenCalled();
		expect(installCodexHook).toHaveBeenCalledOnce();
		expect(getSettings(settingsFile).autoSync?.enabled).toBe(true);
	});
});
