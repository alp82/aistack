import {
	CACHE_TTL_SEC,
	classifyEvent,
	deriveSessionPhases,
	EFFORT_LEVELS,
	EFFORT_RAW_LEVELS,
	type EffortLevel,
	type EffortRawLevel,
	effortLevelOf,
	effortRawLevelOf,
	type GapBand,
	type HarnessDay,
	type HarnessEvent,
	type HarnessName,
	LOG_BUCKETS_V1,
	LOG_BUCKETS_V2,
	LONG_GAP_SEC,
	logBucket,
	logBucketV2,
	PHASE_RULES_V1,
	PHASES,
	type PhaseId,
	type SessionLengthBucket,
	SHORT_SESSION_CALLS,
	toolResultName,
	UNKNOWN_GATE,
	WORKFLOW_AGGREGATES_V5,
} from "@aistack/workflow-rules";
import { sanitizeModelId } from "../harness/shared/payload.js";

export const WORKFLOW_AGGREGATE_VERSION = WORKFLOW_AGGREGATES_V5;

/**
 * The first call of a session, split (#358). `harnessTokens` is what the
 * call read from a cache another session had already filled: the system
 * prompt and the tool definitions. `instructionsTokens` is what it wrote or
 * sent fresh: project instructions, memory, skills, agents, the first prompt.
 */
export type FirstCallSplit = {
	harnessTokens: number;
	instructionsTokens: number;
};

export type WorkflowObservation = {
	session: string;
	projectWorkspace?: string;
	tsMs: number;
	parentSession?: string;
	sidechain?: boolean;
} & (
	| { type: "event"; tool: string; arg?: string; batchId?: string }
	| {
			type: "response";
			responseId?: string;
			model?: string;
			thinkingTokens?: number;
			responseTokens?: number;
			routingTokens?: number;
			effort?: string;
			durationSec?: number;
			/** What the request carried in: fresh input plus cache reads and writes. */
			contextTokens?: number;
			/** The window the harness logged for this call, when it logs one. */
			contextWindow?: number;
			/** Present on the first call of the session only. */
			firstCall?: FirstCallSplit;
			/** The efficiency split of the request (v4): fresh input, cache reads, cache writes. */
			inputTokens?: number;
			cacheReadTokens?: number;
			cacheWriteTokens?: number;
			/** Content blocks of the response, when the harness logs them (Claude Code). */
			blocks?: { thinking: number; text: number };
			/**
			 * The cache TTL this call wrote under, in seconds (v5), when the
			 * harness says: Claude Code's 5m/1h write split, Codex's model.
			 * Absent when the call wrote nothing the harness split.
			 */
			cacheTtlSec?: number;
			/** A script started the session (v5): `claude -p` or the SDK. */
			headless?: boolean;
	  }
	| { type: "turn"; turnId?: string; questionBack: boolean }
	/** A compaction boundary the harness logged. Lands on the day of the event. */
	| { type: "compaction" }
	/**
	 * One tool result (v4): the tool's name and the byte length of what it
	 * returned. The adapter sizes the content at the read site and hands over
	 * the number only.
	 */
	| { type: "toolResult"; tool: string; bytes: number }
);

/** One harness's reading for one UTC day, with the day it belongs to. */
export type HarnessDayRow = HarnessDay & { date: string };

/**
 * One harness's workflow reading over the sync window: one row per UTC day
 * that saw a session start, an event, or a response (#285).
 *
 * THE GATE IS OVER THE WHOLE WINDOW. "`phase-rules/v1` ships only when a
 * harness has 20 percent unknown time or less" (map notes), and a day is too
 * small a sample to judge that on: a quiet day with one unclassified command
 * would fail alone and pass inside its month. The extraction strips `phase`
 * from every day of a harness that fails, so the wire carries no phase atoms
 * a window could fold into a playbook the gate refused.
 */
export type HarnessWorkflowAggregate = {
	aggregateVersion: typeof WORKFLOW_AGGREGATE_VERSION;
	harness: HarnessName;
	gate: {
		ruleVersion: typeof PHASE_RULES_V1;
		publishable: boolean;
		sessions: number;
		unknownShare: number;
	};
	days: HarnessDayRow[];
};

/** Raw local keys used to join harness activity to Git. Never serialize this value. */
export type WorkflowLocalSources = {
	projectWorkspaces: Set<string>;
	activeProjectDays: Map<string, Set<string>>;
};

export function createWorkflowLocalSources(): WorkflowLocalSources {
	return { projectWorkspaces: new Set(), activeProjectDays: new Map() };
}

type SessionState = {
	events: Array<{ event: HarnessEvent; batchId?: string }>;
	responses: Map<
		string,
		{
			model?: string;
			thinkingTokens?: number;
			responseTokens?: number;
			routingTokens?: number;
			effort?: string;
			durationSec?: number;
			contextTokens?: number;
			contextWindow?: number;
			firstCall?: FirstCallSplit;
			inputTokens?: number;
			cacheReadTokens?: number;
			cacheWriteTokens?: number;
			blocks?: { thinking: number; text: number };
			cacheTtlSec?: number;
			tsMs: number;
		}
	>;
	compacted: boolean;
	/** Compaction boundaries by time, for the cold-compaction test (v5). */
	compactionTs: number[];
	/** Tool results by time and wire name; counted in `finish()` on main sessions only (v5). */
	toolResults: Array<{ tsMs: number; tool: string; bytes: number }>;
	headless: boolean;
	nextAnonymousResponse: number;
	turns: Map<string, boolean>;
	nextAnonymousTurn: number;
	projectWorkspaces: Set<string>;
	parentSession: string | undefined;
	sidechain: boolean;
	firstTs: number | undefined;
	lastTs: number | undefined;
};

const emptyPhase = (): Record<PhaseId, number> => ({
	scout: 0,
	build: 0,
	verify: 0,
	handoff: 0,
	unknown: 0,
});

const finiteNonnegative = (value: number | undefined): number =>
	value !== undefined && Number.isFinite(value) && value > 0 ? value : 0;

const bump = <K>(map: Map<K, number>, key: K, amount = 1): void => {
	map.set(key, (map.get(key) ?? 0) + amount);
};

export const utcDateOf = (ms: number): string =>
	new Date(ms).toISOString().slice(0, 10);

/** A bucket histogram as sorted rows, the count under the caller's field name. */
function asBuckets<K extends string>(
	map: Map<number, number>,
	field: K,
): ({ bucket: number } & Record<K, number>)[] {
	return [...map]
		.map(
			([bucket, count]) =>
				({ bucket, [field]: count }) as { bucket: number } & Record<K, number>,
		)
		.sort((a, b) => a.bucket - b.bucket);
}

const PHASE_RANK: Record<PhaseId, number> = {
	verify: 4,
	handoff: 3,
	build: 2,
	scout: 1,
	unknown: 0,
};

function reduceEventBatches(
	recorded: SessionState["events"],
	harness: HarnessName,
): HarnessEvent[] {
	const sorted = [...recorded].sort((a, b) => a.event[0] - b.event[0]);
	const output: HarnessEvent[] = [];
	const batchIndexes = new Map<string, number>();
	for (const row of sorted) {
		if (!row.batchId) {
			output.push(row.event);
			continue;
		}
		const existingIndex = batchIndexes.get(row.batchId);
		if (existingIndex === undefined) {
			batchIndexes.set(row.batchId, output.length);
			output.push(row.event);
			continue;
		}
		const existing = output[existingIndex];
		if (!existing) continue;
		const existingPhase = classifyEvent(
			existing[1],
			existing[2],
			null,
			PHASE_RULES_V1,
			harness,
		).phase;
		const candidatePhase = classifyEvent(
			row.event[1],
			row.event[2],
			null,
			PHASE_RULES_V1,
			harness,
		).phase;
		if (PHASE_RANK[candidatePhase] > PHASE_RANK[existingPhase]) {
			output[existingIndex] = [existing[0], row.event[1], row.event[2]];
		}
	}
	return output;
}

const hasVerifyRun = (
	events: readonly HarnessEvent[],
	harness: HarnessName,
): boolean =>
	events.some(
		(event) =>
			deriveSessionPhases([event], PHASE_RULES_V1, harness).phaseEvents.verify >
			0,
	);

function shellIncludes(arg: string, head: string): boolean {
	return arg
		.split(/(?:&&|\|\||;|\|)/)
		.some((part) => part.trim() === head || part.trim().startsWith(`${head} `));
}

function sessionState(): SessionState {
	return {
		compacted: false,
		compactionTs: [],
		toolResults: [],
		headless: false,
		events: [],
		responses: new Map(),
		nextAnonymousResponse: 0,
		turns: new Map(),
		nextAnonymousTurn: 0,
		projectWorkspaces: new Set(),
		parentSession: undefined,
		sidechain: false,
		firstTs: undefined,
		lastTs: undefined,
	};
}

/** The accumulators behind one day's row, before they become plain arrays. */
type DayState = {
	sessions: number;
	startHours: Map<number, number>;
	phase: {
		sessions: number;
		phaseSec: Record<PhaseId, number>;
		phaseEvents: Record<PhaseId, number>;
		waitingSec: number;
		idleSec: number;
		sessionsWithVerify: number;
		sessionsWithHandoff: number;
		lengths: Map<number, SessionLengthBucket>;
	};
	routing: { main: Map<string, number>; subagents: Map<string, number> };
	hasRouting: boolean;
	delegation: {
		mainToolCalls: number;
		subagentToolCalls: number;
		widestFanOut: number;
		mostSubagents: number;
	};
	hasDelegation: boolean;
	activity: Map<string, number>;
	effort: Map<EffortLevel, number>;
	hasEffort: boolean;
	thinking: { thinkingTokens: number; responseTokens: number };
	hasThinking: boolean;
	turnDurations: Map<number, number>;
	hasDurations: boolean;
	questions: { asked: number; turns: number };
	hasQuestions: boolean;
	webSearches: number;
	hasWebSearches: boolean;
	context: {
		calls: { main: Map<number, number>; subagents: Map<number, number> };
		firstCalls: Map<number, number>;
		firstCallHarnessTokens: number;
		firstCallInstructionsTokens: number;
		firstCallCount: number;
		maxContext: number;
		compactions: number;
		window: { tsMs: number; window: number } | undefined;
	};
	hasContext: boolean;
	efficiency: {
		callGaps: Map<number, number>;
		callsAfterGap: number;
		cacheWriteAfterGap: number;
		inputAfterGap: number;
		orphanCacheWrites: number;
		orphanCacheWriteTokens: number;
		sessionMaxContext: Map<number, number>;
		sessionCalls: Map<number, number>;
		shortSessions: number;
		shortSessionFirstCallTokens: number;
		sessionsCompacted: number;
		toolResults: Map<
			string,
			{ results: number; bytes: number; buckets: Map<number, number> }
		>;
		blocks: { thinking: number; text: number };
		hasBlocks: boolean;
		gapBands: { short: GapBand; long: GapBand };
		warmOrphanCacheWrites: number;
		warmOrphanCacheWriteTokens: number;
		headlessSessions: number;
		coldCompactions: number;
		effortRaw: Map<EffortRawLevel, { responses: number; outputTokens: number }>;
	};
	hasEfficiency: boolean;
};

const emptyBand = (): GapBand => ({
	calls: 0,
	cacheWrite: 0,
	cacheRead: 0,
	input: 0,
});

function dayState(): DayState {
	return {
		sessions: 0,
		startHours: new Map(),
		phase: {
			sessions: 0,
			phaseSec: emptyPhase(),
			phaseEvents: emptyPhase(),
			waitingSec: 0,
			idleSec: 0,
			sessionsWithVerify: 0,
			sessionsWithHandoff: 0,
			lengths: new Map(),
		},
		routing: { main: new Map(), subagents: new Map() },
		hasRouting: false,
		delegation: {
			mainToolCalls: 0,
			subagentToolCalls: 0,
			widestFanOut: 0,
			mostSubagents: 0,
		},
		hasDelegation: false,
		activity: new Map(),
		effort: new Map(),
		hasEffort: false,
		thinking: { thinkingTokens: 0, responseTokens: 0 },
		hasThinking: false,
		turnDurations: new Map(),
		hasDurations: false,
		questions: { asked: 0, turns: 0 },
		hasQuestions: false,
		webSearches: 0,
		hasWebSearches: false,
		context: {
			calls: { main: new Map(), subagents: new Map() },
			firstCalls: new Map(),
			firstCallHarnessTokens: 0,
			firstCallInstructionsTokens: 0,
			firstCallCount: 0,
			maxContext: 0,
			compactions: 0,
			window: undefined,
		},
		hasContext: false,
		efficiency: {
			callGaps: new Map(),
			callsAfterGap: 0,
			cacheWriteAfterGap: 0,
			inputAfterGap: 0,
			orphanCacheWrites: 0,
			orphanCacheWriteTokens: 0,
			sessionMaxContext: new Map(),
			sessionCalls: new Map(),
			shortSessions: 0,
			shortSessionFirstCallTokens: 0,
			sessionsCompacted: 0,
			toolResults: new Map(),
			blocks: { thinking: 0, text: 0 },
			hasBlocks: false,
			gapBands: { short: emptyBand(), long: emptyBand() },
			warmOrphanCacheWrites: 0,
			warmOrphanCacheWriteTokens: 0,
			headlessSessions: 0,
			coldCompactions: 0,
			effortRaw: new Map(),
		},
		hasEfficiency: false,
	};
}

export type HarnessWorkflowReducer = {
	ingest(observation: WorkflowObservation): void;
	finish(): HarnessWorkflowAggregate;
};

/**
 * Reduce one harness's observations into per-day rows of combinable atoms.
 *
 * A SESSION BELONGS TO THE UTC DAY IT STARTED. Its phase seconds, its length
 * bucket, its model tokens, its effort and thinking and turn figures all land
 * on that day, so a session spanning midnight counts once. Event cells and web
 * searches land on the day of the event, so the heatmap stays exact.
 *
 * Nothing that names a path, a session, a command or a timestamp survives
 * `finish()`: the wire carries counts, sums, maxes and bucket indexes.
 */
export function createHarnessWorkflowReducer(
	harness: HarnessName,
	localSources: WorkflowLocalSources = createWorkflowLocalSources(),
): HarnessWorkflowReducer {
	const sessions = new Map<string, SessionState>();
	const eventCells = new Map<string, Map<string, number>>();
	const webSearchesByDate = new Map<string, number>();
	const compactionsByDate = new Map<string, number>();
	const eventDates = new Set<string>();
	let finished: HarnessWorkflowAggregate | undefined;

	const getSession = (key: string): SessionState => {
		let state = sessions.get(key);
		if (!state) {
			state = sessionState();
			sessions.set(key, state);
		}
		return state;
	};

	return {
		ingest(observation): void {
			if (finished) return;
			if (!Number.isFinite(observation.tsMs)) return;
			const state = getSession(observation.session);
			state.firstTs =
				state.firstTs === undefined
					? observation.tsMs
					: Math.min(state.firstTs, observation.tsMs);
			state.lastTs =
				state.lastTs === undefined
					? observation.tsMs
					: Math.max(state.lastTs, observation.tsMs);
			state.parentSession ??= observation.parentSession;
			state.sidechain ||= observation.sidechain === true;
			if (observation.type === "response" && observation.headless)
				state.headless = true;
			const at = new Date(observation.tsMs);
			const date = utcDateOf(observation.tsMs);
			if (observation.projectWorkspace) {
				state.projectWorkspaces.add(observation.projectWorkspace);
				localSources.projectWorkspaces.add(observation.projectWorkspace);
			}

			if (observation.type === "event") {
				const arg = observation.arg ?? "";
				state.events.push({
					event: [observation.tsMs, observation.tool, arg],
					...(observation.batchId ? { batchId: observation.batchId } : {}),
				});
				eventDates.add(date);
				const cells = eventCells.get(date) ?? new Map<string, number>();
				bump(cells, `${at.getUTCDay()}:${at.getUTCHours()}`);
				eventCells.set(date, cells);
				if (["WebSearch", "web_search", "websearch"].includes(observation.tool))
					bump(webSearchesByDate, date);
			} else if (observation.type === "response") {
				const responseId =
					observation.responseId ??
					`anonymous:${state.nextAnonymousResponse++}`;
				const duration = finiteNonnegative(observation.durationSec);
				const contextTokens = finiteNonnegative(observation.contextTokens);
				const contextWindow = finiteNonnegative(observation.contextWindow);
				const response = {
					tsMs: observation.tsMs,
					...(observation.model ? { model: observation.model } : {}),
					...(observation.thinkingTokens !== undefined
						? { thinkingTokens: finiteNonnegative(observation.thinkingTokens) }
						: {}),
					...(observation.responseTokens !== undefined
						? { responseTokens: finiteNonnegative(observation.responseTokens) }
						: {}),
					...(observation.routingTokens !== undefined
						? { routingTokens: finiteNonnegative(observation.routingTokens) }
						: {}),
					...(observation.effort ? { effort: observation.effort } : {}),
					...(duration > 0 ? { durationSec: duration } : {}),
					...(observation.contextTokens !== undefined ? { contextTokens } : {}),
					...(contextWindow > 0 ? { contextWindow } : {}),
					...(observation.firstCall
						? {
								firstCall: {
									harnessTokens: finiteNonnegative(
										observation.firstCall.harnessTokens,
									),
									instructionsTokens: finiteNonnegative(
										observation.firstCall.instructionsTokens,
									),
								},
							}
						: {}),
					...(observation.inputTokens !== undefined
						? { inputTokens: finiteNonnegative(observation.inputTokens) }
						: {}),
					...(observation.cacheReadTokens !== undefined
						? {
								cacheReadTokens: finiteNonnegative(observation.cacheReadTokens),
							}
						: {}),
					...(observation.cacheWriteTokens !== undefined
						? {
								cacheWriteTokens: finiteNonnegative(
									observation.cacheWriteTokens,
								),
							}
						: {}),
					...(observation.blocks
						? {
								blocks: {
									thinking: finiteNonnegative(observation.blocks.thinking),
									text: finiteNonnegative(observation.blocks.text),
								},
							}
						: {}),
					...(finiteNonnegative(observation.cacheTtlSec) > 0
						? { cacheTtlSec: finiteNonnegative(observation.cacheTtlSec) }
						: {}),
				};
				const existing = state.responses.get(responseId);
				const magnitude = (value: typeof response): number =>
					value.routingTokens ??
					(value.thinkingTokens ?? 0) + (value.responseTokens ?? 0);
				if (!existing || magnitude(response) > magnitude(existing)) {
					state.responses.set(responseId, response);
				}
			} else if (observation.type === "turn") {
				const turnId =
					observation.turnId ?? `anonymous:${state.nextAnonymousTurn++}`;
				state.turns.set(turnId, observation.questionBack);
			} else if (observation.type === "toolResult") {
				// Held on the session: whether it is a subagent is known only
				// once every record is in, so `finish()` counts main ones.
				state.toolResults.push({
					tsMs: observation.tsMs,
					tool: toolResultName(observation.tool),
					bytes: finiteNonnegative(observation.bytes),
				});
			} else {
				state.compacted = true;
				state.compactionTs.push(observation.tsMs);
				bump(compactionsByDate, date);
			}
		},

		finish(): HarnessWorkflowAggregate {
			if (finished) return finished;
			const days = new Map<string, DayState>();
			const dayOf = (date: string): DayState => {
				let state = days.get(date);
				if (!state) {
					state = dayState();
					days.set(date, state);
				}
				return state;
			};

			const windowPhaseSec = emptyPhase();
			let phaseSessionCount = 0;

			for (const state of sessions.values()) {
				if (state.firstTs === undefined) continue;
				const day = dayOf(utcDateOf(state.firstTs));
				const events = reduceEventBatches(state.events, harness);
				const responses = [...state.responses.values()];

				day.sessions++;
				const startHour = new Date(state.firstTs).getUTCHours();
				day.startHours.set(startHour, (day.startHours.get(startHour) ?? 0) + 1);

				// The phase reading of this session.
				const phases = deriveSessionPhases(events, PHASE_RULES_V1, harness);
				if (state.events.length > 0) phaseSessionCount++;
				day.phase.sessions++;
				for (const phase of PHASES) {
					day.phase.phaseSec[phase] += phases.phaseSec[phase];
					day.phase.phaseEvents[phase] += phases.phaseEvents[phase];
					windowPhaseSec[phase] += phases.phaseSec[phase];
				}
				day.phase.waitingSec += phases.waitingSec;
				day.phase.idleSec += phases.idleSec;
				if (phases.phaseEvents.verify > 0) day.phase.sessionsWithVerify++;
				if (phases.phaseEvents.handoff > 0) day.phase.sessionsWithHandoff++;

				const measuredSec = PHASES.reduce(
					(sum, phase) => sum + phases.phaseSec[phase],
					0,
				);
				const bucket = logBucket(measuredSec / 60);
				const merged = events.some(
					([, tool, arg]) =>
						["Bash", "bash", "shell", "local_shell", "exec_command"].includes(
							tool,
						) && shellIncludes(arg, "gh pr merge"),
				);
				const verified = hasVerifyRun(events, harness);
				const openedWithScout =
					(events[0]
						? deriveSessionPhases([events[0]], PHASE_RULES_V1, harness)
								.phaseEvents.scout
						: 0) > 0;
				const length = day.phase.lengths.get(bucket) ?? {
					bucket,
					sessions: 0,
					phaseSec: emptyPhase(),
					merged: 0,
					verified: 0,
					mergedVerified: 0,
					openedWithScout: 0,
				};
				length.sessions++;
				for (const phase of PHASES)
					length.phaseSec[phase] += phases.phaseSec[phase];
				if (merged) length.merged++;
				if (verified) length.verified++;
				if (merged && verified) length.mergedVerified++;
				if (openedWithScout) length.openedWithScout++;
				day.phase.lengths.set(bucket, length);

				// Routing and delegation.
				const routing =
					state.sidechain || state.parentSession ? "subagents" : "main";
				for (const response of responses) {
					if (!response.model) continue;
					day.hasRouting = true;
					bump(
						day.routing[routing],
						response.model,
						response.routingTokens ?? response.responseTokens ?? 0,
					);
				}
				if (routing === "subagents") {
					day.delegation.subagentToolCalls += state.events.length;
					day.hasDelegation ||= state.events.length > 0;
				} else day.delegation.mainToolCalls += state.events.length;

				// Effort, thinking, turn durations and questions.
				for (const response of responses) {
					if (response.effort) {
						day.hasEffort = true;
						const level = effortLevelOf(response.effort);
						day.effort.set(level, (day.effort.get(level) ?? 0) + 1);
					}
					if (response.thinkingTokens !== undefined) {
						day.hasThinking = true;
						day.thinking.thinkingTokens += response.thinkingTokens;
						day.thinking.responseTokens += response.responseTokens ?? 0;
					}
					if (response.durationSec !== undefined) {
						day.hasDurations = true;
						const durationBucket = logBucket(response.durationSec);
						day.turnDurations.set(
							durationBucket,
							(day.turnDurations.get(durationBucket) ?? 0) + 1,
						);
					}
				}
				if (harness !== "pi-mono") {
					day.hasQuestions = true;
					day.questions.turns += state.turns.size;
					day.questions.asked += [...state.turns.values()].filter(
						Boolean,
					).length;
				}

				// Per-call context (#358), on the session's start day like every
				// other response figure. First calls count on main sessions only:
				// the reading splits the MAIN median call, and a subagent's first
				// call carries a different fixed part.
				for (const response of responses) {
					if (response.contextTokens === undefined) continue;
					day.hasContext = true;
					const context = day.context;
					bump(context.calls[routing], logBucketV2(response.contextTokens));
					context.maxContext = Math.max(
						context.maxContext,
						response.contextTokens,
					);
					if (
						response.contextWindow !== undefined &&
						(context.window === undefined ||
							response.tsMs >= context.window.tsMs)
					) {
						context.window = {
							tsMs: response.tsMs,
							window: response.contextWindow,
						};
					}
					if (response.firstCall && routing === "main") {
						bump(context.firstCalls, logBucketV2(response.contextTokens));
						context.firstCallHarnessTokens += response.firstCall.harnessTokens;
						context.firstCallInstructionsTokens +=
							response.firstCall.instructionsTokens;
						context.firstCallCount++;
					}
				}

				// Token-efficiency atoms (v4), main sessions only, on the start
				// day. A CALL here is a response that carried its context; the
				// calls of a session sort by time so a gap is the seconds since
				// the previous call of the SAME session.
				if (routing === "main") {
					const calls = responses
						.filter((response) => response.contextTokens !== undefined)
						.sort((a, b) => a.tsMs - b.tsMs);
					for (const response of responses) {
						if (!response.blocks) continue;
						day.hasEfficiency = true;
						day.efficiency.hasBlocks = true;
						day.efficiency.blocks.thinking += response.blocks.thinking;
						day.efficiency.blocks.text += response.blocks.text;
					}
					for (const response of responses) {
						if (!response.effort) continue;
						day.hasEfficiency = true;
						const level = effortRawLevelOf(response.effort);
						const row = day.efficiency.effortRaw.get(level) ?? {
							responses: 0,
							outputTokens: 0,
						};
						row.responses++;
						row.outputTokens += response.responseTokens ?? 0;
						day.efficiency.effortRaw.set(level, row);
					}
					if (calls.length > 0) {
						day.hasEfficiency = true;
						const eff = day.efficiency;
						let peak = 0;
						// The TTL in force for a call is the one the session last
						// wrote under (v5): Claude Code's 5m/1h split, Codex's model.
						let ttlSec = CACHE_TTL_SEC;
						const ttlAt: number[] = [];
						calls.forEach((call, i) => {
							const context = call.contextTokens ?? 0;
							peak = Math.max(peak, context);
							const previous = calls[i - 1];
							const ttlBefore = ttlSec;
							if (call.cacheTtlSec !== undefined) ttlSec = call.cacheTtlSec;
							ttlAt.push(ttlSec);
							if (!previous) return;
							const gapSec = (call.tsMs - previous.tsMs) / 1000;
							bump(eff.callGaps, logBucket(gapSec));
							if (gapSec > CACHE_TTL_SEC) {
								eff.callsAfterGap++;
								eff.cacheWriteAfterGap += call.cacheWriteTokens ?? 0;
								eff.inputAfterGap += call.inputTokens ?? 0;
								const band =
									gapSec > LONG_GAP_SEC
										? eff.gapBands.long
										: eff.gapBands.short;
								band.calls++;
								band.cacheWrite += call.cacheWriteTokens ?? 0;
								band.cacheRead += call.cacheReadTokens ?? 0;
								band.input += call.inputTokens ?? 0;
							}
							if (
								(call.cacheWriteTokens ?? 0) > 0 &&
								(call.cacheReadTokens ?? 0) === 0
							) {
								eff.orphanCacheWrites++;
								eff.orphanCacheWriteTokens += call.cacheWriteTokens ?? 0;
								// A write with no read after a gap past the TTL is an
								// expired cache, which the after-gap atoms count.
								if (gapSec <= ttlBefore) {
									eff.warmOrphanCacheWrites++;
									eff.warmOrphanCacheWriteTokens += call.cacheWriteTokens ?? 0;
								}
							}
						});
						// A compaction after a gap past the TTL re-reads the whole
						// history uncached: the costliest way to compact.
						for (const ts of state.compactionTs) {
							let last = -1;
							for (let i = 0; i < calls.length; i++) {
								if ((calls[i]?.tsMs ?? Infinity) <= ts) last = i;
							}
							const before = calls[last];
							if (
								before &&
								(ts - before.tsMs) / 1000 > (ttlAt[last] ?? CACHE_TTL_SEC)
							)
								eff.coldCompactions++;
						}
						bump(eff.sessionMaxContext, logBucketV2(peak));
						bump(eff.sessionCalls, logBucket(calls.length));
						if (state.headless) eff.headlessSessions++;
						else if (calls.length <= SHORT_SESSION_CALLS) {
							eff.shortSessions++;
							eff.shortSessionFirstCallTokens += calls[0]?.contextTokens ?? 0;
						}
						if (state.compacted) eff.sessionsCompacted++;
					}
					// Tool results of the main thread, on the day of the result.
					// A subagent's output never reaches the main context.
					for (const result of state.toolResults) {
						const resultDay = dayOf(utcDateOf(result.tsMs));
						resultDay.hasEfficiency = true;
						const held = resultDay.efficiency.toolResults.get(result.tool) ?? {
							results: 0,
							bytes: 0,
							buckets: new Map<number, number>(),
						};
						held.results++;
						held.bytes += result.bytes;
						bump(held.buckets, logBucketV2(result.bytes));
						resultDay.efficiency.toolResults.set(result.tool, held);
					}
				}
			}

			// Compactions, on the day of the boundary.
			for (const [date, compactions] of compactionsByDate) {
				const day = dayOf(date);
				day.hasContext = true;
				day.context.compactions += compactions;
			}

			// Event cells and web searches, on the day of the event.
			for (const date of eventDates) {
				const day = dayOf(date);
				for (const [key, events] of eventCells.get(date) ?? []) {
					bump(day.activity, key, events);
				}
				if (harness !== "pi-mono") {
					day.hasWebSearches = true;
					day.webSearches = webSearchesByDate.get(date) ?? 0;
				}
			}

			// Fan-out, on the parent's start day.
			const childrenByParent = new Map<string, SessionState[]>();
			for (const state of sessions.values()) {
				if (!state.parentSession) continue;
				const children = childrenByParent.get(state.parentSession) ?? [];
				children.push(state);
				childrenByParent.set(state.parentSession, children);
			}
			for (const [parentKey, children] of childrenByParent) {
				const parent = sessions.get(parentKey);
				const anchor =
					parent?.firstTs ??
					Math.min(...children.map((child) => child.firstTs ?? Infinity));
				if (!Number.isFinite(anchor)) continue;
				const day = dayOf(utcDateOf(anchor));
				day.hasDelegation = true;
				day.delegation.mostSubagents = Math.max(
					day.delegation.mostSubagents,
					children.length,
				);
				const boundaries = children.flatMap((child) => [
					{ ts: child.firstTs ?? 0, delta: 1 },
					{ ts: child.lastTs ?? child.firstTs ?? 0, delta: -1 },
				]);
				boundaries.sort((a, b) => a.ts - b.ts || b.delta - a.delta);
				let active = 0;
				for (const boundary of boundaries) {
					active += boundary.delta;
					day.delegation.widestFanOut = Math.max(
						day.delegation.widestFanOut,
						active,
					);
				}
			}

			// The workspace-day marks Git and the parallel-project count read.
			localSources.activeProjectDays.clear();
			for (const state of sessions.values()) {
				if (state.firstTs === undefined || state.lastTs === undefined) continue;
				let day = Date.parse(`${utcDateOf(state.firstTs)}T00:00:00Z`);
				const lastDay = Date.parse(`${utcDateOf(state.lastTs)}T00:00:00Z`);
				while (day <= lastDay) {
					const date = utcDateOf(day);
					const projects =
						localSources.activeProjectDays.get(date) ?? new Set();
					for (const project of state.projectWorkspaces) projects.add(project);
					if (projects.size > 0)
						localSources.activeProjectDays.set(date, projects);
					day += 86_400_000;
				}
			}

			const attributed = PHASES.reduce(
				(sum, phase) => sum + windowPhaseSec[phase],
				0,
			);
			const unknown =
				attributed === 0 ? 0 : windowPhaseSec.unknown / attributed;
			const routesModels =
				harness === "claude-code" ||
				harness === "opencode" ||
				harness === "grok-build" ||
				harness === "cursor";

			const asRows = (map: Map<string, number>) => {
				const safe = new Map<string, number>();
				for (const [model, tokens] of map) {
					bump(safe, sanitizeModelId(model), tokens);
				}
				return [...safe]
					.map(([model, tokens]) => ({ model, tokens }))
					.sort(
						(a, b) => b.tokens - a.tokens || a.model.localeCompare(b.model),
					);
			};

			finished = {
				aggregateVersion: WORKFLOW_AGGREGATE_VERSION,
				harness,
				gate: {
					ruleVersion: PHASE_RULES_V1,
					publishable: phaseSessionCount > 0 && unknown <= UNKNOWN_GATE,
					sessions: sessions.size,
					unknownShare: unknown,
				},
				days: [...days]
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([date, day]) => ({
						date,
						harness,
						sessions: day.sessions,
						startHours: [...day.startHours]
							.map(([hourUtc, count]) => ({ hourUtc, sessions: count }))
							.sort((a, b) => a.hourUtc - b.hourUtc),
						...(day.phase.sessions > 0
							? {
									phase: {
										ruleVersion: PHASE_RULES_V1,
										sessions: day.phase.sessions,
										phaseSec: day.phase.phaseSec,
										phaseEvents: day.phase.phaseEvents,
										waitingSec: day.phase.waitingSec,
										idleSec: day.phase.idleSec,
										sessionsWithVerify: day.phase.sessionsWithVerify,
										sessionsWithHandoff: day.phase.sessionsWithHandoff,
										bucketRuleVersion: LOG_BUCKETS_V1,
										lengths: [...day.phase.lengths.values()].sort(
											(a, b) => a.bucket - b.bucket,
										),
									},
								}
							: {}),
						...(routesModels && day.hasRouting
							? {
									routing: {
										main: asRows(day.routing.main),
										subagents: asRows(day.routing.subagents),
									},
								}
							: {}),
						...(day.hasDelegation ? { delegation: day.delegation } : {}),
						activity: [...day.activity]
							.map(([key, events]) => {
								const [weekdayUtc, hourUtc] = key.split(":").map(Number);
								return {
									weekdayUtc: weekdayUtc ?? 0,
									hourUtc: hourUtc ?? 0,
									events,
								};
							})
							.sort(
								(a, b) => a.weekdayUtc - b.weekdayUtc || a.hourUtc - b.hourUtc,
							),
						...(day.hasEffort
							? {
									effort: EFFORT_LEVELS.flatMap((level) => {
										const turns = day.effort.get(level) ?? 0;
										return turns > 0 ? [{ level, turns }] : [];
									}),
								}
							: {}),
						...(day.hasThinking ? { thinking: day.thinking } : {}),
						...(day.hasDurations
							? {
									turnDurations: {
										bucketRuleVersion: LOG_BUCKETS_V1,
										buckets: [...day.turnDurations]
											.map(([bucket, turns]) => ({ bucket, turns }))
											.sort((a, b) => a.bucket - b.bucket),
									},
								}
							: {}),
						...(day.hasQuestions ? { questions: day.questions } : {}),
						...(day.hasWebSearches ? { webSearches: day.webSearches } : {}),
						...(day.hasContext
							? {
									context: {
										bucketRuleVersion: LOG_BUCKETS_V2,
										calls: {
											main: asBuckets(day.context.calls.main, "calls"),
											subagents: asBuckets(
												day.context.calls.subagents,
												"calls",
											),
										},
										firstCalls: {
											main: asBuckets(day.context.firstCalls, "sessions"),
										},
										firstCallHarnessTokens: day.context.firstCallHarnessTokens,
										firstCallInstructionsTokens:
											day.context.firstCallInstructionsTokens,
										firstCallCount: day.context.firstCallCount,
										maxContext: day.context.maxContext,
										compactions: day.context.compactions,
										...(day.context.window
											? { window: day.context.window.window }
											: {}),
									},
								}
							: {}),
						...(day.hasEfficiency
							? {
									efficiency: {
										countBucketRuleVersion: LOG_BUCKETS_V1,
										sizeBucketRuleVersion: LOG_BUCKETS_V2,
										callGaps: asBuckets(day.efficiency.callGaps, "calls"),
										callsAfterGap: day.efficiency.callsAfterGap,
										cacheWriteAfterGap: day.efficiency.cacheWriteAfterGap,
										inputAfterGap: day.efficiency.inputAfterGap,
										orphanCacheWrites: day.efficiency.orphanCacheWrites,
										orphanCacheWriteTokens:
											day.efficiency.orphanCacheWriteTokens,
										sessionMaxContext: asBuckets(
											day.efficiency.sessionMaxContext,
											"sessions",
										),
										sessionCalls: asBuckets(
											day.efficiency.sessionCalls,
											"sessions",
										),
										shortSessions: day.efficiency.shortSessions,
										shortSessionFirstCallTokens:
											day.efficiency.shortSessionFirstCallTokens,
										sessionsCompacted: day.efficiency.sessionsCompacted,
										toolResults: [...day.efficiency.toolResults]
											.map(([tool, row]) => ({
												tool,
												results: row.results,
												bytes: row.bytes,
												buckets: asBuckets(row.buckets, "results"),
											}))
											.sort(
												(a, b) =>
													b.bytes - a.bytes || a.tool.localeCompare(b.tool),
											),
										...(day.efficiency.hasBlocks
											? { blocks: day.efficiency.blocks }
											: {}),
										gapBands: day.efficiency.gapBands,
										warmOrphanCacheWrites: day.efficiency.warmOrphanCacheWrites,
										warmOrphanCacheWriteTokens:
											day.efficiency.warmOrphanCacheWriteTokens,
										headlessSessions: day.efficiency.headlessSessions,
										coldCompactions: day.efficiency.coldCompactions,
										effortRaw: EFFORT_RAW_LEVELS.flatMap((level) => {
											const row = day.efficiency.effortRaw.get(level);
											return row ? [{ level, ...row }] : [];
										}),
									},
								}
							: {}),
					})),
			};
			sessions.clear();
			eventCells.clear();
			webSearchesByDate.clear();
			compactionsByDate.clear();
			eventDates.clear();
			return finished;
		},
	};
}
