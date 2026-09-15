/**
 * PROTOTYPE - throwaway. Variant I: Strip / cells.
 * The winning Strip with the SpeedingText counter: five bordered cells,
 * label over figure, the 24-hour total as the first cell.
 */

import type { Band } from "../feed";
import { fmtCount, fmtTokens, MONO_LABEL } from "../feed";
import { fmtSeconds, StripFrame } from "./StripFrame";

export const VARIANT_STRIP_CELLS_NAME = "Strip / cells - bordered row";

export function VariantStripCells({ band }: { readonly band: Band }) {
	const { totals, usage } = band;
	const cells: [string, string][] = [
		["tokens · 24h", fmtTokens(usage.tokens)],
		["sessions", fmtCount(usage.sessions)],
		["projects", fmtCount(usage.projects)],
		["tools", fmtCount(usage.tools)],
		["stacks", fmtCount(totals.stacksSeen)],
	];

	return (
		<StripFrame
			band={band}
			label="Tokens since you opened this page"
			sub={(s) => `${fmtSeconds(s)} at the last 24 hours' pace`}
			strip={
				<div className="mt-10 grid w-full max-w-3xl grid-cols-2 border-2 border-stroke-strong md:grid-cols-5">
					{cells.map(([label, value], i) => (
						<div
							key={label}
							className={`flex flex-col gap-1 border-stroke-strong px-4 py-3 ${
								i > 0 ? "md:border-l-2" : ""
							} ${i >= 2 ? "border-t-2 md:border-t-0" : ""} ${
								i % 2 === 1 ? "border-l-2" : ""
							}`}
						>
							<span className={`${MONO_LABEL} text-fg-muted`}>{label}</span>
							<span className="font-mono text-base font-bold text-fg-primary tabular-nums">
								{value}
							</span>
						</div>
					))}
				</div>
			}
		/>
	);
}
