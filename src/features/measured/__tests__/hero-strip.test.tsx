// @vitest-environment jsdom
/**
 * The hero's measured strip (#46, building #40's H2 hero).
 *
 * Two rules, both decisions:
 *
 *   1. DOLLAR-FREE. The authored price tile stays the hero's only money; the
 *      measured dollar figure appears once, in section 02, beside the sentence
 *      that explains why it moves.
 *   2. NOTHING WITHOUT A SNAPSHOT. A hero stamp reading "not measured" would
 *      turn not installing a CLI into a public demerit on every stack but one.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeroMeasuredStrip } from "@/features/measured/HeroMeasuredStrip";
import type { MeasuredSnapshot } from "../copy";
import { buildSnapshot, DAY } from "./fixture";

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
	render(<HeroMeasuredStrip slug="alps-stack-ab12" />);
}

describe("with a snapshot", () => {
	it("states the measured facts and links down to section 02", () => {
		setup(buildSnapshot());
		expect(screen.getByText("382 sessions")).toBeInTheDocument();
		expect(screen.getByText("22 of the last 30 days")).toBeInTheDocument();
		expect(screen.getByText("claude-fable-5 leads at 35%")).toBeInTheDocument();
		expect(screen.getByText("checked 2h ago")).toBeInTheDocument();
		expect(screen.getByRole("link")).toHaveAttribute(
			"href",
			"#section-measured",
		);
	});

	it("carries no money", () => {
		setup(buildSnapshot());
		const text = document.body.textContent ?? "";
		expect(text).not.toContain("$");
		expect(text).not.toContain("API prices");
	});

	it("claims nothing the machine did not report", () => {
		// The authored tool and model counts are deliberately absent: inside a
		// band labelled "from this machine" they would read as measured facts.
		setup(buildSnapshot());
		expect(document.body.textContent).not.toMatch(/\d+ tools/);
	});

	it("marks a reading that has fallen out of the week", () => {
		const { container } = renderWith(
			buildSnapshot({ receivedAt: Date.now() - 19 * DAY, isFresh: false }),
		);
		expect(container.querySelector(".bg-orange-400")).not.toBeNull();
	});

	it("marks a fresh reading in lime", () => {
		const { container } = renderWith(buildSnapshot());
		expect(container.querySelector(".bg-orange-400")).toBeNull();
	});
});

describe("without a snapshot", () => {
	it("renders nothing at all for a stack that never synced", () => {
		setup(null);
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		expect(document.body.textContent).toBe("");
	});

	it("renders nothing while the query is still out", () => {
		setup(undefined);
		expect(document.body.textContent).toBe("");
	});
});

function renderWith(snapshot: MeasuredSnapshot) {
	queryMock.mockReturnValue(snapshot);
	return render(<HeroMeasuredStrip slug="alps-stack-ab12" />);
}
