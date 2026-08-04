/**
 * The categorical chart palette.
 *
 * Six slots, drawn from the site's own accent hues, stepped separately for the
 * dark and the light surface. Every value here comes out of the `dataviz`
 * validator (`scripts/validate_palette.js`), not out of an eye:
 *
 *   dark  (surface #13161a and #0b0d11)  worst adjacent CVD dE 15.5, normal 18.4
 *   light (surface #ffffff and #f4f5f7)  worst adjacent CVD dE 14.2, normal 16.7
 *
 * Both modes pass the lightness band, the chroma floor, the CVD floor, the
 * normal-vision floor and 3:1 contrast. The target for CVD is 8 and the floor
 * for normal vision is 15, so both modes clear them with room.
 *
 * Two rules the numbers do not show:
 *
 * 1. **Hue 25 (red) is left out on purpose.** It is the `--destructive` hue. A
 *    status color must never impersonate a series.
 * 2. **The slot order is the safety mechanism, not decoration.** Series take
 *    slots in order and a filter never repaints the survivors. Do not reorder
 *    without re-running the validator.
 *
 * The order is checked on *adjacent* pairs, which is the right list for stacks,
 * bars and lines. Under `--pairs all` (scatter, bubble, small multiples) only
 * the first three slots clear the floors, so those forms carry a cap of three
 * series. Past three, fold to "Other" or facet.
 *
 * Single-series charts do not use this palette at all. They use the stack's own
 * accent (`ACCENT_PAINT`), which is why lime leads the order: a chart that
 * grows a second series keeps its first color.
 */

type ChartSlot = {
	/** The accent preset this slot borrows its hue from. */
	readonly hue: string;
	/** Step for the dark surface. */
	readonly dark: string;
	/** Step for the light surface. */
	readonly light: string;
};

/** The six slots, in the order series are assigned to them. */
const CHART_SLOTS: readonly ChartSlot[] = [
	{ hue: "lime", dark: "#69a621", light: "#4e8300" },
	{ hue: "violet", dark: "#9e71fd", light: "#7e4ed7" },
	{ hue: "pink", dark: "#c21977", light: "#c51e7a" },
	{ hue: "blue", dark: "#4278d2", light: "#396fc8" },
	{ hue: "teal", dark: "#00a99b", light: "#009488" },
	{ hue: "orange", dark: "#e66700", light: "#cb5a00" },
];

/** How many series a categorical chart can carry before folding to "Other". */
const CHART_SLOT_COUNT = CHART_SLOTS.length;

/**
 * The paint handed to the library, one entry per slot.
 *
 * A CSS custom property, so light and dark stay a pure CSS concern: the server
 * cannot know the theme (it comes from `localStorage` in the head script), so
 * baking a hex into the server HTML would paint one of the two modes wrong.
 * The fallback inside `var()` is the dark step, which is the site default and
 * also what a chart rendered outside this module's CSS scope should look like.
 */
const CHART_PAINTS: readonly string[] = CHART_SLOTS.map(
	(slot, i) => `var(--chart-${i + 1}, ${slot.dark})`,
);

/**
 * The paint for a single-series chart: the stack's own accent.
 *
 * `--accent-lime` is re-pointed by the `.accent-<key>` class on an ancestor, so
 * one series follows the page it sits on. A multi-series chart must never use
 * it — categorical color follows the entity and has to stay fixed.
 */
const ACCENT_PAINT = "var(--accent-lime, #8dcd50)";

/** Grid, axis and label paint. `currentColor` inherits the surrounding text. */
const CHART_FOREGROUND = "currentColor";

export type { ChartSlot };
export {
	ACCENT_PAINT,
	CHART_FOREGROUND,
	CHART_PAINTS,
	CHART_SLOTS,
	CHART_SLOT_COUNT,
};
