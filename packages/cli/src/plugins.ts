import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Resource } from "./api.js";
import { buildLinkResource } from "./git.js";
import { canonicalizeRepoUrl } from "./github-repo.js";

/**
 * Detect installed Claude Code plugins from the on-disk registry and resolve
 * each to a GitHub link pointing at its TRUE upstream source (not the
 * aggregator marketplace), attached at stack scope (the user's toolchain).
 *
 * Registry shape (~/.claude/plugins/):
 *   installed_plugins.json  → { plugins: { "<name>@<marketplace>": [{ gitCommitSha, version, ... }] } }
 *   known_marketplaces.json → { "<marketplace>": { source: { repo }, installLocation } }
 *   <installLocation>/.claude-plugin/marketplace.json → { plugins: [{ name, source, ... }] }
 */

interface InstalledEntry {
	scope?: string;
	version?: string;
	gitCommitSha?: string;
}

export interface InstalledPlugins {
	plugins?: Record<string, InstalledEntry[]>;
}

export interface KnownMarketplace {
	source?: { source?: string; repo?: string; url?: string };
	installLocation?: string;
}

export type KnownMarketplaces = Record<string, KnownMarketplace>;

/** A plugin's source in marketplace.json — polymorphic. */
type PluginSource =
	| string
	| {
			source?: string;
			url?: string;
			path?: string;
			ref?: string;
			sha?: string;
	  };

interface ManifestPlugin {
	name: string;
	source?: PluginSource;
	repository?: string;
	homepage?: string;
}

export interface Manifest {
	plugins?: ManifestPlugin[];
}

function marketplaceRepoUrl(mp: KnownMarketplace | undefined): string | null {
	const src = mp?.source;
	if (!src) return null;
	if (src.repo) return `https://github.com/${src.repo}`;
	return src.url ?? null;
}

/** Resolve a plugin entry's source to a repo URL (+ optional subpath / sha). */
function resolveSource(
	entry: ManifestPlugin,
	mpRepoUrl: string | null,
): { url: string; path?: string; sha?: string } | null {
	const src = entry.source;
	if (typeof src === "string") {
		if (!mpRepoUrl) return null;
		const path = src.replace(/^\.\//, "").replace(/\/+$/, "");
		return { url: mpRepoUrl, path: path || undefined };
	}
	if (src && typeof src === "object" && src.url) {
		return { url: src.url, path: src.path, sha: src.sha };
	}
	const fallback = entry.repository ?? entry.homepage ?? mpRepoUrl;
	return fallback ? { url: fallback } : null;
}

/** Pure: map the parsed registry + manifests to plugin link resources. */
export function resolvePluginLinks(
	installed: InstalledPlugins,
	marketplaces: KnownMarketplaces,
	manifests: Record<string, Manifest>,
): Resource[] {
	const out: Resource[] = [];
	for (const [key, entries] of Object.entries(installed.plugins ?? {})) {
		const at = key.lastIndexOf("@");
		if (at <= 0) continue;
		const pluginName = key.slice(0, at);
		const marketplace = key.slice(at + 1);

		const mpRepoUrl = marketplaceRepoUrl(marketplaces[marketplace]);
		const entry = manifests[marketplace]?.plugins?.find(
			(p) => p.name === pluginName,
		);
		if (!entry) continue;

		const resolved = resolveSource(entry, mpRepoUrl);
		if (!resolved) continue;

		const canonical = canonicalizeRepoUrl(resolved.url);
		if (!canonical) continue; // non-GitHub source → skip (graceful)

		out.push(
			buildLinkResource({
				canonical,
				path: resolved.path,
				name: pluginName,
				type: "plugin",
				group: "claude-code",
				scope: "global",
				sha: resolved.sha ?? entries[0]?.gitCommitSha,
			}),
		);
	}
	return out;
}

function readJson<T>(path: string): T | null {
	try {
		if (!existsSync(path)) return null;
		return JSON.parse(readFileSync(path, "utf-8")) as T;
	} catch {
		return null;
	}
}

/** IO wrapper: read the registry + manifests, return plugin link resources. */
export function detectInstalledPlugins(
	pluginsDir: string = join(homedir(), ".claude", "plugins"),
): Resource[] {
	const installed = readJson<InstalledPlugins>(
		join(pluginsDir, "installed_plugins.json"),
	);
	if (!installed?.plugins) return [];

	const marketplaces =
		readJson<KnownMarketplaces>(join(pluginsDir, "known_marketplaces.json")) ??
		{};

	const manifests: Record<string, Manifest> = {};
	for (const key of Object.keys(installed.plugins)) {
		const mp = key.slice(key.lastIndexOf("@") + 1);
		if (!mp || manifests[mp]) continue;
		const installLocation =
			marketplaces[mp]?.installLocation ?? join(pluginsDir, "marketplaces", mp);
		const manifest = readJson<Manifest>(
			join(installLocation, ".claude-plugin", "marketplace.json"),
		);
		if (manifest) manifests[mp] = manifest;
	}

	return resolvePluginLinks(installed, marketplaces, manifests);
}
