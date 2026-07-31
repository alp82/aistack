// `aistack connect claude` — the opt-in in-session sync surface (#56, #57).
//
// Installs BOTH halves or NEITHER: the user-scoped MCP server registration and
// the Skill copy travel together, because the Skill drives `sync_preview` /
// `sync_publish` and has nothing to do without the server (#56 decision 3).
// The harness argument leaves room for `connect codex` later without a rename.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import { getSettings, saveSettings } from "../config.js";
import {
	dim,
	intro,
	limeBold,
	outro,
	outroError,
	outroSkipped,
} from "../theme.js";

/** The documented manual install line, printed when we cannot run it. */
export const MANUAL_MCP_ADD =
	"claude mcp add --scope user aistack -- npx -y @use-aistack/cli mcp";

const MCP_ADD_ARGS = [
	"mcp",
	"add",
	"--scope",
	"user",
	"aistack",
	"--",
	"npx",
	"-y",
	"@use-aistack/cli",
	"mcp",
];

const MCP_REMOVE_ARGS = ["mcp", "remove", "--scope", "user", "aistack"];

export const SKILL_DEST = join(homedir(), ".claude", "skills", "aistack-sync");

export interface RunResult {
	/** The binary was not found on PATH. */
	notFound: boolean;
	status: number | null;
	output: string;
}

export type Runner = (args: string[]) => RunResult;

function runClaude(args: string[]): RunResult {
	const r = spawnSync("claude", args, { encoding: "utf-8" });
	const notFound =
		r.error !== undefined &&
		(r.error as NodeJS.ErrnoException).code === "ENOENT";
	return {
		notFound,
		status: r.status,
		output: `${r.stdout ?? ""}${r.stderr ?? ""}`,
	};
}

/** Is the `claude` binary reachable? Cheap check used to skip the upsell. */
export function claudeOnPath(run: Runner = runClaude): boolean {
	return !run(["--version"]).notFound;
}

/**
 * The bundled Skill directory, resolved relative to this module. In the
 * published package that is `<pkg>/skills/aistack-sync` next to `dist/`; in
 * dev it is two levels up from `src/commands/`. Walking up covers both.
 */
export function findSkillSource(
	fromDir: string = dirname(fileURLToPath(import.meta.url)),
): string | null {
	let dir = fromDir;
	for (let i = 0; i < 4; i++) {
		const candidate = join(dir, "skills", "aistack-sync");
		if (existsSync(join(candidate, "SKILL.md"))) return candidate;
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

export interface ConnectOutcome {
	ok: boolean;
	message: string;
}

/**
 * Install the server registration, then the Skill. If the Skill copy fails
 * after a fresh registration, the registration is rolled back — both halves
 * or neither.
 */
export function installClaudeConnect(
	run: Runner = runClaude,
	copySkill: (src: string, dest: string) => void = (src, dest) =>
		cpSync(src, dest, { recursive: true }),
): ConnectOutcome {
	const source = findSkillSource();
	if (source === null) {
		return {
			ok: false,
			message:
				"this install is missing its bundled Skill (skills/aistack-sync) — nothing was installed",
		};
	}

	const add = run(MCP_ADD_ARGS);
	if (add.notFound) {
		return {
			ok: false,
			message: `claude was not found on PATH — nothing was installed. Manual install:\n${MANUAL_MCP_ADD}`,
		};
	}
	const alreadyRegistered =
		add.status !== 0 && add.output.includes("already exists");
	if (add.status !== 0 && !alreadyRegistered) {
		return {
			ok: false,
			message: `claude mcp add failed — nothing was installed.\n${add.output.trim()}`,
		};
	}

	try {
		copySkill(source, SKILL_DEST);
	} catch (e) {
		// Both halves or neither: a fresh registration without its Skill is
		// rolled back. A pre-existing registration is left as it was.
		if (!alreadyRegistered) run(MCP_REMOVE_ARGS);
		return {
			ok: false,
			message: `copying the Skill to ${SKILL_DEST} failed — the MCP registration was ${
				alreadyRegistered ? "left as it was" : "rolled back"
			}.\n${e instanceof Error ? e.message : String(e)}`,
		};
	}

	return {
		ok: true,
		message: `Installed. Say ${limeBold('"sync my stack"')} in any Claude Code session.`,
	};
}

export async function connectCommand(harness: string): Promise<void> {
	intro("connect");

	if (harness !== "claude") {
		outroError(`unknown harness "${harness}" — supported: claude`);
		process.exitCode = 1;
		return;
	}

	if (!claudeOnPath()) {
		p.log.warn(
			`claude was not found on PATH. Manual install:\n${dim(MANUAL_MCP_ADD)}\nplus copy skills/aistack-sync from this package to ${dim(SKILL_DEST)}`,
		);
		outroSkipped("nothing was installed");
		return;
	}

	const result = installClaudeConnect();
	if (!result.ok) {
		outroError(result.message);
		process.exitCode = 1;
		return;
	}
	p.log.success(result.message);
	outro("done");
}

/**
 * The post-sync upsell (#56 decision 2), asked once per machine. Any explicit
 * answer persists to ~/.config/aistack/settings.json; ctrl-C is not an answer
 * and the question returns on the next sync. Skipped silently when claude is
 * not on PATH — the offer would be noise on a machine that cannot take it.
 */
export async function offerConnectUpsell(): Promise<void> {
	if (getSettings().connectClaudeAnswered === true) return;
	if (!claudeOnPath()) return;

	const answer = await p.select({
		message: "Sync from inside Claude Code too?",
		options: [
			{
				value: "later",
				label: "Not now",
				hint: "this question will not come back",
			},
			{
				value: "install",
				label: "Install",
				hint: "adds the aistack MCP server + Skill to Claude Code",
			},
		],
		initialValue: "later",
	});

	if (p.isCancel(answer)) return;
	saveSettings({ connectClaudeAnswered: true });

	if (answer === "install") {
		const result = installClaudeConnect();
		if (result.ok) {
			p.log.success(result.message);
		} else {
			p.log.error(result.message);
		}
		return;
	}

	p.log.message(
		`If you change your mind: ${limeBold("npx @use-aistack/cli connect claude")}`,
	);
}
