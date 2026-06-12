import { describe, expect, it } from "vitest";
import {
	buildLinkResource,
	buildRepoLinkResource,
	detectRepoUrl,
} from "./git.js";

describe("detectRepoUrl", () => {
	it("canonicalizes a GitHub SCP origin", () => {
		expect(detectRepoUrl("/x", () => "git@github.com:alp82/aistack.git")).toBe(
			"https://github.com/alp82/aistack",
		);
	});

	it("trims and lowercases an https origin", () => {
		expect(
			detectRepoUrl("/x", () => "https://github.com/Alp82/AiStack.git\n"),
		).toBe("https://github.com/alp82/aistack");
	});

	it("returns null for a non-GitHub origin", () => {
		expect(detectRepoUrl("/x", () => "https://gitlab.com/alp82/aistack")).toBe(
			null,
		);
	});

	it("returns null when the runner reports no origin", () => {
		expect(detectRepoUrl("/x", () => "")).toBe(null);
		expect(detectRepoUrl("/x", () => null)).toBe(null);
	});
});

describe("buildRepoLinkResource", () => {
	it("builds a linked resource with no files and the web-matching stableKey", () => {
		const resource = buildRepoLinkResource("https://github.com/alp82/aistack");
		expect(resource).toEqual({
			type: "custom",
			name: "aistack",
			group: "generic",
			stableKey: "linked:https://github.com/alp82/aistack:",
			upstream: { repoUrl: "https://github.com/alp82/aistack" },
		});
		// upstream presence is the storage discriminator — a link must carry no files.
		expect("files" in resource).toBe(false);
	});
});

describe("buildLinkResource", () => {
	it("includes path + lastCommitSha and the path-suffixed stableKey", () => {
		const r = buildLinkResource({
			canonical: "https://github.com/anthropics/claude-plugins-official",
			path: "plugins/frontend-design",
			name: "frontend-design",
			type: "plugin",
			group: "claude-code",
			sha: "deadbeef",
		});
		expect(r).toEqual({
			type: "plugin",
			name: "frontend-design",
			group: "claude-code",
			stableKey:
				"linked:https://github.com/anthropics/claude-plugins-official:plugins/frontend-design",
			upstream: {
				repoUrl: "https://github.com/anthropics/claude-plugins-official",
				path: "plugins/frontend-design",
				lastCommitSha: "deadbeef",
			},
		});
		expect("files" in r).toBe(false);
		expect("scope" in r).toBe(false);
	});

	it("omits path/sha when empty (repo-root link)", () => {
		const r = buildLinkResource({
			canonical: "https://github.com/alp82/aistack",
			name: "aistack",
			type: "custom",
			group: "generic",
		});
		expect(r.stableKey).toBe("linked:https://github.com/alp82/aistack:");
		expect(r.upstream).toEqual({ repoUrl: "https://github.com/alp82/aistack" });
		expect("scope" in r).toBe(false);
	});
});
