// The daily unit of the usage wire, and the fold that turns days into a window.
//
// Tickets #305, #306 and #315 (ADR-0010, ADR-0011). The snapshot payload the
// CLI sends today is one 30-day block with its shares already computed. This
// module is its per-day successor: one `measuredDays` row per (stack, machine,
// date) holds `{ date, usage?, workflow? }` under ONE version, `measured-days/v1`,
// with ONE fingerprint over both blocks.
//
// ONLY COMBINABLE ATOMS. A usage day carries token sums, session counts, project
// keys and exact dollars, never a share or a mean. Shares, active days and the
// dollar total come out of the fold, over the window's atoms. A day that lacks
// the cache-write split folds its whole `cacheWrite` into `unsplit`.
//
// THE FOLD HAS THE DAY'S SHAPE. A window over one day prints the day's own
// figures, and the tests fold a fixture of one day and compare it with itself.
//
// A READING IS ONE MACHINE'S, PER DAY (ADR-0009). Nothing here merges machines.

import type { WorkflowDay } from "./daily.js";

export const MEASURED_DAYS_V1 = "measured-days/v1";

export type UsageTokens = {
	input: number;
	output: number;
	cacheWrite: number;
	cacheRead: number;
	/**
	 * The cache-write split by TTL. `unsplit` holds writes from payloads that
	 * predate the split. Absent when the day recorded no split at all.
	 */
	cacheWriteTtl?: { fiveMinute: number; oneHour: number; unsplit: number };
};

export type UsageModelDay = {
	model: string;
	tokens: UsageTokens;
	/** Exact dollars the CLI priced at ingest; absent when unpriced or publishCost off. */
	usd?: number;
	pricingTable?: string;
};

export type UsageHarnessDay = {
	harness: string;
	/** Sessions that STARTED this day. */
	sessions: number;
	/** Hashed project keys touched this day, sorted unique. */
	projectKeys: readonly string[];
	models: readonly UsageModelDay[];
	/** Tokens spent inside subagent turns, all models. */
	subagentTokens: number;
	excludedTokens: { unpriced: number; synthetic: number };
};

export type UsageDay = { harnesses: readonly UsageHarnessDay[] };

/** One stored row. When `workflow` is present, `workflow.date === date`. */
export type MeasuredDay = {
	date: string;
	usage?: UsageDay;
	workflow?: WorkflowDay;
};

export type UsageWindowModel = {
	model: string;
	tokens: UsageTokens;
	totalTokens: number;
	/** `totalTokens / window totalTokens`, rounded to 4 places, like the CLI's `tokenShare`. */
	tokenShare: number;
	/** Exact sum over days that carried usd; `undefined` when no day did. */
	usd: number | undefined;
	/** Tokens of the days that carried no usd, for the server's per-day fill. */
	unpricedTokens: UsageTokens;
	/** Dates lacking usd for this model, sorted unique. */
	unpricedDates: readonly string[];
	pricingTables: readonly string[];
};

export type UsageWindowHarness = {
	harness: string;
	sessions: number;
	totalTokens: number;
	tokenShare: number;
};

export type UsageWindow = {
	aggregateVersion: string;
	dates: readonly string[];
	/** Days with at least one session. */
	activeDays: number;
	sessions: number;
	projectKeys: readonly string[];
	tokens: UsageTokens;
	totalTokens: number;
	/**
	 * `cacheRead / (input + cacheRead + cacheWrite)`: cache reads over the
	 * input side, as the CLI's `computeCacheHitShare`. Output is not in the
	 * denominator. Rounded to 4 places.
	 */
	cacheHitShare: number;
	/** `subagentTokens / totalTokens`, as the CLI's `sidechainShare`. Rounded to 4 places. */
	subagentShare: number;
	models: readonly UsageWindowModel[];
	harnesses: readonly UsageWindowHarness[];
	excludedTokens: { unpriced: number; synthetic: number };
};

/** The CLI's `round4`: four decimal places on every share. */
const round4 = (n: number): number => Math.round(n * 10_000) / 10_000;

export function emptyUsageTokens(): UsageTokens {
	return { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };
}

/**
 * Mutating add. The TTL split folds when either side carries one; a side
 * without the split adds its whole `cacheWrite` to `unsplit`, so the split's
 * three parts always sum to `cacheWrite` on the result.
 */
export function addUsageTokens(into: UsageTokens, from: UsageTokens): void {
	if (into.cacheWriteTtl || from.cacheWriteTtl) {
		const a = into.cacheWriteTtl ?? {
			fiveMinute: 0,
			oneHour: 0,
			unsplit: into.cacheWrite,
		};
		const b = from.cacheWriteTtl ?? {
			fiveMinute: 0,
			oneHour: 0,
			unsplit: from.cacheWrite,
		};
		into.cacheWriteTtl = {
			fiveMinute: a.fiveMinute + b.fiveMinute,
			oneHour: a.oneHour + b.oneHour,
			unsplit: a.unsplit + b.unsplit,
		};
	}
	into.input += from.input;
	into.output += from.output;
	into.cacheWrite += from.cacheWrite;
	into.cacheRead += from.cacheRead;
}

/** `input + output + cacheWrite + cacheRead`, the CLI's `totalTokens`. */
export function totalOfTokens(t: UsageTokens): number {
	return t.input + t.output + t.cacheWrite + t.cacheRead;
}

type ModelAcc = {
	model: string;
	tokens: UsageTokens;
	usd: number | undefined;
	unpricedTokens: UsageTokens;
	unpricedDates: Set<string>;
	pricingTables: Set<string>;
};

/**
 * Fold one machine's usage days into a window.
 *
 * `dates` is sorted unique. Models sort by `totalTokens` desc then model id,
 * harnesses likewise, matching the CLI's `groupModels` order. Empty input gives
 * a zeroed window with every share 0.
 */
export function foldUsageDays(
	days: readonly { date: string; usage: UsageDay }[],
): UsageWindow {
	const tokens = emptyUsageTokens();
	const projectKeys = new Set<string>();
	const activeDates = new Set<string>();
	const models = new Map<string, ModelAcc>();
	const harnesses = new Map<
		string,
		{ harness: string; sessions: number; tokens: UsageTokens }
	>();
	let sessions = 0;
	let subagentTokens = 0;
	const excludedTokens = { unpriced: 0, synthetic: 0 };

	for (const day of days) {
		for (const h of day.usage.harnesses) {
			sessions += h.sessions;
			if (h.sessions > 0) activeDates.add(day.date);
			subagentTokens += h.subagentTokens;
			excludedTokens.unpriced += h.excludedTokens.unpriced;
			excludedTokens.synthetic += h.excludedTokens.synthetic;
			for (const key of h.projectKeys) projectKeys.add(key);
			const held = harnesses.get(h.harness) ?? {
				harness: h.harness,
				sessions: 0,
				tokens: emptyUsageTokens(),
			};
			held.sessions += h.sessions;
			harnesses.set(h.harness, held);
			for (const m of h.models) {
				addUsageTokens(tokens, m.tokens);
				addUsageTokens(held.tokens, m.tokens);
				const acc = models.get(m.model) ?? {
					model: m.model,
					tokens: emptyUsageTokens(),
					usd: undefined,
					unpricedTokens: emptyUsageTokens(),
					unpricedDates: new Set<string>(),
					pricingTables: new Set<string>(),
				};
				addUsageTokens(acc.tokens, m.tokens);
				if (m.usd === undefined) {
					addUsageTokens(acc.unpricedTokens, m.tokens);
					acc.unpricedDates.add(day.date);
				} else {
					acc.usd = (acc.usd ?? 0) + m.usd;
				}
				if (m.pricingTable) acc.pricingTables.add(m.pricingTable);
				models.set(m.model, acc);
			}
		}
	}

	const totalTokens = totalOfTokens(tokens);
	const share = (n: number): number =>
		totalTokens ? round4(n / totalTokens) : 0;
	const inputSide = tokens.input + tokens.cacheRead + tokens.cacheWrite;

	return {
		aggregateVersion: MEASURED_DAYS_V1,
		dates: [...new Set(days.map((day) => day.date))].sort(),
		activeDays: activeDates.size,
		sessions,
		projectKeys: [...projectKeys].sort(),
		tokens,
		totalTokens,
		cacheHitShare: inputSide ? round4(tokens.cacheRead / inputSide) : 0,
		subagentShare: share(subagentTokens),
		models: [...models.values()]
			.map((acc) => ({
				model: acc.model,
				tokens: acc.tokens,
				totalTokens: totalOfTokens(acc.tokens),
				tokenShare: share(totalOfTokens(acc.tokens)),
				usd: acc.usd,
				unpricedTokens: acc.unpricedTokens,
				unpricedDates: [...acc.unpricedDates].sort(),
				pricingTables: [...acc.pricingTables].sort(),
			}))
			.sort(
				(a, b) =>
					b.totalTokens - a.totalTokens || a.model.localeCompare(b.model),
			),
		harnesses: [...harnesses.values()]
			.map((h) => ({
				harness: h.harness,
				sessions: h.sessions,
				totalTokens: totalOfTokens(h.tokens),
				tokenShare: share(totalOfTokens(h.tokens)),
			}))
			.sort(
				(a, b) =>
					b.totalTokens - a.totalTokens || a.harness.localeCompare(b.harness),
			),
		excludedTokens,
	};
}

/** JSON with object keys sorted at every depth, so key order never changes the hash. */
function canonicalJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
	if (value && typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, v]) => v !== undefined)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
		return `{${entries
			.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`)
			.join(",")}}`;
	}
	return JSON.stringify(value) ?? "null";
}

/**
 * FNV-1a, 64-bit, over the UTF-8 bytes of `text`. Pure JS with no imports so
 * it runs in the Convex runtime and in Node alike. Returns 16 hex characters.
 */
function fnv1a64(text: string): string {
	const prime = 0x100000001b3n;
	const mask = 0xffffffffffffffffn;
	let hash = 0xcbf29ce484222325n;
	const bytes = new TextEncoder().encode(text);
	for (const byte of bytes) {
		hash ^= BigInt(byte);
		hash = (hash * prime) & mask;
	}
	return hash.toString(16).padStart(16, "0");
}

/**
 * The content identity of one stored day: a hex hash over `MEASURED_DAYS_V1`
 * and both blocks, stable across key order. Two days that differ only in key
 * order hash equal; a version bump changes every hash. This is identity for
 * skipping an unchanged re-sync, not a security primitive.
 */
export function dayFingerprint(day: MeasuredDay): string {
	return fnv1a64(
		canonicalJson({
			version: MEASURED_DAYS_V1,
			date: day.date,
			usage: day.usage,
			workflow: day.workflow,
		}),
	);
}

export type RangeId = "30d" | "7d" | "24h";

export const RANGES: readonly RangeId[] = ["30d", "7d", "24h"];

const DAY_MS = 86_400_000;

const utcDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** Midnight UTC of the day holding `ms`. */
const dayStart = (ms: number): number => Math.floor(ms / DAY_MS) * DAY_MS;

const rangeLength = (range: RangeId): number =>
	range === "30d" ? 30 : range === "7d" ? 7 : 1;

/**
 * The inclusive `YYYY-MM-DD` UTC dates a range covers, ending today.
 * 24h is today only; 7d is today-6..today; 30d is today-29..today.
 */
export function rangeDates(
	range: RangeId,
	nowMs: number,
): { from: string; to: string } {
	const today = dayStart(nowMs);
	return {
		from: utcDate(today - (rangeLength(range) - 1) * DAY_MS),
		to: utcDate(today),
	};
}

/**
 * The same-length range immediately before `rangeDates`: 24h is yesterday, 7d
 * is the 7 days before, 30d is 60 to 30 days ago.
 */
export function previousRangeDates(
	range: RangeId,
	nowMs: number,
): { from: string; to: string } {
	const length = rangeLength(range);
	return rangeDates(range, dayStart(nowMs) - length * DAY_MS);
}

/** Inclusive on both ends. Dates are `YYYY-MM-DD`, so string order is date order. */
export function inDateRange(
	date: string,
	r: { from: string; to: string },
): boolean {
	return date >= r.from && date <= r.to;
}

/**
 * `(current - previous) / previous`. `null` when `previous` is 0 or either
 * side is not finite: a change from nothing has no ratio.
 */
export function ratioChange(current: number, previous: number): number | null {
	if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
	if (previous === 0) return null;
	return (current - previous) / previous;
}
