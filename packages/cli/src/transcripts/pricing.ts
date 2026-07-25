// Time-aware pinned price table for API-equivalent cost.
//
// Wayfinder ticket #37 (map #29), decision 8 of the wire-format grilling #33.
//
// WHY THIS IS A LIST OF PERIODS AND NOT A FLAT MAP
// A published "API-equivalent cost" covers a rolling 30-day window, and a
// window can straddle a repricing. On 2026-09-05 the window covers Aug 6 →
// Sep 5, but `claude-sonnet-5`'s introductory rate ends Aug 31 — so 25 days
// price at $2/$10 and 5 days at $3/$15. A flat table misprices one side or the
// other for a month after every repricing, which breaks the honesty tenet the
// measured layer is built on.
//
// So each model's price is a list of effective-from ranges, and every response
// is priced at the rate in effect at ITS OWN timestamp. Cost therefore has to
// accumulate at ingest (see analyzer.ts) — summing tokens per model and pricing
// once at the end cannot express a mid-window rate change.
//
// Source: Anthropic public list prices as of 2026-07-25. Cache multipliers from
// https://platform.claude.com/docs/en/build-with-claude/prompt-caching:
//   5m cache write = 1.25x input, 1h cache write = 2x input, read = 0.1x input.

export const PRICING_TABLE_VERSION = "anthropic-list-2026-07-25";

export const CACHE_WRITE_5M_MULTIPLIER = 1.25;
export const CACHE_WRITE_1H_MULTIPLIER = 2.0;
export const CACHE_READ_MULTIPLIER = 0.1;

/**
 * End of the `claude-sonnet-5` introductory rate. Anthropic documents it as "in
 * effect through 2026-08-31", so the post-intro period opens at the following
 * UTC midnight.
 *
 * The boundary is approximated in UTC because the announcement names a date,
 * not a timezone. A response written within a few hours of the boundary can
 * therefore be priced on the wrong side of it — worth a handful of cents on a
 * single day, and the alternative (guessing US/Pacific) is no more defensible.
 */
export const SONNET_5_INTRO_ENDS_MS = Date.UTC(2026, 8, 1); // 2026-09-01T00:00:00Z

/** USD per million tokens, valid over `[from, to)`. */
export type PricePeriod = {
	/** Inclusive lower bound, epoch ms. `null` = since the model existed. */
	from: number | null;
	/** Exclusive upper bound, epoch ms. `null` = still in effect. */
	to: number | null;
	input: number;
	output: number;
};

/**
 * Only rates we can actually cite are encoded. Inventing historical periods to
 * make the table look complete would fabricate cost for old records, so every
 * model with one known rate gets one open-ended period.
 */
const PRICES: Record<string, PricePeriod[]> = {
	"claude-fable-5": [{ from: null, to: null, input: 10, output: 50 }],
	"claude-mythos-5": [{ from: null, to: null, input: 10, output: 50 }],
	"claude-opus-5": [{ from: null, to: null, input: 5, output: 25 }],
	"claude-opus-4-8": [{ from: null, to: null, input: 5, output: 25 }],
	"claude-opus-4-7": [{ from: null, to: null, input: 5, output: 25 }],
	"claude-opus-4-6": [{ from: null, to: null, input: 5, output: 25 }],
	"claude-sonnet-5": [
		{ from: null, to: SONNET_5_INTRO_ENDS_MS, input: 2, output: 10 },
		{ from: SONNET_5_INTRO_ENDS_MS, to: null, input: 3, output: 15 },
	],
	"claude-sonnet-4-6": [{ from: null, to: null, input: 3, output: 15 }],
	"claude-haiku-4-5": [{ from: null, to: null, input: 1, output: 5 }],
	// Fast mode (research preview) — Claude API only, Opus 5 / Opus 4.8 only.
	// Opus 4.7 fast mode was removed, so there is deliberately no 4-7 entry.
	"claude-opus-5#fast": [{ from: null, to: null, input: 10, output: 50 }],
	"claude-opus-4-8#fast": [{ from: null, to: null, input: 10, output: 50 }],
};

export type TokenCounts = {
	input: number;
	output: number;
	cacheWrite5m: number;
	cacheWrite1h: number;
	/** `cache_creation_input_tokens` not covered by the TTL breakdown; priced at the 5m rate. */
	cacheWriteUnsplit: number;
	cacheRead: number;
};

/**
 * Normalize an observed `message.model` into a pricing key. Handles the
 * dated-suffix variants (`claude-haiku-4-5-20251001`). The `#fast` suffix is
 * appended by the caller from `usage.speed`.
 */
export function normalizeModel(model: string): string {
	const [base, suffix] = model.split("#");
	const stripped = base.replace(/-\d{8}$/, "");
	return suffix ? `${stripped}#${suffix}` : stripped;
}

/** Drop the analyzer's synthetic `#fast` suffix, leaving the vendor-assigned id. */
export function baseModelId(modelKey: string): string {
	return modelKey.split("#")[0];
}

/**
 * The rate in effect for `modelKey` at `atMs`, or `null` when the model is
 * unknown or the timestamp predates every period we can cite.
 *
 * A `null` timestamp also yields `null`: a record with no parseable timestamp
 * cannot be priced time-awarely, and inventing a price for it (say, today's)
 * would silently attribute the wrong rate. Its tokens surface as unpriced.
 */
export function priceAt(
	modelKey: string,
	atMs: number | null,
): PricePeriod | null {
	if (atMs === null) return null;
	const periods = PRICES[modelKey];
	if (!periods) return null;
	for (const p of periods) {
		if ((p.from === null || atMs >= p.from) && (p.to === null || atMs < p.to)) {
			return p;
		}
	}
	return null;
}

/** True when we hold at least one citable rate for this model, at any time. */
export function isPricedModel(modelKey: string): boolean {
	return PRICES[modelKey] !== undefined;
}

/**
 * Cost of one response's tokens at the rate in effect at its own timestamp.
 * Returns `null` when no rate applies — the caller must surface that as
 * unpriced tokens rather than zeroing it.
 */
export function apiEquivalentCost(
	modelKey: string,
	t: TokenCounts,
	atMs: number | null,
): number | null {
	const p = priceAt(modelKey, atMs);
	if (!p) return null;
	const M = 1_000_000;
	return (
		(t.input * p.input +
			t.output * p.output +
			(t.cacheWrite5m + t.cacheWriteUnsplit) *
				p.input *
				CACHE_WRITE_5M_MULTIPLIER +
			t.cacheWrite1h * p.input * CACHE_WRITE_1H_MULTIPLIER +
			t.cacheRead * p.input * CACHE_READ_MULTIPLIER) /
		M
	);
}
