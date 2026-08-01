// The auto-sync opt-in (#62, map #60).
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
import { dim, limeBold } from "../theme.js";
import {
	type HookResult,
	installAutoSyncHook,
	removeAutoSyncHook,
} from "./hook.js";

export interface EnableDeps {
	settingsFile?: string;
	installHook?: () => HookResult;
	removeHook?: () => HookResult;
}

/**
 * Turn the standing opt-in on: persist the flag, write the SessionStart hook.
 * When the hook write fails, the flag is NOT persisted — a half-enabled state
 * (flag on, no hook) would claim a freshness the machine cannot deliver.
 */
export function enableAutoSync(
	frequencyHours: number = DEFAULT_FREQUENCY_HOURS,
	deps: EnableDeps = {},
): HookResult {
	const install = deps.installHook ?? installAutoSyncHook;
	const result = install();
	if (!result.ok) return result;
	saveSettings(
		{
			autoSyncAnswered: true,
			autoSync: { enabled: true, frequencyHours },
		},
		deps.settingsFile,
	);
	return {
		ok: true,
		message: `Auto-sync is on — about every ${frequencyHours}h when a Claude Code session starts. Turn it off any time: npx @use-aistack/cli sync --auto off`,
	};
}

/**
 * Revoke: remove the hook AND flip the flag. The flag flips even when the
 * hook file cannot be edited, because `sync --auto` gates on the flag — a
 * stale hook without the flag publishes nothing.
 */
export function disableAutoSync(deps: EnableDeps = {}): HookResult {
	const remove = deps.removeHook ?? removeAutoSyncHook;
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
	const result = remove();
	if (!result.ok) {
		return {
			ok: false,
			message: `Auto-sync is off (nothing will publish), but the hook could not be removed: ${result.message}`,
		};
	}
	return { ok: true, message: "Auto-sync is off. The hook was removed." };
}

/**
 * The post-sync ask. Returns true when it asked (so the caller skips the
 * connect upsell this sync), false when it had nothing to ask.
 */
export async function offerAutoSyncOptIn(): Promise<boolean> {
	if (getSettings().autoSyncAnswered === true) return false;

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
				hint: "a silent daily sync when a Claude Code session starts",
			},
		],
		initialValue: "later",
	});

	if (p.isCancel(answer)) return true;

	if (answer === "enable") {
		const result = enableAutoSync();
		if (result.ok) {
			p.log.success(result.message);
		} else {
			p.log.error(result.message);
		}
		return true;
	}

	saveSettings({ autoSyncAnswered: true });
	p.log.message(
		`If you change your mind: ${limeBold("npx @use-aistack/cli sync --auto on")} ${dim(
			"(and --auto off to revoke)",
		)}`,
	);
	return true;
}
