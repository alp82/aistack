import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PulseBand } from "../PulseBand";
import { band, points, syncRow } from "./fixture";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(cleanup);

describe("the band", () => {
	it("leads with what the site measured, tokens on the accent", () => {
		render(<PulseBand band={band()} variant="landing" />);
		const tokens = screen.getByText("+512M");
		expect(tokens).toHaveClass("text-accent-lime");
		expect(screen.getByText("tokens measured")).toBeInTheDocument();
		expect(screen.getByText("596")).toBeInTheDocument();
		expect(screen.getByText("41")).toBeInTheDocument();
		expect(screen.getByText("22")).toBeInTheDocument();
	});

	it("puts what the site DID in the header bar, at kicker size", () => {
		render(<PulseBand band={band()} variant="landing" />);
		expect(screen.getByText("syncs")).toBeInTheDocument();
		expect(screen.getByText("stack update")).toBeInTheDocument();
		expect(screen.getByText("models")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
	});

	it("renders a quiet window as em dashes, never as zeroes", () => {
		render(
			<PulseBand
				band={band({
					totals: {
						syncs: 0,
						updates: 0,
						movedTokens: 0,
						stacksSeen: 4,
					},
					usage: {
						sessions: 0,
						projects: 0,
						models: 0,
						tools: 0,
						stacks: 0,
					},
				})}
				variant="landing"
			/>,
		);
		// Four measured tiles plus the model count. The two event COUNTS stay
		// numeric: "0 syncs" counts what happened, it does not measure anything.
		expect(screen.getAllByText("—")).toHaveLength(5);
		expect(screen.getAllByText("0")).toHaveLength(2);
	});

	it("drops the watermark below three days with a reading", () => {
		const { container } = render(
			<PulseBand
				band={band({ points: points([0, 0, 5, 0, 0]) })}
				variant="landing"
			/>,
		);
		expect(container.querySelector('[aria-hidden="true"] svg')).toBeNull();
	});

	it("draws the watermark once there is a shape to draw", () => {
		const { container } = render(
			<PulseBand
				band={band({ points: points([1, 0, 5, 2, 0]) })}
				variant="landing"
			/>,
		);
		expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
	});

	it("sends the landing reader on to the whole stream", () => {
		render(<PulseBand band={band()} variant="landing" />);
		const button = screen.getByText(/all activity/i).closest("a");
		expect(button).toHaveAttribute("href", "/activity");
		expect(screen.getByText("measured across 4 stacks")).toBeInTheDocument();
	});

	it("drops the footnote row on the page, which does not repeat itself", () => {
		render(<PulseBand band={band()} variant="page" />);
		expect(screen.queryByText(/all activity/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/measured across/)).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "ACTIVITY" }),
		).toBeInTheDocument();
	});

	it("shows its evidence rows on the landing page only", () => {
		const only = { rows: [syncRow()] };
		render(<PulseBand band={band(only)} variant="landing" />);
		expect(screen.getByText("AI Stack")).toBeInTheDocument();
		cleanup();
		render(<PulseBand band={band(only)} variant="page" />);
		expect(screen.queryByText("AI Stack")).not.toBeInTheDocument();
	});
});

describe("a row", () => {
	it("leads with movement and demotes the total", () => {
		render(<PulseBand band={band({ rows: [syncRow()] })} variant="landing" />);
		expect(screen.getByText(/measured usage moved/)).toBeInTheDocument();
		expect(screen.getByText("+285M")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Claude Code + Codex · 4.99B over 30 days · 596 sessions",
			),
		).toBeInTheDocument();
	});

	it("links the stack, not the person", () => {
		render(<PulseBand band={band({ rows: [syncRow()] })} variant="landing" />);
		expect(screen.getByText("AI Stack").closest("a")).toHaveAttribute(
			"href",
			"/stacks/$slug",
		);
	});

	it("says first reading only when it is one", () => {
		render(
			<PulseBand
				band={band({
					rows: [syncRow({ deltaTokens: null, firstReading: true })],
				})}
				variant="landing"
			/>,
		);
		expect(screen.getByText(/first reading/)).toBeInTheDocument();
	});

	it("claims nothing about movement it could not measure", () => {
		render(
			<PulseBand
				band={band({
					rows: [syncRow({ deltaTokens: null, firstReading: false })],
				})}
				variant="landing"
			/>,
		);
		expect(screen.queryByText(/first reading/)).not.toBeInTheDocument();
		expect(screen.queryByText(/moved/)).not.toBeInTheDocument();
		expect(screen.getByText("4.99B tokens")).toBeInTheDocument();
	});
});
