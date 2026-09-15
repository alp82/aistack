/**
 * PROTOTYPE - throwaway. Variant J: Strip / one line.
 * No boxes. The five figures read as a single mono sentence under the
 * counter, separated by middots, the figure bold and the noun muted. The
 * counter keeps " tokens" as its suffix so the label can shrink to the
 * timing note.
 */

import { Fragment } from "react";
import type { Band } from "../feed";
import { fmtCount, fmtTokens } from "../feed";
import { fmtSeconds, StripFrame } from "./StripFrame";

export const VARIANT_STRIP_LINE_NAME = "Strip / one line - middot sentence";

export function VariantStripLine({ band }: { readonly band: Band }) {
	const { totals, usage } = band;
	const parts: [string, string][] = [
		[fmtTokens(usage.tokens), "tokens in 24h"],
		[fmtCount(usage.sessions), "sessions"],
		[fmtCount(usage.projects), "projects"],
		[fmtCount(usage.tools), "tools"],
		[fmtCount(totals.stacksSeen), totals.stacksSeen === 1 ? "stack" : "stacks"],
	];

	return (
		<StripFrame
			band={band}
			label="Since you opened this page"
			suffix=" tokens"
			sub={(s) => `${fmtSeconds(s)} · at the last 24 hours' pace`}
			strip={
				<p className="mt-8 max-w-3xl font-mono text-sm leading-7 text-fg-muted">
					{parts.map(([value, noun], i) => (
						<Fragment key={noun}>
							{i > 0 ? <span className="mx-3 text-fg-muted/50">·</span> : null}
							<span className="whitespace-nowrap">
								<span className="font-bold text-fg-primary tabular-nums">
									{value}
								</span>{" "}
								{noun}
							</span>
						</Fragment>
					))}
				</p>
			}
		/>
	);
}
