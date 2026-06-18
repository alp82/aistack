// Single source of truth for per-stack accent presets.
//
// Presets are ordered as a rainbow loop starting at the brand default (lime),
// walking the hue wheel and wrapping through red/orange/yellow back to lime.
//
// OG images use each preset's bright dark anchor (the Tailwind-400 family),
// matching lime's existing OG color; the web view uses the mode-aware oklch
// ladder in styles.css. The hue/chroma values here are authoritative — the
// `.accent-<key>` blocks in styles.css are hand-authored to match them, and a
// drift test guards rule PRESENCE. The values test (accent.test.ts) guards the
// actual hue/chroma/lightL numbers.
//
// Imported by the Convex bundle (convex/lib/iconUrl.ts) — keep this module
// free of React/DOM/client-only imports.

type AccentPreset = {
	key: string;
	name: string;
	hue: number;
	chroma: number;
	// Light-mode base lightness override. Warm hues (orange, yellow) collapse to
	// muddy brown/olive at the default 0.55, so they carry a higher value here;
	// every other preset uses 0.55. Dark mode stays a uniform 0.78 throughout.
	lightL?: number;
	swatchHex: string;
	og: { base: string; contrast: string };
};

const OG_CONTRAST = "#0a0a0a";

const ACCENT_PRESETS: readonly AccentPreset[] = [
	{
		key: "lime",
		name: "Lime",
		hue: 132,
		chroma: 0.17,
		swatchHex: "#84cc16",
		og: { base: "#a3e635", contrast: OG_CONTRAST },
	},
	{
		key: "green",
		name: "Green",
		hue: 150,
		chroma: 0.21,
		swatchHex: "#22c55e",
		og: { base: "#4ade80", contrast: OG_CONTRAST },
	},
	{
		key: "teal",
		name: "Teal",
		hue: 185,
		chroma: 0.12,
		swatchHex: "#14b8a6",
		og: { base: "#2dd4bf", contrast: OG_CONTRAST },
	},
	{
		key: "cyan",
		name: "Cyan",
		hue: 215,
		chroma: 0.13,
		swatchHex: "#06b6d4",
		og: { base: "#22d3ee", contrast: OG_CONTRAST },
	},
	{
		key: "blue",
		name: "Blue",
		hue: 260,
		chroma: 0.15,
		swatchHex: "#3b82f6",
		og: { base: "#60a5fa", contrast: OG_CONTRAST },
	},
	{
		key: "indigo",
		name: "Indigo",
		hue: 275,
		chroma: 0.16,
		swatchHex: "#6366f1",
		og: { base: "#818cf8", contrast: OG_CONTRAST },
	},
	{
		key: "violet",
		name: "Violet",
		hue: 295,
		chroma: 0.2,
		swatchHex: "#8b5cf6",
		og: { base: "#a78bfa", contrast: OG_CONTRAST },
	},
	{
		key: "fuchsia",
		name: "Fuchsia",
		hue: 330,
		chroma: 0.24,
		swatchHex: "#d946ef",
		og: { base: "#e879f9", contrast: OG_CONTRAST },
	},
	{
		key: "pink",
		name: "Pink",
		hue: 354,
		chroma: 0.21,
		swatchHex: "#ec4899",
		og: { base: "#f472b6", contrast: OG_CONTRAST },
	},
	{
		key: "red",
		name: "Red",
		hue: 25,
		chroma: 0.21,
		swatchHex: "#ef4444",
		og: { base: "#f87171", contrast: OG_CONTRAST },
	},
	{
		key: "orange",
		name: "Orange",
		hue: 48,
		chroma: 0.19,
		lightL: 0.6,
		swatchHex: "#f97316",
		og: { base: "#fb923c", contrast: OG_CONTRAST },
	},
	{
		key: "yellow",
		name: "Yellow",
		hue: 98,
		chroma: 0.17,
		lightL: 0.66,
		swatchHex: "#eab308",
		og: { base: "#facc15", contrast: OG_CONTRAST },
	},
];

const ACCENT_PRESET_KEYS: readonly string[] = ACCENT_PRESETS.map((p) => p.key);

const DEFAULT_ACCENT_KEY = "lime";

/**
 * Map an accent key to the CSS class that re-themes the accent ladder. Returns
 * "" for the default (lime), unset, or any unknown key — the default tokens
 * already serve lime, so no ruleless `.accent-lime` class is emitted.
 */
function accentClassFor(key?: string): string {
	if (!key || key === DEFAULT_ACCENT_KEY) return "";
	if (!ACCENT_PRESET_KEYS.includes(key)) return "";
	return `accent-${key}`;
}

/**
 * Map an accent key to its OG color pair. Unset/unknown/empty fall back to the
 * lime pair.
 */
function ogAccentFor(key?: string): { base: string; contrast: string } {
	const preset = ACCENT_PRESETS.find((p) => p.key === key);
	return preset ? preset.og : ACCENT_PRESETS[0].og;
}

export {
	ACCENT_PRESETS,
	ACCENT_PRESET_KEYS,
	DEFAULT_ACCENT_KEY,
	accentClassFor,
	ogAccentFor,
};
