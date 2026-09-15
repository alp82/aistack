/**
 * PROTOTYPE - throwaway. The parts every Strip variation shares: the live
 * dot and label, the SpeedingText counter, the chart, the latest line (stack
 * label, as Strip locked it) under the CTA row, and the chart with its range
 * select under the marks. Each variation supplies only
 * the strip itself.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { RelativeTime } from "@/components/RelativeTime";
import { Button } from "@/components/ui/button";
import type { Band } from "../feed";
import { MONO_LABEL, rowSummary } from "../feed";
import { TokenTrend } from "../PulseHero";
import { fmtSeconds, SessionCounter, useSessionPace } from "./SessionCounter";

export function StripFrame({
	band,
	label,
	suffix,
	sub,
	strip,
}: {
	readonly band: Band;
	readonly label: string;
	readonly suffix?: string;
	readonly sub?: (seconds: number) => ReactNode;
	readonly strip: ReactNode;
}) {
	const pace = useSessionPace(band);
	const latest = band.rows[0];

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-14">
			<div className="mx-auto flex w-full max-w-content flex-col items-center text-center">
				<span className="flex items-center gap-3">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
						<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
					</span>
					<span className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-accent-lime">
						{label}
					</span>
				</span>

				<SessionCounter
					pace={pace}
					suffix={suffix}
					className="mt-6 text-fg-primary"
				/>
				{sub ? (
					<div className="mt-1 font-mono text-xs text-fg-muted">
						{sub(pace.seconds)}
					</div>
				) : null}

				{strip}

				<TokenTrend points={band.points} controls="below" />

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
			</div>
		</section>
	);
}

export { fmtSeconds };
