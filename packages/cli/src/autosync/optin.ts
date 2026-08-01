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
	codexPresent,
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
	codexPresentImpl?: () => boolean;
}

/**
 * Turn the standing opt-in on: persist the flag, write the SessionStart hooks
 * — Claude Code always, Codex when it is on this machine (#66 decision 4; one
 * `sync --auto` covers all detected harnesses, so both hooks run the same
 * command). When a hook write fails, the flag is NOT persisted — a
 * half-enabled state (flag on, no hook) would claim a freshness the machine
 * cannot deliver.
 */
export function enableAutoSync(
	frequencyHours: number = DEFAULT_FREQUENCY_HOURS,
	deps: EnableDeps = {},
): HookResult {
	const install = deps.installHook ?? installAutoSyncHook;
	const result = install();
	if (!result.ok) return result;

	const hasCodex = (deps.codexPresentImpl ?? codexPresent)();
	let trustLine: string | null = null;
	if (hasCodex) {
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
	const sessionWord = hasCodex ? "Claude Code or Codex" : "Claude Code";
	return {
		ok: true,
		message: [
			`Auto-sync is on — about every ${frequencyHours}h when a ${sessionWord} session starts. Turn it off any time: npx @use-aistack/cli sync --auto off`,
			...(trustLine ? [trustLine] : []),
		].join("\n"),
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
	const codexResult = (deps.codexPresentImpl ?? codexPresent)()
		? (deps.removeCodexHook ?? removeCodexAutoSyncHook)()
		: { ok: true, message: "" };
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
