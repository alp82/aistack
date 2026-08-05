import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RelativeTime, useRelativeLabel } from "../RelativeTime";

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

		expect(screen.getByText("1m ago")).toBeInTheDocument();
		expect(fresh.mock.calls.length).toBeGreaterThan(freshFirst);
		expect(old.mock.calls.length).toBe(oldFirst);
	});

	it("carries the exact moment in the markup, whatever the words say", () => {
		const at = Date.now() - HOUR;
		render(<RelativeTime at={at} />);
		expect(screen.getByText("1h ago").tagName).toBe("TIME");
		expect(screen.getByText("1h ago")).toHaveAttribute(
			"datetime",
			new Date(at).toISOString(),
		);
	});
});
