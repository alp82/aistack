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

export async function authStart(): Promise<{
	secretId: string;
	userCode: string;
	authUrl: string;
}> {
	const res = await request("/api/cli/auth/start", { method: "POST" });
	if (!res.ok) throw new Error(`Auth start failed: ${res.status}`);
	return res.json();
}

export async function authPoll(
	secretId: string,
): Promise<{ status: string; token?: string; userId?: string }> {
	const res = await request(
		`/api/cli/auth/poll?secretId=${encodeURIComponent(secretId)}`,
	);
	if (!res.ok) throw new Error(`Auth poll failed: ${res.status}`);
	return res.json();
}

export async function projectsCheck(
	token: string,
	name: string,
): Promise<{ exists: boolean; slug?: string }> {
	const res = await request(
		`/api/cli/projects/check?name=${encodeURIComponent(name)}`,
		{
			headers: authHeaders(token),
		},
	);
	if (res.status === 401)
		throw new Error("Authentication expired. Run `aistack login` again.");
	if (!res.ok) throw new Error(`Project check failed: ${res.status}`);
	return res.json();
}

export async function projectsCollect(
	token: string,
	data: { name: string; instructions: InstructionItem[] },
): Promise<{ slug: string; shortId: string; url: string }> {
	const res = await request("/api/cli/projects/collect", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(data),
	});
	if (res.status === 401)
		throw new Error("Authentication expired. Run `aistack login` again.");
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(
			(body as { error?: string }).error || `Collect failed: ${res.status}`,
		);
	}
	return res.json();
}

export async function projectGet(shortId: string): Promise<ProjectData | null> {
	const res = await request(`/api/cli/projects/${encodeURIComponent(shortId)}`);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Project fetch failed: ${res.status}`);
	return res.json();
}

// Types used across the CLI
export interface InstructionFile {
	name: string;
	content: string;
	path?: string;
	tags?: string[];
}

export interface InstructionItem {
	type: string;
	name: string;
	description?: string;
	group: string;
	scope?: "global" | "project";
	stableKey: string;
	files: InstructionFile[];
}

export interface ProjectData {
	name: string;
	slug: string;
	shortId: string;
	instructions: InstructionItem[];
	creator?: { name: string };
	stack?: { name: string; slug: string };
}
