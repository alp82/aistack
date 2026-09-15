import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * The landing counter: tokens since the visitor opened the page, at the last
 * 24 hours' pace.
 *
 * THE BAND HAS NO PER-SECOND FEED. It carries one 24-hour total that moves
 * when a sync lands, so the counter runs at that total's pace (tokens per
 * second = tokens / 86,400) from the moment the page mounts, and folds in the
 * real movement when a sync moves the total under the open tab. The label
 * has to call it a pace.
 *
 * ONE SPAN PER THOUSANDS LANE, ONE BLUR PER LANE. The technique is
 * SpeedingText's: each lane gets its own feGaussianBlur whose radius follows
 * the lane's rate, so the ones lane smears, the thousands lane shimmers and
 * the millions lane stays crisp. Unlike SpeedingText the reading is LINEAR
 * and painted every frame: nothing accelerates and nothing settles. The lane
 * count is fixed from the pace's reach over an hour, so no lane appears
 * mid-run, and a separator shows only when the lane to its left has digits.
 *
 * The digits are painted from an effect, so they carry nothing a crawler can
 * read; the hero keeps its sr-only sentence as the canonical reading and the
 * counter is aria-hidden.
 */

const DAY_S = 24 * 60 * 60;
const REACH_S = 60 * 60;
const MAX_BLUR = 14;

type Pace = {
	/** Tokens per second. */
	readonly rate: number;
	/** Real movement that landed since mount, folded into the reading. */
	readonly landed: number;
	/** performance.now() at mount. */
	readonly startedAt: number;
	/** Whole seconds since mount, for a label. */
	readonly seconds: number;
};

export function usePace(tokensPerDay: number): Pace {
	const rate = tokensPerDay / DAY_S;
	const [startedAt] = useState(() =>
		typeof performance === "undefined" ? 0 : performance.now(),
	);
	const lastTotal = useRef(tokensPerDay);
	const [landed, setLanded] = useState(0);
	const [seconds, setSeconds] = useState(0);

	if (tokensPerDay !== lastTotal.current) {
		const delta = tokensPerDay - lastTotal.current;
		lastTotal.current = tokensPerDay;
		if (delta > 0) setLanded((n) => n + delta);
	}

	useEffect(() => {
		const id = window.setInterval(() => {
			setSeconds(Math.floor((performance.now() - startedAt) / 1000));
		}, 1000);
		return () => window.clearInterval(id);
	}, [startedAt]);

	return { rate, landed, startedAt, seconds };
}

function laneCount(reach: number): number {
	return Math.ceil(String(Math.floor(reach)).length / 3);
}

export function PaceCounter({
	pace,
	fontSize,
	height,
	className,
}: {
	readonly pace: Pace;
	readonly fontSize: number;
	readonly height: string;
	readonly className?: string;
}) {
	const stamp = useId().replace(/:/g, "");
	const slots = useRef<(HTMLSpanElement | null)[]>([]);
	const marks = useRef<(HTMLSpanElement | null)[]>([]);
	const lenses = useRef<(SVGFEGaussianBlurElement | null)[]>([]);

	const lanes = useMemo(
		() => Math.max(1, laneCount(pace.rate * REACH_S + pace.landed + 1)),
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
				const slot = slots.current[i];
				const mark = marks.current[i];
				const lens = lenses.current[i];
				if (slot) {
					slot.textContent = source >= 0 ? groups[source] : "";
					slot.style.opacity = source >= 0 ? "1" : "0";
				}
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
			aria-hidden="true"
			className={`relative flex items-center justify-center overflow-hidden ${className ?? ""}`}
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
			</div>
		</div>
	);
}

export function fmtSeconds(s: number): string {
	const m = Math.floor(s / 60);
	const r = s % 60;
	if (m === 0) return `${r}s`;
	return `${m}m ${String(r).padStart(2, "0")}s`;
}
