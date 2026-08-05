/**
 * PROTOTYPE — throwaway. Wayfinder ticket #96 (map #76).
 *
 * H — THE LEDGER. A monospace table, the visual sibling of /leaderboard.
 *
 * One summary line carries the 24-hour claim, then columns: WHEN · STACK ·
 * WHAT · MOVEMENT. Event-only facts, no snapshot join. Numbered pagination
 * (15 per page), same device as the board. Filters are the same chips as C,
 * asking whether they earn their place at this volume.
 *
 * The bet: /leaderboard settled the site's idiom for ranked public numbers —
 * a second public numbers page should speak it, and a table gives three rows
 * a frame (header, columns) so the thin case reads structured, not empty.
 * The risk: a ledger is a record, not a pulse — nothing about it says LIVE,
 * and the flash has less room to breathe in a table row.
 */

import { useState } from "react";
import { totalsFor } from "../landing/feed-prototype/aggregate";
import {
	fmtAgo,
	fmtDelta,
	fmtTokens,
	MONO_LABEL,
} from "../landing/feed-prototype/format";
import type { DisplayRow } from "./useActivityPrototype";

const PER_PAGE = 15;

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

function what(row: DisplayRow): string {
	const event = row.event;
	if (event.type === "sync.landed") {
		const total = event.harnesses.reduce((s, h) => s + h.totalTokens, 0);
		const sessions = event.harnesses.reduce((s, h) => s + h.sessions, 0);
		return `synced · ${fmtTokens(total)} over 30 days · ${sessions} sessions`;
	}
	if (event.type === "stack.published") {
		return `published · ${event.toolCount} ${event.toolCount === 1 ? "tool" : "tools"}`;
	}
	const parts = [
		...event.added.map((a) => `+ ${a.name}`),
		...event.removed.map((a) => `− ${a.name}`),
	];
	return `changed · ${parts.join("  ")}`;
}

function Movement({ row }: { row: DisplayRow }) {
	if (row.event.type !== "sync.landed") {
		return <span className="text-fg-muted/40">·</span>;
	}
	if (row.deltaTokens === undefined) {
		return <span className="text-fg-muted/60">first reading</span>;
	}
	return (
		<span
			className={
				row.deltaTokens >= 0
					? "font-semibold text-accent-lime"
					: "font-semibold text-fg-secondary"
			}
		>
			{fmtDelta(row.deltaTokens)}
		</span>
	);
}

export function VariantH({ rows }: { rows: DisplayRow[] }) {
	const [filter, setFilter] = useState<Filter>("all");
	const [page, setPage] = useState(1);
	const totals = totalsFor(rows, 1440);
	const updates = totals.published + totals.changed;

	const filtered = rows.filter(
		(r) => filter === "all" || r.event.type === filter,
	);
	const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
	const clamped = Math.min(page, pages);
	const shown = filtered.slice((clamped - 1) * PER_PAGE, clamped * PER_PAGE);

	return (
		<div className="min-h-screen bg-bg-canvas px-6 py-16">
			<div className="mx-auto w-full max-w-content">
				<h1 className="text-4xl font-black tracking-tighter text-fg-primary md:text-5xl">
					ACTIVITY
				</h1>
				<p className={`${MONO_LABEL} mt-4 text-fg-muted`}>
					<span className="text-accent-lime">
						{totals.moved === 0 ? "—" : `+${fmtTokens(totals.moved)}`}
					</span>{" "}
					moved in the last 24 hours · {totals.syncs}{" "}
					{totals.syncs === 1 ? "sync" : "syncs"} · {updates}{" "}
					{updates === 1 ? "stack update" : "stack updates"}
				</p>

				<div className="mt-8 flex flex-wrap gap-2">
					{FILTERS.map((f) => (
						<button
							type="button"
							key={f.key}
							onClick={() => {
								setFilter(f.key);
								setPage(1);
							}}
							className={`${MONO_LABEL} border-2 px-3 py-1.5 transition-colors ${
								filter === f.key
									? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
									: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime"
							}`}
						>
							{f.label}
						</button>
					))}
				</div>

				<div className="mt-8 overflow-x-auto">
					<table className="w-full border-collapse font-mono text-sm">
						<thead>
							<tr className="border-b-2 border-stroke-strong">
								<th
									className={`${MONO_LABEL} py-3 pr-6 text-left text-fg-muted/60`}
								>
									when
								</th>
								<th
									className={`${MONO_LABEL} py-3 pr-6 text-left text-fg-muted/60`}
								>
									stack
								</th>
								<th
									className={`${MONO_LABEL} py-3 pr-6 text-left text-fg-muted/60`}
								>
									what
								</th>
								<th
									className={`${MONO_LABEL} py-3 text-right text-fg-muted/60`}
								>
									movement
								</th>
							</tr>
						</thead>
						<tbody>
							{shown.length === 0 ? (
								<tr>
									<td colSpan={4} className="py-8 text-center text-fg-muted/60">
										nothing here yet.
									</td>
								</tr>
							) : null}
							{shown.map((row) => (
								<tr
									key={row.id}
									className={`border-b border-stroke-subtle transition-colors duration-1000 ${
										row.isNew ? "bg-accent-lime/10" : ""
									}`}
								>
									<td className="whitespace-nowrap py-3.5 pr-6 text-xs tabular-nums text-fg-muted/60">
										{fmtAgo(row.minutesAgo)}
									</td>
									<td className="py-3.5 pr-6">
										<a
											href={`/stacks/${row.stack.slug}`}
											className="font-semibold text-fg-primary underline decoration-stroke-subtle underline-offset-4 hover:text-accent-lime hover:decoration-accent-lime"
										>
											{row.stack.name}
										</a>
									</td>
									<td className="py-3.5 pr-6 text-xs text-fg-muted">
										{what(row)}
									</td>
									<td className="whitespace-nowrap py-3.5 text-right text-xs tabular-nums">
										<Movement row={row} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{pages > 1 ? (
					<div className="mt-10 flex items-center gap-2">
						{Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
							<button
								type="button"
								key={p}
								onClick={() => setPage(p)}
								className={`${MONO_LABEL} border-2 px-3 py-1.5 tabular-nums transition-colors ${
									p === clamped
										? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
										: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime"
								}`}
							>
								{p}
							</button>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}
