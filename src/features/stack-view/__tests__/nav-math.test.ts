/**
 * The sticky nav's arithmetic (#356, design locked in #352 rounds 6 to 12).
 *
 * What these guard:
 *
 *   1. THE SEGMENT IS A SHARE OF THE SECTION. Its left edge is what scrolled
 *      past the bar, its right edge what is still under the fold.
 *   2. A TAB IS ACTIVE ON HALF THE SECTION OR HALF THE VIEWPORT, whichever
 *      comes first, so a short section and a tall one both get their turn.
 *   3. THE JUMP FLOOR IS THE BAR'S NATURAL TOP, never its stuck position
 *      (round 11: measured off the stuck bar, no click could scroll up).
 */
import { describe, expect, it } from "vitest";
import {
	EMPTY_LAYOUT,
	isStuck,
	jumpTarget,
	sameLayout,
	visibleSegment,
} from "../navMath";

// The bar's bottom edge sits at 1000 and the fold at 1800: an 800px window.
const WINDOW = { viewportTop: 1000, viewportBottom: 1800 };

describe("visibleSegment", () => {
	it("skips a section with no height", () => {
		expect(
			visibleSegment({ sectionTop: 1200, sectionHeight: 0, ...WINDOW }),
		).toBeNull();
	});

	it("is fully spent for a section wholly above the bar", () => {
		expect(
			visibleSegment({ sectionTop: 100, sectionHeight: 400, ...WINDOW }),
		).toEqual({ left: 100, width: 0, seam: false, active: false });
	});

	it("has not started for a section wholly below the fold", () => {
		expect(
			visibleSegment({ sectionTop: 2000, sectionHeight: 400, ...WINDOW }),
		).toEqual({ left: 0, width: 0, seam: false, active: false });
	});

	it("starts at zero for the section that sits right under the bar", () => {
		const segment = visibleSegment({
			sectionTop: 1000,
			sectionHeight: 400,
			...WINDOW,
		});
		expect(segment?.left).toBe(0);
		expect(segment?.width).toBe(100);
		expect(segment?.active).toBe(true);
	});

	it("starts part way and bleeds a seam when the top is behind the bar", () => {
		// 100 of 400 px scrolled past the bar, the rest on screen: the segment
		// reaches the tab's right edge, where the next section's begins.
		expect(
			visibleSegment({ sectionTop: 900, sectionHeight: 400, ...WINDOW }),
		).toEqual({ left: 25, width: 75, seam: true, active: true });
	});

	it("stops short of the right edge, with no seam, while the bottom is under the fold", () => {
		// 300 of 400 px on screen, the last 100 below the fold.
		expect(
			visibleSegment({ sectionTop: 1500, sectionHeight: 400, ...WINDOW }),
		).toEqual({ left: 0, width: 75, seam: false, active: true });
	});

	it("shows a short section whole and bleeds into the next tab", () => {
		expect(
			visibleSegment({ sectionTop: 1200, sectionHeight: 200, ...WINDOW }),
		).toEqual({ left: 0, width: 100, seam: true, active: true });
	});

	it("slides a window along a section taller than the viewport", () => {
		const tall = { sectionTop: 600, sectionHeight: 4000 };
		expect(visibleSegment({ ...tall, ...WINDOW })).toEqual({
			left: 10,
			width: 20,
			seam: false,
			active: true,
		});
		// Scrolled 2000px further: the same width, moved along.
		expect(
			visibleSegment({ ...tall, viewportTop: 3000, viewportBottom: 3800 }),
		).toEqual({ left: 60, width: 20, seam: false, active: true });
	});

	it("is active on half the viewport even when that is a sliver of the section", () => {
		// 400 of 800 viewport px show a 4000px section: a tenth of it.
		expect(
			visibleSegment({ sectionTop: 1400, sectionHeight: 4000, ...WINDOW })
				?.active,
		).toBe(true);
		// 399px: neither rule fires.
		expect(
			visibleSegment({ sectionTop: 1401, sectionHeight: 4000, ...WINDOW })
				?.active,
		).toBe(false);
	});

	it("is active on half the section even when that is a sliver of the viewport", () => {
		// 50 of a 100px section, which is 6% of the viewport.
		expect(
			visibleSegment({ sectionTop: 950, sectionHeight: 100, ...WINDOW })
				?.active,
		).toBe(true);
		expect(
			visibleSegment({ sectionTop: 949, sectionHeight: 100, ...WINDOW })
				?.active,
		).toBe(false);
	});

	it("rounds to a tenth of a percent so scroll noise does not rerender", () => {
		const segment = visibleSegment({
			sectionTop: 1000,
			sectionHeight: 3000,
			viewportTop: 1001,
			viewportBottom: 1800,
		});
		expect(segment?.left).toBe(0);
		expect(segment?.width).toBe(26.6);
	});
});

describe("isStuck", () => {
	const bar = { naturalTop: 700, headerHeight: 64 };

	it("is not stuck at the top of the page", () => {
		expect(isStuck({ ...bar, scrollY: 0 })).toBe(false);
	});

	it("sticks the moment the natural top reaches the site header", () => {
		expect(isStuck({ ...bar, scrollY: 635 })).toBe(false);
		expect(isStuck({ ...bar, scrollY: 636 })).toBe(true);
		expect(isStuck({ ...bar, scrollY: 5000 })).toBe(true);
	});

	it("does not treat a bar with no hero above it as stuck at rest", () => {
		expect(isStuck({ naturalTop: 0, headerHeight: 64, scrollY: 0 })).toBe(
			false,
		);
	});
});

describe("jumpTarget", () => {
	const page = { barTop: 700, headerHeight: 64, offset: 88 };

	it("lands the section 88px under the site header", () => {
		expect(jumpTarget({ ...page, sectionTop: 3000 })).toBe(3000 - 64 - 88);
	});

	it("never scrolls above the bar's natural top", () => {
		// Stats sits right under the bar: its own target would unstick the bar.
		expect(jumpTarget({ ...page, sectionTop: 780 })).toBe(700 - 64);
	});

	it("scrolls up from far down the page when the floor is the natural top", () => {
		// Round 11: had the floor been the stuck position (scrollY + header),
		// every click from 5000 would have stayed at 5000.
		const target = jumpTarget({ ...page, sectionTop: 780 });
		expect(target).toBeLessThan(5000);
		expect(target).toBe(636);
	});
});

describe("sameLayout", () => {
	const segment = { left: 0, width: 50, seam: true, active: true };

	it("treats equal values as the same layout", () => {
		expect(
			sameLayout(
				{ stuck: true, segments: { a: segment } },
				{ stuck: true, segments: { a: { ...segment } } },
			),
		).toBe(true);
		expect(sameLayout(EMPTY_LAYOUT, { stuck: false, segments: {} })).toBe(true);
	});

	it("notices a changed stick, a changed segment and a changed key set", () => {
		const base = { stuck: true, segments: { a: segment } };
		expect(sameLayout(base, { ...base, stuck: false })).toBe(false);
		expect(
			sameLayout(base, {
				stuck: true,
				segments: { a: { ...segment, width: 51 } },
			}),
		).toBe(false);
		expect(
			sameLayout(base, { stuck: true, segments: { a: segment, b: segment } }),
		).toBe(false);
		expect(sameLayout(base, EMPTY_LAYOUT)).toBe(false);
	});
});
