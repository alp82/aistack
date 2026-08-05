/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * E3 — SECONDARY ON THE FEED LINE.
 *
 * The "as it lands" kicker was a whole line carrying two words and nothing on
 * its right. The three numbers take that empty half. No row is added, no rule
 * is drawn, and the numbers land next to the rows they summarize — "2 syncs"
 * sits directly above the two sync rows it counted.
 *
 * The bet: adjacency does the explaining. The counts and the events they count
 * are one block, so neither needs a label saying so.
 * The risk: it reads as a caption for the feed rather than for the band, and
 * `models` is not a property of the feed at all.
 */

import { totalsFor, usageFor } from "./aggregate";
import { PulseBand } from "./PulseBand";
import { Row } from "./rows";
import type { DisplayRow } from "./useFeedPrototype";

export function VariantE3({ rows }: { rows: DisplayRow[] }) {
	return (
		<PulseBand
			rows={rows}
			totals={totalsFor(rows, 1440)}
			usage={usageFor(rows, 1440)}
			layout="feedline"
			footnote="every figure comes off a real machine, never estimated"
		>
			<ul className="space-y-2">
				{rows.slice(0, 4).map((row) => (
					<Row key={row.id} row={row} detail="minimal" />
				))}
			</ul>
		</PulseBand>
	);
}

export const VARIANT_E3_NAME = "E3 · secondary on the feed line";
