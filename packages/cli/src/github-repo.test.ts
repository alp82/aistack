import { describe, expect, it } from "vitest";
import { canonicalizeRepoUrl, repoNameFromCanonical } from "./github-repo.js";

// Trimmed copy of the canonical parser — re-assert the cases the CLI relies on
// so drift from src/lib/github-repo.ts surfaces in `pnpm test`.
describe("canonicalizeRepoUrl", () => {
	const cases: Array<[string, string | null]> = [
		["git@github.com:alp82/aistack.git", "https://github.com/alp82/aistack"],
		["https://github.com/alp82/aistack", "https://github.com/alp82/aistack"],
		[
			"https://github.com/Alp82/AiStack.git",
			"https://github.com/alp82/aistack",
		],
		[
			"https://github.com/alp82/aistack?tab=readme",
			"https://github.com/alp82/aistack",
		],
		[
			"https://www.github.com/alp82/aistack",
			"https://github.com/alp82/aistack",
		],
		["https://gitlab.com/alp82/aistack", null],
		["git@bitbucket.org:alp82/aistack.git", null],
		["https://github.com/alp82", null],
		["", null],
		["not a url", null],
	];
	it.each(cases)("%s → %s", (input, expected) => {
		expect(canonicalizeRepoUrl(input)).toBe(expected);
	});
});

describe("repoNameFromCanonical", () => {
	it("returns the repo segment", () => {
		expect(repoNameFromCanonical("https://github.com/alp82/aistack")).toBe(
			"aistack",
		);
	});
});
