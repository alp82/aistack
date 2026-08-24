import { describe, expect, it } from "vitest";
import { buildWorkflowExtraction, extractLocalWorkflow } from "./extract.js";
import type { GitWorkflowResult, GitWorkflowRunner } from "./git.js";
import {
	createHarnessWorkflowReducer,
	createWorkflowLocalSources,
} from "./reducer.js";

describe("buildWorkflowExtraction", () => {
	it("combines harness and Git facts into metric inputs without local records", () => {
		const local = createWorkflowLocalSources();
		const reducer = createHarnessWorkflowReducer("claude-code", local);
		reducer.ingest({
			type: "response",
			session: "secret-session",
			projectWorkspace: "/secret/repository",
			tsMs: Date.UTC(2026, 7, 24, 23),
			model: "claude-opus-5",
			thinkingTokens: 25,
			responseTokens: 75,
		});
		reducer.ingest({
			type: "event",
			session: "secret-session",
			projectWorkspace: "/secret/repository",
			tsMs: Date.UTC(2026, 7, 24, 23),
			tool: "WebSearch",
		});

		const git: GitWorkflowResult = {
			totalCommits: 4,
			lateNightCommits: 2,
			additions: 30,
			removals: 10,
			changedLinesPerCommit: [10, 10, 10, 10],
			testFileCommits: 2,
			changedLinesByExtension: [{ extension: ".ts", changedLines: 40 }],
			withheldExtensionLines: 0,
			weekdayHourCells: [{ weekday: 1, hour: 23, commits: 4 }],
		};

		const extraction = buildWorkflowExtraction(
			[{ aggregate: reducer.finish(), local }],
			git,
		);
		expect(extraction.metricInputs).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					metricId: "late-night-commits",
					value: 0.5,
					coverage: 1,
				}),
				expect.objectContaining({
					metricId: "thinking-share",
					value: 0.25 / 0.75,
				}),
			]),
		);
		expect(extraction.harnesses[0]?.phase?.ruleVersion).toBe("phase-rules/v1");
		expect(JSON.stringify(extraction)).not.toContain("/secret/repository");
		expect(JSON.stringify(extraction)).not.toContain("secret-session");
		expect(JSON.stringify(extraction)).not.toContain("/secret/repository");
	});

	it("sanitizes provider model names before they reach publishable routing", () => {
		const local = createWorkflowLocalSources();
		const reducer = createHarnessWorkflowReducer("opencode", local);
		reducer.ingest({
			type: "response",
			session: "session",
			tsMs: Date.UTC(2026, 7, 24),
			model: `private provider:${"x".repeat(100)}`,
			responseTokens: 10,
		});

		const extraction = buildWorkflowExtraction(
			[{ aggregate: reducer.finish(), local }],
			{
				totalCommits: 0,
				lateNightCommits: 0,
				additions: 0,
				removals: 0,
				changedLinesPerCommit: [],
				testFileCommits: 0,
				changedLinesByExtension: [],
				withheldExtensionLines: 0,
				weekdayHourCells: [],
			},
		);

		expect(extraction.harnesses[0]?.routing?.main[0]?.model).toMatch(
			/^private-provider:x+$/,
		);
		expect(
			extraction.harnesses[0]?.routing?.main[0]?.model.length,
		).toBeLessThanOrEqual(64);
	});

	it("reads Git only from workspaces touched by the harness window", () => {
		const local = createWorkflowLocalSources();
		const reducer = createHarnessWorkflowReducer("codex", local);
		reducer.ingest({
			type: "event",
			session: "session",
			projectWorkspace: "/work/touched",
			tsMs: Date.UTC(2026, 7, 24, 12),
			tool: "read_file",
		});
		const calls: string[] = [];
		const run: GitWorkflowRunner = (cwd, args) => {
			calls.push(`${cwd}:${args[0]}`);
			if (args[0] === "rev-parse") return "/work/repo\n";
			return "\u001eaaaa\u00002026-08-24T12:00:00+00:00\n1\t0\tsrc/a.ts\n";
		};

		const extraction = extractLocalWorkflow({
			harnesses: [{ aggregate: reducer.finish(), local }],
			fromMs: Date.UTC(2026, 7, 1),
			toMs: Date.UTC(2026, 7, 31),
			run,
		});
		expect(calls[0]).toBe("/work/touched:rev-parse");
		expect(extraction.git.totalCommits).toBe(1);
		expect(JSON.stringify(extraction)).not.toContain("/work/");
	});

	it("withholds a harness playbook that fails the unknown gate", () => {
		const local = createWorkflowLocalSources();
		const reducer = createHarnessWorkflowReducer("opencode", local);
		reducer.ingest({
			type: "event",
			session: "session",
			tsMs: 1,
			tool: "private_extension_tool",
		});

		const extraction = buildWorkflowExtraction(
			[{ aggregate: reducer.finish(), local }],
			{
				totalCommits: 0,
				lateNightCommits: 0,
				additions: 0,
				removals: 0,
				changedLinesPerCommit: [],
				testFileCommits: 0,
				changedLinesByExtension: [],
				withheldExtensionLines: 0,
				weekdayHourCells: [],
			},
		);

		expect(extraction.harnesses[0]?.phase).toBeUndefined();
	});
});
