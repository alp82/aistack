/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * VARIANT A — Leaderboard-first. The ranked table is the page.
 *
 * The position this variant argues: **a leaderboard with charts on it is two
 * pages**. So there is no chart module here at all. The only graphic is a bar
 * inside the tokens cell, drawn against the leader, and it is furniture on a
 * number rather than a figure to read.
 *
 * It answers both ride-along questions by refusing them:
 *   1. Which charts earn a place — none.
 *   2. Token- or stack-weighted shares — neither. Every share on this page is
 *      one stack's own model mix, which is a fact about that row and needs no
 *      population weighting. The weight switch does nothing here, on purpose.
 *
 * Sessions rides along as a muted column. #82 held it in reserve as the swap
 * for tokens; this is the variant with the room to judge whether the token
 * column reads as meaningless beside it.
 */

import { Link } from "@tanstack/react-router";
import { GridBackground } from "@/components/GridBackground";
import { cn } from "@/lib/utils";
import type { Aggregate, RankedStack } from "./aggregate";
import { Pager } from "./bits";
import * as f from "./format";

const PAGE_SIZE = 10;

export const VARIANT_A_NAME = "Leaderboard-first — the board is the page";

export function VariantA({
	agg,
	page,
	onPage,
}: {
	readonly agg: Aggregate;
	readonly page: number;
	readonly onPage: (p: number) => void;
}) {
	const totalPages = Math.max(1, Math.ceil(agg.living.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const rows = agg.living.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	return (
		<div className="min-h-screen bg-bg-canvas">
			<GridBackground />
			<section className="relative z-10 px-6 py-20 md:px-12">
				<div className="mx-auto max-w-content">
					<p className="font-mono text-sm text-accent-lime">
						{"//"} LEADERBOARD
					</p>
					<h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-tighter text-fg-primary md:text-8xl">
						Who is
						<br />
						spending what
					</h1>

					{/* The one honest header line. Everything the page claims, in a
					    sentence, with n in it. */}
					<p className="mt-8 border-l-4 border-accent-lime pl-6 font-mono text-sm leading-relaxed text-fg-secondary">
						Measured across{" "}
						<strong className="text-fg-primary">{agg.stackCount}</strong> stacks
						·{" "}
						<strong className="text-fg-primary">
							{f.tokens(agg.totalTokens)}
						</strong>{" "}
						tokens · at least{" "}
						<strong className="text-fg-primary">
							{f.usd(agg.spendLowerBound)}
						</strong>{" "}
						· 30 days each
					</p>

					<Board rows={rows} nowMs={agg.nowMs} />

					<Pager
						page={safePage}
						totalPages={totalPages}
						onPage={onPage}
						className="mt-10"
					/>

					{agg.stale.length > 0 && <StaleGroup agg={agg} />}

					<Footnotes agg={agg} />
				</div>
			</section>
		</div>
	);
}

const GRID =
	"grid grid-cols-[3rem_minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_5rem_5rem] gap-4 items-center";

function Board({
	rows,
	nowMs,
}: {
	readonly rows: readonly RankedStack[];
	readonly nowMs: number;
}) {
	return (
		<div className="mt-12 border-2 border-stroke-strong">
			<div
				className={cn(
					GRID,
					"border-b-2 border-stroke-strong bg-bg-panel px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-fg-muted",
				)}
			>
				<span>#</span>
				<span>Stack</span>
				<span className="text-right">Tokens</span>
				<span className="text-right">Spend</span>
				<span>Top model</span>
				<span className="text-right">Sessions</span>
				<span className="text-right">Synced</span>
			</div>
			{rows.length === 0 && (
				<p className="px-5 py-8 font-mono text-sm text-fg-muted">
					Nothing to rank. Every measured stack has been quiet for more than
					seven days, so they are all listed below instead.
				</p>
			)}
			<ul>
				{rows.map((s) => (
					<li
						key={s.id}
						className={cn(
							GRID,
							"relative border-b border-stroke-subtle px-5 py-4 last:border-b-0 hover:bg-bg-panel",
						)}
					>
						<span className="font-mono text-2xl font-black text-fg-muted">
							{s.rank}
						</span>

						<span className="min-w-0">
							<Link
								to="/stacks/$slug"
								params={{ slug: s.slug }}
								className="block truncate font-mono text-sm font-bold text-fg-primary hover:text-accent-lime"
							>
								{s.name}
							</Link>
							<span className="mt-0.5 block truncate font-mono text-xs text-fg-muted">
								@{s.handle} · {s.activeHarnesses.join(" + ")}
							</span>
						</span>

						{/* The only graphic on the page: the row's share of the leader,
						    behind the number it is about. */}
						<span className="relative text-right">
							<span
								aria-hidden="true"
								className="absolute inset-y-0 right-0 bg-accent-lime/15"
								style={{ width: `${Math.max(s.ofLeader * 100, 0.4)}%` }}
							/>
							<span className="relative font-mono text-base font-black text-fg-primary">
								{f.tokens(s.tokens)}
							</span>
						</span>

						<span className="text-right">
							{s.spendLowerBound === null ? (
								<span className="font-mono text-base text-fg-muted">—</span>
							) : (
								<>
									<span className="block font-mono text-base font-bold text-fg-primary">
										{s.spendExact ? "" : "≥ "}
										{f.usd(s.spendLowerBound)}
									</span>
									<span className="block font-mono text-[11px] text-fg-muted">
										{f.pct(s.coverage, 1)} priced
									</span>
								</>
							)}
						</span>

						<span className="min-w-0">
							{s.topModel === null ? (
								<span className="font-mono text-xs text-fg-muted">
									no model named
								</span>
							) : (
								<>
									<span className="block truncate font-mono text-sm text-fg-primary">
										{s.topModel.name}
									</span>
									<span className="block font-mono text-[11px] text-fg-muted">
										{f.pct(s.topModel.share)} of this stack
									</span>
								</>
							)}
						</span>

						<span className="text-right font-mono text-sm text-fg-secondary">
							{f.count(s.sessions)}
						</span>

						<span className="text-right font-mono text-xs text-fg-muted">
							{f.ago(s.lastSyncMs, nowMs)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function StaleGroup({ agg }: { readonly agg: Aggregate }) {
	return (
		<section className="mt-16">
			<h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
				Not synced in the last 7 days — listed, not ranked
			</h2>
			<ul className="mt-4 border border-dashed border-stroke-subtle">
				{agg.stale.slice(0, 12).map((s) => (
					<li
						key={s.id}
						className="flex items-baseline justify-between gap-4 border-b border-stroke-subtle px-5 py-3 last:border-b-0"
					>
						<Link
							to="/stacks/$slug"
							params={{ slug: s.slug }}
							className="min-w-0 truncate font-mono text-sm text-fg-secondary hover:text-accent-lime"
						>
							{s.name} <span className="text-fg-muted">@{s.handle}</span>
						</Link>
						<span className="shrink-0 font-mono text-xs text-fg-muted">
							{f.tokens(s.tokens)} · last synced {f.shortDay(s.lastSyncMs)}
						</span>
					</li>
				))}
				{agg.stale.length > 12 && (
					<li className="px-5 py-3 font-mono text-xs text-fg-muted">
						and {agg.stale.length - 12} more
					</li>
				)}
			</ul>
		</section>
	);
}

function Footnotes({ agg }: { readonly agg: Aggregate }) {
	return (
		<div className="mt-16 max-w-2xl space-y-3 border-t-2 border-stroke-strong pt-6 font-mono text-xs leading-relaxed text-fg-muted">
			<p>
				Rank is raw measured tokens over each stack's own last 30 days. The
				windows are offset by up to {Math.round(agg.windowSpreadDays)} days and
				cannot be aligned — a stack's window ends when it last synced.
			</p>
			<p>
				Every spend figure is a lower bound. {agg.costPublishers} of{" "}
				{agg.stackCount} stacks publish a cost at all, and{" "}
				{f.pct(agg.spendCoverage, 1)} of their tokens carry a citable price. A
				stack that keeps cost private shows —, never a zero.
			</p>
			<p>
				{f.pct(agg.unattributedShare, 1)} of measured tokens carry no model
				name. They count toward a stack's total and lead no row.
			</p>
		</div>
	);
}
