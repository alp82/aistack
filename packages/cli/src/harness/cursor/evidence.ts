import type { Message, Session, ToolCall } from "cursor-history";
import { asObj, asStr } from "../shared/aggregate.js";

export type Buckets = {
	input?: number;
	output?: number;
	cacheRead?: number;
	cacheWrite?: number;
};
export type TokenEvidence = Buckets & {
	inputSource?: "reported" | "context" | "dry-run" | "text";
	outputSource?: "reported" | "text";
};
export type Contribution = {
	session: string;
	id?: string;
	nativeId?: string;
	tsMs: number;
	model: string;
	buckets: TokenEvidence;
	source: "api" | "local";
	sidechain?: boolean;
};
/**
 * The fields of a tool call the scan reads: its identity, its name, and the
 * few params that name a command, a skill or a subagent. Never the result.
 */
export type LocalToolCall = Pick<
	ToolCall,
	"id" | "identityOrigin" | "name" | "params"
>;
/**
 * A message with its text replaced by its length. The scan estimates tokens
 * from the length when a bubble reports none, and reads nothing else from the
 * text (thinking, tool results, raw bubbles are dropped at the read).
 */
export type LocalMessage = Pick<
	Message,
	| "id"
	| "identityOrigin"
	| "parentMessageId"
	| "isSidechain"
	| "role"
	| "timestamp"
	| "timestampSource"
	| "model"
> & {
	contentLength: number;
	toolCalls?: LocalToolCall[];
	metadata?: { corrupted?: boolean };
};
/** The session fields the scan reads, with slim messages. */
export type LocalSessionData = Pick<
	Session,
	| "id"
	| "timestamp"
	| "createdAtSource"
	| "lastUpdatedAtSource"
	| "resolutionState"
	| "canonicalWorkspacePath"
	| "metadata"
> & { messages: LocalMessage[] };
export type LocalSession = {
	session: LocalSessionData;
	/** Keyed raw token scalars only. The reader's flattened pair loses zero/presence. */
	tokens: Map<string, TokenEvidence>;
};

/** The params the workflow reducer reads off a tool call (workflow.ts). */
const TOOL_PARAM_KEYS = ["command", "cmd", "skill", "subagent_type"] as const;

/**
 * Keep what the scan reads and drop the rest, at the read. A cursor-history
 * session carries every message's text, thinking and tool results, and a
 * `write_file` call's params carry the whole file. Held for 721 sessions, one
 * of them 77k messages, that is several gigabytes: the worker ran out of heap
 * and the inline retry took the process down with it (#449). Nothing after the
 * read touches the dropped fields.
 */
export function slimSession(session: Session): LocalSessionData {
	const messages: LocalMessage[] = session.messages.map((message) => {
		const slim: LocalMessage = {
			role: message.role,
			contentLength: message.content?.length ?? 0,
			timestamp: message.timestamp,
		};
		if (message.id !== undefined) slim.id = message.id;
		if (message.identityOrigin !== undefined)
			slim.identityOrigin = message.identityOrigin;
		if (message.parentMessageId !== undefined)
			slim.parentMessageId = message.parentMessageId;
		if (message.isSidechain !== undefined)
			slim.isSidechain = message.isSidechain;
		if (message.timestampSource !== undefined)
			slim.timestampSource = message.timestampSource;
		if (message.model !== undefined) slim.model = message.model;
		if (message.metadata?.corrupted !== undefined)
			slim.metadata = { corrupted: message.metadata.corrupted };
		if (message.toolCalls)
			slim.toolCalls = message.toolCalls.map((call) => {
				const out: LocalToolCall = { name: call.name };
				if (call.id !== undefined) out.id = call.id;
				if (call.identityOrigin !== undefined)
					out.identityOrigin = call.identityOrigin;
				if (call.params)
					for (const key of TOOL_PARAM_KEYS) {
						const value = call.params[key];
						if (typeof value !== "string") continue;
						out.params ??= {};
						out.params[key] = value;
					}
				return out;
			});
		return slim;
	});
	const out: LocalSessionData = {
		id: session.id,
		timestamp: session.timestamp,
		messages,
	};
	if (session.createdAtSource !== undefined)
		out.createdAtSource = session.createdAtSource;
	if (session.lastUpdatedAtSource !== undefined)
		out.lastUpdatedAtSource = session.lastUpdatedAtSource;
	if (session.resolutionState !== undefined)
		out.resolutionState = session.resolutionState;
	if (session.canonicalWorkspacePath !== undefined)
		out.canonicalWorkspacePath = session.canonicalWorkspacePath;
	if (session.metadata) {
		out.metadata = {};
		if (session.metadata.cursorVersion !== undefined)
			out.metadata.cursorVersion = session.metadata.cursorVersion;
		if (session.metadata.lastModified !== undefined)
			out.metadata.lastModified = session.metadata.lastModified;
	}
	return out;
}

export function timestamp(value: unknown): number | null {
	const n =
		typeof value === "number"
			? value
			: typeof value === "string"
				? /^\d+$/.test(value)
					? Number(value)
					: Date.parse(value)
				: NaN;
	return Number.isFinite(n) && n > 0 && n < 8.64e15 ? n : null;
}
export function count(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

/** Direct buckets win individually, including explicit zero. No cents conversion. */
export function tokenEvidence(value: unknown): TokenEvidence {
	const raw = asObj(value) ?? {};
	const direct = asObj(raw.tokenCount);
	const usage = asObj(raw.usage);
	for (const [obj, fields] of [
		[
			direct,
			["inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens"],
		],
		[
			usage,
			[
				"input_tokens",
				"output_tokens",
				"cache_read_input_tokens",
				"cache_creation_input_tokens",
			],
		],
	] as const) {
		for (const field of fields)
			if (obj?.[field] != null && count(obj[field]) === undefined)
				throw new Error("Invalid Cursor token evidence");
	}
	const out: TokenEvidence = {};
	out.input = count(direct?.inputTokens) ?? count(usage?.input_tokens);
	out.output = count(direct?.outputTokens) ?? count(usage?.output_tokens);
	out.cacheRead =
		count(direct?.cacheReadTokens) ?? count(usage?.cache_read_input_tokens);
	out.cacheWrite =
		count(direct?.cacheWriteTokens) ??
		count(usage?.cache_creation_input_tokens);
	if (out.input !== undefined) out.inputSource = "reported";
	if (out.output !== undefined) out.outputSource = "reported";
	if (out.input === undefined) {
		const context = count(asObj(raw.contextWindowStatusAtCreation)?.tokensUsed);
		if (context !== undefined) {
			out.input = context;
			out.inputSource = "context";
		} else if (typeof raw.promptDryRunInfo === "string") {
			try {
				const dry = asObj(JSON.parse(raw.promptDryRunInfo));
				const estimate =
					count(asObj(dry?.fullConversationTokenCount)?.numTokens) ??
					count(asObj(dry?.userMessageTokenCount)?.numTokens);
				if (estimate !== undefined) {
					out.input = estimate;
					out.inputSource = "dry-run";
				}
			} catch {
				/* optional estimate */
			}
		}
	}
	return out;
}

const directTimes = new Set([
	"composer-created-at",
	"composer-timing",
	"store-turn-timing",
]);
/** Interpolate only date attribution. This does not establish call latency. */
export function messageTimes(
	session: LocalSessionData,
	api: Contribution[] = [],
): Array<number | null> {
	const times = session.messages.map((m) =>
		directTimes.has(m.timestampSource ?? "") ? timestamp(m.timestamp) : null,
	);
	const anchors: Array<{ index: number; time: number }> = [];
	for (const [index, time] of times.entries())
		if (time !== null) anchors.push({ index, time });
	const start =
		session.createdAtSource !== "epoch-unknown"
			? timestamp(session.timestamp)
			: null;
	const end =
		session.lastUpdatedAtSource !== "epoch-unknown"
			? timestamp(session.metadata?.lastModified)
			: null;
	const apiTimes = api
		.filter((e) => e.session === session.id)
		.map((e) => e.tsMs);
	if (!anchors.some((a) => a.index === 0)) {
		const time = start ?? (apiTimes.length ? Math.min(...apiTimes) : null);
		if (time !== null) anchors.unshift({ index: -1, time });
	}
	const last = session.messages.length;
	if (last && !anchors.some((a) => a.index === last - 1)) {
		const time = end ?? (apiTimes.length ? Math.max(...apiTimes) : null);
		if (time !== null) anchors.push({ index: last, time });
	}
	for (let i = 0; i < times.length; i++) {
		if (times[i] !== null) continue;
		const before = anchors.filter((a) => a.index < i).at(-1);
		const after = anchors.find((a) => a.index > i);
		if (before && after && after.time >= before.time)
			times[i] = Math.round(
				before.time +
					((after.time - before.time) * (i - before.index)) /
						(after.index - before.index),
			);
		else times[i] = before?.time ?? after?.time ?? null;
	}
	return times;
}

export function localContributions(
	local: LocalSession,
	api: Contribution[] = [],
): Contribution[] {
	const { session, tokens } = local;
	const times = messageTimes(session, api);
	const out: Contribution[] = [];
	let pending: LocalMessage | undefined;
	const seen = new Set<string>();
	for (const [i, message] of session.messages.entries()) {
		if (message.id && seen.has(message.id)) continue;
		if (message.id) seen.add(message.id);
		if (message.role === "user") {
			pending = message;
			continue;
		}
		const own = tokens.get(message.id ?? "") ?? {};
		const user = tokens.get(pending?.id ?? "") ?? {};
		const input = own.input !== undefined ? own : user;
		const buckets: TokenEvidence = {
			...own,
			input:
				input.input ??
				(pending ? Math.ceil(pending.contentLength / 4) : undefined),
			inputSource: input.inputSource ?? (pending ? "text" : undefined),
			output: own.output ?? Math.ceil(message.contentLength / 4),
			outputSource: own.outputSource ?? "text",
		};
		pending = undefined;
		const tsMs = times[i];
		if (tsMs === null) continue;
		out.push({
			session: session.id,
			...(message.id ? { id: message.id } : {}),
			...(message.identityOrigin === "composer-native" && message.id
				? { nativeId: message.id }
				: {}),
			tsMs,
			model: asStr(message.model) ?? "unknown",
			buckets,
			source: "local",
			...(message.isSidechain ? { sidechain: true } : {}),
		});
	}
	return out;
}

/** API events without a response join supersede the conversation's UTC-day total. */
export function reconcile(
	local: Contribution[],
	api: Contribution[],
): Contribution[] {
	const grain = (c: Contribution) =>
		`${c.session}\0${new Date(c.tsMs).toISOString().slice(0, 10)}`;
	const reported = api.filter((row) =>
		Object.values(row.buckets).some((value) => typeof value === "number"),
	);
	const grains = new Set(reported.map(grain));
	return [...local.filter((c) => !grains.has(grain(c))), ...reported];
}
