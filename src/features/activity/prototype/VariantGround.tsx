/**
 * PROTOTYPE — throwaway. Variant A: "Ground".
 *
 * The token graph stops being a watermark and becomes the section's ground:
 * a full-bleed, full-strength area chart the content stands ON. One giant
 * number, one CTA, and the whole feed compressed to a single mono ticker
 * line along the bottom edge. Target height ~340px.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/features/charts";
import type { Band } from "../feed";
import { fmtCount, fmtTokens, liveDays, MONO_LABEL } from "../feed";
import { RelativeTime } from "../RelativeTime";
import { rowHandle, rowSummary } from "./summary";

export const VARIANT_GROUND_NAME = "Ground — chart as the floor";

export function VariantGround({ band }: { readonly band: Band }) {
	const { totals, usage, points, rows } = band;
	const quiet = usage.stacks === 0;
	const showChart = liveDays(points) >= 2;

	return (
		<section className="relative overflow-hidden border-b-2 border-stroke-strong bg-bg-panel">
			{showChart ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 bottom-8 h-[260px] [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
				>
					<Sparkline
						points={points}
						ariaLabel=""
						width={1600}
						height={260}
						fluid
						area
						className="h-full w-full"
					/>
				</div>
			) : null}

			<div className="relative mx-auto flex min-h-[340px] w-full max-w-content flex-col justify-between px-6 py-8">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<span className="flex items-center gap-3">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime`}>
							{"// the last 24 hours"}
						</span>
					</span>
					<span className="flex items-center gap-4">
						<Link
							to="/activity"
							className={`${MONO_LABEL} text-fg-muted transition-colors hover:text-fg-primary`}
						>
							all activity
						</Link>
						<Button asChild size="sm">
							<Link to="/stacks/new" className={MONO_LABEL}>
								measure yours <ArrowRight className="h-3 w-3" />
							</Link>
						</Button>
					</span>
				</div>

				<div className="mt-6">
					<div className="text-7xl font-black leading-none tracking-tighter tabular-nums text-fg-primary md:text-8xl">
						{quiet ? "—" : fmtTokens(usage.tokens)}
					</div>
					<div className={`${MONO_LABEL} mt-3 text-fg-muted`}>
						tokens measured · {totals.stacksSeen}{" "}
						{totals.stacksSeen === 1 ? "stack" : "stacks"} · 14 days of readings
						behind it
					</div>
					<div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm tabular-nums text-fg-secondary">
						<span>{quiet ? "—" : fmtCount(usage.sessions)} sessions</span>
						<span>{quiet ? "—" : fmtCount(usage.projects)} projects</span>
						<span>{quiet ? "—" : fmtCount(usage.tools)} tools</span>
						<span>{quiet ? "—" : fmtCount(usage.models)} models</span>
					</div>
				</div>

				{/* The whole feed, one line. The chart already told the story. */}
				<div className="mt-8 flex items-baseline gap-4 overflow-hidden border-t-2 border-stroke-strong pt-3">
					<span className={`${MONO_LABEL} shrink-0 text-fg-muted`}>
						as it lands
					</span>
					<div className="flex gap-8 overflow-hidden whitespace-nowrap font-mono text-xs text-fg-secondary">
						{rows.map((row) => (
							<span key={row.id} className="flex shrink-0 items-baseline gap-2">
								<Link
									to="/stacks/$slug"
									params={{ slug: row.stack.slug }}
									className="font-semibold text-fg-primary hover:text-accent-lime"
								>
									{rowHandle(row)}
								</Link>
								<span>{rowSummary(row)}</span>
								<RelativeTime at={row.at} className="text-fg-muted/60" />
							</span>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
