/**
 * PROTOTYPE — throwaway. Wayfinder ticket #96 (map #76).
 *
 * G — THE JOURNAL. Thin-first: designed at three rows, then checked at forty.
 *
 * No band, no big numbers — one epigraph line states the longer-window claim
 * ("measured across N stacks"). A narrow measure, so three rows fill a column
 * instead of rattling in a full-width room. Days are the unit: each divider
 * carries that day's own movement and event count, so the page reads as a
 * logbook with daily entries rather than an endless stream.
 *
 * Rows are RICH — the full snapshot-join fact line (models, tools, cache
 * share, names kept private). This is the variant that asks whether per-row
 * reads are worth it: at journal volume, twenty rows is twenty joins.
 *
 * The bet: a page-length list has an expected length, so stop pretending —
 * frame the thin case as a journal that is three days old, which is true.
 * The risk: at forty stacks the narrow measure scrolls forever, and the rich
 * fact lines turn the journal into noise.
 */

import {
	dayBucket,
	fmtDelta,
	MONO_LABEL,
} from "../landing/feed-prototype/format";
import { Row } from "../landing/feed-prototype/rows";
import type { DisplayRow } from "./useActivityPrototype";

type DayGroup = {
	day: string;
	rows: DisplayRow[];
	moved: number;
};

function groupByDay(rows: DisplayRow[], now: number): DayGroup[] {
	const groups: DayGroup[] = [];
	for (const row of rows) {
		const day = dayBucket(row.minutesAgo, now);
		let group = groups[groups.length - 1];
		if (!group || group.day !== day) {
			group = { day, rows: [], moved: 0 };
			groups.push(group);
		}
		group.rows.push(row);
		group.moved += row.deltaTokens ?? 0;
	}
	return groups;
}

export function VariantG({ rows }: { rows: DisplayRow[] }) {
	const now = Date.now();
	const groups = groupByDay(rows, now);
	const stacksSeen = new Set(rows.map((r) => r.stack.slug)).size;

	return (
		<div className="min-h-screen bg-bg-canvas px-6 py-16">
			<div className="mx-auto w-full max-w-2xl">
				<h1 className="text-4xl font-black tracking-tighter text-fg-primary md:text-5xl">
					ACTIVITY
				</h1>
				<p className={`${MONO_LABEL} mt-4 text-fg-muted/60`}>
					measured across {stacksSeen} {stacksSeen === 1 ? "stack" : "stacks"} ·
					counted on their own machines
				</p>

				{groups.map((group) => (
					<section key={group.day} className="mt-14">
						<div className="flex items-baseline justify-between border-b-2 border-stroke-strong pb-2">
							<span className={`${MONO_LABEL} text-fg-primary`}>
								{group.day}
							</span>
							<span className="font-mono text-xs tabular-nums text-fg-muted/60">
								{group.moved !== 0 ? (
									<span className="font-semibold text-accent-lime">
										{fmtDelta(group.moved)}
									</span>
								) : (
									"—"
								)}{" "}
								· {group.rows.length}{" "}
								{group.rows.length === 1 ? "event" : "events"}
							</span>
						</div>
						<ul className="mt-4 space-y-2">
							{group.rows.map((row) => (
								<Row key={row.id} row={row} detail="wide" />
							))}
						</ul>
					</section>
				))}

				<p className="mt-14 font-mono text-xs text-fg-muted/40">
					the journal starts 2026-08-02, when measuring began.
				</p>
			</div>
		</div>
	);
}
