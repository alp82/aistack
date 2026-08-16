import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActivityPage } from "../ActivityPage";
import {
	band,
	changedRow,
	NOW,
	publishedRow,
	stream,
	syncRow,
} from "./fixture";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(cleanup);

function setup(over: Parameters<typeof page>[0] = {}) {
	return page(over);
}

function page({
	streamOver = {},
	bandOver = {},
	filter = "all" as const,
	onFilter = () => {},
	onOlder = () => {},
}: {
	streamOver?: Parameters<typeof stream>[0];
	bandOver?: Parameters<typeof band>[0];
	filter?: Parameters<typeof ActivityPage>[0]["filter"];
	onFilter?: (f: Parameters<typeof ActivityPage>[0]["filter"]) => void;
	onOlder?: () => void;
} = {}) {
	return render(
		<ActivityPage
			band={band(bandOver)}
			stream={stream(streamOver)}
			filter={filter}
			nowMs={NOW}
			onFilter={onFilter}
			onOlder={onOlder}
		/>,
	);
}

describe("the page", () => {
	it("opens with the band the landing page states", () => {
		setup();
		expect(
			screen.getByRole("heading", { name: "ACTIVITY" }),
		).toBeInTheDocument();
		expect(screen.getByText("512M")).toBeInTheDocument();
		expect(screen.getByText("tokens measured")).toBeInTheDocument();
	});

	it("groups the stream by day", () => {
		setup({
			streamOver: {
				rows: [
					syncRow({ at: NOW - 60 * 60 * 1000 }),
					changedRow(),
					publishedRow(),
				],
			},
		});
		expect(screen.getByText("TODAY")).toBeInTheDocument();
		expect(screen.getByText("YESTERDAY")).toBeInTheDocument();
	});

	it("offers four chips and marks the live one", () => {
		setup({ filter: "sync.landed" });
		const chip = (name: string) => screen.getByRole("button", { name });
		expect(chip("all")).toHaveAttribute("aria-pressed", "false");
		expect(chip("syncs")).toHaveAttribute("aria-pressed", "true");
		expect(chip("new stacks")).toBeInTheDocument();
		expect(chip("changes")).toBeInTheDocument();
	});

	it("narrows the stream only - the band still states the whole site", () => {
		setup({
			filter: "sync.landed",
			streamOver: { rows: [syncRow()] },
		});
		// The band's counts are untouched by the chip.
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("syncs", { selector: "span" })).toBeInTheDocument();
		expect(screen.queryByText("Halfpipe")).not.toBeInTheDocument();
	});

	it("asks for the next 25 when older is pressed", () => {
		const onOlder = vi.fn();
		setup({ streamOver: { hasMore: true }, onOlder });
		fireEvent.click(screen.getByText("older →"));
		expect(onOlder).toHaveBeenCalledTimes(1);
	});

	it("hides older when nothing older exists, and says so", () => {
		setup({ streamOver: { hasMore: false } });
		expect(screen.queryByText("older →")).not.toBeInTheDocument();
		expect(
			screen.getByText("that is everything since instrumentation went live."),
		).toBeInTheDocument();
	});

	it("says an emptied stream is empty rather than showing a blank page", () => {
		setup({ filter: "stack.published", streamOver: { rows: [] } });
		expect(screen.getByText("nothing here yet.")).toBeInTheDocument();
		expect(
			screen.queryByText("that is everything since instrumentation went live."),
		).not.toBeInTheDocument();
	});

	it("never lets a capped read read as the end of the record", () => {
		setup({
			streamOver: {
				rows: Array.from({ length: 3 }, () => syncRow()),
				hasMore: false,
				maxRows: 3,
			},
		});
		expect(
			screen.getByText("showing the newest 3 events."),
		).toBeInTheDocument();
		expect(
			screen.queryByText("that is everything since instrumentation went live."),
		).not.toBeInTheDocument();
	});

	it("moves the chip when one is pressed", () => {
		const onFilter = vi.fn();
		setup({ onFilter });
		fireEvent.click(screen.getByText("changes"));
		expect(onFilter).toHaveBeenCalledWith("stack.composition_changed");
	});
});
