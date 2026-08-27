/**
 * PROTOTYPE - throwaway. Variant B: "Annotated".
 *
 * The feed and the chart fuse into one instrument: each feed event becomes a
 * marker pinned onto the 14-day token line at its moment, with a hover card
 * carrying the stack link and the event. A compact data rail on the left
 * replaces the four giant tiles. Target height ~380px.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/features/charts";
import type { Band, FeedRow } from "../feed";
import { fmtCount, fmtTokens, liveDays, MONO_LABEL } from "../feed";
import { rowHandle, rowSummary } from "./summary";

export const VARIANT_ANNOTATED_NAME = "Annotated - events pinned on the line";

const CHART_HEIGHT = 300;

type Marker = {
	row: FeedRow;
	/** 0..1 across the chart's time range. */
	x: number;
	/** 0..1 from the top, on the interpolated line. */
	y: number;
};

/** Pin each row onto the line by interpolating the day points around it. */
function markersFor(band: Band): Marker[] {
	const points = [...band.points].sort((a, b) => a.at - b.at);
	if (points.length < 2) return [];
	const minAt = points[0].at;
	const maxAt = points[points.length - 1].at;
	const maxValue = Math.max(...points.map((p) => p.value), 1);
	const span = Math.max(maxAt - minAt, 1);

	return band.rows.map((row) => {
		const at = Math.min(Math.max(row.at, minAt), maxAt);
		let before = points[0];
		let after = points[points.length - 1];
		for (let i = 0; i < points.length - 1; i++) {
			if (points[i].at <= at && at <= points[i + 1].at) {
				before = points[i];
				after = points[i + 1];
				break;
			}
		}
		const t =
			after.at === before.at ? 0 : (at - before.at) / (after.at - before.at);
		const value = before.value + t * (after.value - before.value);
		return {
			row,
			x: Math.min(Math.max((at - minAt) / span, 0.03), 0.97),
			y: 1 - (value / maxValue) * 0.92,
		};
	});
}

function RailStat({
	value,
	label,
}: {
	readonly value: string;
	readonly label: string;
}) {
	return (
		<div className="flex items-baseline justify-between gap-4 border-t-2 border-stroke-subtle py-2">
			<span className={`${MONO_LABEL} text-fg-muted`}>{label}</span>
			<span className="font-mono text-lg font-bold tabular-nums text-fg-primary">
				{value}
			</span>
		</div>
	);
}

export function VariantAnnotated({ band }: { readonly band: Band }) {
	const { totals, usage, points, rows } = band;
	const quiet = usage.stacks === 0;
	const showChart = liveDays(points) >= 2;
	const markers = showChart ? markersFor(band) : [];

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-10">
			<div className="mx-auto grid w-full max-w-content gap-x-12 gap-y-8 md:grid-cols-12">
				{/* Data rail */}
				<div className="flex flex-col md:col-span-4">
					<span className="flex items-center gap-3">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime`}>
							{"// the last 24 hours"}
						</span>
					</span>

					<div className="mt-6 text-6xl font-black leading-none tracking-tighter tabular-nums text-accent-lime">
						{quiet ? "-" : fmtTokens(usage.tokens)}
					</div>
					<div className={`${MONO_LABEL} mt-2 text-fg-muted`}>
						tokens measured
					</div>

					<div className="mt-6">
						<RailStat
							value={quiet ? "-" : fmtCount(usage.sessions)}
							label="sessions"
						/>
						<RailStat
							value={quiet ? "-" : fmtCount(usage.projects)}
							label="projects"
						/>
						<RailStat
							value={quiet ? "-" : fmtCount(usage.tools)}
							label="tools"
						/>
						<RailStat
							value={String(totals.stacksSeen)}
							label={totals.stacksSeen === 1 ? "stack" : "stacks"}
						/>
					</div>

					<div className="mt-auto flex items-center gap-4 pt-6">
						<Button asChild size="sm">
							<Link to="/stacks/new" className={MONO_LABEL}>
								measure yours <ArrowRight className="h-3 w-3" />
							</Link>
						</Button>
						<Link
							to="/activity"
							className={`${MONO_LABEL} text-fg-muted transition-colors hover:text-fg-primary`}
						>
							all activity
						</Link>
					</div>
				</div>

				{/* The instrument: chart + event markers */}
				<div className="md:col-span-8">
					<div
						className={`${MONO_LABEL} mb-3 flex justify-between text-fg-muted`}
					>
						<span>tokens · 14 days</span>
						<span>events pinned where they landed</span>
					</div>
					<div
						className="relative border-2 border-stroke-subtle"
						style={{ height: CHART_HEIGHT }}
					>
						{showChart ? (
							<Sparkline
								points={points}
								ariaLabel="Tokens measured per day, last 14 days"
								width={900}
								height={CHART_HEIGHT}
								fluid
								area
								className="h-full w-full"
							/>
						) : (
							<div className="flex h-full items-center justify-center font-mono text-xs text-fg-muted">
								not enough readings yet - sync a stack to draw the line
							</div>
						)}

						{markers.map((marker, i) => (
							<div
								key={marker.row.id}
								className="group absolute"
								style={{
									left: `${marker.x * 100}%`,
									top: `${marker.y * 100}%`,
								}}
							>
								<button
									type="button"
									aria-label={`${rowHandle(marker.row)} - ${rowSummary(marker.row)}`}
									className="-translate-x-1/2 -translate-y-1/2 block h-3 w-3 bg-accent-lime ring-2 ring-bg-panel transition-transform group-hover:scale-150 focus-visible:scale-150"
								/>
								<div
									className={`pointer-events-none absolute z-10 hidden w-56 border-2 border-stroke-strong bg-bg-canvas p-3 group-hover:block group-focus-within:block ${
										marker.x > 0.6 ? "right-2" : "left-2"
									} ${marker.y < 0.4 ? "top-3" : "bottom-3"}`}
								>
									<div className="flex items-baseline justify-between gap-2">
										<span className="truncate font-mono text-xs font-semibold text-fg-primary">
											{rowHandle(marker.row)}
										</span>
										<RelativeTime
											at={marker.row.at}
											className="shrink-0 font-mono text-[10px] text-fg-muted"
										/>
									</div>
									<div className="mt-1 font-mono text-xs text-fg-secondary">
										{rowSummary(marker.row)}
									</div>
								</div>
								{/* Marker index, so the pins read as a sequence at a glance */}
								<span
									aria-hidden="true"
									className="absolute left-2 top-2 font-mono text-[10px] font-bold text-accent-lime"
								>
									{String(rows.length - i).padStart(2, "0")}
								</span>
							</div>
						))}
					</div>
					<div className="mt-2 flex justify-between font-mono text-[10px] text-fg-muted/60">
						<span>14 days ago</span>
						<span>now</span>
					</div>
				</div>
			</div>
		</section>
	);
}
