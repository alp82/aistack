/**
 * Fixtures for the two owner-private view surfaces (#112).
 *
 * Thin data is the normal case, not the edge: prod holds fourteen counter rows
 * and most pages have one or two readings. So the default fixture is thin, and
 * the tests reach for the fat one on purpose.
 */

import type { ViewAnalytics, ViewTarget } from "../data";

const DAY = 24 * 60 * 60 * 1000;
/** A fixed today, so a range label is an assertion and not a moving target. */
export const TODAY = Date.UTC(2026, 7, 5);
export const WINDOW_START = TODAY - 29 * DAY;

/** One point per day, ending today. */
export function days(values: number[]): { at: number; value: number }[] {
	return values.map((value, i) => ({
		at: TODAY - (values.length - 1 - i) * DAY,
		value,
	}));
}

export function target(over: Partial<ViewTarget> = {}): ViewTarget {
	return {
		kind: "stack",
		targetId: "stack_1",
		label: "Main Stack",
		href: "/stacks/main-stack",
		total: 15,
		days: days([4, 2, 4, 1, 4]),
		...over,
	};
}

export function analytics(over: Partial<ViewAnalytics> = {}): ViewAnalytics {
	return {
		windowDays: 30,
		windowStartMs: WINDOW_START,
		endDayMs: TODAY,
		firstCountedDayMs: TODAY - 4 * DAY,
		total: 24,
		targets: [
			target({
				kind: "profile",
				targetId: "creator_1",
				label: "Your profile",
				href: "/@alp",
				total: 9,
				days: days([1, 2, 0, 3, 3]),
			}),
			target(),
		],
		referrers: [
			{ bucket: "ai", count: 14 },
			{ bucket: "search", count: 7 },
			{ bucket: "direct", count: 3 },
		],
		...over,
	};
}

/** A creator whose pages nobody has opened: no total, no trail, no range. */
export function emptyAnalytics(): ViewAnalytics {
	return analytics({
		total: 0,
		firstCountedDayMs: null,
		referrers: [],
		targets: [
			target({
				kind: "profile",
				targetId: "creator_1",
				label: "Your profile",
				href: "/@alp",
				total: 0,
				days: [],
			}),
			target({ label: "Fresh Stack", total: 0, days: [] }),
			target({
				targetId: "stack_fresh",
				label: "Second Stack",
				href: "/stacks/second",
				total: 0,
				days: [],
			}),
		],
	});
}
