/**
 * The arithmetic behind the sticky section nav (#356, locked in #352 round 12).
 *
 * Everything here is pure so the scroll behaviour is testable without a
 * layout engine. `PageNav.tsx` measures the page and calls in; nothing here
 * reads the DOM.
 *
 * Positions are document coordinates: pixels from the top of the page, not
 * from the top of the viewport. The caller converts by adding `scrollY`.
 */

/** The share of a section on screen, as the lime segment under its tab. */
export type Segment = {
	/** Left edge in percent: the share of the section scrolled above the bar. */
	left: number;
	/** Width in percent: the share of the section between the bar and the fold. */
	width: number;
	/**
	 * The section's end is on screen, so the segment reaches the tab's right
	 * edge and should bleed one pixel into the next tab, where the next
	 * section's segment begins, to close the seam between them.
	 */
	seam: boolean;
	/** At least half of the section, or half of the viewport, shows it. */
	active: boolean;
};

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

/** One decimal place: enough for a 136px tab, and it stops sub-pixel churn. */
function tenths(value: number): number {
	return Math.round(value * 10) / 10;
}

/**
 * The segment for one section, or null when the section has no height (an
 * unmounted or collapsed section gets no segment rather than a zero-wide one).
 *
 * `viewportTop` is the bottom edge of the stuck bar and `viewportBottom` the
 * fold. A section wholly above the bar yields `left: 100, width: 0`; one
 * wholly below the fold yields `left: 0, width: 0`.
 */
export function visibleSegment({
	sectionTop,
	sectionHeight,
	viewportTop,
	viewportBottom,
}: {
	sectionTop: number;
	sectionHeight: number;
	viewportTop: number;
	viewportBottom: number;
}): Segment | null {
	if (sectionHeight <= 0) return null;
	const start = clamp01((viewportTop - sectionTop) / sectionHeight);
	const end = clamp01((viewportBottom - sectionTop) / sectionHeight);
	const share = Math.max(0, end - start);
	const viewportHeight = viewportBottom - viewportTop;
	const shownPx = share * sectionHeight;
	return {
		left: tenths(start * 100),
		width: tenths(share * 100),
		seam: end >= 1 && start < 1,
		active:
			share >= 0.5 || (viewportHeight > 0 && shownPx / viewportHeight >= 0.5),
	};
}

/**
 * Whether the bar is pinned under the site header.
 *
 * `naturalTop` is where the bar sits in the document flow, measured off a
 * non-sticky sentinel placed right before it. A stuck sticky element reports
 * its stuck position, so its own rect can never answer this question.
 */
export function isStuck({
	naturalTop,
	scrollY,
	headerHeight,
}: {
	naturalTop: number;
	scrollY: number;
	headerHeight: number;
}): boolean {
	return scrollY > 0 && scrollY + headerHeight >= naturalTop;
}

/**
 * Where a tab click scrolls to.
 *
 * The target lands `offset` pixels under the bar, and never above the bar's
 * own natural top, so the bar is stuck on landing and the identity row stays
 * out. `barTop` must come from the sentinel (#352 round 11: measured off the
 * stuck bar, the floor equals the current scroll and nothing can scroll up).
 */
export function jumpTarget({
	barTop,
	sectionTop,
	headerHeight,
	offset,
}: {
	barTop: number;
	sectionTop: number;
	headerHeight: number;
	offset: number;
}): number {
	return Math.max(barTop - headerHeight, sectionTop - headerHeight - offset);
}

/** The bar's whole scroll-derived state, compared by value to skip renders. */
export type NavLayout = {
	stuck: boolean;
	segments: Record<string, Segment>;
};

export const EMPTY_LAYOUT: NavLayout = { stuck: false, segments: {} };

export function sameLayout(a: NavLayout, b: NavLayout): boolean {
	if (a.stuck !== b.stuck) return false;
	const keys = Object.keys(a.segments);
	if (keys.length !== Object.keys(b.segments).length) return false;
	for (const key of keys) {
		const x = a.segments[key];
		const y = b.segments[key];
		if (!y || !x) return false;
		if (
			x.left !== y.left ||
			x.width !== y.width ||
			x.seam !== y.seam ||
			x.active !== y.active
		) {
			return false;
		}
	}
	return true;
}
