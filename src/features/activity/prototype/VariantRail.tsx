/**
 * PROTOTYPE - throwaway. Variant H: "Rail".
 *
 * A left rail carries every figure as a list, the session counter first and
 * the 24-hour levels under it, with the latest line and the CTA at the rail's
 * foot. The chart is the primary object and takes the whole main column. The
 * latest line names the creator AND the stack label.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { Button } from "@/components/ui/button";
import type { Band } from "../feed";
import { fmtCount, fmtTokens, MONO_LABEL, rowSummary } from "../feed";
import { TokenTrend } from "../PulseHero";
import { fmtSeconds, useSessionTokens } from "./useSessionTokens";

export const VARIANT_RAIL_NAME = "Rail - list left, chart as the object";

export function VariantRail({ band }: { readonly band: Band }) {
	const { totals, usage, points, rows } = band;
	const session = useSessionTokens(band);
	const latest = rows[0];

	const list: [string, string][] = [
		["last 24h", `${fmtTokens(usage.tokens)} tokens`],
		["sessions", fmtCount(usage.sessions)],
		["projects", fmtCount(usage.projects)],
		["tools", fmtCount(usage.tools)],
		["stacks", fmtCount(totals.stacksSeen)],
	];

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-14">
			<div className="mx-auto grid w-full max-w-content gap-10 md:grid-cols-[18rem_1fr]">
				<aside className="flex flex-col md:border-r-2 md:border-stroke-strong md:pr-8">
					<span className="flex items-center gap-3">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime`}>
							Since you opened this page
						</span>
					</span>
					<div className="mt-3 text-4xl font-black leading-none tracking-tighter text-fg-primary tabular-nums">
						{session.tokens.toLocaleString("en-US")}
					</div>
					<div className="mt-1 font-mono text-[11px] text-fg-muted">
						tokens · {fmtSeconds(session.seconds)} · 24h pace
					</div>

					<ul className="mt-8 border-t-2 border-stroke-strong">
						{list.map(([label, value]) => (
							<li
								key={label}
								className="flex items-baseline justify-between gap-3 border-b border-stroke-muted py-2"
							>
								<span className={`${MONO_LABEL} text-fg-muted`}>{label}</span>
								<span className="font-mono text-sm font-bold text-fg-primary tabular-nums">
									{value}
								</span>
							</li>
						))}
					</ul>

					{latest ? (
						<div className="mt-8 font-mono text-xs text-fg-muted">
							<span className={`${MONO_LABEL} block text-fg-muted`}>
								latest
							</span>
							<Link
								to="/stacks/$slug"
								params={{ slug: latest.stack.slug }}
								className="mt-1 block font-semibold text-fg-secondary hover:text-accent-lime"
							>
								{latest.stack.creator} · {latest.stack.name}
							</Link>
							<span className="block">
								{rowSummary(latest)} ·{" "}
								<RelativeTime at={latest.at} className="text-fg-muted/60" />
							</span>
						</div>
					) : null}

					<div className="mt-8 flex flex-col items-start gap-4">
						<Button asChild size="lg">
							<Link to="/sync" className={MONO_LABEL}>
								add your tokens <ArrowRight className="h-3 w-3" />
							</Link>
						</Button>
						<Link
							to="/activity"
							className={`${MONO_LABEL} text-fg-muted transition-colors hover:text-fg-primary`}
						>
							all activity
						</Link>
					</div>
				</aside>

				<div className="flex flex-col items-center justify-center [&>div]:mt-0 [&>div]:max-w-none">
					<TokenTrend points={points} />
				</div>
			</div>
		</section>
	);
}
