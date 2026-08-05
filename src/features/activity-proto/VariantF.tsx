/**
 * PROTOTYPE — throwaway. Wayfinder ticket #96 (map #76).
 *
 * F — THE BAND TRAVELS. The page INHERITS the landing band verbatim.
 *
 * The same 24-hour claim opens the page: live dot, three activity counts in
 * the header bar, four measured tiles, watermark. Below it the full stream,
 * grouped by day, paged with an "older" button (10 at a time) — the shape the
 * `by_createdAt` index serves directly.
 *
 * The bet: the visitor who pressed "all activity" wants MORE of the same
 * room, and the numbers keep the thin case warm — three rows under four big
 * numbers reads as a quiet site, not a broken page.
 * The risk: the same four numbers twice in two clicks reads as filler, and
 * the band eats a full screen before the first row.
 */

import { useState } from "react";
import { Sparkline } from "@/features/charts";
import {
	liveDays,
	tokensPerDay,
	totalsFor,
	usageFor,
} from "../landing/feed-prototype/aggregate";
import {
	dayBucket,
	fmtCount,
	fmtTokens,
	MONO_LABEL,
} from "../landing/feed-prototype/format";
import { Row } from "../landing/feed-prototype/rows";
import type { DisplayRow } from "./useActivityPrototype";

const PAGE = 10;
const WATERMARK_MIN_DAYS = 3;

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

export function VariantF({ rows }: { rows: DisplayRow[] }) {
	const [limit, setLimit] = useState(PAGE);
	const now = Date.now();
	const totals = totalsFor(rows, 1440);
	const usage = usageFor(rows, 1440);
	const quiet = usage.stacks === 0;
	const updates = totals.published + totals.changed;
	const points = tokensPerDay(rows, now);
	const showWatermark = liveDays(points) >= WATERMARK_MIN_DAYS;
	const shown = rows.slice(0, limit);

	let lastDay = "";

	return (
		<div className="min-h-screen bg-bg-canvas">
			<section className="relative overflow-hidden border-b-2 border-stroke-strong bg-bg-panel px-6 py-16">
				{showWatermark ? (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-[0.18] [mask-image:linear-gradient(to_top,black,transparent)]"
					>
						<Sparkline
							points={points}
							ariaLabel=""
							width={1600}
							height={192}
							className="h-full w-full"
						/>
					</div>
				) : null}
				<div className="relative mx-auto w-full max-w-content">
					<h1 className="mb-10 text-4xl font-black tracking-tighter text-fg-primary md:text-5xl">
						ACTIVITY
					</h1>
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
						<span className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
							<span className="flex items-baseline gap-2">
								<span className="font-mono text-sm font-semibold tabular-nums text-fg-secondary">
									{totals.syncs}
								</span>
								<span className={`${MONO_LABEL} text-fg-muted/60`}>
									{totals.syncs === 1 ? "sync" : "syncs"}
								</span>
							</span>
							<span className="flex items-baseline gap-2">
								<span className="font-mono text-sm font-semibold tabular-nums text-fg-secondary">
									{updates}
								</span>
								<span className={`${MONO_LABEL} text-fg-muted/60`}>
									{updates === 1 ? "stack update" : "stack updates"}
								</span>
							</span>
							<span className="flex items-baseline gap-2">
								<span className="font-mono text-sm font-semibold tabular-nums text-fg-secondary">
									{quiet ? "—" : usage.models}
								</span>
								<span className={`${MONO_LABEL} text-fg-muted/60`}>models</span>
							</span>
						</span>
					</div>
					<div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
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
					</div>
					<div className="mt-10 font-mono text-xs text-fg-muted/50">
						measured across {totals.stacksSeen}{" "}
						{totals.stacksSeen === 1 ? "stack" : "stacks"}
					</div>
				</div>
			</section>

			<div className="px-6 py-16">
				<div className="mx-auto w-full max-w-content">
					{shown.map((row) => {
						const day = dayBucket(row.minutesAgo, now);
						const isNewDay = day !== lastDay;
						lastDay = day;
						return (
							<div key={row.id}>
								{isNewDay ? (
									<div
										className={`${MONO_LABEL} mb-4 mt-12 text-fg-muted first:mt-0`}
									>
										{day}
									</div>
								) : null}
								<ul>
									<Row row={row} detail="minimal" />
								</ul>
							</div>
						);
					})}

					{rows.length > limit ? (
						<button
							type="button"
							onClick={() => setLimit((l) => l + PAGE)}
							className={`${MONO_LABEL} mt-12 border-2 border-stroke-strong px-6 py-3 text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime`}
						>
							older →
						</button>
					) : (
						<p className="mt-12 font-mono text-xs text-fg-muted/40">
							that is everything since instrumentation went live.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
