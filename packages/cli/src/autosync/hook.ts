// The background trigger (#62, map #60): a `SessionStart` hook in
// ~/.claude/settings.json, `async: true`.
//
// SessionStart, not SessionEnd — teardown is not guaranteed (crash, SIGKILL,
// closed terminal), and at start-of-session the previous sessions are fully on
// disk. The command runs `@latest` through npx, so unattended machines update
// by construction. The `||` fallback covers the offline case: when the network
// resolve of `@latest` fails, the second npx runs the cached copy.
// `sync --auto` always exits 0, so the fallback never fires on a sync failure.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const CLAUDE_SETTINGS_FILE = join(homedir(), ".claude", "settings.json");

export const AUTO_SYNC_HOOK_COMMAND =
	"npx -y @use-aistack/cli@latest sync --auto || npx -y --prefer-offline @use-aistack/cli sync --auto";

interface HookEntry {
	type: string;
	command?: string;
	async?: boolean;
}

interface HookMatcher {
	matcher?: string;
	hooks?: HookEntry[];
}

interface ClaudeSettings {
	hooks?: Record<string, HookMatcher[]>;
	[key: string]: unknown;
}

/** Recognize our hook across versions: package name plus the auto flag. */
function isOurs(entry: HookEntry): boolean {
	return (
		typeof entry.command === "string" &&
		entry.command.includes("@use-aistack/cli") &&
		entry.command.includes("sync --auto")
	);
}

export interface HookResult {
	ok: boolean;
	message: string;
}

function readClaudeSettings(
	file: string,
): { settings: ClaudeSettings } | { error: string } {
	if (!existsSync(file)) return { settings: {} };
	try {
		const raw = JSON.parse(readFileSync(file, "utf-8"));
		if (raw && typeof raw === "object" && !Array.isArray(raw)) {
			return { settings: raw as ClaudeSettings };
		}
		return { error: `${file} does not hold a JSON object` };
	} catch {
		// Never rewrite a file we cannot parse — it is the user's Claude Code
		// configuration, and a rewrite would destroy whatever is in it.
		return { error: `${file} is not valid JSON — fix it, then retry` };
	}
}

/**
 * Add the SessionStart auto-sync hook. Idempotent: an existing aistack
 * auto-sync entry (any version of the command) is replaced, not duplicated.
 * All other hooks are preserved byte-for-byte in structure.
 */
export function installAutoSyncHook(
	file: string = CLAUDE_SETTINGS_FILE,
): HookResult {
	const read = readClaudeSettings(file);
	if ("error" in read) return { ok: false, message: read.error };
	const settings = read.settings;

	const hooks = settings.hooks ?? {};
	const sessionStart = Array.isArray(hooks.SessionStart)
		? hooks.SessionStart
		: [];

	const kept = sessionStart
		.map((m) => ({
			...m,
			hooks: (m.hooks ?? []).filter((h) => !isOurs(h)),
		}))
		.filter((m) => (m.hooks?.length ?? 0) > 0);

	kept.push({
		hooks: [{ type: "command", command: AUTO_SYNC_HOOK_COMMAND, async: true }],
	});

	settings.hooks = { ...hooks, SessionStart: kept };
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
	return { ok: true, message: `SessionStart hook written to ${file}` };
}

/**
 * Remove only our hook. Other SessionStart hooks and other events stay. A
 * missing file or an absent hook is success — the goal state already holds.
 */
export function removeAutoSyncHook(
	file: string = CLAUDE_SETTINGS_FILE,
): HookResult {
	if (!existsSync(file)) return { ok: true, message: "no hook to remove" };
	const read = readClaudeSettings(file);
	if ("error" in read) return { ok: false, message: read.error };
	const settings = read.settings;

	const sessionStart = settings.hooks?.SessionStart;
	if (!Array.isArray(sessionStart)) {
		return { ok: true, message: "no hook to remove" };
	}

	const kept = sessionStart
		.map((m) => ({
			...m,
			hooks: (m.hooks ?? []).filter((h) => !isOurs(h)),
		}))
		.filter((m) => (m.hooks?.length ?? 0) > 0);

	const hooks = { ...settings.hooks };
	if (kept.length > 0) {
		hooks.SessionStart = kept;
	} else {
		delete hooks.SessionStart;
	}
	if (Object.keys(hooks).length > 0) {
		settings.hooks = hooks;
	} else {
		delete settings.hooks;
	}

	writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
	return { ok: true, message: `hook removed from ${file}` };
}

/** Is the auto-sync hook present? Used by status reporting. */
export function autoSyncHookInstalled(
	file: string = CLAUDE_SETTINGS_FILE,
): boolean {
	const read = readClaudeSettings(file);
	if ("error" in read) return false;
	const sessionStart = read.settings.hooks?.SessionStart;
	if (!Array.isArray(sessionStart)) return false;
	return sessionStart.some((m) => (m.hooks ?? []).some((h) => isOurs(h)));
}
