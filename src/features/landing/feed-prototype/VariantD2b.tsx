/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * D2b — ONLY MEANINGFUL EVENTS GET A ROW.
 *
 * The other diagnosis of "meaningless": the problem is not the sentence, it is
 * that most rows should never have been rows. Auto-sync fires daily whether or
 * not anything happened, so the table fills with readings that say nothing.
 *
 * Two rules, applied at read time. The table stays append-only and keeps every
 * event — this is a display filter, not a write filter, so the rule can change
 * later without losing history.
 *
 *   1. REPEAT SYNCS COLLAPSE. Syncs from one stack inside 24 hours become one
 *      row carrying the summed movement. The three real prod rows already show
 *      why: two syncs, one stack, 19.6 hours apart.
 *   2. A SYNC MUST HAVE MOVED SOMETHING. Below `MIN_MOVE_SHARE` of the stack's
 *      own total, the reading is routine and does not earn a row. First
 *      readings always earn one. Publishes and composition changes always earn
 *      one — those are decisions a person made, not a timer firing.
 *
 * What gets dropped is COUNTED and said out loud, so the feed never implies
 * the site was quieter than it was.
 *
 * The bet: a short feed of real movement beats a long feed of readings.
 * The risk: at four stacks this can filter the feed down to nothing, and an
 * empty feed is worse than a boring one. The `real` density shows exactly that.
 */

import { totalsFor, usageFor } from "./aggregate";
import { fmtAgo, fmtDelta, fmtTokens, harnessList } from "./format";
import { PulseBand } from "./PulseBand";
import type { DisplayRow } from "./useFeedPrototype";

/** A sync must move at least this share of the stack's own total to earn a row. */
const MIN_MOVE_SHARE = 0.02;
const COLLAPSE_WINDOW_MIN = 1440;

type Kept = { row: DisplayRow; collapsed: number; moved: number };

function selectRows(rows: DisplayRow[]): { kept: Kept[]; routine: number } {
	const kept: Kept[] = [];
	const lastSyncIndex = new Map<string, number>();
	let routine = 0;

	for (const row of rows) {
		if (row.event.type !== "sync.landed") {
			kept.push({ row, collapsed: 0, moved: 0 });
			continue;
		}

		const total = row.event.harnesses.reduce((s, h) => s + h.totalTokens, 0);
		const moved = row.deltaTokens ?? 0;

		// Rule 1 — fold into the stack's previous kept sync if it is recent.
		const at = lastSyncIndex.get(row.stack.slug);
		const previous = at === undefined ? undefined : kept[at];
		if (
			previous &&
			row.minutesAgo - previous.row.minutesAgo < COLLAPSE_WINDOW_MIN
		) {
			previous.collapsed += 1;
			previous.moved += Math.max(moved, 0);
			continue;
		}

		// Rule 2 — a first reading is always news; a small move is not.
		const isFirst = row.deltaTokens === undefined;
		if (!isFirst && Math.abs(moved) < total * MIN_MOVE_SHARE) {
			routine += 1;
			continue;
		}

		lastSyncIndex.set(row.stack.slug, kept.length);
		kept.push({ row, collapsed: 0, moved: Math.max(moved, 0) });
	}

	return { kept, routine };
}

function Row({ entry }: { entry: Kept }) {
	const { row, collapsed, moved } = entry;
	const event = row.event;

	return (
		<li
			className={`flex gap-5 border-l-2 py-4 pl-5 transition-colors duration-1000 ${
				row.isNew
					? "border-accent-lime bg-accent-lime/10"
					: "border-stroke-subtle"
			}`}
		>
			<div className="min-w-0 flex-1">
				<div className="text-base text-fg-muted">
					<a
						href={`/stacks/${row.stack.slug}`}
						className="font-semibold text-fg-primary underline decoration-stroke-subtle underline-offset-4 hover:text-accent-lime hover:decoration-accent-lime"
					>
						{row.stack.name}
					</a>{" "}
					{event.type === "sync.landed" ? (
						row.deltaTokens === undefined ? (
							<>
								arrived with{" "}
								<span className="font-semibold text-accent-lime">
									{fmtTokens(
										event.harnesses.reduce((s, h) => s + h.totalTokens, 0),
									)}{" "}
									tokens
								</span>{" "}
								measured
							</>
						) : (
							<>
								gained{" "}
								<span className="font-semibold text-accent-lime">
									{fmtDelta(moved)}
								</span>{" "}
								measured tokens
							</>
						)
					) : event.type === "stack.published" ? (
						<>
							joined with{" "}
							<span className="font-semibold text-accent-lime">
								{event.toolCount} {event.toolCount === 1 ? "tool" : "tools"}
							</span>
						</>
					) : (
						<>
							{event.added.length ? (
								<>
									picked up{" "}
									<span className="font-semibold text-accent-lime">
										{event.added.map((a) => a.name).join(", ")}
									</span>
								</>
							) : null}
							{event.added.length && event.removed.length ? " · " : null}
							{event.removed.length ? (
								<>
									dropped{" "}
									<span className="font-semibold text-fg-secondary">
										{event.removed.map((a) => a.name).join(", ")}
									</span>
								</>
							) : null}
						</>
					)}
				</div>
				<div className="mt-1.5 truncate font-mono text-xs text-fg-muted/50">
					{event.type === "sync.landed"
						? harnessList(event.harnesses.map((h) => h.harness))
						: `by ${row.stack.creator}`}
					{collapsed > 0 ? ` · across ${collapsed + 1} syncs today` : ""}
				</div>
			</div>
			<span className="shrink-0 pt-1 font-mono text-xs text-fg-muted/50">
				{fmtAgo(row.minutesAgo)}
			</span>
		</li>
	);
}

export function VariantD2b({ rows }: { rows: DisplayRow[] }) {
	const totals = totalsFor(rows, 1440);
	const usage = usageFor(rows, 1440);
	const { kept, routine } = selectRows(rows);
	const collapsed = kept.reduce((sum, k) => sum + k.collapsed, 0);
	const hidden = routine + collapsed;

	return (
		<PulseBand
			rows={rows}
			totals={totals}
			usage={usage}
			layout="feedline"
			feedLabel="what moved"
			footnote={
				hidden > 0
					? `${hidden} routine ${hidden === 1 ? "reading" : "readings"} not listed — every sync still counts toward the numbers above`
					: undefined
			}
		>
			{kept.length === 0 ? (
				<p className="font-mono text-sm text-fg-muted/60">
					nothing moved enough to list. The numbers above still counted every
					reading.
				</p>
			) : (
				<ul className="space-y-2">
					{kept.slice(0, 4).map((entry) => (
						<Row key={entry.row.id} entry={entry} />
					))}
				</ul>
			)}
		</PulseBand>
	);
}

export const VARIANT_D2B_NAME = "D2b · only what moved earns a row";
