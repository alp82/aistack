/**
 * Unit tests for src/features/stack-view/accentPresets.ts
 *
 * Covers:
 *   - ACCENT_PRESETS registry shape (12 entries, rainbow order, exact fields)
 *   - lightL override present only on warm presets (orange, yellow)
 *   - ACCENT_PRESET_KEYS membership (dropped keys are gone)
 *   - DEFAULT_ACCENT_KEY
 *   - accentClassFor: key -> CSS class string
 *   - ogAccentFor: key -> {base, contrast} pair
 *   - styles.css drift: authored .accent-<key> rules present/absent + value match
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	ACCENT_PRESET_KEYS,
	ACCENT_PRESETS,
	accentClassFor,
	DEFAULT_ACCENT_KEY,
	ogAccentFor,
} from "@/features/stack-view/accentPresets";

const OG_CONTRAST = "#0a0a0a";

// Authoritative expectation table — registry order is the rainbow loop from the
// brand default (lime). `lightL` is only set on warm presets.
const EXPECTED = [
	{
		key: "lime",
		name: "Lime",
		hue: 132,
		chroma: 0.17,
		swatchHex: "#84cc16",
		og: "#a3e635",
	},
	{
		key: "green",
		name: "Green",
		hue: 150,
		chroma: 0.21,
		swatchHex: "#22c55e",
		og: "#4ade80",
	},
	{
		key: "teal",
		name: "Teal",
		hue: 185,
		chroma: 0.12,
		swatchHex: "#14b8a6",
		og: "#2dd4bf",
	},
	{
		key: "cyan",
		name: "Cyan",
		hue: 215,
		chroma: 0.13,
		swatchHex: "#06b6d4",
		og: "#22d3ee",
	},
	{
		key: "blue",
		name: "Blue",
		hue: 260,
		chroma: 0.15,
		swatchHex: "#3b82f6",
		og: "#60a5fa",
	},
	{
		key: "indigo",
		name: "Indigo",
		hue: 275,
		chroma: 0.16,
		swatchHex: "#6366f1",
		og: "#818cf8",
	},
	{
		key: "violet",
		name: "Violet",
		hue: 295,
		chroma: 0.2,
		swatchHex: "#8b5cf6",
		og: "#a78bfa",
	},
	{
		key: "fuchsia",
		name: "Fuchsia",
		hue: 330,
		chroma: 0.24,
		swatchHex: "#d946ef",
		og: "#e879f9",
	},
	{
		key: "pink",
		name: "Pink",
		hue: 354,
		chroma: 0.21,
		swatchHex: "#ec4899",
		og: "#f472b6",
	},
	{
		key: "red",
		name: "Red",
		hue: 25,
		chroma: 0.21,
		swatchHex: "#ef4444",
		og: "#f87171",
	},
	{
		key: "orange",
		name: "Orange",
		hue: 48,
		chroma: 0.19,
		swatchHex: "#f97316",
		og: "#fb923c",
	},
	{
		key: "yellow",
		name: "Yellow",
		hue: 98,
		chroma: 0.17,
		swatchHex: "#eab308",
		og: "#facc15",
	},
] as const;

const DROPPED_KEYS = ["amber", "emerald", "sky", "rose"];

// Light-mode base lightness override per warm preset; everything else uses 0.55.
const WARM_LIGHT_L: Record<string, number | undefined> = {
	orange: 0.6,
	yellow: 0.66,
};

// ---------------------------------------------------------------------------
// Registry shape
// ---------------------------------------------------------------------------

describe("ACCENT_PRESETS", () => {
	it("contains exactly 12 presets", () => {
		expect(ACCENT_PRESETS).toHaveLength(12);
	});

	it("keys are in rainbow order starting at lime", () => {
		const keys = ACCENT_PRESETS.map((p) => p.key);
		expect(keys).toEqual(EXPECTED.map((e) => e.key));
	});

	it("first entry is the unchanged brand lime", () => {
		expect(ACCENT_PRESETS[0]).toMatchObject({
			key: "lime",
			name: "Lime",
			hue: 132,
			chroma: 0.17,
			swatchHex: "#84cc16",
			og: { base: "#a3e635", contrast: OG_CONTRAST },
		});
	});

	it("every entry has non-empty key and name", () => {
		for (const p of ACCENT_PRESETS) {
			expect(p.key).toBeTruthy();
			expect(p.name).toBeTruthy();
		}
	});

	it("every entry has a finite hue and positive finite chroma", () => {
		for (const p of ACCENT_PRESETS) {
			expect(Number.isFinite(p.hue)).toBe(true);
			expect(Number.isFinite(p.chroma)).toBe(true);
			expect(p.chroma).toBeGreaterThan(0);
		}
	});

	it("every entry swatchHex and og hexes match /^#[0-9a-fA-F]{6}$/", () => {
		for (const p of ACCENT_PRESETS) {
			expect(p.swatchHex).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(p.og.base).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(p.og.contrast).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});

	it("exact field values for every preset", () => {
		const byKey = Object.fromEntries(ACCENT_PRESETS.map((p) => [p.key, p]));
		for (const e of EXPECTED) {
			expect(byKey[e.key]).toMatchObject({
				key: e.key,
				name: e.name,
				hue: e.hue,
				chroma: e.chroma,
				swatchHex: e.swatchHex,
				og: { base: e.og, contrast: OG_CONTRAST },
			});
		}
	});

	it("lightL is set only on warm presets (orange, yellow)", () => {
		for (const p of ACCENT_PRESETS) {
			expect(p.lightL).toBe(WARM_LIGHT_L[p.key]);
		}
	});
});

// ---------------------------------------------------------------------------
// ACCENT_PRESET_KEYS and DEFAULT_ACCENT_KEY
// ---------------------------------------------------------------------------

describe("ACCENT_PRESET_KEYS", () => {
	it("contains 'lime', 'green', and 'yellow'", () => {
		expect(ACCENT_PRESET_KEYS.includes("lime")).toBe(true);
		expect(ACCENT_PRESET_KEYS.includes("green")).toBe(true);
		expect(ACCENT_PRESET_KEYS.includes("yellow")).toBe(true);
	});

	it("does NOT contain dropped keys", () => {
		for (const key of DROPPED_KEYS) {
			expect(ACCENT_PRESET_KEYS.includes(key)).toBe(false);
		}
	});

	it("does NOT contain 'bogus' or ''", () => {
		expect(ACCENT_PRESET_KEYS.includes("bogus")).toBe(false);
		expect(ACCENT_PRESET_KEYS.includes("")).toBe(false);
	});
});

describe("DEFAULT_ACCENT_KEY", () => {
	it("is 'lime'", () => {
		expect(DEFAULT_ACCENT_KEY).toBe("lime");
	});
});

// ---------------------------------------------------------------------------
// accentClassFor
// ---------------------------------------------------------------------------

describe("accentClassFor", () => {
	it("'green' -> 'accent-green'", () => {
		expect(accentClassFor("green")).toBe("accent-green");
	});

	it("'yellow' -> 'accent-yellow'", () => {
		expect(accentClassFor("yellow")).toBe("accent-yellow");
	});

	it("'lime' -> '' (default, no class needed)", () => {
		expect(accentClassFor("lime")).toBe("");
	});

	it("undefined and '' -> ''", () => {
		expect(accentClassFor(undefined)).toBe("");
		expect(accentClassFor("")).toBe("");
	});

	it("'bogus' -> ''", () => {
		expect(accentClassFor("bogus")).toBe("");
	});

	it("dropped keys -> '' (now unknown, fall back to default)", () => {
		for (const key of DROPPED_KEYS) {
			expect(accentClassFor(key)).toBe("");
		}
	});

	it("'Lime' (wrong case) -> '' (unknown key)", () => {
		expect(accentClassFor("Lime")).toBe("");
	});
});

// ---------------------------------------------------------------------------
// ogAccentFor
// ---------------------------------------------------------------------------

const LIME_OG = { base: "#a3e635", contrast: OG_CONTRAST };

describe("ogAccentFor", () => {
	it("'lime', undefined, '', 'bogus', and dropped keys -> lime og pair", () => {
		expect(ogAccentFor("lime")).toEqual(LIME_OG);
		expect(ogAccentFor(undefined)).toEqual(LIME_OG);
		expect(ogAccentFor("")).toEqual(LIME_OG);
		expect(ogAccentFor("bogus")).toEqual(LIME_OG);
		for (const key of DROPPED_KEYS) {
			expect(ogAccentFor(key)).toEqual(LIME_OG);
		}
	});

	it("returns the matching og pair for every preset key", () => {
		for (const e of EXPECTED) {
			expect(ogAccentFor(e.key)).toEqual({ base: e.og, contrast: OG_CONTRAST });
		}
	});
});

// ---------------------------------------------------------------------------
// styles.css drift guard
// ---------------------------------------------------------------------------

describe("styles.css accent rules drift guard", () => {
	const css = readFileSync(resolve(__dirname, "../../../styles.css"), "utf-8");
	const NON_LIME = EXPECTED.filter((e) => e.key !== "lime");

	for (const e of NON_LIME) {
		it(`contains a .accent-${e.key} { rule and a .light .accent-${e.key} rule`, () => {
			expect(css).toMatch(new RegExp(`\\.accent-${e.key}\\s*\\{`));
			expect(css).toMatch(new RegExp(`\\.light\\s+\\.accent-${e.key}\\s*\\{`));
		});

		it(`dark .accent-${e.key} uses oklch(0.78 ${e.chroma} ${e.hue})`, () => {
			const darkBlock = css.match(
				new RegExp(`\\.accent-${e.key}\\s*\\{[^}]*\\}`, "s"),
			)?.[0];
			expect(darkBlock).toBeDefined();
			expect(darkBlock).toContain(`oklch(0.78 ${e.chroma} ${e.hue})`);
		});

		it(`.light .accent-${e.key} base uses lightness ${WARM_LIGHT_L[e.key] ?? 0.55}`, () => {
			const lightL = WARM_LIGHT_L[e.key] ?? 0.55;
			const lightBlock = css.match(
				new RegExp(`\\.light\\s+\\.accent-${e.key}\\s*\\{[^}]*\\}`, "s"),
			)?.[0];
			expect(lightBlock).toBeDefined();
			expect(lightBlock).toContain(`oklch(${lightL} ${e.chroma} ${e.hue})`);
		});
	}

	it("does NOT contain a .accent-lime { rule (lime is the default)", () => {
		expect(css).not.toMatch(/\.accent-lime\s*\{/);
	});

	it("does NOT contain rules for dropped keys", () => {
		for (const key of DROPPED_KEYS) {
			expect(css).not.toMatch(new RegExp(`\\.accent-${key}\\s*\\{`));
		}
	});
});
