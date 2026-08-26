import { describe, expect, it } from "vitest";

import { extractGitWorkflow, type GitWorkflowRunner } from "./git.js";

const record = (hash: string, authoredAt: string, numstat: string): string =>
	`\u0000aistack-commit\u0000${hash}\u0000${authoredAt}\u0000\u0000\n${numstat
		.trimEnd()
		.split("\n")
		.join("\u0000")}\u0000`;

describe("extractGitWorkflow", () => {
	it("reduces each touched repository once without returning local names", () => {
		const history = [
			record(
				"aaaa",
				"2026-08-03T23:30:00-05:00",
				"10\t2\tsrc/widget.ts\n3\t1\tsrc/widget.test.ts\n-\t-\tpublic/logo.png\n",
			),
			record(
				"bbbb",
				"2026-08-04T02:15:00-05:00",
				"5\t7\tsrc/index.js\n2\t0\ttests/helper\n",
			),
			record("cccc", "2026-09-01T01:00:00+00:00", "99\t0\toutside.ts\n"),
		].join("");
		const run: GitWorkflowRunner = (cwd, args) => {
			if (args[0] === "rev-parse") {
				if (cwd.startsWith("/work/repo")) return "/work/repo\n";
				if (cwd.startsWith("/copy/repo")) return "/copy/repo\n";
				return null;
			}
			expect(args).not.toContain("--no-renames");
			expect(args).toContain("-z");
			expect(args.some((arg) => arg.startsWith("--since="))).toBe(false);
			expect(args.some((arg) => arg.startsWith("--until="))).toBe(false);
			return cwd === "/work/repo" || cwd === "/copy/repo" ? history : null;
		};

		const result = extractGitWorkflow({
			workingDirectories: [
				"/work/repo/src",
				"/work/repo/tests",
				"/copy/repo/src",
				"/work/not-a-repository",
			],
			fromMs: Date.parse("2026-08-01T00:00:00Z"),
			toMs: Date.parse("2026-08-31T23:59:59Z"),
			run,
		});

		expect(result).toEqual({
			testFileRuleVersion: "test-files/v2",
			fileTypeRuleVersion: "file-types/v2",
			totalCommits: 2,
			lateNightCommits: 2,
			additions: 20,
			removals: 10,
			changedLinesPerCommit: [16, 14],
			testFileCommits: 2,
			changedLinesByExtension: [
				{ extension: ".js", changedLines: 12 },
				{ extension: ".ts", changedLines: 16 },
			],
			// `tests/helper` has no extension, so its 2 lines are withheld rather
			// than ranked: a file with no extension is not a coding language.
			withheldExtensionLines: 2,
			weekdayHourCells: [
				{ weekday: 1, hour: 23, commits: 1 },
				{ weekday: 2, hour: 2, commits: 1 },
			],
		});
		expect(JSON.stringify(result)).not.toContain("/work/");
		expect(JSON.stringify(result)).not.toContain("widget");
	});

	it("reads Unicode and renamed paths without Git quote transformations", () => {
		const history =
			"\u0000aistack-commit\u0000aaaa\u00002026-08-03T12:00:00+00:00\u0000\u0000\n" +
			"2\t1\tsrc/é\nfile.ts\u0000" +
			"1\t0\tsrc/control\u001e.ts\u0000" +
			"3\t2\t\u0000src/old.ts\u0000src/new.ts\u0000";
		const run: GitWorkflowRunner = (_cwd, args) =>
			args[0] === "rev-parse" ? "/work/repo\n" : history;

		const result = extractGitWorkflow({
			workingDirectories: ["/work/repo"],
			fromMs: Date.parse("2026-08-01T00:00:00Z"),
			toMs: Date.parse("2026-08-31T23:59:59Z"),
			run,
		});

		expect(result.changedLinesByExtension).toEqual([
			{ extension: ".ts", changedLines: 9 },
		]);
		expect(result.withheldExtensionLines).toBe(0);
	});

	it("withholds unapproved extension names while keeping their line total", () => {
		const run: GitWorkflowRunner = (_cwd, args) =>
			args[0] === "rev-parse"
				? "/work/repo\n"
				: record(
						"aaaa",
						"2026-08-03T12:00:00+00:00",
						"4\t1\tsrc/private.customer-name\n2\t0\tsrc/public.ts\n3\t2\tsrc/new.ts\n",
					);

		const result = extractGitWorkflow({
			workingDirectories: ["/work/repo"],
			fromMs: Date.parse("2026-08-01T00:00:00Z"),
			toMs: Date.parse("2026-08-31T23:59:59Z"),
			run,
		});

		expect(result.changedLinesByExtension).toEqual([
			{ extension: ".ts", changedLines: 7 },
		]);
		expect(result.withheldExtensionLines).toBe(5);
		expect(JSON.stringify(result)).not.toContain("customer-name");
	});
});
