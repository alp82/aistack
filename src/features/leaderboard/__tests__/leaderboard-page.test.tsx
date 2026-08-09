import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { trendOf, trendWords } from "../board";
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
	it("is null below two readings — one dot is not a trend", () => {
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

	it("speaks for the narrow layout that cannot draw it", () => {
		expect(
			trendWords([
				{ at: 1, tokens: 100 },
				{ at: 2, tokens: 79 },
			]),
		).toBe("−21% over 2 syncs");
		expect(trendWords([{ at: 1, tokens: 100 }])).toBe("1 sync");
	});

	it("labels the percentage with the span it covers, not the sync count", () => {
		// The server caps `points` at 60 while reporting the true count, so a
		// stack past the cap used to print a span it never measured (#129).
		const points = Array.from({ length: 60 }, (_, i) => ({
			at: i,
			tokens: 100 - i,
		}));
		expect(trendWords(points, 84)).toBe("−59% over 60 syncs");
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

	it("colors a fall like a rise — the sign carries the direction (#129)", () => {
		setup();
		// Anchored: the drawn cell states the percentage alone, the narrow
		// layout states it inside a sentence.
		expect(screen.getByText(/^−20%$/)).toHaveClass("text-accent-lime");
		expect(screen.getByText(/^\+17%$/)).toHaveClass("text-accent-lime");
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

	it("folds the quiet group into one line with count and token mass", () => {
		setup();
		expect(
			screen.getByText(
				/2 more stacks have measured history but no sync in the last seven days/,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(/302.0B tokens sit in that group/),
		).toBeInTheDocument();
	});

	it("says so when every stack is quiet, instead of an empty frame", () => {
		setup(board({ rows: [], livingCount: 0 }));
		expect(
			screen.getByText(
				"Nothing to rank — every measured stack has been quiet for more than seven days.",
			),
		).toBeInTheDocument();
	});
});

describe("the rail", () => {
	it("states the excluded share next to the shares it explains", () => {
		setup();
		expect(
			screen.getByText(
				/5.9% of measured tokens carry no model name and are left out of these shares/,
			),
		).toBeInTheDocument();
	});

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
