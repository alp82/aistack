/**
 * PROTOTYPE - throwaway. Variant K: Strip / figures.
 * The four levels as big black figures with a tiny label under each, no
 * borders, one hairline rule over the row. The 24-hour total leads the row
 * in the accent colour so the two token readings sit side by side: the one
 * you are watching, and the one the day made.
 */

import type { Band } from "../feed";
import { fmtCount, fmtTokens, MONO_LABEL } from "../feed";
import { fmtSeconds, StripFrame } from "./StripFrame";

export const VARIANT_STRIP_FIGURES_NAME =
	"Strip / figures - big numbers, no boxes";

export function VariantStripFigures({ band }: { readonly band: Band }) {
	const { totals, usage } = band;
	const figures: [string, string, boolean][] = [
		["tokens · 24h", fmtTokens(usage.tokens), true],
		["sessions", fmtCount(usage.sessions), false],
		["projects", fmtCount(usage.projects), false],
		["tools", fmtCount(usage.tools), false],
		["stacks", fmtCount(totals.stacksSeen), false],
	];

	return (
		<StripFrame
			band={band}
			label="Tokens since you opened this page"
			sub={(s) => `${fmtSeconds(s)} at the last 24 hours' pace`}
			strip={
				<div className="mt-10 grid w-full max-w-3xl grid-cols-3 gap-y-6 border-t border-stroke-muted pt-6 md:grid-cols-5">
					{figures.map(([label, value, lead]) => (
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
			}
		/>
	);
}
