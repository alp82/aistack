import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PulseHero } from "../PulseHero";
import { band, points, syncRow } from "./fixture";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(cleanup);

describe("the hero", () => {
	it("carries the canonical reading where the animation cannot", () => {
		// SpeedingText paints its digits from an effect, so the crawler-facing
		// sentence is the sr-only line — it holds every figure the reel will show.
		const { container } = render(<PulseHero band={band()} />);
		const reading = container.querySelector(".sr-only");
		expect(reading?.textContent).toContain(
			"512M tokens measured in the last 24 hours",
		);
		expect(reading?.textContent).toContain("596 sessions");
		expect(reading?.textContent).toContain("41 projects");
	});

	it("keeps the canonical reading current when the live band moves", () => {
		// The band is a live subscription; a landing sync re-renders the hero
		// with a new level and the sr-only record follows it.
		const { container, rerender } = render(<PulseHero band={band()} />);
		rerender(
			<PulseHero
				band={band({
					usage: {
						sessions: 601,
						projects: 41,
						models: 8,
						tools: 22,
						tokens: 900_000_000,
						stacks: 2,
					},
				})}
			/>,
		);
		expect(container.querySelector(".sr-only")?.textContent).toContain(
			"900M tokens measured",
		);
	});

	it("names its window in the kicker", () => {
		render(<PulseHero band={band()} />);
		expect(screen.getByText("Usage in the last 24 hours")).toBeInTheDocument();
	});

	it("renders a quiet window as an em dash, with no counter mounted", () => {
		render(
			<PulseHero
				band={band({
					usage: {
						sessions: 0,
						projects: 0,
						models: 0,
						tools: 0,
						tokens: 0,
						stacks: 0,
					},
				})}
			/>,
		);
		expect(screen.getByText("—")).toBeInTheDocument();
		expect(screen.queryByText(/tokens measured/)).not.toBeInTheDocument();
	});

	it("compresses the whole feed into one latest line", () => {
		// The line interleaves text nodes and elements, so match on content.
		const { container } = render(
			<PulseHero band={band({ rows: [syncRow()] })} />,
		);
		expect(container.textContent).toContain("latest:");
		expect(container.textContent).toContain("+285M measured");
		const link = screen.getByText("alp/ai-stack-ab12");
		expect(link.closest("a")).toHaveAttribute("href", "/stacks/$slug");
	});

	it("sends the visitor to the sync story, not a form", () => {
		render(<PulseHero band={band()} />);
		expect(screen.getByText(/add your tokens/i).closest("a")).toHaveAttribute(
			"href",
			"/sync",
		);
		expect(screen.getByText(/all activity/i).closest("a")).toHaveAttribute(
			"href",
			"/activity",
		);
	});
});

describe("the trend chart", () => {
	it("titles itself with the range select, defaulting to 7 days", () => {
		render(<PulseHero band={band()} />);
		expect(screen.getByText("Usage in the")).toBeInTheDocument();
		expect(screen.getByText("last 7 days")).toBeInTheDocument();
	});

	it("stands its high and low chips on the line", () => {
		// Fixture's last 7 days: [0, 0, 0, 100M, 200M, 0, 300M].
		render(<PulseHero band={band()} />);
		expect(screen.getByText("300M")).toBeInTheDocument();
		expect(screen.getByText(/high ·/)).toBeInTheDocument();
		expect(screen.getByText(/low ·/)).toBeInTheDocument();
	});

	it("re-slices when the range widens to 30 days", () => {
		render(<PulseHero band={band()} />);
		fireEvent.click(screen.getByText("last 7 days"));
		fireEvent.click(screen.getByText("last 30 days"));
		// The full fixture window still peaks at 300M; the select shows its pick.
		expect(screen.getByText("last 30 days")).toBeInTheDocument();
		expect(screen.getByText("300M")).toBeInTheDocument();
	});

	it("draws nothing below two live days — no shape, no chart", () => {
		render(<PulseHero band={band({ points: points([0, 0, 5, 0, 0]) })} />);
		expect(screen.queryByText("Usage in the")).not.toBeInTheDocument();
	});
});
