/**
 * PROTOTYPE — throwaway. Variant D: "One Number" (D+E combined).
 *
 * The 24-hour token count colossal at the top via SpeedingText's counter,
 * the reel of other insights toggling under it, then a 7-day chart titled
 * "Usage in the last 7 days" with min/max bubbles and a hover/tap tooltip.
 *
 * SpeedingText sets `display: flex` inline, which beats Tailwind's `hidden`
 * class — so the responsive pair is wrapped in plain divs, never classed
 * directly on the component.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import SpeedingText from "@/components/speeding-text";
import {
	BrutalistSelect,
	type BrutalistSelectOption,
} from "@/components/ui/brutalist-select";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/features/charts";
import type { Band, DayPoint } from "../feed";
import { fmtCount, fmtTokens, liveDays, MONO_LABEL } from "../feed";
import { RelativeTime } from "../RelativeTime";
import { rowHandle, rowSummary } from "./summary";

export const VARIANT_ONE_NUMBER_NAME = "One Number — count on top, reel below";

const CHART_HEIGHT = 144;

type ChartRange = "7" | "30";

const RANGE_OPTIONS: BrutalistSelectOption<ChartRange>[] = [
	{ value: "7", label: "last 7 days" },
	{ value: "30", label: "last 30 days" },
];

function subPhrases(band: Band): string[] {
	const { totals, usage } = band;
	return [
		`${fmtCount(usage.sessions)} sessions`,
		`${fmtCount(usage.projects)} projects`,
		`${fmtCount(usage.tools)} tools`,
		`${totals.stacksSeen} ${totals.stacksSeen === 1 ? "stack" : "stacks"}`,
	];
}

function fmtDay(at: number): string {
	return new Date(at).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

/** x,y in 0..1 chart space, assuming the y domain runs 0..max like the area. */
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

function Bubble({
	x,
	y,
	label,
	value,
	below,
	accent,
}: {
	readonly x: number;
	readonly y: number;
	readonly label: string;
	readonly value: string;
	readonly below?: boolean;
	readonly accent?: boolean;
}) {
	return (
		<div
			className="pointer-events-none absolute z-10 -translate-x-1/2"
			style={{
				left: `${Math.min(Math.max(x, 0.08), 0.92) * 100}%`,
				top: `${y * 100}%`,
				transform: `translate(-50%, ${below ? "10px" : "calc(-100% - 10px)"})`,
			}}
		>
			{/* Quiet glass chips, no border — the dropdown owns the bordered look.
			    No solid fills: white bricks are too heavy on the dark canvas and a
			    lime fill fights the lime line. The hover chip is marked by a small
			    lime square instead. */}
			<div className="flex items-center gap-1.5 bg-bg-canvas/85 px-2 py-1 font-mono text-[11px] whitespace-nowrap backdrop-blur-[2px]">
				{accent ? (
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

function SevenDayChart({ points }: { readonly points: readonly DayPoint[] }) {
	const ref = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<number | null>(null);
	const [range, setRange] = useState<ChartRange>("7");

	// The band serves 14 daily points today, so "30" shows all it has. Real
	// 30-day depth needs the query's window widened at fold-in time.
	const week = useMemo(
		() => [...points].sort((a, b) => a.at - b.at).slice(-Number(range)),
		[points, range],
	);
	const maxValue = Math.max(...week.map((p) => p.value), 1);
	const { minIdx, maxIdx } = useMemo(() => {
		let lo = 0;
		let hi = 0;
		week.forEach((p, i) => {
			if (p.value < week[lo].value) lo = i;
			if (p.value > week[hi].value) hi = i;
		});
		return { minIdx: lo, maxIdx: hi };
	}, [week]);

	if (liveDays(week) < 2) return null;

	const pick = (clientX: number) => {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect || rect.width === 0) return;
		const ratio = (clientX - rect.left) / rect.width;
		setHover(
			Math.min(
				week.length - 1,
				Math.max(0, Math.round(ratio * (week.length - 1))),
			),
		);
	};

	const minPos = positionOf(week[minIdx], minIdx, week.length, maxValue);
	const maxPos = positionOf(week[maxIdx], maxIdx, week.length, maxValue);
	const hoverPos =
		hover !== null
			? positionOf(week[hover], hover, week.length, maxValue)
			: null;
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
				style={{ height: CHART_HEIGHT }}
				onPointerMove={(e) => pick(e.clientX)}
				onPointerDown={(e) => pick(e.clientX)}
				onPointerLeave={() => setHover(null)}
			>
				<Sparkline
					points={week}
					ariaLabel="Tokens measured per day, last 7 days"
					width={640}
					height={CHART_HEIGHT}
					fluid
					area
					className="h-full w-full"
				/>

				{hideMax ? null : (
					<Bubble
						x={maxPos.x}
						y={maxPos.y}
						value={fmtTokens(week[maxIdx].value)}
						label={`high · ${fmtDay(week[maxIdx].at)}`}
					/>
				)}
				{hideMin ? null : (
					<Bubble
						x={minPos.x}
						y={minPos.y}
						value={fmtTokens(week[minIdx].value)}
						label={`low · ${fmtDay(week[minIdx].at)}`}
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
						<Bubble
							x={hoverPos.x}
							y={hoverPos.y}
							value={fmtTokens(week[hover].value)}
							label={fmtDay(week[hover].at)}
							below={hoverPos.y < 0.55}
							accent
						/>
					</>
				) : null}
			</div>
		</div>
	);
}

export function VariantOneNumber({ band }: { readonly band: Band }) {
	const { usage, points, rows } = band;
	const quiet = usage.stacks === 0;
	const latest = rows[0];
	const phrases = subPhrases(band);

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

				<div className="mt-6 w-full tracking-tighter text-fg-primary">
					{quiet ? (
						<div className="text-8xl font-black leading-none">—</div>
					) : (
						<>
							<div className="hidden md:block">
								<SpeedingText
									value={usage.tokens}
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
									suffix=" tokens"
									duration={2600}
									italic={false}
									fontWeight={900}
									fontSize={32}
									textColor="currentColor"
									height="3rem"
								/>
							</div>
						</>
					)}
				</div>

				{quiet ? null : (
					<div className="mt-2 tracking-tighter text-fg-secondary">
						<div className="hidden md:block">
							<SpeedingText
								words={phrases}
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
								words={phrases}
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
				)}

				<SevenDayChart points={points} />

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
