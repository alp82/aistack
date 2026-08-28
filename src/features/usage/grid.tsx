import type { ReactNode } from "react";
import { MONO_LABEL } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import type { RangeId } from "./copy";
import { Delta } from "./Delta";
import type { Item } from "./items";

/**
 * The tab grids (spec, "The section"): every tab packs a grid with no empty
 * cell. Time, Models and Harness use a 2x2 feature with two items beside it
 * and the rest in three columns (U); Code uses bands (V); Skills uses charts
 * on the left with a count rail on the right (X).
 */

/**
 * A card prints name, figure, caption and the previous-period chip on one
 * line, with the body inline. Lines changed prints no head figure: its green
 * and red pair in the body is the figure.
 */
export function ChartCard({
	it,
	range,
	big = true,
	className,
}: {
	it: Item;
	range: RangeId;
	big?: boolean;
	className?: string;
}) {
	return (
		<div
			data-testid="usage-cell"
			className={cn("flex flex-col bg-bg-canvas p-6", className)}
		>
			{it.id === "component:git-ledger" ? (
				<p className="flex flex-wrap items-baseline gap-x-3">
					<span className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</span>
					<Delta comparison={it.comparison} range={range} />
				</p>
			) : (
				<>
					<p className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</p>
					<p className="mt-2 flex flex-wrap items-baseline gap-x-3">
						<span
							className={cn(
								"font-mono font-black leading-none text-accent-lime",
								big ? "text-4xl" : "text-2xl",
							)}
						>
							{it.figure}
						</span>
						<span className="text-sm text-fg-secondary">{it.caption}</span>
						<Delta comparison={it.comparison} range={range} />
					</p>
				</>
			)}
			<div className="mt-5 flex min-h-0 flex-1 flex-col [&>*]:flex-1">
				{big && it.body ? it.body() : it.picture(true)}
			</div>
		</div>
	);
}

export function StatCell({
	it,
	range,
	className,
}: {
	it: Item;
	range: RangeId;
	className?: string;
}) {
	return (
		<div
			data-testid="usage-cell"
			className={cn(
				"@container flex flex-col items-center justify-center bg-bg-canvas px-5 py-6 text-center",
				className,
			)}
		>
			<p className="font-mono text-4xl font-black leading-none text-fg-primary @[16rem]:text-5xl @[24rem]:text-6xl">
				{it.figure}
			</p>
			<p className={cn(MONO_LABEL, "mt-3 text-fg-muted")}>{it.name}</p>
			<p className="mt-1 text-[12px] text-fg-secondary">{it.caption}</p>
			{it.comparison && (
				<p className="mt-2">
					<Delta comparison={it.comparison} range={range} />
				</p>
			)}
		</div>
	);
}

const GRID = "grid gap-px border border-stroke-subtle bg-stroke-subtle";
const SPAN: Record<number, string> = {
	1: "md:col-span-1",
	2: "md:col-span-2",
	3: "md:col-span-3",
	4: "md:col-span-4",
};
const COLS: Record<number, string> = {
	3: "md:grid-cols-3",
	4: "md:grid-cols-4",
};

/**
 * Greedy row packer. Items keep their requested span unless the row cannot
 * hold it, in which case the span shrinks to what is left (closing the row).
 * The last item of the whole grid stretches to close its row.
 */
export function pack<T>(
	items: readonly T[],
	cols: number,
	want: (it: T) => number,
): { it: T; span: number }[] {
	const out: { it: T; span: number }[] = [];
	let fill = 0;
	for (const it of items) {
		let span = Math.min(cols, want(it));
		const left = cols - fill;
		if (left === 0) fill = 0;
		else if (span > left) span = left;
		out.push({ it, span });
		fill = (fill + span) % cols;
	}
	const last = out[out.length - 1];
	if (last && fill !== 0) last.span += cols - fill;
	return out;
}

function Cell({ it, span, range }: { it: Item; span: number; range: RangeId }) {
	return it.body ? (
		<ChartCard it={it} range={range} className={SPAN[span]} />
	) : it.picture(true) ? (
		<ChartCard it={it} range={range} big={span >= 3} className={SPAN[span]} />
	) : (
		<StatCell it={it} range={range} className={SPAN[span]} />
	);
}

/** U: a 2x2 feature, two items beside it, the rest in three columns. */
export function packU(items: Item[], range: RangeId): ReactNode {
	const charts = items.filter((it) => it.body);
	const rest = items.filter((it) => !it.body);
	const [feature, ...others] = charts;
	if (!feature) {
		const cells = pack(items, 3, () => 1);
		return (
			<div className={cn(GRID, COLS[3])}>
				{cells.map(({ it, span }) => (
					<Cell key={it.id} it={it} span={span} range={range} />
				))}
			</div>
		);
	}
	const side = [...others, ...rest].slice(0, 2);
	const tail = [...others, ...rest].slice(2);
	const cells = pack(tail, 3, (it) => (it.body ? 2 : 1));
	return (
		<div className={cn(GRID, COLS[3])}>
			<ChartCard
				it={feature}
				range={range}
				className={
					side.length === 0 ? "md:col-span-3" : "md:col-span-2 md:row-span-2"
				}
			/>
			{side.map((it) =>
				side.length === 1 ? (
					<ChartCard
						key={it.id}
						it={it}
						range={range}
						big={false}
						className="md:col-span-1 md:row-span-2"
					/>
				) : (
					<Cell key={it.id} it={it} span={1} range={range} />
				),
			)}
			{cells.map(({ it, span }) => (
				<Cell key={it.id} it={it} span={span} range={range} />
			))}
		</div>
	);
}

/** V: bands, each one chart with two small items; leftovers in four columns. */
export function packV(items: Item[], range: RangeId): ReactNode {
	const charts = items.filter((it) => it.body);
	const pool = items.filter((it) => !it.body);
	const bands: ReactNode[] = [];
	charts.forEach((chart, i) => {
		const pair = pool.splice(0, 2);
		bands.push(
			<div key={chart.id} className={cn(GRID, COLS[3])}>
				<ChartCard
					it={chart}
					range={range}
					className={
						pair.length === 0 ? "md:col-span-3" : "md:col-span-2 md:row-span-2"
					}
				/>
				{pair.map((it) => (
					<StatCell
						key={it.id}
						it={it}
						range={range}
						className={cn(
							"md:col-span-1",
							pair.length === 1 && "md:row-span-2",
						)}
					/>
				))}
			</div>,
		);
		if (i < charts.length - 1)
			bands.push(<div key={`${chart.id}-gap`} className="h-6" />);
	});
	if (pool.length > 0) {
		const cells = pack(pool, 4, () => 1);
		if (bands.length > 0) bands.push(<div key="gap-tail" className="h-6" />);
		bands.push(
			<div key="tail" className={cn(GRID, COLS[4])}>
				{cells.map(({ it, span }) => (
					<StatCell key={it.id} it={it} range={range} className={SPAN[span]} />
				))}
			</div>,
		);
	}
	return <div>{bands}</div>;
}

/** X: charts on the left by shape, the counts stacked in a rail on the right. */
export function packX(items: Item[], range: RangeId): ReactNode {
	const charts = items.filter((it) => it.body);
	const stats = items.filter((it) => !it.body);
	if (charts.length === 0) {
		const cells = pack(stats, 4, () => 1);
		return (
			<div className={cn(GRID, COLS[4])}>
				{cells.map(({ it, span }) => (
					<StatCell key={it.id} it={it} range={range} className={SPAN[span]} />
				))}
			</div>
		);
	}
	const cells = pack(charts, 3, (it) =>
		it.shape === "timeline" ? 3 : it.shape === "share" ? 2 : 1,
	);
	if (stats.length === 0) {
		return (
			<div className={cn(GRID, COLS[3])}>
				{cells.map(({ it, span }) => (
					<Cell key={it.id} it={it} span={span} range={range} />
				))}
			</div>
		);
	}
	return (
		<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-[3fr_1fr]">
			<div className={cn("grid gap-px bg-stroke-subtle", COLS[3])}>
				{cells.map(({ it, span }) => (
					<Cell key={it.id} it={it} span={span} range={range} />
				))}
			</div>
			<div className="flex flex-col gap-px bg-stroke-subtle">
				{stats.map((it) => (
					<StatCell key={it.id} it={it} range={range} className="flex-1" />
				))}
			</div>
		</div>
	);
}

const PACKER: Record<string, (items: Item[], range: RangeId) => ReactNode> = {
	time: packU,
	code: packV,
	models: packU,
	harness: packU,
	skills: packX,
};

export function packTab(tab: string, items: Item[], range: RangeId): ReactNode {
	return (PACKER[tab] ?? packU)(items, range);
}
