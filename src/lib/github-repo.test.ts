import { describe, expect, test } from "vitest";
import {
	canonicalizeRepoUrl,
	isGithubRepoUrl,
	normalizeUpstreamPath,
	parseRepo,
	repoNameFromCanonical,
} from "./github-repo";

describe("parseRepo", () => {
	test("rejects repo-less and host-only inputs", () => {
		expect(parseRepo("https://github.com/")).toBeNull();
		expect(parseRepo("https://github.com/onlyowner")).toBeNull();
		expect(parseRepo("")).toBeNull();
		expect(parseRepo("   ")).toBeNull();
	});

	test("rejects non-github hosts", () => {
		expect(parseRepo("https://gitlab.com/owner/repo")).toBeNull();
		expect(parseRepo("https://bitbucket.org/owner/repo")).toBeNull();
		expect(parseRepo("git@gitlab.com:owner/repo.git")).toBeNull();
	});

	test("strips query, anchor, .git, and trailing slash", () => {
		expect(parseRepo("https://github.com/owner/repo?tab=readme")).toEqual({
			owner: "owner",
			repo: "repo",
		});
		expect(parseRepo("https://github.com/owner/repo#anchor")).toEqual({
			owner: "owner",
			repo: "repo",
		});
		expect(parseRepo("https://github.com/owner/repo.git")).toEqual({
			owner: "owner",
			repo: "repo",
		});
		expect(parseRepo("https://github.com/owner/repo/")).toEqual({
			owner: "owner",
			repo: "repo",
		});
	});

	test("parses scp form", () => {
		expect(parseRepo("git@github.com:owner/repo.git")).toEqual({
			owner: "owner",
			repo: "repo",
		});
	});

	test("case-folds owner and repo", () => {
		expect(parseRepo("https://github.com/Owner/Repo")).toEqual({
			owner: "owner",
			repo: "repo",
		});
	});

	test("ignores extra path segments beyond owner/repo", () => {
		expect(parseRepo("https://github.com/owner/repo/tree/main/src")).toEqual({
			owner: "owner",
			repo: "repo",
		});
	});
});

describe("canonicalizeRepoUrl", () => {
	test("produces canonical https url or null", () => {
		expect(canonicalizeRepoUrl("git@github.com:owner/repo.git")).toBe(
			"https://github.com/owner/repo",
		);
		expect(
			canonicalizeRepoUrl("https://github.com/Owner/Repo?tab=readme"),
		).toBe("https://github.com/owner/repo");
		expect(canonicalizeRepoUrl("https://github.com/onlyowner")).toBeNull();
	});
});

describe("isGithubRepoUrl", () => {
	test("accepts valid repo urls and rejects the rest", () => {
		expect(isGithubRepoUrl("https://github.com/owner/repo")).toBe(true);
		expect(isGithubRepoUrl("git@github.com:owner/repo.git")).toBe(true);
		expect(isGithubRepoUrl("https://github.com/")).toBe(false);
		expect(isGithubRepoUrl("https://github.com/onlyowner")).toBe(false);
	});
});

describe("normalizeUpstreamPath", () => {
	test("trims slashes and collapses internal doubles, preserving case", () => {
		expect(normalizeUpstreamPath("src/agents")).toBe("src/agents");
		expect(normalizeUpstreamPath("/src/agents")).toBe("src/agents");
		expect(normalizeUpstreamPath("src/agents/")).toBe("src/agents");
		expect(normalizeUpstreamPath("src//agents")).toBe("src/agents");
		expect(normalizeUpstreamPath("Src/Agents")).toBe("Src/Agents");
		expect(normalizeUpstreamPath(undefined)).toBe("");
		expect(normalizeUpstreamPath("")).toBe("");
		expect(normalizeUpstreamPath("/")).toBe("");
	});
});

describe("repoNameFromCanonical", () => {
	test("returns the repo segment", () => {
		expect(repoNameFromCanonical("https://github.com/owner/repo")).toBe("repo");
		expect(repoNameFromCanonical("https://github.com/Owner/Repo")).toBe("repo");
	});
});
