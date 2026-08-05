/**
 * One recognizable mark per fun fact. Locked by #80, built by #81.
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

export type IconProps = { size?: number; className?: string };

function Mdi({
	size,
	className,
	label,
	d,
}: {
	size?: number;
	className?: string;
	label: string;
	d: string;
}) {
	return (
		<svg
			// A className wins: `w-full h-auto` cannot work against fixed attributes.
			width={className ? undefined : size}
			height={className ? undefined : size}
			className={className}
			viewBox="0 0 24 24"
			// Decorative: every card already names its comparison in the title and
			// the prose, so an accessible name here only repeats it.
			aria-hidden="true"
			data-mark={label}
		>
			<path fill="currentColor" d={d} />
		</svg>
	);
}

/** mdi:wizard-hat - the books card. */
export function WizardHatIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a wizard hat"
			d="M21 22H3v-2h18zm-2-3H5l6.1-16.4q.3-.6.9-.6l6 3h-4.1zM10 7.5l1.04.47L11.5 9l.47-1.03L13 7.5l-1.03-.47L11.5 6l-.46 1.03zm3 7.5l-2.06-.93L10 12l-.93 2.07L7 15l2.07.93L10 18l.94-2.07zm.97-3.03L15 11.5l-1.03-.47L13.5 10l-.46 1.03l-1.04.47l1.04.47l.46 1.03zm2 4L17 15.5l-1.03-.47L15.5 14l-.46 1.03l-1.04.47l1.04.47l.46 1.03z"
		/>
	);
}

/** mdi:timer-sand - the time card. */
export function HourglassIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="an hourglass"
			d="M6 2h12v6l-4 4l4 4v6H6v-6l4-4l-4-4zm10 14.5l-4-4l-4 4V20h8zm-4-5l4-4V4H8v3.5zM10 6h4v.75l-2 2l-2-2z"
		/>
	);
}

/** mdi:wikipedia - the Wikipedia card. */
export function WikipediaIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="the Wikipedia mark"
			d="m14.97 18.95l-2.56-6.03c-1.02 1.99-2.14 4.08-3.1 6.03c-.01.01-.47 0-.47 0C7.37 15.5 5.85 12.1 4.37 8.68C4.03 7.84 2.83 6.5 2 6.5v-.45h5.06v.45c-.6 0-1.62.4-1.36 1.05c.72 1.54 3.24 7.51 3.93 9.03c.47-.94 1.8-3.42 2.37-4.47c-.45-.88-1.87-4.18-2.29-5c-.32-.54-1.13-.61-1.75-.61c0-.15.01-.25 0-.44l4.46.01v.4c-.61.03-1.18.24-.92.82c.6 1.24.95 2.13 1.5 3.28c.17-.34 1.07-2.19 1.5-3.16c.26-.65-.13-.91-1.21-.91c.01-.12.01-.33.01-.43c1.39-.01 3.48-.01 3.85-.02v.42c-.71.03-1.44.41-1.82.99L13.5 11.3c.18.51 1.96 4.46 2.15 4.9l3.85-8.83c-.3-.72-1.16-.87-1.5-.87v-.45l4 .03v.42c-.88 0-1.43.5-1.75 1.25c-.8 1.79-3.25 7.49-4.85 11.2z"
		/>
	);
}

/** mdi:eiffel-tower - the paper card. */
export function EiffelTowerIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="the Eiffel Tower"
			d="M8.21 17c.44-.85.85-1.84 1.23-3H9v-2h1c.61-2.6 1-5.87 1-10h2c0 4.13.4 7.4 1 10h1v2h-.44c.38 1.16.79 2.15 1.23 3H17v2l2 3h-2.42c-.77-1.76-2.53-3-4.58-3s-3.81 1.24-4.58 3H5l2-3l-.03-2zm4.38-3h-1.18a22 22 0 0 1-1.13 3h3.44c-.4-.87-.79-1.87-1.13-3"
		/>
	);
}

/** mdi:road-variant - the road card. */
export function RoadIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a road"
			d="M18.1 4.8c-.1-.5-.5-.8-1-.8H13l.2 3h-2.4l.2-3H6.8c-.5 0-.9.4-1 .8l-2.7 14c-.1.6.4 1.2 1 1.2H10l.3-5h3.4l.3 5h5.8c.6 0 1.1-.6 1-1.2zM10.4 13l.2-4h2.6l.2 4z"
		/>
	);
}

/** mdi:keyboard */
export function KeyboardIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a keyboard"
			d="M19 10h-2V8h2m0 5h-2v-2h2m-3-1h-2V8h2m0 5h-2v-2h2m0 6H8v-2h8m-9-5H5V8h2m0 5H5v-2h2m1 0h2v2H8m0-5h2v2H8m3 1h2v2h-2m0-5h2v2h-2m9-5H4c-1.11 0-2 .89-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2"
		/>
	);
}

/** mdi:floppy */
export function FloppyIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a floppy disk"
			d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5.5L18.5 3H17v6a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3zm7 1v5h3V4zm-5 8h10a1 1 0 0 1 1 1v6H6v-6a1 1 0 0 1 1-1"
		/>
	);
}

/** mdi:drama-masks */
export function DramaMasksIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="theatre masks"
			d="M8.11 19.45a6.95 6.95 0 0 1-4.4-5.1L2.05 6.54c-.24-1.08.45-2.14 1.53-2.37l9.77-2.07l.03-.01c1.07-.21 2.12.48 2.34 1.54l.35 1.67l4.35.93h.03c1.05.24 1.73 1.3 1.51 2.36l-1.66 7.82a6.993 6.993 0 0 1-8.3 5.38a6.9 6.9 0 0 1-3.89-2.34M20 8.18L10.23 6.1l-1.66 7.82v.03c-.57 2.68 1.16 5.32 3.85 5.89s5.35-1.15 5.92-3.84zm-4 8.32a2.96 2.96 0 0 1-3.17 1.39a2.97 2.97 0 0 1-2.33-2.55zM8.47 5.17L4 6.13l1.66 7.81l.01.03c.15.71.45 1.35.86 1.9c-.1-.77-.08-1.57.09-2.37l.43-2c-.45-.08-.84-.33-1.05-.69c.06-.61.56-1.15 1.25-1.31h.25l.78-3.81c.04-.19.1-.36.19-.52m6.56 7.06c.32-.53 1-.81 1.69-.66c.69.14 1.19.67 1.28 1.29c-.33.52-1 .8-1.7.64c-.69-.13-1.19-.66-1.27-1.27m-4.88-1.04c.32-.53.99-.81 1.68-.66c.67.14 1.2.68 1.28 1.29c-.33.52-1 .81-1.69.68c-.69-.17-1.19-.7-1.27-1.31m1.82-6.76l1.96.42l-.16-.8z"
		/>
	);
}

/** mdi:feather */
export function FeatherIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a quill"
			d="M22 2s-7.64-.37-13.66 7.88C3.72 16.21 2 22 2 22l1.94-1c1.44-2.5 2.19-3.53 3.6-5c2.53.74 5.17.65 7.46-2c-2-.56-3.6-.43-5.96-.19C11.69 12 13.5 11.6 16 12l1-2c-1.8-.34-3-.37-4.78.04C14.19 8.65 15.56 7.87 18 8l1.21-1.93c-1.56-.11-2.5.06-4.29.5c1.61-1.46 3.08-2.12 5.22-2.25c0 0 1.05-1.89 1.86-2.32"
		/>
	);
}

/** mdi:message-text */
export function MessageIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a message bubble"
			d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2M6 9h12v2H6m8 3H6v-2h8m4-4H6V6h12"
		/>
	);
}

/** mdi:pine-tree */
export function PineTreeIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a tree"
			d="M10 21v-3H3l5-5H5l5-5H7l5-5l5 5h-3l5 5h-3l5 5h-7v3z"
		/>
	);
}

/** mdi:lightning-bolt */
export function BoltIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a lightning bolt"
			d="M11 15H6l7-14v8h5l-7 14z"
		/>
	);
}

/** mdi:book-clock */
export function BookClockIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a book and a clock"
			d="m16.5 17.25l2.86 1.69l-.75 1.22L15 18v-5h1.5zM23 17c0 3.87-3.13 7-7 7c-1.91 0-3.63-.76-4.89-2H6c-1.11 0-2-.89-2-2V4a2 2 0 0 1 2-2h1v7l2.5-1.5L12 9V2h6a2 2 0 0 1 2 2v7.26c1.81 1.27 3 3.36 3 5.74m-2 0c0-2.76-2.24-5-5-5s-5 2.24-5 5s2.24 5 5 5s5-2.24 5-5"
		/>
	);
}

/** mdi:earth */
export function EarthIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="the Earth"
			d="M17.9 17.39c-.26-.8-1.01-1.39-1.9-1.39h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41a7.984 7.984 0 0 1 2.9 12.8M11 19.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.22.21-1.79L9 15v1a2 2 0 0 0 2 2m1-16A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"
		/>
	);
}

/** mdi:movie-open */
export function MovieIcon({ size = 48, className }: IconProps) {
	return (
		<Mdi
			size={size}
			className={className}
			label="a film reel"
			d="m20.84 2.18l-3.93.78l2.74 3.54l1.97-.4zm-6.87 1.36L12 3.93l2.75 3.53l1.96-.39zm-4.9.96l-1.97.41l2.75 3.53l1.96-.39zm-4.91 1l-.98.19a2 2 0 0 0-1.57 2.35L2 10l4.9-.97zM2 10v10a2 2 0 0 0 2 2h16c1.11 0 2-.89 2-2V10z"
		/>
	);
}
