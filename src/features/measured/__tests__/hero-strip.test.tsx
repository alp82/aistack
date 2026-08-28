// @vitest-environment jsdom
/**
 * The hero's measured strip (#46, building #40's H2 hero).
 *
 * Two rules, both decisions:
 *
 *   1. DOLLAR-FREE. The authored price tile stays the hero's only money; the
 *      measured dollar figure appears once, in section 01, beside the sentence
 *      that explains why it moves.
 *   2. NOTHING WITHOUT A READING. A hero stamp reading "not measured" would
 *      turn not installing a CLI into a public demerit on every stack but one.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeroMeasuredStrip } from "@/features/measured/HeroMeasuredStrip";
import type { UsageRead } from "@/features/usage/copy";
import {
	HOUR,
	legacyUsage,
	noDaysUsage,
	reading,
	usage,
} from "../../usage/__tests__/fixture";

const DAY = 24 * HOUR;
const queryMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

function setup(answer: UsageRead | null | undefined) {
	queryMock.mockReturnValue(answer);
	return render(<HeroMeasuredStrip slug="alps-stack-ab12" />);
}

describe("with days", () => {
	it("states the measured facts and links down to section 01", () => {
		setup(usage());
		expect(screen.getByText("120 sessions")).toBeInTheDocument();
		expect(screen.getByText("3 of the last 30 days")).toBeInTheDocument();
		expect(screen.getByText("Claude Opus 5 leads at 60%")).toBeInTheDocument();
		expect(screen.getByText("2h ago")).toHaveClass("md:hidden");
		expect(screen.getByText("2 hours ago")).toHaveClass("md:inline");
		expect(screen.getByRole("link")).toHaveAttribute(
			"href",
			"#section-measured",
		);
	});

	it("carries no money", () => {
		setup(usage());
		const text = document.body.textContent ?? "";
		expect(text).not.toContain("$");
		expect(text).not.toContain("API prices");
	});

	it("claims nothing the machine did not report", () => {
		// The authored tool and model counts are deliberately absent: inside a
		// band labelled "from this machine" they would read as measured facts.
		setup(usage());
		expect(document.body.textContent).not.toMatch(/\d+ tools/);
	});

	it("reads one session in the singular", () => {
		setup(usage({ current: reading({ sessions: 1 }) }));
		expect(screen.getByText("1 session")).toBeInTheDocument();
	});

	// The dot reads the 48-hour line the stamp in section 01 reads (#107
	// decision 2), never a 7-day flag.
	it("marks a reading past 48 hours", () => {
		const { container } = setup(usage({ receivedAt: Date.now() - 19 * DAY }));
		expect(container.querySelector(".bg-orange-400")).not.toBeNull();
	});

	it("marks a fresh reading in lime", () => {
		const { container } = setup(usage());
		expect(container.querySelector(".bg-orange-400")).toBeNull();
	});

	// The clock is frozen for the boundary itself: the milliseconds between
	// building the reading and rendering it would otherwise decide the case.
	it("holds the lime dot at exactly 48 hours", () => {
		const container = atExactly(48 * HOUR);
		expect(container.querySelector(".bg-orange-400")).toBeNull();
	});

	it("turns the dot one millisecond past 48 hours", () => {
		const container = atExactly(48 * HOUR + 1);
		expect(container.querySelector(".bg-orange-400")).not.toBeNull();
	});
});

describe("with only the legacy figure", () => {
	it("states the legacy totals and no model line", () => {
		setup(legacyUsage());
		expect(screen.getByText("382 sessions")).toBeInTheDocument();
		expect(screen.getByText("22 of the last 30 days")).toBeInTheDocument();
		expect(screen.queryByText(/leads at/)).not.toBeInTheDocument();
		expect(document.body.textContent).not.toContain("$");
	});
});

describe("without a reading", () => {
	it("renders nothing at all for a stack that never synced", () => {
		setup(noDaysUsage());
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		expect(document.body.textContent).toBe("");
	});

	it("renders nothing for an unpublished stack", () => {
		setup(null);
		expect(document.body.textContent).toBe("");
	});

	it("renders nothing while the query is still out", () => {
		setup(undefined);
		expect(document.body.textContent).toBe("");
	});
});

/** The strip rendered with the clock stopped, so an age is exactly an age. */
function atExactly(ageMs: number) {
	vi.useFakeTimers();
	try {
		const { container } = setup(usage({ receivedAt: Date.now() - ageMs }));
		return container;
	} finally {
		vi.useRealTimers();
	}
}
