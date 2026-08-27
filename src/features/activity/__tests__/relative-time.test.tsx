import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RelativeTime, useRelativeLabel } from "@/components/RelativeTime";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const TICK = 20_000;

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

/** Counts its own renders, so a needless one is visible. */
function Probe({ at, onRender }: { at: number; onRender: () => void }) {
	const label = useRelativeLabel(at);
	onRender();
	return <span>{label}</span>;
}

describe("relative time", () => {
	it("renders clear mobile and desktop labels from the same timestamp", () => {
		const at = Date.now() - 3 * MINUTE;
		render(<RelativeTime at={at} />);

		expect(screen.getByText("3 min ago")).toHaveClass("md:hidden");
		expect(screen.getByText("3 minutes ago")).toHaveClass(
			"hidden",
			"md:inline",
		);
	});

	it("renders short mobile units and full desktop words at longer ranges", () => {
		const now = Date.now();
		const cases = [
			{ at: now - 2 * HOUR, mobile: "2h ago", desktop: "2 hours ago" },
			{
				at: now - 90 * 24 * HOUR,
				mobile: "3mo ago",
				desktop: "3 months ago",
			},
			{
				at: now - 364 * 24 * HOUR,
				mobile: "12mo ago",
				desktop: "12 months ago",
			},
		];

		for (const sample of cases) {
			const { unmount } = render(<RelativeTime at={sample.at} />);
			expect(screen.getByText(sample.mobile)).toHaveClass("md:hidden");
			expect(screen.getByText(sample.desktop)).toHaveClass("md:inline");
			unmount();
		}
	});

	it("floors each unit and clamps future timestamps to now", () => {
		const now = Date.now();
		const cases = [
			{ at: now - 59.9 * MINUTE, label: "59 min ago" },
			{ at: now - 23.9 * HOUR, label: "23h ago" },
			{ at: now - 1.6 * 24 * HOUR, label: "1d ago" },
			{ at: now - 13.9 * 24 * HOUR, label: "1w ago" },
		];

		for (const sample of cases) {
			const { unmount } = render(<RelativeTime at={sample.at} />);
			expect(screen.getByText(sample.label)).toHaveClass("md:hidden");
			unmount();
		}

		const { unmount } = render(<RelativeTime at={now + 5 * MINUTE} />);
		expect(screen.getAllByText("just now")).toHaveLength(2);
		unmount();
	});

	it("keeps one interval for the whole page, however many rows subscribe", () => {
		const now = Date.now();
		render(
			<>
				<RelativeTime at={now - HOUR} />
				<RelativeTime at={now - 2 * HOUR} />
				<RelativeTime at={now - 3 * HOUR} />
			</>,
		);
		expect(vi.getTimerCount()).toBe(1);
	});

	it("stops ticking when the last row unmounts", () => {
		const { unmount } = render(<RelativeTime at={Date.now()} />);
		expect(vi.getTimerCount()).toBe(1);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});

	it("moves a fresh row on without a re-render storm on the old ones", () => {
		const now = Date.now();
		const fresh = vi.fn();
		const old = vi.fn();
		render(
			<>
				<Probe at={now} onRender={fresh} />
				<Probe at={now - 5 * HOUR} onRender={old} />
			</>,
		);

		const freshFirst = fresh.mock.calls.length;
		const oldFirst = old.mock.calls.length;
		expect(screen.getByText("just now")).toBeInTheDocument();

		// Past a minute the fresh row has new words; the five-hour row does not.
		act(() => {
			vi.advanceTimersByTime(4 * TICK);
		});

		expect(screen.getByText("1 min ago")).toBeInTheDocument();
		expect(fresh.mock.calls.length).toBeGreaterThan(freshFirst);
		expect(old.mock.calls.length).toBe(oldFirst);
	});

	it("carries the exact moment in the markup, whatever the words say", () => {
		const at = Date.now() - HOUR;
		const { container } = render(<RelativeTime at={at} />);
		const time = container.querySelector("time");
		expect(time).toHaveAttribute("datetime", new Date(at).toISOString());
	});
});
