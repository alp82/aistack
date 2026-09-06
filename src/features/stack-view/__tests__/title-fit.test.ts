import { describe, expect, it } from "vitest";
import {
	fitTitle,
	TITLE_LINE_HEIGHT,
	TITLE_MAX_PX,
	TITLE_MIN_PX,
	titleCeilingPx,
	twoLineHeightPx,
} from "@/features/stack-view/titleFit";

/**
 * A synthetic layout: a title of `chars` characters at width 0.6em per
 * character wraps into as many lines as the available width forces, at the
 * prototype's line height. It stands in for the DOM the hook measures.
 */
function layout(chars: number, availableWidth: number) {
	const widthAt = (px: number) => chars * px * 0.6;
	return {
		naturalWidthAtMax: widthAt(TITLE_MAX_PX),
		availableWidth,
		wrappedHeightAt: (px: number) =>
			Math.ceil(widthAt(px) / availableWidth) * px * TITLE_LINE_HEIGHT,
	};
}

describe("the 7vw ceiling", () => {
	it("holds 88px on a wide screen and 44px on a narrow one", () => {
		expect(titleCeilingPx(1440)).toBe(TITLE_MAX_PX);
		expect(titleCeilingPx(1258)).toBe(TITLE_MAX_PX);
		expect(titleCeilingPx(390)).toBe(TITLE_MIN_PX);
	});

	it("tracks 7vw between them", () => {
		expect(titleCeilingPx(1000)).toBeCloseTo(70);
		expect(titleCeilingPx(820)).toBeCloseTo(57.4);
	});
});

describe("fitTitle", () => {
	it("keeps a short name on one line at the ceiling", () => {
		const fit = fitTitle({
			maxPx: 88,
			minPx: 44,
			...layout(10, 900),
		});
		expect(fit).toEqual({ mode: "one-line", fontSize: 88 });
	});

	it("shrinks a longer name on one line down to the exact fit", () => {
		// 20 chars at 88px is 1056px wide; 800px available fits at 66.67px.
		const fit = fitTitle({ maxPx: 88, minPx: 44, ...layout(20, 800) });
		expect(fit.mode).toBe("one-line");
		expect(fit.fontSize).toBeCloseTo(66.67, 1);
	});

	it("keeps one line right at the floor", () => {
		// 30 chars at 88px is 1584px wide; 792px available fits at exactly 44px.
		const fit = fitTitle({ maxPx: 88, minPx: 44, ...layout(30, 792) });
		expect(fit).toEqual({ mode: "one-line", fontSize: 44 });
	});

	it("wraps instead of dropping below the floor, at the largest two-line size", () => {
		// 40 chars at 88px is 2112px wide; 800px available would need 33px on
		// one line. Two lines of 20 chars each fit at 66px (20 * 66 * 0.6 = 792).
		const fit = fitTitle({ maxPx: 88, minPx: 44, ...layout(40, 800) });
		expect(fit.mode).toBe("wrap");
		expect(fit.fontSize).toBe(66);
		expect(fit.fontSize).toBeGreaterThanOrEqual(44);
	});

	it("shrinks in 2px steps from the ceiling", () => {
		const sizesAsked: number[] = [];
		const base = layout(40, 800);
		fitTitle({
			maxPx: 88,
			minPx: 44,
			...base,
			wrappedHeightAt: (px) => {
				sizesAsked.push(px);
				return base.wrappedHeightAt(px);
			},
		});
		expect(sizesAsked[0]).toBe(88);
		expect(sizesAsked.at(-1)).toBe(66);
		for (let i = 1; i < sizesAsked.length; i += 1) {
			expect(sizesAsked[i - 1] - sizesAsked[i]).toBe(2);
		}
	});

	it("stops at the floor and lets a very long name take more lines", () => {
		const fit = fitTitle({ maxPx: 88, minPx: 44, ...layout(120, 600) });
		expect(fit).toEqual({ mode: "wrap", fontSize: 44 });
	});

	it("respects a lower ceiling from a narrow viewport", () => {
		const fit = fitTitle({
			maxPx: titleCeilingPx(1000),
			minPx: 44,
			...layout(8, 900),
		});
		expect(fit).toEqual({ mode: "one-line", fontSize: 70 });
	});

	it("falls back to the ceiling when nothing measured yet", () => {
		const fit = fitTitle({
			maxPx: 88,
			minPx: 44,
			naturalWidthAtMax: 0,
			availableWidth: 0,
			wrappedHeightAt: () => 0,
		});
		expect(fit).toEqual({ mode: "one-line", fontSize: 88 });
	});

	it("allows two lines a small slack before shrinking", () => {
		expect(twoLineHeightPx(88)).toBeCloseTo(2 * 88 * 0.88 * 1.05);
	});
});
