import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { harnessLabel, trendOf, trendShort } from "../board";
import { LeaderboardPage } from "../LeaderboardPage";
import { board, NOW, row } from "./fixture";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

function setup(b = board()) {
	return render(<LeaderboardPage board={b} nowMs={NOW} onPage={() => {}} />);
}

describe("the trend", () => {
	it("names Grok Build", () => {
		expect(harnessLabel("grok-build")).toBe("Grok Build");
		expect(harnessLabel("cursor")).toBe("Cursor");
	});
	it("is null below two readings - one dot is not a trend", () => {
		expect(trendOf([{ at: 1, tokens: 100 }])).toBeNull();
		expect(trendOf([])).toBeNull();
	});

	it("is the change across the readings that exist, and it can fall", () => {
		expect(
			trendOf([
				{ at: 1, tokens: 100 },
				{ at: 2, tokens: 79 },
			]),
		).toBeCloseTo(-0.21, 6);
	});

	it("signs the trend for the narrow layout, or says nothing", () => {
		expect(
			trendShort([
				{ at: 1, tokens: 100 },
				{ at: 2, tokens: 79 },
			]),
		).toBe("−21%");
		expect(trendShort([{ at: 1, tokens: 100 }])).toBeNull();
	});
});

describe("the board", () => {
	it("ranks rows with name, tokens and a linked slug", () => {
		setup();
		expect(screen.getByText("OrcDev")).toBeInTheDocument();
		expect(screen.getByText("291.4B")).toBeInTheDocument();
		expect(screen.getByText("OrcDev").closest("a")).toHaveAttribute(
			"href",
			"/stacks/$slug",
		);
	});

	it("draws no line for a single reading and says so", () => {
		setup(
			board({
				rows: [
					row({
						points: [{ at: NOW - 2 * DAY_MS, tokens: 5_000_000 }],
						syncCount: 1,
					}),
				],
			}),
		);
		expect(screen.getByText("1 sync · no trend")).toBeInTheDocument();
	});

	it("renders a fall as a fall", () => {
		setup();
		// Alper's trail goes 10M -> 8M: −20% over 2 syncs.
		expect(screen.getAllByText(/−20%/).length).toBeGreaterThan(0);
	});

	it("colors a fall like a rise - the sign carries the direction (#129)", () => {
		setup();
		// Twice per row: the drawn cell and the narrow layout's signed figure.
		for (const sign of [/^−20%$/, /^\+17%$/]) {
			const cells = screen.getAllByText(sign);
			expect(cells).toHaveLength(2);
			for (const cell of cells) expect(cell).toHaveClass("text-accent-lime");
		}
	});

	it("prints spend as a lower bound with its coverage, or exactly", () => {
		setup();
		expect(screen.getByText(/≥\s?\$167,331/)).toBeInTheDocument();
		expect(screen.getByText(/85.2% priced/)).toBeInTheDocument();
		// The fully priced row carries no "at least".
		expect(screen.getByText(/^\$6,042/)).toBeInTheDocument();
	});

	it("says cost not published, never zero", () => {
		setup(board({ rows: [row({ spend: null })] }));
		expect(screen.getByText("cost not published")).toBeInTheDocument();
	});

	it("lists the top skills with their calls and no stack count", () => {
		setup(
			board({
				skillPublishers: 3,
				skills: [
					{
						name: "grilling",
						stackCount: 3,
						stacks: ["OrcDev", "Alper"],
						calls: 41,
						callShare: 0.2,
					},
					{
						name: "tdd",
						stackCount: 2,
						stacks: ["OrcDev"],
						calls: null,
						callShare: null,
					},
				],
			}),
		);
		expect(
			screen.getByRole("heading", { name: "Top skills" }),
		).toBeInTheDocument();
		// Once in the bar, once as a chip.
		expect(screen.getAllByText("grilling")).toHaveLength(2);
		expect(screen.getByText("41")).toBeInTheDocument();
		// A skill with no count has a chip and no segment.
		expect(screen.getAllByText("tdd")).toHaveLength(1);
		// The bar spans the listed skills and says what they cover.
		expect(screen.getByText(/these 1 cover 20%/)).toBeInTheDocument();
	});

	it("draws no skills block when no stack publishes one", () => {
		setup();
		expect(screen.queryByRole("heading", { name: "Top skills" })).toBeNull();
	});

	it("says so when every stack is quiet, instead of an empty frame", () => {
		setup(board({ rows: [], livingCount: 0 }));
		expect(
			screen.getByText(
				"Nothing to rank - every measured stack has been quiet for more than seven days.",
			),
		).toBeInTheDocument();
	});
});

describe("the rail", () => {
	it("names the harnesses in words, not wire ids", () => {
		setup();
		expect(screen.getAllByText("Claude Code").length).toBeGreaterThan(0);
		expect(screen.queryAllByText("claude-code")).toHaveLength(0);
	});

	it("counts the cost publishers next to the spend figure", () => {
		setup();
		expect(screen.getByText(/3 of 4 publish cost/)).toBeInTheDocument();
	});
});

const DAY_MS = 24 * 60 * 60 * 1000;
