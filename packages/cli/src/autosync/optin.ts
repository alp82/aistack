// The auto-sync opt-in (#62, map #60), narrowed to active harnesses by #101,
// and moved onto the stack by #103.
//
// WHERE THE PERMISSION LIVES: on the stack, in Convex (#100 decision 2, #102).
// The local flag and the SessionStart hooks are what this machine holds, and
// neither of them grants anything - `sync --auto` asks the stack before it
// publishes. So enable grants on the stack first, revoke revokes here first,
// and `reconcileAutoSync` brings a machine in line with an answer the owner
// gave somewhere else.
//
// This ask is the PRIMARY post-sync ask: it runs first, and the connect-claude
// upsell yields to a later sync (at most one ask per sync). "Maybe later" and
// ctrl-C leave no decision, so the question returns on the next manual sync.
// Only "Never ask again" persists a local refusal. A stack that has already
// decided is never asked at all: `settleAutoSync` reconciles it instead.

import * as p from "@clack/prompts";
import { setAutoSync } from "../api.js";
import {
	DEFAULT_FREQUENCY_HOURS,
	getSettings,
	getToken,
	normalizeFrequencyHours,
	saveSettings,
} from "../config.js";
import { CLAUDE_HARNESS_NAME } from "../harness/claude/adapter.js";
import { CODEX_HARNESS_NAME } from "../harness/codex/adapter.js";
import {
	type AutoSyncPermission,
	DEFAULT_WINDOW_DAYS,
	detectedAdapters,
	harnessLabel,
	harnessListLabel,
} from "../harness/index.js";
import type { HarnessAdapter } from "../harness/types.js";
import { dim, limeBold } from "../theme.js";
import {
	codexAutoSyncHookInstalled,
	installCodexAutoSyncHook,
	removeCodexAutoSyncHook,
} from "./codexHook.js";
import {
	autoSyncHookInstalled,
	type HookResult,
	installAutoSyncHook,
	removeAutoSyncHook,
} from "./hook.js";

export interface EnableDeps {
	settingsFile?: string;
	installHook?: () => HookResult;
	removeHook?: () => HookResult;
	installCodexHook?: () => HookResult;
	removeCodexHook?: () => HookResult;
	/** Is the Claude Code trigger already on this machine? */
	hookInstalledImpl?: () => boolean;
	/** Is the Codex trigger already on this machine? */
	codexHookInstalledImpl?: () => boolean;
	/** Override the detected harness set. Tests only. */
	detectedImpl?: () => Promise<HarnessAdapter[]>;
	getTokenImpl?: () => string | null;
	setAutoSyncImpl?: typeof setAutoSync;
}

/** What an unlinked machine is told when it tries to grant the permission. */
export const NOT_LINKED =
	"This machine is not linked to an aistack account, and the auto-sync permission lives on your stack. Run `npx @use-aistack/cli sync` first.";

/** The message when the machine has no active harness to trigger anything. */
export const NOTHING_TO_TRIGGER = `No Claude Code or Codex session on this machine in the last ${DEFAULT_WINDOW_DAYS} days, so nothing would trigger an auto-sync. Nothing was changed.`;

/**
 * Turn auto-sync on: grant the permission on the STACK, then write the
 * SessionStart hooks - one per DETECTED harness (#101). A hook for a harness
 * whose last session predates the window is a trigger that will never fire, and
 * its install is the step that made a dead Claude Code install look alive.
 *
 * THE STACK IS ASKED FIRST (#103). The permission is the thing that lets a
 * publish happen, and the hooks are dumb local triggers for it - so a refusal
 * from aistack.to leaves the machine exactly as it was, with no hook running an
 * npx at every session start for a permission nobody granted.
 *
 * When a hook write then fails, the local flag is NOT persisted. The stack
 * shows on-but-never-fired, which is true, and the next interactive sync
 * reconciles the missing trigger.
 */
export async function enableAutoSync(
	frequencyHours: number = DEFAULT_FREQUENCY_HOURS,
	deps: EnableDeps = {},
): Promise<HookResult> {
	frequencyHours = normalizeFrequencyHours(frequencyHours);
	const detected = await (deps.detectedImpl ?? detectedAdapters)();
	if (detected.length === 0) {
		return { ok: false, message: NOTHING_TO_TRIGGER };
	}
	const names = new Set(detected.map((a) => a.name));

	const token = (deps.getTokenImpl ?? getToken)();
	if (token === null) return { ok: false, message: NOT_LINKED };
	try {
		await (deps.setAutoSyncImpl ?? setAutoSync)(token, {
			enabled: true,
			frequencyHours,
		});
	} catch (e) {
		return {
			ok: false,
			message: `Auto-sync was not turned on: ${e instanceof Error ? e.message : String(e)}`,
		};
	}

	if (names.has(CLAUDE_HARNESS_NAME)) {
		const result = (deps.installHook ?? installAutoSyncHook)();
		if (!result.ok) return result;
	}

	let trustLine: string | null = null;
	if (names.has(CODEX_HARNESS_NAME)) {
		const codexResult = (deps.installCodexHook ?? installCodexAutoSyncHook)();
		if (!codexResult.ok) return codexResult;
		// The one-time /hooks trust step (#65 §6) - repeated by the next
		// interactive sync while the hook stays untrusted.
		trustLine = codexResult.message;
	}

	saveSettings(
		{
			autoSyncAnswered: true,
			autoSync: { enabled: true, frequencyHours },
		},
		deps.settingsFile,
	);
	return {
		ok: true,
		message: [
			`Auto-sync is on. It runs about every ${frequencyHours}h when a ${harnessListLabel(detected)} session starts. Turn it off any time: npx @use-aistack/cli sync --auto off`,
			...(trustLine ? [trustLine] : []),
		].join("\n"),
	};
}

/**
 * Revoke: flip the local flag, remove the hooks, then take the permission off
 * the stack. The flag flips even when a hook file cannot be edited, because
 * `sync --auto` gates on it - a stale hook without the flag publishes nothing.
 *
 * THE LOCAL HALF RUNS FIRST, the mirror image of enable (#103). A revoke must
 * never be blocked by an unreachable network: this machine stops publishing the
 * moment the flag flips, whatever aistack.to says next. The server half is
 * still reported when it fails, because it is the half that reaches every OTHER
 * machine, and the owner can also use the switch on their stack page.
 *
 * Removal is unconditional, unlike install: a revoke must reach the hook of a
 * harness that has since gone quiet, and removing an absent hook is success.
 */
export async function disableAutoSync(
	deps: EnableDeps = {},
): Promise<HookResult> {
	const settings = getSettings(deps.settingsFile);
	saveSettings(
		{
			autoSyncAnswered: true,
			autoSync: {
				enabled: false,
				frequencyHours: normalizeFrequencyHours(
					settings.autoSync?.frequencyHours,
				),
			},
		},
		deps.settingsFile,
	);
	const result = (deps.removeHook ?? removeAutoSyncHook)();
	const codexResult = (deps.removeCodexHook ?? removeCodexAutoSyncHook)();
	const failures = [result, codexResult]
		.filter((r) => !r.ok)
		.map((r) => r.message);

	const token = (deps.getTokenImpl ?? getToken)();
	if (token !== null) {
		try {
			await (deps.setAutoSyncImpl ?? setAutoSync)(token, { enabled: false });
		} catch (e) {
			failures.push(
				`aistack.to was not told (${e instanceof Error ? e.message : String(e)}); your other machines keep the permission`,
			);
		}
	}

	if (failures.length > 0) {
		return {
			ok: false,
			message: `Auto-sync is off on this machine (nothing will publish), but: ${failures.join("; ")}`,
		};
	}
	return {
		ok: true,
		message: "Auto-sync is off. The hooks were removed.",
	};
}

/**
 * Bring the machine in line with the permission the stack holds (#103).
 *
 * This is not an ask and never prompts. The owner already answered, on the web
 * switch or on another machine, and this is the machine catching up with them:
 *
 *   - flag ON  - install a trigger for every DETECTED harness that lacks one,
 *                and mirror the flag locally so `sync --auto` passes its own
 *                gate. That is what makes "flip the web switch, run one sync"
 *                the whole enable story, and it is also what gives a harness
 *                adopted months later its trigger.
 *   - flag OFF - touch nothing. The revoke is already in force: `sync --auto`
 *                asks the stack before it publishes, so a live hook on this
 *                machine publishes nothing.
 *   - ABSENT   - touch nothing. Nobody has decided, and the post-sync ask still
 *                owns that case.
 *
 * Returns the one line to print, or `null` when there was nothing to do.
 */
export async function reconcileAutoSync(
	permission: AutoSyncPermission | null,
	deps: EnableDeps = {},
): Promise<HookResult | null> {
	if (permission?.enabled !== true) return null;

	const detected = await (deps.detectedImpl ?? detectedAdapters)();
	if (detected.length === 0) return null;
	const names = new Set(detected.map((a) => a.name));

	const installed: string[] = [];
	const failures: string[] = [];
	const install = (
		harnessName: string,
		isInstalled: () => boolean,
		write: () => HookResult,
	) => {
		if (!names.has(harnessName) || isInstalled()) return;
		const result = write();
		if (result.ok) installed.push(harnessLabel(harnessName));
		else failures.push(result.message);
	};

	install(
		CLAUDE_HARNESS_NAME,
		deps.hookInstalledImpl ?? autoSyncHookInstalled,
		deps.installHook ?? installAutoSyncHook,
	);
	install(
		CODEX_HARNESS_NAME,
		deps.codexHookInstalledImpl ?? codexAutoSyncHookInstalled,
		deps.installCodexHook ?? installCodexAutoSyncHook,
	);

	if (failures.length > 0) {
		return {
			ok: false,
			message: `Auto-sync is on for this stack, but a trigger could not be written: ${failures.join("; ")}`,
		};
	}

	const frequencyHours = permission.frequencyHours ?? DEFAULT_FREQUENCY_HOURS;
	const local = getSettings(deps.settingsFile).autoSync;
	const mirrored =
		local?.enabled === true && local.frequencyHours === frequencyHours;
	if (!mirrored) {
		saveSettings(
			{ autoSyncAnswered: true, autoSync: { enabled: true, frequencyHours } },
			deps.settingsFile,
		);
	}

	// Quiet when nothing changed. The steady state is already reported by the
	// `auto-sync: <last result>` line the interactive sync prints.
	if (installed.length === 0 && mirrored) return null;
	return {
		ok: true,
		message:
			installed.length > 0
				? `Auto-sync is on for this stack. Installed the ${installed.join(" and ")} trigger on this machine; it runs about every ${frequencyHours}h when a session starts.`
				: `Auto-sync is on for this stack. It runs about every ${frequencyHours}h when a ${harnessListLabel(detected)} session starts.`,
	};
}

/**
 * Everything an interactive sync does about auto-sync, after it publishes.
 *
 * One step with three inputs, because the stack's answer is what decides which
 * of them applies (#103): a stack that has decided is reconciled and never
 * asked again, and only a stack nobody has decided for reaches the ask. The ask
 * asked once and persisted is #62's rule, and the switch now outranks it -
 * re-asking an owner who already answered on the web is asking them twice.
 *
 * Returns true when it ASKED, so the caller knows to hold the connect upsell
 * back to a later sync (at most one ask per sync, #62).
 */
export async function settleAutoSync(
	permission: AutoSyncPermission | null,
	deps: EnableDeps = {},
): Promise<boolean> {
	if (permission !== null) {
		const result = await reconcileAutoSync(permission, deps);
		if (result === null) return false;
		if (result.ok) p.log.success(result.message);
		else p.log.warn(result.message);
		return false;
	}
	return offerAutoSyncOptIn(deps);
}

/**
 * The post-sync ask. Returns true when it asked (so the caller skips the
 * connect upsell this sync), false when it had nothing to ask.
 *
 * The hint names the harnesses this machine actually runs (#101): a Codex-only
 * user is told "when a Codex session starts", not a Claude Code sentence that
 * describes nothing they do.
 */
export async function offerAutoSyncOptIn(
	deps: EnableDeps = {},
): Promise<boolean> {
	if (getSettings(deps.settingsFile).autoSyncNeverAskAgain === true)
		return false;

	const detected = await (deps.detectedImpl ?? detectedAdapters)();
	if (detected.length === 0) return false;

	const answer = await p.select({
		message: "Keep this stack fresh automatically every 6 hours?",
		options: [
			{
				value: "enable",
				label: "Enable",
				hint: `a silent sync at most every 6 hours when a ${harnessListLabel(detected)} session starts`,
			},
			{
				value: "later",
				label: "Maybe later",
				hint: "ask again after your next manual sync",
			},
			{
				value: "never",
				label: "Never ask again",
				hint: "you can still enable it with sync --auto on",
			},
		],
		initialValue: "enable",
	});

	if (p.isCancel(answer)) return true;

	if (answer === "enable") {
		// The set is reused, not re-detected: the user answered the hint they saw.
		const result = await enableAutoSync(DEFAULT_FREQUENCY_HOURS, {
			...deps,
			detectedImpl: async () => detected,
		});
		if (result.ok) {
			p.log.success(result.message);
		} else {
			p.log.error(result.message);
		}
		return true;
	}

	if (answer === "never") {
		saveSettings({ autoSyncNeverAskAgain: true }, deps.settingsFile);
	}
	p.log.message(
		`If you change your mind: ${limeBold("npx @use-aistack/cli sync --auto on")} ${dim(
			"(and --auto off to revoke)",
		)}`,
	);
	return true;
}
