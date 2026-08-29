// Time-aware pinned price table for API-equivalent cost.
//
// Wayfinder ticket #37 (map #29), decision 8 of the wire-format grilling #33.
// Moved out of the CLI by ticket #93 (map #76).
//
// WHY THIS IS A PACKAGE AND NOT A CLI FILE
// Two programs price the same tokens. The CLI prices each response at ingest,
// where the per-response timestamp still exists. The backend re-prices a
// published snapshot at READ time, to fill the gaps a stale CLI table left
// behind - one day of table drift published a stack at $14,764 when the same
// tokens are worth at least $167,331 (#93). Two copies of a price table drift
// against each other by construction, so there is one copy and both import it.
//
// WHY THIS IS A LIST OF PERIODS AND NOT A FLAT MAP
// A published "API-equivalent cost" covers a rolling 30-day window, and a
// window can straddle a repricing. On 2026-09-05 the window covers Aug 6 →
// Sep 5, but `claude-sonnet-5`'s introductory rate ends Aug 31 - so 25 days
// price at $2/$10 and 5 days at $3/$15. A flat table misprices one side or the
// other for a month after every repricing, which breaks the honesty tenet the
// measured layer is built on.
//
// So each model's price is a list of effective-from ranges, and every response
// is priced at the rate in effect at ITS OWN timestamp. Cost therefore has to
// accumulate at ingest (see analyzer.ts) - summing tokens per model and pricing
// once at the end cannot express a mid-window rate change.
//
// Sources: Anthropic public list prices as of 2026-07-25 (cache multipliers
// from https://platform.claude.com/docs/en/build-with-claude/prompt-caching:
// 5m cache write = 1.25x input, 1h cache write = 2x input, read = 0.1x input)
// and OpenAI public list prices as of 2026-08-02
// (https://developers.openai.com/api/docs/pricing - cached input is 10% of
// input, the same multiplier `cacheRead` already uses; Codex reports no cache
// writes, so the write multipliers never fire for OpenAI rows).
// Google public list prices as of 2026-08-09
// (https://ai.google.dev/gemini-api/docs/pricing) were added by ticket #123.
//
// A read-time estimate cites the table of the model it priced, which is why the
// table id sits on the rate rather than beside it.
//
// WHY A KEY CAN CARRY A PROVIDER
// Claude Code and Codex each speak to one vendor, so a bare model id names a
// rate without ambiguity. opencode and pi-mono route many providers, and two of
// them RE-SERVE another vendor's models under that vendor's own slug: the
// opencode-zen gateway and github-copilot both emit `gemini-3-pro-preview`, at
// prices no list page states (ticket #122). Pricing a re-served model at the
// vendor's list rate would invent a figure and could overstate, which the
// lower-bound tenet forbids.
//
// So a multi-provider adapter keys its rows `provider:model`, and only a
// provider this table maps to a vendor reaches that vendor's rates. Everything
// else - gateways, unknown providers - holds no rate and lands in
// `unpricedTokens`, which is the honest outcome and needs no new machinery.
//
// The separator is `:` and not `/` on purpose: `sanitizeModelId` in the CLI
// payload rewrites `/` to `-`, so a slash-keyed id would reach the backend as a
// different string than the one this table holds, and the read-time re-pricer
// would miss it.
//
// A LOCAL MODEL IS FREE, WHICH IS NOT THE SAME FACT AS UNPRICED
// `ollama:qwen3-coder` costs nothing per token. `openrouter:qwen3-coder` costs
// something this table cannot name. Both used to look identical - no row, no
// rate, tokens excluded from coverage - so a local run read as a hole in the
// table. Local providers now hold a real zero rate, cited as
// `LOCAL_PRICING_TABLE_VERSION`. Their tokens count as covered and add $0.
//
// WHERE THE RATES LIVE NOW (#336, ADR-0012)
// The constants below are the BUNDLED FALLBACK. The live table is the Convex
// `modelPrices` table, served to the CLI at `/api/prices` and layered over
// these constants by `layeredPricer`. `table.ts` holds the row shape and the
// lookup both sides share; this file holds the constants and the module-level
// functions the adapters call, which read whichever pricer is active.

export const PRICING_TABLE_VERSION = "anthropic-list-2026-07-25";
export const OPENAI_PRICING_TABLE_VERSION = "openai-list-2026-08-02";
export const GOOGLE_PRICING_TABLE_VERSION = "google-list-2026-08-09";
/**
 * The id the CLI prints when it priced against the bundled constants rather
 * than a table the server served (#336). Bump it when a constant changes.
 */
export const BUNDLED_PRICE_TABLE_ID = "bundled-2026-08-29";

export {
	LOCAL_PRICING_TABLE_VERSION,
	PROVIDER_SEPARATOR,
	PriceIndex,
	type PricePeriod,
	type PriceRow,
	Pricer,
	type PriceTable,
	parseMeasuredId,
	parsePriceTable,
	priceTableId,
	splitModelKey,
	type Vendor,
} from "./table.js";

import {
	PROVIDER_SEPARATOR,
	PriceIndex,
	type PricePeriod,
	type PriceRow,
	Pricer,
	type PriceTable,
	splitModelKey,
	type Vendor,
} from "./table.js";

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
 * therefore be priced on the wrong side of it - worth a handful of cents on a
 * single day, and the alternative (guessing US/Pacific) is no more defensible.
 */
export const SONNET_5_INTRO_ENDS_MS = Date.UTC(2026, 8, 1); // 2026-09-01T00:00:00Z

/**
 * How a vendor charges for cache traffic, as multipliers on its input rate.
 *
 * Only the bundled constants are written this way. A served period carries
 * absolute cache rates (ADR-0012 decision 4), and `cacheMultipliersFor` derives
 * the multipliers back from them for callers that still want the ratio.
 */
export type CacheMultipliers = {
	write5m: number;
	write1h: number;
	read: number;
};

const DEFAULT_CACHE_MULTIPLIERS: CacheMultipliers = {
	write5m: CACHE_WRITE_5M_MULTIPLIER,
	write1h: CACHE_WRITE_1H_MULTIPLIER,
	read: CACHE_READ_MULTIPLIER,
};

/**
 * Cached input is 10% of input; a write is charged as plain input. Google
 * bills cache storage by the hour instead, which this table cannot see, so a
 * Google figure stays below the true one rather than above it.
 */
const GOOGLE_CACHE_MULTIPLIERS: CacheMultipliers = {
	write5m: 1.0,
	write1h: 1.0,
	read: 0.1,
};

/** A bundled rate, before it is rendered into dated rows. */
type BundledPeriod = {
	from: number | null;
	input: number;
	output: number;
};

type PriceEntry = {
	vendor: Vendor;
	/** The citation printed next to any dollar figure these rates produce. */
	table: string;
	periods: BundledPeriod[];
	cache: CacheMultipliers;
};

const anthropic = (periods: BundledPeriod[]): PriceEntry => ({
	vendor: "anthropic",
	table: PRICING_TABLE_VERSION,
	periods,
	cache: DEFAULT_CACHE_MULTIPLIERS,
});
const openai = (periods: BundledPeriod[]): PriceEntry => ({
	vendor: "openai",
	table: OPENAI_PRICING_TABLE_VERSION,
	periods,
	cache: DEFAULT_CACHE_MULTIPLIERS,
});
const google = (periods: BundledPeriod[]): PriceEntry => ({
	vendor: "google",
	table: GOOGLE_PRICING_TABLE_VERSION,
	periods,
	cache: GOOGLE_CACHE_MULTIPLIERS,
});
const flat = (input: number, output: number): BundledPeriod[] => [
	{ from: null, input, output },
];

/**
 * The priced lanes (ADR-0012 decision 7): measured ids that carry a rate but
 * name no model a person can choose. They live here and never in the catalog
 * or in `modelPrices`, so the seed migration and the served table skip them.
 */
export const PRICED_LANES: ReadonlySet<string> = new Set(["codex-auto-review"]);

/**
 * Only rates we can actually cite are encoded. Inventing historical periods to
 * make the table look complete would fabricate cost for old records, so every
 * model with one known rate gets one open-ended period.
 *
 * Where models.dev and a list page disagreed on 2026-08-29, models.dev won
 * (ADR-0012 decision 12): `gpt-5.6-sol` and `gemini-3.6-flash` below.
 */
const PRICES: Record<string, PriceEntry> = {
	"claude-fable-5": anthropic(flat(10, 50)),
	"claude-mythos-5": anthropic(flat(10, 50)),
	"claude-opus-5": anthropic(flat(5, 25)),
	"claude-opus-4-8": anthropic(flat(5, 25)),
	"claude-opus-4-7": anthropic(flat(5, 25)),
	"claude-opus-4-6": anthropic(flat(5, 25)),
	"claude-sonnet-5": anthropic([
		{ from: null, input: 2, output: 10 },
		{ from: SONNET_5_INTRO_ENDS_MS, input: 3, output: 15 },
	]),
	"claude-sonnet-4-6": anthropic(flat(3, 15)),
	"claude-haiku-4-5": anthropic(flat(1, 5)),
	// Fast mode (research preview) - Claude API only, Opus 5 / Opus 4.8 only.
	// Opus 4.7 fast mode was removed, so there is deliberately no 4-7 entry.
	"claude-opus-5#fast": anthropic(flat(10, 50)),
	"claude-opus-4-8#fast": anthropic(flat(10, 50)),
	// OpenAI (Codex) - standard-context tier (<272K; observed context window is
	// 258,400).
	"gpt-5.5": openai(flat(5, 30)),
	"gpt-5.4": openai(flat(2.5, 15)),
	"gpt-5.4-mini": openai(flat(0.75, 4.5)),
	"gpt-5.3-codex": openai(flat(1.75, 14)),
	// The gpt-5.6 family launched 2026-07-29; Terra and Luna were repriced on
	// 2026-07-30 (-20% / -80%). The one-day launch rates are not on the list
	// page and are NOT encoded - a July-29 Terra/Luna record underprices for
	// one day rather than carrying a rate we cannot cite (#72).
	// Sol: models.dev reports $4 / $20 on 2026-08-29; the earlier $5 / $30 is
	// not dated, so the lower rate prices the whole period (lower bound).
	"gpt-5.6-sol": openai(flat(4, 20)),
	"gpt-5.6-terra": openai(flat(2, 12)),
	"gpt-5.6-luna": openai(flat(0.2, 1.2)),
	// NOT on OpenAI's list page - an internal Codex routing label with no
	// official price (openai/codex#20981). Rate is the aggregator consensus
	// ($2.50 / $15.00), scoped in explicitly by ticket #72 because it carries
	// real token volume in Codex rollouts. A priced lane, see PRICED_LANES.
	"codex-auto-review": openai(flat(2.5, 15)),
	// Google (opencode, pi-mono) - Standard tier. Where a model is
	// context-tiered, the <=200K rate is encoded, exactly as the OpenAI rows
	// encode the standard-context tier: the payload carries no per-response
	// context length, so the cheaper side keeps the figure a lower bound.
	"gemini-3.1-pro-preview": google(flat(2, 12)),
	// models.dev reports $0.75 / $3.75 on 2026-08-29 (was $1.5 / $7.5).
	"gemini-3.6-flash": google(flat(0.75, 3.75)),
	"gemini-3.5-flash": google(flat(1.5, 9)),
	"gemini-3-flash-preview": google(flat(0.5, 3)),
	"gemini-2.5-pro": google(flat(1.25, 10)),
	"gemini-2.5-flash": google(flat(0.3, 2.5)),
	// RETIRED from Google's list page by 2026-08-09, and still the largest
	// single block of Google tokens measured in #122. Encoded at its launch
	// rate: real volume, a rate we can name. Announcement rate, <=200K tier.
	"gemini-3-pro-preview": google(flat(2, 12)),
	// A real Anthropic model with no row until #123. Measured in #122 as
	// `claude-opus-4-5-20251101`, which the dated-suffix rule strips to this key.
	"claude-opus-4-5": anthropic(flat(5, 25)),
};

/**
 * The constants above as dated rows. This is what the seed migration writes
 * into `modelPrices` and what the CLI prices against when the server's table
 * is out of reach. Cache tiers are rendered absolute here, once.
 */
export function bundledPriceTable(): PriceTable {
	const rows: PriceRow[] = [];
	for (const [modelSlug, entry] of Object.entries(PRICES)) {
		for (const p of entry.periods) {
			rows.push({
				modelSlug,
				from: p.from ?? 0,
				input: p.input,
				output: p.output,
				cacheRead: p.input * entry.cache.read,
				cacheWrite5m: p.input * entry.cache.write5m,
				cacheWrite1h: p.input * entry.cache.write1h,
				source: entry.table,
				vendor: entry.vendor,
			});
		}
	}
	return { id: BUNDLED_PRICE_TABLE_ID, rows };
}

const BUNDLED_INDEX = new PriceIndex(bundledPriceTable());
const BUNDLED_PRICER = new Pricer([BUNDLED_INDEX]);

/** The pricer over the bundled constants alone. */
export function bundledPricer(): Pricer {
	return BUNDLED_PRICER;
}

/**
 * A pricer that answers from `table` first and from the bundled constants for
 * every key the table lacks. The CLI installs the served table this way; the
 * backend builds the same shape over `modelPrices`.
 */
export function layeredPricer(
	table: PriceTable,
	vendorHint?: (slug: string) => Vendor | null,
): Pricer {
	return new Pricer([new PriceIndex(table), BUNDLED_INDEX], vendorHint);
}

/**
 * The pricer the module-level functions below consult. The CLI's sync sets it
 * to the served table before scanning (#336) and every adapter prices through
 * it without knowing. Defaults to the bundled constants.
 */
let active: Pricer = BUNDLED_PRICER;

export function setActivePricer(pricer: Pricer | null): void {
	active = pricer ?? BUNDLED_PRICER;
}

/** The ids of the tables the active pricer consults, served first. */
export function activePriceTableIds(): string[] {
	return active.tableIds;
}

/**
 * Build the pricing key a multi-provider harness reports under. Pass the
 * harness's own provider id verbatim; this table decides what it means.
 */
export function modelKeyFor(provider: string, model: string): string {
	return `${provider}${PROVIDER_SEPARATOR}${model}`;
}

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
 * appended by the caller from `usage.speed`. A `provider:` prefix passes
 * through untouched, so a caller can normalize a composed key.
 */
export function normalizeModel(model: string): string {
	const { provider, model: bare } = splitModelKey(model);
	const [base, suffix] = bare.split("#");
	const stripped = base.replace(/-\d{8}$/, "");
	const normalized = suffix ? `${stripped}#${suffix}` : stripped;
	return provider === null ? normalized : modelKeyFor(provider, normalized);
}

/**
 * Drop the analyzer's synthetic `#fast` suffix, leaving the id the payload
 * publishes.
 *
 * A `provider:` prefix SURVIVES this, and that is deliberate: the provider is
 * what tells `google:gemini-3-pro-preview` from
 * `github-copilot:gemini-3-pro-preview`, and the backend re-pricer needs that
 * difference at read time. Use `vendorModelId` where a human or the models
 * catalog needs the plain vendor id.
 */
export function baseModelId(modelKey: string): string {
	return modelKey.split("#")[0];
}

/**
 * The vendor-assigned id alone - no provider prefix, no `#fast`. This is the id
 * to show a reader and to match against the models catalog.
 */
export function vendorModelId(modelKey: string): string {
	return splitModelKey(baseModelId(modelKey)).model;
}

/**
 * How this model's vendor charges for cache traffic, as ratios of the latest
 * period's input rate. Falls back to the Anthropic-shaped constants for a
 * model with no rate, so a caller that prices an unknown model still gets a
 * defined shape rather than a crash.
 */
export function cacheMultipliersFor(modelKey: string): CacheMultipliers {
	const periods = active.periodsFor(modelKey);
	const p = periods[periods.length - 1];
	if (!p) return DEFAULT_CACHE_MULTIPLIERS;
	if (p.input === 0) return { write5m: 0, write1h: 0, read: 0 };
	// Absolute rates back to ratios; rounded so 0.075 / 0.75 reads 0.1.
	const ratio = (rate: number) => Math.round((rate / p.input) * 1e6) / 1e6;
	return {
		write5m: ratio(p.cacheWrite5m),
		write1h: ratio(p.cacheWrite1h),
		read: ratio(p.cacheRead),
	};
}

/**
 * True when this key names a model that runs locally and therefore costs
 * nothing per token. A caller printing dollars uses this to say "free", never
 * "unknown".
 */
export function isLocalModel(modelKey: string): boolean {
	return active.isLocal(modelKey);
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
	return active.priceAt(modelKey, atMs);
}

/** True when we hold at least one citable rate for this model, at any time. */
export function isPricedModel(modelKey: string): boolean {
	return active.isPriced(modelKey);
}

/**
 * The table id that cites this model's rates, or `null` when it has none.
 *
 * The citation belongs to the rate, not to the harness that reported it: a
 * read-time estimate is cited by the table it was drawn from, and one stack can
 * carry Anthropic and OpenAI rows at once.
 */
export function pricingTableFor(
	modelKey: string,
	atMs?: number,
): string | null {
	return active.tableFor(modelKey, atMs);
}

/**
 * Every rate that applies to `modelKey` anywhere inside `[fromMs, toMs]`.
 *
 * This is the read-time counterpart of `priceAt`. A published snapshot has no
 * per-response timestamps left, so a re-pricer can only ask "which rates could
 * this window have paid", and then choose.
 */
export function pricePeriodsInWindow(
	modelKey: string,
	fromMs: number,
	toMs: number,
): PricePeriod[] {
	return active.periodsInWindow(modelKey, fromMs, toMs);
}

/** The dollars one period charges for these tokens. */
export function costAtPeriod(p: PricePeriod, t: TokenCounts): number {
	const M = 1_000_000;
	return (
		(t.input * p.input +
			t.output * p.output +
			(t.cacheWrite5m + t.cacheWriteUnsplit) * p.cacheWrite5m +
			t.cacheWrite1h * p.cacheWrite1h +
			t.cacheRead * p.cacheRead) /
		M
	);
}

/**
 * Cost of one response's tokens at the rate in effect at its own timestamp.
 * Returns `null` when no rate applies - the caller must surface that as
 * unpriced tokens rather than zeroing it.
 */
export function apiEquivalentCost(
	modelKey: string,
	t: TokenCounts,
	atMs: number | null,
): number | null {
	const p = active.priceAt(modelKey, atMs);
	if (!p) return null;
	return costAtPeriod(p, t);
}
