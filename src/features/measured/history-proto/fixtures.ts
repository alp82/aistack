/**
 * PROTOTYPE — throwaway. Wayfinder ticket #80 (map #76).
 *
 * Fixtures for "the living stack page". Every number in `REAL_SYNCS` is copied
 * from the production `measuredSnapshots` table on 2026-08-04, so the shapes the
 * variants are judged against are the real ones, not invented ones.
 *
 * The three facts that shape every variant:
 *
 *   1. A snapshot is a ROLLING 30-DAY TOTAL, never a daily delta. Two readings
 *      cannot be differenced into "what they spent that day", because the window
 *      slides: the difference is (days added) minus (days dropped off the back).
 *   2. So the series is NOT monotonic. The real spend readings run
 *      6071 -> 5938 -> 6040 -> 6040 -> 5719 -> 5956 -> 6030. A falling reading
 *      is the window moving, not a slowdown.
 *   3. The whole history today is 7 readings over 5 days, and the two harnesses
 *      differ by 3 orders of magnitude in tokens (4.6B vs 0.008B).
 */

export type ProtoModel = {
	id: string;
	label: string;
	share: number;
	usd: number | null;
};

/** One row of `measuredSnapshots` — one harness, one sync. */
export type ProtoReading = {
	at: number;
	harness: string;
	windowDays: number;
	from: string;
	to: string;
	sessions: number;
	activeDays: number;
	totalTokens: number;
	cacheHitShare: number;
	subagentShare: number;
	pricingTable: string | null;
	models: ProtoModel[];
};

/** One sync event — every harness row that shares a capturedAt, merged. */
export type ProtoPoint = {
	at: number;
	tokens: number;
	usd: number | null;
	sessions: number;
	activeDays: number;
	windowDays: number;
	from: string;
	to: string;
	harnesses: { name: string; tokens: number; usd: number | null }[];
	mix: ProtoModel[];
	/** True when the daily GC has collapsed this day to one row. */
	daily: boolean;
};

const LABELS: Record<string, string> = {
	"claude-opus-5": "Claude Opus 5",
	"claude-fable-5": "Claude Fable 5",
	"claude-opus-4-8": "Claude Opus 4.8",
	"claude-sonnet-5": "Claude Sonnet 5",
	"claude-haiku-4-5": "Claude Haiku 4.5",
	"claude-sonnet-4-6": "Claude Sonnet 4.6",
	"gpt-5.5": "GPT-5.5",
	"gpt-5.6-sol": "GPT-5.6 Sol",
};

export function modelLabelOf(id: string): string {
	return LABELS[id] ?? id;
}

const T = (iso: string) => new Date(`${iso}Z`).getTime();

function cc(
	at: number,
	from: string,
	to: string,
	sessions: number,
	tokens: number,
	shares: [string, number, number][],
	activeDays = 23,
): ProtoReading {
	return {
		at,
		harness: "claude-code",
		windowDays: 30,
		from,
		to,
		sessions,
		activeDays,
		totalTokens: tokens,
		cacheHitShare: 0.958,
		subagentShare: 0.284,
		pricingTable: "anthropic-list-2026-07-25",
		models: shares.map(([id, share, usd]) => ({
			id,
			label: modelLabelOf(id),
			share,
			usd,
		})),
	};
}

function codex(
	at: number,
	from: string,
	to: string,
	sessions: number,
	tokens: number,
	shares: [string, number, number][],
	activeDays: number,
): ProtoReading {
	return {
		at,
		harness: "codex",
		windowDays: 30,
		from,
		to,
		sessions,
		activeDays,
		totalTokens: tokens,
		cacheHitShare: 0.71,
		subagentShare: 0,
		pricingTable: "openai-list-2026-07-25",
		models: shares.map(([id, share, usd]) => ({
			id,
			label: modelLabelOf(id),
			share,
			usd,
		})),
	};
}

/**
 * The real production history of the one stack that has one, verbatim.
 * Note the 15:35 / 15:36 pair on 08-01 — two syncs a minute apart, which the
 * chart has to survive, and the 08-03 pair 4.5 hours apart.
 */
export const REAL_SYNCS: ProtoReading[] = [
	cc(T("2026-07-30T12:34"), "2026-07-01", "2026-07-30", 456, 4_692_280_159, [
		["claude-opus-5", 0.3547, 1400.35],
		["claude-fable-5", 0.3373, 3376.59],
		["claude-opus-4-8", 0.1825, 1002.33],
		["claude-sonnet-5", 0.1091, 254.74],
		["claude-haiku-4-5", 0.0127, 17.72],
		["claude-sonnet-4-6", 0.0036, 19.54],
	]),
	cc(T("2026-07-31T10:26"), "2026-07-02", "2026-07-31", 465, 4_559_930_701, [
		["claude-opus-5", 0.3655, 1404.12],
		["claude-fable-5", 0.3505, 3418.58],
		["claude-opus-4-8", 0.1599, 843.92],
		["claude-sonnet-5", 0.1117, 253.3],
		["claude-haiku-4-5", 0.0119, 16.23],
		["claude-sonnet-4-6", 0.0004, 1.36],
	]),
	cc(T("2026-08-01T15:35"), "2026-07-03", "2026-08-01", 509, 4_604_112_000, [
		["claude-fable-5", 0.3702, 3489.0],
		["claude-opus-5", 0.3611, 1411.0],
		["claude-opus-4-8", 0.1598, 872.0],
		["claude-sonnet-5", 0.0975, 249.0],
		["claude-haiku-4-5", 0.0111, 17.0],
		["claude-sonnet-4-6", 0.0003, 2.0],
	]),
	codex(
		T("2026-08-01T15:35"),
		"2026-07-03",
		"2026-08-01",
		16,
		8_120_000,
		[["gpt-5.5", 1.0, 11.0]],
		4,
	),
	// The near-duplicate: a second sync 60 seconds later.
	cc(T("2026-08-01T15:36"), "2026-07-03", "2026-08-01", 510, 4_604_390_000, [
		["claude-fable-5", 0.3702, 3489.0],
		["claude-opus-5", 0.3611, 1411.0],
		["claude-opus-4-8", 0.1598, 872.0],
		["claude-sonnet-5", 0.0975, 249.0],
		["claude-haiku-4-5", 0.0111, 17.0],
		["claude-sonnet-4-6", 0.0003, 2.0],
	]),
	cc(T("2026-08-02T16:13"), "2026-07-04", "2026-08-02", 521, 4_427_010_000, [
		["claude-fable-5", 0.3808, 3312.0],
		["claude-opus-5", 0.3779, 1389.0],
		["claude-opus-4-8", 0.1512, 761.0],
		["claude-sonnet-5", 0.0785, 240.0],
		["claude-haiku-4-5", 0.0112, 17.0],
		["claude-sonnet-4-6", 0.0004, 0.0],
	]),
	codex(
		T("2026-08-02T16:13"),
		"2026-07-04",
		"2026-08-02",
		16,
		8_140_000,
		[["gpt-5.5", 1.0, 11.0]],
		4,
	),
	cc(T("2026-08-03T17:35"), "2026-07-05", "2026-08-03", 550, 4_605_220_000, [
		["claude-opus-5", 0.3902, 1447.0],
		["claude-fable-5", 0.3861, 3401.0],
		["claude-opus-4-8", 0.1327, 856.0],
		["claude-sonnet-5", 0.0801, 235.0],
		["claude-haiku-4-5", 0.0106, 17.0],
		["claude-sonnet-4-6", 0.0003, 0.0],
	]),
	codex(
		T("2026-08-03T17:35"),
		"2026-07-05",
		"2026-08-03",
		23,
		8_390_000,
		[
			["gpt-5.5", 0.97, 11.4],
			["gpt-5.6-sol", 0.03, 0.6],
		],
		5,
	),
	cc(T("2026-08-03T22:09"), "2026-07-05", "2026-08-03", 554, 4_701_330_000, [
		["claude-opus-5", 0.4011, 1462.0],
		["claude-fable-5", 0.3802, 3419.0],
		["claude-opus-4-8", 0.1298, 878.0],
		["claude-sonnet-5", 0.0782, 238.0],
		["claude-haiku-4-5", 0.0104, 17.0],
		["claude-sonnet-4-6", 0.0003, 0.0],
	]),
	codex(
		T("2026-08-03T22:09"),
		"2026-07-05",
		"2026-08-03",
		23,
		8_390_000,
		[
			["gpt-5.5", 0.97, 11.4],
			["gpt-5.6-sol", 0.03, 0.6],
		],
		5,
	),
];

// ---------------------------------------------------------------------------
// Synthesis — the futures we cannot observe yet.
//
// Deterministic on purpose (a fixed LCG, no Math.random), so flipping between
// variants compares the same series and not two different draws.
// ---------------------------------------------------------------------------

function lcg(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) % 4294967296;
		return s / 4294967296;
	};
}

const DAY = 86_400_000;

/**
 * A back-projected history: the same stack, wound backwards, ramping up as the
 * owner adopted the harness. `days` back from the last real sync.
 *
 * Beyond 90 days the nightly GC has already collapsed each day to a single row
 * (`convex/measured.ts:1582`), so those points are exactly daily and flagged.
 * Inside 90 days the points are irregular: one per sync, 1-3 a day, with gaps.
 */
export function synthesize(days: number): ProtoReading[] {
	const rand = lcg(20260804);
	const end = T("2026-08-03T22:09");
	const out: ProtoReading[] = [];
	const start = end - days * DAY;

	// Mix drift: fable-5 arrives around 25 days ago and takes share from opus-4-8.
	for (let d = days; d >= 1; d--) {
		const at = end - d * DAY;
		if (at < start) continue;
		const beyondGc = d > 90;
		const perDay = beyondGc ? 1 : rand() < 0.25 ? 2 : rand() < 0.08 ? 0 : 1;
		const ramp = Math.min(1, 0.25 + (days - d) / (days * 0.7));
		for (let k = 0; k < perDay; k++) {
			const jitter = 0.94 + rand() * 0.12;
			const tokens = 4_700_000_000 * ramp * jitter;
			const fableAge = Math.max(0, 1 - d / 25);
			const fable = 0.38 * fableAge;
			const opus48 = 0.13 + 0.28 * (1 - fableAge);
			const opus5 = 0.4 - 0.05 * (1 - fableAge);
			const sonnet = 0.078;
			const haiku = 0.0104;
			const total = fable + opus48 + opus5 + sonnet + haiku;
			const usdPerToken = 6030 / 4_701_330_000;
			const at2 = at + (beyondGc ? 0 : k * 5 * 3600_000 + rand() * 3600_000);
			const iso = new Date(at2).toISOString().slice(0, 10);
			const fromIso = new Date(at2 - 29 * DAY).toISOString().slice(0, 10);
			const r = cc(
				at2,
				fromIso,
				iso,
				Math.round(554 * ramp * jitter),
				Math.round(tokens),
				[
					[
						"claude-opus-5",
						opus5 / total,
						((tokens * usdPerToken * opus5) / total) * 0.6,
					],
					[
						"claude-fable-5",
						fable / total,
						((tokens * usdPerToken * fable) / total) * 1.6,
					],
					[
						"claude-opus-4-8",
						opus48 / total,
						((tokens * usdPerToken * opus48) / total) * 0.8,
					],
					[
						"claude-sonnet-5",
						sonnet / total,
						((tokens * usdPerToken * sonnet) / total) * 0.4,
					],
					[
						"claude-haiku-4-5",
						haiku / total,
						((tokens * usdPerToken * haiku) / total) * 0.1,
					],
				],
				Math.min(30, Math.round(23 * ramp) + 3),
			);
			out.push(r);
		}
	}
	return [...out, ...REAL_SYNCS];
}

// ---------------------------------------------------------------------------
// The named datasets the switcher flips between.
// ---------------------------------------------------------------------------

export type DatasetKey =
	| "first"
	| "two"
	| "real"
	| "nocost"
	| "silent"
	| "month"
	| "quarter";

export const DATASETS: { key: DatasetKey; label: string }[] = [
	{ key: "first", label: "1 reading — just synced" },
	{ key: "two", label: "2 readings" },
	{ key: "real", label: "7 readings / 5 days (REAL, today)" },
	{ key: "nocost", label: "7 readings, cost kept private" },
	{ key: "silent", label: "7 readings + a harness reporting zero" },
	{ key: "month", label: "~35 readings / 30 days" },
	{ key: "quarter", label: "~130 readings / 120 days (GC seam)" },
];

export function readingsFor(key: DatasetKey): ProtoReading[] {
	switch (key) {
		case "first":
			return [REAL_SYNCS[0]];
		case "two":
			return [REAL_SYNCS[0], REAL_SYNCS[1]];
		case "real":
			return REAL_SYNCS;
		case "nocost":
			return REAL_SYNCS.map((r) => ({
				...r,
				pricingTable: null,
				models: r.models.map((m) => ({ ...m, usd: null })),
			}));
		case "silent": {
			// A real case from prod: a stack whose second harness reports nothing.
			const last = REAL_SYNCS[REAL_SYNCS.length - 1];
			return [
				...REAL_SYNCS,
				{
					...last,
					harness: "gemini-cli",
					sessions: 0,
					activeDays: 0,
					totalTokens: 0,
					models: [],
					pricingTable: null,
				},
			];
		}
		case "month":
			return synthesize(30);
		case "quarter":
			return synthesize(120);
	}
}

// ---------------------------------------------------------------------------
// Reading rows -> sync points. Rows sharing a capturedAt minute are one sync.
// ---------------------------------------------------------------------------

export function toPoints(readings: ProtoReading[]): ProtoPoint[] {
	const byMinute = new Map<number, ProtoReading[]>();
	for (const r of readings) {
		const k = Math.floor(r.at / 60_000);
		const list = byMinute.get(k);
		if (list) list.push(r);
		else byMinute.set(k, [r]);
	}
	const points: ProtoPoint[] = [];
	for (const [k, rows] of [...byMinute.entries()].sort((a, b) => a[0] - b[0])) {
		const tokens = rows.reduce((a, r) => a + r.totalTokens, 0);
		const priced = rows.filter((r) => r.pricingTable !== null);
		const usd =
			priced.length === 0
				? null
				: priced.reduce(
						(a, r) => a + r.models.reduce((b, m) => b + (m.usd ?? 0), 0),
						0,
					);
		const mixMap = new Map<string, ProtoModel>();
		for (const r of rows) {
			for (const m of r.models) {
				const weighted = m.share * r.totalTokens;
				const prev = mixMap.get(m.id);
				if (prev) {
					prev.share += weighted;
					prev.usd = (prev.usd ?? 0) + (m.usd ?? 0);
				} else {
					mixMap.set(m.id, { ...m, share: weighted });
				}
			}
		}
		const mix = [...mixMap.values()]
			.map((m) => ({ ...m, share: tokens ? m.share / tokens : 0 }))
			.sort((a, b) => b.share - a.share);
		points.push({
			at: k * 60_000,
			tokens,
			usd,
			sessions: rows.reduce((a, r) => a + r.sessions, 0),
			activeDays: Math.max(...rows.map((r) => r.activeDays)),
			windowDays: Math.max(...rows.map((r) => r.windowDays)),
			from: rows.map((r) => r.from).sort()[0],
			to: rows
				.map((r) => r.to)
				.sort()
				.slice(-1)[0],
			harnesses: rows.map((r) => ({
				name: r.harness,
				tokens: r.totalTokens,
				usd:
					r.pricingTable === null
						? null
						: r.models.reduce((b, m) => b + (m.usd ?? 0), 0),
			})),
			mix,
			daily: Date.now() - k * 60_000 > 90 * DAY,
		});
	}
	return points;
}

// --- formatting -------------------------------------------------------------

export function fmtTokens(n: number): string {
	if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
	if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
	return String(n);
}

export function fmtUSD(n: number): string {
	return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function fmtDelta(n: number, fmt: (v: number) => string): string {
	const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
	return `${sign}${fmt(Math.abs(n))}`;
}

export function fmtDay(at: number): string {
	return new Date(at).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

export function fmtStamp(at: number): string {
	return new Date(at).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "UTC",
	});
}

export function harnessLabel(name: string): string {
	if (name === "claude-code") return "Claude Code";
	if (name === "codex") return "Codex";
	if (name === "gemini-cli") return "Gemini CLI";
	return name;
}

/**
 * PROVISIONAL palette. The real one is decided and validated in ticket #91 —
 * do not copy these hexes into production. Lime stays the single-series color,
 * so it is not in this categorical ramp.
 */
export const PROTO_SERIES_COLORS = [
	"#22d3ee",
	"#f472b6",
	"#fbbf24",
	"#a78bfa",
	"#4ade80",
	"#94a3b8",
];
