import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
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
	group: string;
}

const MAX_FILE_SIZE = 100 * 1024; // 100KB

interface FilePattern {
	path: string;
	type: FileType;
	group: string;
}

const LOCAL_PATTERNS: FilePattern[] = [
	// Rules
	{ path: "CLAUDE.md", type: "rule", group: "claude-code" },
	{ path: "AGENTS.md", type: "rule", group: "claude-code" },
	{ path: "GEMINI.md", type: "rule", group: "gemini" },
	{ path: ".cursorrules", type: "rule", group: "cursor" },
	{ path: ".windsurfrules", type: "rule", group: "windsurf" },
	{ path: ".clinerules", type: "rule", group: "cline" },
	{ path: ".roorules", type: "rule", group: "roo" },
	{ path: ".github/copilot-instructions.md", type: "rule", group: "copilot" },
	// MCP servers are detected separately as pkg-reference links (see mcp.ts) -
	// their config files are intentionally NOT collected as content here (which
	// would also upload `env` secrets).
	// Config
	{ path: ".aider.conf.yml", type: "config", group: "aider" },
	{ path: ".continue/config.json", type: "config", group: "continue" },
	{ path: ".continue/config.yaml", type: "config", group: "continue" },
	{ path: ".claude/settings.json", type: "config", group: "claude-code" },
	{
		path: ".claude/settings.local.json",
		type: "config",
		group: "claude-code",
	},
	// Prompts
	{ path: "system-prompt.md", type: "prompt", group: "generic" },
];

const LOCAL_DIR_PATTERNS: { dir: string; type: FileType; group: string }[] = [
	{ dir: ".cursor/rules", type: "rule", group: "cursor" },
	{ dir: ".clinerules", type: "rule", group: "cline" },
	{ dir: ".windsurf/rules", type: "rule", group: "windsurf" },
	{ dir: ".roo/rules", type: "rule", group: "roo" },
	{ dir: ".github/instructions", type: "rule", group: "copilot" },
	{ dir: ".github/prompts", type: "prompt", group: "copilot" },
	{ dir: ".claude/commands", type: "command", group: "claude-code" },
	{ dir: ".claude/agents", type: "subagent", group: "claude-code" },
	{ dir: ".claude/hooks", type: "hook", group: "claude-code" },
	{ dir: "prompts", type: "prompt", group: "generic" },
	{ dir: ".ai", type: "custom", group: "generic" },
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
					group: pattern.group,
				});
			}
		}
	}

	for (const { dir, type, group } of LOCAL_DIR_PATTERNS) {
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
					group,
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
					group: "generic",
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
		{ path: ".claude/CLAUDE.md", type: "rule", group: "claude-code" },
		{ path: ".claude/settings.json", type: "config", group: "claude-code" },
		{ path: ".continue/config.json", type: "config", group: "continue" },
		{ path: ".continue/config.yaml", type: "config", group: "continue" },
		{ path: ".aider.conf.yml", type: "config", group: "aider" },
		{ path: ".gemini/GEMINI.md", type: "rule", group: "gemini" },
		{ path: ".gemini/settings.json", type: "config", group: "gemini" },
		{ path: ".codex/config.toml", type: "config", group: "codex" },
		{
			path: ".codeium/windsurf/memories/global_rules.md",
			type: "rule",
			group: "windsurf",
		},
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
				group: pattern.group,
			});
		}
	}

	const globalDirs: { dir: string; type: FileType; group: string }[] = [
		{ dir: ".claude/commands", type: "command", group: "claude-code" },
		{ dir: ".claude/agents", type: "subagent", group: "claude-code" },
		{ dir: ".claude/hooks", type: "hook", group: "claude-code" },
		{ dir: ".cursor/rules", type: "rule", group: "cursor" },
	];

	for (const { dir, type, group } of globalDirs) {
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
					group,
				});
			}
		}
	}

	// Global skills: ~/.claude/skills/<name>/SKILL.md (+ supporting files). Not
	// covered by globalDirs since each skill is its own dir keyed by SKILL.md.
	const skillsRoot = join(home, ".claude", "skills");
	try {
		for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const skillDir = join(skillsRoot, entry.name);
			if (!existsSync(join(skillDir, "SKILL.md"))) continue;
			for (const filePath of walkDir(skillDir, 2)) {
				const content = readFileSafe(filePath);
				if (content !== null) {
					results.push({
						path: filePath,
						relativePath: `~/${relative(home, filePath)}`,
						content,
						type: "skill",
						source: "global",
						group: "claude-code",
					});
				}
			}
		}
	} catch {
		/* skills dir absent / permission errors */
	}

	return results;
}
