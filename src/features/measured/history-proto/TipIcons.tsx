/**
 * PROTOTYPE - one simple mark per fun fact. Wayfinder ticket #80.
 *
 * Inline SVG, stroked in `currentColor`, no fills and no rounded joins, so each
 * one matches the sharp-corner house rule and inherits the accent color of
 * whatever card it sits in. Nothing is fetched: an icon that needs a network
 * request is an icon that flashes empty on a cold load.
 *
 * These are suggestions, not chosen art. Each is a recognisable silhouette of
 * the thing its card compares against, drawn thin enough to sit quietly beside
 * a headline number.
 */

const STROKE = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.6,
	strokeLinecap: "square",
	strokeLinejoin: "miter",
} as const;

/** Round glasses and a lightning bolt. The books card. */
export function GlassesBoltIcon({ size = 52 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size * 0.6}
			viewBox="0 0 48 29"
			aria-hidden="true"
			{...STROKE}
		>
			<circle cx="10" cy="18" r="6" />
			<circle cx="26" cy="18" r="6" />
			<path d="M16 18 L20 18" />
			<path d="M4 15 L0 11" />
			<path d="M32 15 L36 11" />
			<path d="M43 2 L38 14 L43 14 L37 27" />
		</svg>
	);
}

/** A clock at twenty past ten. The time card. */
export function ClockIcon({ size = 52 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			aria-hidden="true"
			{...STROKE}
		>
			<circle cx="16" cy="16" r="13" />
			<path d="M16 3 L16 6" />
			<path d="M16 26 L16 29" />
			<path d="M3 16 L6 16" />
			<path d="M26 16 L29 16" />
			<path d="M16 16 L16 8" />
			<path d="M16 16 L22 19" />
		</svg>
	);
}

/** A wire globe with a W. The Wikipedia card. */
export function GlobeWIcon({ size = 52 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			aria-hidden="true"
			{...STROKE}
		>
			<circle cx="16" cy="16" r="13" />
			<ellipse cx="16" cy="16" rx="6" ry="13" />
			<path d="M3 16 L29 16" />
			<path d="M5.5 8.5 L26.5 8.5" />
			<path d="M5.5 23.5 L26.5 23.5" />
			<path d="M10 12 L12.5 20 L16 14 L19.5 20 L22 12" />
		</svg>
	);
}

/** The Eiffel Tower, four strokes and two platforms. The paper card. */
export function EiffelIcon({ size = 52 }: { size?: number }) {
	return (
		<svg
			width={size * 0.72}
			height={size}
			viewBox="0 0 26 38"
			aria-hidden="true"
			{...STROKE}
		>
			<path d="M13 2 L13 8" />
			<path d="M10 8 L16 8" />
			<path d="M11 8 L4 36" />
			<path d="M15 8 L22 36" />
			<path d="M9.5 22 L16.5 22" />
			<path d="M7 30 L19 30" />
			<path d="M8 30 C 10 25, 16 25, 18 30" />
		</svg>
	);
}

/** A road running to the horizon. The road card. */
export function RoadIcon({ size = 52 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size * 0.8}
			viewBox="0 0 40 32"
			aria-hidden="true"
			{...STROKE}
		>
			<path d="M2 31 L15 5" />
			<path d="M38 31 L25 5" />
			<path d="M13 5 L27 5" />
			<path d="M20 30 L20 26" />
			<path d="M20 22 L20 19" />
			<path d="M20 15.5 L20 13.5" />
			<path d="M20 10.5 L20 9.5" />
		</svg>
	);
}
