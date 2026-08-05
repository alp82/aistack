/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * D1 — CHART AS THE SPINE.
 *
 * The fix for "the graph sits there a bit lost": stop treating it as a garnish
 * in the corner. It spans the full band, it gets a real height, it gets a
 * label and a caption, and it plots the thing the site is actually about —
 * measured tokens per day across every public stack, not a count of feed rows.
 *
 * The stats become the headline and the chart becomes the base of the block.
 * Reading order is number, then shape, then evidence.
 *
 * Thin case: below three days with data, there is no chart at all. #91 already
 * settled that one reading draws the number, not a chart around a dot. Flip
 * density to `real` to see that branch — it is the branch that ships first.
 */

import { ArrowRight } from "lucide-react";
import { TimeSeriesChart } from "@/features/charts";
import { liveDays, tokensPerDay, totalsFor } from "./aggregate";
import { fmtAgo, fmtTokens, MONO_LABEL } from "./format";
import type { DisplayRow } from "./useFeedPrototype";

const CHART_MIN_DAYS = 3;

function Stat({
	value,
	label,
	accent,
}: {
	value: string;
	label: string;
	accent?: boolean;
}) {
	return (
		<div>
			<div
				className={`text-4xl font-black leading-none tracking-tighter tabular-nums md:text-5xl ${
					accent ? "text-accent-lime" : "text-fg-primary"
				}`}
			>
				{value}
			</div>
			<div className={`${MONO_LABEL} mt-3 text-fg-muted`}>{label}</div>
		</div>
	);
}

function Evidence({ row }: { row: DisplayRow }) {
	const event = row.event;
	const text =
		event.type === "sync.landed"
			? `${row.stack.creator} synced ${fmtTokens(
					event.harnesses.reduce((s, h) => s + h.totalTokens, 0),
				)}`
			: event.type === "stack.published"
				? `${row.stack.creator} published ${row.stack.name}`
				: `${row.stack.creator} changed ${row.stack.name}`;
	return (
		<li className="flex items-baseline gap-3 font-mono text-xs">
			<span
				className={`mt-1 h-1.5 w-1.5 shrink-0 ${
					row.isNew ? "bg-accent-lime" : "bg-stroke-strong"
				}`}
			/>
			<span className="truncate text-fg-muted">{text}</span>
			<span className="ml-auto shrink-0 text-fg-muted/50">
				{fmtAgo(row.minutesAgo)}
			</span>
		</li>
	);
}

export function VariantD1({ rows }: { rows: DisplayRow[] }) {
	const now = Date.now();
	const t = totalsFor(rows, 1440);
	const points = tokensPerDay(rows, now);
	const days = liveDays(points);
	const hasChart = days >= CHART_MIN_DAYS;

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-16">
			<div className="mx-auto w-full max-w-content">
				<div className="mb-12 flex flex-wrap items-baseline justify-between gap-4">
					<span className="flex items-center gap-3">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime`}>
							{"// the last 24 hours"}
						</span>
					</span>
					<span className={`${MONO_LABEL} text-fg-muted/60`}>
						measured across {t.stacksSeen}{" "}
						{t.stacksSeen === 1 ? "stack" : "stacks"}
					</span>
				</div>

				<div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
					<Stat
						value={String(t.syncs)}
						label={t.syncs === 1 ? "sync" : "syncs"}
					/>
					<Stat
						value={t.moved === 0 ? "—" : `+${fmtTokens(t.moved)}`}
						label="tokens measured"
						accent
					/>
					<Stat
						value={String(t.published)}
						label={t.published === 1 ? "new stack" : "new stacks"}
					/>
					<Stat value={String(t.changed)} label="stacks changed" />
				</div>

				<div className="mt-16 border-t-2 border-stroke-subtle pt-10">
					{hasChart ? (
						<TimeSeriesChart
							series={[{ key: "measured", label: "Tokens measured", points }]}
							ariaLabel="Tokens measured per day across every public stack"
							valueLabel="Tokens"
							formatValue={fmtTokens}
							height={200}
							caption={
								<>
									Daily gain in measured tokens across every public stack. A
									30-day window forgets its far end, so a quiet day can read
									flat even while work happens.
								</>
							}
						/>
					) : (
						<div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
							<span className={`${MONO_LABEL} text-fg-muted`}>
								14-day history
							</span>
							<span className="font-mono text-sm text-fg-muted/60">
								{days === 0
									? "no measured movement yet — the first sync starts the line"
									: `${days} ${days === 1 ? "day" : "days"} of readings. A line needs three.`}
							</span>
						</div>
					)}
				</div>

				<div className="mt-12 flex flex-wrap items-start justify-between gap-8 border-t-2 border-stroke-subtle pt-10">
					<ul className="min-w-0 flex-1 space-y-2.5">
						{rows.slice(0, 3).map((row) => (
							<Evidence key={row.id} row={row} />
						))}
					</ul>
					<a
						href="?variant=C"
						className={`${MONO_LABEL} inline-flex shrink-0 items-center gap-2 border-2 border-stroke-strong px-4 py-3 text-fg-primary hover:border-accent-lime hover:text-accent-lime`}
					>
						all activity <ArrowRight className="h-3 w-3" />
					</a>
				</div>
			</div>
		</section>
	);
}

export const VARIANT_D1_NAME = "D1 · chart as the spine, full width";
