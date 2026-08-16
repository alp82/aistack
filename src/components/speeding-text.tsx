// Vendor source, kept verbatim - see the license note below.
// biome-ignore-all lint/complexity/useOptionalChain: vendor source kept verbatim
// biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative filter defs, aria-hidden
// biome-ignore-all lint/suspicious/noArrayIndexKey: static lane count, never reordered
/**
 * PROTOTYPE - licensed copy from the owner's React Bits Pro account
 * (https://pro.reactbits.dev/docs/components/speeding-text), added directly
 * because the shadcn registry needs REACTBITS_LICENSE_KEY at install time.
 * Do not redistribute outside this repo.
 */

"use client";

import { useInView } from "motion/react";
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
} from "react";

import { cn } from "@/lib/utils";

export type SpeedingTextAlign = "left" | "center" | "right";

export interface SpeedingTextProps {
	/** Number the counter travels to. Ignored when words are supplied. */
	value?: number;
	/** Value the counter starts from. */
	from?: number;
	/** Words cycled in place instead of counting. */
	words?: string[];
	/** Milliseconds the counter takes to reach the value. */
	duration?: number;
	/** Milliseconds each word is held before the next swap. */
	interval?: number;
	/** Milliseconds a word swap takes. */
	swapDuration?: number;
	/** Horizontal distance a swapping word travels, in pixels. */
	travel?: number;
	/** Decimal places kept on the counter. */
	decimals?: number;
	/** Locale used for digit grouping. */
	locale?: string;
	/** Text placed before the value. */
	prefix?: string;
	/** Text placed after the value. */
	suffix?: string;
	/** Multiplier on how readily speed turns into blur. */
	blurStrength?: number;
	/** Upper bound on the blur radius in pixels. */
	maxBlur?: number;
	/** Fade the group separators in as digits arrive. */
	showSeparator?: boolean;
	/** Font size in pixels. */
	fontSize?: number;
	/** Font weight. */
	fontWeight?: number;
	/** Slant the glyphs. */
	italic?: boolean;
	/** Colour of the glyphs. */
	textColor?: string;
	/** Colour behind the glyphs. */
	backgroundColor?: string;
	/** Horizontal placement inside the box. */
	align?: SpeedingTextAlign;
	/** Hold the run until the element scrolls into view. */
	startOnView?: boolean;
	/** Restart once the run finishes. */
	loop?: boolean;
	/** Milliseconds to wait before a looped restart. */
	loopDelay?: number;
	/** Freeze the animation. */
	paused?: boolean;
	/** Width of the container. */
	width?: string | number;
	/** Height of the container. */
	height?: string | number;
	/** Extra classes for the container. */
	className?: string;
	/** Inline styles for the container. */
	style?: CSSProperties;
}

const clamp = (value: number, low: number, high: number) =>
	Math.min(high, Math.max(low, value));

const easeOut = (t: number) => 1 - (1 - t) ** 4;

const sliceGroups = (
	shaper: Intl.NumberFormat,
	amount: number,
): { body: string[]; mark: string } => {
	const body: string[] = [];
	let mark = ",";
	let pending = "";
	let tail = "";
	for (const piece of shaper.formatToParts(amount)) {
		if (piece.type === "group") {
			mark = piece.value;
			body.push(pending);
			pending = "";
		} else if (piece.type === "integer") {
			pending += piece.value;
		} else if (piece.type === "minusSign" || piece.type === "plusSign") {
			pending = piece.value + pending;
		} else if (piece.type === "decimal" || piece.type === "fraction") {
			tail += piece.value;
		}
	}
	body.push(pending + tail);
	return { body, mark };
};

const SpeedingText = ({
	value = 20000,
	from = 0,
	words,
	duration = 2200,
	interval = 1400,
	swapDuration = 520,
	travel = 90,
	decimals = 0,
	locale = "en-US",
	prefix = "",
	suffix = "",
	blurStrength = 1,
	maxBlur = 14,
	showSeparator = true,
	fontSize = 96,
	fontWeight = 700,
	italic = true,
	textColor = "#0a0a0a",
	backgroundColor = "transparent",
	align = "center",
	startOnView = true,
	loop = false,
	loopDelay = 900,
	paused = false,
	width = "100%",
	height = "100%",
	className,
	style,
}: SpeedingTextProps) => {
	const stamp = useId().replace(/:/g, "");
	const shell = useRef<HTMLDivElement>(null);
	const slots = useRef<(HTMLSpanElement | null)[]>([]);
	const marks = useRef<(HTMLSpanElement | null)[]>([]);
	const lenses = useRef<(SVGFEGaussianBlurElement | null)[]>([]);
	const wordSlot = useRef<HTMLSpanElement>(null);
	const wordLens = useRef<SVGFEGaussianBlurElement>(null);

	const seen = useInView(shell, { once: true, margin: "-64px" });
	const live = startOnView ? seen : true;

	const roster = useMemo(
		() => (words ?? []).filter((entry) => entry.length > 0),
		[words],
	);
	const cycling = roster.length > 1;

	const shaper = useMemo(
		() =>
			new Intl.NumberFormat(locale, {
				minimumFractionDigits: clamp(decimals, 0, 8),
				maximumFractionDigits: clamp(decimals, 0, 8),
			}),
		[locale, decimals],
	);

	const { lanes, glyph } = useMemo(() => {
		if (cycling) return { lanes: 1, glyph: "," };
		const reach = Math.max(Math.abs(value), Math.abs(from), 1);
		const cut = sliceGroups(shaper, reach);
		return { lanes: cut.body.length, glyph: cut.mark };
	}, [cycling, value, from, shaper]);

	const paint = useCallback(
		(amount: number, rate: number) => {
			const { body } = sliceGroups(shaper, amount);
			const missing = lanes - body.length;
			for (let i = 0; i < lanes; i++) {
				const slot = slots.current[i];
				const mark = marks.current[i];
				const lens = lenses.current[i];
				const source = i - missing;
				const shown = source >= 0;
				if (slot) {
					slot.textContent = shown ? body[source] : "";
					slot.style.opacity = shown ? "1" : "0";
				}
				if (mark) {
					mark.style.opacity = shown && showSeparator ? "1" : "0";
				}
				if (lens) {
					const tier = 1000 ** (lanes - 1 - i);
					const smear = clamp(
						((rate / tier) * blurStrength) / 1000,
						0,
						maxBlur,
					);
					lens.setAttribute("stdDeviation", `${smear.toFixed(2)},0`);
				}
			}
		},
		[shaper, lanes, showSeparator, blurStrength, maxBlur],
	);

	useEffect(() => {
		if (cycling || !live) return;
		const calm =
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (calm || paused || duration <= 0) {
			paint(value, 0);
			return;
		}

		let frame = 0;
		let timer = 0;
		let origin = 0;
		const span = Math.abs(value - from);

		const tick = (now: number) => {
			if (!origin) origin = now;
			const ratio = clamp((now - origin) / duration, 0, 1);
			const eased = easeOut(ratio);
			const amount = from + (value - from) * eased;
			const slope = 4 * (1 - ratio) ** 3;
			paint(amount, (span * slope * 1000) / duration);
			if (ratio < 1) {
				frame = requestAnimationFrame(tick);
			} else {
				paint(value, 0);
				if (loop) {
					timer = window.setTimeout(() => {
						origin = 0;
						frame = requestAnimationFrame(tick);
					}, loopDelay);
				}
			}
		};

		frame = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(frame);
			window.clearTimeout(timer);
		};
	}, [cycling, live, paused, value, from, duration, loop, loopDelay, paint]);

	useEffect(() => {
		if (!cycling) return;
		const slot = wordSlot.current;
		const lens = wordLens.current;
		if (!slot) return;

		const calm =
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		let cursor = 0;
		slot.textContent = roster[0];
		slot.style.transform = "translateX(0px)";
		slot.style.opacity = "1";
		lens?.setAttribute("stdDeviation", "0,0");

		if (calm || paused) return;

		let frame = 0;
		let timer = 0;

		const swap = () => {
			let origin = 0;
			let flipped = false;
			const run = (now: number) => {
				if (!origin) origin = now;
				const ratio = clamp((now - origin) / swapDuration, 0, 1);
				const half = ratio < 0.5 ? ratio * 2 : (ratio - 0.5) * 2;
				if (ratio >= 0.5 && !flipped) {
					flipped = true;
					cursor = (cursor + 1) % roster.length;
					slot.textContent = roster[cursor];
				}
				const shift = ratio < 0.5 ? half * travel : -travel * (1 - half);
				const fade = ratio < 0.5 ? 1 - half : half;
				const smear = maxBlur * blurStrength * (ratio < 0.5 ? half : 1 - half);
				slot.style.transform = `translateX(${shift.toFixed(2)}px)`;
				slot.style.opacity = fade.toFixed(3);
				lens?.setAttribute(
					"stdDeviation",
					`${clamp(smear, 0, maxBlur).toFixed(2)},0`,
				);
				if (ratio < 1) {
					frame = requestAnimationFrame(run);
				} else {
					slot.style.transform = "translateX(0px)";
					slot.style.opacity = "1";
					lens?.setAttribute("stdDeviation", "0,0");
					timer = window.setTimeout(swap, interval);
				}
			};
			frame = requestAnimationFrame(run);
		};

		timer = window.setTimeout(swap, interval);
		return () => {
			cancelAnimationFrame(frame);
			window.clearTimeout(timer);
		};
	}, [
		cycling,
		roster,
		paused,
		interval,
		swapDuration,
		travel,
		maxBlur,
		blurStrength,
	]);

	const justify =
		align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

	return (
		<div
			ref={shell}
			className={cn("relative overflow-hidden", className)}
			style={{
				width,
				height,
				backgroundColor,
				color: textColor,
				display: "flex",
				alignItems: "center",
				justifyContent: justify,
				...style,
			}}
		>
			<svg aria-hidden style={{ position: "absolute", width: 0, height: 0 }}>
				<defs>
					{cycling ? (
						<filter
							id={`${stamp}-w`}
							x="-50%"
							y="-50%"
							width="200%"
							height="200%"
						>
							<feGaussianBlur
								ref={wordLens}
								in="SourceGraphic"
								stdDeviation="0,0"
							/>
						</filter>
					) : (
						Array.from({ length: lanes }, (_, i) => (
							<filter
								key={i}
								id={`${stamp}-${i}`}
								x="-50%"
								y="-50%"
								width="200%"
								height="200%"
							>
								<feGaussianBlur
									ref={(node) => {
										lenses.current[i] = node;
									}}
									in="SourceGraphic"
									stdDeviation="0,0"
								/>
							</filter>
						))
					)}
				</defs>
			</svg>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					fontSize,
					fontWeight,
					fontStyle: italic ? "italic" : "normal",
					lineHeight: 1.1,
					fontVariantNumeric: "tabular-nums",
					whiteSpace: "pre",
				}}
			>
				{prefix ? <span>{prefix}</span> : null}

				{cycling ? (
					<span
						ref={wordSlot}
						style={{
							display: "inline-block",
							filter: `url(#${stamp}-w)`,
							willChange: "transform, opacity, filter",
						}}
					/>
				) : (
					Array.from({ length: lanes }, (_, i) => (
						<span key={i} style={{ display: "flex", alignItems: "center" }}>
							{i > 0 ? (
								<span
									ref={(node) => {
										marks.current[i] = node;
									}}
									style={{ opacity: 0, transition: "opacity 140ms ease" }}
								>
									{glyph}
								</span>
							) : null}
							<span
								ref={(node) => {
									slots.current[i] = node;
								}}
								style={{
									display: "inline-block",
									minWidth: i > 0 ? "3ch" : undefined,
									textAlign: "right",
									filter: `url(#${stamp}-${i})`,
									willChange: "filter",
								}}
							/>
						</span>
					))
				)}

				{suffix ? <span>{suffix}</span> : null}
			</div>
		</div>
	);
};

export default SpeedingText;
