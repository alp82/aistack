/**
 * The real measured history, shaped the way `measured.getHistoryByStackSlug`
 * returns it.
 *
 * Every reading below is copied from the production `measuredSnapshots` table
 * as it stood on 2026-08-04 - the whole history that exists: seven readings over
 * five days, two of them 60 seconds apart, and a second harness three orders of
 * magnitude smaller than the first. #80 designed against these numbers, so the
 * display is tested against them too.
 *
 * The spend readings run 6071 → 5938 → 6040 → 6040 → 5719 → 5956 → 6030: a
 * rolling 30-day window is a level, so it falls as often as it rises.
 */
import type { MeasuredSnapshot } from "../copy";
import type { MeasuredHistory, MeasuredHistoryPoint } from "../history";
import { buildHarness, buildSnapshot } from "./fixture";

type Row = {
	harness: string;
	version: string | null;
	tokens: number;
	sessions: number;
	activeDays: number;
	pricingTable: string | null;
	/** [id, share, usd] as published. */
	models: Array<[string, number, number | null]>;
};

const CATALOG: Record<string, string> = {
	"claude-opus-5": "Claude Opus 5",
	"claude-opus-4-8": "Claude Opus 4.8",
	"claude-sonnet-5": "Claude Sonnet 5",
	"claude-sonnet-4-6": "Claude Sonnet 4.6",
	"claude-haiku-4-5": "Claude Haiku 4.5",
	"gpt-5.5": "GPT-5.5",
};

const at = (iso: string) => new Date(`${iso}Z`).getTime();

function cc(
	tokens: number,
	sessions: number,
	models: Array<[string, number, number | null]>,
): Row {
	return {
		harness: "claude-code",
		version: "2.1.220",
		tokens,
		sessions,
		activeDays: 23,
		pricingTable: "anthropic-list-2026-07-25",
		models,
	};
}

const codex = (tokens: number, sessions: number): Row => ({
	harness: "codex",
	version: "0.52.0",
	tokens,
	sessions,
	activeDays: 4,
	pricingTable: "openai-list-2026-07-25",
	models: [["gpt-5.5", 1, 11]],
});

/** The seven real syncs, in order, as rows-per-minute. */
const SYNCS: Array<{ at: number; rows: Row[] }> = [
	{
		at: at("2026-07-30T12:34"),
		rows: [
			cc(4_692_280_159, 456, [
				["claude-opus-5", 0.3547, 1400.35],
				["claude-fable-5", 0.3373, 3376.59],
				["claude-opus-4-8", 0.1825, 1002.33],
				["claude-sonnet-5", 0.1091, 254.74],
				["claude-haiku-4-5", 0.0127, 17.72],
				["claude-sonnet-4-6", 0.0036, 19.54],
			]),
		],
	},
	{
		at: at("2026-07-31T10:26"),
		rows: [
			cc(4_559_930_701, 465, [
				["claude-opus-5", 0.3655, 1404.12],
				["claude-fable-5", 0.3505, 3418.58],
				["claude-opus-4-8", 0.1599, 843.92],
				["claude-sonnet-5", 0.1117, 253.3],
				["claude-haiku-4-5", 0.0119, 16.23],
				["claude-sonnet-4-6", 0.0004, 1.36],
			]),
		],
	},
	{
		at: at("2026-08-01T15:35"),
		rows: [
			cc(4_604_112_000, 509, [
				["claude-fable-5", 0.3702, 3489],
				["claude-opus-5", 0.3611, 1411],
				["claude-opus-4-8", 0.1598, 872],
				["claude-sonnet-5", 0.0975, 249],
				["claude-haiku-4-5", 0.0111, 17],
				["claude-sonnet-4-6", 0.0003, 2],
			]),
			codex(8_120_000, 16),
		],
	},
	{
		// 60 seconds after the one above. Two readings, not one.
		at: at("2026-08-01T15:36"),
		rows: [
			cc(4_604_390_000, 510, [
				["claude-fable-5", 0.3702, 3489],
				["claude-opus-5", 0.3611, 1411],
				["claude-opus-4-8", 0.1598, 872],
				["claude-sonnet-5", 0.0975, 249],
				["claude-haiku-4-5", 0.0111, 17],
				["claude-sonnet-4-6", 0.0003, 2],
			]),
			codex(8_120_000, 16),
		],
	},
	{
		at: at("2026-08-02T16:13"),
		rows: [
			cc(4_427_010_000, 521, [
				["claude-fable-5", 0.3808, 3312],
				["claude-opus-5", 0.3779, 1389],
				["claude-opus-4-8", 0.1512, 761],
				["claude-sonnet-5", 0.0785, 240],
				["claude-haiku-4-5", 0.0112, 17],
				["claude-sonnet-4-6", 0.0004, 0],
			]),
			codex(8_140_000, 16),
		],
	},
	{
		at: at("2026-08-03T17:35"),
		rows: [
			cc(4_605_220_000, 550, [
				["claude-opus-5", 0.3902, 1447],
				["claude-fable-5", 0.3861, 3401],
				["claude-opus-4-8", 0.1327, 856],
				["claude-sonnet-5", 0.0801, 235],
				["claude-haiku-4-5", 0.0106, 17],
				["claude-sonnet-4-6", 0.0003, 0],
			]),
			codex(8_390_000, 23),
		],
	},
	{
		at: at("2026-08-03T22:09"),
		rows: [
			cc(4_701_330_000, 554, [
				["claude-opus-5", 0.4011, 1462],
				["claude-fable-5", 0.3802, 3419],
				["claude-opus-4-8", 0.1298, 878],
				["claude-sonnet-5", 0.0782, 238],
				["claude-haiku-4-5", 0.0104, 17],
				["claude-sonnet-4-6", 0.0003, 0],
			]),
			codex(8_390_000, 23),
		],
	},
];

/** The server's merge, mirrored so the fixture stays a shape and not a stub. */
function mergePoint(sync: { at: number; rows: Row[] }): MeasuredHistoryPoint {
	const tokens = sync.rows.reduce((a, r) => a + r.tokens, 0);
	const priced = sync.rows.filter((r) => r.pricingTable !== null);
	const usd =
		priced.length === 0
			? null
			: priced.reduce(
					(a, r) => a + r.models.reduce((b, m) => b + (m[2] ?? 0), 0),
					0,
				);
	const weighted = new Map<string, number>();
	for (const row of sync.rows) {
		for (const [id, share] of row.models) {
			weighted.set(id, (weighted.get(id) ?? 0) + share * row.tokens);
		}
	}
	const models = [...weighted.entries()]
		.map(([id, w]) => ({
			id,
			catalogSlug: CATALOG[id] ? id : null,
			catalogName: CATALOG[id] ?? null,
			tokenShare: tokens ? w / tokens : 0,
		}))
		.sort((a, b) => b.tokenShare - a.tokenShare);

	return {
		at: sync.at,
		tokens,
		usd,
		sessions: sync.rows.reduce((a, r) => a + r.sessions, 0),
		activeDays: Math.max(...sync.rows.map((r) => r.activeDays)),
		projects: 12,
		windowDays: 30,
		from: "2026-07-05",
		to: "2026-08-03",
		pricingTable: [...new Set(sync.rows.map((r) => r.pricingTable))]
			.filter((p): p is string => p !== null)
			.join(" + "),
		harnesses: sync.rows.map((r) => ({
			name: r.harness,
			machine: null,
			version: r.version,
			capturedAt: sync.at,
			tokens: r.tokens,
			usd:
				r.pricingTable === null
					? null
					: r.models.reduce((a, m) => a + (m[2] ?? 0), 0),
		})),
		models,
	};
}

/**
 * The real history, optionally cut to its first `readings` syncs - one reading
 * and two readings are the states almost every stack is actually in.
 */
export function buildHistory({
	readings = SYNCS.length,
	claudeCodeOnly = false,
	withoutCost = false,
}: {
	readings?: number;
	claudeCodeOnly?: boolean;
	withoutCost?: boolean;
} = {}): MeasuredHistory {
	const syncs = SYNCS.slice(0, readings).map((s) => ({
		at: s.at,
		rows: claudeCodeOnly
			? s.rows.filter((r) => r.harness === "claude-code")
			: s.rows,
	}));
	const points = syncs.map(mergePoint).map((p) =>
		withoutCost
			? {
					...p,
					usd: null,
					pricingTable: null,
					harnesses: p.harnesses.map((h) => ({ ...h, usd: null })),
				}
			: p,
	);
	return {
		windowDays: 90,
		truncated: false,
		harness: null,
		machine: null,
		points,
	};
}

export const NEWEST_AT = SYNCS[SYNCS.length - 1].at;

/**
 * The current reading that goes with a history - the newest point, as
 * `getCurrentByStackSlug` returns it.
 *
 * The server guarantees these two agree: the headline is the merge of the newest
 * reading per harness, and the last point of the series is the same merge. The
 * fixture holds that guarantee so no test can encode a page whose big number
 * disagrees with the end of its own trail.
 */
export function currentFromHistory(history: MeasuredHistory): MeasuredSnapshot {
	const point = history.points.at(-1);
	if (!point) throw new Error("a history with no readings has no current");
	const base = buildSnapshot();
	const template = base.harnesses[0];

	const models = point.models.map((m) => ({
		...m,
		costEstimated: false,
		tokens: {
			input: Math.round(point.tokens * m.tokenShare * 0.01),
			output: Math.round(point.tokens * m.tokenShare * 0.01),
			cacheWrite: Math.round(point.tokens * m.tokenShare * 0.03),
			cacheRead: Math.round(point.tokens * m.tokenShare * 0.95),
		},
		...(point.usd === null
			? {}
			: { apiEquivalentUSD: point.usd * m.tokenShare }),
	}));

	return {
		receivedAt: base.receivedAt,
		capturedAt: point.at,
		isFresh: true,
		window: { days: point.windowDays, from: point.from, to: point.to },
		pricingTable: point.pricingTable,
		cost:
			point.usd === null
				? null
				: {
						lowerBoundUSD: point.usd,
						publishedUSD: point.usd,
						estimatedUSD: 0,
						coverage: 1,
						pricedTokens: point.tokens,
						measuredTokens: point.tokens,
						pricingTables: point.pricingTable
							? point.pricingTable.split(" + ")
							: [],
					},
		activity: {
			...base.activity,
			sessions: point.sessions,
			activeDays: point.activeDays,
			projects: point.projects,
			totalTokens: point.tokens,
		},
		models,
		harnesses: point.harnesses.map((h, i) =>
			buildHarness({
				capturedAt: h.capturedAt,
				harness: { name: h.name, version: h.version },
				pricingTable: point.pricingTable,
				activity: {
					...template.activity,
					sessions: h.tokens === point.tokens ? point.sessions : 16,
					totalTokens: h.tokens,
				},
				// The second harness carries nothing withheld, so a kept-private
				// assertion can only be reading the first one's real counts.
				...(i === 0
					? {}
					: {
							inventory: {
								...template.inventory,
								withheld: {
									builtinTools: 0,
									mcpServers: 0,
									skills: 0,
									subagents: 0,
									slashCommands: 0,
								},
							},
						}),
				models: models.filter((m) =>
					h.name === "codex" ? m.id.startsWith("gpt") : !m.id.startsWith("gpt"),
				),
			}),
		),
	};
}
