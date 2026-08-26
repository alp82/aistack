// The versioned component rule pool: `component-rules/v2`.
//
// Wayfinder ticket #218 (map #200) declared v1 so a component could compete
// for a podium slot beside a pool metric. Ticket #277 took fit off the page,
// and #285 folded the wire into windows, so v2 is a smaller claim: each
// component names ONE headline figure over the folded window, with a band the
// API carries and nothing ranks by. The order on the page is fixed
// (`workflowRows.ts`).
//
// A COMPONENT RULE MEASURES NOTHING NEW. Every value below is arithmetic over
// atoms the machine already shipped, which keeps the CLI the only source of
// measured atoms.
//
// BAND VALUES ARE DEFAULTS, NOT PROVEN DATA, the caveat `metric-rules/v2`
// carries.

import { bucketMid, medianBucket } from "./daily.js";
import type { MetricUnit } from "./metricRules.js";
import type { KitReading, WorkflowReading } from "./reading.js";
import { modalStartHour, playbookHarnesses } from "./reading.js";

export const COMPONENT_RULES_V2 = "component-rules/v2";

export type ComponentInput = {
	reading: WorkflowReading;
	/** Inventory for the same machine. Absent when no payload carried one. */
	kit?: KitReading;
};

export type ComponentRule = {
	id: string;
	version: string;
	/** Sentence fragment completing "<value> <label>", like a metric rule's. */
	label: string;
	unit: MetricUnit;
	band: { low: number; high: number };
	/** The measurement, or `undefined` when this reading cannot support the row. */
	evaluate: (input: ComponentInput) => number | undefined;
	/** Share of the machine's synced harnesses the row counts, 0..1. */
	coverage: (input: ComponentInput) => number;
};

/** Git history counts every synced harness, whatever the harness itself records (spec). */
const gitCoverage = (): number => 1;

function harnessShare(
	input: ComponentInput,
	counts: (input: ComponentInput) => number,
): number {
	const synced = input.reading.harnesses.length;
	if (synced === 0) return 0;
	return counts(input) / synced;
}

function topShare(entries: readonly { value: number }[]): number | undefined {
	const total = entries.reduce((sum, entry) => sum + entry.value, 0);
	if (total <= 0) return undefined;
	const top = Math.max(...entries.map((entry) => entry.value));
	return top / total;
}

export const COMPONENT_RULES: readonly ComponentRule[] = [
	{
		id: "activity-heatmap",
		version: COMPONENT_RULES_V2,
		label: "of events fall in the three busiest hours of the day",
		unit: "share",
		// Three of twenty-four hours is an eighth of the clock. A day spread evenly
		// lands near it; a night owl runs far above it.
		band: { low: 0.125, high: 0.35 },
		evaluate: ({ reading }) => {
			const byHour = new Map<number, number>();
			for (const harness of reading.harnesses) {
				for (const cell of harness.activity) {
					byHour.set(
						cell.hourUtc,
						(byHour.get(cell.hourUtc) ?? 0) + cell.events,
					);
				}
			}
			const total = [...byHour.values()].reduce((sum, n) => sum + n, 0);
			if (total <= 0) return undefined;
			const busiest = [...byHour.values()].sort((a, b) => b - a).slice(0, 3);
			return busiest.reduce((sum, n) => sum + n, 0) / total;
		},
		coverage: (input) =>
			harnessShare(
				input,
				({ reading }) =>
					reading.harnesses.filter((harness) => harness.activity.length > 0)
						.length,
			),
	},
	{
		id: "start-hours",
		version: COMPONENT_RULES_V2,
		label: "is the most common start hour",
		unit: "hour",
		// A band on a clock face means little; the row is never ranked, and the
		// figure is a position rather than a size. Kept for shape.
		band: { low: 9, high: 18 },
		evaluate: ({ reading }) => modalStartHour(reading),
		coverage: (input) =>
			harnessShare(
				input,
				({ reading }) =>
					reading.harnesses.filter((harness) => harness.startHours.length > 0)
						.length,
			),
	},
	{
		id: "phase-playbook",
		version: COMPONENT_RULES_V2,
		label: "median measured session",
		unit: "minutes",
		band: { low: 10, high: 60 },
		evaluate: ({ reading }) => {
			const bucket = medianBucket(
				playbookHarnesses(reading).flatMap((harness) =>
					(harness.phase?.lengths ?? []).map((row) => ({
						bucket: row.bucket,
						count: row.sessions,
					})),
				),
			);
			return bucket === undefined ? undefined : bucketMid(bucket);
		},
		coverage: (input) =>
			harnessShare(input, ({ reading }) => playbookHarnesses(reading).length),
	},
	{
		id: "git-ledger",
		version: COMPONENT_RULES_V2,
		label: "of changed lines are removals",
		unit: "share",
		// Most work adds more than it takes away. A ledger that removes as much as
		// it adds is the surprising one, and so is one that never removes.
		band: { low: 0.15, high: 0.35 },
		evaluate: ({ reading }) => {
			const changed = reading.git.additions + reading.git.removals;
			return changed > 0 ? reading.git.removals / changed : undefined;
		},
		coverage: gitCoverage,
	},
	{
		id: "coding-languages",
		version: COMPONENT_RULES_V2,
		label: "of changed lines are one file type",
		unit: "share",
		band: { low: 0.35, high: 0.7 },
		evaluate: ({ reading }) => {
			// The withheld lines are a real bucket, not a rounding loss: they belong
			// in the denominator, or a stack whose top language is unapproved would
			// read as more concentrated than it is.
			const named = reading.git.changedLinesByExtension.map((row) => ({
				value: row.changedLines,
			}));
			const total =
				named.reduce((sum, row) => sum + row.value, 0) +
				reading.git.withheldExtensionLines;
			if (total <= 0 || named.length === 0) return undefined;
			return Math.max(...named.map((row) => row.value)) / total;
		},
		coverage: gitCoverage,
	},
	{
		id: "kit",
		version: COMPONENT_RULES_V2,
		label: "of skill and MCP calls go to one artifact",
		unit: "share",
		band: { low: 0.15, high: 0.4 },
		evaluate: ({ kit }) => {
			if (!kit) return undefined;
			const byName = new Map<string, number>();
			for (const harness of kit) {
				for (const atom of [...harness.skills, ...harness.mcpServers]) {
					byName.set(atom.name, (byName.get(atom.name) ?? 0) + atom.callShare);
				}
			}
			return topShare([...byName.values()].map((share) => ({ value: share })));
		},
		coverage: (input) =>
			harnessShare(
				input,
				({ kit }) =>
					(kit ?? []).filter(
						(harness) =>
							harness.skills.length > 0 || harness.mcpServers.length > 0,
					).length,
			),
	},
	{
		id: "model-routing",
		version: COMPONENT_RULES_V2,
		label: "of main-loop tokens run on one model",
		unit: "share",
		band: { low: 0.4, high: 0.85 },
		evaluate: ({ reading }) => {
			const main = reading.harnesses.flatMap((harness) => [
				...(harness.routing?.main ?? []),
			]);
			const byModel = new Map<string, number>();
			for (const row of main) {
				byModel.set(row.model, (byModel.get(row.model) ?? 0) + row.tokens);
			}
			return topShare(
				[...byModel.values()].map((tokens) => ({ value: tokens })),
			);
		},
		coverage: (input) =>
			harnessShare(
				input,
				({ reading }) =>
					reading.harnesses.filter((harness) => harness.routing).length,
			),
	},
	{
		id: "delegation",
		version: COMPONENT_RULES_V2,
		label: "of tool calls run inside a subagent",
		unit: "share",
		band: { low: 0, high: 0.3 },
		evaluate: ({ reading }) => {
			let main = 0;
			let subagents = 0;
			for (const harness of reading.harnesses) {
				main += harness.delegation?.mainToolCalls ?? 0;
				subagents += harness.delegation?.subagentToolCalls ?? 0;
			}
			const total = main + subagents;
			return total > 0 ? subagents / total : undefined;
		},
		coverage: (input) =>
			harnessShare(
				input,
				({ reading }) =>
					reading.harnesses.filter((harness) => harness.delegation).length,
			),
	},
];

export function componentRule(id: string): ComponentRule | undefined {
	return COMPONENT_RULES.find((rule) => rule.id === id);
}
