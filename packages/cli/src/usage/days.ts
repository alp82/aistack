// The per-day usage wire, built from the adapters' per-day seam (#307, map
// #302, ADR-0010). One `UsageHarnessDay` per (harness, UTC date), holding only
// combinable atoms: session counts, hashed project keys, per-model token sums,
// exact dollars priced at each response's own timestamp. No share and no mean
// leaves here; the server folds a window with `foldUsageDays`.
//
// The seam is `Aggregate.usageDays` and `Aggregate.sessionStarts` in
// ../harness/shared/aggregate.ts, filled by the SAME response stream that
// fills the window totals, so a fold over these days equals the snapshot's
// figures up to rounding. Everything here is pure.

import { baseModelId, pricingTableFor } from "@aistack/pricing";
import type {
	MeasuredDay,
	UsageDay,
	UsageHarnessDay,
	UsageModelDay,
	UsageTokens,
	WorkflowDay,
} from "@aistack/workflow-rules";
import {
	type Aggregate,
	countsTotal,
	utcDateOf,
} from "../harness/shared/aggregate.js";
import { sanitizeModelId } from "../harness/shared/payload.js";

/** Dollars keep six places: exact enough for a per-day sum, stable across runs. */
const round6 = (n: number): number => Math.round(n * 1_000_000) / 1_000_000;

export type BuildUsageDaysInput = {
	/** The payload discriminator, e.g. `"claude-code"`. */
	harness: string;
	aggregate: Aggregate;
	/** THE CONSENT GATE for dollars: off leaves `usd` and `pricingTable` out of the bytes. */
	publishCost: boolean;
	/** Resolve one local project directory to its persistent opaque id. */
	projectWorkspaceId: (directory: string) => string;
};

type ModelAcc = {
	tokens: UsageTokens & {
		cacheWriteTtl: { fiveMinute: number; oneHour: number; unsplit: number };
	};
	costUSD: number;
	unpricedTokens: number;
	table: string | null;
};

/**
 * One harness's usage, one row per UTC date it touched. A date with sessions
 * but no response, or a response but no session start, still gets a row: the
 * fold counts a day active when a session started on it.
 */
export function buildUsageDays(
	input: BuildUsageDaysInput,
): Map<string, UsageHarnessDay> {
	const { aggregate: agg, harness, publishCost, projectWorkspaceId } = input;

	const sessionsByDay = new Map<string, number>();
	for (const startMs of agg.sessionStarts.values()) {
		const date = utcDateOf(startMs);
		sessionsByDay.set(date, (sessionsByDay.get(date) ?? 0) + 1);
	}

	const dates = [
		...new Set([...agg.usageDays.keys(), ...sessionsByDay.keys()]),
	].sort();

	const out = new Map<string, UsageHarnessDay>();
	for (const date of dates) {
		const acc = agg.usageDays.get(date);
		// The fast-mode key (`#fast`) is ours, not the vendor's: merge rows onto
		// the base id the way the snapshot's `groupModels` does. Dollars stay
		// exact because they were priced per response at the fast rate.
		const groups = new Map<string, ModelAcc>();
		let unpriced = 0;
		for (const [modelKey, m] of acc?.models ?? []) {
			const id = sanitizeModelId(baseModelId(modelKey));
			let g = groups.get(id);
			if (!g) {
				g = {
					tokens: {
						input: 0,
						output: 0,
						cacheWrite: 0,
						cacheRead: 0,
						cacheWriteTtl: { fiveMinute: 0, oneHour: 0, unsplit: 0 },
					},
					costUSD: 0,
					unpricedTokens: 0,
					table: null,
				};
				groups.set(id, g);
			}
			g.table ??= pricingTableFor(modelKey);
			g.tokens.input += m.counts.input;
			g.tokens.output += m.counts.output;
			g.tokens.cacheRead += m.counts.cacheRead;
			g.tokens.cacheWrite +=
				m.counts.cacheWrite5m +
				m.counts.cacheWrite1h +
				m.counts.cacheWriteUnsplit;
			g.tokens.cacheWriteTtl.fiveMinute += m.counts.cacheWrite5m;
			g.tokens.cacheWriteTtl.oneHour += m.counts.cacheWrite1h;
			g.tokens.cacheWriteTtl.unsplit += m.counts.cacheWriteUnsplit;
			g.costUSD += m.costUSD;
			g.unpricedTokens += m.unpricedTokens;
			unpriced += m.unpricedTokens;
		}

		const models: UsageModelDay[] = [...groups.entries()]
			.map(([model, g]) => {
				const { cacheWriteTtl, ...plain } = g.tokens;
				const tokens: UsageTokens =
					g.tokens.cacheWrite > 0 ? { ...plain, cacheWriteTtl } : plain;
				const row: UsageModelDay = { model, tokens };
				// Absent, not zero (#33 decision 11): a model with an unpriced
				// response that day carries no dollars, and its tokens sit in
				// `excludedTokens.unpriced`. Dollars and their citation travel
				// together (#136).
				if (
					publishCost &&
					g.unpricedTokens === 0 &&
					g.table !== null &&
					countsTotalOf(tokens) > 0
				) {
					row.usd = round6(g.costUSD);
					row.pricingTable = g.table;
				}
				return row;
			})
			.filter((row) => countsTotalOf(row.tokens) > 0)
			.sort(
				(a, b) =>
					countsTotalOf(b.tokens) - countsTotalOf(a.tokens) ||
					a.model.localeCompare(b.model),
			);

		out.set(date, {
			harness,
			sessions: sessionsByDay.get(date) ?? 0,
			projectKeys: [
				...new Set([...(acc?.projectDirs ?? [])].map(projectWorkspaceId)),
			].sort(),
			models,
			subagentTokens: acc?.subagentTokens ?? 0,
			excludedTokens: { unpriced, synthetic: acc?.syntheticTokens ?? 0 },
		});
	}
	return out;
}

const countsTotalOf = (t: UsageTokens): number =>
	t.input + t.output + t.cacheWrite + t.cacheRead;

/** Join several harnesses' day maps into one `UsageDay` per date. */
export function mergeUsageDays(
	perHarness: readonly Map<string, UsageHarnessDay>[],
): Map<string, UsageDay> {
	const out = new Map<string, UsageDay>();
	const dates = [
		...new Set(perHarness.flatMap((days) => [...days.keys()])),
	].sort();
	for (const date of dates) {
		const harnesses: UsageHarnessDay[] = [];
		for (const days of perHarness) {
			const day = days.get(date);
			if (day) harnesses.push(day);
		}
		out.set(date, { harnesses });
	}
	return out;
}

/**
 * Join usage days and workflow days by date into the rows the wire carries,
 * limited to `[from, to]` inclusive (`YYYY-MM-DD`). A date outside the window
 * is a clock-skewed or restored transcript and never becomes a row.
 */
export function buildMeasuredDays(input: {
	usage: Map<string, UsageDay>;
	workflow?: readonly WorkflowDay[];
	from: string;
	to: string;
}): MeasuredDay[] {
	const workflowByDate = new Map<string, WorkflowDay>();
	for (const day of input.workflow ?? []) workflowByDate.set(day.date, day);
	const dates = [...new Set([...input.usage.keys(), ...workflowByDate.keys()])]
		.filter(
			(d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= input.from && d <= input.to,
		)
		.sort();
	return dates.map((date) => {
		const usage = input.usage.get(date);
		const workflow = workflowByDate.get(date);
		return {
			date,
			...(usage ? { usage } : {}),
			...(workflow ? { workflow } : {}),
		};
	});
}

/** `input + output + cacheWrite + cacheRead` over a `TokenCounts`, for tests. */
export { countsTotal };
