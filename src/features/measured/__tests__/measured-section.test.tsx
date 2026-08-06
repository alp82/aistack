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
import type { AutoSyncFlag } from "../autoSync";
import type { MeasuredSnapshot } from "../copy";
import type { MeasuredHistory } from "../history";
import { HOUR } from "./fixture";
import { buildHistory, currentFromHistory } from "./history.fixture";

const queryMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
	useMutation: () => vi.fn(() => Promise.resolve()),
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
	{
		isOwner = false,
		autoSync = { autoSync: null, lastAutoSyncAt: null },
	}: { isOwner?: boolean; autoSync?: AutoSyncFlag } = {},
) {
	const historyRef = getFunctionName(api.measured.getHistoryByStackSlug);
	const autoSyncRef = getFunctionName(api.autoSync.get);
	queryMock.mockImplementation((ref: Parameters<typeof getFunctionName>[0]) => {
		const name = getFunctionName(ref);
		if (name === historyRef) return history;
		if (name === autoSyncRef) return autoSync;
		return snapshot;
	});
	render(
		<MeasuredSection
			index={1}
			slug="alps-stack-ab12"
			stackId={"stack_ab12" as never}
			isOwner={isOwner}
		/>,
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
		expect(
			screen.getByText("at least, at api list prices"),
		).toBeInTheDocument();
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
});

/**
 * The page's age, said once (#108, building #107 decisions 1 and 2).
 *
 * The stamp replaced three age claims that disagreed: a hero dot at 7 days, a
 * per-harness "going stale" line at 7 days, and no line at all at 48 hours. The
 * page now speaks at 48 hours, at the number, to every reader.
 */
describe("how old the reading is", () => {
	function aged(ageMs: number, options: { isOwner?: boolean } = {}) {
		const { current, history } = live({ claudeCodeOnly: true });
		const receivedAt = Date.now() - ageMs;
		setup(
			{
				...current,
				receivedAt,
				harnesses: current.harnesses.map((h) => ({ ...h, receivedAt })),
			},
			history,
			options,
		);
	}

	/**
	 * The same, with the clock stopped. The boundary case cannot survive real
	 * time: the milliseconds between building the snapshot and rendering it
	 * would decide it.
	 */
	function agedExactly(ageMs: number) {
		vi.useFakeTimers();
		try {
			aged(ageMs);
		} finally {
			vi.useRealTimers();
		}
	}

	it("stamps the age on the number once it is past 48 hours", () => {
		aged(3 * 24 * HOUR);
		expect(screen.getByText(/3 days ago · 30-day window/)).toBeInTheDocument();
	});

	it("stamps nothing on a reading inside 48 hours", () => {
		aged(47 * HOUR);
		expect(document.body.textContent).not.toContain("-day window");
	});

	// The boundary itself is still current: "older than 48 hours" excludes 48.
	it("stamps nothing at exactly 48 hours", () => {
		agedExactly(48 * HOUR);
		expect(document.body.textContent).not.toContain("-day window");
	});

	it("stamps a reading one millisecond past the line", () => {
		agedExactly(48 * HOUR + 1);
		expect(screen.getByText(/2 days ago · 30-day window/)).toBeInTheDocument();
	});

	// #107 decision 2 deleted it. Three windows for one sync taught nobody
	// anything, and the leaderboard keeps 7 days because it ranks rows (#82).
	it("carries no per-harness going-stale line any more", () => {
		aged(19 * 24 * HOUR);
		expect(document.body.textContent).not.toContain("going stale");
	});

	it("never says stale, to anyone", () => {
		aged(19 * 24 * HOUR, { isOwner: true });
		expect(document.body.textContent?.toLowerCase()).not.toContain("stale");
	});

	// One element for every reader (#107 decision 1). The visitor reads the age
	// and no sentence about it, so the page never sells them a fix they cannot
	// apply.
	it("gives a visitor the stamp and no remedy", () => {
		aged(3 * 24 * HOUR);
		expect(screen.getByText(/3 days ago · 30-day window/)).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("keeps this page current");
	});

	it("promotes the switch for an owner, and asks once", () => {
		aged(3 * 24 * HOUR, { isOwner: true });
		expect(
			screen.getByText(/Auto-sync keeps this page current/),
		).toBeInTheDocument();
		expect(
			screen.getAllByText("npx @use-aistack/cli sync --auto on"),
		).toHaveLength(1);
	});

	it("leaves the switch resting for an owner inside 48 hours", () => {
		aged(5 * HOUR, { isOwner: true });
		expect(screen.getByText("// auto-sync")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("keeps this page current");
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

	// A stack that never synced is NOT a late stack — it may be hand-curated and
	// complete — so this box carries no age and no warning (#107 decision 3).
	it("carries no age and no warning", () => {
		setup(null, null, { isOwner: true });
		const text = (document.body.textContent ?? "").toLowerCase();
		expect(text).not.toContain("stale");
		expect(text).not.toContain("days ago");
		expect(text).not.toContain("-day window");
	});

	// It cannot offer the switch as the fix either: `enableAutoSync` refuses a
	// machine that is not linked yet. One line, and the one command above it.
	it("says what becomes possible after the first sync", () => {
		setup(null, null, { isOwner: true });
		expect(
			screen.getByText(
				"After that first sync, this stack can keep itself current on a schedule.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText("npx @use-aistack/cli sync --auto on"),
		).not.toBeInTheDocument();
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

/**
 * The auto-sync switch (#104) lives in the owner box, inside the section it
 * governs: automation is what keeps this reading arriving.
 */
describe("the auto-sync switch", () => {
	it("reaches the owner of a stack that has readings", () => {
		const { current, history } = live();
		setup(current, history, { isOwner: true });
		expect(screen.getByText("// auto-sync")).toBeInTheDocument();
	});

	// The switch is the fix for a stack with no readings, so it must not wait
	// for the readings it exists to produce.
	it("reaches the owner of a stack that has none", () => {
		setup(null, null, { isOwner: true });
		expect(screen.getByText("// auto-sync")).toBeInTheDocument();
	});

	it("is absent for a visitor", () => {
		const { current, history } = live();
		setup(current, history);
		expect(screen.queryByText("// auto-sync")).not.toBeInTheDocument();
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
