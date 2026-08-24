// Fit inputs: what the CLI ships per pool-metric row, and the coverage tag.
//
// Wayfinder ticket #214 (map #200). Spec ("Fit and rotation"):
// "Fit splits between the machine and the server. The CLI ships value,
// coverage, band, and rule id per row, and stays the only source of measured
// values. The server computes fit, applies the rotation limit, and applies
// the owner pins and hides, because the swap history and the owner overrides
// are server state." So this module stops at the inputs - surprise, fit
// itself, and rotation belong to ticket #218.
//
// "A row ships when its measurement exists. A missing measurement stays
// absent, so no separate first-ship list exists" (spec) - `buildFitInputs`
// drops a metric outright rather than shipping a null/zero row for it.

import { type Band, METRIC_RULES, type WorkflowFacts } from "./metricRules.js";
import { type HarnessName, harnessLabel } from "./types.js";

export type FitInputRow = {
	metricId: string;
	ruleVersion: string;
	value: number;
	band: Band;
	/** Share of `syncedHarnesses` this metric counts, 0..1. A Git-derived metric always reads 1 (spec, "Fit"). */
	coverage: number;
	/**
	 * "The label on a metric that names the harnesses it counts, when not all
	 * synced harnesses record it" (CONTEXT.md). `undefined` when coverage is
	 * complete, so nothing renders.
	 */
	coverageTag: string | undefined;
};

/** Share of `syncedHarnesses` a rule's declared support counts, 0..1. */
export function coverageFor(
	harnessSupport: readonly HarnessName[] | "all",
	syncedHarnesses: readonly HarnessName[],
): number {
	if (harnessSupport === "all") return 1;
	if (syncedHarnesses.length === 0) return 0;
	const supported = new Set(harnessSupport);
	const counted = syncedHarnesses.filter((h) => supported.has(h));
	return counted.length / syncedHarnesses.length;
}

/** The coverage tag naming the counted harnesses, or `undefined` when every synced harness counts. */
export function coverageTag(
	harnessSupport: readonly HarnessName[] | "all",
	syncedHarnesses: readonly HarnessName[],
): string | undefined {
	if (harnessSupport === "all") return undefined;
	const supported = new Set(harnessSupport);
	const counted = syncedHarnesses.filter((h) => supported.has(h));
	if (counted.length === 0 || counted.length === syncedHarnesses.length)
		return undefined;
	return `counts: ${counted.map(harnessLabel).join(" · ")}`;
}

/**
 * Evaluates every pool metric against `facts` and ships a row for each one
 * whose measurement exists. `syncedHarnesses` is the set the CLI actually
 * synced this run - coverage and the tag are both relative to it, not to
 * every harness the tool knows about.
 */
export function buildFitInputs(
	facts: WorkflowFacts,
	syncedHarnesses: readonly HarnessName[],
): FitInputRow[] {
	const rows: FitInputRow[] = [];
	for (const rule of METRIC_RULES) {
		const value = rule.evaluate(facts);
		if (value === undefined) continue;
		rows.push({
			metricId: rule.id,
			ruleVersion: rule.version,
			value,
			band: rule.band,
			coverage: coverageFor(rule.harnessSupport, syncedHarnesses),
			coverageTag: coverageTag(rule.harnessSupport, syncedHarnesses),
		});
	}
	return rows;
}
