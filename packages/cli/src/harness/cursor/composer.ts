// The direct Composer read (#452). cursor-history's `getSession` is the slow
// half of a Cursor read on a large database: for a session that also has a
// Store transcript it aligns the two copies message by message (an LCS over
// every pair), which is quadratic in the session length. One 77k-message
// session took 55 s. The scan reads a handful of fields off each bubble, and
// the bubbles of one session are one key range in the global database, so
// this module reads that range itself and projects the same fields
// cursor-history would, without the transcript half. Sessions with no
// Composer half still go through cursor-history (see local.ts).

import type { ResolvedSessionSummary, SessionSummary } from "cursor-history";
import { asObj, asStr } from "../shared/aggregate.js";
import {
	type LocalMessage,
	type LocalSession,
	type LocalSessionData,
	type LocalToolCall,
	type TokenEvidence,
	tokenEvidence,
} from "./evidence.js";

type Statement = import("node:sqlite").StatementSync;
export type ComposerDb = {
	/** The bubble rows of one session, in insertion order: `(lowKey, highKey)`. */
	bubbles: Statement;
	/** The stored creation and update moments of one session: `(composerData:<id>)`. */
	composer: Statement;
	/** Older Composer headers with inline bubbles: `(composerData:<id>)`. */
	header: Statement;
};

/** cursor-history's floor for a stored Unix-millisecond time (Sep 9, 2001). */
const MIN_VALID_UNIX_MS = 1_000_000_000_000;
export const UNKNOWN_TIMESTAMP_EPOCH_MS = 0;
const TOOL_PARAM_KEYS = ["command", "cmd", "skill", "subagent_type"] as const;

/** A stored date: ISO text, epoch milliseconds, or epoch milliseconds as digits. */
function storedDate(value: unknown): number | null {
	if (typeof value !== "string" && typeof value !== "number") return null;
	const normalized =
		typeof value === "string" && /^\d+$/.test(value.trim())
			? Number(value.trim())
			: value;
	const ms = new Date(normalized).getTime();
	return Number.isFinite(ms) ? ms : null;
}

/**
 * The directly stored moment of one bubble, in cursor-history's priority:
 * `createdAt`, then the timing fields of the old format. Null means the
 * moment is inferred from the neighbours.
 */
function bubbleTime(
	data: Record<string, unknown>,
): { ms: number; source: LocalMessage["timestampSource"] } | null {
	if (data.createdAt) {
		const ms = new Date(data.createdAt as string).getTime();
		return { ms, source: "composer-created-at" };
	}
	const timing = asObj(data.timingInfo);
	if (!timing) return null;
	for (const field of [
		"clientRpcSendTime",
		"clientSettleTime",
		"clientEndTime",
	]) {
		const value = timing[field];
		if (typeof value === "number" && value > MIN_VALID_UNIX_MS)
			return { ms: value, source: "composer-timing" };
	}
	return null;
}

/** The text the bubble shows: its text field and its code blocks. */
function contentLength(data: Record<string, unknown>): number {
	let length = 0;
	for (const key of ["text", "content", "finalText", "message", "markdown"]) {
		const value = data[key];
		if (typeof value === "string" && value.trim().length > 0) {
			length = value.length;
			break;
		}
	}
	if (Array.isArray(data.codeBlocks))
		for (const block of data.codeBlocks) {
			const content = asObj(block)?.content;
			if (typeof content === "string") length += content.length;
		}
	return length;
}

function toolCall(data: Record<string, unknown>): LocalToolCall | undefined {
	const tool = asObj(data.toolFormerData);
	const name = typeof tool?.name === "string" ? tool.name.trim() : "";
	if (!name) return undefined;
	const call: LocalToolCall = { name };
	const raw = tool?.params ?? tool?.rawArgs;
	if (typeof raw === "string" && raw.trim().length > 0) {
		let params: Record<string, unknown> | undefined;
		try {
			params = asObj(JSON.parse(raw)) ?? undefined;
		} catch {
			/* an unparseable payload carries no argument the reducer reads */
		}
		if (params)
			for (const key of TOOL_PARAM_KEYS) {
				const value = params[key];
				if (typeof value !== "string") continue;
				call.params ??= {};
				call.params[key] = value;
			}
	}
	return call;
}

type Direct = { ms: number; source: LocalMessage["timestampSource"] } | null;
const isValid = (ms: number | null | undefined): ms is number =>
	typeof ms === "number" && Number.isFinite(ms);

/**
 * cursor-history's message time resolution: a direct time stays, a gap takes
 * the next direct time, then the previous one, then the session's creation
 * time, then epoch zero marked unknown.
 */
function resolveTimes(
	direct: Direct[],
	sessionCreatedMs: number | null,
): Array<{
	ms: number;
	source: NonNullable<LocalMessage["timestampSource"]>;
}> {
	const out = direct.map((d) =>
		d && isValid(d.ms) && d.source ? { ms: d.ms, source: d.source } : undefined,
	);
	let next: number | undefined;
	for (let i = out.length - 1; i >= 0; i--) {
		const d = out[i];
		if (d) {
			next = d.ms;
			continue;
		}
		if (next !== undefined) out[i] = { ms: next, source: "inferred-next" };
	}
	let previous: number | undefined;
	for (let i = 0; i < out.length; i++) {
		const d = out[i];
		if (d && d.source !== "inferred-next") {
			previous = d.ms;
			continue;
		}
		if (d) continue;
		if (previous !== undefined)
			out[i] = { ms: previous, source: "inferred-previous" };
		else if (sessionCreatedMs !== null)
			out[i] = { ms: sessionCreatedMs, source: "session-fallback" };
		else out[i] = { ms: UNKNOWN_TIMESTAMP_EPOCH_MS, source: "unknown" };
	}
	return out as Array<{
		ms: number;
		source: NonNullable<LocalMessage["timestampSource"]>;
	}>;
}

/**
 * The Composer half of one session, projected the way the scan reads it.
 * Null when the global database holds no bubble under the summary's id; the
 * caller then reads through cursor-history, which knows the other spellings
 * and the Store stack.
 */
export function readComposerSession(
	db: ComposerDb,
	summary: ResolvedSessionSummary,
	signal?: AbortSignal,
): LocalSession | null {
	const id = summary.id;
	const tokens = new Map<string, TokenEvidence>();
	const messages: LocalMessage[] = [];
	const direct: Direct[] = [];
	for (const row of db.bubbles.iterate(`bubbleId:${id}:`, `bubbleId:${id};`)) {
		signal?.throwIfAborted();
		const key = String(row.key);
		const fallbackId = key.slice(`bubbleId:${id}:`.length);
		let data: Record<string, unknown> | null = null;
		if (typeof row.value === "string") {
			try {
				data = asObj(JSON.parse(row.value));
			} catch {
				data = null;
			}
		}
		if (!data) {
			// cursor-history's placeholder for a row it cannot decode.
			messages.push({
				id: fallbackId,
				identityOrigin: "composer-native",
				role: "assistant",
				contentLength: "[corrupted message]".length,
				timestamp: "",
				metadata: { corrupted: true },
			});
			direct.push(null);
			continue;
		}
		const bubbleId = asStr(data.bubbleId);
		const message: LocalMessage = {
			id: bubbleId ?? fallbackId,
			identityOrigin: "composer-native",
			role: data.type === 2 ? "assistant" : "user",
			contentLength: contentLength(data),
			timestamp: "",
		};
		const model = asStr(asObj(data.modelInfo)?.modelName);
		if (model?.trim()) message.model = model;
		const call = toolCall(data);
		if (call) message.toolCalls = [call];
		messages.push(message);
		direct.push(bubbleTime(data));
		tokens.set(message.id as string, tokenEvidence(data));
	}
	if (messages.length === 0) return null;
	// The session's own moments: its stored metadata first, then the direct
	// message times, then the listing's, as cursor-history resolves them.
	const stored = db.composer.get(`composerData:${id}`);
	const createdStored =
		storedDate(stored?.createdAt) ??
		(summary.createdAtSource === "composer-metadata"
			? storedDate(summary.timestamp)
			: null);
	const updatedStored =
		storedDate(stored?.lastUpdatedAt) ??
		storedDate(stored?.updatedAt) ??
		(summary.lastUpdatedAtSource === "composer-metadata"
			? storedDate(summary.metadata?.lastModified)
			: null);
	const directMs = direct.flatMap((d) => (d && isValid(d.ms) ? [d.ms] : []));
	const created =
		createdStored !== null
			? { ms: createdStored, source: "composer-metadata" as const }
			: directMs.length
				? { ms: Math.min(...directMs), source: "direct-message" as const }
				: { ms: UNKNOWN_TIMESTAMP_EPOCH_MS, source: "epoch-unknown" as const };
	const updated =
		updatedStored !== null
			? { ms: updatedStored, source: "composer-metadata" as const }
			: directMs.length
				? { ms: Math.max(...directMs), source: "direct-message" as const }
				: { ms: UNKNOWN_TIMESTAMP_EPOCH_MS, source: "epoch-unknown" as const };
	const times = resolveTimes(
		direct,
		created.source === "epoch-unknown" ? null : created.ms,
	);
	for (const [i, message] of messages.entries()) {
		message.timestamp = new Date(times[i].ms).toISOString();
		message.timestampSource = times[i].source;
	}
	// Older Composer headers can retain inline bubbles instead of split keys.
	const header = db.header.get(`composerData:${id}`);
	if (typeof header?.conversation === "string") {
		try {
			const conversation: unknown = JSON.parse(header.conversation);
			if (Array.isArray(conversation))
				for (const [index, raw] of conversation.entries()) {
					const obj = asObj(raw);
					const bubble =
						asStr(obj?.bubbleId) ?? asStr(obj?.id) ?? `msg:${index}`;
					if (!tokens.has(bubble)) tokens.set(bubble, tokenEvidence(raw));
				}
		} catch {
			/* the split keys above carry the evidence */
		}
	}
	const session: LocalSessionData = {
		id,
		timestamp: new Date(created.ms).toISOString(),
		createdAtSource: created.source,
		lastUpdatedAtSource: updated.source,
		resolutionState: "complete",
		messages,
		metadata: { lastModified: new Date(updated.ms).toISOString() },
	};
	if (summary.canonicalWorkspacePath !== undefined)
		session.canonicalWorkspacePath = summary.canonicalWorkspacePath;
	if (summary.metadata?.cursorVersion !== undefined)
		session.metadata = {
			...session.metadata,
			cursorVersion: summary.metadata.cursorVersion,
		};
	return { session, tokens };
}

/** Whether the listing entry has a Composer half this module can read. */
export function hasComposerHalf(
	summary: SessionSummary,
): summary is ResolvedSessionSummary {
	if (summary.resolutionState === "ambiguous") return false;
	const sources = (summary as { sources?: string[] }).sources;
	return Array.isArray(sources) ? sources.includes("composer") : true;
}
