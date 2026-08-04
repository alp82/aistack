/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * D2c — EVERY ROW IS A FINDING.
 *
 * The third diagnosis of "meaningless": an event is not interesting on its own.
 * "alp synced 4.99B" is a fact with no frame. "the most measured stack on the
 * site, and it grew again today" is the same fact ranked against everything
 * else, and a rank is what a reader can use.
 *
 * So each row leads with a CLAIM derived by comparing the event against the
 * rest of the feed, and demotes the raw event to a mono line underneath. Every
 * claim below is computed from the rows on screen — none is decorative.
 *
 * This is the most expensive of the three: the claims need cross-row context,
 * which the read query would have to fetch and rank rather than page.
 *
 * The bet: the feed's job is not to log, it is to tell you what is true now.
 * The risk: claims are load-bearing. A wrong superlative is worse than a dull
 * row, and at four stacks "the most measured stack" is a weak boast.
 */

import { totalsFor, usageFor } from "./aggregate";
import { fmtAgo, fmtDelta, fmtTokens, harnessList, MONO_LABEL } from "./format";
import { PulseBand } from "./PulseBand";
import type { DisplayRow } from "./useFeedPrototype";

function syncTotal(row: DisplayRow): number {
	return row.event.type === "sync.landed"
		? row.event.harnesses.reduce((s, h) => s + h.totalTokens, 0)
		: 0;
}

/**
 * The strongest true claim about this row, or null when the row only supports
 * a plain statement. Order matters — the first match wins, so the rarest claim
 * is tested first.
 */
function claimFor(row: DisplayRow, all: DisplayRow[]): string | null {
	const event = row.event;
	const older = all.filter((r) => r.minutesAgo > row.minutesAgo);

	if (event.type === "stack.composition_changed") {
		for (const atom of event.added) {
			// How many OTHER stacks added the same thing in the window shown.
			const others = new Set(
				all
					.filter(
						(r) =>
							r.id !== row.id &&
							r.event.type === "stack.composition_changed" &&
							r.event.added.some((a) => a.slug === atom.slug),
					)
					.map((r) => r.stack.slug),
			);
			if (others.size >= 1) {
				return `${others.size + 1} stacks picked up ${atom.name} this week`;
			}
		}
		for (const atom of event.removed) {
			const others = new Set(
				all
					.filter(
						(r) =>
							r.id !== row.id &&
							r.event.type === "stack.composition_changed" &&
							r.event.removed.some((a) => a.slug === atom.slug),
					)
					.map((r) => r.stack.slug),
			);
			if (others.size >= 1) {
				return `${others.size + 1} stacks dropped ${atom.name} this week`;
			}
		}
		return null;
	}

	if (event.type === "sync.landed") {
		// A harness nobody had reported before this row.
		for (const h of event.harnesses) {
			const seenBefore = older.some(
				(r) =>
					r.event.type === "sync.landed" &&
					r.event.harnesses.some((o) => o.harness === h.harness),
			);
			if (!seenBefore && older.length > 0) {
				return `first ${harnessList([h.harness])} reading on the site`;
			}
		}

		const total = syncTotal(row);
		const bigger = new Set(
			all
				.filter((r) => r.stack.slug !== row.stack.slug && syncTotal(r) > total)
				.map((r) => r.stack.slug),
		);
		if (bigger.size === 0) {
			return "the most measured stack on the site";
		}

		// Largest 24-hour gain, only claimed when something else also moved.
		const moved = row.deltaTokens ?? 0;
		const day = all.filter(
			(r) => r.minutesAgo <= 1440 && (r.deltaTokens ?? 0) > 0,
		);
		if (
			moved > 0 &&
			day.length > 1 &&
			moved >= Math.max(...day.map((r) => r.deltaTokens ?? 0))
		) {
			return "the biggest jump today";
		}

		if (bigger.size <= 2) {
			return `${bigger.size + 1}${bigger.size === 1 ? "nd" : "rd"} most measured stack`;
		}
		return null;
	}

	return null;
}

function plain(row: DisplayRow): string {
	const event = row.event;
	if (event.type === "sync.landed") {
		const total = syncTotal(row);
		const move =
			row.deltaTokens === undefined
				? "first reading"
				: `${fmtDelta(row.deltaTokens)} today`;
		return `${fmtTokens(total)} over 30 days · ${move} · ${harnessList(
			event.harnesses.map((h) => h.harness),
		)}`;
	}
	if (event.type === "stack.published") {
		return `published by ${row.stack.creator} · ${event.toolCount} ${
			event.toolCount === 1 ? "tool" : "tools"
		}`;
	}
	const parts: string[] = [];
	if (event.added.length) {
		parts.push(`+${event.added.map((a) => a.name).join(", +")}`);
	}
	if (event.removed.length) {
		parts.push(`−${event.removed.map((a) => a.name).join(", −")}`);
	}
	return parts.join(" · ");
}

function Row({ row, all }: { row: DisplayRow; all: DisplayRow[] }) {
	const claim = claimFor(row, all);
	const fallback =
		row.event.type === "stack.published"
			? "new stack"
			: row.event.type === "stack.composition_changed"
				? "changed its stack"
				: "synced again";

	return (
		<li
			className={`border-l-2 py-4 pl-5 transition-colors duration-1000 ${
				row.isNew
					? "border-accent-lime bg-accent-lime/10"
					: "border-stroke-subtle"
			}`}
		>
			<div className="flex items-baseline justify-between gap-4">
				<a
					href={`/stacks/${row.stack.slug}`}
					className={`${MONO_LABEL} text-fg-muted hover:text-accent-lime`}
				>
					{row.stack.name}
				</a>
				<span className="shrink-0 font-mono text-xs text-fg-muted/50">
					{fmtAgo(row.minutesAgo)}
				</span>
			</div>
			<div
				className={`mt-2 text-lg font-semibold tracking-tight ${
					claim ? "text-accent-lime" : "text-fg-secondary"
				}`}
			>
				{claim ?? fallback}
			</div>
			<div className="mt-1.5 truncate font-mono text-xs text-fg-muted/50">
				{plain(row)}
			</div>
		</li>
	);
}

export function VariantD2c({ rows }: { rows: DisplayRow[] }) {
	const totals = totalsFor(rows, 1440);
	const usage = usageFor(rows, 1440);
	return (
		<PulseBand
			rows={rows}
			totals={totals}
			usage={usage}
			layout="feedline"
			feedLabel="what is true now"
			footnote="every claim is computed against the rest of the feed"
		>
			<ul className="grid gap-2 md:grid-cols-3">
				{rows.slice(0, 3).map((row) => (
					<Row key={row.id} row={row} all={rows} />
				))}
			</ul>
		</PulseBand>
	);
}

export const VARIANT_D2C_NAME = "D2c · every row is a finding";
