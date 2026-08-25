// The sixteen rows of one reading: nine pool metrics and seven components.
//
// Wayfinder ticket #218 (map #200). This is the join between the two rule pools
// and the ranking: `metric-rules/v1` values arrive measured on the wire,
// `component-rules/v1` values are derived from the same reading here, and both
// enter `rankWorkflowRows` as the same shape.

import type { ComponentInput } from "./componentRules.js";
import { COMPONENT_RULES } from "./componentRules.js";
import type { WorkflowRowInput } from "./fitRanking.js";
import { metricRule } from "./metricRules.js";

/** `metric:late-night-commits`, `component:git-ledger`. Stable: a pin is keyed on it. */
export function metricRowId(metricId: string): string {
	return `metric:${metricId}`;
}

export function componentRowId(componentId: string): string {
	return `component:${componentId}`;
}

export type WorkflowRowSet = {
	rows: WorkflowRowInput[];
	/**
	 * Metric ids this build has no rule for, so no row could describe them.
	 *
	 * A CLI newer than the server can ship one. The value is real, but the label
	 * and the band that make it a row are the SERVER's half of the rule, so the
	 * row is dropped rather than printed as a bare number - and counted here, so
	 * a drop is visible rather than silent.
	 */
	unknownMetricIds: string[];
};

/**
 * Build the row set for one reading.
 *
 * "A row ships when its measurement exists. A missing measurement stays absent,
 * so no separate first-ship list exists" (spec). Both pools follow it: the CLI
 * omits a metric it could not measure, and a component rule returns undefined
 * for a reading that cannot support it.
 */
export function buildWorkflowRows(input: ComponentInput): WorkflowRowSet {
	const rows: WorkflowRowInput[] = [];
	const unknownMetricIds: string[] = [];

	for (const metric of input.reading.metrics) {
		const rule = metricRule(metric.metricId);
		if (!rule) {
			unknownMetricIds.push(metric.metricId);
			continue;
		}
		rows.push({
			rowId: metricRowId(metric.metricId),
			kind: "metric",
			ruleId: metric.metricId,
			// The version the MACHINE used, not this build's. A bumped rule that
			// changed its band is why the band travels with the value.
			ruleVersion: metric.ruleVersion,
			label: rule.label,
			unit: rule.unit,
			value: metric.value,
			band: metric.band,
			coverage: metric.coverage,
			...(metric.coverageTag === undefined
				? {}
				: { coverageTag: metric.coverageTag }),
		});
	}

	for (const rule of COMPONENT_RULES) {
		const value = rule.evaluate(input);
		if (value === undefined) continue;
		rows.push({
			rowId: componentRowId(rule.id),
			kind: "component",
			ruleId: rule.id,
			ruleVersion: rule.version,
			label: rule.label,
			unit: rule.unit,
			value,
			band: rule.band,
			coverage: rule.coverage(input),
		});
	}

	return { rows, unknownMetricIds };
}
