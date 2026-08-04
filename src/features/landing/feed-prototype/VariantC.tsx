/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * C — DEDICATED PAGE. The pulse is a place you go.
 *
 * Stands in for a real `/activity` route: it REPLACES the landing page while
 * this variant is selected. Full width, dense, chronological, a time gutter on
 * the left, sticky day dividers, filter chips by event type, and live insert at
 * the top with a lime flash.
 *
 * This is the variant that has to survive the thin case. Press "+ event" in the
 * switcher bar to see what arrival feels like, and flip density to `real` to
 * see the page a first visitor would actually get today.
 *
 * The bet: people who care about the pulse will go to a page for it, and the
 * page can then be dense enough to be worth the trip.
 * The risk: nobody goes, and an empty room is louder than no room.
 */

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
	dayBucket,
	fmtDelta,
	fmtGutter,
	fmtTokens,
	harnessName,
	MONO_LABEL,
} from "./format";
import type { DisplayRow } from "./useFeedPrototype";

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

function Body({ row }: { row: DisplayRow }) {
	const event = row.event;

	if (event.type === "sync.landed") {
		const total = event.harnesses.reduce((s, h) => s + h.totalTokens, 0);
		return (
			<>
				<div className="text-sm text-fg-muted">
					<span className="font-semibold text-fg-primary">
						{row.stack.creator}
					</span>{" "}
					synced{" "}
					<span className="font-semibold text-accent-lime">
						{fmtTokens(total)}
					</span>{" "}
					measured tokens
					{row.deltaTokens !== undefined ? (
						<span className="font-mono text-xs text-fg-muted/70">
							{" "}
							({fmtDelta(row.deltaTokens)})
						</span>
					) : null}
				</div>
				<div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-fg-muted/60">
					{event.harnesses.map((h) => (
						<span key={h.harness}>
							{harnessName(h.harness)} · {fmtTokens(h.totalTokens)} ·{" "}
							{h.sessions} sessions · {h.projects} projects · {h.activeDays}/
							{h.windowDays} active days
						</span>
					))}
				</div>
			</>
		);
	}

	if (event.type === "stack.published") {
		return (
			<div className="text-sm text-fg-muted">
				<span className="font-semibold text-fg-primary">
					{row.stack.creator}
				</span>{" "}
				published{" "}
				<span className="font-semibold text-accent-lime">{row.stack.name}</span>{" "}
				<span className="font-mono text-xs text-fg-muted/60">
					· {event.toolCount} {event.toolCount === 1 ? "tool" : "tools"}
				</span>
			</div>
		);
	}

	return (
		<div className="text-sm text-fg-muted">
			<span className="font-semibold text-fg-primary">{row.stack.creator}</span>{" "}
			changed <span className="text-fg-secondary">{row.stack.name}</span>
			<div className="mt-2 flex flex-wrap gap-2">
				{event.added.map((a) => (
					<span
						key={`+${a.slug}`}
						className="border border-accent-lime/60 px-2 py-0.5 font-mono text-xs text-accent-lime"
					>
						+ {a.name}
					</span>
				))}
				{event.removed.map((a) => (
					<span
						key={`-${a.slug}`}
						className="border border-stroke-subtle px-2 py-0.5 font-mono text-xs text-fg-muted line-through"
					>
						− {a.name}
					</span>
				))}
			</div>
		</div>
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
					<a
						href="?variant=A"
						className={`${MONO_LABEL} mb-8 inline-flex items-center gap-2 text-fg-muted hover:text-accent-lime`}
					>
						<ArrowLeft className="h-3 w-3" /> ai stack
					</a>
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
										<Body row={row} />
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

export const VARIANT_C_NAME = "Own page — dense stream, live insert";
