import type { EfficiencyRead } from "../EfficiencyBlock";
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

export function efficiencyTile(
	over: Partial<EfficiencyRead["tiles"][number]> = {},
): EfficiencyRead["tiles"][number] {
	return {
		id: "claude-code:cache",
		lever: "cache",
		harness: "claude-code",
		severity: "high",
		meter: 1,
		fix: "Use the 1h cache TTL",
		verdict: "Breaks are cold-starting your cache",
		keep: "Keep working in contiguous blocks",
		figure: { value: "61", label: "calls after a break" },
		evidence: [
			{ label: "calls more than 5 min after the last", value: "18%" },
			{ label: "tokens rewritten after a break", value: "4.2M" },
		],
		why: "The prompt cache expires 5 minutes after the last call.",
		action: "Set the cache TTL to 1h on API-key billing.",
		usd: 79,
		usdNote: "cache rewrites after breaks at claude-opus-5 rates",
		...over,
	};
}
export function efficiency(over: Partial<EfficiencyRead> = {}): EfficiencyRead {
	return {
		window: { from: "2026-08-30", to: "2026-09-28" },
		rulesVersion: "efficiency-rules/v1",
		tiles: [
			efficiencyTile(),
			efficiencyTile({
				id: "claude-code:tools",
				lever: "tools",
				severity: "medium",
				meter: 0.4,
				fix: "Read with offset and limit",
				verdict: "Read output floods the context",
				keep: "Keep tool output filtered before it lands",
				figure: { value: "71%", label: "of tool output is Read" },
				usd: null,
				usdNote: null,
			}),
			efficiencyTile({
				id: "claude-code:sessions",
				lever: "sessions",
				severity: "ok",
				meter: 0.02,
				fix: "Ask quick questions in a running session",
				verdict: "Sessions are worth their startup",
				keep: "Keep quick questions inside running sessions",
				figure: { value: "2", label: "sessions of 2 calls or fewer" },
				usd: null,
				usdNote: null,
			}),
		],
		recoverableUsd: 79,
		pricingTables: ["modelPrices/42-abc"],
		...over,
	};
}
