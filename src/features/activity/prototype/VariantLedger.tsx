/**
 * PROTOTYPE - throwaway. Variant F: "Ledger".
 *
 * Two columns. Left: the session counter (tokens since you opened the page)
 * as the only big number. Right: the 24-hour figures as a static ledger, one
 * row per level, no reel. Chart spans both. The latest line names the
 * CREATOR only.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { Button } from "@/components/ui/button";
import type { Band } from "../feed";
import { fmtCount, fmtTokens, MONO_LABEL, rowSummary } from "../feed";
import { TokenTrend } from "../PulseHero";
import { fmtSeconds, useSessionTokens } from "./useSessionTokens";

export const VARIANT_LEDGER_NAME = "Ledger - counter left, list right";

export function VariantLedger({ band }: { readonly band: Band }) {
	const { totals, usage, points, rows } = band;
	const session = useSessionTokens(band);
	const latest = rows[0];

	const ledger: [string, string][] = [
		["tokens · 24h", fmtTokens(usage.tokens)],
		["sessions", fmtCount(usage.sessions)],
		["projects", fmtCount(usage.projects)],
		["tools", fmtCount(usage.tools)],
		["stacks", fmtCount(totals.stacksSeen)],
	];

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-14">
			<div className="mx-auto w-full max-w-content">
				<div className="grid gap-10 md:grid-cols-[1fr_minmax(16rem,20rem)]">
					<div className="flex flex-col">
						<span className="flex items-center gap-3">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
								<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
							</span>
							<span className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-accent-lime">
								Since you opened this page
							</span>
						</span>
						<div className="mt-6 text-6xl font-black leading-none tracking-tighter text-fg-primary tabular-nums md:text-8xl">
							{session.tokens.toLocaleString("en-US")}
						</div>
						<div className="mt-3 font-mono text-xs text-fg-muted">
							tokens in {fmtSeconds(session.seconds)}, at the last 24 hours'
							pace ({fmtTokens(Math.round(session.perSecond))}/s)
						</div>
					</div>

					<dl className="self-end border-t-2 border-stroke-strong">
						{ledger.map(([label, value]) => (
							<div
								key={label}
								className="flex items-baseline justify-between gap-4 border-b border-stroke-muted py-2"
							>
								<dt className={`${MONO_LABEL} text-fg-muted`}>{label}</dt>
								<dd className="font-mono text-lg font-bold text-fg-primary tabular-nums">
									{value}
								</dd>
							</div>
						))}
					</dl>
				</div>

				<div className="flex flex-col items-center">
					<TokenTrend points={points} />
				</div>

				{latest ? (
					<div className="mt-6 text-center font-mono text-xs text-fg-muted">
						latest:{" "}
						<Link
							to="/stacks/$slug"
							params={{ slug: latest.stack.slug }}
							className="font-semibold text-fg-secondary hover:text-accent-lime"
						>
							{latest.stack.creator}
						</Link>{" "}
						{rowSummary(latest)} ·{" "}
						<RelativeTime at={latest.at} className="text-fg-muted/60" />
					</div>
				) : null}

				<div className="mt-8 flex items-center justify-center gap-6">
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
			</div>
		</section>
	);
}
