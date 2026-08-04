/**
 * PROTOTYPE - throwaway hand-rolled SVG. Wayfinder ticket #80.
 *
 * No chart library is installed yet; ticket #91 builds the real one on TanStack
 * Charts with a validated palette. These primitives exist only so the variants
 * can be judged on layout and honesty, not on rendering quality. Do not promote
 * this file.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";
import { fmtDay, PROTO_SERIES_COLORS, type ProtoPoint } from "./fixtures";

const ACCENT = "var(--accent-lime)";

function scaleX(at: number, min: number, max: number, w: number, pad: number) {
	if (max === min) return w / 2;
	return pad + ((at - min) / (max - min)) * (w - pad * 2);
}

/** A bare trend line, no axes. Used as texture inside stat tiles. */
export function Sparkline({
	values,
	width = 88,
	height = 24,
	color = ACCENT,
	className,
	area = false,
	dot = true,
	strokeWidth = 1.5,
	stretch = false,
}: {
	values: number[];
	width?: number;
	height?: number;
	color?: string;
	className?: string;
	/** Fill under the curve. Reads as background texture, not as a second line. */
	area?: boolean;
	/** The marker on the newest reading. Drop it when the trail is a backdrop. */
	dot?: boolean;
	strokeWidth?: number;
	/**
	 * Fill the container in both axes instead of preserving the aspect ratio.
	 *
	 * Required for a backdrop: letterboxed inside a tall block, the curve floats
	 * in the middle and its fill stops short of the bottom edge, which reads as a
	 * box drawn around some of the text and not others.
	 */
	stretch?: boolean;
}) {
	if (values.length === 0) return null;
	const min = Math.min(...values);
	const max = Math.max(...values);
	const span = max - min || 1;
	const step = values.length > 1 ? width / (values.length - 1) : 0;
	const pts = values.map((v, i) => {
		const x = values.length === 1 ? width / 2 : i * step;
		const y = height - 2 - ((v - min) / span) * (height - 4);
		return [x, y] as const;
	});

	// One reading is a dot, not a line. A one-point "trend" is a lie.
	if (values.length === 1) {
		return (
			<svg
				viewBox={`0 0 ${width} ${height}`}
				width={width}
				height={height}
				className={className}
				role="img"
				aria-label="one reading so far"
			>
				<circle cx={width / 2} cy={height / 2} r={2.5} fill={color} />
			</svg>
		);
	}

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			width={width}
			height={height}
			className={className}
			preserveAspectRatio={stretch ? "none" : undefined}
			role="img"
			aria-label="trend of recent readings"
		>
			{area && (
				<polygon
					points={[
						`0,${height}`,
						...pts.map(([x, y]) => `${x},${y}`),
						`${width},${height}`,
					].join(" ")}
					fill={color}
					fillOpacity={0.35}
				/>
			)}
			<polyline
				points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
				fill="none"
				stroke={color}
				strokeWidth={strokeWidth}
			/>
			{dot && (
				<circle
					cx={pts[pts.length - 1][0]}
					cy={pts[pts.length - 1][1]}
					r={2}
					fill={color}
				/>
			)}
		</svg>
	);
}

/**
 * The rate chart: one measured figure plotted over the moment it was read.
 *
 * The y-axis is deliberately NOT zero-based, and the caption says so. These are
 * rolling-window readings that wobble a few percent; a zero baseline renders
 * them as a dead flat line, and an un-annotated zoomed axis renders a 5% wobble
 * as a mountain range. Both are dishonest, so the band is stated in words.
 */
export function RateChart({
	points,
	value,
	format,
	label,
	height = 200,
	color = ACCENT,
}: {
	points: ProtoPoint[];
	value: (p: ProtoPoint) => number | null;
	format: (v: number) => string;
	label: string;
	height?: number;
	color?: string;
}) {
	const gradId = useId();
	const vals = points
		.map((p) => ({ at: p.at, v: value(p), daily: p.daily }))
		.filter(
			(d): d is { at: number; v: number; daily: boolean } => d.v !== null,
		);
	if (vals.length === 0) return null;

	const W = 900;
	const PAD_X = 8;
	const PAD_Y = 16;
	const min = Math.min(...vals.map((d) => d.v));
	const max = Math.max(...vals.map((d) => d.v));
	const span = max - min || max * 0.1 || 1;
	const lo = min - span * 0.25;
	const hi = max + span * 0.25;
	const t0 = vals[0].at;
	const t1 = vals[vals.length - 1].at;

	const xy = vals.map((d) => {
		const x = scaleX(d.at, t0, t1, W, PAD_X);
		const y = PAD_Y + (1 - (d.v - lo) / (hi - lo)) * (height - PAD_Y * 2);
		return { ...d, x, y };
	});

	// One reading: a labelled dot and a sentence. Never a line.
	if (xy.length === 1) {
		return (
			<div className="border border-stroke-subtle bg-bg-panel/30 px-6 py-10 text-center">
				<p className="font-mono text-3xl font-black text-fg-primary">
					{format(xy[0].v)}
				</p>
				<p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-fg-muted">
					one reading, taken {fmtDay(xy[0].at)}
				</p>
				<p className="mx-auto mt-4 max-w-sm text-sm text-fg-muted">
					A second sync draws the first line here.
				</p>
			</div>
		);
	}

	const line = xy
		.map((d, i) => `${i === 0 ? "M" : "L"}${d.x},${d.y}`)
		.join(" ");
	const area = `${line} L${xy[xy.length - 1].x},${height} L${xy[0].x},${height} Z`;
	const dense = xy.length > 24;

	return (
		<figure className="m-0">
			{/* Aspect preserved: `preserveAspectRatio="none"` would squash the
			    reading dots into ellipses at wide viewports. */}
			<svg
				viewBox={`0 0 ${W} ${height}`}
				className="h-auto w-full"
				role="img"
				aria-label={`${label} across ${xy.length} readings`}
			>
				<title>{`${label} across ${xy.length} readings`}</title>
				<defs>
					<linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={color} stopOpacity="0.28" />
						<stop offset="100%" stopColor={color} stopOpacity="0" />
					</linearGradient>
				</defs>
				<path d={area} fill={`url(#${gradId})`} />
				<path
					d={line}
					fill="none"
					stroke={color}
					strokeWidth={2}
					vectorEffect="non-scaling-stroke"
				/>
				{!dense &&
					xy.map((d) => (
						<circle
							key={d.at}
							cx={d.x}
							cy={d.y}
							r={3}
							fill="var(--bg-canvas)"
							stroke={color}
							strokeWidth={2}
							vectorEffect="non-scaling-stroke"
						/>
					))}
			</svg>
			<figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
				<span>
					{fmtDay(t0)} → {fmtDay(t1)}
				</span>
				<span>
					every reading between {format(min)} and {format(max)}
				</span>
			</figcaption>
		</figure>
	);
}

/**
 * The 100% stacked mix ribbon - which models the tokens went to, over time.
 *
 * This is the one series on the page that visibly moves at five days of
 * history: in the real data Opus 4.8 fell from 18% to 13% while Opus 5 rose
 * from 35% to 40%. Shares always sum to 1, so the ribbon needs no y-axis.
 */
export function MixRibbon({
	points,
	height = 150,
	topN = 5,
	legend = true,
}: {
	points: ProtoPoint[];
	height?: number;
	topN?: number;
	legend?: boolean;
}) {
	if (points.length === 0) return null;

	// Rank by share in the newest reading, so the legend order matches the eye.
	const newest = points[points.length - 1];
	const ranked = newest.mix.map((m) => m.id);
	for (const p of points)
		for (const m of p.mix) if (!ranked.includes(m.id)) ranked.push(m.id);
	const keep = ranked.slice(0, topN);
	const hasRest = ranked.length > topN;
	const series = hasRest ? [...keep, "__rest"] : keep;

	const labelOf = (id: string) =>
		id === "__rest"
			? "everything else"
			: (points.flatMap((p) => p.mix).find((m) => m.id === id)?.label ?? id);

	const shareAt = (p: ProtoPoint, id: string) => {
		if (id === "__rest") {
			return p.mix
				.filter((m) => !keep.includes(m.id))
				.reduce((a, m) => a + m.share, 0);
		}
		return p.mix.find((m) => m.id === id)?.share ?? 0;
	};

	const W = 900;
	const t0 = points[0].at;
	const t1 = points[points.length - 1].at;
	const xs = points.map((p) => scaleX(p.at, t0, t1, W, 0));

	// Two readings still work here: a ribbon between two edges reads fine.
	const bands: { id: string; d: string; color: string }[] = [];
	const tops = points.map(() => 0);
	series.forEach((id, si) => {
		const lower = points.map((p, i) => {
			const s = shareAt(p, id);
			const y0 = tops[i];
			tops[i] = y0 + s;
			return { x: xs[i], y0, y1: tops[i] };
		});
		const up = lower
			.map((d, i) => `${i === 0 ? "M" : "L"}${d.x},${(1 - d.y0) * height}`)
			.join(" ");
		const down = [...lower]
			.reverse()
			.map((d) => `L${d.x},${(1 - d.y1) * height}`)
			.join(" ");
		bands.push({
			id,
			d: `${up} ${down} Z`,
			color:
				si === 0
					? ACCENT
					: PROTO_SERIES_COLORS[(si - 1) % PROTO_SERIES_COLORS.length],
		});
	});

	return (
		<figure className="m-0">
			<svg
				viewBox={`0 0 ${W} ${height}`}
				className="w-full"
				preserveAspectRatio="none"
				role="img"
				aria-label="share of tokens by model, over time"
			>
				<title>share of tokens by model, over time</title>
				{bands.map((b) => (
					<path key={b.id} d={b.d} fill={b.color} fillOpacity={0.85} />
				))}
			</svg>
			<ul
				className={cn(
					"mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0",
					!legend && "hidden",
				)}
			>
				{bands.map((b) => {
					const nowShare = shareAt(newest, b.id);
					const thenShare = shareAt(points[0], b.id);
					const delta = Math.round((nowShare - thenShare) * 100);
					return (
						<li
							key={b.id}
							className="flex items-center gap-2 font-mono text-[11px] text-fg-muted"
						>
							<span
								aria-hidden="true"
								className="size-2.5 shrink-0"
								style={{ background: b.color }}
							/>
							<span className="text-fg-primary">{labelOf(b.id)}</span>
							<span>{Math.round(nowShare * 100)}%</span>
							{points.length > 1 && delta !== 0 && (
								<span
									className={delta > 0 ? "text-accent-lime" : "text-orange-400"}
								>
									{delta > 0 ? "↑" : "↓"}
									{Math.abs(delta)}pt
								</span>
							)}
						</li>
					);
				})}
			</ul>
		</figure>
	);
}

// ---------------------------------------------------------------------------
// The compact mix family (D / E / F).
//
// The full-height ribbon was judged "semi-interesting, and too much space,
// especially when little moved". Everything below expresses the same fact in a
// fraction of the height, and F suppresses it entirely when nothing moved.
// ---------------------------------------------------------------------------

export type MixSeries = {
	ids: string[];
	/** The reading the row's headline percentage speaks for. */
	newest: ProtoPoint;
	labelOf: (id: string) => string;
	colorOf: (id: string) => string;
	shareAt: (p: ProtoPoint, id: string) => number;
	/** Share change from the first reading to the newest, in points. */
	driftOf: (id: string) => number;
	/** The largest single drift across all series, in points. */
	maxDrift: number;
};

/** One ranking, one color map, shared by every compact mix view. */
export function mixSeries(points: ProtoPoint[], topN = 5): MixSeries {
	const newest = points[points.length - 1];
	const ranked = newest.mix.map((m) => m.id);
	for (const p of points) {
		for (const m of p.mix) if (!ranked.includes(m.id)) ranked.push(m.id);
	}
	const keep = ranked.slice(0, topN);
	const ids = ranked.length > topN ? [...keep, "__rest"] : keep;

	const shareAt = (p: ProtoPoint, id: string) =>
		id === "__rest"
			? p.mix
					.filter((m) => !keep.includes(m.id))
					.reduce((a, m) => a + m.share, 0)
			: (p.mix.find((m) => m.id === id)?.share ?? 0);

	const driftOf = (id: string) =>
		(shareAt(newest, id) - shareAt(points[0], id)) * 100;

	return {
		ids,
		newest,
		labelOf: (id) =>
			id === "__rest"
				? "everything else"
				: (points.flatMap((p) => p.mix).find((m) => m.id === id)?.label ?? id),
		colorOf: (id) => {
			const i = ids.indexOf(id);
			return i === 0
				? ACCENT
				: PROTO_SERIES_COLORS[(i - 1) % PROTO_SERIES_COLORS.length];
		},
		shareAt,
		driftOf,
		maxDrift: Math.max(0, ...ids.map((id) => Math.abs(driftOf(id)))),
	};
}

/** One 100%-stacked horizontal bar - the whole mix of one reading, in one row. */
export function MixBar({
	point,
	series,
	height = 10,
	className,
}: {
	point: ProtoPoint;
	series: MixSeries;
	height?: number;
	className?: string;
}) {
	return (
		<div
			className={cn("flex w-full overflow-hidden", className)}
			style={{ height }}
		>
			{series.ids.map((id) => {
				const share = series.shareAt(point, id);
				if (share <= 0) return null;
				return (
					<span
						key={id}
						title={`${series.labelOf(id)} ${Math.round(share * 100)}%`}
						style={{ width: `${share * 100}%`, background: series.colorOf(id) }}
					/>
				);
			})}
		</div>
	);
}

/** A delta chip. Neutral by default - a falling rolling window is not a fault. */
export function DeltaChip({
	children,
	tone = "neutral",
	className,
}: {
	children: React.ReactNode;
	tone?: "neutral" | "up" | "down";
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
				tone === "neutral" && "border-stroke-subtle text-fg-muted",
				tone === "up" && "border-accent-lime/40 text-accent-lime",
				tone === "down" && "border-orange-400/40 text-orange-400",
				className,
			)}
		>
			{children}
		</span>
	);
}
