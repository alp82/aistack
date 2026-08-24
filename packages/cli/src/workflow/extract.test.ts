import { describe, expect, it } from "vitest";
import { buildWorkflowExtraction, extractLocalWorkflow } from "./extract.js";
import type { GitWorkflowResult, GitWorkflowRunner } from "./git.js";
import { createHarnessWorkflowReducer } from "./reducer.js";

describe("buildWorkflowExtraction", () => {
	it("combines harness and Git facts into metric inputs without local records", () => {
		const reducer = createHarnessWorkflowReducer("claude-code");
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
			weekdayHourCells: [{ weekday: 1, hour: 23, commits: 4 }],
		};

		const extraction = buildWorkflowExtraction([reducer.finish()], git);
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
		expect(extraction.harnesses[0]?.phase.ruleVersion).toBe("phase-rules/v1");
		expect(JSON.stringify(extraction)).not.toContain("/secret/repository");
		expect(JSON.stringify(extraction)).not.toContain("secret-session");
	});

	it("reads Git only from workspaces touched by the harness window", () => {
		const reducer = createHarnessWorkflowReducer("codex");
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
			harnesses: [reducer.finish()],
			fromMs: Date.UTC(2026, 7, 1),
			toMs: Date.UTC(2026, 7, 31),
			run,
		});
		expect(calls[0]).toBe("/work/touched:rev-parse");
		expect(extraction.git.totalCommits).toBe(1);
		expect(JSON.stringify(extraction)).not.toContain("/work/");
	});
});
