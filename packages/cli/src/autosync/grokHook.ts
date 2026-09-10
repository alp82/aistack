import {
	existsSync,
	mkdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import type { HookResult } from "./hook.js";

export const GROK_HOOK_FILE = join(
	process.env.GROK_HOME || join(homedir(), ".grok"),
	"hooks",
	"aistack.json",
);

const SYNC_COMMAND =
	"npx -y @use-aistack/cli@latest sync --auto || npx -y --prefer-offline @use-aistack/cli sync --auto";

export function grokHookCommand(os: NodeJS.Platform = platform()): string {
	if (os === "win32") {
		return `Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList '/d /s /c "set AISTACK_HOOK_SOURCE=grok&& (${SYNC_COMMAND}) >NUL 2>&1"'`;
	}
	if (os === "darwin") {
		return `nohup sh -c 'export AISTACK_HOOK_SOURCE=grok; ${SYNC_COMMAND}' </dev/null >/dev/null 2>&1 &`;
	}
	return `setsid nohup sh -c 'export AISTACK_HOOK_SOURCE=grok; ${SYNC_COMMAND}' >/dev/null 2>&1 &`;
}

interface HookEntry {
	type?: unknown;
	command?: unknown;
	timeout?: unknown;
}

interface GrokHookFile {
	hooks?: Record<string, Array<{ hooks?: HookEntry[] }>>;
	[key: string]: unknown;
}

function readHookFile(
	file: string,
): { value: GrokHookFile } | { error: string } {
	if (!existsSync(file)) return { value: {} };
	try {
		const value: unknown = JSON.parse(readFileSync(file, "utf-8"));
		if (value && typeof value === "object" && !Array.isArray(value)) {
			const candidate = value as GrokHookFile;
			if (
				candidate.hooks !== undefined &&
				(!candidate.hooks ||
					typeof candidate.hooks !== "object" ||
					Array.isArray(candidate.hooks) ||
					Object.values(candidate.hooks).some(
						(groups) => !Array.isArray(groups),
					))
			) {
				return {
					error: `${file} has a malformed hooks object. Fix it, then retry.`,
				};
			}
			return { value: candidate };
		}
	} catch {
		return { error: `${file} is not valid JSON. Fix it, then retry.` };
	}
	return { error: `${file} does not hold a JSON object` };
}

function isOurs(entry: HookEntry): boolean {
	return (
		typeof entry.command === "string" &&
		entry.command.includes("@use-aistack/cli") &&
		entry.command.includes("sync --auto")
	);
}

export function installGrokAutoSyncHook(
	file: string = GROK_HOOK_FILE,
	os: NodeJS.Platform = platform(),
): HookResult {
	const read = readHookFile(file);
	if ("error" in read) return { ok: false, message: read.error };
	const foreignKeys = Object.keys(read.value).filter((key) => key !== "hooks");
	const foreignEvents = Object.keys(read.value.hooks ?? {}).filter(
		(key) => key !== "SessionStart",
	);
	const sessionStart = read.value.hooks?.SessionStart ?? [];
	const foreignHandlers = sessionStart.flatMap((group) =>
		(group.hooks ?? []).filter((entry) => !isOurs(entry)),
	);
	if (
		foreignKeys.length > 0 ||
		foreignEvents.length > 0 ||
		foreignHandlers.length > 0
	) {
		return {
			ok: false,
			message: `${file} contains hooks not owned by AI Stack. Move them to another Grok hook file, then retry.`,
		};
	}
	const value: GrokHookFile = {
		hooks: {
			SessionStart: [
				{
					hooks: [
						{ type: "command", command: grokHookCommand(os), timeout: 5 },
					],
				},
			],
		},
	};
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
	return {
		ok: true,
		message: `Grok Build SessionStart hook written to ${file}. Start a new Grok session or reload hooks before expecting it to run.`,
	};
}

export function removeGrokAutoSyncHook(
	file: string = GROK_HOOK_FILE,
): HookResult {
	if (!existsSync(file))
		return { ok: true, message: "no Grok Build hook to remove" };
	const read = readHookFile(file);
	if ("error" in read) return { ok: false, message: read.error };
	const entries = read.value.hooks?.SessionStart ?? [];
	const onlyOurs =
		Object.keys(read.value).every((key) => key === "hooks") &&
		Object.keys(read.value.hooks ?? {}).every(
			(key) => key === "SessionStart",
		) &&
		entries.every((group) =>
			(group.hooks ?? []).every((entry) => isOurs(entry)),
		);
	if (!onlyOurs) {
		return {
			ok: false,
			message: `${file} contains hooks not owned by AI Stack and was not removed.`,
		};
	}
	unlinkSync(file);
	return { ok: true, message: `Grok Build hook removed from ${file}` };
}

export function grokAutoSyncHookInstalled(
	file: string = GROK_HOOK_FILE,
): boolean {
	const read = readHookFile(file);
	if ("error" in read) return false;
	return (read.value.hooks?.SessionStart ?? []).some((group) =>
		(group.hooks ?? []).some((entry) => isOurs(entry)),
	);
}
