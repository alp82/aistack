import { type PriceTable, parsePriceTable } from "@aistack/pricing";
import { CLI_VERSION } from "./version.js";

export const BASE_URL = process.env.AISTACK_URL || "https://aistack.to";

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
 * An automatic `machineName` is a proposal that stays editable. A label the
 * user supplied as a command parameter sets `machineNameReadOnly`, so the
 * confirmation page shows the chosen value without allowing another edit.
 */
export async function authStart(
	machineName?: string,
	machineNameReadOnly = false,
): Promise<{
	secretId: string;
	userCode: string;
	authUrl: string;
}> {
	const res = await request("/api/cli/auth/start", {
		method: "POST",
		// `cliVersion` rides along so `cli_login_completed` can report which
		// version linked the machine (#78). The server carries it on the pending
		// session and reads it at the token exchange.
		body: JSON.stringify({
			...(machineName ? { machineName } : {}),
			...(machineNameReadOnly ? { machineNameReadOnly: true } : {}),
			cliVersion: CLI_VERSION,
		}),
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

/** A terminal reader's budget for one error, not a log file's. */
const MAX_DETAIL_LINES = 4;
const MAX_DETAIL_LINE = 160;
const MAX_DETAIL = 480;

/**
 * The readable part of a server error.
 *
 * A CONVEX VALIDATION ERROR CARRIES THE WHOLE OBJECT IT REFUSED. The reason and
 * the path come first and are the entire message a user can act on; after them
 * come `Object:` and `Validator:`, each holding a full dump. A real failed sync
 * printed several screens of session rows and buried the one line that said
 * what to fix. Keep the head, cut the rest, and SAY that it was cut - a message
 * silently missing its end is worse than a short one.
 */
function readableDetail(detail: string): string {
	const lines = detail.trim().split("\n");
	const kept: string[] = [];
	let cut = lines.length > MAX_DETAIL_LINES;
	for (const line of lines.slice(0, MAX_DETAIL_LINES)) {
		// A dump line is one enormous line, so the cap lands mid-object. Drop it
		// entirely rather than print 160 characters of someone's session rows.
		if (line.length > MAX_DETAIL_LINE) {
			cut = true;
			continue;
		}
		kept.push(line);
	}
	let text = kept.join("\n").trim();
	if (text.length > MAX_DETAIL) {
		text = text.slice(0, MAX_DETAIL).trimEnd();
		cut = true;
	}
	if (!text) text = lines[0]?.slice(0, MAX_DETAIL_LINE).trimEnd() ?? "";
	return cut ? `${text}\n(detail truncated)` : text;
}

async function formatHttpError(res: Response, label: string): Promise<string> {
	const prefix = `${label}: ${res.status} ${res.statusText || ""}`.trim();
	const text = await res.text().catch(() => "");
	if (!text) return prefix;
	try {
		const body = JSON.parse(text) as { error?: string; message?: string };
		const detail = body.error || body.message;
		if (detail) return `${prefix} - ${readableDetail(detail)}`;
	} catch {}
	const snippet = readableDetail(text);
	return snippet ? `${prefix} - ${snippet}` : prefix;
}

export type SyncPublishResult = {
	receivedAt: number;
	stackSlug: string;
	url: string;
	keptPrivate: { stored: number; refused: boolean };
};

/**
 * Publish one approved snapshot.
 *
 * Takes the staged body as an ALREADY-SERIALIZED string: the bytes the user
 * approved at the gate are the bytes on the wire, with no re-serialization
 * step between them (#35's binding constraint, #41).
 */
export async function syncPublish(
	token: string,
	bodyJson: string,
): Promise<SyncPublishResult> {
	const res = await request("/api/cli/sync", {
		method: "POST",
		headers: authHeaders(token),
		body: bodyJson,
	});
	if (res.status === 401)
		throw new Error(
			"Authentication expired. Run `npx @use-aistack/cli login` again.",
		);
	if (res.status === 403 || res.status === 429)
		throw failure("Sync failed", res);
	if (!res.ok) {
		throw new Error(await formatHttpError(res, "Sync failed"));
	}
	return res.json();
}

/**
 * The day manifest (#307, ADR-0010): what the server holds for this machine,
 * date by date, each with its fingerprint, plus the retention in days.
 *
 * `null` means the server has no such route (an old backend) and the caller
 * publishes its whole window. 401 throws the same sentence a publish would,
 * so the fix is the same command either way.
 */
export async function fetchDayManifest(
	baseUrl: string,
	token: string,
): Promise<{
	retentionDays: number;
	aggregateVersion: string;
	days: { date: string; fingerprint: string }[];
} | null> {
	const res = await fetch(`${baseUrl}/api/cli/sync-manifest`, {
		headers: { "Content-Type": "application/json", ...authHeaders(token) },
	});
	if (res.status === 404) return null;
	if (res.status === 401)
		throw new Error(
			"Authentication expired. Run `npx @use-aistack/cli login` again.",
		);
	if (res.status === 403 || res.status === 429)
		throw failure("Manifest fetch failed", res);
	if (!res.ok) {
		throw new Error(await formatHttpError(res, "Manifest fetch failed"));
	}
	const body = (await res.json()) as {
		retentionDays?: unknown;
		aggregateVersion?: unknown;
		days?: unknown;
	};
	const retentionDays =
		typeof body.retentionDays === "number" && body.retentionDays > 0
			? body.retentionDays
			: 400;
	const aggregateVersion =
		typeof body.aggregateVersion === "string" ? body.aggregateVersion : "";
	const days = Array.isArray(body.days)
		? body.days.flatMap((d: unknown) => {
				const row = d as { date?: unknown; fingerprint?: unknown };
				return typeof row?.date === "string" &&
					typeof row?.fingerprint === "string"
					? [{ date: row.date, fingerprint: row.fingerprint }]
					: [];
			})
		: [];
	return { retentionDays, aggregateVersion, days };
}

/**
 * The server's price table (#336): the `modelPrices` rows the CLI layers over
 * its bundled constants before pricing at ingest. Public, no bearer.
 *
 * `null` means the server has no such route (an old backend) or served a table
 * with no usable rows; the caller prices from the bundled table and says so.
 * A network failure throws and the caller treats it the same way.
 */
export async function fetchPriceTable(
	baseUrl: string,
): Promise<PriceTable | null> {
	const res = await fetch(`${baseUrl}/api/prices`, {
		headers: { Accept: "application/json" },
	});
	if (res.status === 404) return null;
	if (!res.ok) throw failure("Price table fetch failed", res);
	return parsePriceTable(await res.json());
}

export type AutoSyncSetResult = {
	autoSync: { enabled: boolean; frequencyHours: number };
	lastAutoSyncAt: number | null;
};

/**
 * Set the auto-sync permission on the stack this machine is linked to (#103).
 *
 * The destination is the stack bound to the BEARER, exactly like a publish -
 * the body says what the permission is, never whose it is. The frequency goes
 * out only when the flag goes on: off keeps no schedule, and sending a number
 * with it would overwrite the interval the owner picked for the next enable.
 */
export async function setAutoSync(
	token: string,
	flag: { enabled: boolean; frequencyHours?: number },
): Promise<AutoSyncSetResult> {
	const res = await request("/api/cli/auto-sync", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(
			flag.enabled && flag.frequencyHours !== undefined
				? { enabled: true, frequencyHours: flag.frequencyHours }
				: { enabled: flag.enabled },
		),
	});
	if (res.status === 401)
		throw new Error(
			"Authentication expired. Run `npx @use-aistack/cli login` again.",
		);
	if (res.status === 403 || res.status === 429)
		throw failure("Auto-sync update failed", res);
	if (!res.ok) {
		throw new Error(await formatHttpError(res, "Auto-sync update failed"));
	}
	return res.json();
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
