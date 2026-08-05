/**
 * PROTOTYPE (#98) — throwaway fixture data for the view-analytics variants.
 *
 * The shape matches what `viewAnalytics.mine` returns, so a variant that wins
 * can be rebuilt against the real query without reshaping anything. Nothing
 * here talks to Convex: the question is what the page should look like, and a
 * signed-out reader on a phone must be able to flip through it.
 *
 * Three data states, because thin data is the normal case and not the edge.
 * Prod holds 14 counter rows across 14 targets.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReferrerBucket =
	| "direct"
	| "search"
	| "ai"
	| "social"
	| "internal"
	| "other";

export type AnalyticsTarget = {
	kind: "profile" | "stack";
	targetId: string;
	label: string;
	href: string;
	openable: boolean;
	total: number;
	days: { at: number; value: number }[];
};

export type AnalyticsData = {
	windowDays: number;
	windowStartMs: number;
	endDayMs: number;
	firstCountedDayMs: number | null;
	total: number;
	targets: AnalyticsTarget[];
	referrers: { bucket: ReferrerBucket; count: number }[];
};

export type DataState = "none" | "thin" | "year";

export const DATA_STATES: readonly DataState[] = ["none", "thin", "year"];

export const DATA_STATE_LABELS: Record<DataState, string> = {
	none: "Nothing counted",
	thin: "Prod today",
	year: "Open a year",
};

function utcDayStart(ms: number): number {
	return Math.floor(ms / DAY_MS) * DAY_MS;
}

/** Turn a list of counts, oldest last, into filled day points ending today. */
function daysEndingToday(endDayMs: number, counts: number[]) {
	return counts.map((value, i) => ({
		at: endDayMs - (counts.length - 1 - i) * DAY_MS,
		value,
	}));
}

const WINDOW_DAYS = 30;

/** A creator whose pages exist but whom nobody has opened yet. */
function noneFixture(endDayMs: number): AnalyticsData {
	return {
		windowDays: WINDOW_DAYS,
		windowStartMs: endDayMs - (WINDOW_DAYS - 1) * DAY_MS,
		endDayMs,
		firstCountedDayMs: null,
		total: 0,
		targets: [
			{
				kind: "profile",
				targetId: "p",
				label: "Your profile",
				href: "/@jules",
				openable: true,
				total: 0,
				days: [],
			},
			{
				kind: "stack",
				targetId: "s1",
				label: "Terminal-first daily driver",
				href: "/stacks/terminal-first-daily-driver",
				openable: true,
				total: 0,
				days: [],
			},
			{
				kind: "stack",
				targetId: "s2",
				label: "Docs-heavy writing setup",
				href: "/stacks/docs-heavy-writing-setup",
				openable: false,
				total: 0,
				days: [],
			},
		],
		referrers: [],
	};
}

/**
 * What prod actually holds: a handful of readings across a few pages, one of
 * them a single day, one of them a draft nobody can open.
 */
function thinFixture(endDayMs: number): AnalyticsData {
	const targets: AnalyticsTarget[] = [
		{
			kind: "profile",
			targetId: "p",
			label: "Your profile",
			href: "/@jules",
			openable: true,
			total: 3,
			days: daysEndingToday(endDayMs, [1, 0, 2]),
		},
		{
			kind: "stack",
			targetId: "s1",
			label: "Terminal-first daily driver",
			href: "/stacks/terminal-first-daily-driver",
			openable: true,
			total: 7,
			days: daysEndingToday(endDayMs, [2, 1, 0, 0, 3, 1]),
		},
		{
			kind: "stack",
			targetId: "s2",
			label: "Cheap research rig",
			href: "/stacks/cheap-research-rig",
			openable: true,
			total: 1,
			days: daysEndingToday(endDayMs, [1]),
		},
		{
			kind: "stack",
			targetId: "s3",
			label: "Docs-heavy writing setup",
			href: "/stacks/docs-heavy-writing-setup",
			openable: false,
			total: 0,
			days: [],
		},
	];
	return {
		windowDays: WINDOW_DAYS,
		windowStartMs: endDayMs - (WINDOW_DAYS - 1) * DAY_MS,
		endDayMs,
		// Six days back: the oldest reading on the busiest stack.
		firstCountedDayMs: endDayMs - 5 * DAY_MS,
		total: 11,
		targets,
		referrers: [
			{ bucket: "internal", count: 5 },
			{ bucket: "search", count: 3 },
			{ bucket: "direct", count: 2 },
			{ bucket: "ai", count: 1 },
		],
	};
}

/** A deterministic wobble, so the server and the browser draw the same shape. */
function wobble(seed: number, i: number, base: number): number {
	const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
	return Math.max(
		0,
		Math.round(base + (n - Math.floor(n)) * base * 1.6 - base * 0.6),
	);
}

/** A page open long enough that the 30-day window is full on every target. */
function yearFixture(endDayMs: number): AnalyticsData {
	const specs: [string, string, string, number, boolean][] = [
		["p", "Your profile", "/@jules", 6, true],
		[
			"s1",
			"Terminal-first daily driver",
			"/stacks/terminal-first-daily-driver",
			14,
			true,
		],
		["s2", "Cheap research rig", "/stacks/cheap-research-rig", 5, true],
		[
			"s3",
			"Docs-heavy writing setup",
			"/stacks/docs-heavy-writing-setup",
			9,
			true,
		],
		["s4", "Weekend robotics bench", "/stacks/weekend-robotics-bench", 2, true],
	];
	const targets: AnalyticsTarget[] = specs.map(
		([id, label, href, base, openable], si) => {
			const days = Array.from({ length: WINDOW_DAYS }, (_, i) => ({
				at: endDayMs - (WINDOW_DAYS - 1 - i) * DAY_MS,
				value: wobble(si + 1, i, base),
			}));
			return {
				kind: id === "p" ? ("profile" as const) : ("stack" as const),
				targetId: id,
				label,
				href,
				openable,
				total: days.reduce((a, d) => a + d.value, 0),
				days,
			};
		},
	);
	const total = targets.reduce((a, t) => a + t.total, 0);
	return {
		windowDays: WINDOW_DAYS,
		windowStartMs: endDayMs - (WINDOW_DAYS - 1) * DAY_MS,
		endDayMs,
		// Older than the window, so the page says "last 30 days".
		firstCountedDayMs: endDayMs - 300 * DAY_MS,
		total,
		targets,
		referrers: [
			{ bucket: "search", count: Math.round(total * 0.38) },
			{ bucket: "internal", count: Math.round(total * 0.24) },
			{ bucket: "direct", count: Math.round(total * 0.17) },
			{ bucket: "ai", count: Math.round(total * 0.11) },
			{ bucket: "social", count: Math.round(total * 0.07) },
			{ bucket: "other", count: Math.round(total * 0.03) },
		],
	};
}

export function fixture(state: DataState, nowMs: number): AnalyticsData {
	const endDayMs = utcDayStart(nowMs);
	if (state === "none") return noneFixture(endDayMs);
	if (state === "year") return yearFixture(endDayMs);
	return thinFixture(endDayMs);
}
