/**
 * GitHub repo URL/path handling for linked resources. SINGLE source of truth:
 * `convex/lib/resourceLinks.ts` imports and re-exports these (Convex imports
 * plain TS from `src/`, as it does with `slugifyAscii`). The test table in
 * `github-repo.test.ts` is the canonical coverage for the parser.
 *
 * `upstream.repoUrl` is canonicalized to `https://github.com/owner/repo` and
 * `upstream.path` is normalized (slash-trimmed, doubles collapsed, case PRESERVED)
 * so that two owners linking the same logical (repo, path) dedup onto one row.
 */

function isGithubHost(host: string): boolean {
	const h = host.toLowerCase();
	return h === "github.com" || h === "www.github.com";
}

export function parseRepo(
	input: string,
): { owner: string; repo: string } | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	// SCP-like form `git@host:owner/repo`: take the host and the path after the
	// colon. Otherwise strip the scheme, then split the leading host off the path.
	const scpMatch = trimmed.match(/^[^@]+@([^:]+):(.+)$/);
	let host: string;
	let withoutHost: string;
	if (scpMatch) {
		host = scpMatch[1];
		withoutHost = scpMatch[2];
	} else {
		const withoutScheme = trimmed.replace(/^[a-z]+:\/\//i, "");
		const slash = withoutScheme.indexOf("/");
		if (slash === -1) return null;
		host = withoutScheme.slice(0, slash);
		withoutHost = withoutScheme.slice(slash + 1);
	}
	if (!isGithubHost(host)) return null;

	// Drop any query string or anchor, then split into path segments.
	const pathPart = withoutHost.replace(/[?#].*$/, "");
	const segments = pathPart.split("/").filter(Boolean);

	const owner = segments[0];
	const repo = segments[1]?.replace(/\.git$/, "");
	if (!owner || !repo) return null;

	return { owner: owner.toLowerCase(), repo: repo.toLowerCase() };
}

export function canonicalizeRepoUrl(input: string): string | null {
	const parsed = parseRepo(input);
	if (!parsed) return null;
	return `https://github.com/${parsed.owner}/${parsed.repo}`;
}

export function isGithubRepoUrl(input: string): boolean {
	return parseRepo(input) !== null;
}

export function normalizeUpstreamPath(path: string | undefined): string {
	if (!path) return "";
	return path.split("/").filter(Boolean).join("/");
}

export function repoNameFromCanonical(canonical: string): string {
	return parseRepo(canonical)?.repo ?? "";
}
