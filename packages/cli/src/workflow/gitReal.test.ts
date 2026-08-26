import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { extractGitWorkflow } from "./git.js";

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

const read = () =>
	extractGitWorkflow({
		workingDirectories: [root],
		fromMs: Date.parse("2026-08-01T00:00:00Z"),
		toMs: Date.parse("2026-08-31T23:59:59Z"),
	});

describe("extractGitWorkflow over real Git output", () => {
	it("counts authored lines and leaves a vendored dependency tree out", () => {
		write(root, "src/app.ts", lines(10));
		write(root, ".pnpm-store/v11/files/ab/deadbeefcafe", lines(1000));
		write(root, "node_modules/left-pad/index.js", lines(500));
		git(root, ["add", "-A"]);
		git(root, ["commit", "-m", "first"]);

		const result = read();

		expect(result.totalCommits).toBe(1);
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
});
