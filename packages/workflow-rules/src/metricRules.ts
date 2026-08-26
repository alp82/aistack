// The versioned metric rule pool: `metric-rules/v2`.
//
// Wayfinder ticket #214 (map #200) declared v1 over per-session facts the CLI
// reduced on the machine. Ticket #285 moved the wire to daily rows of
// combinable atoms and moved EVERY evaluation to the server, over the folded
// window (`daily.ts`). That is v2: the same pool, minus the two rows #277
// dropped (model switches, effort switches), with the effort and turn rows
// reshaped to what a histogram can say.
//
// A rule declares what it measures (`evaluate`), which harnesses can supply
// the signal (`counts`, for coverage and the coverage tag), and the typical
// band the value sits against. The band is DATA THE PAGE DOES NOT RANK BY
// (#277): fit stays in the API as a number, and the order on the page is the
// fixed editorial one in `workflowRows.ts`.
//
// BAND VALUES ARE DEFAULTS, NOT PROVEN DATA. No calibration run has happened,
// and a rule version bump corrects one once real synced readings are in.

import type { HarnessDay } from "./daily.js";
import { bucketMid, median, medianBucket } from "./daily.js";
import type { WorkflowReading } from "./reading.js";

export const METRIC_RULES_V2 = "metric-rules/v2";

export type MetricUnit = "share" | "count" | "minutes" | "hour";

/** The typical range surprise is measured against, in the metric's own unit. */
export type Band = { low: number; high: number };

export type MetricRule = {
	id: string;
	version: string;
	/** Sentence fragment completing "<value> <label>", e.g. "of commits land between 23:00 and 03:00". */
	label: string;
	kind: "exact" | "proxy";
	unit: MetricUnit;
	band: Band;
	/**
	 * True for a harness whose fold carries this metric's signal, or `"all"`
	 * when the signal comes from Git history, which counts every synced harness
	 * regardless of what the harness itself records (spec, "Fit").
	 */
	counts: ((harness: HarnessDay) => boolean) | "all";
	evaluate: (reading: WorkflowReading) => number | undefined;
};

export const METRIC_RULES: readonly MetricRule[] = [
	{
		id: "late-night-commits",
		version: METRIC_RULES_V2,
		label: "of commits land between 23:00 and 03:00",
		kind: "exact",
		unit: "share",
		counts: "all",
		band: { low: 0, high: 0.15 },
		evaluate: (reading) => {
			const git = reading.git;
			if (git.commits === 0) return undefined;
			return git.lateNightCommits / git.commits;
		},
	},
	{
		id: "parallel-projects",
		version: METRIC_RULES_V2,
		label: "projects run in parallel on a median active day",
		kind: "proxy",
		unit: "count",
		counts: "all",
		band: { low: 1, high: 1.5 },
		evaluate: (reading) => median(reading.parallelProjectDays),
	},
	{
		id: "thinking-share",
		version: METRIC_RULES_V2,
		label: "of response tokens are thinking",
		kind: "proxy",
		unit: "share",
		counts: (harness) => harness.thinking !== undefined,
		band: { low: 0.1, high: 0.3 },
		evaluate: (reading) => {
			let thinking = 0;
			let response = 0;
			for (const harness of reading.harnesses) {
				thinking += harness.thinking?.thinkingTokens ?? 0;
				response += harness.thinking?.responseTokens ?? 0;
			}
			return response > 0 ? thinking / response : undefined;
		},
	},
	{
		id: "effort-levels",
		version: METRIC_RULES_V2,
		label: "of turns run at high effort",
		kind: "exact",
		unit: "share",
		counts: (harness) => harness.effort !== undefined,
		band: { low: 0.2, high: 0.5 },
		evaluate: (reading) => {
			let high = 0;
			let total = 0;
			for (const harness of reading.harnesses) {
				for (const row of harness.effort ?? []) {
					total += row.turns;
					if (row.level === "high") high += row.turns;
				}
			}
			return total > 0 ? high / total : undefined;
		},
	},
	{
		id: "turn-duration",
		version: METRIC_RULES_V2,
		label: "median turn duration",
		kind: "exact",
		unit: "minutes",
		counts: (harness) => harness.turnDurations !== undefined,
		band: { low: 0.25, high: 2 },
		evaluate: (reading) => {
			const bucket = medianBucket(
				reading.harnesses.flatMap((harness) =>
					(harness.turnDurations?.buckets ?? []).map((row) => ({
						bucket: row.bucket,
						count: row.turns,
					})),
				),
			);
			return bucket === undefined ? undefined : bucketMid(bucket) / 60;
		},
	},
	{
		id: "question-back-share",
		version: METRIC_RULES_V2,
		label: "of turns end with a question back to the human",
		kind: "proxy",
		unit: "share",
		counts: (harness) => harness.questions !== undefined,
		band: { low: 0, high: 0.15 },
		evaluate: (reading) => {
			let asked = 0;
			let turns = 0;
			for (const harness of reading.harnesses) {
				asked += harness.questions?.asked ?? 0;
				turns += harness.questions?.turns ?? 0;
			}
			return turns > 0 ? asked / turns : undefined;
		},
	},
	{
		id: "web-searches-per-active-day",
		version: METRIC_RULES_V2,
		label: "web searches per active day, inside the harness",
		kind: "proxy",
		unit: "count",
		counts: (harness) => harness.webSearches !== undefined,
		band: { low: 0, high: 4 },
		evaluate: (reading) => {
			if (reading.webSearchDays === 0) return undefined;
			const total = reading.harnesses.reduce(
				(sum, harness) => sum + (harness.webSearches ?? 0),
				0,
			);
			return total / reading.webSearchDays;
		},
	},
];

export function metricRule(id: string): MetricRule | undefined {
	return METRIC_RULES.find((m) => m.id === id);
}
