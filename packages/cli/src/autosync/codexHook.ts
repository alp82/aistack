// The Codex half of the background trigger (#66 decision 4, built in #67):
// a `SessionStart` hook in ~/.codex/hooks.json, matcher `startup` only.
//
// Two ways this differs from the Claude hook (hook.ts):
//
//   1. THE COMMAND SELF-DETACHES. Codex parses `async` but does not honor it —
//      the runner awaits the hook with a timeout and kill_on_drop (#65 §6).
//      So the command backgrounds the real work under `setsid nohup … &` and
//      exits 0 immediately; kill_on_drop kills only the already-exited shell.
//   2. THE TRUST GATE. Codex pins each hook command's sha256 as a
//      `trusted_hash` in config.toml. An untrusted or CHANGED command silently
//      does not run, and only the user can trust it, via /hooks inside Codex.
//      That is why the command text uses `@latest` — the text (and therefore
//      the hash) stays stable across CLI updates — and why install prints the
//      one-time trust instruction.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import type { HookResult } from "./hook.js";

function codexHome(): string {
	return process.env.CODEX_HOME || join(homedir(), ".codex");
}

export function codexHooksFile(): string {
	return join(codexHome(), "hooks.json");
}

// `codexPresent()` lived here and keyed on $CODEX_HOME existing. #101 replaced
// it with `codexAdapter.detect()`: a directory proves an install, and an
// install is not a user. A fresh Codex with no sessions yet gets its hook from
// the interactive sync that reconciles hooks (#103), one session later.

export function codexConfigFile(): string {
	return join(codexHome(), "config.toml");
}

/**
 * EXACT quoting, settled here (#66 left it to this ticket): the outer layer is
 * a JSON string in hooks.json; Codex runs it through a shell, and the single
 * `sh -c '…'` wrapper makes the detach group unambiguous regardless of how
 * that outer shell tokenizes. No `||` fallback like the Claude command — the
 * fallback semantics live INSIDE the detached shell so the hook process itself
 * still exits instantly.
 *
 * DO NOT REFORMAT THIS STRING. Its sha256 is the trust hash; any byte change
 * un-trusts the hook on every machine until each user re-runs /hooks.
 */
export const CODEX_HOOK_COMMAND =
	"sh -c 'setsid nohup sh -c \"npx -y @use-aistack/cli@latest sync --auto || npx -y --prefer-offline @use-aistack/cli sync --auto\" >/dev/null 2>&1 &'";

interface HookEntry {
	type: string;
	command?: string;
	timeout?: number;
}

interface HookMatcher {
	matcher?: string;
	hooks?: HookEntry[];
}

interface CodexHooksJson {
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

function readHooksJson(
	file: string,
): { settings: CodexHooksJson } | { error: string } {
	if (!existsSync(file)) return { settings: {} };
	try {
		const raw = JSON.parse(readFileSync(file, "utf-8"));
		if (raw && typeof raw === "object" && !Array.isArray(raw)) {
			return { settings: raw as CodexHooksJson };
		}
		return { error: `${file} does not hold a JSON object` };
	} catch {
		// Never rewrite a file we cannot parse — it is the user's Codex
		// configuration, and a rewrite would destroy whatever is in it.
		return { error: `${file} is not valid JSON — fix it, then retry` };
	}
}

/** The instruction install prints; the interactive sync repeats it while untrusted. */
export const CODEX_TRUST_INSTRUCTION =
	"Codex hook written — open Codex and run /hooks once to trust it, or it will not run.";

/**
 * Add the SessionStart auto-sync hook, matcher `startup` only (resume/clear/
 * compact would multiply runs; the freshness gate would drop them anyway).
 * Idempotent: an existing aistack entry is replaced, not duplicated.
 */
export function installCodexAutoSyncHook(
	file: string = codexHooksFile(),
): HookResult {
	const read = readHooksJson(file);
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
		matcher: "startup",
		hooks: [{ type: "command", command: CODEX_HOOK_COMMAND, timeout: 30 }],
	});

	settings.hooks = { ...hooks, SessionStart: kept };
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
	return { ok: true, message: CODEX_TRUST_INSTRUCTION };
}

/**
 * Remove only our hook. Other hooks and events stay. A missing file or an
 * absent hook is success — the goal state already holds.
 */
export function removeCodexAutoSyncHook(
	file: string = codexHooksFile(),
): HookResult {
	if (!existsSync(file))
		return { ok: true, message: "no Codex hook to remove" };
	const read = readHooksJson(file);
	if ("error" in read) return { ok: false, message: read.error };
	const settings = read.settings;

	const sessionStart = settings.hooks?.SessionStart;
	if (!Array.isArray(sessionStart)) {
		return { ok: true, message: "no Codex hook to remove" };
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

/** Is the Codex auto-sync hook present? */
export function codexAutoSyncHookInstalled(
	file: string = codexHooksFile(),
): boolean {
	const read = readHooksJson(file);
	if ("error" in read) return false;
	const sessionStart = read.settings.hooks?.SessionStart;
	if (!Array.isArray(sessionStart)) return false;
	return sessionStart.some((m) => (m.hooks ?? []).some((h) => isOurs(h)));
}

/**
 * Best-effort trust check: Codex pins each trusted hook's sha256 under
 * `[hooks.state]` in config.toml, so the command's hash appearing anywhere in
 * that file reads as trusted. `null` when the file cannot be read — unknown,
 * not untrusted, so the caller does not nag on a parse quirk.
 */
export function codexHookTrusted(
	configFile: string = codexConfigFile(),
): boolean | null {
	let text: string;
	try {
		text = readFileSync(configFile, "utf-8");
	} catch {
		return null;
	}
	const hash = createHash("sha256").update(CODEX_HOOK_COMMAND).digest("hex");
	return text.includes(hash);
}
