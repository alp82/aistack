// @vitest-environment jsdom
/**
 * Journey section 01 — "Actual Usage", now living (#81, building #80's variant
 * I over the #46 section).
 *
 * The decisions these tests guard, rather than layout:
 *
 *   1. TOKENS LEAD, SPEND SITS UNDER THEM. Spend is optional by design
 *      (`publishCost`), and a page whose headline can vanish is a page that
 *      changes shape per stack.
 *   2. NO SNAPSHOT IS AN INVITATION, not a demerit. Almost every stack is in
 *      that state.
 *   3. POSITIVE CLAIMS ONLY (#40): nothing here may say a listed thing went
 *      unused.
 *   4. A DOLLAR FIGURE NEVER APPEARS WITHOUT ITS PRICING TABLE.
 *   5. KEPT-PRIVATE COUNTS ARE COUNTS, never a percentage.
 *   6. THE PAGE RENDERS WHOLE WITHOUT ITS HISTORY. The series adds the trail,
 *      the notch and the delta; it is never what makes the section readable.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MeasuredSection } from "@/features/measured/MeasuredSection";
import { api } from "../../../../convex/_generated/api";
import type { MeasuredSnapshot } from "../copy";
import type { MeasuredHistory } from "../history";
import { DAY } from "./fixture";
import { buildHistory, currentFromHistory } from "./history.fixture";

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

function setup(
	snapshot: MeasuredSnapshot | null | undefined,
	history: MeasuredHistory | null | undefined = null,
	{ isOwner = false }: { isOwner?: boolean } = {},
) {
	const historyRef = getFunctionName(api.measured.getHistoryByStackSlug);
	queryMock.mockImplementation((ref: Parameters<typeof getFunctionName>[0]) =>
		getFunctionName(ref) === historyRef ? history : snapshot,
	);
	render(
		<MeasuredSection index={1} slug="alps-stack-ab12" isOwner={isOwner} />,
	);
}

/** The real seven readings, and the current reading that goes with them. */
function live(options: Parameters<typeof buildHistory>[0] = {}) {
	const history = buildHistory(options);
	return { history, current: currentFromHistory(history) };
}

describe("the reading", () => {
	it("leads with tokens and puts a lower-bound spend underneath", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(screen.getByText("4.70B")).toBeInTheDocument();
		expect(screen.getByText("tokens · last 30 days")).toBeInTheDocument();
		expect(screen.getByText("≥$6,014")).toBeInTheDocument();
		expect(screen.getByText("at least, at api list prices")).toBeInTheDocument();
	});

	it("names the window as the thing that moves", () => {
		const { current, history } = live();
		setup(current, history);
		expect(
			screen.getByText(/rolling 30-day reading, not a running total/),
		).toBeInTheDocument();
		expect(screen.getByText("2026-07-05 → 2026-08-03")).toBeInTheDocument();
	});

	it("dates every dollar it prints", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(
			screen.getByText(/prices: anthropic-list-2026-07-25/),
		).toBeInTheDocument();
	});

	it("reads as complete on a stack that publishes no cost", () => {
		const { current, history } = live({ withoutCost: true });
		setup(current, history);
		expect(screen.getByText("4.71B")).toBeInTheDocument();
		expect(screen.getByText("cost not published")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("$");
	});

	it("prints no dollars at all when no table cites them", () => {
		// The per-model column has to go too, not just the headline. A cost block
		// that names no table is the one shape that must never reach the page:
		// a price the reader cannot date is a price we do not print.
		const { current, history } = live({ claudeCodeOnly: true });
		setup(
			{
				...current,
				pricingTable: null,
				cost: current.cost && { ...current.cost, pricingTables: [] },
			},
			history,
		);
		expect(document.body.textContent).not.toContain("$");
		expect(screen.getByText("4.70B")).toBeInTheDocument();
	});

	it("shows the model split, raw vendor id and all", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(screen.getByText("claude-fable-5")).toBeInTheDocument();
		expect(screen.getByText("Claude Opus 5")).toBeInTheDocument();
		expect(screen.getByText("40.1%")).toBeInTheDocument();
	});

	it("shows the activity stats", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(screen.getByText("554")).toBeInTheDocument();
		expect(screen.getByText("23 of 30")).toBeInTheDocument();
	});

	it("says how long ago the machine was read, from the server clock", () => {
		const { current, history } = live();
		setup(current, history);
		expect(screen.getByText("checked 2h ago")).toBeInTheDocument();
	});

	it("names each harness it read from", () => {
		const { current, history } = live();
		setup(current, history);
		expect(screen.getByText(/read from Claude Code/)).toBeInTheDocument();
		expect(screen.getByText(/read from Codex/)).toBeInTheDocument();
	});
});

describe("the page moving", () => {
	it("says how many readings there are, and since when", () => {
		const { current, history } = live();
		setup(current, history);
		expect(screen.getByText("7 readings since Jul 30")).toBeInTheDocument();
	});

	it("reports a fall as a fall, in plain words", () => {
		// The window forgets its far end, so a quiet week lowers the reading. That
		// is not a fault and the page must not dress it as one.
		const { current, history } = live({ readings: 5, claudeCodeOnly: true });
		setup(current, history);
		expect(
			screen.getByText(/−177.4M since the last check/),
		).toBeInTheDocument();
	});

	it("marks where each model's share started once there are two readings", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(
			screen.getByText(/the hatched notch marks where each share stood on/),
		).toBeInTheDocument();
		expect(screen.getAllByTestId("share-notch").length).toBeGreaterThan(0);
	});

	it("draws no notch and no delta on a stack that has synced once", () => {
		const { current, history } = live({ readings: 1, claudeCodeOnly: true });
		setup(current, history);
		expect(screen.queryByTestId("share-notch")).not.toBeInTheDocument();
		expect(document.body.textContent).not.toContain("since the last check");
		expect(screen.getByText("1 reading since Jul 30")).toBeInTheDocument();
		// The reading itself is still the whole section.
		expect(screen.getByText("4.69B")).toBeInTheDocument();
	});

	it("renders whole while the series is still out", () => {
		const { current } = live();
		setup(current, undefined);
		expect(screen.getByText("4.71B")).toBeInTheDocument();
		expect(screen.getByText("Claude Opus 5")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("readings since");
	});
});

describe("the fun-fact deck", () => {
	it("offers another way to picture the number, without hiding the caption", () => {
		const { current, history } = live();
		setup(current, history);
		const deal = screen.getByRole("button", {
			name: /another way to picture/i,
		});
		expect(screen.getByText("tokens · last 30 days")).toBeInTheDocument();
		// Clicking deals the next framing. The card itself is a hover surface, so
		// what this asserts is that the control exists and stays quiet.
		fireEvent.click(deal);
		expect(screen.getByText("tokens · last 30 days")).toBeInTheDocument();
	});
});

describe("what the reading admits", () => {
	it("counts what was kept private, without scoring it", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(
			screen.getByText(/kept private: 2 MCP servers, 10 skills/),
		).toBeInTheDocument();
		expect(document.body.textContent).not.toMatch(/kept private[^.]*%/);
	});

	it("stays quiet about a clean scan", () => {
		const { current, history } = live();
		setup(current, history);
		expect(document.body.textContent).not.toContain("Partial read");
	});

	it("calls a degraded scan a floor", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(
			{
				...current,
				harnesses: current.harnesses.map((h) => ({
					...h,
					coverage: {
						filesScanned: 3015,
						filesUnreadable: 61,
						linesParsed: 232058,
						linesFailed: 4192,
					},
				})),
			},
			history,
		);
		expect(
			screen.getByText(/The numbers below are a floor/),
		).toBeInTheDocument();
	});

	it("admits when the reading is going stale", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(
			{
				...current,
				receivedAt: Date.now() - 19 * DAY,
				isFresh: false,
				harnesses: current.harnesses.map((h) => ({
					...h,
					receivedAt: Date.now() - 19 * DAY,
					isFresh: false,
				})),
			},
			history,
		);
		expect(screen.getByText(/this reading is going stale/)).toBeInTheDocument();
	});
});

describe("a stack that has never synced, seen by a visitor", () => {
	it("invites the reader instead of marking the author down", () => {
		setup(null);
		expect(
			screen.getByText("This stack has not been measured yet."),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Stacks can publish what actually ran/),
		).toBeInTheDocument();
		expect(screen.getByText("Actual Usage")).toBeInTheDocument();
		expect(screen.getByText("01")).toBeInTheDocument();
	});

	it("hands the reader the command for their own stack, and the guide", () => {
		setup(null);
		expect(screen.getByText(/have a stack of your own/)).toBeInTheDocument();
		expect(screen.getByText("npx @use-aistack/cli sync")).toBeInTheDocument();
		expect(
			screen.getByText("how measuring works").closest("a"),
		).toHaveAttribute("href", "/sync");
	});

	it("says nothing at all while the query is still out", () => {
		setup(undefined, undefined);
		expect(
			screen.queryByText("This stack has not been measured yet."),
		).not.toBeInTheDocument();
		expect(screen.getByText("Actual Usage")).toBeInTheDocument();
	});
});

describe("a stack that has never synced, seen by its owner", () => {
	it("teaches the one command inline", () => {
		setup(null, null, { isOwner: true });
		expect(
			screen.getByText("Your stack has not been measured yet."),
		).toBeInTheDocument();
		expect(screen.getByText("npx @use-aistack/cli sync")).toBeInTheDocument();
		expect(
			screen.queryByText("npx @use-aistack/cli login"),
		).not.toBeInTheDocument();
	});

	it("states the privacy footnote and links the guide", () => {
		setup(null, null, { isOwner: true });
		expect(
			screen.getByText(
				"runs on your machine · you see everything before it sends · cancel sends nothing",
			),
		).toBeInTheDocument();
		expect(screen.getByText("how syncing works").closest("a")).toHaveAttribute(
			"href",
			"/sync",
		);
	});

	it("shows the reading, not the teaching box, once a snapshot exists", () => {
		const { current, history } = live();
		setup(current, history, { isOwner: true });
		expect(
			screen.queryByText("Your stack has not been measured yet."),
		).not.toBeInTheDocument();
		expect(screen.getByText("4.71B")).toBeInTheDocument();
	});
});

describe("positive claims only", () => {
	it("never says a listed thing went unused", () => {
		const { current, history } = live();
		setup(current, history);
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
