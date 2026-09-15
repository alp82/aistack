import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { RelativeTime } from "@/components/RelativeTime";
import {
	BrutalistSelect,
	type BrutalistSelectOption,
} from "@/components/ui/brutalist-select";
import { Button } from "@/components/ui/button";
import { formatDay, Sparkline } from "@/features/charts";
import type { Band, DayPoint } from "./feed";
import { fmtCount, fmtTokens, liveDays, MONO_LABEL, rowSummary } from "./feed";
import { fmtSeconds, PaceCounter, usePace } from "./PaceCounter";

/**
 * The landing pulse - one moving number (#147's variant D, reshaped by the
 * 2026-09-15 strip prototype, variant K).
 *
 *   ■ TOKENS SINCE YOU OPENED THIS PAGE
 *
 *          1,528,415                     ← PaceCounter, linear, blurred lanes
 *          8s at the last 24 hours' pace
 *   ───────────────────────────────────
 *   15.48B    1,156    218    34    14   ← the levels, big, static
 *   TOKENS·24H SESSIONS PROJECTS TOOLS STACKS
 *
 *          ~~~~~~~/\~~~~ with high/low bubbles + hover tooltip
 *          USAGE IN THE [ last 7 days ▾ ]
 *
 *          [ ADD YOUR TOKENS → ]  all activity
 *   latest: AI Stack +285M measured · 4h ago
 *
 * ONE MOVING THING. The counter is the only animation; the levels sit still
 * in a row instead of taking turns in a reel, so a visitor reads all of them
 * at once and the eye has one place to rest.
 *
 * THE ANIMATION IS NOT THE RECORD. PaceCounter paints its digits from an
 * effect, so the first HTML carries them nowhere a crawler or screen reader
 * looks. The sr-only sentence is the canonical server-rendered reading, and
 * it carries the 24-hour total the counter is paced by, not the counter's
 * own figure, which is an estimate.
 *
 * QUIET IS NOT ZERO (#84): with no sync in the window the count renders a
 * dash and no counter mounts - a counter sitting at zero reads as a broken
 * site, not a quiet one.
 *
 * The latest line names the STACK, not `creator/slug`: the slug is an
 * address, the name is what the owner called it.
 *
 * The tooltip chips are QUIET GLASS - translucent canvas, no border, no solid
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

	// The range select sits UNDER the marks: the chart is the object, the
	// control is its caption, and the high chip needs the headroom above.
	const rangeControl = (
		<div className="mt-4 flex items-center justify-center gap-3">
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
	);

	return (
		<div className="mt-16 w-full max-w-2xl">
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
			{rangeControl}
		</div>
	);
}

export function PulseHero({ band }: { readonly band: Band }) {
	const { totals, usage, points, rows } = band;
	const quiet = usage.stacks === 0;
	const latest = rows[0];
	const pace = usePace(usage.tokens);

	const levels: [string, string, boolean][] = [
		["tokens · 24h", fmtTokens(usage.tokens), true],
		["sessions", fmtCount(usage.sessions), false],
		["projects", fmtCount(usage.projects), false],
		["tools", fmtCount(usage.tools), false],
		[
			totals.stacksSeen === 1 ? "stack" : "stacks",
			fmtCount(totals.stacksSeen),
			false,
		],
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
						Tokens since you opened this page
					</span>
				</span>

				{quiet ? (
					<div className="mt-6 text-8xl font-black leading-none tracking-tighter text-fg-primary">
						-
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

						<div className="mt-6 w-full tracking-tighter text-fg-primary">
							<div className="hidden md:block">
								<PaceCounter pace={pace} fontSize={80} height="6.5rem" />
							</div>
							<div className="md:hidden">
								<PaceCounter pace={pace} fontSize={32} height="3rem" />
							</div>
						</div>
						<div
							aria-hidden="true"
							className="mt-1 font-mono text-xs text-fg-muted"
						>
							{fmtSeconds(pace.seconds)} at the last 24 hours' pace
						</div>

						<div className="mt-10 grid w-full max-w-4xl grid-cols-3 gap-x-4 gap-y-6 border-t border-stroke-muted pt-6 md:grid-cols-5">
							{levels.map(([label, value, lead]) => (
								<div key={label} className="flex flex-col items-center gap-1">
									<span
										className={`text-4xl font-black leading-none tracking-tighter tabular-nums md:text-5xl ${
											lead ? "text-accent-lime" : "text-fg-primary"
										}`}
									>
										{value}
									</span>
									<span className={`${MONO_LABEL} text-fg-muted`}>{label}</span>
								</div>
							))}
						</div>
					</>
				)}

				<TokenTrend points={points} />

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

				{latest ? (
					<div className="mt-6 font-mono text-xs text-fg-muted">
						latest:{" "}
						<Link
							to="/stacks/$slug"
							params={{ slug: latest.stack.slug }}
							className="font-semibold text-fg-secondary hover:text-accent-lime"
						>
							{latest.stack.name}
						</Link>{" "}
						{rowSummary(latest)} ·{" "}
						<RelativeTime at={latest.at} className="text-fg-muted/60" />
					</div>
				) : null}
			</div>
		</section>
	);
}
