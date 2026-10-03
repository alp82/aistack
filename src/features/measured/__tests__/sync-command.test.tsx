import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SYNC_CMD } from "../copy";
import { SyncCommand, SyncHowLink } from "../SyncCommand";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(cleanup);

describe("the sync command", () => {
	it("copies the one command the site teaches", () => {
		const writeText = vi.fn();
		Object.assign(navigator, { clipboard: { writeText } });
		render(<SyncCommand label="add your tokens" />);
		fireEvent.click(screen.getByRole("button"));
		expect(writeText).toHaveBeenCalledWith(SYNC_CMD);
	});

	it("says Copied and keeps the label in the layout", () => {
		// The label holds the width, so the confirmation cannot move the page.
		Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
		render(<SyncCommand label="add your tokens" />);
		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByRole("status").textContent).toBe("Copied");
		expect(screen.getByText("add your tokens").className).toContain(
			"invisible",
		);
	});

	it("links to the sync guide", () => {
		render(<SyncHowLink />);
		expect(screen.getByText(/how it works/i).closest("a")).toHaveAttribute(
			"href",
			"/sync",
		);
	});
});
