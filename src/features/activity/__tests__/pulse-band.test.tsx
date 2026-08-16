import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedRowItem } from "../FeedRows";
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
		render(<PulseBand band={band()} />);
		const tokens = screen.getByText("512M");
		expect(tokens).toHaveClass("text-accent-lime");
		expect(screen.getByText("tokens measured")).toBeInTheDocument();
		expect(screen.getByText("596")).toBeInTheDocument();
		expect(screen.getByText("41")).toBeInTheDocument();
		expect(screen.getByText("22")).toBeInTheDocument();
	});

	it("puts what the site DID in the header bar, at kicker size", () => {
		render(<PulseBand band={band()} />);
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
						stacksSeen: 4,
					},
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
		// Four measured tiles plus the model count. The two event COUNTS stay
		// numeric: "0 syncs" counts what happened, it does not measure anything.
		expect(screen.getAllByText("-")).toHaveLength(5);
		expect(screen.getAllByText("0")).toHaveLength(2);
	});

	it("states the token tile as a level, so it carries no sign (#129)", () => {
		render(<PulseBand band={band()} />);
		expect(screen.queryByText("+512M")).not.toBeInTheDocument();
	});

	it("takes the same quiet guard as its neighbors, not its own value", () => {
		// A window with syncs in it says what it measured, even at zero tokens.
		render(
			<PulseBand
				band={band({
					usage: {
						sessions: 596,
						projects: 41,
						models: 8,
						tools: 22,
						tokens: 0,
						stacks: 2,
					},
				})}
			/>,
		);
		expect(screen.getByText("0")).toBeInTheDocument();
	});

	it("drops the watermark below three days with a reading", () => {
		const { container } = render(
			<PulseBand band={band({ points: points([0, 0, 5, 0, 0]) })} />,
		);
		expect(container.querySelector('[aria-hidden="true"] svg')).toBeNull();
	});

	it("draws the watermark once there is a shape to draw", () => {
		const { container } = render(
			<PulseBand band={band({ points: points([1, 0, 5, 2, 0]) })} />,
		);
		expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
	});

	it("carries the page heading - it IS the page header since #147", () => {
		render(<PulseBand band={band()} />);
		expect(
			screen.getByRole("heading", { name: "ACTIVITY" }),
		).toBeInTheDocument();
		// The landing-only footer left with the landing variant.
		expect(screen.queryByText(/all activity/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/measured across/)).not.toBeInTheDocument();
	});
});

// The row grammar is shared by the /activity stream and the landing hero's
// summary line, so it is tested on the row component itself.
describe("a row", () => {
	function renderRow(row = syncRow()) {
		return render(
			<ul>
				<FeedRowItem row={row} />
			</ul>,
		);
	}

	it("leads with movement and demotes the total", () => {
		renderRow();
		expect(screen.getByText(/measured usage moved/)).toBeInTheDocument();
		expect(screen.getByText("+285M")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Claude Code + Codex · 4.99B over 30 days · 596 sessions",
			),
		).toBeInTheDocument();
	});

	it("links the stack, not the person", () => {
		renderRow();
		expect(screen.getByText("AI Stack").closest("a")).toHaveAttribute(
			"href",
			"/stacks/$slug",
		);
	});

	it("says first reading only when it is one", () => {
		renderRow(syncRow({ deltaTokens: null, firstReading: true }));
		expect(screen.getByText(/first reading/)).toBeInTheDocument();
	});

	it("claims nothing about movement it could not measure", () => {
		renderRow(syncRow({ deltaTokens: null, firstReading: false }));
		expect(screen.queryByText(/first reading/)).not.toBeInTheDocument();
		expect(screen.queryByText(/moved/)).not.toBeInTheDocument();
		expect(screen.getByText("4.99B tokens")).toBeInTheDocument();
	});
});
