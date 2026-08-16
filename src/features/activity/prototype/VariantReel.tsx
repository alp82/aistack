/**
 * PROTOTYPE - throwaway. Variant E: "Reel".
 *
 * Key insights take turns on one bold stage, cycled by React Bits Pro's
 * SpeedingText in words mode - each phrase races out and the next smears in.
 * Left-anchored so it reads like a headline ticker. One CTA. No feed.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import SpeedingText from "@/components/speeding-text";
import { Button } from "@/components/ui/button";
import type { Band } from "../feed";
import { fmtCount, fmtTokens, MONO_LABEL } from "../feed";

export const VARIANT_REEL_NAME = "Reel - insights take turns";

function phrasesFor(band: Band): string[] {
	const { totals, usage } = band;
	return [
		`${fmtTokens(usage.tokens)} tokens · 24h`,
		`${fmtCount(usage.sessions)} sessions`,
		`${fmtCount(usage.projects)} projects`,
		`${totals.stacksSeen} ${totals.stacksSeen === 1 ? "stack" : "stacks"} in`,
	];
}

export function VariantReel({ band }: { readonly band: Band }) {
	const quiet = band.usage.stacks === 0;
	const phrases = phrasesFor(band);

	return (
		<section className="border-b-2 border-stroke-strong bg-bg-panel px-6 py-12">
			<div className="mx-auto w-full max-w-content">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<span className="flex items-center gap-3">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime`}>
							{"// live from the stacks · taking turns"}
						</span>
					</span>
					<Link
						to="/activity"
						className={`${MONO_LABEL} text-fg-muted transition-colors hover:text-fg-primary`}
					>
						all activity →
					</Link>
				</div>

				<div className="mt-8 tracking-tighter text-fg-primary">
					{quiet ? (
						<div className="text-7xl font-black leading-none">
							a quiet day
							<span className={`${MONO_LABEL} mt-4 block text-fg-muted`}>
								no sync in the last 24 hours
							</span>
						</div>
					) : (
						<>
							<SpeedingText
								words={phrases}
								interval={2200}
								swapDuration={520}
								travel={120}
								italic={false}
								fontWeight={900}
								fontSize={88}
								textColor="currentColor"
								align="left"
								height="8rem"
								className="hidden md:flex"
							/>
							<SpeedingText
								words={phrases}
								interval={2200}
								swapDuration={520}
								travel={70}
								italic={false}
								fontWeight={900}
								fontSize={40}
								textColor="currentColor"
								align="left"
								height="4rem"
								className="md:hidden"
							/>
						</>
					)}
				</div>

				<div className="mt-8 flex items-center gap-6">
					<Button asChild size="lg">
						<Link to="/stacks/new" className={MONO_LABEL}>
							add your tokens <ArrowRight className="h-3 w-3" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
