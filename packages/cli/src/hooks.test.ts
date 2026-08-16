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
	it("emits one hosted hook resource per event, keyed by local/global source - no scope field", () => {
		const hooks = detectHooks(cwd, home);
		const byKey = new Map(hooks.map((h) => [h.stableKey, h]));

		const pre = byKey.get("hooks:local:PreToolUse");
		expect(pre).toBeDefined();
		expect(pre?.type).toBe("hook");
		expect(pre?.group).toBe("claude-code");
		expect("scope" in (pre as object)).toBe(false);
		expect(pre?.files?.[0]?.path).toBe("hooks/PreToolUse.json");
		// Content is the event's config block, pretty-printed.
		expect(pre?.files?.[0]?.content).toContain("Bash");

		expect(byKey.has("hooks:local:PostToolUse")).toBe(true);
		const stop = byKey.get("hooks:global:Stop");
		expect(stop).toBeDefined();
		expect("scope" in (stop as object)).toBe(false);
		expect(hooks).toHaveLength(3);
	});

	it("TC-HOOKS-02: same event in both local and global settings - returns 2 with distinct keys and no scope", () => {
		const localCwd = mkdtempSync(join(tmpdir(), "aistack-hooks-tc02-cwd-"));
		const globalHome = mkdtempSync(join(tmpdir(), "aistack-hooks-tc02-home-"));
		mkdirSync(join(localCwd, ".claude"), { recursive: true });
		writeFileSync(
			join(localCwd, ".claude", "settings.json"),
			JSON.stringify({
				hooks: {
					Stop: [{ hooks: [{ type: "command", command: "local-stop" }] }],
				},
			}),
		);
		mkdirSync(join(globalHome, ".claude"), { recursive: true });
		writeFileSync(
			join(globalHome, ".claude", "settings.json"),
			JSON.stringify({
				hooks: {
					Stop: [{ hooks: [{ type: "command", command: "global-stop" }] }],
				},
			}),
		);

		const result = detectHooks(localCwd, globalHome);
		const byKey = new Map(result.map((r) => [r.stableKey, r]));

		expect(result).toHaveLength(2);
		expect(byKey.has("hooks:local:Stop")).toBe(true);
		expect(byKey.has("hooks:global:Stop")).toBe(true);

		const local = byKey.get("hooks:local:Stop")!;
		const global = byKey.get("hooks:global:Stop")!;
		expect(local.files?.[0]?.content).toContain("local-stop");
		expect(global.files?.[0]?.content).toContain("global-stop");
		expect("scope" in (local as object)).toBe(false);
		expect("scope" in (global as object)).toBe(false);

		rmSync(localCwd, { recursive: true, force: true });
		rmSync(globalHome, { recursive: true, force: true });
	});

	it("returns [] when no settings/hooks exist", () => {
		const empty = mkdtempSync(join(tmpdir(), "aistack-hooks-empty-"));
		expect(detectHooks(empty, empty)).toEqual([]);
		rmSync(empty, { recursive: true, force: true });
	});
});
