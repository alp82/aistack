import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { homedir } from "node:os";
import ignore from "ignore";

export type FileType =
	| "rule"
	| "mcp"
	| "skill"
	| "command"
	| "prompt"
	| "hook"
	| "subagent"
	| "config"
	| "custom";

export interface ScannedFile {
	path: string;
	relativePath: string;
	content: string;
	type: FileType;
	source: "local" | "global";
}

const MAX_FILE_SIZE = 100 * 1024; // 100KB

interface FilePattern {
	path: string;
	type: FileType;
}

const LOCAL_PATTERNS: FilePattern[] = [
	// Rules
	{ path: "CLAUDE.md", type: "rule" },
	{ path: "AGENTS.md", type: "rule" },
	{ path: ".cursorrules", type: "rule" },
	{ path: ".windsurfrules", type: "rule" },
	{ path: ".clinerules", type: "rule" },
	{ path: ".github/copilot-instructions.md", type: "rule" },
	// MCP
	{ path: "mcp.json", type: "mcp" },
	{ path: ".cursor/mcp.json", type: "mcp" },
	{ path: "claude_desktop_config.json", type: "mcp" },
	// Config
	{ path: ".aider.conf.yml", type: "config" },
	{ path: ".continue/config.json", type: "config" },
	// Config
	{ path: ".claude/settings.json", type: "config" },
	{ path: ".claude/settings.local.json", type: "config" },
	// Prompts
	{ path: "system-prompt.md", type: "prompt" },
];

const LOCAL_DIR_PATTERNS: { dir: string; type: FileType }[] = [
	{ dir: ".cursor/rules", type: "rule" },
	{ dir: ".claude/commands", type: "command" },
	{ dir: ".claude/agents", type: "subagent" },
	{ dir: ".claude/hooks", type: "hook" },
	{ dir: "prompts", type: "prompt" },
	{ dir: ".ai", type: "custom" },
];

function loadGitignore(cwd: string): ReturnType<typeof ignore> {
	const ig = ignore();
	const gitignorePath = join(cwd, ".gitignore");
	if (existsSync(gitignorePath)) {
		ig.add(readFileSync(gitignorePath, "utf-8"));
	}
	ig.add(["node_modules", ".git", "dist", "build", ".next", ".output"]);
	return ig;
}

function readFileSafe(filePath: string): string | null {
	try {
		const stat = statSync(filePath);
		if (stat.size > MAX_FILE_SIZE) return null;
		return readFileSync(filePath, "utf-8");
	} catch {
		return null;
	}
}

function walkDir(dir: string, maxDepth = 3, currentDepth = 0): string[] {
	if (currentDepth >= maxDepth || !existsSync(dir)) return [];
	const results: string[] = [];
	try {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const fullPath = join(dir, entry.name);
			if (entry.isFile()) {
				results.push(fullPath);
			} else if (entry.isDirectory()) {
				results.push(...walkDir(fullPath, maxDepth, currentDepth + 1));
			}
		}
	} catch {
		/* permission errors, etc */
	}
	return results;
}

export function scanLocal(cwd: string): ScannedFile[] {
	const ig = loadGitignore(cwd);
	const results: ScannedFile[] = [];

	for (const pattern of LOCAL_PATTERNS) {
		const filePath = join(cwd, pattern.path);
		const content = readFileSafe(filePath);
		if (content !== null) {
			const rel = relative(cwd, filePath);
			if (!ig.ignores(rel)) {
				results.push({
					path: filePath,
					relativePath: rel,
					content,
					type: pattern.type,
					source: "local",
				});
			}
		}
	}

	for (const { dir, type } of LOCAL_DIR_PATTERNS) {
		const dirPath = join(cwd, dir);
		const files = walkDir(dirPath);
		for (const filePath of files) {
			const rel = relative(cwd, filePath);
			if (ig.ignores(rel)) continue;
			const content = readFileSafe(filePath);
			if (content !== null) {
				results.push({
					path: filePath,
					relativePath: rel,
					content,
					type,
					source: "local",
				});
			}
		}
	}

	// Scan for skill directories (dirs with SKILL.md, 3 levels deep)
	try {
		for (const entry of readdirSync(cwd, { withFileTypes: true }).filter((e) =>
			e.isDirectory(),
		)) {
			if (ig.ignores(entry.name + "/")) continue;
			scanSkillDirs(join(cwd, entry.name), cwd, ig, results, 1);
		}
	} catch {
		/* permission errors */
	}

	return results;
}

function scanSkillDirs(
	dir: string,
	cwd: string,
	ig: ReturnType<typeof ignore>,
	results: ScannedFile[],
	depth: number,
) {
	if (depth > 3) return;
	const skillMd = join(dir, "SKILL.md");
	if (existsSync(skillMd)) {
		const files = walkDir(dir, 1);
		for (const filePath of files) {
			const rel = relative(cwd, filePath);
			if (ig.ignores(rel)) continue;
			const content = readFileSafe(filePath);
			if (content !== null) {
				results.push({
					path: filePath,
					relativePath: rel,
					content,
					type: "skill",
					source: "local",
				});
			}
		}
		return;
	}
	try {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				const rel = relative(cwd, join(dir, entry.name));
				if (!ig.ignores(rel + "/")) {
					scanSkillDirs(join(dir, entry.name), cwd, ig, results, depth + 1);
				}
			}
		}
	} catch {
		/* permission errors */
	}
}

export function scanGlobal(): ScannedFile[] {
	const home = homedir();
	const results: ScannedFile[] = [];

	const globalPatterns: FilePattern[] = [
		{ path: ".claude/CLAUDE.md", type: "rule" },
		{ path: ".claude/settings.json", type: "config" },
		{ path: ".cursor/mcp.json", type: "mcp" },
		{ path: ".continue/config.json", type: "config" },
		{ path: ".aider.conf.yml", type: "config" },
	];

	for (const pattern of globalPatterns) {
		const filePath = join(home, pattern.path);
		const content = readFileSafe(filePath);
		if (content !== null) {
			results.push({
				path: filePath,
				relativePath: `~/${pattern.path}`,
				content,
				type: pattern.type,
				source: "global",
			});
		}
	}

	const globalDirs: { dir: string; type: FileType }[] = [
		{ dir: ".claude/commands", type: "command" },
		{ dir: ".claude/agents", type: "subagent" },
		{ dir: ".claude/hooks", type: "hook" },
		{ dir: ".cursor/rules", type: "rule" },
	];

	for (const { dir, type } of globalDirs) {
		const dirPath = join(home, dir);
		const files = walkDir(dirPath, 2);
		for (const filePath of files) {
			const content = readFileSafe(filePath);
			if (content !== null) {
				results.push({
					path: filePath,
					relativePath: `~/${relative(home, filePath)}`,
					content,
					type,
					source: "global",
				});
			}
		}
	}

	return results;
}
