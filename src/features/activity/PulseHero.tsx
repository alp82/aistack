import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SpeedingText from "@/components/speeding-text";
import {
	BrutalistSelect,
	type BrutalistSelectOption,
} from "@/components/ui/brutalist-select";
import { Button } from "@/components/ui/button";
import { formatDay, Sparkline } from "@/features/charts";
import type { Band, DayPoint } from "./feed";
import {
	fmtCount,
	fmtTokens,
	liveDays,
	MONO_LABEL,
	rowHandle,
	rowSummary,
} from "./feed";
import { RelativeTime } from "./RelativeTime";

/**
 * The landing pulse — one bold number (#147, locked from the pulse-band
 * prototype's variant D after the E1 band was judged too busy).
 *
 *   ■ USAGE IN THE LAST 24 HOURS
 *
 *          106,299,666,998 tokens        ← SpeedingText counter
 *              596 sessions              ← SpeedingText reel
 *
 *          USAGE IN THE [ last 7 days ▾ ]
 *          ~~~~~~~/\~~~~ with high/low bubbles + hover tooltip
 *
 *   latest: alp/ai-stack +285M measured · 4h ago
 *          [ ADD YOUR TOKENS → ]  all activity
 *
 * ONE INSIGHT AT A TIME. The old band's four tiles and four feed rows each
 * competed for the same glance; here the token count is the only headline,
 * the other levels take turns in the reel, and the whole feed is one line.
 *
 * THE ANIMATION IS NOT THE RECORD. SpeedingText paints its digits from an
 * effect, so the first HTML carries them nowhere a crawler or screen reader
 * looks. The sr-only sentence below the count is the canonical server-rendered
 * reading; the animated pair is aria-hidden and exists for sighted visitors.
 *
 * QUIET IS NOT ZERO (#84): with no sync in the window the count renders an em
 * dash and the reel does not mount — a counter racing to zero reads as a
 * broken site, not a quiet one.
 *
 * The tooltip chips are QUIET GLASS — translucent canvas, no border, no solid
 * fill. Bordered means control (the range select), filled means nothing here:
 * a white brick is too heavy on the dark canvas and a lime fill fights the
 * lime line. The hover chip is marked by a small lime square instead.
 */

const TREND_HEIGHT = 144;

type TrendRange = "7" | "30";

const RANGE_OPTIONS: BrutalistSelectOption<TrendRange>[] = [
	{ value: "7", label: "last 7 days" },
	{ value: "30", label: "last 30 days" },
];

/**
 * x,y in 0..1 chart space. The y mapping assumes the domain runs 0..max,
 * which is what the Sparkline's area baseline draws.
 */
function positionOf(
	point: DayPoint,
	index: number,
	count: number,
	maxValue: number,
) {
	return {
		x: count > 1 ? index / (count - 1) : 0.5,
		y: 1 - point.value / maxValue,
	};
}

function Chip({
	x,
	y,
	label,
	value,
	below,
	live,
}: {
	readonly x: number;
	readonly y: number;
	readonly label: string;
	readonly value: string;
	readonly below?: boolean;
	readonly live?: boolean;
}) {
	return (
		<div
			className="pointer-events-none absolute z-10"
			style={{
				left: `${Math.min(Math.max(x, 0.08), 0.92) * 100}%`,
				top: `${y * 100}%`,
				transform: `translate(-50%, ${below ? "10px" : "calc(-100% - 10px)"})`,
			}}
		>
			<div className="flex items-center gap-1.5 bg-bg-canvas/85 px-2 py-1 font-mono text-[11px] whitespace-nowrap backdrop-blur-[2px]">
				{live ? (
					<span aria-hidden="true" className="h-1.5 w-1.5 bg-accent-lime" />
				) : null}
				<span>
					<span className="font-bold text-fg-primary">{value}</span>
					<span className="text-fg-muted"> · {label}</span>
				</span>
			</div>
		</div>
	);
}

function TokenTrend({ points }: { readonly points: readonly DayPoint[] }) {
	const ref = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<number | null>(null);
	const [range, setRange] = useState<TrendRange>("7");

	const days = useMemo(
		() => [...points].sort((a, b) => a.at - b.at).slice(-Number(range)),
		[points, range],
	);
	const maxValue = Math.max(...days.map((p) => p.value), 1);
	const { minIdx, maxIdx } = useMemo(() => {
		let lo = 0;
		let hi = 0;
		days.forEach((p, i) => {
			if (p.value < days[lo].value) lo = i;
			if (p.value > days[hi].value) hi = i;
		});
		return { minIdx: lo, maxIdx: hi };
	}, [days]);

	// Below two live readings there is no shape to draw (#84's watermark rule).
	if (liveDays(days) < 2) return null;

	const pick = (clientX: number) => {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect || rect.width === 0) return;
		const ratio = (clientX - rect.left) / rect.width;
		setHover(
			Math.min(
				days.length - 1,
				Math.max(0, Math.round(ratio * (days.length - 1))),
			),
		);
	};

	const minPos = positionOf(days[minIdx], minIdx, days.length, maxValue);
	const maxPos = positionOf(days[maxIdx], maxIdx, days.length, maxValue);
	const hoverPos =
		hover !== null
			? positionOf(days[hover], hover, days.length, maxValue)
			: null;
	// The live chip replaces a standing chip it would cover; a flat range has
	// no distinct low to call out.
	const hideMin = hover === minIdx || minIdx === maxIdx;
	const hideMax = hover === maxIdx;

	return (
		<div className="mt-10 w-full max-w-2xl">
			<div className="mb-3 flex items-center justify-center gap-3">
				<span className={`${MONO_LABEL} text-fg-muted`}>Usage in the</span>
				<BrutalistSelect
					options={RANGE_OPTIONS}
					value={range}
					onChange={(next) => {
						setRange(next);
						setHover(null);
					}}
					size="sm"
					className="w-36"
				/>
			</div>
			<div
				ref={ref}
				className="relative touch-none"
				style={{ height: TREND_HEIGHT }}
				onPointerMove={(e) => pick(e.clientX)}
				onPointerDown={(e) => pick(e.clientX)}
				onPointerLeave={() => setHover(null)}
			>
				<Sparkline
					points={days}
					ariaLabel={`Tokens measured per day, last ${range} days`}
					width={640}
					height={TREND_HEIGHT}
					fluid
					area
					className="h-full w-full"
				/>

				{hideMax ? null : (
					<Chip
						x={maxPos.x}
						y={maxPos.y}
						value={fmtTokens(days[maxIdx].value)}
						label={`high · ${formatDay(new Date(days[maxIdx].at))}`}
					/>
				)}
				{hideMin ? null : (
					<Chip
						x={minPos.x}
						y={minPos.y}
						value={fmtTokens(days[minIdx].value)}
						label={`low · ${formatDay(new Date(days[minIdx].at))}`}
						below={minPos.y < 0.55}
					/>
				)}

				{hover !== null && hoverPos ? (
					<>
						<div
							className="pointer-events-none absolute inset-y-0 w-px bg-stroke-strong"
							style={{ left: `${hoverPos.x * 100}%` }}
						/>
						<div
							className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-accent-lime ring-2 ring-bg-panel"
							style={{
								left: `${hoverPos.x * 100}%`,
								top: `${hoverPos.y * 100}%`,
							}}
						/>
						<Chip
							x={hoverPos.x}
							y={hoverPos.y}
							value={fmtTokens(days[hover].value)}
							label={formatDay(new Date(days[hover].at))}
							below={hoverPos.y < 0.55}
							live
						/>
					</>
				) : null}
			</div>
		</div>
	);
}

export function PulseHero({ band }: { readonly band: Band }) {
	const { totals, usage, points, rows } = band;
	const quiet = usage.stacks === 0;
	const latest = rows[0];

	// The band is a live Convex subscription, so a landing sync changes
	// `usage.tokens` under an open tab. The counter then races FROM the reading
	// the viewer is already looking at, not from zero — a replay of the whole
	// count-up would claim the day started over. First paint still runs 0 → value.
	const lastTokens = useRef(0);
	const countFrom = lastTokens.current;
	useEffect(() => {
		lastTokens.current = usage.tokens;
	}, [usage.tokens]);
	const reel = [
		`${fmtCount(usage.sessions)} sessions`,
		`${fmtCount(usage.projects)} projects`,
		`${fmtCount(usage.tools)} tools`,
		`${totals.stacksSeen} ${totals.stacksSeen === 1 ? "stack" : "stacks"}`,
	];

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-14">
			<div className="mx-auto flex w-full max-w-content flex-col items-center text-center">
				<span className="flex items-center gap-3">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
						<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
					</span>
					<span className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-accent-lime">
						Usage in the last 24 hours
					</span>
				</span>

				{quiet ? (
					<div className="mt-6 text-8xl font-black leading-none tracking-tighter text-fg-primary">
						—
					</div>
				) : (
					<>
						{/* The canonical reading, for the first HTML. */}
						<p className="sr-only">
							{fmtTokens(usage.tokens)} tokens measured in the last 24 hours,
							across {fmtCount(usage.sessions)} sessions,{" "}
							{fmtCount(usage.projects)} projects and {fmtCount(usage.tools)}{" "}
							tools, from {totals.stacksSeen}{" "}
							{totals.stacksSeen === 1 ? "stack" : "stacks"}.
						</p>

						{/* SpeedingText sets `display: flex` inline, which beats a
						    `hidden` utility on the component itself — the responsive
						    pair needs wrapper divs. */}
						<div
							aria-hidden="true"
							className="mt-6 w-full tracking-tighter text-fg-primary"
						>
							<div className="hidden md:block">
								<SpeedingText
									value={usage.tokens}
									from={countFrom}
									suffix=" tokens"
									duration={2600}
									italic={false}
									fontWeight={900}
									fontSize={80}
									textColor="currentColor"
									height="6.5rem"
								/>
							</div>
							<div className="md:hidden">
								<SpeedingText
									value={usage.tokens}
									from={countFrom}
									suffix=" tokens"
									duration={2600}
									italic={false}
									fontWeight={900}
									fontSize={32}
									textColor="currentColor"
									height="3rem"
								/>
							</div>
						</div>

						<div
							aria-hidden="true"
							className="mt-2 tracking-tighter text-fg-secondary"
						>
							<div className="hidden md:block">
								<SpeedingText
									words={reel}
									interval={2200}
									swapDuration={520}
									travel={70}
									italic={false}
									fontWeight={900}
									fontSize={44}
									textColor="currentColor"
									height="3.5rem"
								/>
							</div>
							<div className="md:hidden">
								<SpeedingText
									words={reel}
									interval={2200}
									swapDuration={520}
									travel={50}
									italic={false}
									fontWeight={900}
									fontSize={28}
									textColor="currentColor"
									height="2.5rem"
								/>
							</div>
						</div>
					</>
				)}

				<TokenTrend points={points} />

				{latest ? (
					<div className="mt-6 font-mono text-xs text-fg-muted">
						latest:{" "}
						<Link
							to="/stacks/$slug"
							params={{ slug: latest.stack.slug }}
							className="font-semibold text-fg-secondary hover:text-accent-lime"
						>
							{rowHandle(latest)}
						</Link>{" "}
						{rowSummary(latest)} ·{" "}
						<RelativeTime at={latest.at} className="text-fg-muted/60" />
					</div>
				) : null}

				<div className="mt-8 flex items-center gap-6">
					<Button asChild size="lg">
						<Link to="/sync" className={MONO_LABEL}>
							add your tokens <ArrowRight className="h-3 w-3" />
						</Link>
					</Button>
					<Link
						to="/activity"
						className={`${MONO_LABEL} text-fg-muted transition-colors hover:text-fg-primary`}
					>
						all activity
					</Link>
				</div>
			</div>
		</section>
	);
}
