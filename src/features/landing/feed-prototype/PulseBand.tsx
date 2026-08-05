/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * The pulse band, locked by the owner across four rounds:
 *
 *   - the watermark behind, the numbers in front (D2)
 *   - four headline numbers, one accent, tokens first
 *   - "all activity" is a Button, not a text link
 *   - HEADLINE   tokens measured · sessions · projects · tools
 *     SECONDARY  syncs · stack updates · models
 *
 * Still open, and the reason for the `layout` prop: WHERE the secondary three
 * go. As its own full-width strip they cost a whole row of vertical space and
 * an extra rule for three small numbers.
 *
 * RULE BUDGET — one horizontal line inside the band, and it is the one across
 * the tile tops. The band previously drew three stacked full-width rules (tile
 * tops, secondary, feed) plus the section border, which is what made it read as
 * a stack of boxes. Everything below the tiles is now separated by SPACE.
 * Vertical rules are still allowed: the feed rows keep their left border, and
 * the `rail` layout uses one.
 */

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/features/charts";
import {
	liveDays,
	type PulseTotals,
	tokensPerDay,
	type UsageTotals,
} from "./aggregate";
import { fmtCount, fmtTokens, MONO_LABEL } from "./format";
import type { DisplayRow } from "./useFeedPrototype";

const WATERMARK_MIN_DAYS = 3;

/** Where the three secondary numbers go. */
export type BandLayout = "header" | "rail" | "feedline";

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
		<div className="border-t-2 border-stroke-strong pt-4">
			<div
				className={`text-5xl font-black leading-none tracking-tighter tabular-nums md:text-6xl ${
					accent ? "text-accent-lime" : "text-fg-primary"
				}`}
			>
				{value}
			</div>
			<div className={`${MONO_LABEL} mt-3 text-fg-muted`}>{label}</div>
		</div>
	);
}

/** One secondary number. `stacked` puts the label under the value, for the rail. */
function Fact({
	value,
	label,
	stacked,
}: {
	value: string;
	label: string;
	stacked?: boolean;
}) {
	if (stacked) {
		return (
			<div>
				<div className="font-mono text-2xl font-semibold tabular-nums text-fg-secondary">
					{value}
				</div>
				<div className={`${MONO_LABEL} mt-1 text-fg-muted/60`}>{label}</div>
			</div>
		);
	}
	return (
		<span className="flex items-baseline gap-2">
			<span className="font-mono text-sm font-semibold tabular-nums text-fg-secondary">
				{value}
			</span>
			<span className={`${MONO_LABEL} text-fg-muted/60`}>{label}</span>
		</span>
	);
}

export function PulseBand({
	rows,
	totals,
	usage,
	children,
	footnote,
	layout,
	feedLabel = "as it lands",
}: {
	rows: DisplayRow[];
	totals: PulseTotals;
	usage: UsageTotals;
	children: ReactNode;
	footnote?: ReactNode;
	layout: BandLayout;
	/** The kicker above the feed. Each variant names its own feed. */
	feedLabel?: string;
}) {
	const points = tokensPerDay(rows, Date.now());
	const showWatermark = liveDays(points) >= WATERMARK_MIN_DAYS;
	// With no sync in the window there is nothing to report, and a row of
	// zeroes would read as a broken site rather than a quiet one.
	const quiet = usage.stacks === 0;
	const updates = totals.published + totals.changed;

	const facts = (stacked?: boolean) => (
		<>
			<Fact
				value={String(totals.syncs)}
				label={totals.syncs === 1 ? "sync" : "syncs"}
				stacked={stacked}
			/>
			<Fact
				value={String(updates)}
				label={updates === 1 ? "stack update" : "stack updates"}
				stacked={stacked}
			/>
			<Fact
				value={quiet ? "—" : String(usage.models)}
				label="models"
				stacked={stacked}
			/>
		</>
	);

	const measuredAcross = `measured across ${totals.stacksSeen} ${
		totals.stacksSeen === 1 ? "stack" : "stacks"
	}`;

	return (
		<section className="relative overflow-hidden border-b-2 border-stroke-strong bg-bg-panel px-6 py-20">
			{showWatermark ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-[0.18] [mask-image:linear-gradient(to_top,black,transparent)]"
				>
					<Sparkline
						points={points}
						ariaLabel=""
						width={1600}
						height={224}
						className="h-full w-full"
					/>
				</div>
			) : null}

			<div className="relative mx-auto w-full max-w-content">
				<div className="mb-12 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
					<span className="flex items-center gap-3">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime`}>
							{"// the last 24 hours"}
						</span>
					</span>
					{layout === "header" ? (
						<span className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
							{facts()}
						</span>
					) : (
						<span className={`${MONO_LABEL} text-fg-muted/60`}>
							{showWatermark ? "14 days behind the numbers" : measuredAcross}
						</span>
					)}
				</div>

				<div
					className={
						layout === "rail"
							? "grid gap-x-8 gap-y-12 md:grid-cols-[repeat(4,1fr)_auto]"
							: "grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4"
					}
				>
					<Stat
						value={totals.moved === 0 ? "—" : `+${fmtTokens(totals.moved)}`}
						label="tokens measured"
						accent
					/>
					<Stat
						value={quiet ? "—" : fmtCount(usage.sessions)}
						label="sessions"
					/>
					<Stat
						value={quiet ? "—" : fmtCount(usage.projects)}
						label="projects"
					/>
					<Stat value={quiet ? "—" : fmtCount(usage.tools)} label="tools" />
					{layout === "rail" ? (
						// A VERTICAL rule, so the rail costs no horizontal line and no row.
						<div className="flex flex-col justify-between gap-6 border-stroke-subtle pt-4 md:border-l-2 md:pl-8">
							{facts(true)}
						</div>
					) : null}
				</div>

				<div className="mt-16">
					{layout === "feedline" ? (
						<div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
							<span className={`${MONO_LABEL} text-fg-muted`}>{feedLabel}</span>
							<span className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
								{facts()}
							</span>
						</div>
					) : (
						<div className={`${MONO_LABEL} mb-6 text-fg-muted`}>
							{feedLabel}
						</div>
					)}
					{children}
				</div>

				<div className="mt-10 flex flex-wrap items-center justify-between gap-6">
					<span className="font-mono text-xs text-fg-muted/50">
						{layout === "header" ? measuredAcross : footnote}
					</span>
					<Button asChild variant="outline" size="lg">
						<a href="?variant=C" className={MONO_LABEL}>
							all activity <ArrowRight className="h-3 w-3" />
						</a>
					</Button>
				</div>
			</div>
		</section>
	);
}
