// @vitest-environment jsdom
/**
 * The sticky section nav (#356, the v38 design locked in #352 round 12).
 *
 * What these guard:
 *
 *   1. A TAB IS A LINK TO ITS ANCHOR, printing the number and the title.
 *   2. THE IDENTITY ROW STARTS FOLDED AND OUT OF THE TAB ORDER, and unfolds
 *      when the bar sticks, so a keyboard reader never lands on a control
 *      they cannot see.
 *   3. THE BAR RESTATES: name, price, upvotes and the token figure it is
 *      handed, and no figure it is not.
 *   4. A TAB CLICK SCROLLS TO THE COMPUTED TOP, floored at the bar's natural
 *      top, and writes the hash.
 *   5. THE BAR CARRIES NO CONTROL: the measured range is set in the Stats
 *      section, not here.
 *   6. `aria-current` LANDS WHERE THE MATH SAYS.
 *
 * jsdom lays nothing out, so every position is a mocked rect. The
 * measurement runs one animation frame after a scroll; the frame is stubbed
 * to run synchronously.
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
import { STACK_WIDTH } from "../ui";

const SECTIONS: PageSection[] = [
	{
		key: "usage",
		index: 1,
		title: "Stats",
		anchor: "section-measured",
		stat: "148.0M tokens",
	},
	{
		key: "projects",
		index: 2,
		title: "Projects",
		anchor: "section-projects",
		stat: "3 projects",
	},
	{
		key: "tools",
		index: 3,
		title: "Tools",
		anchor: "section-tools",
		stat: "11 tools",
	},
	{
		key: "guide",
		index: 4,
		title: "Guide",
		anchor: "section-guide",
		stat: null,
	},
];

/** The same page without Tools: the numbers move up, the anchors stay. */
const WITHOUT_TOOLS: PageSection[] = [
	SECTIONS[0] as PageSection,
	SECTIONS[1] as PageSection,
	{ ...(SECTIONS[3] as PageSection), index: 3 },
];

const IDENTITY = {
	name: "Night Shift",
	priceText: "$220/mo",
	upvotes: 12,
	tokenText: "148.0M tokens",
};

const HEADER = 64;
const NAV_HEIGHT = 44;
const VIEWPORT = 800;

/** Where each section sits in the document, in px from the top of the page. */
type Placement = Record<string, { top: number; height: number }>;

const PAGE: Placement = {
	"section-measured": { top: 700, height: 1200 },
	"section-projects": { top: 1900, height: 300 },
	"section-tools": { top: 2200, height: 900 },
	"section-guide": { top: 3100, height: 2500 },
};

/** The bar's natural top: right under a 700px hero. */
let barTop = 700;
let scrollY = 0;

function rect(top: number, height: number): DOMRect {
	return {
		top,
		height,
		bottom: top + height,
		left: 0,
		right: 0,
		width: 0,
		x: 0,
		y: top,
		toJSON: () => ({}),
	};
}

/** Mounts the sections as empty elements whose rects follow `scrollY`. */
function placeSections(placement: Placement) {
	for (const [anchor, box] of Object.entries(placement)) {
		const element = document.createElement("section");
		element.id = anchor;
		element.getBoundingClientRect = () => rect(box.top - scrollY, box.height);
		document.body.append(element);
	}
}

function scrollPage(y: number) {
	scrollY = y;
	fireEvent.scroll(window);
}

function nav() {
	return screen.getByRole("navigation", { name: "Stack sections" });
}

function identityRow() {
	return screen.getByTestId("identity-row");
}

function renderNav(
	props: Partial<React.ComponentProps<typeof StackPageNav>> = {},
) {
	const view = render(
		<StackPageNav sections={SECTIONS} identity={IDENTITY} {...props} />,
	);
	const sentinel = screen.queryByTestId("nav-sentinel");
	if (sentinel)
		sentinel.getBoundingClientRect = () => rect(barTop - scrollY, 0);
	const bar = view.container.querySelector("nav");
	if (bar) Object.defineProperty(bar, "offsetHeight", { value: NAV_HEIGHT });
	// The first measurement ran on mount against unmocked rects; run it again
	// now that the page has a layout.
	fireEvent.scroll(window);
	return view;
}

beforeEach(() => {
	scrollY = 0;
	barTop = 700;
	Object.defineProperty(window, "scrollY", {
		configurable: true,
		get: () => scrollY,
	});
	Object.defineProperty(window, "innerHeight", {
		configurable: true,
		value: VIEWPORT,
	});
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
		callback(0);
		return 1;
	});
	vi.stubGlobal("cancelAnimationFrame", () => {});
	vi.stubGlobal("scrollTo", vi.fn());
	placeSections(PAGE);
});

afterEach(() => {
	cleanup();
	for (const anchor of Object.keys(PAGE)) {
		document.getElementById(anchor)?.remove();
	}
	window.history.replaceState(null, "", "/");
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("the tab row", () => {
	it("gives every section one link to its anchor, with the number and the title", () => {
		renderNav();
		const links = within(nav()).getAllByRole("link");
		expect(links.map((link) => link.getAttribute("href"))).toEqual([
			"#section-measured",
			"#section-projects",
			"#section-tools",
			"#section-guide",
		]);
		expect(links[2]?.textContent?.replace(/\s/g, "")).toBe("03Tools");
		expect(links[3]?.textContent?.replace(/\s/g, "")).toBe("04Guide");
	});

	it("renders nothing at all when no section renders", () => {
		const { container } = renderNav({ sections: [] });
		expect(container).toBeEmptyDOMElement();
	});

	it("follows the sections it is handed when Tools is absent", () => {
		renderNav({ sections: WITHOUT_TOOLS });
		const links = within(nav()).getAllByRole("link");
		expect(links.map((link) => link.getAttribute("href"))).toEqual([
			"#section-measured",
			"#section-projects",
			"#section-guide",
		]);
		expect(links[2]?.textContent?.replace(/\s/g, "")).toBe("03Guide");
	});

	it("aligns both rows to the shared content frame", () => {
		renderNav();
		expect(screen.getByTestId("tab-row")).toHaveClass(
			"mx-auto",
			"px-6",
			STACK_WIDTH,
		);
		const inner = within(identityRow()).getByRole("button", {
			hidden: true,
		}).firstElementChild;
		expect(inner).toHaveClass("mx-auto", "px-6", STACK_WIDTH);
	});
});

describe("the identity row", () => {
	it("starts folded with its control out of the tab order", () => {
		renderNav();
		expect(identityRow()).toHaveAttribute("data-shown", "false");
		expect(identityRow()).toHaveAttribute("aria-hidden", "true");
		expect(
			within(identityRow()).getByRole("button", { hidden: true }),
		).toHaveAttribute("tabindex", "-1");
	});

	it("unfolds when the bar sticks and folds again on the way back up", () => {
		renderNav();
		scrollPage(barTop - HEADER - 1);
		expect(identityRow()).toHaveAttribute("data-shown", "false");

		scrollPage(barTop - HEADER);
		expect(identityRow()).toHaveAttribute("data-shown", "true");
		expect(identityRow()).not.toHaveAttribute("aria-hidden");
		expect(within(identityRow()).getByRole("button")).toHaveAttribute(
			"tabindex",
			"0",
		);

		scrollPage(200);
		expect(identityRow()).toHaveAttribute("data-shown", "false");
	});

	it("reads the natural top fresh, so a layout shift above the bar counts", () => {
		renderNav();
		scrollPage(650);
		expect(identityRow()).toHaveAttribute("data-shown", "true");
		// The owner drawer opens and pushes the bar 300px down the page.
		barTop = 1000;
		scrollPage(651);
		expect(identityRow()).toHaveAttribute("data-shown", "false");
	});

	it("carries the name, the price, the upvotes and the token figure", () => {
		renderNav();
		const row = identityRow();
		expect(row).toHaveTextContent("Night Shift");
		expect(row).toHaveTextContent("$220/mo");
		expect(row).toHaveTextContent("12");
		expect(row).toHaveTextContent("148.0M tokens");
	});

	it("prints no token figure when it is handed none", () => {
		renderNav({ identity: { ...IDENTITY, tokenText: null } });
		expect(identityRow()).not.toHaveTextContent("tokens");
		expect(identityRow()).toHaveTextContent("Night Shift");
	});

	it("scrolls to the top when clicked", () => {
		renderNav();
		scrollPage(2000);
		fireEvent.click(within(identityRow()).getByRole("button"));
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 0,
			behavior: "smooth",
		});
	});
});

describe("a tab click", () => {
	it("smooth-scrolls to 88px under the header and writes the hash", () => {
		renderNav();
		fireEvent.click(screen.getByRole("link", { name: /Tools/ }));
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 2200 - HEADER - 88,
			behavior: "smooth",
		});
		expect(window.location.hash).toBe("#section-tools");
	});

	it("floors the jump at the bar's natural top, so Stats lands stuck", () => {
		renderNav();
		fireEvent.click(screen.getByRole("link", { name: /Stats/ }));
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: barTop - HEADER,
			behavior: "smooth",
		});
	});

	it("can scroll UP while the bar is already stuck", () => {
		// Round 11 of #352: a floor read off the stuck bar equals the current
		// scroll, and no click can go up. The sentinel keeps reporting 700.
		renderNav();
		scrollPage(4000);
		expect(identityRow()).toHaveAttribute("data-shown", "true");
		fireEvent.click(screen.getByRole("link", { name: /Stats/ }));
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: barTop - HEADER,
			behavior: "smooth",
		});
		fireEvent.click(screen.getByRole("link", { name: /Projects/ }));
		expect(window.scrollTo).toHaveBeenLastCalledWith({
			top: 1900 - HEADER - 88,
			behavior: "smooth",
		});
	});
});

describe("the bar's controls", () => {
	it("carries none: the range is set in the Stats section", () => {
		renderNav();
		expect(within(nav()).queryByRole("combobox")).toBeNull();
		expect(nav().textContent).not.toContain("window");
	});
});

describe("the visibility segments", () => {
	function segmentOf(name: RegExp) {
		const link = screen.getByRole("link", { name });
		const bar = link.querySelector("[aria-hidden]") as HTMLElement;
		return { link, left: bar.style.left, width: bar.style.width };
	}

	it("draws no segment before the first client measurement", () => {
		// The server markup: not stuck, nothing highlighted.
		render(<StackPageNav sections={SECTIONS} identity={IDENTITY} />);
		expect(identityRow()).toHaveAttribute("data-shown", "false");
		expect(nav().querySelectorAll("[aria-current]")).toHaveLength(0);
	});

	it("starts Stats at zero when it sits right under the bar after a jump", () => {
		renderNav();
		// Landed from a Stats click: the bar is stuck and Stats begins where
		// the bar ends (barTop + NAV_HEIGHT is 744; Stats top is 700, so the
		// first 44px sit behind the bar, which is 3.7% of 1200).
		scrollPage(barTop - HEADER);
		const stats = segmentOf(/Stats/);
		expect(stats.left).toBe("3.7%");
		expect(stats.link).toHaveAttribute("aria-current", "location");

		// With Stats placed exactly under the bar the segment starts at 0.
		const element = document.getElementById("section-measured");
		if (element) {
			element.getBoundingClientRect = () =>
				rect(barTop + NAV_HEIGHT - scrollY, 1200);
		}
		scrollPage(barTop - HEADER);
		expect(segmentOf(/Stats/).left).toBe("0%");
	});

	it("marks the section the math calls active and moves on as the reader scrolls", () => {
		renderNav();
		// Top of the page: the bar's bottom is at 108, the fold at 800. Stats
		// (700 to 1900) fills 100 of 692 viewport px: not active yet.
		expect(nav().querySelectorAll("[aria-current]")).toHaveLength(0);

		// Deep in Stats: 692 of 800 viewport px show it.
		scrollPage(1000);
		expect(segmentOf(/Stats/).link).toHaveAttribute("aria-current");
		expect(segmentOf(/Projects/).link).not.toHaveAttribute("aria-current");

		// Projects (300px) is short; showing it whole makes it active, and
		// Stats, with 6% of its own height left, drops out.
		scrollPage(1900 - HEADER - NAV_HEIGHT);
		expect(segmentOf(/Projects/).link).toHaveAttribute("aria-current");
		expect(segmentOf(/Projects/)).toMatchObject({
			left: "0%",
			width: "calc(100% + 1px)",
		});
		expect(segmentOf(/Stats/)).toMatchObject({ left: "100%", width: "0%" });
		expect(segmentOf(/Stats/).link).not.toHaveAttribute("aria-current");

		// Scrolling back up brings Stats back.
		scrollPage(1000);
		expect(segmentOf(/Stats/).link).toHaveAttribute("aria-current");
		expect(segmentOf(/Projects/).link).not.toHaveAttribute("aria-current");
	});

	it("bleeds one pixel into the next tab once the section's end is on screen", () => {
		renderNav();
		// Projects shows whole: its segment meets Tools' segment at the seam.
		scrollPage(1900 - HEADER - NAV_HEIGHT);
		expect(segmentOf(/Projects/).width).toBe("calc(100% + 1px)");
		// Stats is spent and Guide has not begun: neither bleeds.
		expect(segmentOf(/Stats/).width).toBe("0%");
		expect(segmentOf(/Guide/).width).toBe("0%");
	});

	it("remeasures on resize", () => {
		renderNav();
		// The bar's bottom is at 1808 and the fold at 2500. Stats has 92px
		// left (13% of the 692px viewport), Projects shows whole.
		scrollPage(1700);
		expect(segmentOf(/Stats/).link).not.toHaveAttribute("aria-current");
		expect(segmentOf(/Projects/).link).toHaveAttribute("aria-current");
		// A 290px window: the fold moves to 1990 and the viewport under the bar
		// is 182px, so Stats' 92px is now half of it, and Projects' 90px is
		// under half of the viewport and under half of the section.
		Object.defineProperty(window, "innerHeight", {
			configurable: true,
			value: 290,
		});
		fireEvent(window, new Event("resize"));
		expect(segmentOf(/Stats/).link).toHaveAttribute("aria-current");
		expect(segmentOf(/Projects/).link).not.toHaveAttribute("aria-current");
	});
});
