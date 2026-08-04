/**
 * PROTOTYPE - one recognisable mark per fun fact. Wayfinder ticket #80.
 *
 * The first pass was hand-drawn and read as generic wire shapes, so these are
 * real assets instead: five icons from Material Design Icons (Pictogrammers),
 * Apache-2.0, taken through the Iconify API on 2026-08-04.
 *
 * ONE FAMILY ON PURPOSE. Mixing icon sets is what makes a row of marks look
 * assembled rather than designed, so every one of these is MDI: same 24x24 box,
 * same solid-fill weight, same corner language. They are inlined as single
 * paths filled with `currentColor`, so each one inherits its card's accent and
 * nothing is fetched at runtime.
 *
 * On Harry Potter: the wizard hat is a nod, not a likeness. The card NAMES the
 * books, which is ordinary nominative use, but a Potter-specific silhouette is
 * Warner Bros. trade dress and does not belong on a commercial page.
 */

function Mdi({ size, label, d }: { size: number; label: string; d: string }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			role="img"
			aria-label={label}
		>
			<title>{label}</title>
			<path fill="currentColor" d={d} />
		</svg>
	);
}

/** mdi:wizard-hat - the books card. */
export function WizardHatIcon({ size = 48 }: { size?: number }) {
	return (
		<Mdi
			size={size}
			label="a wizard hat"
			d="M21 22H3v-2h18zm-2-3H5l6.1-16.4q.3-.6.9-.6l6 3h-4.1zM10 7.5l1.04.47L11.5 9l.47-1.03L13 7.5l-1.03-.47L11.5 6l-.46 1.03zm3 7.5l-2.06-.93L10 12l-.93 2.07L7 15l2.07.93L10 18l.94-2.07zm.97-3.03L15 11.5l-1.03-.47L13.5 10l-.46 1.03l-1.04.47l1.04.47l.46 1.03zm2 4L17 15.5l-1.03-.47L15.5 14l-.46 1.03l-1.04.47l1.04.47l.46 1.03z"
		/>
	);
}

/** mdi:timer-sand - the time card. */
export function HourglassIcon({ size = 48 }: { size?: number }) {
	return (
		<Mdi
			size={size}
			label="an hourglass"
			d="M6 2h12v6l-4 4l4 4v6H6v-6l4-4l-4-4zm10 14.5l-4-4l-4 4V20h8zm-4-5l4-4V4H8v3.5zM10 6h4v.75l-2 2l-2-2z"
		/>
	);
}

/** mdi:wikipedia - the Wikipedia card. */
export function WikipediaIcon({ size = 48 }: { size?: number }) {
	return (
		<Mdi
			size={size}
			label="the Wikipedia mark"
			d="m14.97 18.95l-2.56-6.03c-1.02 1.99-2.14 4.08-3.1 6.03c-.01.01-.47 0-.47 0C7.37 15.5 5.85 12.1 4.37 8.68C4.03 7.84 2.83 6.5 2 6.5v-.45h5.06v.45c-.6 0-1.62.4-1.36 1.05c.72 1.54 3.24 7.51 3.93 9.03c.47-.94 1.8-3.42 2.37-4.47c-.45-.88-1.87-4.18-2.29-5c-.32-.54-1.13-.61-1.75-.61c0-.15.01-.25 0-.44l4.46.01v.4c-.61.03-1.18.24-.92.82c.6 1.24.95 2.13 1.5 3.28c.17-.34 1.07-2.19 1.5-3.16c.26-.65-.13-.91-1.21-.91c.01-.12.01-.33.01-.43c1.39-.01 3.48-.01 3.85-.02v.42c-.71.03-1.44.41-1.82.99L13.5 11.3c.18.51 1.96 4.46 2.15 4.9l3.85-8.83c-.3-.72-1.16-.87-1.5-.87v-.45l4 .03v.42c-.88 0-1.43.5-1.75 1.25c-.8 1.79-3.25 7.49-4.85 11.2z"
		/>
	);
}

/** mdi:eiffel-tower - the paper card. */
export function EiffelTowerIcon({ size = 48 }: { size?: number }) {
	return (
		<Mdi
			size={size}
			label="the Eiffel Tower"
			d="M8.21 17c.44-.85.85-1.84 1.23-3H9v-2h1c.61-2.6 1-5.87 1-10h2c0 4.13.4 7.4 1 10h1v2h-.44c.38 1.16.79 2.15 1.23 3H17v2l2 3h-2.42c-.77-1.76-2.53-3-4.58-3s-3.81 1.24-4.58 3H5l2-3l-.03-2zm4.38-3h-1.18a22 22 0 0 1-1.13 3h3.44c-.4-.87-.79-1.87-1.13-3"
		/>
	);
}

/** mdi:road-variant - the road card. */
export function RoadIcon({ size = 48 }: { size?: number }) {
	return (
		<Mdi
			size={size}
			label="a road"
			d="M18.1 4.8c-.1-.5-.5-.8-1-.8H13l.2 3h-2.4l.2-3H6.8c-.5 0-.9.4-1 .8l-2.7 14c-.1.6.4 1.2 1 1.2H10l.3-5h3.4l.3 5h5.8c.6 0 1.1-.6 1-1.2zM10.4 13l.2-4h2.6l.2 4z"
		/>
	);
}
