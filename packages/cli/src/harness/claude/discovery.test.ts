import {
	mkdirSync,
	mkdtempSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { claudeAdapter } from "./adapter.js";
import { createAggregate, finalize } from "./analyzer.js";
import { assistant } from "./fixtures.js";
import { scan } from "./scan.js";

vi.mock("node:os", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:os")>();
	return { ...actual, homedir: vi.fn(actual.homedir) };
});

let home: string;
const sinceMs = Date.parse("2026-07-01T00:00:00Z");
beforeEach(() => {
	home = mkdtempSync(join(tmpdir(), "aistack-claude-discovery-"));
	vi.mocked(homedir).mockReturnValue(home);
	vi.stubEnv("CLAUDE_CONFIG_DIR", "");
	vi.stubEnv("XDG_CONFIG_HOME", join(home, ".config"));
	vi.stubEnv("XDG_DATA_HOME", join(home, ".local", "share"));
});
afterEach(() => {
	vi.unstubAllEnvs();
	rmSync(home, { recursive: true, force: true });
});
function transcript(config: string, output: number) {
	const dir = join(config, "projects", "project");
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, "session.jsonl"),
		`${JSON.stringify(assistant({ usage: { output_tokens: output } }))}\n`,
	);
}
function total(result: Awaited<ReturnType<typeof claudeAdapter.scan>>) {
	return finalize(result.aggregate).models.reduce(
		(sum, model) => sum + model.tokens.output,
		0,
	);
}

describe("Claude account discovery", () => {
	test("sync scans sibling account histories without custom environment variables", async () => {
		transcript(join(home, ".claude"), 100);
		transcript(join(home, ".claude-work"), 200);
		expect(total(await claudeAdapter.scan({ sinceMs }))).toBe(300);
	});
	test("detect finds an account even when the default profile has no history", async () => {
		transcript(join(home, ".claude-secondary"), 200);
		expect(await claudeAdapter.detect({ sinceMs })).toBe(true);
	});
	test.each([".claude-team", ".claude_team", ".claude2"])(
		"discovers the %s profile naming pattern",
		async (name) => {
			transcript(join(home, name), 100);
			expect(total(await claudeAdapter.scan({ sinceMs }))).toBe(100);
		},
	);

	test("keeps distinct streamed records while folding their cumulative usage", async () => {
		for (const [profile, uuid, output] of [
			[".claude", "first", 100],
			[".claude-work", "second", 200],
		] as const) {
			const dir = join(home, profile, "projects", "project");
			mkdirSync(dir, { recursive: true });
			writeFileSync(
				join(dir, "session.jsonl"),
				`${JSON.stringify({
					...assistant({
						id: "same-response",
						requestId: "same-request",
						usage: { output_tokens: output },
						content: [{ type: "text", text: uuid }],
					}),
					uuid,
				})}\n`,
			);
		}
		const result = await claudeAdapter.scan({ sinceMs });
		expect(total(result)).toBe(200);
		expect(result.aggregate.textBlocks).toBe(2);
	});

	test("an account-specific environment adds to the other discovered accounts", async () => {
		transcript(join(home, ".claude"), 100);
		transcript(join(home, ".claude-personal"), 200);
		transcript(join(home, ".config", "claude-company"), 300);
		transcript(join(home, "custom-profile"), 400);
		vi.stubEnv(
			"CLAUDE_CONFIG_DIR",
			` ${join(home, "custom-profile")}, ${join(home, ".claude-personal")} `,
		);
		expect(total(await claudeAdapter.scan({ sinceMs }))).toBe(1_000);
	});
	test("discovers nested profiles and both current and legacy switcher layouts", async () => {
		transcript(join(home, ".claude", "profiles", "personal"), 10);
		transcript(join(home, ".claude-team", "accounts", "work"), 20);
		transcript(join(home, ".claude-swap-backup", "1-saved-account"), 30);
		transcript(
			join(home, ".claude-swap-backup", "sessions", "3-saved-account"),
			40,
		);
		transcript(
			join(
				home,
				".local",
				"share",
				"claude-swap",
				"sessions",
				"2-saved-account",
			),
			50,
		);
		expect(total(await claudeAdapter.scan({ sinceMs }))).toBe(150);
	});
	test("resolves aliased transcript roots without counting the same files twice", async () => {
		transcript(join(home, ".claude"), 100);
		symlinkSync(join(home, ".claude"), join(home, ".claude-alias"), "dir");
		const result = await claudeAdapter.scan({ sinceMs });
		expect(total(result)).toBe(100);
		expect(result.stats.filesRead).toBe(1);
	});
	test("ignores unrelated directories even when they contain a projects folder", async () => {
		transcript(join(home, "unrelated"), 100);
		expect(await claudeAdapter.detect({ sinceMs })).toBe(false);
		expect(total(await claudeAdapter.scan({ sinceMs }))).toBe(0);
	});
	test("an unreadable profile produces a partial reading even without readable history", async () => {
		symlinkSync(join(home, ".claude-loop"), join(home, ".claude-loop"), "dir");
		expect(await claudeAdapter.detect({ sinceMs })).toBe(true);
		expect((await claudeAdapter.scan({ sinceMs })).scanComplete).toBe(false);
	});
	test("counts copied records once for tokens, content blocks and workflow", async () => {
		const record = {
			...assistant({
				usage: { output_tokens: 100 },
				content: [{ type: "thinking", thinking: "private" }],
			}),
			uuid: "record-1",
		};
		const compaction = {
			type: "system",
			subtype: "compact_boundary",
			uuid: "record-2",
			sessionId: "sess-1",
			timestamp: "2026-07-20T12:01:00Z",
		};
		const records = `${JSON.stringify(record)}\n${JSON.stringify(compaction)}\n`;
		for (const profile of [
			".claude",
			".claude-swap-backup/sessions/1-profile",
		]) {
			const dir = join(home, profile, "projects", "project");
			mkdirSync(dir, { recursive: true });
			writeFileSync(join(dir, "session.jsonl"), records);
		}
		const baseline = createAggregate();
		await scan(baseline, {
			roots: [join(home, ".claude", "projects")],
			sinceMs,
		});
		const result = await claudeAdapter.scan({ sinceMs });
		expect(result.stats.filesRead).toBe(2);
		expect(total(result)).toBe(100);
		expect(result.aggregate.thinkingBlocks).toBe(baseline.thinkingBlocks);
		expect(result.workflow).toEqual(baseline.workflow.finish());
	});
});
