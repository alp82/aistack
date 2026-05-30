import { describe, expect, it } from "vitest";
import {
	type InstalledPlugins,
	type KnownMarketplaces,
	type Manifest,
	resolvePluginLinks,
} from "./plugins.js";

// Fixtures mirror the real on-disk shapes (installed_plugins.json,
// known_marketplaces.json, marketplace.json) including the polymorphic `source`.
const marketplaces: KnownMarketplaces = {
	alperortac: { source: { source: "github", repo: "alp82/alp-river" } },
	"claude-plugins-official": {
		source: { source: "github", repo: "anthropics/claude-plugins-official" },
	},
};

const manifests: Record<string, Manifest> = {
	alperortac: {
		plugins: [
			{
				name: "alp-river",
				source: "./",
				repository: "https://github.com/alp82/alp-river",
			},
		],
	},
	"claude-plugins-official": {
		plugins: [
			{
				name: "posthog",
				source: {
					source: "url",
					url: "https://github.com/PostHog/ai-plugin.git",
					sha: "1b743cd",
				},
			},
			{ name: "frontend-design", source: "./plugins/frontend-design" },
			{
				name: "some-gitlab-plugin",
				source: { source: "url", url: "https://gitlab.com/x/y.git" },
			},
		],
	},
};

const installed: InstalledPlugins = {
	plugins: {
		"alp-river@alperortac": [{ scope: "user", gitCommitSha: "9e01cbe" }],
		"posthog@claude-plugins-official": [{ gitCommitSha: "00933e7" }],
		"frontend-design@claude-plugins-official": [{}],
		"some-gitlab-plugin@claude-plugins-official": [{}],
		"ghost@claude-plugins-official": [{}], // not in the manifest → skipped
	},
};

describe("resolvePluginLinks", () => {
	const links = resolvePluginLinks(installed, marketplaces, manifests);
	const byName = (name: string) => links.find((l) => l.name === name);

	it("skips non-GitHub sources and plugins missing from the manifest", () => {
		expect(byName("some-gitlab-plugin")).toBeUndefined();
		expect(byName("ghost")).toBeUndefined();
		expect(links).toHaveLength(3);
	});

	it("resolves a single-repo marketplace ('./' source) with installed sha", () => {
		expect(byName("alp-river")).toEqual({
			type: "plugin",
			name: "alp-river",
			group: "claude-code",
			scope: "global",
			stableKey: "linked:https://github.com/alp82/alp-river:",
			upstream: {
				repoUrl: "https://github.com/alp82/alp-river",
				lastCommitSha: "9e01cbe",
			},
		});
	});

	it("resolves an object source (different upstream repo) with its own sha", () => {
		expect(byName("posthog")).toEqual({
			type: "plugin",
			name: "posthog",
			group: "claude-code",
			scope: "global",
			stableKey: "linked:https://github.com/posthog/ai-plugin:",
			upstream: {
				repoUrl: "https://github.com/posthog/ai-plugin",
				lastCommitSha: "1b743cd", // manifest sha wins over installed gitCommitSha
			},
		});
	});

	it("resolves a './subdir' source to the marketplace repo + path", () => {
		const link = byName("frontend-design");
		expect(link?.upstream).toEqual({
			repoUrl: "https://github.com/anthropics/claude-plugins-official",
			path: "plugins/frontend-design",
		});
		expect(link?.stableKey).toBe(
			"linked:https://github.com/anthropics/claude-plugins-official:plugins/frontend-design",
		);
	});
});
