import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { type PriceTable, parsePriceTable } from "@aistack/pricing";
import { SYNC_UPLOAD_PART_BYTES } from "@aistack/workflow-rules";
import type { SyncBody } from "./harness/shared/payload.js";
import { CLI_VERSION } from "./version.js";

export const BASE_URL = process.env.AISTACK_URL || "https://aistack.to";

// Optional startup reads must reach their fallback even if the server stalls.
// Keep the deadline active while consuming the response body too.
const STARTUP_READ_TIMEOUT_MS = 5_000;

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
			`${what}: this machine is not allowed to do that. Run \`npx @use-aistack/cli@latest login\` again to re-link it.`,
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
	options: { replaceToken?: string; destinationRequired?: boolean } = {},
): Promise<{
	secretId: string;
	userCode: string;
	authUrl: string;
}> {
	const res = await request("/api/cli/auth/start", {
		method: "POST",
		...(options.replaceToken
			? { headers: authHeaders(options.replaceToken) }
			: {}),
		// `cliVersion` rides along so `cli_login_completed` can report which
		// version linked the machine (#78). The server carries it on the pending
		// session and reads it at the token exchange.
		body: JSON.stringify({
			...(machineName ? { machineName } : {}),
			...(machineNameReadOnly ? { machineNameReadOnly: true } : {}),
			cliVersion: CLI_VERSION,
			...(options.destinationRequired ? { destinationRequired: true } : {}),
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
			"Authentication expired. Run `npx @use-aistack/cli@latest login` again.",
		);
	if (!res.ok) {
		throw Object.assign(
			new Error(await formatHttpError(res, "Collect failed")),
			{ status: res.status },
		);
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
	keptPrivate: { stored: number; machineStored: number; refused: boolean };
};

/**
 * Publish one approved snapshot.
 *
 * The staged string is the approved body. Small sends use it as-is. Large
 * sends partition the approved day list and repeat the same metadata in
 * each envelope, without adding or recomputing any readings.
 */
export async function syncPublish(
	token: string,
	bodyJson: string,
): Promise<SyncPublishResult> {
	const maxBytes = SYNC_UPLOAD_PART_BYTES;
	if (Buffer.byteLength(bodyJson) <= maxBytes) return postSync(token, bodyJson);

	const body: SyncBody = JSON.parse(bodyJson);
	const wire = body.measuredDays;
	if (!wire) throw new Error("Sync metadata exceeds the 8 MiB upload limit.");
	const base = { ...body, measuredDays: { ...wire, days: [] } };
	const uploadId = createHash("sha256").update(bodyJson).digest("hex");
	// Reserve the exact envelope plus room for the decimal part numbers.
	const envelopeBytes = Buffer.byteLength(
		JSON.stringify({
			...base,
			upload: { id: uploadId, part: 400, parts: 400 },
		}),
	);
	const endIndexes: number[] = [];
	let bytes = envelopeBytes;
	for (const [index, day] of wire.days.entries()) {
		const dayBytes = Buffer.byteLength(JSON.stringify(day)) + 1;
		if (envelopeBytes + dayBytes > maxBytes) {
			throw new Error(
				`Measured day ${day.date} exceeds the 8 MiB upload limit with sync metadata.`,
			);
		}
		if (bytes + dayBytes > maxBytes) {
			endIndexes.push(index);
			bytes = envelopeBytes;
		}
		bytes += dayBytes;
	}
	endIndexes.push(wire.days.length);
	if (endIndexes.length < 2) return postSync(token, bodyJson);
	const manifest = await fetchDayManifest(BASE_URL, token);
	if (manifest?.multipartUpload !== true) {
		throw new Error(
			"This server does not support multipart sync. Update the backend and run sync again.",
		);
	}
	let result: SyncPublishResult | undefined;
	let start = 0;
	for (const [part, end] of endIndexes.entries()) {
		result = await postSync(
			token,
			JSON.stringify({
				...base,
				measuredDays: { ...wire, days: wire.days.slice(start, end) },
				upload: { id: uploadId, part, parts: endIndexes.length },
			}),
			true,
		);
		start = end;
	}
	if (!result) throw new Error("Sync upload had no parts.");
	return result;
}

async function postSync(
	token: string,
	bodyJson: string,
	retryTransport = false,
): Promise<SyncPublishResult> {
	const send = () =>
		request("/api/cli/sync", {
			method: "POST",
			headers: authHeaders(token),
			body: bodyJson,
		});
	let replaySupported = retryTransport;
	for (let attempt = 0; ; attempt++) {
		let delay = 250 * 2 ** attempt;
		let ambiguous: unknown;
		const res = await send().catch((error: unknown) => {
			ambiguous = error;
			return undefined;
		});
		if (res?.ok) {
			try {
				const receipt: SyncPublishResult = await res.json();
				if (!receipt || !Number.isFinite(receipt.receivedAt)) {
					throw new Error("Sync response was missing its completion receipt.");
				}
				return receipt;
			} catch (error) {
				ambiguous = error;
			}
		} else if (res?.status === 401) {
			throw new Error(
				"Authentication expired. Run `npx @use-aistack/cli@latest login` again.",
			);
		} else if (res?.status === 403 || res?.status === 429) {
			throw failure("Sync failed", res);
		} else if (res) {
			const error = Object.assign(
				new Error(await formatHttpError(res, "Sync failed")),
				{
					status: res.status,
				},
			);
			if (![500, 502, 503, 504].includes(res.status)) throw error;
			ambiguous = error;
			const seconds = Number(res.headers.get("Retry-After"));
			if (seconds > 0) delay = Math.max(delay, Math.min(seconds * 1000, 5000));
		}
		if (attempt >= 3) throw ambiguous;
		if (!replaySupported) {
			const manifest = await fetchDayManifest(BASE_URL, token).catch(
				() => null,
			);
			if (manifest?.syncReplay !== true) throw ambiguous;
			replaySupported = true;
		}
		await new Promise((resolve) => setTimeout(resolve, delay));
	}
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
	multipartUpload?: boolean;
	syncReplay?: boolean;
	days: { date: string; fingerprint: string }[];
} | null> {
	const res = await fetch(`${baseUrl}/api/cli/sync-manifest`, {
		signal: AbortSignal.timeout(STARTUP_READ_TIMEOUT_MS),
		headers: { "Content-Type": "application/json", ...authHeaders(token) },
	});
	if (res.status === 404) return null;
	if (res.status === 401)
		throw new Error(
			"Authentication expired. Run `npx @use-aistack/cli@latest login` again.",
		);
	if (res.status === 403 || res.status === 429)
		throw failure("Manifest fetch failed", res);
	if (!res.ok) {
		throw Object.assign(
			new Error(await formatHttpError(res, "Manifest fetch failed")),
			{ status: res.status },
		);
	}
	const body = (await res.json()) as {
		retentionDays?: unknown;
		aggregateVersion?: unknown;
		multipartUpload?: unknown;
		syncReplay?: unknown;
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
	return {
		retentionDays,
		aggregateVersion,
		days,
		...(body.multipartUpload === true ? { multipartUpload: true } : {}),
		...(body.syncReplay === true ? { syncReplay: true } : {}),
	};
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
		signal: AbortSignal.timeout(STARTUP_READ_TIMEOUT_MS),
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
			"Authentication expired. Run `npx @use-aistack/cli@latest login` again.",
		);
	if (res.status === 403 || res.status === 429)
		throw failure("Auto-sync update failed", res);
	if (!res.ok) {
		throw Object.assign(
			new Error(await formatHttpError(res, "Auto-sync update failed")),
			{ status: res.status },
		);
	}
	return res.json();
}

export async function stackGet(token: string): Promise<StackData | null> {
	const res = await request("/api/cli/stacks", {
		headers: authHeaders(token),
	});
	if (res.status === 401)
		throw new Error(
			"Authentication expired. Run `npx @use-aistack/cli@latest login` again.",
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
