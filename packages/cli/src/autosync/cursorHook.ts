import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { AUTO_SYNC_HOOK_COMMAND, type HookResult } from "./hook.js";

// The accepted scope is user-wide. Project hooks would also run in cloud agents.
export const CURSOR_HOOK_FILE = join(homedir(), ".cursor", "hooks.json");

export function cursorHookCommand(os: NodeJS.Platform = platform()): string {
	if (os === "win32") {
		const script = `Start-Process -WindowStyle Hidden -FilePath 'cmd.exe' -ArgumentList '/d /s /c "set AISTACK_HOOK_SOURCE=cursor&& (${AUTO_SYNC_HOOK_COMMAND}) <NUL >NUL 2>&1"'`;
		return `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${Buffer.from(script, "utf16le").toString("base64")}`;
	}
	const detach = os === "darwin" ? "nohup" : "setsid nohup";
	return `${detach} sh -c 'export AISTACK_HOOK_SOURCE=cursor; ${AUTO_SYNC_HOOK_COMMAND}' </dev/null >/dev/null 2>&1 &`;
}

type Entry = Record<string, unknown>;
interface Config {
	version?: unknown;
	hooks?: Record<string, Entry[]>;
	[key: string]: unknown;
}
function read(file: string): Config {
	if (!existsSync(file)) return {};
	const value: unknown = JSON.parse(readFileSync(file, "utf8"));
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("expected a JSON object");
	const config = value as Config;
	if (config.version !== undefined && config.version !== 1)
		throw new Error("unsupported hooks version");
	if (
		config.hooks !== undefined &&
		(!config.hooks ||
			typeof config.hooks !== "object" ||
			Array.isArray(config.hooks) ||
			Object.values(config.hooks).some(
				(entries) =>
					!Array.isArray(entries) ||
					entries.some(
						(entry) =>
							!entry || typeof entry !== "object" || Array.isArray(entry),
					),
			))
	)
		throw new Error("malformed hooks object");
	return config;
}
function isOurs(entry: Entry): boolean {
	// Exact generated commands avoid claiming another user's command that happens
	// to invoke the CLI. Recognize all supported OS definitions when removing.
	return ["linux", "darwin", "win32"].some(
		(os) => entry.command === cursorHookCommand(os as NodeJS.Platform),
	);
}
function update(
	file: string,
	install: boolean,
	os: NodeJS.Platform,
): HookResult {
	try {
		const config = read(file);
		const existing = config.hooks?.stop ?? [];
		const kept = existing.filter((entry) => !isOurs(entry));
		if (!install && kept.length === existing.length)
			return { ok: true, message: "no Cursor hook to remove" };
		if (install) kept.push({ command: cursorHookCommand(os) });
		const hooks = { ...config.hooks };
		if (kept.length) hooks.stop = kept;
		else delete hooks.stop;
		if (Object.keys(hooks).length) config.hooks = hooks;
		else delete config.hooks;
		if (install) config.version = 1;
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
		return {
			ok: true,
			message: `Cursor stop hook ${install ? "written to" : "removed from"} ${file}`,
		};
	} catch (error) {
		return {
			ok: false,
			message: `Could not ${install ? "install" : "remove"} Cursor hook in ${file}: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}
export function installCursorAutoSyncHook(
	file = CURSOR_HOOK_FILE,
	os = platform(),
): HookResult {
	return update(file, true, os);
}
export function removeCursorAutoSyncHook(file = CURSOR_HOOK_FILE): HookResult {
	return update(file, false, platform());
}
export function cursorAutoSyncHookInstalled(file = CURSOR_HOOK_FILE): boolean {
	try {
		return (read(file).hooks?.stop ?? []).some(isOurs);
	} catch {
		return false;
	}
}
