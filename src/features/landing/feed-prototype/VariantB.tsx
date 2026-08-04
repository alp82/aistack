/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * B — DIGEST. The pulse is an edition, not a stream.
 *
 * A section between the hero and the featured stacks, grouped by day, deliberately
 * NOT live. Nothing moves while you read it. A quiet day says so out loud
 * instead of collapsing, so a thin feed reads as a small site rather than a
 * broken one.
 *
 * The rows lead with MOVEMENT, not totals. "alp synced 4.99B" repeated every
 * day is the same sentence forever; "+285M since yesterday" is news. The
 * delta is computed across the feed, not stored (see `withDeltas`).
 *
 * The bet: honesty about volume beats simulated liveness.
 * The risk: a digest with three lines is a digest nobody subscribes to.
 */

import { ArrowRight } from "lucide-react";
import {
	dayBucket,
	fmtDelta,
	fmtTokens,
	harnessList,
	MONO_LABEL,
} from "./format";
import type { DisplayRow } from "./useFeedPrototype";

function clock(at: number): string {
	return new Date(at).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function Line({ row }: { row: DisplayRow }) {
	const event = row.event;

	if (event.type === "sync.landed") {
		const total = event.harnesses.reduce((s, h) => s + h.totalTokens, 0);
		const sessions = event.harnesses.reduce((s, h) => s + h.sessions, 0);
		return (
			<>
				<span className="text-fg-primary font-semibold">
					{row.stack.creator}
				</span>{" "}
				measured{" "}
				{row.deltaTokens === undefined ? (
					<>
						<span className="text-accent-lime font-semibold">
							{fmtTokens(total)} tokens
						</span>{" "}
						for the first time
					</>
				) : (
					<>
						<span className="text-accent-lime font-semibold">
							{fmtDelta(row.deltaTokens)}
						</span>{" "}
						on a 30-day total of {fmtTokens(total)}
					</>
				)}
				<span className="text-fg-muted/70">
					{" "}
					· {sessions} sessions ·{" "}
					{harnessList(event.harnesses.map((h) => h.harness))}
				</span>
			</>
		);
	}

	if (event.type === "stack.published") {
		return (
			<>
				<span className="text-fg-primary font-semibold">
					{row.stack.creator}
				</span>{" "}
				published{" "}
				<span className="text-accent-lime font-semibold">{row.stack.name}</span>
				<span className="text-fg-muted/70">
					{" "}
					· {event.toolCount} {event.toolCount === 1 ? "tool" : "tools"}
				</span>
			</>
		);
	}

	return (
		<>
			<span className="text-fg-primary font-semibold">{row.stack.creator}</span>{" "}
			changed <span className="text-fg-secondary">{row.stack.name}</span>
			{event.added.length ? (
				<>
					{" "}
					· picked up{" "}
					<span className="text-accent-lime">
						{event.added.map((a) => a.name).join(", ")}
					</span>
				</>
			) : null}
			{event.removed.length ? (
				<>
					{" "}
					· dropped{" "}
					<span className="text-fg-secondary">
						{event.removed.map((a) => a.name).join(", ")}
					</span>
				</>
			) : null}
		</>
	);
}

/** Days with no events still get a header — a quiet day is a fact, not a gap. */
function buildDays(rows: DisplayRow[], now: number) {
	const byDay = new Map<string, DisplayRow[]>();
	for (const row of rows) {
		const key = dayBucket(row.minutesAgo, now);
		const list = byDay.get(key);
		if (list) list.push(row);
		else byDay.set(key, [row]);
	}
	const days: { label: string; rows: DisplayRow[] }[] = [];
	for (let back = 0; back < 7; back += 1) {
		const label = dayBucket(back * 1440, now);
		days.push({ label, rows: byDay.get(label) ?? [] });
	}
	return days;
}

export function VariantB({ rows }: { rows: DisplayRow[] }) {
	const now = Date.now();
	const days = buildDays(rows, now);
	const week = rows.filter((r) => r.minutesAgo <= 7 * 1440);
	const syncs = week.filter((r) => r.event.type === "sync.landed").length;
	const stacks = new Set(week.map((r) => r.stack.slug)).size;
	const measured = week.reduce(
		(sum, r) =>
			r.event.type === "sync.landed" ? sum + (r.deltaTokens ?? 0) : sum,
		0,
	);

	return (
		<section className="border-b-2 border-stroke-strong px-6 py-24">
			<div className="mx-auto w-full max-w-content">
				<div className={`${MONO_LABEL} text-accent-lime mb-6`}>
					{"// pulse"}
				</div>
				<h2 className="mb-6 text-4xl font-black tracking-tighter text-fg-primary md:text-6xl">
					THIS WEEK
				</h2>
				<p className="mb-16 max-w-2xl text-lg text-fg-muted">
					{syncs} {syncs === 1 ? "sync" : "syncs"} across {stacks}{" "}
					{stacks === 1 ? "stack" : "stacks"}
					{measured > 0 ? (
						<>
							, moving{" "}
							<span className="text-accent-lime font-semibold">
								{fmtDelta(measured)} tokens
							</span>{" "}
							of measured usage
						</>
					) : null}
					. Everything below came off a real machine.
				</p>

				<div className="space-y-10">
					{days.map((day) => (
						<div
							key={day.label}
							className="border-t-2 border-stroke-subtle pt-4"
						>
							<div className={`${MONO_LABEL} mb-4 text-fg-muted`}>
								{day.label}
							</div>
							{day.rows.length === 0 ? (
								<p className="font-mono text-sm text-fg-muted/50">
									quiet — no syncs, no changes
								</p>
							) : (
								<ul className="space-y-3">
									{day.rows.map((row) => (
										<li key={row.id} className="flex gap-6 text-sm">
											<span className="shrink-0 font-mono text-xs text-fg-muted/60 pt-0.5 tabular-nums">
												{clock(row.at)}
											</span>
											<span className="text-fg-muted">
												<Line row={row} />
											</span>
										</li>
									))}
								</ul>
							)}
						</div>
					))}
				</div>

				<a
					href="?variant=C"
					className={`${MONO_LABEL} mt-12 inline-flex items-center gap-2 border-2 border-stroke-strong px-4 py-3 text-fg-primary hover:border-accent-lime hover:text-accent-lime`}
				>
					every event <ArrowRight className="h-3 w-3" />
				</a>
			</div>
		</section>
	);
}

export const VARIANT_B_NAME = "Digest — grouped by day, not live";
