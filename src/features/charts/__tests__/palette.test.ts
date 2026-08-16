/**
 * The palette gate.
 *
 * The scaffolded `--chart-*` tokens this palette replaced had two lime slots
 * that differed only in lightness, and nobody noticed for months because
 * nothing checked. So the checks live here and run on every push.
 *
 * The canonical implementation is the `dataviz` skill's
 * `scripts/validate_palette.js`. The math below is the same math - OKLab
 * distance times 100, color vision simulated with Machado-Oliveira-Fernandes
 * 2009 at severity 1.0 - carried into the repo so a palette edit cannot ship
 * without passing. Recorded run, 2026-08-04:
 *
 *   dark  surface #13161a  worst adjacent CVD dE 15.5, normal 18.4, all >= 3:1
 *   light surface #ffffff  worst adjacent CVD dE 14.2, normal 16.7, all >= 3:1
 */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { CHART_PAINTS, CHART_SLOTS } from "../palette";

const CVD_TARGET = 8;
const NORMAL_FLOOR = 15;
const CONTRAST_MIN = 3;
const BAND = { dark: [0.48, 0.67], light: [0.43, 0.77] } as const;
const CHROMA_FLOOR = 0.1;

/** Both surfaces a chart can sit on, in each mode. */
const SURFACES = {
	dark: ["#13161a", "#0b0d11"],
	light: ["#ffffff", "#f4f5f7"],
} as const;

const MACHADO = {
	protan: [
		[0.152286, 1.052583, -0.204868],
		[0.114503, 0.786281, 0.099216],
		[-0.003882, -0.048116, 1.051998],
	],
	deutan: [
		[0.367322, 0.860646, -0.227968],
		[0.280085, 0.672501, 0.047413],
		[-0.01182, 0.04203, 0.969791],
	],
} as const;

const srgbToLinear = (c: number) =>
	c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

function linear(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	return [0, 2, 4].map((i) =>
		srgbToLinear(Number.parseInt(h.slice(i, i + 2), 16) / 255),
	) as [number, number, number];
}

function oklab([r, g, b]: [number, number, number]): [number, number, number] {
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
}

function simulate(
	hex: string,
	kind: keyof typeof MACHADO,
): [number, number, number] {
	const [r, g, b] = linear(hex);
	const m = MACHADO[kind];
	const clamp = (c: number) => Math.max(0, Math.min(1, c));
	return [
		clamp(m[0][0] * r + m[0][1] * g + m[0][2] * b),
		clamp(m[1][0] * r + m[1][1] * g + m[1][2] * b),
		clamp(m[2][0] * r + m[2][1] * g + m[2][2] * b),
	];
}

function deltaE(a: string, b: string, kind?: keyof typeof MACHADO): number {
	const x = oklab(kind ? simulate(a, kind) : linear(a));
	const y = oklab(kind ? simulate(b, kind) : linear(b));
	return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

function luminance(hex: string): number {
	const [r, g, b] = linear(hex);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

const lightness = (hex: string) => oklab(linear(hex))[0];
const chroma = (hex: string) => {
	const [, a, b] = oklab(linear(hex));
	return Math.hypot(a, b);
};

const MODES = ["dark", "light"] as const;
const stepsOf = (mode: (typeof MODES)[number]) =>
	CHART_SLOTS.map((slot) => slot[mode]);

describe.each(MODES)("the %s palette", (mode) => {
	const steps = stepsOf(mode);

	test("every slot sits inside the lightness band", () => {
		for (const hex of steps) {
			expect(lightness(hex)).toBeGreaterThanOrEqual(BAND[mode][0]);
			expect(lightness(hex)).toBeLessThanOrEqual(BAND[mode][1]);
		}
	});

	test("every slot clears the chroma floor, so no slot reads as gray", () => {
		for (const hex of steps)
			expect(chroma(hex)).toBeGreaterThanOrEqual(CHROMA_FLOOR);
	});

	test("neighboring slots stay apart under protanopia and deuteranopia", () => {
		for (let i = 1; i < steps.length; i++) {
			const worst = Math.min(
				deltaE(steps[i - 1], steps[i], "protan"),
				deltaE(steps[i - 1], steps[i], "deutan"),
			);
			expect(worst).toBeGreaterThanOrEqual(CVD_TARGET);
		}
	});

	test("neighboring slots stay apart under full color vision too", () => {
		for (let i = 1; i < steps.length; i++) {
			expect(deltaE(steps[i - 1], steps[i])).toBeGreaterThanOrEqual(
				NORMAL_FLOOR,
			);
		}
	});

	test("every slot clears 3:1 on both surfaces it can sit on", () => {
		for (const surface of SURFACES[mode]) {
			for (const hex of steps) {
				expect(contrast(hex, surface)).toBeGreaterThanOrEqual(CONTRAST_MIN);
			}
		}
	});
});

describe("the palette and the stylesheet agree", () => {
	const css = readFileSync("src/styles.css", "utf8");

	/** The last `--chart-N` declaration before the `.light` block wins for dark. */
	function tokensIn(block: string): string[] {
		return [1, 2, 3, 4, 5, 6].map((n) => {
			const hit = block.match(
				new RegExp(`--chart-${n}:\\s*(#[0-9a-f]{6})`, "i"),
			);
			if (!hit) throw new Error(`--chart-${n} is missing from the block`);
			return hit[1].toLowerCase();
		});
	}

	const lightStart = css.indexOf(".light {");

	test("the dark steps in :root match palette.ts", () => {
		expect(tokensIn(css.slice(0, lightStart))).toEqual(stepsOf("dark"));
	});

	test("the light steps in .light match palette.ts", () => {
		expect(tokensIn(css.slice(lightStart))).toEqual(stepsOf("light"));
	});

	test("the library reads our tokens, in one place", () => {
		for (let n = 1; n <= 6; n++) {
			expect(css).toContain(`--ts-chart-${n}: var(--chart-${n});`);
		}
	});
});

describe("the rules the numbers do not show", () => {
	test("no slot borrows the destructive hue", () => {
		expect(CHART_SLOTS.map((s) => s.hue)).not.toContain("red");
	});

	test("the paint handed to the library is a token with its dark step as fallback", () => {
		CHART_SLOTS.forEach((slot, i) => {
			expect(CHART_PAINTS[i]).toBe(`var(--chart-${i + 1}, ${slot.dark})`);
		});
	});
});
