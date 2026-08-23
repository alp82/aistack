/**
 * A real snapshot, shaped the way `measured.getCurrentByStackSlug` returns it.
 *
 * `snapshot.fixture.json` is not invented data: the shipped analyzer
 * (`packages/cli/src/harness`) produced it from the owner's own Claude Code
 * history on 2026-07-26 - 382 sessions, 4.27B tokens, 6 models, $5,840 at API
 * prices, fail-closed filtering applied, and real withheld counts. #40 drove
 * both prototype rounds off it, so every rule the display honours was checked
 * against these numbers rather than against a convenient invention.
 *
 * The stored file is the CLIENT payload. The query adds the server clock,
 * resolves model ids against the catalog, and since #67 wraps it as ONE
 * harness section under a combined headline - which is what `buildHarness` +
 * `buildSnapshot` do here. `claude-fable-5` is deliberately absent from the
 * catalog: it is the largest row in this window, so it exercises
 * `catalogSlug: null` on the one row where getting it wrong would be most
 * visible.
 */
import type { HarnessSnapshot, MeasuredSnapshot } from "../copy";
import raw from "./snapshot.fixture.json";

const CATALOG: Record<string, string> = {
	"claude-opus-5": "Claude Opus 5",
	"claude-opus-4-8": "Claude Opus 4.8",
	"claude-sonnet-5": "Claude Sonnet 5",
	"claude-sonnet-4-6": "Claude Sonnet 4.6",
	"claude-haiku-4-5": "Claude Haiku 4.5",
};

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

const tokensOf = (m: HarnessSnapshot["models"][number]) =>
	m.tokens.input + m.tokens.output + m.tokens.cacheWrite + m.tokens.cacheRead;

/**
 * The cost block the query derives from these models (#93). Every model here
 * was priced by the CLI that produced the fixture, so the whole reading is
 * published rather than estimated - and coverage is whatever share of the
 * tokens those rows carry.
 */
function costOf(
	models: HarnessSnapshot["models"],
	pricingTable: string | null,
): MeasuredSnapshot["cost"] {
	const priced = models.filter((m) => m.apiEquivalentUSD !== undefined);
	if (priced.length === 0) return null;
	const measuredTokens = models.reduce((a, m) => a + tokensOf(m), 0);
	const pricedTokens = priced.reduce((a, m) => a + tokensOf(m), 0);
	const usd = priced.reduce((a, m) => a + (m.apiEquivalentUSD ?? 0), 0);
	return {
		lowerBoundUSD: usd,
		publishedUSD: usd,
		estimatedUSD: 0,
		coverage: measuredTokens > 0 ? pricedTokens / measuredTokens : 0,
		pricedTokens,
		measuredTokens,
		pricingTables: pricingTable ? [pricingTable] : [],
	};
}

/** One harness's own section, resolved the way the query resolves it. */
export function buildHarness(
	overrides: Partial<HarnessSnapshot> = {},
): HarnessSnapshot {
	const payload = raw as unknown as Omit<
		HarnessSnapshot,
		"receivedAt" | "isFresh" | "models" | "cost" | "activity"
	> & {
		activity: typeof raw.activity;
		models: Array<Omit<HarnessSnapshot["models"][number], never>>;
	};
	const receivedAt = Date.now() - 2 * HOUR;

	const models = payload.models.map((m) => ({
		...m,
		catalogSlug: CATALOG[m.id] ? m.id : null,
		catalogName: CATALOG[m.id] ?? null,
		costEstimated: false,
	}));

	return {
		...payload,
		machine: null,
		machineOrdinal: null,
		receivedAt,
		isFresh: true,
		activity: {
			...payload.activity,
			activeDays: { value: payload.activity.activeDays, precision: "exact" },
			projects: { value: payload.activity.projects, precision: "exact" },
		},
		models,
		cost: costOf(models, payload.pricingTable),
		...overrides,
	};
}

/**
 * The combined shape for a single-harness stack: the headline mirrors the one
 * harness, exactly as the read-time aggregation degenerates with n=1.
 */
export function buildSnapshot(
	overrides: Partial<MeasuredSnapshot> = {},
	harnessOverrides: Partial<HarnessSnapshot> = {},
): MeasuredSnapshot {
	const h = buildHarness(harnessOverrides);
	return {
		receivedAt: h.receivedAt,
		capturedAt: h.capturedAt,
		isFresh: h.isFresh,
		window: h.window,
		pricingTable: h.pricingTable,
		cost: h.cost,
		activity: h.activity,
		models: h.models,
		harnesses: [h],
		...overrides,
	};
}

/** The same snapshot with every model's cost stripped (`publishCost: false`). */
export function withoutCost(
	overrides: Partial<MeasuredSnapshot> = {},
): MeasuredSnapshot {
	const base = buildSnapshot(overrides);
	const stripModels = (models: MeasuredSnapshot["models"]) =>
		models.map(({ apiEquivalentUSD: _drop, ...m }) => m);
	return {
		...base,
		pricingTable: null,
		cost: null,
		models: stripModels(base.models),
		harnesses: base.harnesses.map((h) => ({
			...h,
			pricingTable: null,
			cost: null,
			models: stripModels(h.models),
		})),
	};
}
