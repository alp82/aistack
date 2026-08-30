// @vitest-environment jsdom
/**
 * The stat-row nav and the fixed rail (#217, the shell fit from #193).
 *
 * What these guard:
 *
 *   1. A ROW IS A LINK, NOT AN EXPANDER. Thirteen prototype rounds ended on one
 *      continuous page, and a row that opened something would be the accordion
 *      the ticket saved as the alternative.
 *   2. THE ROW PRINTS THE NUMBER, THE TITLE AND THE STAT, in that order.
 *   3. THE RAIL STARTS HIDDEN AND STAYS OUT OF THE TAB ORDER while it is, so a
 *      keyboard reader never lands on a link they cannot see.
 *   4. THE RAIL CARRIES THE STACK'S IDENTITY: name, price, upvotes.
 */
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StackPageNav } from "../PageNav";
import type { PageSection } from "../pageOrder";

const SECTIONS: PageSection[] = [
	{
		key: "usage",
		index: 1,
		title: "Actual Usage",
		anchor: "section-measured",
		stat: "148.0M tokens",
	},
	{
		key: "tools",
		index: 3,
		title: "Tools",
		anchor: "section-tools",
		stat: "11 tools · $220/mo",
	},
	{
		key: "guide",
		index: 4,
		title: "Guide",
		anchor: "section-guide",
		stat: null,
	},
];

const IDENTITY = { name: "Night Shift", priceText: "$220/mo", upvotes: 12 };

/** jsdom lays nothing out, so the link rows' position is the thing under test. */
function positionRows(
	element: HTMLElement,
	{ top, height }: { top: number; height: number },
) {
	vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
		top,
		height,
		bottom: top + height,
	} as DOMRect);
}

beforeEach(() => {
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			observe() {}
			disconnect() {}
			unobserve() {}
		},
	);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

function block() {
	return screen.getByRole("navigation", { name: "Stack sections" });
}

function rows() {
	const list = block().querySelector("ul");
	if (!list) throw new Error("Stack section rows are missing");
	return list;
}

// The rail is `aria-hidden` until it docks, which is the point: an element the
// accessibility tree is right to skip cannot be reached by role, so the test
// reaches it by test id and asserts the hidden state from there.
function rail() {
	return screen.getByTestId("section-rail");
}

describe("the nav block", () => {
	it("gives every section one link to its anchor", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		const links = within(block()).getAllByRole("link");
		expect(links.map((link) => link.getAttribute("href"))).toEqual([
			"#section-measured",
			"#section-tools",
			"#section-guide",
		]);
	});

	it("prints the number, the title and the stat on a row", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		const row = within(block()).getAllByRole("link")[1];
		expect(row?.textContent).toContain("03");
		expect(row?.textContent).toContain("Tools");
		expect(row?.textContent).toContain("11 tools · $220/mo");
	});

	it("opens nothing: no row is a button or a disclosure", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		expect(within(block()).queryAllByRole("button")).toHaveLength(0);
		expect(block().querySelectorAll("[aria-expanded]").length).toBe(0);
	});

	it("leaves the stat out when a section has none", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		const guide = within(block()).getAllByRole("link")[2];
		expect(guide?.textContent?.replace(/\s/g, "")).toBe("04Guide");
	});

	it("renders nothing at all when no section renders", () => {
		const { container } = render(
			<StackPageNav sections={[]} identity={IDENTITY} />,
		);
		expect(container).toBeEmptyDOMElement();
	});
});

describe("the fixed rail", () => {
	it("starts hidden and keeps its links out of the tab order", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		const pinned = rail();
		expect(pinned).toHaveAttribute("data-shown", "false");
		expect(pinned).toHaveAttribute("aria-hidden", "true");
		for (const link of within(pinned).getAllByRole("link", {
			hidden: true,
		})) {
			expect(link).toHaveAttribute("tabindex", "-1");
		}
	});

	it("carries the stack name, the price and the upvotes", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		expect(rail().textContent).toContain("Night Shift");
		expect(rail().textContent).toContain("$220/mo");
		expect(rail().textContent).toContain("12");
	});

	it("aligns its content to the main header content shell", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		expect(rail()).toHaveClass("px-6");
		expect(screen.getByTestId("section-rail-content")).toHaveClass(
			"mx-auto",
			"w-full",
			"max-w-content",
		);
	});

	// The regression this replaced an IntersectionObserver to fix: on a short
	// screen the block starts BELOW the fold, so a tap on a nav row jumps the
	// reader past it without the block ever overlapping the viewport. An
	// observer sees no crossing and reports nothing; a position read does.
	it("docks on a jump that never crosses the block", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		expect(screen.getByTestId("section-rail")).toHaveAttribute(
			"data-shown",
			"false",
		);

		positionRows(rows(), { top: -500, height: 180 });
		fireEvent.scroll(window);
		expect(screen.getByTestId("section-rail")).toHaveAttribute(
			"data-shown",
			"true",
		);

		positionRows(rows(), { top: 400, height: 180 });
		fireEvent.scroll(window);
		expect(screen.getByTestId("section-rail")).toHaveAttribute(
			"data-shown",
			"false",
		);
	});

	it("docks when half of the clickable rows are hidden behind the header", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);

		positionRows(rows(), { top: -25, height: 180 });
		fireEvent.scroll(window);
		expect(rail()).toHaveAttribute("data-shown", "false");

		positionRows(rows(), { top: -26, height: 180 });
		fireEvent.scroll(window);
		expect(rail()).toHaveAttribute("data-shown", "true");
	});

	it("repeats the same anchors as the block", () => {
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		const railHrefs = within(rail())
			.getAllByRole("link", { hidden: true })
			.map((link) => link.getAttribute("href"));
		expect(railHrefs).toEqual([
			"#section-measured",
			"#section-tools",
			"#section-guide",
		]);
	});
});
