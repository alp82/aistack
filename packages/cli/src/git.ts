import { execFileSync } from "node:child_process";
import type { Resource } from "./api.js";
import {
	canonicalizeRepoUrl,
	normalizeUpstreamPath,
	repoNameFromCanonical,
} from "./github-repo.js";

/**
 * Returns the raw `origin` remote URL for a working directory, or null when it
 * can't be determined. Injectable so `detectRepoUrl` stays unit-testable
 * without spawning git.
 */
export type GitRemoteRunner = (cwd: string) => string | null;

export const defaultGitRemoteRunner: GitRemoteRunner = (cwd) => {
	try {
		// argv form (no shell) - git walks up to the repo root itself, and
		// stderr is swallowed so "not a git repository" never leaks into the
		// CLI's output. git missing / no repo / no origin all throw → null.
		return execFileSync("git", ["-C", cwd, "remote", "get-url", "origin"], {
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return null;
	}
};

/**
 * Detect the canonical GitHub repo URL for `cwd`, or null. Non-GitHub origins
 * (GitLab, Bitbucket, …) canonicalize to null, so this is a graceful no-op
 * outside of GitHub repos.
 */
export function detectRepoUrl(
	cwd: string,
	run: GitRemoteRunner = defaultGitRemoteRunner,
): string | null {
	const raw = run(cwd);
	if (!raw) return null;
	return canonicalizeRepoUrl(raw);
}

export interface LinkSpec {
	/** Canonical GitHub URL (https://github.com/owner/repo). */
	canonical: string;
	/** Optional subpath within the repo. */
	path?: string;
	name: string;
	type: string;
	group: string;
	/** Optional pinned commit, stored as upstream.lastCommitSha. */
	sha?: string;
}

/**
 * Build a linked-resource payload. Mirrors the web `linkResource` mutation: no
 * files (upstream presence is the storage discriminator) and the exact
 * `linked:${canonical}:${normPath}` stableKey so the web unlink UI - which
 * matches by stableKey - recognizes it. `path`/`lastCommitSha` are omitted when
 * empty so the by_upstream dedup index matches at both write and query.
 */
export function buildLinkResource(spec: LinkSpec): Resource {
	const normPath = normalizeUpstreamPath(spec.path);
	return {
		type: spec.type,
		name: spec.name,
		group: spec.group,
		stableKey: `linked:${spec.canonical}:${normPath}`,
		upstream: {
			repoUrl: spec.canonical,
			...(normPath ? { path: normPath } : {}),
			...(spec.sha ? { lastCommitSha: spec.sha } : {}),
		},
	};
}

/** The repo this project lives in: a GitHub link (stack-owned server-side). */
export function buildRepoLinkResource(canonical: string): Resource {
	return buildLinkResource({
		canonical,
		name: repoNameFromCanonical(canonical),
		type: "custom",
		group: "generic",
	});
}
