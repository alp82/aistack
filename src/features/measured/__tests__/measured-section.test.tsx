// @vitest-environment jsdom
/**
 * Journey section 02 — "What actually ran" (#46, building #40's variant B).
 *
 * Four of these tests guard decisions rather than layout:
 *
 *   1. NO SNAPSHOT IS AN INVITATION, not a demerit. Every stack but one is in
 *      that state, so a page that scolded them would scold almost everybody.
 *   2. POSITIVE CLAIMS ONLY. #40 rejected variant C for labelling four models
 *      "listed, but not seen" when all four were genuinely in use, just not
 *      through Claude Code.
 *   3. A DOLLAR FIGURE NEVER APPEARS WITHOUT ITS PRICING TABLE.
 *   4. KEPT-PRIVATE COUNTS ARE COUNTS, never a percentage.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MeasuredSection } from "@/features/measured/MeasuredSection";
import type { MeasuredSnapshot } from "../copy";
import { buildSnapshot, DAY, withoutCost } from "./fixture";

const queryMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

function setup(snapshot: MeasuredSnapshot | null | undefined) {
	queryMock.mockReturnValue(snapshot);
	render(<MeasuredSection index={2} slug="alps-stack-ab12" />);
}

describe("the reading", () => {
	it("leads with the dollar figure and dates it", () => {
		setup(buildSnapshot());
		expect(screen.getByText("≈$5,840")).toBeInTheDocument();
		expect(
			screen.getByText("at API prices, over the last 30 days"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/prices: anthropic-list-2026-07-25/),
		).toBeInTheDocument();
	});

	it("names the window as the thing that moves", () => {
		setup(buildSnapshot());
		expect(
			screen.getByText(/rolling 30-day reading, not a running total/),
		).toBeInTheDocument();
		expect(screen.getByText("2026-06-27 → 2026-07-26")).toBeInTheDocument();
	});

	it("swaps the headline to tokens rather than blanking a money slot", () => {
		setup(withoutCost());
		expect(screen.getByText("4.27B")).toBeInTheDocument();
		expect(
			screen.getByText("tokens over the last 30 days"),
		).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("$");
	});

	it("prints no dollars at all when the pricing table is missing", () => {
		// The per-model column has to go too, not just the headline.
		setup(buildSnapshot({ pricingTable: null }));
		expect(document.body.textContent).not.toContain("$");
		expect(screen.getByText("4.27B")).toBeInTheDocument();
	});

	it("shows the model split, raw vendor id and all", () => {
		setup(buildSnapshot());
		expect(screen.getByText("claude-fable-5")).toBeInTheDocument();
		expect(screen.getByText("35.1%")).toBeInTheDocument();
		expect(screen.getByText("Claude Opus 5")).toBeInTheDocument();
	});

	it("shows the activity stats", () => {
		setup(buildSnapshot());
		expect(screen.getByText("382")).toBeInTheDocument();
		expect(screen.getByText("22 of 30")).toBeInTheDocument();
		expect(screen.getByText("95%")).toBeInTheDocument();
		expect(screen.getByText("33%")).toBeInTheDocument();
	});

	it("says how long ago the machine was read, from the server clock", () => {
		setup(buildSnapshot());
		expect(screen.getByText("checked 2h ago")).toBeInTheDocument();
	});
});

describe("what the reading admits", () => {
	it("counts what was kept private, without scoring it", () => {
		setup(buildSnapshot());
		expect(
			screen.getByText(/kept private: 2 MCP servers, 10 skills/),
		).toBeInTheDocument();
		expect(document.body.textContent).not.toMatch(/kept private[^.]*%/);
	});

	it("stays quiet about a clean scan", () => {
		setup(buildSnapshot());
		expect(document.body.textContent).not.toContain("Partial read");
	});

	it("calls a degraded scan a floor", () => {
		setup(
			buildSnapshot({
				coverage: {
					filesScanned: 3015,
					filesUnreadable: 61,
					linesParsed: 232058,
					linesFailed: 4192,
				},
			}),
		);
		expect(
			screen.getByText(/The numbers below are a floor/),
		).toBeInTheDocument();
	});

	it("admits when the reading is going stale", () => {
		setup(buildSnapshot({ receivedAt: Date.now() - 19 * DAY, isFresh: false }));
		expect(screen.getByText(/this reading is going stale/)).toBeInTheDocument();
	});
});

describe("a stack that has never synced", () => {
	it("invites the reader instead of marking the author down", () => {
		setup(null);
		expect(
			screen.getByText("This stack has not been measured yet."),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Stacks can publish what actually ran/),
		).toBeInTheDocument();
		// The section keeps its place in the journey either way.
		expect(screen.getByText("What actually ran")).toBeInTheDocument();
		expect(screen.getByText("02")).toBeInTheDocument();
	});

	it("says nothing at all while the query is still out", () => {
		// Undefined is "not answered yet". Rendering the invitation here would
		// claim a stack was never measured a beat before learning that it was.
		setup(undefined);
		expect(
			screen.queryByText("This stack has not been measured yet."),
		).not.toBeInTheDocument();
		expect(screen.getByText("What actually ran")).toBeInTheDocument();
	});
});

describe("positive claims only", () => {
	it("never says a listed thing went unused", () => {
		// #40 rejected variant C on real data: the four models it labelled
		// "listed, but not seen" were all in use, just not through Claude Code.
		setup(buildSnapshot());
		const text = (document.body.textContent ?? "").toLowerCase();
		for (const banned of [
			"not seen",
			"listed, but",
			"unused",
			"never used",
			"no longer",
		]) {
			expect(text).not.toContain(banned);
		}
	});
});
