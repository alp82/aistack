// PROTOTYPE. THROWAWAY. Ticket #303, round five.
//
// After round four: S's layout (stats compact, charts as cards) but with the
// bigger visualizations inline, and NO EMPTY CELLS. Every variant packs a
// fixed-column grid with colspans (and rowspans where the neighbors fill),
// and a last pass stretches whatever is left so each row closes.
//
//   T  Bento 6: spans by shape (timeline 4, share 3, number 2), dense flow,
//      the row closer stretches the last item.
//   U  Feature 2x2: the first chart takes 2x2, two items stack beside it, the
//      rest flow in a 3-column grid, stats last as a strip.
//   V  Bands: each band is one chart (2 of 3 columns, body inline) plus a
//      column of two small items; a leftover item goes full width.
//   W  Weighted 12: every item has a weight (3 to 8 of 12); greedy packer
//      fills rows to 12 exactly, widening the last item of a row.
//   X  Side rail: stats stack in a 1-column rail spanning every row on the
//      right; charts pack the 3 columns on the left with spans by shape.

import type { ReactNode } from "react";
import { MONO_LABEL } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import { type Item, Shell, TOPIC, type VariantProps } from "./RoundThree";
import { Delta } from "./UsageMergePrototype";

// ---------------------------------------------------------------------------
// Cards, two densities.
// ---------------------------------------------------------------------------

export function ChartCard({
	it,
	window,
	big = true,
	className,
}: {
	it: Item;
	window: VariantProps["p"]["window"];
	big?: boolean;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col bg-bg-canvas p-6", className)}>
			{/* Lines changed prints its own green/red pair in the body, so the
			    head figure would be the same number twice. */}
			{it.id === "component:git-ledger" ? (
				<p className="flex flex-wrap items-baseline gap-x-3">
					<span className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</span>
					{it.delta !== null && <Delta value={it.delta} window={window} />}
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
						{it.delta !== null && <Delta value={it.delta} window={window} />}
					</p>
				</>
			)}
			<div className="mt-5 flex min-h-0 flex-1 flex-col [&>*]:flex-1">
				{big && it.body ? it.body() : it.picture(true)}
			</div>
		</div>
	);
}

function StatCell({ it, className }: { it: Item; className?: string }) {
	return (
		<div
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
		</div>
	);
}

const GRID = "grid gap-px border border-stroke-subtle bg-stroke-subtle";
const SPAN: Record<number, string> = {
	1: "md:col-span-1",
	2: "md:col-span-2",
	3: "md:col-span-3",
	4: "md:col-span-4",
	5: "md:col-span-5",
	6: "md:col-span-6",
	7: "md:col-span-7",
	8: "md:col-span-8",
	9: "md:col-span-9",
	10: "md:col-span-10",
	11: "md:col-span-11",
	12: "md:col-span-12",
};
const COLS: Record<number, string> = {
	3: "md:grid-cols-3",
	4: "md:grid-cols-4",
	6: "md:grid-cols-6",
	12: "md:grid-cols-12",
};

/**
 * Greedy row packer. Items keep their requested span unless the row cannot
 * hold it, in which case the span shrinks to what is left (closing the row) or
 * the item starts a new row when nothing is left. The last item of the whole
 * grid stretches to close its row.
 */
function pack<T>(
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
	if (out.length > 0 && fill !== 0) out[out.length - 1].span += cols - fill;
	return out;
}

function Cell({
	it,
	span,
	window,
}: {
	it: Item;
	span: number;
	window: VariantProps["p"]["window"];
}) {
	return it.body ? (
		<ChartCard it={it} window={window} className={SPAN[span]} />
	) : it.picture(true) ? (
		<ChartCard it={it} window={window} big={span >= 3} className={SPAN[span]} />
	) : (
		<StatCell it={it} className={SPAN[span]} />
	);
}

// T ------------------------------------------------------------------------

export const VariantT = {
	name: "Bento 6, spans by shape",
	Component: function T(props: VariantProps) {
		const w = props.p.window;
		return (
			<Shell {...props} groups={TOPIC}>
				{(items) => {
					// Charts first, biggest first, stats close the grid.
					const ordered = [
						...items.filter((it) => it.body),
						...items.filter((it) => !it.body),
					];
					const cells = pack(ordered, 6, (it) =>
						it.body ? (it.shape === "timeline" ? 4 : 3) : 2,
					);
					return (
						<div className={cn(GRID, COLS[6])}>
							{cells.map(({ it, span }) => (
								<Cell key={it.id} it={it} span={span} window={w} />
							))}
						</div>
					);
				}}
			</Shell>
		);
	},
};

// U ------------------------------------------------------------------------

export function packU(w: VariantProps["p"]["window"]) {
	return (items: Item[]) => {
		const charts = items.filter((it) => it.body);
		const rest = items.filter((it) => !it.body);
		const [feature, ...others] = charts;
		if (!feature) {
			const cells = pack(items, 3, () => 1);
			return (
				<div className={cn(GRID, COLS[3])}>
					{cells.map(({ it, span }) => (
						<Cell key={it.id} it={it} span={span} window={w} />
					))}
				</div>
			);
		}
		// Two side items beside the feature: prefer charts, fall back to stats.
		const side = [...others, ...rest].slice(0, 2);
		const tail = [...others, ...rest].slice(2);
		const cells = pack(tail, 3, (it) => (it.body ? 2 : 1));
		return (
			<div className={cn(GRID, COLS[3])}>
				<ChartCard
					it={feature}
					window={w}
					className={
						side.length === 0 ? "md:col-span-3" : "md:col-span-2 md:row-span-2"
					}
				/>
				{side.map((it) =>
					side.length === 1 ? (
						<ChartCard
							key={it.id}
							it={it}
							window={w}
							big={false}
							className="md:col-span-1 md:row-span-2"
						/>
					) : (
						<Cell key={it.id} it={it} span={1} window={w} />
					),
				)}
				{cells.map(({ it, span }) => (
					<Cell key={it.id} it={it} span={span} window={w} />
				))}
			</div>
		);
	};
}

export const VariantU = {
	name: "Feature 2x2 + stack",
	Component: function U(props: VariantProps) {
		return (
			<Shell {...props} groups={TOPIC}>
				{packU(props.p.window)}
			</Shell>
		);
	},
};

// V ------------------------------------------------------------------------

export function packV(w: VariantProps["p"]["window"]) {
	return (items: Item[]) => {
		const charts = items.filter((it) => it.body);
		const small = items.filter((it) => !it.body);
		const bands: ReactNode[] = [];
		const pool = [...small];
		charts.forEach((chart, i) => {
			const pair = pool.splice(0, 2);
			bands.push(
				<div key={chart.id} className={cn(GRID, COLS[3])}>
					<ChartCard
						it={chart}
						window={w}
						className={
							pair.length === 0
								? "md:col-span-3"
								: "md:col-span-2 md:row-span-2"
						}
					/>
					{pair.map((it) => (
						<StatCell
							key={it.id}
							it={it}
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
			bands.push(<div key="gap-tail" className="h-6" />);
			bands.push(
				<div key="tail" className={cn(GRID, COLS[4])}>
					{cells.map(({ it, span }) => (
						<StatCell key={it.id} it={it} className={SPAN[span]} />
					))}
				</div>,
			);
		}
		return <div>{bands}</div>;
	};
}

export const VariantV = {
	name: "Bands: one chart + two small",
	Component: function V(props: VariantProps) {
		return (
			<Shell {...props} groups={TOPIC}>
				{packV(props.p.window)}
			</Shell>
		);
	},
};

// W ------------------------------------------------------------------------

const WEIGHT: Record<string, number> = {
	"component:activity-heatmap": 8,
	"component:start-hours": 4,
	"component:git-ledger": 6,
	"component:coding-languages": 6,
	"component:kit": 6,
	"component:model-routing": 8,
	"component:delegation": 4,
	"metric:effort-levels": 4,
	"metric:thinking-share": 4,
	"metric:turn-duration": 6,
	"component:phase-playbook": 8,
	harness: 6,
};

export const VariantW = {
	name: "Weighted 12, rows close exactly",
	Component: function W(props: VariantProps) {
		const w = props.p.window;
		return (
			<Shell {...props} groups={TOPIC}>
				{(items) => {
					// Order by weight, heaviest first, so the small ones fill the gaps.
					const ordered = [...items].sort(
						(a, b) => (WEIGHT[b.id] ?? 3) - (WEIGHT[a.id] ?? 3),
					);
					const cells = pack(ordered, 12, (it) => WEIGHT[it.id] ?? 3);
					return (
						<div className={cn(GRID, COLS[12])}>
							{cells.map(({ it, span }) => (
								<Cell key={it.id} it={it} span={span} window={w} />
							))}
						</div>
					);
				}}
			</Shell>
		);
	},
};

// X ------------------------------------------------------------------------

export function packX(w: VariantProps["p"]["window"]) {
	return (items: Item[]) => {
		const charts = items.filter((it) => it.body);
		const stats = items.filter((it) => !it.body);
		if (charts.length === 0) {
			const cells = pack(stats, 4, () => 1);
			return (
				<div className={cn(GRID, COLS[4])}>
					{cells.map(({ it, span }) => (
						<StatCell key={it.id} it={it} className={SPAN[span]} />
					))}
				</div>
			);
		}
		const cells = pack(charts, 3, (it) =>
			it.shape === "timeline" ? 3 : it.shape === "share" ? 2 : 1,
		);
		return (
			<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-[3fr_1fr]">
				<div className={cn("grid gap-px bg-stroke-subtle", COLS[3])}>
					{cells.map(({ it, span }) => (
						<Cell key={it.id} it={it} span={span} window={w} />
					))}
				</div>
				<div className="flex flex-col gap-px bg-stroke-subtle">
					{stats.length === 0 ? (
						<div className="flex-1 bg-bg-canvas p-5 text-sm text-fg-muted">
							No counts in this group.
						</div>
					) : (
						stats.map((it) => (
							<StatCell key={it.id} it={it} className="flex-1" />
						))
					)}
				</div>
			</div>
		);
	};
}

export const VariantX = {
	name: "Charts left, stat rail right",
	Component: function X(props: VariantProps) {
		return (
			<Shell {...props} groups={TOPIC}>
				{packX(props.p.window)}
			</Shell>
		);
	},
};

// Y ------------------------------------------------------------------------
// The owner's pick per tab (round five): Time U, Code V, Models U, Kit X,
// Sessions U.

export const PER_TAB: Record<string, "U" | "V" | "X"> = {
	time: "U",
	code: "V",
	models: "U",
	harness: "U",
	skills: "X",
};

export const VariantY = {
	name: "Composite: U / V / U / X / U per tab",
	Component: function Y(props: VariantProps) {
		const w = props.p.window;
		const packers = { U: packU(w), V: packV(w), X: packX(w) };
		return (
			<Shell {...props} groups={TOPIC}>
				{(items, group) => packers[PER_TAB[group.id] ?? "U"](items)}
			</Shell>
		);
	},
};
