import type { StatsRead } from "../stats";
export function stats(over: Partial<StatsRead> = {}): StatsRead {
	return {
		window: {
			from: "2026-08-30",
			to: "2026-09-28",
			previousFrom: "2026-07-31",
			previousTo: "2026-08-29",
		},
		utcOffsetMinutes: 120,
		medianSession: {
			current: { low: 8, high: 16, sessions: 40 },
			previous: { low: 4, high: 8, sessions: 30 },
		},
		routing: null,
		activity: [],
		startHours: [],
		phaseShare: null,
		phaseTracks: null,
		context: null,
		inventory: {
			skills: { atoms: [], totalCalls: null, withheldNames: 0 },
			mcpServers: { atoms: [], totalCalls: null, withheldNames: 0 },
			subagents: { atoms: [], totalCalls: null, withheldNames: 0 },
		},
		git: null,
		...over,
	};
}
