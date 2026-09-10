// The Context reading: what one harness's folded `context` block says about
// the median API call (#358).
//
// The wire carries half-octave histograms of per-call context, the sums of
// the first-call split, a max and a compaction count. This module turns a
// folded block into the figures the page prints: the median and the p90 call
// (bucket quantiles, quoted at the bucket's geometric middle), the mean
// harness and instructions parts over first calls, and the two chat figures
// as the remainder. Every figure is over the fold, never over one day.

import {
	bucketMidV2,
	type ContextDay,
	medianBucket,
	quantileBucket,
} from "./daily.js";

/**
 * The context windows a harness can run under when it logs none itself.
 * Claude Code logs no window: the catalog's `contextWindow` is the start, and
 * a call larger than it proves the next tier was on.
 */
export const CONTEXT_WINDOW_TIERS: readonly number[] = [200_000, 1_000_000];

/**
 * The window a harness ran under, from what the catalog says and what the
 * calls prove. `known` is the catalog window or null. A max call inside the
 * known window confirms it; a max call over it steps up to the smallest tier
 * that holds it, and keeps the known window when no tier does. With nothing
 * known, the smallest tier that holds the max call stands in: a Claude Code
 * harness runs under one of the tiers, and a 580K call already rules out the
 * first. Null only when no tier holds the call either.
 */
export function inferContextWindow(
	known: number | null | undefined,
	maxContext: number,
): number | null {
	const tier = [...CONTEXT_WINDOW_TIERS]
		.filter((t) => t >= maxContext)
		.sort((a, b) => a - b)[0];
	if (known === null || known === undefined || !(known > 0)) {
		return tier ?? null;
	}
	if (maxContext <= known) return known;
	return tier ?? known;
}

/** One harness's Context reading, as the page receives it. */
export type ContextReading = {
	harness: string;
	/** Tokens; null when unknown. */
	window: number | null;
	/** Main calls in the window. */
	calls: number;
	/** Bucket-median context per main call. */
	medianCall: number;
	/** Bucket p90. */
	p90Call: number;
	/** `firstCallHarnessTokens / firstCallCount`, rounded. */
	harnessTokens: number;
	/** `firstCallInstructionsTokens / firstCallCount`, rounded. */
	instructionsTokens: number;
	/** `max(0, medianCall - harnessTokens - instructionsTokens)`. */
	usualChat: number;
	/** `max(0, p90Call - harnessTokens - instructionsTokens)`. */
	longChat: number;
	compactions: number;
	/** False when no first-call split was measured. */
	breakdownAvailable?: boolean;
	/** Grok diagnostic logs retain only a subset of calls. */
	retainedCallsOnly?: boolean;
};

const asCounts = (
	rows: readonly { bucket: number; calls: number }[],
): { bucket: number; count: number }[] =>
	rows.map((row) => ({ bucket: row.bucket, count: row.calls }));

/**
 * Read one harness's folded context block. `window` is the harness's logged
 * window when the block carries one, else the caller's inference (the
 * catalog plus `inferContextWindow`), else null.
 */
export function readContextReading(
	harness: string,
	context: ContextDay,
	window: number | null,
): ContextReading {
	const main = asCounts(context.calls.main);
	const calls = main.reduce((sum, row) => sum + row.count, 0);
	const medianIndex = medianBucket(main);
	const p90Index = quantileBucket(main, 0.9);
	const medianCall =
		medianIndex === undefined ? 0 : Math.round(bucketMidV2(medianIndex));
	const p90Call =
		p90Index === undefined ? 0 : Math.round(bucketMidV2(p90Index));
	const over = (sum: number): number =>
		context.firstCallCount > 0 ? Math.round(sum / context.firstCallCount) : 0;
	const harnessTokens = over(context.firstCallHarnessTokens);
	const instructionsTokens = over(context.firstCallInstructionsTokens);
	const fixed = harnessTokens + instructionsTokens;
	return {
		harness,
		...(context.firstCallCount === 0 ? { breakdownAvailable: false } : {}),
		...(harness === "grok-build" ? { retainedCallsOnly: true } : {}),
		window: context.window ?? window,
		calls,
		medianCall,
		p90Call,
		harnessTokens,
		instructionsTokens,
		usualChat: Math.max(0, medianCall - fixed),
		longChat: Math.max(0, p90Call - fixed),
		compactions: context.compactions,
	};
}
