import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { scanLocal } from "./scanner.js";

describe("Grok Build authored resources", () => {
	const roots: string[] = [];
	afterEach(() => {
		for (const root of roots) rmSync(root, { recursive: true, force: true });
	});

	test("previews only known resource roots and excludes config secrets", () => {
		const root = mkdtempSync(join(tmpdir(), "aistack-grok-resources-"));
		roots.push(root);
		for (const dir of ["skills/review", "commands", "agents", "hooks"])
			mkdirSync(join(root, ".grok", dir), { recursive: true });
		writeFileSync(join(root, "GROK.md"), "project rules");
		writeFileSync(join(root, ".grok", "skills", "review", "SKILL.md"), "skill");
		writeFileSync(join(root, ".grok", "commands", "ship.md"), "command");
		writeFileSync(join(root, ".grok", "agents", "reviewer.md"), "agent");
		writeFileSync(join(root, ".grok", "hooks", "audit.json"), "hook");
		writeFileSync(join(root, ".grok", "config.toml"), 'token = "secret"');

		const files = scanLocal(root);
		expect(
			files.map((file) => [file.relativePath, file.type, file.group]),
		).toEqual([
			["GROK.md", "rule", "grok-build"],
			[".grok/skills/review/SKILL.md", "skill", "grok-build"],
			[".grok/commands/ship.md", "command", "grok-build"],
			[".grok/agents/reviewer.md", "subagent", "grok-build"],
			[".grok/hooks/audit.json", "hook", "grok-build"],
		]);
		expect(JSON.stringify(files)).not.toContain("secret");
	});
});
