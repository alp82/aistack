import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { detectHooks } from "./hooks.js";

let cwd: string;
let home: string;

beforeAll(() => {
	cwd = mkdtempSync(join(tmpdir(), "aistack-hooks-cwd-"));
	home = mkdtempSync(join(tmpdir(), "aistack-hooks-home-"));
	mkdirSync(join(cwd, ".claude"), { recursive: true });
	writeFileSync(
		join(cwd, ".claude", "settings.json"),
		JSON.stringify({
			hooks: {
				PreToolUse: [
					{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] },
				],
				PostToolUse: [{ hooks: [{ type: "command", command: "lint" }] }],
			},
		}),
	);
	mkdirSync(join(home, ".claude"), { recursive: true });
	writeFileSync(
		join(home, ".claude", "settings.json"),
		JSON.stringify({
			hooks: { Stop: [{ hooks: [{ type: "command", command: "cleanup" }] }] },
		}),
	);
});

afterAll(() => {
	rmSync(cwd, { recursive: true, force: true });
	rmSync(home, { recursive: true, force: true });
});

describe("detectHooks", () => {
	it("emits one hosted hook resource per event, scoped by source", () => {
		const hooks = detectHooks(cwd, home);
		const byKey = new Map(hooks.map((h) => [h.stableKey, h]));

		const pre = byKey.get("hooks:project:PreToolUse");
		expect(pre).toBeDefined();
		expect(pre?.type).toBe("hook");
		expect(pre?.group).toBe("claude-code");
		expect(pre?.scope).toBe("project");
		expect(pre?.files?.[0]?.path).toBe("hooks/PreToolUse.json");
		// Content is the event's config block, pretty-printed.
		expect(pre?.files?.[0]?.content).toContain("Bash");

		expect(byKey.has("hooks:project:PostToolUse")).toBe(true);
		expect(byKey.get("hooks:global:Stop")?.scope).toBe("global");
		expect(hooks).toHaveLength(3);
	});

	it("returns [] when no settings/hooks exist", () => {
		const empty = mkdtempSync(join(tmpdir(), "aistack-hooks-empty-"));
		expect(detectHooks(empty, empty)).toEqual([]);
		rmSync(empty, { recursive: true, force: true });
	});
});
