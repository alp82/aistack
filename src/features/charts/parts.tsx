/**
 * The pieces the library does not ship: a legend, a table view, and the frame
 * that holds a chart together with both of them.
 *
 * The library gives `role="img"`, an aria label, keyboard focus and tooltips.
 * It does not give identity without color, and it does not give exact values
 * outside a hover. Those two are what this file adds.
 */

import { cn } from "@/lib/utils";

/** Shared mono label treatment, matching the journey's section kickers. */
const MONO_LABEL =
	"font-mono text-[11px] font-semibold uppercase tracking-[0.25em]";

type LegendItem = {
	readonly key: string;
	readonly label: string;
	/** The paint this series wears. */
	readonly paint: string;
};

/**
 * The legend. Present whenever a chart carries two or more series, so identity
 * is never color alone. One series needs no legend - the caption names it.
 */
function ChartLegend({ items }: { items: readonly LegendItem[] }) {
	if (items.length < 2) return null;
	return (
		<ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
			{items.map((item) => (
				<li key={item.key} className="flex items-center gap-2">
					<span
						aria-hidden="true"
						className="block h-2 w-3 shrink-0"
						style={{ background: item.paint }}
					/>
					<span className="font-mono text-xs text-fg-secondary">
						{item.label}
					</span>
				</li>
			))}
		</ul>
	);
}

/**
 * The exact values, as a table.
 *
 * Always rendered, folded into a `<details>`. It is the alternative to
 * hover-only reading, and it is the relief channel a chart owes any mark that
 * sits below 3:1 on its surface.
 */
function ChartTable({
	columns,
	rows,
	summary = "Table view",
}: {
	readonly columns: readonly string[];
	readonly rows: readonly (readonly string[])[];
	readonly summary?: string;
}) {
	if (rows.length === 0) return null;
	return (
		<details className="mt-2">
			<summary
				className={cn(
					MONO_LABEL,
					"cursor-pointer text-fg-muted hover:text-fg-secondary",
				)}
			>
				{summary}
			</summary>
			<div className="mt-2 overflow-x-auto">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr>
							{columns.map((c) => (
								<th
									key={c}
									scope="col"
									className={cn(
										MONO_LABEL,
										"border-b border-stroke-subtle px-2 py-1 text-fg-muted",
									)}
								>
									{c}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.join("|")}>
								{row.map((cell, i) => (
									<td
										// biome-ignore lint/suspicious/noArrayIndexKey: a cell's identity is its column
										key={i}
										className="border-b border-stroke-subtle px-2 py-1 font-mono text-xs text-fg-primary"
									>
										{cell}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</details>
	);
}

/**
 * The frame: caption, legend, chart, table.
 *
 * A chart should be read with a visible heading, units and a time range beside
 * it. Those are ordinary HTML, easier to select, translate and print than text
 * inside an SVG.
 */
function ChartFigure({
	caption,
	legend,
	table,
	className,
	children,
}: {
	readonly caption?: React.ReactNode;
	readonly legend?: React.ReactNode;
	readonly table?: React.ReactNode;
	readonly className?: string;
	readonly children: React.ReactNode;
}) {
	return (
		<figure className={cn("m-0 font-mono", className)}>
			{(caption || legend) && (
				<figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
					{caption ? (
						<span className={cn(MONO_LABEL, "text-fg-muted")}>{caption}</span>
					) : (
						<span />
					)}
					{legend}
				</figcaption>
			)}
			{children}
			{table}
		</figure>
	);
}

export type { LegendItem };
export { ChartFigure, ChartLegend, ChartTable, MONO_LABEL };
