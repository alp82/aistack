/**
 * PROTOTYPE - throwaway. Variant G: "Strip".
 *
 * Centered like today's hero, but the reel is gone: the four levels sit in a
 * static bordered strip under the counter. The counter is the session
 * reading; the 24-hour total is the first cell of the strip. The latest line
 * names the STACK label.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { Button } from "@/components/ui/button";
import type { Band } from "../feed";
import { fmtCount, fmtTokens, MONO_LABEL, rowSummary } from "../feed";
import { TokenTrend } from "../PulseHero";
import { fmtSeconds, useSessionTokens } from "./useSessionTokens";

export const VARIANT_STRIP_NAME = "Strip - centered counter, cells below";

export function VariantStrip({ band }: { readonly band: Band }) {
	const { totals, usage, points, rows } = band;
	const session = useSessionTokens(band);
	const latest = rows[0];

	const cells: [string, string][] = [
		["tokens · 24h", fmtTokens(usage.tokens)],
		["sessions", fmtCount(usage.sessions)],
		["projects", fmtCount(usage.projects)],
		["tools", fmtCount(usage.tools)],
		["stacks", fmtCount(totals.stacksSeen)],
	];

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-14">
			<div className="mx-auto flex w-full max-w-content flex-col items-center text-center">
				<span className="flex items-center gap-3">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
						<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
					</span>
					<span className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-accent-lime">
						Tokens since you opened this page
					</span>
				</span>

				<div className="mt-6 text-5xl font-black leading-none tracking-tighter text-fg-primary tabular-nums md:text-8xl">
					{session.tokens.toLocaleString("en-US")}
				</div>
				<div className="mt-3 font-mono text-xs text-fg-muted">
					{fmtSeconds(session.seconds)} at the last 24 hours' pace
				</div>

				<div className="mt-10 grid w-full max-w-3xl grid-cols-2 border-2 border-stroke-strong md:grid-cols-5">
					{cells.map(([label, value], i) => (
						<div
							key={label}
							className={`flex flex-col gap-1 px-4 py-3 ${
								i > 0 ? "border-l-0 md:border-l-2" : ""
							} border-stroke-strong ${i >= 2 ? "border-t-2 md:border-t-0" : ""} ${
								i % 2 === 1 ? "border-l-2 md:border-l-2" : ""
							}`}
						>
							<span className={`${MONO_LABEL} text-fg-muted`}>{label}</span>
							<span className="font-mono text-base font-bold text-fg-primary tabular-nums">
								{value}
							</span>
						</div>
					))}
				</div>

				<TokenTrend points={points} />

				{latest ? (
					<div className="mt-6 font-mono text-xs text-fg-muted">
						latest:{" "}
						<Link
							to="/stacks/$slug"
							params={{ slug: latest.stack.slug }}
							className="font-semibold text-fg-secondary hover:text-accent-lime"
						>
							{latest.stack.name}
						</Link>{" "}
						{rowSummary(latest)} ·{" "}
						<RelativeTime at={latest.at} className="text-fg-muted/60" />
					</div>
				) : null}

				<div className="mt-8 flex items-center gap-6">
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
