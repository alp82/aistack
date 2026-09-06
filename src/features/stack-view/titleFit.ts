/**
 * The hero title fitter (#356, prototype v43). The stack name is never cut:
 * it prints on one line when the font that fits it stays at or above the
 * minimum, and otherwise wraps onto two lines at the largest font whose two
 * lines fit. Every number here is the prototype's.
 */

/** The largest title size, in px. */
export const TITLE_MAX_PX = 88;
/** The smallest title size, in px. Below this the title wraps instead. */
export const TITLE_MIN_PX = 44;
/** The viewport share that caps the size: the ceiling is 7vw between the two. */
export const TITLE_VIEWPORT_SHARE = 0.07;
/** The title's line height as a factor of its font size. */
export const TITLE_LINE_HEIGHT = 0.88;
/** The slack a two-line measurement may carry before the fitter shrinks. */
const TWO_LINE_SLACK = 1.05;

/**
 * The size the page paints before any measurement: the same ceiling as CSS,
 * so the server render and the first paint sit where the fitter will land for
 * a short name. 2.75rem and 5.5rem are the min and max at 16px.
 */
export const TITLE_FALLBACK_FONT_SIZE = "clamp(2.75rem, 7vw, 5.5rem)";

/** The 7vw ceiling for a viewport width, clamped to the min and max. */
export function titleCeilingPx(viewportWidth: number): number {
	return Math.min(
		TITLE_MAX_PX,
		Math.max(TITLE_MIN_PX, viewportWidth * TITLE_VIEWPORT_SHARE),
	);
}

/** The tallest two lines may measure at a size before it counts as three. */
export function twoLineHeightPx(fontSize: number): number {
	return 2 * fontSize * TITLE_LINE_HEIGHT * TWO_LINE_SLACK;
}

export type TitleFit =
	| { mode: "one-line"; fontSize: number }
	| { mode: "wrap"; fontSize: number };

export type TitleFitInput = {
	/** The ceiling for this viewport, from `titleCeilingPx`. */
	maxPx: number;
	/** The floor. A one-line size below it wraps instead. */
	minPx: number;
	/** The title's unwrapped width when set at `maxPx`. */
	naturalWidthAtMax: number;
	/** The width the title may take. */
	availableWidth: number;
	/**
	 * The wrapped height of the title at a size. The hook measures the DOM;
	 * tests hand in a function.
	 */
	wrappedHeightAt: (fontSize: number) => number;
};

/**
 * One line when the shrunk one-line size stays at or above `minPx`. Otherwise
 * wrap mode, shrinking from `maxPx` in 2px steps until two lines fit or the
 * floor is reached. A title never truncates: at the floor it wraps to as many
 * lines as it needs.
 */
export function fitTitle({
	maxPx,
	minPx,
	naturalWidthAtMax,
	availableWidth,
	wrappedHeightAt,
}: TitleFitInput): TitleFit {
	const oneLine =
		naturalWidthAtMax > 0
			? Math.min(maxPx, (maxPx * availableWidth) / naturalWidthAtMax)
			: maxPx;
	if (oneLine >= minPx) return { mode: "one-line", fontSize: oneLine };
	let fontSize = maxPx;
	while (
		fontSize > minPx &&
		wrappedHeightAt(fontSize) > twoLineHeightPx(fontSize)
	) {
		fontSize = Math.max(minPx, fontSize - 2);
	}
	return { mode: "wrap", fontSize };
}
