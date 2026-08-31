// @vitest-environment jsdom
/**
 * The two owner-private view surfaces (#112, from the shapes #98 picked).
 *
 * The map locked three things about them, so the tests guard those and not the
 * layout:
 *
 *   1. OWNER-GATED IS WHAT PRIVATE MEANS. Both surfaces sit on public routes.
 *      A caller who is not the owner gets no line, no number and no lock. The
 *      server HTML for that case is asserted in `visitor-ssr.test.tsx`.
 *   2. NO NUMBER WITHOUT ITS LABELING. Deduped daily visitors, per UTC day, a
 *      browser and not a person, owner views left out, not page loads.
 *   3. THE EMPTY AND THIN STATES ARE DECISIONS. A creator with no views, a
 *      stack published yesterday and a draft nobody can open all keep working,
 *      and a page with one reading draws no trail.
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	OwnerViewsPanel,
	OwnerViewsPanelView,
} from "@/features/view-analytics/OwnerViewsPanel";
import {
	StackViewsLine,
	StackViewsLineView,
} from "@/features/view-analytics/StackViewsLine";
import { analytics, days, emptyAnalytics, target } from "./fixture";

const queryMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

/** Answer `viewAnalytics.mine` with `data`, and honor a skipped call. */
function answerMine(data: unknown) {
	queryMock.mockImplementation((ref: never, args: unknown) => {
		if (args === "skip") return undefined;
		return getFunctionName(ref).endsWith("mine") ? data : undefined;
	});
}

const PER_PAGE_LIST = "Views per page";

// ---------------------------------------------------------------------------
// The profile panel - shape E4
// ---------------------------------------------------------------------------

describe("OwnerViewsPanel", () => {
	it("leads with the total for the window it actually covers", () => {
		render(<OwnerViewsPanelView data={analytics()} />);
		expect(screen.getByText("24")).toBeTruthy();
		expect(
			screen.getByText(/deduped daily visitors · since Aug 1, 2026/),
		).toBeTruthy();
	});

	it("says the numbers are private, with a lock and the words", () => {
		render(<OwnerViewsPanelView data={analytics()} />);
		expect(screen.getByText(/only you can see this/i)).toBeTruthy();
	});

	it("says what the number is not: not a person, not page loads", () => {
		render(<OwnerViewsPanelView data={analytics()} />);
		const text = document.body.textContent ?? "";
		expect(text).toMatch(/not a person/i);
		expect(text).toMatch(/page loads/i);
		expect(text).toMatch(/signed in/i);
	});

	it("gives the profile and every stack its own box and its own total", () => {
		render(<OwnerViewsPanelView data={analytics()} />);
		const rows = within(screen.getByRole("list", { name: PER_PAGE_LIST }));
		expect(rows.getByText("Your profile")).toBeTruthy();
		expect(rows.getByText("Main Stack")).toBeTruthy();
		expect(rows.getByText("9")).toBeTruthy();
		expect(rows.getByText("15")).toBeTruthy();
	});

	it("points at the page that adds the day-by-day reading and the referrers", () => {
		render(<OwnerViewsPanelView data={analytics()} />);
		expect(screen.getByRole("link", { name: /day by day/i })).toHaveAttribute(
			"href",
			"/settings/analytics",
		);
	});

	it("keeps every public stack in the list when its number is zero", () => {
		render(<OwnerViewsPanelView data={emptyAnalytics()} />);
		const rows = within(screen.getByRole("list", { name: PER_PAGE_LIST }));
		expect(rows.getByText("Second Stack")).toBeTruthy();
		expect(rows.getAllByText(/nobody has opened it yet/i)).toHaveLength(3);
	});

	it("tells a creator with no views what starts the counting, and prints no total", () => {
		render(<OwnerViewsPanelView data={emptyAnalytics()} />);
		expect(screen.getByText(/Nobody has opened your pages yet/i)).toBeTruthy();
		// Nothing was counted, so no window was observed. "0 · last 30 days"
		// would be a claim about 30 days nobody watched.
		expect(document.body.textContent).not.toMatch(/last 30 days/);
	});

	it("draws a trail for a page with enough readings to make a line", () => {
		render(<OwnerViewsPanelView data={analytics()} />);
		const list = screen.getByRole("list", { name: PER_PAGE_LIST });
		expect(list.querySelectorAll("svg").length).toBeGreaterThan(0);
	});

	it("still shows a page with one reading, which is too thin to draw a trail", () => {
		render(
			<OwnerViewsPanelView
				data={analytics({
					total: 3,
					targets: [
						target({ label: "Two Day Old", total: 3, days: days([3]) }),
					],
				})}
			/>,
		);
		const list = screen.getByRole("list", { name: PER_PAGE_LIST });
		const rows = within(list);
		expect(rows.getByText("Two Day Old")).toBeTruthy();
		expect(rows.getByText("3")).toBeTruthy();
		// One point is not a line. The box carries the name and the number, and
		// the column holds its width, so the list does not rag.
		expect(list.querySelector("svg")).toBeNull();
	});

	it("renders nothing at all while the query is still answering", () => {
		answerMine(undefined);
		const { container } = render(<OwnerViewsPanel />);
		expect(container.innerHTML).toBe("");
	});

	it("renders nothing for a caller with no creator row", () => {
		answerMine(null);
		const { container } = render(<OwnerViewsPanel />);
		expect(container.innerHTML).toBe("");
	});
});

// ---------------------------------------------------------------------------
// The stack-page line - shape S1
// ---------------------------------------------------------------------------

describe("StackViewsLine", () => {
	it("carries this stack's total, its range and the labeling in one line", () => {
		render(
			<StackViewsLineView data={analytics()} target={target({ total: 15 })} />,
		);
		expect(screen.getByText("15")).toBeTruthy();
		expect(screen.getByText(/only you can see this/i)).toBeTruthy();
		expect(
			screen.getByText(
				/deduped daily visitors · since Aug 1, 2026 · not page loads/i,
			),
		).toBeTruthy();
	});

	it("dates the range from this stack's first counted day, not the site's", () => {
		// The profile has been counted since Aug 1. This stack was first opened
		// on Aug 4, and saying otherwise would hand it three days it never had.
		render(
			<StackViewsLineView
				data={analytics()}
				target={target({ total: 5, days: days([2, 3]) })}
			/>,
		);
		expect(screen.getByText(/since Aug 4, 2026/)).toBeTruthy();
	});

	it("says a stack nobody has opened in words, rather than showing a bare zero", () => {
		render(
			<StackViewsLineView
				data={analytics()}
				target={target({ total: 0, days: [] })}
			/>,
		);
		expect(screen.getByText(/Nobody has opened it yet/i)).toBeTruthy();
		expect(screen.queryByText("0")).toBeNull();
	});

	it("links to the page that holds every other page", () => {
		render(<StackViewsLineView data={analytics()} target={target()} />);
		expect(screen.getByRole("link", { name: /all pages/i })).toHaveAttribute(
			"href",
			"/settings/analytics",
		);
	});

	it("renders nothing, and asks for nothing, for a reader who is not the owner", () => {
		answerMine(analytics());
		const { container } = render(
			<StackViewsLine stackId="stack_1" isOwner={false} />,
		);
		expect(container.innerHTML).toBe("");
		expect(queryMock).toHaveBeenCalledWith(expect.anything(), "skip");
	});

	it("renders nothing for a stack the answer does not contain", () => {
		// The owner of OTHER stacks opening this one. `mine` never carries this
		// id, so the selection has nothing to find - the gate is the data, not a
		// flag on the client.
		answerMine(analytics());
		const { container } = render(
			<StackViewsLine stackId="stack_somebody_else" isOwner={true} />,
		);
		expect(container.innerHTML).toBe("");
	});

	it("draws the line for the owner of this stack", () => {
		answerMine(analytics());
		render(<StackViewsLine stackId="stack_1" isOwner={true} />);
		expect(screen.getByText("15")).toBeTruthy();
		expect(screen.getByText(/only you can see this/i)).toBeTruthy();
	});
});
