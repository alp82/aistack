// The auto-sync opt-in (#62, map #60), narrowed to active harnesses by #101.
//
// This ask is the PRIMARY post-sync ask: it runs first, and the connect-claude
// upsell yields to a later sync (at most one ask per sync, each asked once,
// each persisted). Any explicit answer persists to
// ~/.config/aistack/settings.json; ctrl-C is not an answer and the question
// returns on the next sync.

import * as p from "@clack/prompts";
import {
	DEFAULT_FREQUENCY_HOURS,
	getSettings,
	saveSettings,
} from "../config.js";
import { CLAUDE_HARNESS_NAME } from "../harness/claude/adapter.js";
import { CODEX_HARNESS_NAME } from "../harness/codex/adapter.js";
import {
	DEFAULT_WINDOW_DAYS,
	detectedAdapters,
	harnessListLabel,
} from "../harness/index.js";
import type { HarnessAdapter } from "../harness/types.js";
import { dim, limeBold } from "../theme.js";
import {
	installCodexAutoSyncHook,
	removeCodexAutoSyncHook,
} from "./codexHook.js";
import {
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
	/** Override the detected harness set. Tests only. */
	detectedImpl?: () => Promise<HarnessAdapter[]>;
}

/** The message when the machine has no active harness to trigger anything. */
export const NOTHING_TO_TRIGGER = `No Claude Code or Codex session on this machine in the last ${DEFAULT_WINDOW_DAYS} days, so nothing would trigger an auto-sync. Nothing was changed.`;

/**
 * Turn the standing opt-in on: persist the flag, write the SessionStart hooks
 * — one per DETECTED harness (#101). A hook for a harness whose last session
 * predates the window is a trigger that will never fire, and its install is the
 * step that made a dead Claude Code install look alive.
 *
 * When a hook write fails, the flag is NOT persisted — a half-enabled state
 * (flag on, no hook) would claim a freshness the machine cannot deliver.
 */
export async function enableAutoSync(
	frequencyHours: number = DEFAULT_FREQUENCY_HOURS,
	deps: EnableDeps = {},
): Promise<HookResult> {
	const detected = await (deps.detectedImpl ?? detectedAdapters)();
	if (detected.length === 0) {
		return { ok: false, message: NOTHING_TO_TRIGGER };
	}
	const names = new Set(detected.map((a) => a.name));

	if (names.has(CLAUDE_HARNESS_NAME)) {
		const result = (deps.installHook ?? installAutoSyncHook)();
		if (!result.ok) return result;
	}

	let trustLine: string | null = null;
	if (names.has(CODEX_HARNESS_NAME)) {
		const codexResult = (deps.installCodexHook ?? installCodexAutoSyncHook)();
		if (!codexResult.ok) return codexResult;
		// The one-time /hooks trust step (#65 §6) — repeated by the next
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
			`Auto-sync is on — about every ${frequencyHours}h when a ${harnessListLabel(detected)} session starts. Turn it off any time: npx @use-aistack/cli sync --auto off`,
			...(trustLine ? [trustLine] : []),
		].join("\n"),
	};
}

/**
 * Revoke: remove the hooks AND flip the flag. The flag flips even when a hook
 * file cannot be edited, because `sync --auto` gates on the flag — a stale hook
 * without the flag publishes nothing.
 *
 * Removal is unconditional, unlike install: a revoke must reach the hook of a
 * harness that has since gone quiet, and removing an absent hook is success.
 */
export function disableAutoSync(deps: EnableDeps = {}): HookResult {
	const settings = getSettings(deps.settingsFile);
	saveSettings(
		{
			autoSyncAnswered: true,
			autoSync: {
				enabled: false,
				frequencyHours:
					settings.autoSync?.frequencyHours ?? DEFAULT_FREQUENCY_HOURS,
			},
		},
		deps.settingsFile,
	);
	const result = (deps.removeHook ?? removeAutoSyncHook)();
	const codexResult = (deps.removeCodexHook ?? removeCodexAutoSyncHook)();
	const failures = [result, codexResult]
		.filter((r) => !r.ok)
		.map((r) => r.message);
	if (failures.length > 0) {
		return {
			ok: false,
			message: `Auto-sync is off (nothing will publish), but a hook could not be removed: ${failures.join("; ")}`,
		};
	}
	return { ok: true, message: "Auto-sync is off. The hooks were removed." };
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
	if (getSettings(deps.settingsFile).autoSyncAnswered === true) return false;

	const detected = await (deps.detectedImpl ?? detectedAdapters)();
	if (detected.length === 0) return false;

	const answer = await p.select({
		message: "Keep this stack fresh automatically?",
		options: [
			{
				value: "later",
				label: "Not now",
				hint: "this question will not come back",
			},
			{
				value: "enable",
				label: "Enable",
				hint: `a silent daily sync when a ${harnessListLabel(detected)} session starts`,
			},
		],
		initialValue: "later",
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

	saveSettings({ autoSyncAnswered: true }, deps.settingsFile);
	p.log.message(
		`If you change your mind: ${limeBold("npx @use-aistack/cli sync --auto on")} ${dim(
			"(and --auto off to revoke)",
		)}`,
	);
	return true;
}
