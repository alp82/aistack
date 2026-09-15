import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { foldGitDays } from "@aistack/workflow-rules";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disableTrace, enableTrace } from "../trace.js";
import { extractGitWorkflow, extractGitWorkflowAsync } from "./git.js";

/**
 * These cases run the real `git` binary, so the extractor parses the real
 * `--numstat -z` framing rather than a hand-written imitation of it. The
 * framing is where the reading went wrong before, and a fixture written by hand
 * cannot catch a mistake about what Git actually prints.
 */

const AUTHORED_AT = "2026-08-10T14:00:00+02:00";

function git(cwd: string, args: readonly string[], date = AUTHORED_AT): void {
	execFileSync("git", [...args], {
		cwd,
		stdio: ["ignore", "ignore", "ignore"],
		env: {
			...process.env,
			GIT_AUTHOR_NAME: "Test",
			GIT_AUTHOR_EMAIL: "test@example.com",
			GIT_COMMITTER_NAME: "Test",
			GIT_COMMITTER_EMAIL: "test@example.com",
			GIT_AUTHOR_DATE: date,
			GIT_COMMITTER_DATE: date,
		},
	});
}

function write(root: string, file: string, contents: string | Buffer): void {
	const target = path.join(root, file);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, contents);
}

const lines = (count: number, text = "line"): string =>
	`${Array.from({ length: count }, (_, index) => `${text} ${index}`).join("\n")}\n`;

let root: string;

beforeAll(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aistack-git-"));
	git(root, ["init", "--initial-branch=main", "--quiet"]);
	git(root, ["config", "commit.gpgsign", "false"]);
});

afterAll(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

/** Every commit here is authored on one day, so the fold is that day's row. */
const read = () =>
	foldGitDays(
		extractGitWorkflow({
			workingDirectories: [root],
			fromMs: Date.parse("2026-08-01T00:00:00Z"),
			toMs: Date.parse("2026-08-31T23:59:59Z"),
			utcOffsetMinutes: 120,
		}).days,
	);

describe("extractGitWorkflow over real Git output", () => {
	it("counts authored lines and leaves a vendored dependency tree out", () => {
		write(root, "src/app.ts", lines(10));
		write(root, ".pnpm-store/v11/files/ab/deadbeefcafe", lines(1000));
		write(root, "node_modules/left-pad/index.js", lines(500));
		git(root, ["add", "-A"]);
		git(root, ["commit", "-m", "first"]);

		const result = read();

		expect(result.commits).toBe(1);
		expect(result.additions).toBe(10);
		expect(result.changedLinesPerCommit).toEqual([10]);
		expect(result.changedLinesByExtension).toEqual([
			{ extension: ".ts", changedLines: 10 },
		]);
		expect(result.withheldExtensionLines).toBe(0);
	});

	it("withholds a file with no extension instead of ranking it as a language", () => {
		write(root, "Dockerfile", lines(6));
		write(root, ".gitignore", lines(4));
		write(root, "LICENSE", lines(2));
		write(root, "src/second.ts", lines(12));
		git(root, ["add", "-A"]);
		git(root, ["commit", "-m", "second"]);

		const result = read();

		expect(
			result.changedLinesByExtension.map((row) => row.extension),
		).not.toContain("(none)");
		// 10 from the first commit, 12 from this one.
		expect(result.changedLinesByExtension).toEqual([
			{ extension: ".ts", changedLines: 22 },
		]);
		// 6 + 4 + 2: the lines stay in the denominator, only their type is withheld.
		expect(result.withheldExtensionLines).toBe(12);
	});

	it("reads a rename record against the new path and counts no line for a binary", () => {
		fs.rmSync(path.join(root, "src/second.ts"));
		write(root, "src/moved.py", lines(15));
		write(
			root,
			"assets/logo.png",
			Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3]),
		);
		git(root, ["add", "-A"]);
		git(root, ["commit", "-m", "third"]);

		const result = read();
		const byExtension = Object.fromEntries(
			result.changedLinesByExtension.map((row) => [
				row.extension,
				row.changedLines,
			]),
		);

		// Git reports the rename as one record whose path field is empty, followed
		// by the old path and the new path. The new path is the one that counts, so
		// the three added lines land on Python, not on TypeScript.
		expect(byExtension[".py"]).toBe(3);
		expect(byExtension[".ts"]).toBe(22);
		// A binary record reads `-` for both counts. It is worth no changed line,
		// and it must not spill into the record that follows it.
		expect(byExtension[".png"]).toBeUndefined();
		expect(result.withheldExtensionLines).toBe(12);
	});

	it("names the module spellings of JavaScript and TypeScript", () => {
		write(root, "daemon/dispatch.mjs", lines(9));
		write(root, "scripts/legacy.cjs", lines(5));
		write(root, "src/config.mts", lines(4));
		git(root, ["add", "-A"]);
		git(root, ["commit", "-m", "fourth"]);

		const result = read();
		const byExtension = Object.fromEntries(
			result.changedLinesByExtension.map((row) => [
				row.extension,
				row.changedLines,
			]),
		);

		expect(byExtension[".mjs"]).toBe(9);
		expect(byExtension[".cjs"]).toBe(5);
		expect(byExtension[".mts"]).toBe(4);
		// Unchanged from the previous commit: none of the three was withheld.
		expect(result.withheldExtensionLines).toBe(12);
	});

	it("leaves a merge commit out and keeps a pure rename in", () => {
		const before = read();

		git(root, ["checkout", "-b", "feature", "--quiet"]);
		write(root, "src/feature.ts", lines(7));
		git(root, ["add", "-A"]);
		git(root, ["commit", "-m", "feature"]);
		git(root, ["checkout", "main", "--quiet"]);
		git(root, ["merge", "--no-ff", "--no-edit", "feature"]);
		git(root, ["mv", "src/app.ts", "src/renamed.ts"]);
		git(root, ["commit", "-m", "rename only"]);

		const result = read();

		// The feature commit and the rename count. The merge does not: it carries
		// no authored work, so it is neither a commit nor a zero-line dot.
		expect(result.commits).toBe(before.commits + 2);
		expect([...result.changedLinesPerCommit].sort()).toEqual(
			[...before.changedLinesPerCommit, 7, 0].sort(),
		);
		expect(result.additions).toBe(before.additions + 7);
		expect(result.commitSetRuleVersion).toBe("commit-set/v1");
		// 14:00+02:00 is 12:00Z. The cell ships in UTC.
		expect(result.weekdayHourCells.every((cell) => cell.hourUtc === 12)).toBe(
			true,
		);
	});

	it("counts no line for a file over the big-file threshold (file-types/v3)", () => {
		const linesOf = (extension: string) =>
			read().changedLinesByExtension.find((row) => row.extension === extension)
				?.changedLines ?? 0;
		const tsBefore = linesOf(".ts");
		const commitsBefore = read().commits;
		// 1.2 MB of JSON: an approved extension, but nobody typed it.
		write(root, "fixtures/dump.json", lines(60_000, '"row-value-padding"'));
		write(root, "src/real.ts", lines(3));
		git(root, ["add", "-A"]);
		git(root, ["commit", "-m", "dump"]);

		// The dump reads as binary: no line on either side, and no withheld line
		// either. The commit itself still counts, and the small file still does.
		expect(linesOf(".json")).toBe(0);
		expect(linesOf(".ts")).toBe(tsBefore + 3);
		expect(read().commits).toBe(commitsBefore + 1);
	});

	it("reads a repository once through a worktree and the main checkout", () => {
		const worktree = path.join(root, "..", `${path.basename(root)}-wt`);
		git(root, ["worktree", "add", "--quiet", "-b", "wt", worktree]);
		try {
			const result = foldGitDays(
				extractGitWorkflow({
					workingDirectories: [root, worktree],
					fromMs: Date.parse("2026-08-01T00:00:00Z"),
					toMs: Date.parse("2026-08-31T23:59:59Z"),
					utcOffsetMinutes: 120,
				}).days,
			);
			expect(result.commits).toBe(read().commits);
		} finally {
			git(root, ["worktree", "remove", "--force", worktree]);
		}
	});
});

it.each([false, true])(
	"summarizes expected Git discovery misses without warning spam (%s)",
	async (asyncRun) => {
		const directory = fs.mkdtempSync(
			path.join(os.tmpdir(), "aistack-nonrepo-"),
		);
		const logs: string[] = [];
		enableTrace((line) => logs.push(line));
		try {
			const options = {
				workingDirectories: [
					directory,
					path.join(directory, "removed-worktree"),
				],
				fromMs: 0,
				toMs: Date.now(),
				utcOffsetMinutes: 0,
			};
			await (asyncRun
				? extractGitWorkflowAsync(options)
				: extractGitWorkflow(options));
			expect(logs).toHaveLength(1);
			expect(logs[0]).toContain(
				"skipped 1 missing directories, 1 non-repository directories",
			);
			expect(logs[0]).toContain("INFO");
			expect(logs[0]).not.toContain(directory);
		} finally {
			disableTrace();
			fs.rmSync(directory, { recursive: true, force: true });
		}
	},
);

it.each([false, true])(
	"diffs only author-window commits while preserving the legacy reading (%s)",
	async (asyncRun) => {
		const directory = fs.mkdtempSync(
			path.join(os.tmpdir(), "aistack-git-window-"),
		);
		try {
			git(directory, ["init", "--initial-branch=main", "--quiet"]);
			git(directory, ["config", "commit.gpgsign", "false"]);
			const hashes: string[] = [];
			for (const [index, authoredAt] of [
				"2020-01-01T00:00:00Z",
				"2026-08-01T00:00:00Z",
				"2026-08-31T23:59:59Z",
				"2020-01-02T00:00:00Z",
			].entries()) {
				write(directory, `src/file${index}.ts`, lines(index + 1));
				git(directory, ["add", "-A"]);
				// All commits have old committer times, including the in-window author.
				git(
					directory,
					["commit", "--date", authoredAt, "-m", `commit ${index}`],
					"2020-01-03T00:00:00Z",
				);
				hashes.push(
					execFileSync("git", ["rev-parse", "HEAD"], {
						cwd: directory,
						encoding: "utf8",
					}).trim(),
				);
			}
			const options = {
				workingDirectories: [directory],
				fromMs: Date.parse("2026-08-01T00:00:00Z"),
				toMs: Date.parse("2026-08-31T23:59:59Z"),
				utcOffsetMinutes: 120,
			};
			const execute = (cwd: string, args: readonly string[]) =>
				execFileSync("git", [...args], { cwd, encoding: "utf8" });
			const legacyArgs = [
				"-c",
				"core.bigFileThreshold=1m",
				"log",
				"--all",
				"--no-merges",
				"--format=%x00aistack-commit%x00%H%x00%aI%x00",
				"--numstat",
				"-z",
			];
			const legacy = extractGitWorkflow({
				...options,
				run: (cwd, args) =>
					execute(cwd, args[0] === "rev-parse" ? args : legacyArgs),
			});
			const diffed: string[] = [];
			const run = (cwd: string, args: readonly string[]) => {
				const output = execute(cwd, args);
				if (args.includes("--numstat")) {
					diffed.push(
						...[...output.matchAll(/aistack-commit\0([a-f0-9]+)\0/g)].map(
							(match) => match[1] ?? "",
						),
					);
				}
				return output;
			};
			const actual = asyncRun
				? await extractGitWorkflowAsync({
						...options,
						run: async (cwd, args) => run(cwd, args),
					})
				: extractGitWorkflow({ ...options, run });
			expect(actual).toEqual(legacy);
			expect(actual.days[0]?.additions).toBe(2);
			expect(actual.days[1]?.additions).toBe(3);
			expect(diffed).toEqual([hashes[2], hashes[1]]);
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	},
);
