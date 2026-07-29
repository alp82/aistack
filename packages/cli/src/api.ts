const BASE_URL = process.env.AISTACK_URL || "https://aistack.to";

async function request(
	path: string,
	options: RequestInit = {},
): Promise<Response> {
	return fetch(`${BASE_URL}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	});
}

function authHeaders(token: string): HeadersInit {
	return { Authorization: `Bearer ${token}` };
}

/**
 * Turn the two statuses #52 introduced into sentences.
 *
 * A bare `429` tells the user nothing they can act on, and a bare `403` reads
 * like a bug rather than a machine that is no longer allowed to do this. Every
 * other status keeps its number, because the number is all we know about it.
 */
function failure(what: string, res: Response): Error {
	if (res.status === 429) {
		const retry = res.headers.get("Retry-After");
		return new Error(
			retry
				? `${what}: too many requests. Try again in ${retry} seconds.`
				: `${what}: too many requests. Try again in a minute.`,
		);
	}
	if (res.status === 403) {
		return new Error(
			`${what}: this machine is not allowed to do that. Run \`aistack login\` again to re-link it.`,
		);
	}
	return new Error(`${what}: ${res.status}`);
}

/**
 * Open a device-code session.
 *
 * `machineName` is a PROPOSAL, not a fact: the approval page renders it in an
 * editable field, so the user sees the string before it is stored and can
 * overwrite or clear it. That is why the hostname may be sent automatically —
 * the consent happens in the browser, a moment later, with the string on screen.
 */
export async function authStart(machineName?: string): Promise<{
	secretId: string;
	userCode: string;
	authUrl: string;
}> {
	const res = await request("/api/cli/auth/start", {
		method: "POST",
		body: JSON.stringify(machineName ? { machineName } : {}),
	});
	if (!res.ok) throw failure("Auth start failed", res);
	return res.json();
}

export async function authPoll(
	secretId: string,
): Promise<{ status: string; token?: string; userId?: string }> {
	const res = await request(
		`/api/cli/auth/poll?secretId=${encodeURIComponent(secretId)}`,
	);
	if (!res.ok) throw failure("Auth poll failed", res);
	return res.json();
}

export async function stackCollect(
	token: string,
	data: { resources: Resource[] },
): Promise<{ slug: string; shortId: string; url: string }> {
	const res = await request("/api/cli/stacks/collect", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(data),
	});
	if (res.status === 401)
		throw new Error(
			"Authentication expired. Run `npx @use-aistack/cli login` again.",
		);
	if (!res.ok) {
		throw new Error(await formatHttpError(res, "Collect failed"));
	}
	return res.json();
}

async function formatHttpError(res: Response, label: string): Promise<string> {
	const prefix = `${label}: ${res.status} ${res.statusText || ""}`.trim();
	const text = await res.text().catch(() => "");
	if (!text) return prefix;
	try {
		const body = JSON.parse(text) as { error?: string; message?: string };
		const detail = body.error || body.message;
		if (detail) return `${prefix} — ${detail}`;
	} catch {}
	const snippet = text.trim().slice(0, 500);
	return snippet ? `${prefix} — ${snippet}` : prefix;
}

export async function stackGet(token: string): Promise<StackData | null> {
	const res = await request("/api/cli/stacks", {
		headers: authHeaders(token),
	});
	if (res.status === 401)
		throw new Error(
			"Authentication expired. Run `npx @use-aistack/cli login` again.",
		);
	if (res.status === 404) return null;
	if (!res.ok) throw failure("Stack fetch failed", res);
	return res.json();
}

// Types used across the CLI
export interface ResourceFile {
	name: string;
	content: string;
	path?: string;
	tags?: string[];
}

export interface Resource {
	type: string;
	name: string;
	description?: string;
	group: string;
	stableKey: string;
	files?: ResourceFile[];
	upstream?: {
		repoUrl: string;
		path?: string;
		license?: string;
		stars?: number;
		lastCommitSha?: string;
		lastSyncAt?: number;
	};
	pkg?: {
		registry: "npm" | "pypi" | "oci" | "url";
		id: string;
		version?: string;
		transport?: "stdio" | "http" | "sse";
	};
}

export interface StackData {
	name: string;
	slug: string;
	shortId: string;
	resources: Resource[];
}
