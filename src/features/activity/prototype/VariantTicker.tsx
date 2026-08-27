/**
 * PROTOTYPE - throwaway. Variant C: "Ticker".
 *
 * Trading-floor shape. The feed is demoted to a single scrolling ticker strip
 * along the section's top edge; the body is a readable token chart (axes,
 * tooltip) beside a tight stat column with the CTA. Target height ~320px.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { Button } from "@/components/ui/button";
import { TimeSeriesChart } from "@/features/charts";
import type { Band } from "../feed";
import { fmtCount, fmtTokens, MONO_LABEL } from "../feed";
import { rowHandle, rowSummary } from "./summary";

export const VARIANT_TICKER_NAME = "Ticker - trading floor";

export function VariantTicker({ band }: { readonly band: Band }) {
	const { totals, usage, points, rows } = band;
	const quiet = usage.stacks === 0;
	// Doubled content so the marquee loop is seamless at -50%.
	const loops = [0, 1] as const;

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel">
			<style>{`
				@keyframes pulse-ticker {
					from { transform: translateX(0); }
					to { transform: translateX(-50%); }
				}
			`}</style>

			{/* The whole feed lives here, one line, moving. */}
			<div className="group/ticker overflow-hidden border-b-2 border-stroke-subtle bg-bg-canvas">
				<div
					role="marquee"
					aria-label="Latest activity"
					className="flex w-max items-baseline gap-10 whitespace-nowrap px-6 py-2 font-mono text-xs [animation:pulse-ticker_35s_linear_infinite] group-hover/ticker:[animation-play-state:paused] motion-reduce:[animation:none]"
				>
					{loops.map((loop) => (
						<div
							key={loop}
							className="flex items-baseline gap-10"
							aria-hidden={loop === 1}
						>
							{rows.map((row) => (
								<span
									key={`${loop}-${row.id}`}
									className="flex items-baseline gap-2"
								>
									<span className="text-accent-lime">▸</span>
									<Link
										to="/stacks/$slug"
										params={{ slug: row.stack.slug }}
										className="font-semibold text-fg-primary hover:text-accent-lime"
										tabIndex={loop === 1 ? -1 : undefined}
									>
										{rowHandle(row)}
									</Link>
									<span className="text-fg-secondary">{rowSummary(row)}</span>
									<RelativeTime at={row.at} className="text-fg-muted/60" />
								</span>
							))}
						</div>
					))}
				</div>
			</div>

			<div className="mx-auto grid w-full max-w-content gap-x-12 gap-y-8 px-6 py-8 md:grid-cols-12">
				<div className="md:col-span-8">
					<div className="mb-4 flex items-center gap-3">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime`}>
							{"// tokens measured · 14 days"}
						</span>
					</div>
					<TimeSeriesChart
						series={[{ key: "tokens", label: "Tokens measured", points }]}
						ariaLabel="Tokens measured per day, last 14 days"
						valueLabel="Tokens"
						formatValue={fmtTokens}
						height={210}
						initialWidth={760}
					/>
				</div>

				<div className="flex flex-col md:col-span-4">
					<div className="text-6xl font-black leading-none tracking-tighter tabular-nums text-accent-lime">
						{quiet ? "-" : fmtTokens(usage.tokens)}
					</div>
					<div className={`${MONO_LABEL} mt-2 text-fg-muted`}>
						tokens · last 24 hours
					</div>

					<div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-sm tabular-nums text-fg-secondary">
						<span>{quiet ? "-" : fmtCount(usage.sessions)} sessions</span>
						<span>{quiet ? "-" : fmtCount(usage.projects)} projects</span>
						<span>{quiet ? "-" : fmtCount(usage.tools)} tools</span>
						<span>
							{totals.stacksSeen} {totals.stacksSeen === 1 ? "stack" : "stacks"}
						</span>
					</div>

					<div className="mt-auto flex flex-col gap-3 pt-6">
						<Button asChild>
							<Link to="/stacks/new" className={MONO_LABEL}>
								put your stack on this chart <ArrowRight className="h-3 w-3" />
							</Link>
						</Button>
						<Link
							to="/activity"
							className={`${MONO_LABEL} text-fg-muted transition-colors hover:text-fg-primary`}
						>
							all activity →
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
