import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { parse as parseToml } from "smol-toml";
import { parse as parseYaml } from "yaml";
import type { Resource } from "./api.js";

/**
 * Detect configured MCP servers and resolve each to a `pkg` reference (its
 * package identity), parsed from the launch `command`/`args` — npm/PyPI/OCI for
 * stdio servers, or a URL for remote (http/sse) servers. `env` is intentionally
 * dropped (it carries secrets), so this is a safer representation than uploading
 * the raw config file.
 */

export interface McpServerConfig {
	command?: string;
	args?: string[];
	type?: string;
	transport?: string;
	url?: string;
}

export interface PkgRef {
	registry: "npm" | "pypi" | "oci" | "url";
	id: string;
	version?: string;
	transport?: "stdio" | "http" | "sse";
}

function commandName(cmd: string): string {
	return cmd.replace(/\\/g, "/").split("/").pop() ?? cmd;
}

/** Split an npm/PyPI spec into id + version, handling scoped npm (@scope/n@v). */
function splitVersion(spec: string): { id: string; version?: string } {
	const at = spec.indexOf("@", spec.startsWith("@") ? 1 : 0);
	if (at <= 0) return { id: spec };
	return { id: spec.slice(0, at), version: spec.slice(at + 1) || undefined };
}

/** First arg that isn't a flag (and isn't in `skip`). */
function firstPositional(args: string[], skip = 0): string | undefined {
	for (const a of args.slice(skip)) {
		if (!a.startsWith("-")) return a;
	}
	return undefined;
}

// docker/podman flags that consume the following token (so it isn't the image).
const CONTAINER_VALUE_FLAGS = new Set([
	"-e",
	"--env",
	"-v",
	"--volume",
	"-p",
	"--publish",
	"-w",
	"--workdir",
	"--name",
	"--mount",
	"--network",
	"-u",
	"--user",
	"-l",
	"--label",
]);

function containerImage(args: string[]): string | undefined {
	const runIdx = args.indexOf("run");
	const rest = runIdx >= 0 ? args.slice(runIdx + 1) : args;
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i];
		if (a.startsWith("-")) {
			if (CONTAINER_VALUE_FLAGS.has(a) && !a.includes("=")) i++;
			continue;
		}
		return a; // first positional after `run` is the image
	}
	return undefined;
}

/** Split a container image ref into id + tag (ignoring a registry host:port). */
function splitImageTag(image: string): { id: string; version?: string } {
	const colon = image.lastIndexOf(":");
	if (colon > 0 && !image.slice(colon + 1).includes("/")) {
		return { id: image.slice(0, colon), version: image.slice(colon + 1) };
	}
	return { id: image };
}

/** Parse a single MCP server config into a package reference, or null. */
export function parseMcpPackage(server: McpServerConfig): PkgRef | null {
	// Remote server: a URL endpoint (http/sse).
	if (server.url) {
		const t = (server.type ?? server.transport ?? "").toLowerCase();
		return {
			registry: "url",
			id: server.url,
			transport: t === "sse" ? "sse" : "http",
		};
	}

	const command = server.command ? commandName(server.command) : "";
	if (!command) return null;
	const args = server.args ?? [];

	// npm-family runners.
	if (command === "npx" || command === "bunx" || command === "pnpx") {
		const spec = firstPositional(args);
		return spec
			? { registry: "npm", ...splitVersion(spec), transport: "stdio" }
			: null;
	}
	if ((command === "pnpm" || command === "yarn") && args[0] === "dlx") {
		const spec = firstPositional(args, 1);
		return spec
			? { registry: "npm", ...splitVersion(spec), transport: "stdio" }
			: null;
	}

	// Python-family runners.
	if (command === "uvx") {
		const spec = firstPositional(args);
		return spec
			? { registry: "pypi", ...splitVersion(spec), transport: "stdio" }
			: null;
	}
	if (command === "pipx" && args[0] === "run") {
		const spec = firstPositional(args, 1);
		return spec
			? { registry: "pypi", ...splitVersion(spec), transport: "stdio" }
			: null;
	}
	if (command === "uv" && args[0] === "tool" && args[1] === "run") {
		const spec = firstPositional(args, 2);
		return spec
			? { registry: "pypi", ...splitVersion(spec), transport: "stdio" }
			: null;
	}
	if (/^python[0-9.]*$/.test(command)) {
		const i = args.indexOf("-m");
		const mod = i >= 0 ? args[i + 1] : undefined;
		return mod ? { registry: "pypi", id: mod, transport: "stdio" } : null;
	}

	// Container runners.
	if (command === "docker" || command === "podman") {
		const image = containerImage(args);
		if (!image) return null;
		return { registry: "oci", ...splitImageTag(image), transport: "stdio" };
	}

	// node/deno/bun running a local script, or an unknown command → skip.
	return null;
}

/** Build a `type:"mcp"` linked resource from a parsed package reference. */
export function buildMcpResource(
	name: string,
	group: string,
	scope: "project" | "global",
	pkg: PkgRef,
): Resource {
	return {
		type: "mcp",
		name,
		group,
		scope,
		stableKey: `linked:pkg:${pkg.registry}:${pkg.id}`,
		pkg,
	};
}

function readText(path: string): string | null {
	try {
		if (!existsSync(path)) return null;
		return readFileSync(path, "utf-8");
	} catch {
		return null;
	}
}

function readParsed<T>(
	path: string,
	parse: (raw: string) => unknown,
): T | null {
	const raw = readText(path);
	if (raw === null) return null;
	try {
		return parse(raw) as T;
	} catch {
		return null;
	}
}

function readJson<T>(path: string): T | null {
	return readParsed<T>(path, JSON.parse);
}
function readYaml<T>(path: string): T | null {
	return readParsed<T>(path, parseYaml);
}
function readToml<T>(path: string): T | null {
	return readParsed<T>(path, parseToml);
}

type ServerMap = Record<string, McpServerConfig> | undefined;
interface McpFile {
	mcpServers?: ServerMap;
	servers?: ServerMap; // VS Code uses `servers`
}
interface ClaudeJson {
	mcpServers?: ServerMap;
	projects?: Record<string, { mcpServers?: ServerMap }>;
}
// Continue uses a LIST under mcpServers; Codex (TOML) uses `mcp_servers`.
interface ContinueYaml {
	mcpServers?: Array<{ name?: string } & McpServerConfig>;
}
interface CodexToml {
	mcp_servers?: Record<string, McpServerConfig>;
}

/** Normalize Continue's list form to the common name→config map. */
function continueListToMap(file: ContinueYaml | null): ServerMap {
	if (!file?.mcpServers?.length) return undefined;
	const map: Record<string, McpServerConfig> = {};
	file.mcpServers.forEach((s, i) => {
		map[s.name ?? `server-${i}`] = s;
	});
	return map;
}

/** Per-OS VS Code globalStorage bases (+ Code-OSS/VSCodium variants). */
function vscodeGlobalStorageBases(home: string): string[] {
	const apps = ["Code", "Code - OSS", "VSCodium"];
	let root: string;
	if (platform() === "darwin") {
		root = join(home, "Library", "Application Support");
	} else if (platform() === "win32") {
		root = process.env.APPDATA ?? join(home, "AppData", "Roaming");
	} else {
		root = process.env.XDG_CONFIG_HOME ?? join(home, ".config");
	}
	return apps.map((app) => join(root, app, "User", "globalStorage"));
}

/**
 * Read MCP server configs across the known tool locations and return one
 * `type:"mcp"` pkg-link resource per server, deduped by package identity.
 * Project-level configs win over global ones on the same identity.
 */
export function detectMcpServers(
	cwd: string,
	home: string = homedir(),
): Resource[] {
	const out: Resource[] = [];
	const seen = new Set<string>();
	const add = (
		servers: ServerMap,
		group: string,
		scope: "project" | "global",
	) => {
		for (const [name, cfg] of Object.entries(servers ?? {})) {
			const pkg = parseMcpPackage(cfg);
			if (!pkg) continue;
			const resource = buildMcpResource(name, group, scope, pkg);
			if (seen.has(resource.stableKey)) continue;
			seen.add(resource.stableKey);
			out.push(resource);
		}
	};

	// Project configs first (so they win dedup over global).
	add(
		readJson<McpFile>(join(cwd, ".mcp.json"))?.mcpServers,
		"claude-code",
		"project",
	);
	add(
		readJson<McpFile>(join(cwd, "mcp.json"))?.mcpServers,
		"generic",
		"project",
	);
	add(
		readJson<McpFile>(join(cwd, ".cursor", "mcp.json"))?.mcpServers,
		"cursor",
		"project",
	);
	add(
		readJson<McpFile>(join(cwd, ".vscode", "mcp.json"))?.servers,
		"generic",
		"project",
	);
	add(
		readJson<McpFile>(join(cwd, "claude_desktop_config.json"))?.mcpServers,
		"claude-desktop",
		"project",
	);

	// Continue (project): a list per YAML file under .continue/mcpServers/.
	for (const file of listYamlFiles(join(cwd, ".continue", "mcpServers"))) {
		add(continueListToMap(readYaml<ContinueYaml>(file)), "continue", "project");
	}
	// Roo (project).
	add(
		readJson<McpFile>(join(cwd, ".roo", "mcp.json"))?.mcpServers,
		"roo",
		"project",
	);

	// --- Global / stack-scoped: user-level tool configs ---
	const claudeJson = readJson<ClaudeJson>(join(home, ".claude.json"));
	add(claudeJson?.projects?.[cwd]?.mcpServers, "claude-code", "project");
	add(claudeJson?.mcpServers, "claude-code", "global");
	add(
		readJson<McpFile>(join(home, ".cursor", "mcp.json"))?.mcpServers,
		"cursor",
		"global",
	);
	// Windsurf (global only).
	add(
		readJson<McpFile>(join(home, ".codeium", "windsurf", "mcp_config.json"))
			?.mcpServers,
		"windsurf",
		"global",
	);
	// Cline + Roo: VS Code extension globalStorage (OS-specific base).
	for (const base of vscodeGlobalStorageBases(home)) {
		add(
			readJson<McpFile>(
				join(
					base,
					"saoudrizwan.claude-dev",
					"settings",
					"cline_mcp_settings.json",
				),
			)?.mcpServers,
			"cline",
			"global",
		);
		add(
			readJson<McpFile>(
				join(
					base,
					"rooveterinaryinc.roo-cline",
					"settings",
					"mcp_settings.json",
				),
			)?.mcpServers,
			"roo",
			"global",
		);
	}
	// Continue (global).
	for (const file of listYamlFiles(join(home, ".continue", "mcpServers"))) {
		add(continueListToMap(readYaml<ContinueYaml>(file)), "continue", "global");
	}
	// Gemini CLI (global).
	add(
		readJson<McpFile>(join(home, ".gemini", "settings.json"))?.mcpServers,
		"gemini",
		"global",
	);
	// Codex CLI (global, TOML).
	add(
		readToml<CodexToml>(join(home, ".codex", "config.toml"))?.mcp_servers,
		"codex",
		"global",
	);

	return out;
}

/** List `*.yaml`/`*.yml` files in a directory (empty if absent). */
function listYamlFiles(dir: string): string[] {
	try {
		return readdirSync(dir)
			.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
			.map((f) => join(dir, f));
	} catch {
		return [];
	}
}
