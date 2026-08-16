import { describe, expect, it } from "vitest";
import type { Resource } from "../api.js";
import { diffResources } from "./collect.js";

const fileResource = (path: string, content: string): Resource => ({
	type: "rule",
	name: path,
	group: "generic",
	stableKey: `generic:rule:${path}`,
	files: [{ name: path, content, path }],
});

const linkResource = (repoUrl: string): Resource => ({
	type: "custom",
	name: "repo",
	group: "generic",
	stableKey: `linked:${repoUrl}:`,
	upstream: { repoUrl },
});

describe("diffResources", () => {
	it("detects a link-only addition (the bug that hid links from the diff)", () => {
		const existing = [fileResource("CLAUDE.md", "a")];
		const current = [
			fileResource("CLAUDE.md", "a"),
			linkResource("https://github.com/alp82/aistack"),
		];
		const diff = diffResources(current, existing);
		expect(diff.added).toBe(1);
		expect(diff.changed).toBe(0);
		expect(diff.removed).toBe(0);
		expect(diff.details).toContainEqual({
			name: "link: aistack",
			status: "added",
		});
	});

	it("reports a removed link", () => {
		const diff = diffResources(
			[],
			[linkResource("https://github.com/alp82/aistack")],
		);
		expect(diff.removed).toBe(1);
		expect(diff.details).toContainEqual({
			name: "link: aistack",
			status: "removed",
		});
	});

	it("treats an unchanged link as no change", () => {
		const link = linkResource("https://github.com/alp82/aistack");
		const diff = diffResources([link], [link]);
		expect(diff.added).toBe(0);
		expect(diff.removed).toBe(0);
		expect(diff.changed).toBe(0);
	});

	it("detects a pkg-only (MCP) addition - no files, no upstream", () => {
		const pkg = (id: string): Resource => ({
			type: "mcp",
			name: id,
			group: "claude-code",
			stableKey: `linked:pkg:npm:${id}`,
			pkg: { registry: "npm", id },
		});
		const diff = diffResources([pkg("@upstash/context7-mcp")], []);
		expect(diff.added).toBe(1);
		expect(diff.details).toContainEqual({
			name: "link: @upstash/context7-mcp",
			status: "added",
		});
	});
});
