import type { Message, Session } from "cursor-history";
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
export type LocalSession = {
	session: Session;
	/** Keyed raw token scalars only. The reader's flattened pair loses zero/presence. */
	tokens: Map<string, TokenEvidence>;
};

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
	session: Session,
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
	let pending: Message | undefined;
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
				(pending ? Math.ceil(pending.content.length / 4) : undefined),
			inputSource: input.inputSource ?? (pending ? "text" : undefined),
			output: own.output ?? Math.ceil(message.content.length / 4),
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
