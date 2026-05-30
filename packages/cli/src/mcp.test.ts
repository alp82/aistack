import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildMcpResource, detectMcpServers, parseMcpPackage } from "./mcp.js";

describe("parseMcpPackage", () => {
	it("npx scoped package, ignoring flags and server args", () => {
		expect(
			parseMcpPackage({
				command: "npx",
				args: ["-y", "@upstash/context7-mcp", "--key", "x"],
			}),
		).toEqual({
			registry: "npm",
			id: "@upstash/context7-mcp",
			transport: "stdio",
		});
	});

	it("npx unscoped package with version", () => {
		expect(
			parseMcpPackage({ command: "npx", args: ["-y", "server-foo@1.2.3"] }),
		).toEqual({
			registry: "npm",
			id: "server-foo",
			version: "1.2.3",
			transport: "stdio",
		});
	});

	it("scoped package with version", () => {
		expect(
			parseMcpPackage({ command: "npx", args: ["@scope/pkg@2.0.0"] }),
		).toEqual({
			registry: "npm",
			id: "@scope/pkg",
			version: "2.0.0",
			transport: "stdio",
		});
	});

	it("uses the command basename for absolute paths", () => {
		expect(
			parseMcpPackage({ command: "/usr/local/bin/npx", args: ["pkg"] }),
		).toEqual({ registry: "npm", id: "pkg", transport: "stdio" });
	});

	it("uvx → pypi", () => {
		expect(
			parseMcpPackage({ command: "uvx", args: ["mcp-server-git"] }),
		).toEqual({
			registry: "pypi",
			id: "mcp-server-git",
			transport: "stdio",
		});
	});

	it("python -m module → pypi", () => {
		expect(
			parseMcpPackage({
				command: "python3",
				args: ["-m", "mcp_server_time", "--tz", "UTC"],
			}),
		).toEqual({ registry: "pypi", id: "mcp_server_time", transport: "stdio" });
	});

	it("docker run with flags + tag → oci", () => {
		expect(
			parseMcpPackage({
				command: "docker",
				args: ["run", "-i", "--rm", "-e", "API_KEY", "mcp/filesystem:1.0"],
			}),
		).toEqual({
			registry: "oci",
			id: "mcp/filesystem",
			version: "1.0",
			transport: "stdio",
		});
	});

	it("remote http / sse urls", () => {
		expect(
			parseMcpPackage({ type: "http", url: "https://mcp.example.com" }),
		).toEqual({
			registry: "url",
			id: "https://mcp.example.com",
			transport: "http",
		});
		expect(parseMcpPackage({ type: "sse", url: "https://x.com/sse" })).toEqual({
			registry: "url",
			id: "https://x.com/sse",
			transport: "sse",
		});
	});

	it("returns null for a local script or empty config", () => {
		expect(
			parseMcpPackage({ command: "node", args: ["./server.js"] }),
		).toBeNull();
		expect(parseMcpPackage({})).toBeNull();
	});
});

describe("buildMcpResource", () => {
	it("builds a type:mcp pkg link (linked:pkg stableKey, no files/upstream)", () => {
		const r = buildMcpResource("context7", "claude-code", "project", {
			registry: "npm",
			id: "@upstash/context7-mcp",
			transport: "stdio",
		});
		expect(r).toEqual({
			type: "mcp",
			name: "context7",
			group: "claude-code",
			scope: "project",
			stableKey: "linked:pkg:npm:@upstash/context7-mcp",
			pkg: { registry: "npm", id: "@upstash/context7-mcp", transport: "stdio" },
		});
		expect("files" in r).toBe(false);
		expect("upstream" in r).toBe(false);
	});
});

describe("detectMcpServers (cross-tool)", () => {
	let cwd: string;
	let home: string;

	beforeAll(() => {
		cwd = mkdtempSync(join(tmpdir(), "aistack-mcp-cwd-"));
		home = mkdtempSync(join(tmpdir(), "aistack-mcp-home-"));

		// Project: Claude Code .mcp.json (map shape).
		writeFileSync(
			join(cwd, ".mcp.json"),
			JSON.stringify({
				mcpServers: {
					ctx7: { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
				},
			}),
		);
		// Project: Continue list-shape YAML.
		mkdirSync(join(cwd, ".continue", "mcpServers"), { recursive: true });
		writeFileSync(
			join(cwd, ".continue", "mcpServers", "git.yaml"),
			"mcpServers:\n  - name: git\n    command: uvx\n    args:\n      - mcp-server-git\n",
		);
		// Project: Roo .roo/mcp.json.
		mkdirSync(join(cwd, ".roo"), { recursive: true });
		writeFileSync(
			join(cwd, ".roo", "mcp.json"),
			JSON.stringify({
				mcpServers: {
					fs: { command: "docker", args: ["run", "-i", "mcp/filesystem:1.0"] },
				},
			}),
		);
		// Global: Windsurf map.
		mkdirSync(join(home, ".codeium", "windsurf"), { recursive: true });
		writeFileSync(
			join(home, ".codeium", "windsurf", "mcp_config.json"),
			JSON.stringify({
				mcpServers: { fetch: { command: "uvx", args: ["mcp-server-fetch"] } },
			}),
		);
		// Global: Gemini settings.json.
		mkdirSync(join(home, ".gemini"), { recursive: true });
		writeFileSync(
			join(home, ".gemini", "settings.json"),
			JSON.stringify({
				mcpServers: {
					mem: {
						command: "npx",
						args: ["@modelcontextprotocol/server-memory"],
					},
				},
			}),
		);
		// Global: Codex config.toml ([mcp_servers.*]).
		mkdirSync(join(home, ".codex"), { recursive: true });
		writeFileSync(
			join(home, ".codex", "config.toml"),
			'[mcp_servers.time]\ncommand = "uvx"\nargs = ["mcp-server-time"]\n',
		);
	});

	afterAll(() => {
		rmSync(cwd, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
	});

	it("detects servers across tools, registries, and scopes", () => {
		const servers = detectMcpServers(cwd, home);
		const byKey = new Map(servers.map((s) => [s.stableKey, s]));

		// Claude Code project (npm).
		expect(byKey.get("linked:pkg:npm:@upstash/context7-mcp")?.scope).toBe(
			"project",
		);
		// Continue YAML list shape (pypi), project.
		expect(byKey.get("linked:pkg:pypi:mcp-server-git")?.group).toBe("continue");
		// Roo docker (oci), project.
		expect(byKey.get("linked:pkg:oci:mcp/filesystem")?.scope).toBe("project");
		// Windsurf (pypi), global.
		expect(byKey.get("linked:pkg:pypi:mcp-server-fetch")?.scope).toBe("global");
		// Gemini (npm), global.
		expect(
			byKey.get("linked:pkg:npm:@modelcontextprotocol/server-memory")?.group,
		).toBe("gemini");
		// Codex TOML (pypi), global.
		expect(byKey.get("linked:pkg:pypi:mcp-server-time")?.group).toBe("codex");
	});
});
