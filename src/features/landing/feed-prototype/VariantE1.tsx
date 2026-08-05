/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * E1 — SECONDARY IN THE HEADER BAR.
 *
 * The three small numbers move up beside the live dot, into a row the band was
 * already paying for. The band loses a whole row of vertical space and the rule
 * above it, and the header stops being a lone kicker with nothing on its right.
 *
 * "measured across N stacks" is displaced by them, so it drops to the footnote
 * line next to the button — also a row already being paid for.
 *
 * The bet: the cheapest possible home. Nothing new is drawn.
 * The risk: three numbers at kicker size read as chrome, and a reader who
 * skims the header for a title will skim past them.
 */

import { totalsFor, usageFor } from "./aggregate";
import { PulseBand } from "./PulseBand";
import { Row } from "./rows";
import type { DisplayRow } from "./useFeedPrototype";

export function VariantE1({ rows }: { rows: DisplayRow[] }) {
	return (
		<PulseBand
			rows={rows}
			totals={totalsFor(rows, 1440)}
			usage={usageFor(rows, 1440)}
			layout="header"
		>
			<ul className="space-y-2">
				{rows.slice(0, 4).map((row) => (
					<Row key={row.id} row={row} detail="minimal" />
				))}
			</ul>
		</PulseBand>
	);
}

export const VARIANT_E1_NAME = "E1 · secondary in the header bar";
