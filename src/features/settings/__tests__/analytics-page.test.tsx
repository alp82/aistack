// @vitest-environment jsdom
/**
 * Views - wayfinder #86 (map #76).
 *
 * The map locked this surface as strictly private and as honestly labeled, so
 * the tests guard those two decisions rather than the layout:
 *
 *   1. THE PAGE SAYS WHAT THE NUMBER IS NOT. A visitor is a browser and network
 *      combination, owner views are missing, and it is not a page-load count. A
 *      number read as impressions is a wrong number.
 *   2. NOTHING THAT COULD IDENTIFY A VISITOR REACHES THE PAGE. The query returns
 *      counts, and this is where a leak would become visible.
 *   3. A QUIET TARGET STILL APPEARS. A stack published yesterday must read as
 *      "nobody came yet", never as a missing stack.
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	AnalyticsPage,
	REFERRER_LABELS,
	rangeLabel,
} from "@/features/settings/AnalyticsPage";

const queryMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const DAY = 24 * 60 * 60 * 1000;
const TODAY = Date.UTC(2026, 7, 5);

/** The accessible name of the per-page list, so row assertions can scope to it. */
const PER_PAGE_LIST = "Views per page";

function days(n: number, values: number[]) {
	return values.slice(0, n).map((value, i) => ({
		at: TODAY - (n - 1 - i) * DAY,
		value,
	}));
}

function payload(over: Record<string, unknown> = {}) {
	return {
		windowDays: 30,
		windowStartMs: TODAY - 29 * DAY,
		endDayMs: TODAY,
		firstCountedDayMs: TODAY - 4 * DAY,
		total: 24,
		targets: [
			{
				kind: "profile",
				targetId: "creator_1",
				label: "Your profile",
				href: "/alp",
				total: 9,
				days: days(5, [1, 2, 0, 3, 3]),
			},
			{
				kind: "stack",
				targetId: "stack_1",
				label: "Main Stack",
				href: "/stacks/main-stack",
				total: 15,
				days: days(5, [4, 2, 4, 1, 4]),
			},
		],
		referrers: [
			{ bucket: "ai", count: 14 },
			{ bucket: "search", count: 7 },
			{ bucket: "direct", count: 3 },
		],
		...over,
	};
}

function setup(data: unknown) {
	queryMock.mockImplementation((ref: never) =>
		getFunctionName(ref).endsWith("mine") ? data : undefined,
	);
	render(<AnalyticsPage />);
}

describe("AnalyticsPage", () => {
	it("shows a loading state rather than an empty one while the query answers", () => {
		setup(undefined);
		expect(screen.getByText("Loading...")).toBeTruthy();
		expect(screen.queryByText(/No visits counted yet/)).toBeNull();
	});

	it("says the numbers are only visible to the owner", () => {
		setup(payload());
		expect(screen.getByText(/Only you can see/i)).toBeTruthy();
	});

	it("says what the number is not: not people, not page loads", () => {
		setup(payload());
		const text = document.body.textContent ?? "";
		expect(text).toMatch(/not a person|not people/i);
		expect(text).toMatch(/page loads/i);
		// The exclusion is a property of the number, so it is printed with it.
		expect(text).toMatch(/signed in/i);
	});

	it("leads with the total for the window it actually covers", () => {
		setup(payload());
		expect(screen.getAllByText("24").length).toBeGreaterThan(0);
		expect(screen.getAllByText(/since Aug 1, 2026/).length).toBeGreaterThan(0);
	});

	it("names the profile and every stack with its own total", () => {
		setup(payload());
		// Scoped to the list: chart axis ticks are numbers too, and a bare
		// getByText would sometimes match a tick label instead of a row.
		const rows = within(screen.getByRole("list", { name: PER_PAGE_LIST }));
		expect(rows.getByText("Your profile")).toBeTruthy();
		expect(rows.getByText("Main Stack")).toBeTruthy();
		expect(rows.getByText("9")).toBeTruthy();
		expect(rows.getByText("15")).toBeTruthy();
	});

	it("puts where visitors came from in plain words, never a bucket key", () => {
		setup(payload());
		const text = document.body.textContent ?? "";
		expect(text).toMatch(/AI assistant/);
		expect(text).not.toMatch(/\bbucket\b/i);
	});

	it("still lists a stack nobody has opened, and says so", () => {
		setup(
			payload({
				total: 0,
				firstCountedDayMs: null,
				referrers: [],
				targets: [
					{
						kind: "profile",
						targetId: "creator_1",
						label: "Your profile",
						href: "/alp",
						total: 0,
						days: [],
					},
					{
						kind: "stack",
						targetId: "stack_1",
						label: "Fresh Stack",
						href: "/stacks/fresh",
						total: 0,
						days: [],
					},
				],
			}),
		);
		expect(screen.getAllByText("Fresh Stack").length).toBeGreaterThan(0);
		expect(screen.getByText(/No visits counted yet/)).toBeTruthy();
		// Nothing was counted, so no window was observed. "0 over the last 30
		// days" would be a claim about 30 days nobody watched.
		expect(document.body.textContent).not.toMatch(/last 30 days/);
	});

	it("never renders anything that could identify a visitor", () => {
		setup(payload());
		const text = document.body.textContent ?? "";
		expect(text).not.toMatch(/\d+\.\d+\.\d+\.\d+/); // an IP
		expect(text).not.toMatch(/hash|user-agent|Mozilla/i);
	});

	it("tells a user with no creator profile how to get numbers", () => {
		setup(null);
		expect(screen.getByText(/Create a stack/i)).toBeTruthy();
	});
});

describe("copy helpers", () => {
	it("says the real range, so a fresh account is not told it has 30 days of data", () => {
		// Counting started on a date. "Last 30 days" on day three would imply 27
		// days of zeros that were never counted.
		const windowStart = TODAY - 29 * DAY;
		expect(rangeLabel(TODAY - 2 * DAY, windowStart, 30)).toBe(
			"since Aug 3, 2026",
		);
		expect(rangeLabel(windowStart, windowStart, 30)).toBe("last 30 days");
		expect(rangeLabel(windowStart - DAY, windowStart, 30)).toBe("last 30 days");
		expect(rangeLabel(null, windowStart, 30)).toBe("last 30 days");
	});

	it("names every referrer bucket in plain words", () => {
		// The union is closed in the schema. A bucket with no label would render
		// its key to a user.
		const buckets = ["direct", "search", "ai", "social", "internal", "other"];
		for (const b of buckets) {
			expect(REFERRER_LABELS[b as keyof typeof REFERRER_LABELS]).toBeTruthy();
		}
		expect(REFERRER_LABELS.ai).toBe("AI assistant");
		expect(REFERRER_LABELS.internal).toBe("A link on this site");
	});
});
