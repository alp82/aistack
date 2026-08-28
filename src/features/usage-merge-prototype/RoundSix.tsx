// PROTOTYPE. THROWAWAY. Wayfinder ticket #304 (map #302).
//
// Question: is any measured row strong enough that a DATA-DRIVEN pick should
// replace or supplement the fixed editorial first screen (token headline plus
// model rows, settled in #303)? Three variants on top of composite Y, each a
// different ranking put where the reader would see it. Real prod data, real
// bands (`metric-rules/v2`, uncalibrated defaults), and a real previous-period
// fold (the throwaway `previous` arg on `getWorkflowByStackSlug`).
//
//   Z1  Supplement, ranked by FIT: a "stands out" strip under the reading with
//       the three rows farthest outside their typical band.
//   Z2  Supplement, ranked by MOVEMENT: a "moved most" strip with the three
//       rows that changed most against the previous window, in band widths.
//   Z3  Replace: the model rows beside the token headline give way to the one
//       row with the highest fit, body and all.
//
// Every variant ends with the ranking table (every row, every number) so the
// reaction is about what the numbers would actually surface, not the chrome.

import type { ReactNode } from "react";
import { MONO_LABEL } from "@/features/measured/copy";

import {
	fmtRowValue,
	type WorkflowRow,
	type WorkflowView,
} from "@/features/workflow/copy";
import { cn } from "@/lib/utils";
import { ChartCard, PER_TAB, packU, packV, packX } from "./RoundFive";
import { type Item, Shell, TOPIC, type VariantProps } from "./RoundThree";

// ---------------------------------------------------------------------------
// Rankings.
// ---------------------------------------------------------------------------

type Ranked = {
	row: WorkflowRow;
	prev: WorkflowRow | null;
	/** |now - before| in band widths. Null without a previous value. */
	move: number | null;
};

function fmtBand(row: Pick<WorkflowRow, "unit" | "band">): string {
	const f = (x: number) => fmtRowValue({ unit: row.unit, value: x });
	return `${f(row.band.low)} to ${f(row.band.high)}`;
}

function ranked(
	view: WorkflowView | null | undefined,
	prev: WorkflowView | null | undefined,
): Ranked[] {
	if (!view) return [];
	const before = new Map((prev?.rows ?? []).map((r) => [r.rowId, r]));
	return view.rows.map((row) => {
		const p = before.get(row.rowId) ?? null;
		const width = Math.max(row.band.high - row.band.low, Number.EPSILON);
		return {
			row,
			prev: p,
			move: p ? Math.abs(row.value - p.value) / width : null,
		};
	});
}

const byFit = (rs: Ranked[]) =>
	rs.filter((r) => r.row.fit > 0).sort((a, b) => b.row.fit - a.row.fit);

const byMove = (rs: Ranked[]) =>
	rs
		.filter(
			(r): r is Ranked & { move: number } => r.move !== null && r.move > 0,
		)
		.sort((a, b) => b.move - a.move);

const PREV: Record<string, string> = {
	"30d": "the 30 days before",
	"7d": "the 7 days before",
	"24h": "the day before",
};

// ---------------------------------------------------------------------------
// The strip, and the ranking table every variant prints.
// ---------------------------------------------------------------------------

function Strip({
	kicker,
	note,
	cells,
}: {
	kicker: string;
	note: string;
	cells: ReactNode[];
}) {
	return (
		<div className="mt-10">
			<div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6">
				<p className={cn(MONO_LABEL, "text-accent-lime")}>{kicker}</p>
				<p className="font-mono text-[11px] text-fg-muted">{note}</p>
			</div>
			{cells.length === 0 ? (
				<p className="border border-dashed border-stroke-strong px-4 py-4 font-mono text-xs text-fg-muted">
					nothing qualifies in this window
				</p>
			) : (
				<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-3">
					{cells}
				</div>
			)}
		</div>
	);
}

function Cell({
	it,
	row,
	line,
	tag,
}: {
	it: Item | undefined;
	row: WorkflowRow;
	line: string;
	tag: string;
}) {
	return (
		<div className="flex flex-col bg-bg-canvas p-5">
			<p className={cn(MONO_LABEL, "text-fg-muted")}>{row.name}</p>
			<p className="mt-2 font-mono text-4xl font-black tracking-tight text-fg-primary">
				{it?.figure ?? fmtRowValue(row)}
			</p>
			<p className="mt-1 text-sm text-fg-secondary">{line}</p>
			<p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
				{tag}
			</p>
			{it?.picture && <div className="mt-4">{it.picture(false)}</div>}
		</div>
	);
}

function RankingTable({ rs, window }: { rs: Ranked[]; window: string }) {
	const cell = "px-2 py-1 text-right font-mono text-[11px] tabular-nums";
	const head =
		"px-2 py-1 text-right font-mono text-[10px] uppercase tracking-widest text-fg-muted";
	return (
		<details className="mt-12 border border-dashed border-fuchsia-500/60">
			<summary className="cursor-pointer px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-fuchsia-400">
				PROTOTYPE · ranking table, {window}, every row ({rs.length})
			</summary>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr className="border-b border-stroke-subtle">
							<th className={cn(head, "text-left")}>row</th>
							<th className={head}>value</th>
							<th className={head}>band</th>
							<th className={head}>coverage</th>
							<th className={head}>surprise</th>
							<th className={head}>fit</th>
							<th className={head}>before</th>
							<th className={head}>move (bands)</th>
						</tr>
					</thead>
					<tbody>
						{[...rs]
							.sort((a, b) => b.row.fit - a.row.fit)
							.map((r) => (
								<tr
									key={r.row.rowId}
									className="border-b border-stroke-subtle/50"
								>
									<td className={cn(cell, "text-left")}>{r.row.name}</td>
									<td className={cell}>{fmtRowValue(r.row)}</td>
									<td className={cn(cell, "text-fg-muted")}>
										{fmtBand(r.row)}
									</td>
									<td className={cell}>{Math.round(r.row.coverage * 100)}%</td>
									<td className={cell}>{r.row.surprise.toFixed(2)}</td>
									<td className={cn(cell, r.row.fit > 0 && "text-accent-lime")}>
										{r.row.fit.toFixed(2)}
									</td>
									<td className={cn(cell, "text-fg-muted")}>
										{r.prev ? fmtRowValue(r.prev) : "·"}
									</td>
									<td className={cell}>
										{r.move === null ? "·" : r.move.toFixed(2)}
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
			<p className="px-3 py-2 text-[11px] text-fg-muted">
				fit = coverage × surprise; surprise = distance outside the band ÷
				(distance + band width). Bands are the uncalibrated defaults in
				metric-rules/v2. "before" is the same fold one window earlier.
			</p>
		</details>
	);
}

function tabs(props: VariantProps) {
	const w = props.p.window;
	const packers = { U: packU(w), V: packV(w), X: packX(w) };
	return (items: Item[], group: { id: string }) =>
		packers[PER_TAB[group.id] ?? "U"](items);
}

// ---------------------------------------------------------------------------
// Z1: supplement, by fit.
// ---------------------------------------------------------------------------

export const VariantZ1 = {
	name: "Y + stands-out strip (top 3 by fit)",
	Component: function Z1(props: VariantProps) {
		const rs = ranked(props.p.view, props.p.prev);
		const top = byFit(rs).slice(0, 3);
		return (
			<>
				<Shell
					{...props}
					groups={TOPIC}
					beforeTabs={(all) => (
						<Strip
							kicker="// stands out"
							note="the three rows farthest outside their typical band"
							cells={top.map((r) => (
								<Cell
									key={r.row.rowId}
									it={all.get(r.row.rowId)}
									row={r.row}
									line={`${r.row.label}; typical is ${fmtBand(r.row)}`}
									tag={`fit ${r.row.fit.toFixed(2)} · coverage ${Math.round(r.row.coverage * 100)}%`}
								/>
							))}
						/>
					)}
				>
					{tabs(props)}
				</Shell>
				<RankingTable rs={rs} window={props.p.window} />
			</>
		);
	},
};

// ---------------------------------------------------------------------------
// Z2: supplement, by movement against the previous window.
// ---------------------------------------------------------------------------

export const VariantZ2 = {
	name: "Y + moved-most strip (top 3 by change vs the window before)",
	Component: function Z2(props: VariantProps) {
		const rs = ranked(props.p.view, props.p.prev);
		const top = byMove(rs).slice(0, 3);
		const prevDays = props.p.prev?.window.days ?? 0;
		return (
			<>
				<Shell
					{...props}
					groups={TOPIC}
					beforeTabs={(all) => (
						<Strip
							kicker="// moved most"
							note={`against ${PREV[props.p.window]} (${prevDays} measured days)`}
							cells={top.map((r) => (
								<Cell
									key={r.row.rowId}
									it={all.get(r.row.rowId)}
									row={r.row}
									line={`from ${r.prev ? fmtRowValue(r.prev) : "·"} ${PREV[props.p.window]}`}
									tag={`moved ${r.move.toFixed(1)} band widths`}
								/>
							))}
						/>
					)}
				>
					{tabs(props)}
				</Shell>
				<RankingTable rs={rs} window={props.p.window} />
			</>
		);
	},
};

// ---------------------------------------------------------------------------
// Z3: replace. The highest-fit row takes the model rows' slot.
// ---------------------------------------------------------------------------

export const VariantZ3 = {
	name: "Replace: top-fit row takes the model rows' slot",
	Component: function Z3(props: VariantProps) {
		const rs = ranked(props.p.view, props.p.prev);
		const top = byFit(rs)[0];
		return (
			<>
				<Shell
					{...props}
					groups={TOPIC}
					topRight={(all) => {
						const it = top ? all.get(top.row.rowId) : undefined;
						if (!top || !it)
							return (
								<p className="border border-dashed border-stroke-strong px-4 py-6 font-mono text-sm text-fg-muted">
									no row sits outside its band; the fixed model rows would
									render here
								</p>
							);
						return (
							<div className="border border-stroke-subtle">
								<div className="flex flex-wrap items-baseline justify-between gap-x-6 px-6 pt-4">
									<p className={cn(MONO_LABEL, "text-accent-lime")}>
										{"// stands out"}
									</p>
									<p className="font-mono text-[11px] text-fg-muted">
										{top.row.label}; typical is {fmtBand(top.row)} · fit{" "}
										{top.row.fit.toFixed(2)}
									</p>
								</div>
								<ChartCard it={it} window={props.p.window} />
								{it.body && <div className="px-6 pb-6">{it.body()}</div>}
							</div>
						);
					}}
				>
					{tabs(props)}
				</Shell>
				<RankingTable rs={rs} window={props.p.window} />
			</>
		);
	},
};
