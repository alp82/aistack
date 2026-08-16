// @vitest-environment jsdom
/**
 * What `/sync` says about the switch (#104).
 *
 * The guide page teaches the command. The switch is a permission on ONE stack,
 * and `/sync` is a page about syncing in general - it has no stack to act on.
 * So it points at the switch and stops. A second copy of the control here would
 * be a second place the permission appears to live, which is the exact problem
 * #102 moved the flag onto the stack to end.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AutoSyncNote } from "../AutoSyncNote";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(cleanup);

describe("the /sync note", () => {
	it("names auto-sync and where its switch is", () => {
		render(<AutoSyncNote />);
		expect(screen.getByText(/auto-sync/i)).toBeTruthy();
		expect(screen.getByText(/stack page/i)).toBeTruthy();
	});

	it("says the switch is what turns it off, from any browser", () => {
		render(<AutoSyncNote />);
		expect(document.body.textContent).toMatch(/turn it off/i);
	});

	it("duplicates no control", () => {
		render(<AutoSyncNote />);
		expect(screen.queryAllByRole("button")).toHaveLength(0);
		expect(screen.queryAllByRole("switch")).toHaveLength(0);
		expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
	});
});
