/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * D3 — EVERY NUMBER CARRIES ITS OWN SHAPE.
 *
 * The third fix: there is no orphan chart because there is no single chart.
 * Each stat gets a 7-day sparkline directly under it, so the shape belongs to
 * the number above it and never has to be matched up by eye.
 *
 * The band also splits: measured aggregates on the left, a real named list on
 * the right. That answers the risk logged against the first D — aggregates
 * alone name nobody, so there is no reason to come back. Here the names sit
 * next to the numbers at equal weight.
 *
 * Each sparkline is its OWN chart with ONE series, so every one of them wears
 * the page accent. That stays inside the module rule: the palette is for two or
 * more series in one chart, and there is never more than one here.
 *
 * Thin case: a stat whose series has fewer than two live days shows a hairline
 * rule instead of a line. `Sparkline` already returns null under two readings,
 * so the rule is what fills the space.
 */

import { ArrowRight } from "lucide-react";
import { Sparkline } from "@/features/charts";
import {
	countPerDay,
	type DayPoint,
	liveDays,
	tokensPerDay,
	totalsFor,
} from "./aggregate";
import { fmtAgo, fmtTokens, harnessList, MONO_LABEL } from "./format";
import type { DisplayRow } from "./useFeedPrototype";

function Stat({
	value,
	label,
	points,
	accent,
}: {
	value: string;
	label: string;
	points: DayPoint[];
	accent?: boolean;
}) {
	return (
		<div>
			<div
				className={`text-4xl font-black leading-none tracking-tighter tabular-nums ${
					accent ? "text-accent-lime" : "text-fg-primary"
				}`}
			>
				{value}
			</div>
			<div className={`${MONO_LABEL} mt-2.5 text-fg-muted`}>{label}</div>
			<div className="mt-4 h-7">
				{liveDays(points) >= 2 ? (
					<Sparkline
						points={points}
						ariaLabel={`${label}, last 7 days`}
						width={140}
						height={28}
						className="opacity-80"
					/>
				) : (
					<div className="mt-3.5 h-px w-[140px] bg-stroke-subtle" />
				)}
			</div>
		</div>
	);
}

function Row({ row }: { row: DisplayRow }) {
	const event = row.event;
	return (
		<li
			className={`flex items-baseline gap-3 border-l-2 py-2.5 pl-4 transition-colors duration-1000 ${
				row.isNew
					? "border-accent-lime bg-accent-lime/10"
					: "border-stroke-subtle"
			}`}
		>
			<div className="min-w-0 flex-1">
				{event.type === "sync.landed" ? (
					<>
						<div className="truncate text-sm text-fg-muted">
							<span className="font-semibold text-fg-primary">
								{row.stack.creator}
							</span>{" "}
							synced{" "}
							<span className="font-semibold text-accent-lime">
								{fmtTokens(
									event.harnesses.reduce((s, h) => s + h.totalTokens, 0),
								)}
							</span>
						</div>
						<div className="mt-1 truncate font-mono text-[11px] text-fg-muted/50">
							{harnessList(event.harnesses.map((h) => h.harness))}
							{row.deltaTokens !== undefined && row.deltaTokens > 0
								? ` · +${fmtTokens(row.deltaTokens)} on the 30-day total`
								: ""}
						</div>
					</>
				) : event.type === "stack.published" ? (
					<>
						<div className="truncate text-sm text-fg-muted">
							<span className="font-semibold text-fg-primary">
								{row.stack.creator}
							</span>{" "}
							published{" "}
							<span className="font-semibold text-accent-lime">
								{row.stack.name}
							</span>
						</div>
						<div className="mt-1 font-mono text-[11px] text-fg-muted/50">
							{event.toolCount} {event.toolCount === 1 ? "tool" : "tools"}
						</div>
					</>
				) : (
					<>
						<div className="truncate text-sm text-fg-muted">
							<span className="font-semibold text-fg-primary">
								{row.stack.creator}
							</span>{" "}
							changed{" "}
							<span className="text-fg-secondary">{row.stack.name}</span>
						</div>
						<div className="mt-1 truncate font-mono text-[11px] text-fg-muted/50">
							{event.added.length
								? `+${event.added.map((a) => a.name).join(", +")}`
								: ""}
							{event.added.length && event.removed.length ? " · " : ""}
							{event.removed.length
								? `−${event.removed.map((a) => a.name).join(", −")}`
								: ""}
						</div>
					</>
				)}
			</div>
			<span className="shrink-0 font-mono text-[11px] text-fg-muted/50">
				{fmtAgo(row.minutesAgo)}
			</span>
		</li>
	);
}

export function VariantD3({ rows }: { rows: DisplayRow[] }) {
	const now = Date.now();
	const t = totalsFor(rows, 1440);

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-16">
			<div className="mx-auto grid w-full max-w-content gap-x-16 gap-y-12 lg:grid-cols-[1fr_22rem]">
				<div>
					<div className="mb-12 flex items-center gap-3">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime`}>
							{"// the last 24 hours"}
						</span>
						<span className={`${MONO_LABEL} ml-auto text-fg-muted/60`}>
							7-day shape below each
						</span>
					</div>

					<div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">
						<Stat
							value={String(t.syncs)}
							label={t.syncs === 1 ? "sync" : "syncs"}
							points={countPerDay(rows, now, "sync.landed")}
						/>
						<Stat
							value={t.moved === 0 ? "—" : `+${fmtTokens(t.moved)}`}
							label="tokens measured"
							accent
							points={tokensPerDay(rows, now, 7)}
						/>
						<Stat
							value={String(t.published)}
							label={t.published === 1 ? "new stack" : "new stacks"}
							points={countPerDay(rows, now, "stack.published")}
						/>
						<Stat
							value={String(t.changed)}
							label="stacks changed"
							points={countPerDay(rows, now, "stack.composition_changed")}
						/>
					</div>

					<p className="mt-12 max-w-xl font-mono text-xs text-fg-muted/60">
						measured across {t.stacksSeen}{" "}
						{t.stacksSeen === 1 ? "stack" : "stacks"} · every figure comes off a
						real machine, never estimated
					</p>
				</div>

				<div className="lg:border-l-2 lg:border-stroke-subtle lg:pl-10">
					<div className={`${MONO_LABEL} mb-6 text-fg-muted`}>as it lands</div>
					<ul className="space-y-1">
						{rows.slice(0, 5).map((row) => (
							<Row key={row.id} row={row} />
						))}
					</ul>
					<a
						href="?variant=C"
						className={`${MONO_LABEL} mt-8 inline-flex items-center gap-2 text-fg-muted hover:text-accent-lime`}
					>
						all activity <ArrowRight className="h-3 w-3" />
					</a>
				</div>
			</div>
		</section>
	);
}

export const VARIANT_D3_NAME = "D3 · a shape under every number + live list";
