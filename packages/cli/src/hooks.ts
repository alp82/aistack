import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Resource } from "./api.js";

/**
 * Extract hooks defined inline in Claude Code settings as discrete `hook`
 * resources — one per event (PreToolUse, PostToolUse, …). Without this they
 * only ride inside the collected settings.json config blob and never surface as
 * first-class hooks.
 *
 * These are HOSTED resources (the event's config block is the content), so they
 * participate in the normal file-based diff. They intentionally duplicate data
 * also present in the settings.json resource; the distinct `hooks:` stableKeys
 * mean no collision, and first-class visibility was the deliberate tradeoff.
 */

interface SettingsFile {
	hooks?: Record<string, unknown>;
}

function readJson<T>(path: string): T | null {
	try {
		if (!existsSync(path)) return null;
		return JSON.parse(readFileSync(path, "utf-8")) as T;
	} catch {
		return null;
	}
}

function hooksFrom(
	path: string,
	source: "local" | "global",
	out: Resource[],
	seen: Set<string>,
) {
	const hooks = readJson<SettingsFile>(path)?.hooks;
	if (!hooks || typeof hooks !== "object") return;
	for (const [event, config] of Object.entries(hooks)) {
		const stableKey = `hooks:${source}:${event}`;
		if (seen.has(stableKey)) continue;
		seen.add(stableKey);
		out.push({
			type: "hook",
			name: event,
			group: "claude-code",
			stableKey,
			files: [
				{
					name: `${event}.json`,
					content: JSON.stringify(config, null, 2),
					path: `hooks/${event}.json`,
				},
			],
		});
	}
}

/**
 * Detect inline hooks from project settings (`.claude/settings.json` +
 * `.claude/settings.local.json`) and global settings (`~/.claude/settings.json`).
 * Project settings win over the `.local` override on the same event.
 */
export function detectHooks(cwd: string, home: string = homedir()): Resource[] {
	const out: Resource[] = [];
	const seen = new Set<string>();
	hooksFrom(join(cwd, ".claude", "settings.json"), "local", out, seen);
	hooksFrom(join(cwd, ".claude", "settings.local.json"), "local", out, seen);
	hooksFrom(join(home, ".claude", "settings.json"), "global", out, seen);
	return out;
}
