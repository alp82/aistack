import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/features/charts";
import { FeedRowItem } from "./FeedRows";
import type { Band } from "./feed";
import { fmtCount, fmtTokens, liveDays, MONO_LABEL } from "./feed";

/**
 * The pulse of the site — variant E1, locked in #84 over four rounds, and
 * carried verbatim onto `/activity` by #96.
 *
 *   // the last 24 hours              2 syncs · 1 stack update · 8 models
 *
 *   4.99B            596              41               22
 *   TOKENS MEASURED  SESSIONS         PROJECTS         TOOLS
 *
 *   as it lands
 *     AI Stack measured usage moved +285M ...
 *
 *   measured across 4 stacks                        [ ALL ACTIVITY → ]
 *
 * HEADLINE IS WHAT THE SITE MEASURED, secondary is what the site did. A visitor
 * who reads only the big row learns how much real work these machines carry,
 * and never has to care that a sync is the mechanism that reported it.
 *
 * RULE BUDGET — ONE horizontal line inside the band, the one across the tile
 * tops. Everything below is separated by space. Vertical rules stay: the feed
 * rows keep their left border.
 *
 * QUIET IS NOT ZERO. With no sync in the window every measured tile renders an
 * em dash. A row of zeroes reads as a broken site rather than a quiet one. All
 * four tiles take the SAME guard — the token tile once tested its own value,
 * so it read as quiet whenever the number happened to be zero.
 *
 * ALL FOUR TILES ARE LEVELS (#128, built in #129). The token tile carries no
 * sign and may fall. It used to print a movement with a `+`, summed over the
 * risers only, which no true sentence described — and it sat above rows that
 * are movements and could point the other way.
 *
 * The two `page` trims (#96): a tighter header, and no footer row — the page
 * does not repeat the landing band's footnote, and the button that led there
 * has nowhere left to go.
 */

const WATERMARK_MIN_DAYS = 3;
const WATERMARK_HEIGHT = 224;

function Stat({
	value,
	label,
	accent,
}: {
	readonly value: string;
	readonly label: string;
	readonly accent?: boolean;
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

function Fact({
	value,
	label,
}: {
	readonly value: string;
	readonly label: string;
}) {
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
	band,
	variant,
}: {
	readonly band: Band;
	readonly variant: "landing" | "page";
}) {
	const { totals, usage, points, rows } = band;
	const quiet = usage.stacks === 0;
	const showWatermark = liveDays(points) >= WATERMARK_MIN_DAYS;
	const onPage = variant === "page";

	return (
		<section
			className={`relative overflow-hidden border-b-2 border-stroke-strong bg-bg-panel px-6 ${
				onPage ? "py-10" : "py-20"
			}`}
		>
			{showWatermark ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-[0.18] [mask-image:linear-gradient(to_top,black,transparent)]"
				>
					<Sparkline
						points={points}
						ariaLabel=""
						width={1600}
						height={WATERMARK_HEIGHT}
						fluid
						className="h-full w-full"
					/>
				</div>
			) : null}

			<div className="relative mx-auto w-full max-w-content">
				{onPage ? (
					<h1 className="mb-6 text-4xl font-black tracking-tighter text-fg-primary md:text-5xl">
						ACTIVITY
					</h1>
				) : null}

				{/* The secondary three live HERE, in a row the band already pays for:
				    no extra rule, no extra row of vertical space. */}
				<div
					className={`flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3 ${
						onPage ? "mb-8" : "mb-12"
					}`}
				>
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
						<Fact
							value={String(totals.syncs)}
							label={totals.syncs === 1 ? "sync" : "syncs"}
						/>
						<Fact
							value={String(totals.updates)}
							label={totals.updates === 1 ? "stack update" : "stack updates"}
						/>
						<Fact value={quiet ? "—" : String(usage.models)} label="models" />
					</span>
				</div>

				<div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
					<Stat
						value={quiet ? "—" : fmtTokens(usage.tokens)}
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

				{onPage ? null : (
					<>
						<div className="mt-16">
							<div className={`${MONO_LABEL} mb-6 text-fg-muted`}>
								as it lands
							</div>
							<ul className="space-y-2">
								{rows.map((row) => (
									<FeedRowItem key={row.id} row={row} />
								))}
							</ul>
						</div>

						<div className="mt-10 flex flex-wrap items-center justify-between gap-6">
							<span className="font-mono text-xs text-fg-muted/50">
								measured across {totals.stacksSeen}{" "}
								{totals.stacksSeen === 1 ? "stack" : "stacks"}
							</span>
							<Button asChild variant="outline" size="lg">
								<Link to="/activity" className={MONO_LABEL}>
									all activity <ArrowRight className="h-3 w-3" />
								</Link>
							</Button>
						</div>
					</>
				)}
			</div>
		</section>
	);
}
