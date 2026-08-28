import type { ReactNode } from "react";
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { ACCENT, ACCENT_DIM, ACCENT_REST, fmtCount, fmtPercent } from "./copy";

/**
 * The pictures every row head and body draws from (#284, "a picture on every
 * head and podium box").
 *
 * PLAIN DOM, NOT `@tanstack/charts`. `src/features/charts` stays the one place
 * that imports the library, and a strip of `<i>` elements needs neither a
 * scale nor an axis. The one SVG in the section, the Git body's positional log
 * axis, is hand-drawn in `components.tsx` for the same reason.
 *
 * TWO SIZES. A head picture is 76x12 and sits beside the figure; a body or a
 * podium picture is `wide` and takes the row's full width. The same component
 * draws both, so the head and the body can never disagree about the shape.
 *
 * SQUARE ENDS EVERYWHERE, and no border-radius (AGENTS.md).
 */

export type Segment = {
	key: string;
	value: number;
	paint: string;
	label: string;
};

export const HEAD_SIZE = "h-3 w-[76px]";

/** One horizontal bar split into segments, sized by share of the total. */
/**
 * The one tooltip every chart uses: the same card the model rows in section
 * 01 open, sized for a line or two. `label` is the whole content.
 */
export function Tip({
	label,
	children,
	className,
}: {
	label: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<HoverCard
			mode="wrapper"
			position="above"
			width={220}
			height="auto"
			maxRotation={3}
			maxOffset={4}
			offset={8}
			className={cn("flex", className)}
			triggerClassName="flex h-full w-full min-w-0 flex-1 items-end"
			renderContent={() => (
				<div className="px-3 py-2 font-mono text-[11px] leading-snug text-fg-primary">
					{label}
				</div>
			)}
		>
			{children}
		</HoverCard>
	);
}

export function Strip({
	segments,
	wide = false,
	className,
	label,
}: {
	segments: readonly Segment[];
	wide?: boolean;
	className?: string;
	label?: string;
}) {
	const total = segments.reduce((sum, segment) => sum + segment.value, 0);
	return (
		<span
			role="img"
			aria-label={label}
			className={cn(
				"flex shrink-0 gap-px bg-bg-panel",
				wide ? "h-3.5 w-full" : HEAD_SIZE,
				className,
			)}
		>
			{total > 0 &&
				segments
					.filter((segment) => segment.value > 0)
					.map((segment) => (
						<i
							key={segment.key}
							title={`${segment.label} ${fmtPercent(segment.value / total)}`}
							className="block h-full"
							style={{
								flexGrow: Math.max(segment.value, total * 0.004),
								flexBasis: 0,
								background: segment.paint,
							}}
						/>
					))}
		</span>
	);
}

/** A single share of the accent against the rest. */
export function FillStrip({
	share,
	wide = false,
	label,
}: {
	share: number;
	wide?: boolean;
	label?: string;
}) {
	const held = Math.min(Math.max(share, 0), 1);
	return (
		<Strip
			wide={wide}
			label={label}
			segments={[
				{ key: "share", value: held, paint: ACCENT, label: "share" },
				{ key: "rest", value: 1 - held, paint: ACCENT_REST, label: "rest" },
			]}
		/>
	);
}

/**
 * The top shares in four shades of the accent, and the rest in the dim paint,
 * for a ranked list whose head has room for one strip and no legend.
 */
export function shadeSegments(
	entries: readonly { key: string; value: number; label: string }[],
	total: number,
): Segment[] {
	const opacities = [1, 0.7, 0.5, 0.35];
	const top = entries.slice(0, 4);
	const shown = top.reduce((sum, entry) => sum + entry.value, 0);
	return [
		...top.map((entry, index) => ({
			key: entry.key,
			value: entry.value,
			paint:
				index === 0
					? ACCENT
					: `color-mix(in oklab, var(--accent-lime) ${Math.round((opacities[index] ?? 0.35) * 100)}%, var(--bg-panel))`,
			label: entry.label,
		})),
		{
			key: "rest",
			value: Math.max(total - shown, 0),
			paint: ACCENT_DIM,
			label: "other",
		},
	];
}

/** Five steps, so a busy cell and a quiet one never read as the same tint. */
export function heatPaint(value: number, busiest: number): string {
	if (value <= 0) return "var(--bg-panel)";
	const share = busiest > 0 ? value / busiest : 0;
	const mix = share < 0.12 ? 18 : share < 0.3 ? 38 : share < 0.6 ? 62 : 90;
	return `color-mix(in oklab, var(--accent-lime) ${mix}%, var(--bg-panel))`;
}

/** 24 cells, one per hour, tinted by share of the busiest hour. */
export function HourCells({
	cells,
	wide = false,
	label,
}: {
	cells: readonly number[];
	wide?: boolean;
	label?: string;
}) {
	const busiest = Math.max(...cells, 0);
	return (
		<span
			role="img"
			aria-label={label}
			className={cn("flex shrink-0 gap-px", wide ? "h-3.5 w-full" : HEAD_SIZE)}
		>
			{cells.map((value, hour) => (
				<i
					// biome-ignore lint/suspicious/noArrayIndexKey: one cell per hour, in hour order
					key={hour}
					className="block h-full flex-1"
					style={{ background: heatPaint(value, busiest) }}
				/>
			))}
		</span>
	);
}

/** A head-sized histogram: bars scaled to the tallest, one lit. */
export function MiniBars({
	values,
	lit,
	label,
}: {
	values: readonly number[];
	lit?: number;
	label?: string;
}) {
	const tallest = Math.max(...values, 0) || 1;
	return (
		<span
			role="img"
			aria-label={label}
			className={cn("flex shrink-0 items-end gap-px", HEAD_SIZE)}
		>
			{values.map((value, index) => (
				<i
					// biome-ignore lint/suspicious/noArrayIndexKey: positional, one bar per bucket or hour
					key={index}
					className="block min-h-px flex-1"
					style={{
						height: `${Math.round((value / tallest) * 100)}%`,
						background: ACCENT,
						opacity: lit === undefined || index === lit ? 1 : 0.55,
					}}
				/>
			))}
		</span>
	);
}

/**
 * A body-sized histogram with an axis: one bar per bucket, the lit bar in the
 * full accent, and an optional labeled median.
 */
export function Histogram({
	values,
	labels,
	lit,
	median,
	labelEvery = 1,
	unit,
}: {
	values: readonly number[];
	labels: readonly string[];
	lit?: number;
	/** The bar to mark "median". */
	median?: number;
	/** Print every Nth axis label, so 24 hours read as four marks. */
	labelEvery?: number;
	unit: string;
}) {
	const tallest = Math.max(...values, 0) || 1;
	return (
		<div className="flex h-full flex-col">
			<div className="flex h-24 min-h-24 flex-1 items-end gap-0.5 pt-4">
				{values.map((value, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: positional, one bar per bucket or hour
						key={index}
						className="relative flex h-full flex-1 items-end"
					>
						{median === index && (
							<span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-fg-primary">
								median
							</span>
						)}
						<Tip
							className="flex h-full w-full items-end"
							label={
								<>
									{labels[index] ?? ""} ·{" "}
									<b className="text-accent-lime">{fmtCount(value)}</b> {unit}
								</>
							}
						>
							<i
								className="block w-full"
								style={{
									height: `${Math.max(Math.round((value / tallest) * 100), 1)}%`,
									background:
										lit === undefined || index === lit
											? ACCENT
											: "color-mix(in oklab, var(--accent-lime) 55%, var(--bg-panel))",
								}}
							/>
						</Tip>
					</div>
				))}
			</div>
			<div className="mt-1 flex gap-0.5 font-mono text-[9px] text-fg-muted">
				{labels.map((text, index) => (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: positional, one label per bar
						key={index}
						className="flex-1 truncate text-center"
					>
						{index % labelEvery === 0 ? text : ""}
					</span>
				))}
			</div>
		</div>
	);
}

/** Ten squares, `lit` of them in the accent: a count a reader can see at once. */
export function DotRow({
	lit,
	total = 10,
	big = false,
	label,
}: {
	lit: number;
	total?: number;
	big?: boolean;
	label?: string;
}) {
	const on = Math.min(Math.max(Math.round(lit), 0), total);
	return (
		<span
			role="img"
			aria-label={label}
			className={cn("flex shrink-0", big ? "gap-0.5" : cn("gap-px", HEAD_SIZE))}
		>
			{Array.from({ length: total }, (_, index) => (
				<i
					// biome-ignore lint/suspicious/noArrayIndexKey: positional, one square per unit
					key={index}
					className={cn(
						"block",
						big ? "size-[18px]" : "h-full flex-1",
						index < on ? "bg-accent-lime" : "bg-bg-panel-elevated",
					)}
				/>
			))}
		</span>
	);
}

/** A ranked list row: rank, name, proportional bar, figure. */
export function BarRow({
	rank,
	name,
	share,
	figure,
	paint = ACCENT,
}: {
	rank?: number;
	name: ReactNode;
	/** 0..1 of the widest row, for the bar's width. */
	share: number;
	figure: ReactNode;
	paint?: string;
}) {
	return (
		<div className="grid grid-cols-[22px_minmax(0,150px)_1fr_56px] items-center gap-2.5 py-1 text-[13px]">
			<span className="font-mono text-[10px] text-fg-muted">
				{rank === undefined ? "" : String(rank).padStart(2, "0")}
			</span>
			<span className="truncate text-fg-primary">{name}</span>
			<Tip
				className="block"
				label={
					<>
						{name} · <b className="text-accent-lime">{figure}</b>
					</>
				}
			>
				<span className="block h-2.5 w-full cursor-help bg-bg-panel">
					<span
						className="block h-full min-w-0.5"
						style={{ width: `${Math.max(1, share * 100)}%`, background: paint }}
					/>
				</span>
			</Tip>
			<span className="text-right font-mono text-xs text-fg-secondary">
				{figure}
			</span>
		</div>
	);
}

/** The legend a strip of two or more paints carries in a body. */
export function Legend({
	entries,
}: {
	entries: readonly { key: string; paint: string; label: ReactNode }[];
}) {
	return (
		<ul className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1">
			{entries.map((entry) => (
				<li
					key={entry.key}
					className="flex items-center gap-1.5 font-mono text-[11px] text-fg-muted"
				>
					<span
						aria-hidden="true"
						className="size-[9px] shrink-0"
						style={{ background: entry.paint }}
					/>
					{entry.label}
				</li>
			))}
		</ul>
	);
}

/** A body's two-column layout, one column on a narrow screen. */
export function Cols({ children }: { children: ReactNode }) {
	return <div className="grid gap-7 md:grid-cols-2">{children}</div>;
}

/** The small mono line under a picture: a count, a scope, nothing more. */
export function Sub({ children }: { children: ReactNode }) {
	return (
		<p className="mt-2.5 font-mono text-[11px] text-fg-muted">{children}</p>
	);
}

export function ColLabel({ children }: { children: ReactNode }) {
	return (
		<p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
			{children}
		</p>
	);
}
