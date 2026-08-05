/**
 * PROTOTYPE — throwaway. Wayfinder ticket #96 (map #76).
 *
 * C — DENSE STREAM. The page REPLACES the band.
 *
 * Ported from the unreviewed #84 variant C: full width, a left time gutter,
 * sticky day dividers, filter chips by event type. Two changes against the
 * old file: rows now speak the LOCKED #84 grammar (movement leads, the stack
 * name is the link), and rows stay on event-only facts — no snapshot join.
 *
 * Paging: none. This is the infinite-scroll stand-in — everything renders.
 *
 * The bet: people who care about the pulse will go to a page for it, and the
 * page can then be dense enough to be worth the trip.
 * The risk: at `real` density this is three rows in an empty full-width
 * column. The thin case is the whole risk.
 */

import { useState } from "react";
import {
	dayBucket,
	fmtGutter,
	MONO_LABEL,
} from "../landing/feed-prototype/format";
import { Headline, syncFacts } from "../landing/feed-prototype/rows";
import type { DisplayRow } from "./useActivityPrototype";

type Filter =
	| "all"
	| "sync.landed"
	| "stack.published"
	| "stack.composition_changed";

const FILTERS: { key: Filter; label: string }[] = [
	{ key: "all", label: "all" },
	{ key: "sync.landed", label: "syncs" },
	{ key: "stack.published", label: "new stacks" },
	{ key: "stack.composition_changed", label: "changes" },
];

function RowBody({ row }: { row: DisplayRow }) {
	const facts =
		row.event.type === "sync.landed"
			? syncFacts(row).slice(0, 3)
			: [`by ${row.stack.creator}`];
	return (
		<>
			<div className="text-base text-fg-muted">
				<a
					href={`/stacks/${row.stack.slug}`}
					className="font-semibold text-fg-primary underline decoration-stroke-subtle underline-offset-4 hover:text-accent-lime hover:decoration-accent-lime"
				>
					{row.stack.name}
				</a>{" "}
				<Headline row={row} />
			</div>
			<div className="mt-1.5 font-mono text-xs text-fg-muted/50">
				{facts.join(" · ")}
			</div>
		</>
	);
}

export function VariantC({ rows }: { rows: DisplayRow[] }) {
	const [filter, setFilter] = useState<Filter>("all");
	const now = Date.now();
	const shown = rows.filter((r) => filter === "all" || r.event.type === filter);

	let lastDay = "";

	return (
		<div className="min-h-screen bg-bg-canvas">
			<header className="border-b-2 border-stroke-strong px-6 py-16">
				<div className="mx-auto w-full max-w-content">
					<h1 className="text-5xl font-black tracking-tighter text-fg-primary md:text-7xl">
						ACTIVITY
					</h1>
					<p className="mt-6 max-w-xl text-lg text-fg-muted">
						Every sync, every new stack, every change — as it lands. Measured on
						real machines, never estimated.
					</p>
					<div className="mt-10 flex flex-wrap gap-2">
						{FILTERS.map((f) => (
							<button
								type="button"
								key={f.key}
								onClick={() => setFilter(f.key)}
								className={`${MONO_LABEL} border-2 px-3 py-2 transition-colors ${
									filter === f.key
										? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
										: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime"
								}`}
							>
								{f.label}
							</button>
						))}
					</div>
				</div>
			</header>

			<div className="px-6 py-16">
				<div className="mx-auto w-full max-w-content">
					{shown.length === 0 ? (
						<p className="font-mono text-sm text-fg-muted/60">
							nothing here yet.
						</p>
					) : null}

					{shown.map((row) => {
						const day = dayBucket(row.minutesAgo, now);
						const isNewDay = day !== lastDay;
						lastDay = day;
						return (
							<div key={row.id}>
								{isNewDay ? (
									<div className="sticky top-0 z-10 -mx-6 mb-6 mt-10 border-y-2 border-stroke-subtle bg-bg-canvas px-6 py-2 first:mt-0">
										<span className={`${MONO_LABEL} text-fg-muted`}>{day}</span>
									</div>
								) : null}
								<div
									className={`flex gap-6 border-l-2 border-stroke-subtle pb-8 pl-6 transition-colors duration-1000 ${
										row.isNew ? "bg-accent-lime/10" : ""
									}`}
								>
									<span className="-ml-[calc(1.5rem+5px)] mt-1.5 h-2 w-2 shrink-0 bg-stroke-strong" />
									<span className="w-10 shrink-0 pt-0.5 text-right font-mono text-xs tabular-nums text-fg-muted/60">
										{fmtGutter(row.minutesAgo)}
									</span>
									<div className="min-w-0 flex-1">
										<RowBody row={row} />
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
