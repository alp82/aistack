/**
 * PROTOTYPE - throwaway. The "since you opened this page" counter.
 *
 * SpeedingText eases every run, so feeding it a cadence made the digits
 * accelerate and settle once a step, and its separator sits before each
 * lane's digits, so a hidden leading lane still showed its neighbour's comma.
 * PaceCounter borrows the technique (one span per thousands lane, one
 * feGaussianBlur per lane, blur in proportion to the lane's rate) and paints
 * a LINEAR reading every frame instead: the low lanes hold a steady smear,
 * the high lanes stay crisp, and nothing ever settles. Lane count is fixed
 * from the pace's reach over an hour, so no lane appears mid-run.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Band } from "../feed";

const DAY_S = 24 * 60 * 60;
const REACH_S = 60 * 60;
const MAX_BLUR = 14;

export function useSessionPace(band: Band) {
	const rate = band.usage.tokens / DAY_S;
	const [startedAt] = useState(() =>
		typeof performance === "undefined" ? 0 : performance.now(),
	);
	const lastTotal = useRef(band.usage.tokens);
	const [landed, setLanded] = useState(0);
	const [seconds, setSeconds] = useState(0);

	if (band.usage.tokens !== lastTotal.current) {
		const delta = band.usage.tokens - lastTotal.current;
		lastTotal.current = band.usage.tokens;
		if (delta > 0) setLanded((n) => n + delta);
	}

	useEffect(() => {
		const id = window.setInterval(() => {
			setSeconds((performance.now() - startedAt) / 1000);
		}, 1000);
		return () => window.clearInterval(id);
	}, [startedAt]);

	return { rate, landed, startedAt, seconds };
}

type Pace = ReturnType<typeof useSessionPace>;

function laneCount(reach: number): number {
	return Math.max(1, String(Math.floor(reach)).length);
}

function PaceLanes({
	pace,
	fontSize,
	height,
	suffix,
}: {
	readonly pace: Pace;
	readonly fontSize: number;
	readonly height: string;
	readonly suffix?: string;
}) {
	const stamp = useId().replace(/:/g, "");
	const slots = useRef<(HTMLSpanElement | null)[]>([]);
	const marks = useRef<(HTMLSpanElement | null)[]>([]);
	const lenses = useRef<(SVGFEGaussianBlurElement | null)[]>([]);

	const lanes = useMemo(
		() => Math.ceil(laneCount(pace.rate * REACH_S + pace.landed + 1) / 3),
		[pace.rate, pace.landed],
	);

	useEffect(() => {
		const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let frame = 0;
		const paint = (now: number) => {
			const amount =
				Math.floor(((now - pace.startedAt) / 1000) * pace.rate) + pace.landed;
			const digits = String(amount);
			const groups: string[] = [];
			for (let end = digits.length; end > 0; end -= 3) {
				groups.unshift(digits.slice(Math.max(0, end - 3), end));
			}
			const missing = lanes - groups.length;
			for (let i = 0; i < lanes; i++) {
				const source = i - missing;
				const shown = source >= 0;
				const slot = slots.current[i];
				const mark = marks.current[i];
				const lens = lenses.current[i];
				if (slot) {
					slot.textContent = shown ? groups[source] : "";
					slot.style.opacity = shown ? "1" : "0";
				}
				// The separator belongs to the lane on its LEFT: it shows only
				// when that lane has digits.
				if (mark) mark.style.opacity = source >= 1 ? "1" : "0";
				if (lens) {
					const tier = 1000 ** (lanes - 1 - i);
					const smear = calm ? 0 : Math.min(MAX_BLUR, pace.rate / tier / 1000);
					lens.setAttribute("stdDeviation", `${smear.toFixed(2)},0`);
				}
			}
			if (!calm) frame = requestAnimationFrame(paint);
		};
		frame = requestAnimationFrame(paint);
		return () => cancelAnimationFrame(frame);
	}, [pace, lanes]);

	return (
		<div
			className="relative flex items-center justify-center overflow-hidden"
			style={{ height }}
		>
			<svg aria-hidden style={{ position: "absolute", width: 0, height: 0 }}>
				<defs>
					{Array.from({ length: lanes }, (_, i) => (
						<filter
							// biome-ignore lint/suspicious/noArrayIndexKey: static lane count
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
					))}
				</defs>
			</svg>
			<div
				className="flex items-center font-black tabular-nums"
				style={{ fontSize, lineHeight: 1.1, whiteSpace: "pre" }}
			>
				{Array.from({ length: lanes }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static lane count
					<span key={i} className="flex items-center">
						{i > 0 ? (
							<span
								ref={(node) => {
									marks.current[i] = node;
								}}
								style={{ opacity: 0 }}
							>
								,
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
				))}
				{suffix ? <span>{suffix}</span> : null}
			</div>
		</div>
	);
}

export function SessionCounter({
	pace,
	suffix = "",
	className = "",
}: {
	readonly pace: Pace;
	readonly suffix?: string;
	readonly className?: string;
}) {
	return (
		<div aria-hidden="true" className={`w-full tracking-tighter ${className}`}>
			<div className="hidden md:block">
				<PaceLanes pace={pace} fontSize={80} height="6.5rem" suffix={suffix} />
			</div>
			<div className="md:hidden">
				<PaceLanes pace={pace} fontSize={32} height="3rem" suffix={suffix} />
			</div>
		</div>
	);
}

export function fmtSeconds(s: number): string {
	const m = Math.floor(s / 60);
	const r = Math.floor(s % 60);
	if (m === 0) return `${r}s`;
	return `${m}m ${String(r).padStart(2, "0")}s`;
}
