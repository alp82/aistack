import {
	classifyEvent,
	deriveSessionPhases,
	type HarnessEvent,
	type HarnessName,
	PHASE_RULES_V1,
	PHASES,
	type PhaseId,
	UNKNOWN_GATE,
	type WorkflowFacts,
} from "@aistack/workflow-rules";

export const WORKFLOW_AGGREGATE_VERSION = "workflow-aggregates/v1";

type SessionFact = NonNullable<WorkflowFacts["sessions"]>[number];
type ActiveDayFact = NonNullable<WorkflowFacts["activeDays"]>[number];

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

export type WorkflowPhaseSession = {
	startHourUtc: number;
	eventCount: number;
	phaseSec: Record<PhaseId, number>;
	phaseEvents: Record<PhaseId, number>;
	waitingSec: number;
	idleSec: number;
	merged: boolean;
	verifyRuns: number;
	reviewRounds: number;
	openedWithScout: boolean;
};

export type HarnessWorkflowAggregate = {
	aggregateVersion: typeof WORKFLOW_AGGREGATE_VERSION;
	harness: HarnessName;
	phase: {
		ruleVersion: typeof PHASE_RULES_V1;
		publishable: boolean;
		sessions: number;
		phaseSec: Record<PhaseId, number>;
		phaseEvents: Record<PhaseId, number>;
		waitingSec: number;
		idleSec: number;
		unknownShare: number;
		sessionRows: WorkflowPhaseSession[];
	};
	facts: {
		sessions: SessionFact[];
		activeDays: ActiveDayFact[];
	};
	routing: {
		main: Array<{ model: string; tokens: number }>;
		subagents: Array<{ model: string; tokens: number }>;
	};
	delegation?: {
		mainToolCalls: number;
		subagentToolCalls: number;
		widestFanOut: number;
		mostSubagents: number;
	};
	activity: Array<{ weekdayUtc: number; hourUtc: number; events: number }>;
	/** Local-only input for Git extraction. Payload builders must not serialize it. */
	localProjectWorkspaces: string[];
	/** Local-only project sets for exact cross-harness active-day unions. */
	localActiveProjectDays: Array<{
		date: string;
		projectWorkspaces: string[];
	}>;
};

type SessionState = {
	events: Array<{ event: HarnessEvent; batchId?: string }>;
	responses: Map<
		string,
		{
			model?: string;
			thinkingTokens: number;
			responseTokens: number;
			routingTokens: number;
			effort?: string;
			durationSec?: number;
		}
	>;
	nextAnonymousResponse: number;
	turns: Map<string, boolean>;
	nextAnonymousTurn: number;
	projectWorkspaces: Set<string>;
	activeDates: Set<string>;
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

const isHighEffort = (effort: string): boolean =>
	["high", "xhigh", "max", "ultra"].includes(effort.toLowerCase());

const bump = (map: Map<string, number>, key: string, amount = 1): void => {
	map.set(key, (map.get(key) ?? 0) + amount);
};

const verifyRuns = (events: readonly HarnessEvent[]): number => {
	const phases = events.map((event) =>
		deriveSessionPhases([event]).phaseEvents.verify > 0 ? "verify" : "other",
	);
	let runs = 0;
	let inside = false;
	for (const phase of phases) {
		if (phase === "verify" && !inside) runs++;
		inside = phase === "verify";
	}
	return runs;
};

const PHASE_RANK: Record<PhaseId, number> = {
	verify: 4,
	handoff: 3,
	build: 2,
	scout: 1,
	unknown: 0,
};

function reduceEventBatches(recorded: SessionState["events"]): HarnessEvent[] {
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
		const existingPhase = classifyEvent(existing[1], existing[2], null).phase;
		const candidatePhase = classifyEvent(
			row.event[1],
			row.event[2],
			null,
		).phase;
		if (PHASE_RANK[candidatePhase] > PHASE_RANK[existingPhase]) {
			output[existingIndex] = [existing[0], row.event[1], row.event[2]];
		}
	}
	return output;
}

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
		activeDates: new Set(),
		parentSession: undefined,
		sidechain: false,
		firstTs: undefined,
		lastTs: undefined,
	};
}

export type HarnessWorkflowReducer = {
	ingest(observation: WorkflowObservation): void;
	finish(): HarnessWorkflowAggregate;
};

export function createHarnessWorkflowReducer(
	harness: HarnessName,
): HarnessWorkflowReducer {
	const sessions = new Map<string, SessionState>();
	const activity = new Map<string, number>();
	const webSearchesByDate = new Map<string, number>();
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
			if (observation.projectWorkspace)
				state.projectWorkspaces.add(observation.projectWorkspace);
			const at = new Date(observation.tsMs);
			const date = at.toISOString().slice(0, 10);
			state.activeDates.add(date);

			if (observation.type === "event") {
				const arg = observation.arg ?? "";
				state.events.push({
					event: [observation.tsMs, observation.tool, arg],
					...(observation.batchId ? { batchId: observation.batchId } : {}),
				});
				bump(activity, `${at.getUTCDay()}:${at.getUTCHours()}`);
				if (["WebSearch", "web_search", "websearch"].includes(observation.tool))
					bump(webSearchesByDate, date);
			} else if (observation.type === "response") {
				const responseId =
					observation.responseId ??
					`anonymous:${state.nextAnonymousResponse++}`;
				const duration = finiteNonnegative(observation.durationSec);
				state.responses.set(responseId, {
					...(observation.model ? { model: observation.model } : {}),
					thinkingTokens: finiteNonnegative(observation.thinkingTokens),
					responseTokens: finiteNonnegative(observation.responseTokens),
					routingTokens: finiteNonnegative(observation.routingTokens),
					...(observation.effort ? { effort: observation.effort } : {}),
					...(duration > 0 ? { durationSec: duration } : {}),
				});
			} else {
				const turnId =
					observation.turnId ?? `anonymous:${state.nextAnonymousTurn++}`;
				state.turns.set(turnId, observation.questionBack);
			}
		},

		finish(): HarnessWorkflowAggregate {
			if (finished) return finished;
			const phaseSec = emptyPhase();
			const phaseEvents = emptyPhase();
			const sessionRows: WorkflowPhaseSession[] = [];
			const facts: SessionFact[] = [];
			const modelTokens = {
				main: new Map<string, number>(),
				subagents: new Map<string, number>(),
			};
			let waitingSec = 0;
			let idleSec = 0;
			let mainToolCalls = 0;
			let subagentToolCalls = 0;
			let phaseSessionCount = 0;

			for (const state of sessions.values()) {
				const events = reduceEventBatches(state.events);
				const responses = [...state.responses.values()];
				const efforts = responses.flatMap((response) =>
					response.effort ? [response.effort] : [],
				);
				const models = new Set(
					responses.flatMap((response) =>
						response.model ? [response.model] : [],
					),
				);
				const thinkingTokens = responses.reduce(
					(sum, response) => sum + response.thinkingTokens,
					0,
				);
				const responseTokens = responses.reduce(
					(sum, response) => sum + response.responseTokens,
					0,
				);
				const durations = responses.flatMap((response) =>
					response.durationSec === undefined ? [] : [response.durationSec],
				);
				const sessionFact: SessionFact = {
					harness,
					modelSwitched: models.size > 1,
					thinkingTokens,
					responseTokens,
					questionBackTurns: [...state.turns.values()].filter(Boolean).length,
					totalTurns: state.turns.size,
				};
				if (efforts.length > 0) {
					sessionFact.effortTurns = {
						high: efforts.filter(isHighEffort).length,
						total: efforts.length,
					};
					sessionFact.effortChangedMidRun = new Set(efforts).size > 1;
				}
				if (durations.length > 0)
					sessionFact.longestTurnDurationSec = Math.max(...durations);
				facts.push(sessionFact);

				const routing =
					state.sidechain || state.parentSession ? "subagents" : "main";
				for (const response of responses) {
					if (!response.model) continue;
					bump(
						modelTokens[routing],
						response.model,
						response.routingTokens || response.responseTokens,
					);
				}
				if (routing === "subagents") subagentToolCalls += state.events.length;
				else mainToolCalls += state.events.length;

				if (state.events.length === 0) continue;
				phaseSessionCount++;
				const phases = deriveSessionPhases(events);
				for (const phase of PHASES) {
					phaseSec[phase] += phases.phaseSec[phase];
					phaseEvents[phase] += phases.phaseEvents[phase];
				}
				waitingSec += phases.waitingSec;
				idleSec += phases.idleSec;
				const first = events[0];
				const classifications = events.map((event) =>
					deriveSessionPhases([event]),
				);
				sessionRows.push({
					startHourUtc: first ? new Date(first[0]).getUTCHours() : 0,
					eventCount: state.events.length,
					phaseSec: phases.phaseSec,
					phaseEvents: phases.phaseEvents,
					waitingSec: phases.waitingSec,
					idleSec: phases.idleSec,
					merged: events.some(
						([, tool, arg]) =>
							["Bash", "bash", "shell", "local_shell", "exec_command"].includes(
								tool,
							) && shellIncludes(arg, "gh pr merge"),
					),
					verifyRuns: verifyRuns(events),
					reviewRounds: events.filter(([, tool]) =>
						["mcp__curia__request_review", "request_review"].includes(tool),
					).length,
					openedWithScout: (classifications[0]?.phaseEvents.scout ?? 0) > 0,
				});
			}

			const attributed = PHASES.reduce(
				(sum, phase) => sum + phaseSec[phase],
				0,
			);
			const unknown = attributed === 0 ? 0 : phaseSec.unknown / attributed;
			const projectsByDate = new Map<string, Set<string>>();
			for (const state of sessions.values()) {
				const dates = new Set(state.activeDates);
				if (state.firstTs !== undefined && state.lastTs !== undefined) {
					let day = Date.parse(
						`${new Date(state.firstTs).toISOString().slice(0, 10)}T00:00:00Z`,
					);
					const lastDay = Date.parse(
						`${new Date(state.lastTs).toISOString().slice(0, 10)}T00:00:00Z`,
					);
					while (day <= lastDay) {
						dates.add(new Date(day).toISOString().slice(0, 10));
						day += 86_400_000;
					}
				}
				for (const date of dates) {
					let projects = projectsByDate.get(date);
					if (!projects) {
						projects = new Set();
						projectsByDate.set(date, projects);
					}
					for (const project of state.projectWorkspaces) projects.add(project);
				}
			}

			const childrenByParent = new Map<string, SessionState[]>();
			for (const state of sessions.values()) {
				if (!state.parentSession) continue;
				const children = childrenByParent.get(state.parentSession) ?? [];
				children.push(state);
				childrenByParent.set(state.parentSession, children);
			}
			let widestFanOut = 0;
			let mostSubagents = 0;
			for (const children of childrenByParent.values()) {
				mostSubagents = Math.max(mostSubagents, children.length);
				const boundaries = children.flatMap((child) => [
					{ ts: child.firstTs ?? 0, delta: 1 },
					{ ts: child.lastTs ?? child.firstTs ?? 0, delta: -1 },
				]);
				boundaries.sort((a, b) => a.ts - b.ts || b.delta - a.delta);
				let active = 0;
				for (const boundary of boundaries) {
					active += boundary.delta;
					widestFanOut = Math.max(widestFanOut, active);
				}
			}

			const asRows = (map: Map<string, number>) =>
				[...map].map(([model, tokens]) => ({ model, tokens }));
			const localProjectWorkspaces = [
				...new Set(
					[...sessions.values()].flatMap((state) => [
						...state.projectWorkspaces,
					]),
				),
			];
			const hasDelegation =
				subagentToolCalls > 0 || mostSubagents > 0 || widestFanOut > 0;

			finished = {
				aggregateVersion: WORKFLOW_AGGREGATE_VERSION,
				harness,
				phase: {
					ruleVersion: PHASE_RULES_V1,
					publishable: phaseSessionCount > 0 && unknown <= UNKNOWN_GATE,
					sessions: sessions.size,
					phaseSec,
					phaseEvents,
					waitingSec,
					idleSec,
					unknownShare: unknown,
					sessionRows,
				},
				facts: {
					sessions: facts,
					activeDays: [...projectsByDate]
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([date, projects]) => ({
							date,
							parallelProjectCount: projects.size,
							webSearches: webSearchesByDate.get(date) ?? 0,
						})),
				},
				routing: {
					main: asRows(modelTokens.main),
					subagents: asRows(modelTokens.subagents),
				},
				...(hasDelegation
					? {
							delegation: {
								mainToolCalls,
								subagentToolCalls,
								widestFanOut,
								mostSubagents,
							},
						}
					: {}),
				activity: [...activity]
					.map(([key, events]) => {
						const [weekdayUtc, hourUtc] = key.split(":").map(Number);
						return { weekdayUtc, hourUtc, events };
					})
					.sort((a, b) => a.weekdayUtc - b.weekdayUtc || a.hourUtc - b.hourUtc),
				localProjectWorkspaces,
				localActiveProjectDays: [...projectsByDate]
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([date, projects]) => ({
						date,
						projectWorkspaces: [...projects],
					})),
			};
			sessions.clear();
			activity.clear();
			webSearchesByDate.clear();
			return finished;
		},
	};
}
