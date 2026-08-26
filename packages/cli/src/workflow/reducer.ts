import {
	classifyEvent,
	deriveSessionPhases,
	EFFORT_LEVELS,
	type EffortLevel,
	effortLevelOf,
	type HarnessDay,
	type HarnessEvent,
	type HarnessName,
	LOG_BUCKETS_V1,
	logBucket,
	PHASE_RULES_V1,
	PHASES,
	type PhaseId,
	type SessionLengthBucket,
	UNKNOWN_GATE,
	WORKFLOW_AGGREGATES_V2,
} from "@aistack/workflow-rules";
import { sanitizeModelId } from "../harness/shared/payload.js";

export const WORKFLOW_AGGREGATE_VERSION = WORKFLOW_AGGREGATES_V2;

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
	  }
	| { type: "turn"; turnId?: string; questionBack: boolean }
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
		}
	>;
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

const bump = (map: Map<string, number>, key: string, amount = 1): void => {
	map.set(key, (map.get(key) ?? 0) + amount);
};

export const utcDateOf = (ms: number): string =>
	new Date(ms).toISOString().slice(0, 10);

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
};

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
				const response = {
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
				};
				const existing = state.responses.get(responseId);
				const magnitude = (value: typeof response): number =>
					value.routingTokens ??
					(value.thinkingTokens ?? 0) + (value.responseTokens ?? 0);
				if (!existing || magnitude(response) > magnitude(existing)) {
					state.responses.set(responseId, response);
				}
			} else {
				const turnId =
					observation.turnId ?? `anonymous:${state.nextAnonymousTurn++}`;
				state.turns.set(turnId, observation.questionBack);
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
			const routesModels = harness === "claude-code" || harness === "opencode";

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
					})),
			};
			sessions.clear();
			eventCells.clear();
			webSearchesByDate.clear();
			eventDates.clear();
			return finished;
		},
	};
}
