import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const ROOT = join(__dirname, "..", "..");

// Generated files are exempt: we do not author their prose.
const EXEMPT = [/routeTree\.gen\.ts$/, /pnpm-lock\.yaml$/];

/**
 * The em dash is banned repo-wide (AGENTS.md, Writing Guidelines): copy, CLI
 * output, comments, and docs all use a period, colon, comma, or parentheses
 * instead. This test keeps the ban from regressing.
 */
describe("no em dashes in tracked text files", () => {
	test("tracked .ts/.tsx/.md/.css files contain no em dash", () => {
		const files = execFileSync("git", ["ls-files"], { cwd: ROOT })
			.toString()
			.split("\n")
			.filter((f) => /\.(ts|tsx|md|css)$/.test(f))
			.filter((f) => !EXEMPT.some((re) => re.test(f)));

		const EM_DASH = "\u2014";
		const offenders: string[] = [];
		for (const f of files) {
			let content: string;
			try {
				content = readFileSync(join(ROOT, f), "utf8");
			} catch {
				continue; // deleted in the working tree but still tracked
			}
			if (content.includes(EM_DASH)) offenders.push(f);
		}
		expect(offenders).toEqual([]);
	});
});
