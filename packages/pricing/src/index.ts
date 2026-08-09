// Time-aware pinned price table for API-equivalent cost.
//
// Wayfinder ticket #37 (map #29), decision 8 of the wire-format grilling #33.
// Moved out of the CLI by ticket #93 (map #76).
//
// WHY THIS IS A PACKAGE AND NOT A CLI FILE
// Two programs price the same tokens. The CLI prices each response at ingest,
// where the per-response timestamp still exists. The backend re-prices a
// published snapshot at READ time, to fill the gaps a stale CLI table left
// behind — one day of table drift published a stack at $14,764 when the same
// tokens are worth at least $167,331 (#93). Two copies of a price table drift
// against each other by construction, so there is one copy and both import it.
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
// Sources: Anthropic public list prices as of 2026-07-25 (cache multipliers
// from https://platform.claude.com/docs/en/build-with-claude/prompt-caching:
// 5m cache write = 1.25x input, 1h cache write = 2x input, read = 0.1x input)
// and OpenAI public list prices as of 2026-08-02
// (https://developers.openai.com/api/docs/pricing — cached input is 10% of
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
// else — gateways, unknown providers — holds no rate and lands in
// `unpricedTokens`, which is the honest outcome and needs no new machinery.
//
// The separator is `:` and not `/` on purpose: `sanitizeModelId` in the CLI
// payload rewrites `/` to `-`, so a slash-keyed id would reach the backend as a
// different string than the one this table holds, and the read-time re-pricer
// would miss it.
//
// A LOCAL MODEL IS FREE, WHICH IS NOT THE SAME FACT AS UNPRICED
// `ollama:qwen3-coder` costs nothing per token. `openrouter:qwen3-coder` costs
// something this table cannot name. Both used to look identical — no row, no
// rate, tokens excluded from coverage — so a local run read as a hole in the
// table. Local providers now hold a real zero rate, cited as
// `LOCAL_PRICING_TABLE_VERSION`. Their tokens count as covered and add $0.

export const PRICING_TABLE_VERSION = "anthropic-list-2026-07-25";
export const OPENAI_PRICING_TABLE_VERSION = "openai-list-2026-08-02";
export const GOOGLE_PRICING_TABLE_VERSION = "google-list-2026-08-09";
/**
 * The citation for a model that runs on the user's own machine. It is not a
 * vendor list — it is the statement that no per-token charge exists.
 */
export const LOCAL_PRICING_TABLE_VERSION = "local-no-charge";

export const CACHE_WRITE_5M_MULTIPLIER = 1.25;
export const CACHE_WRITE_1H_MULTIPLIER = 2.0;
export const CACHE_READ_MULTIPLIER = 0.1;

/** The separator between a provider id and a model id in a pricing key. */
export const PROVIDER_SEPARATOR = ":";

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
 * How a vendor charges for cache traffic, as multipliers on its input rate.
 *
 * Anthropic is the shape the constants above describe. Google charges the
 * standard input rate to write a cache and bills storage by the hour instead,
 * so a Google cache write must NOT carry Anthropic's 1.25x — that would
 * overstate, and every estimate here is a lower bound by construction. The
 * hourly storage fee is real spend this table cannot see, which keeps the
 * Google figure below the true one rather than above it.
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

/** Cached input is 10% of input; a write is charged as plain input. */
const GOOGLE_CACHE_MULTIPLIERS: CacheMultipliers = {
	write5m: 1.0,
	write1h: 1.0,
	read: 0.1,
};

const FREE_CACHE_MULTIPLIERS: CacheMultipliers = {
	write5m: 0,
	write1h: 0,
	read: 0,
};

/**
 * Who sets the rate. A provider only reaches a vendor's rows when it IS that
 * vendor — a gateway re-serving the same model is a different price.
 */
type Vendor = "anthropic" | "openai" | "google" | "local";

/** One model's rates, plus the table that cites them. */
type PriceEntry = {
	vendor: Vendor;
	/** The citation printed next to any dollar figure these rates produce. */
	table: string;
	periods: PricePeriod[];
	cache: CacheMultipliers;
};

const anthropic = (periods: PricePeriod[]): PriceEntry => ({
	vendor: "anthropic",
	table: PRICING_TABLE_VERSION,
	periods,
	cache: DEFAULT_CACHE_MULTIPLIERS,
});
const openai = (periods: PricePeriod[]): PriceEntry => ({
	vendor: "openai",
	table: OPENAI_PRICING_TABLE_VERSION,
	periods,
	cache: DEFAULT_CACHE_MULTIPLIERS,
});
const google = (periods: PricePeriod[]): PriceEntry => ({
	vendor: "google",
	table: GOOGLE_PRICING_TABLE_VERSION,
	periods,
	cache: GOOGLE_CACHE_MULTIPLIERS,
});
const flat = (input: number, output: number): PricePeriod[] => [
	{ from: null, to: null, input, output },
];

/**
 * The rate for anything served off the user's own hardware: zero, and citable.
 * One entry covers every local model id, because the fact does not depend on
 * which weights were loaded.
 */
const FREE: PriceEntry = {
	vendor: "local",
	table: LOCAL_PRICING_TABLE_VERSION,
	periods: flat(0, 0),
	cache: FREE_CACHE_MULTIPLIERS,
};

/**
 * Providers that ARE the vendor, so their rows price at that vendor's list.
 *
 * Deliberately absent, and each absence is a decision from ticket #122's
 * measurements: `opencode` (the opencode-zen gateway — `glm-4.7-free`,
 * `kimi-k2.5-free` and the unbranded `big-pickle` have no public list price),
 * `github-copilot` (re-serves other vendors' slugs at its own terms),
 * `openrouter`, `azure`, `bedrock` and `vercel-ai-gateway` (resellers).
 * A provider joins this map when a harness is measured emitting it, never
 * speculatively — an unused rate is a maintenance liability on a table that is
 * updated by hand.
 */
const PROVIDER_VENDOR: Record<string, Vendor> = {
	anthropic: "anthropic",
	openai: "openai",
	google: "google",
};

/**
 * Providers that run the model on this machine. No API call, no per-token
 * charge. Ids as opencode and pi-mono spell them.
 */
const LOCAL_PROVIDERS = new Set([
	"ollama",
	"lmstudio",
	"llama.cpp",
	"llamacpp",
	"local",
]);

/**
 * Only rates we can actually cite are encoded. Inventing historical periods to
 * make the table look complete would fabricate cost for old records, so every
 * model with one known rate gets one open-ended period.
 */
const PRICES: Record<string, PriceEntry> = {
	"claude-fable-5": anthropic(flat(10, 50)),
	"claude-mythos-5": anthropic(flat(10, 50)),
	"claude-opus-5": anthropic(flat(5, 25)),
	"claude-opus-4-8": anthropic(flat(5, 25)),
	"claude-opus-4-7": anthropic(flat(5, 25)),
	"claude-opus-4-6": anthropic(flat(5, 25)),
	"claude-sonnet-5": anthropic([
		{ from: null, to: SONNET_5_INTRO_ENDS_MS, input: 2, output: 10 },
		{ from: SONNET_5_INTRO_ENDS_MS, to: null, input: 3, output: 15 },
	]),
	"claude-sonnet-4-6": anthropic(flat(3, 15)),
	"claude-haiku-4-5": anthropic(flat(1, 5)),
	// Fast mode (research preview) — Claude API only, Opus 5 / Opus 4.8 only.
	// Opus 4.7 fast mode was removed, so there is deliberately no 4-7 entry.
	"claude-opus-5#fast": anthropic(flat(10, 50)),
	"claude-opus-4-8#fast": anthropic(flat(10, 50)),
	// OpenAI (Codex) — standard-context tier (<272K; observed context window is
	// 258,400).
	"gpt-5.5": openai(flat(5, 30)),
	"gpt-5.4": openai(flat(2.5, 15)),
	"gpt-5.4-mini": openai(flat(0.75, 4.5)),
	"gpt-5.3-codex": openai(flat(1.75, 14)),
	// The gpt-5.6 family launched 2026-07-29; Terra and Luna were repriced on
	// 2026-07-30 (-20% / -80%). The one-day launch rates are not on the list
	// page and are NOT encoded — a July-29 Terra/Luna record underprices for
	// one day rather than carrying a rate we cannot cite (#72).
	"gpt-5.6-sol": openai(flat(5, 30)),
	"gpt-5.6-terra": openai(flat(2, 12)),
	"gpt-5.6-luna": openai(flat(0.2, 1.2)),
	// NOT on OpenAI's list page — an internal Codex routing label with no
	// official price (openai/codex#20981). Rate is the aggregator consensus
	// ($2.50 / $15.00), scoped in explicitly by ticket #72 because it carries
	// real token volume in Codex rollouts.
	"codex-auto-review": openai(flat(2.5, 15)),
	// Google (opencode, pi-mono) — Standard tier. Where a model is
	// context-tiered, the <=200K rate is encoded, exactly as the OpenAI rows
	// encode the standard-context tier: the payload carries no per-response
	// context length, so the cheaper side keeps the figure a lower bound. Only
	// the Pro and Flash families are here — image, TTS, embedding, Live and
	// robotics models are not what a coding harness selects.
	"gemini-3.1-pro-preview": google(flat(2, 12)),
	"gemini-3.6-flash": google(flat(1.5, 7.5)),
	"gemini-3.5-flash": google(flat(1.5, 9)),
	"gemini-3-flash-preview": google(flat(0.5, 3)),
	"gemini-2.5-pro": google(flat(1.25, 10)),
	"gemini-2.5-flash": google(flat(0.3, 2.5)),
	// RETIRED from Google's list page by 2026-08-09, and still the largest
	// single block of Google tokens measured in #122 (10.9M, 20.5% of that
	// machine's total). Encoded at its launch rate on the same footing as
	// `codex-auto-review`: real volume, a rate we can name, and a note saying
	// where it came from. Announcement rate, <=200K tier: $2.00 / $12.00.
	"gemini-3-pro-preview": google(flat(2, 12)),
	// A real Anthropic model with no row until #123. Measured in #122 as
	// `claude-opus-4-5-20251101`, which the dated-suffix rule strips to this key.
	// Same $5/$25 as the rest of the Opus 4 line on the 2026-07-25 list.
	"claude-opus-4-5": anthropic(flat(5, 25)),
};

/**
 * Split a pricing key into its provider and its model part.
 *
 * A key with no separator has no provider, which is what the single-vendor
 * adapters produce and how every id published before ticket #123 is shaped.
 * The split is on the FIRST separator only, so an id that carries its own colon
 * (`ollama:llama3.2:3b`) keeps it.
 */
export function splitModelKey(modelKey: string): {
	provider: string | null;
	model: string;
} {
	const at = modelKey.indexOf(PROVIDER_SEPARATOR);
	if (at === -1) return { provider: null, model: modelKey };
	return {
		provider: modelKey.slice(0, at),
		model: modelKey.slice(at + PROVIDER_SEPARATOR.length),
	};
}

/**
 * Build the pricing key a multi-provider harness reports under. Pass the
 * harness's own provider id verbatim; this table decides what it means.
 */
export function modelKeyFor(provider: string, model: string): string {
	return `${provider}${PROVIDER_SEPARATOR}${model}`;
}

/**
 * The rates that apply to a pricing key, or `null` when none can be cited.
 *
 * This is the single lookup every exported function goes through, so the
 * provider rule is stated once.
 */
function entryFor(modelKey: string): PriceEntry | null {
	const { provider, model } = splitModelKey(modelKey);
	if (provider === null) return PRICES[model] ?? null;
	if (LOCAL_PROVIDERS.has(provider)) return FREE;
	const vendor = PROVIDER_VENDOR[provider];
	if (!vendor) return null;
	const entry = PRICES[model];
	// A gateway that names a vendor's model does not get the vendor's rate, and
	// a vendor that names a model from a table we do not hold gets nothing.
	return entry && entry.vendor === vendor ? entry : null;
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
 * The vendor-assigned id alone — no provider prefix, no `#fast`. This is the id
 * to show a reader and to match against the models catalog.
 */
export function vendorModelId(modelKey: string): string {
	return splitModelKey(baseModelId(modelKey)).model;
}

/**
 * How this model's vendor charges for cache traffic. Falls back to the
 * Anthropic-shaped constants for a model with no rate, so a caller that prices
 * an unknown model still gets a defined shape rather than a crash.
 */
export function cacheMultipliersFor(modelKey: string): CacheMultipliers {
	return entryFor(modelKey)?.cache ?? DEFAULT_CACHE_MULTIPLIERS;
}

/**
 * True when this key names a model that runs locally and therefore costs
 * nothing per token. A caller printing dollars uses this to say "free", never
 * "unknown".
 */
export function isLocalModel(modelKey: string): boolean {
	return entryFor(modelKey)?.vendor === "local";
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
	const entry = entryFor(modelKey);
	if (!entry) return null;
	for (const p of entry.periods) {
		if ((p.from === null || atMs >= p.from) && (p.to === null || atMs < p.to)) {
			return p;
		}
	}
	return null;
}

/** True when we hold at least one citable rate for this model, at any time. */
export function isPricedModel(modelKey: string): boolean {
	return entryFor(modelKey) !== null;
}

/**
 * The table id that cites this model's rates, or `null` when it has none.
 *
 * The citation belongs to the rate, not to the harness that reported it: a
 * read-time estimate is cited by the table it was drawn from, and one stack can
 * carry Anthropic and OpenAI rows at once.
 */
export function pricingTableFor(modelKey: string): string | null {
	return entryFor(modelKey)?.table ?? null;
}

/**
 * Every rate that applies to `modelKey` anywhere inside `[fromMs, toMs]`.
 *
 * This is the read-time counterpart of `priceAt`. A published snapshot has no
 * per-response timestamps left — it carries one merged token total over a
 * window — so a re-pricer cannot ask "what did this response cost". It can only
 * ask "which rates could this window have paid", and then choose. Returns an
 * empty list for an unknown model and for a window that closes before the
 * model's first citable rate opens.
 */
export function pricePeriodsInWindow(
	modelKey: string,
	fromMs: number,
	toMs: number,
): PricePeriod[] {
	const entry = entryFor(modelKey);
	if (!entry) return [];
	return entry.periods.filter(
		(p) =>
			(p.from === null || p.from <= toMs) && (p.to === null || p.to > fromMs),
	);
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
	const c = cacheMultipliersFor(modelKey);
	const M = 1_000_000;
	return (
		(t.input * p.input +
			t.output * p.output +
			(t.cacheWrite5m + t.cacheWriteUnsplit) * p.input * c.write5m +
			t.cacheWrite1h * p.input * c.write1h +
			t.cacheRead * p.input * c.read) /
		M
	);
}
