/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * E2 — SECONDARY AS A RIGHT RAIL.
 *
 * The three numbers sit beside the four tiles, in a narrow column split off by
 * a VERTICAL rule. That spends horizontal space, which the band has to spare at
 * this width, instead of vertical space, which is what the strip was wasting.
 *
 * They keep a real size here — value over label, mono, half the tile scale — so
 * the hierarchy is legible without a rule between the two groups. Below the
 * `md` breakpoint the rail unstacks and falls under the tiles, where the
 * vertical rule would make no sense, so it is dropped there.
 *
 * The bet: a second tier is clearer standing next to the first tier than under
 * it, and one vertical rule reads lighter than one horizontal rule.
 * The risk: five columns is a tight fit, and the rail is the first thing to
 * break at an awkward width.
 */

import { totalsFor, usageFor } from "./aggregate";
import { PulseBand } from "./PulseBand";
import { Row } from "./rows";
import type { DisplayRow } from "./useFeedPrototype";

export function VariantE2({ rows }: { rows: DisplayRow[] }) {
	return (
		<PulseBand
			rows={rows}
			totals={totalsFor(rows, 1440)}
			usage={usageFor(rows, 1440)}
			layout="rail"
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

export const VARIANT_E2_NAME = "E2 · secondary as a right rail";
