/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * VARIANT C — Equal weight. A sticky statistics rail beside the ranked board.
 *
 * The position this variant argues: neither the population nor the ranking is
 * the page — the **reading** is. A rank means nothing without the population it
 * ranks inside, so the rail never scrolls away: whatever row you are looking
 * at, the shares that row sits inside are on screen next to it.
 *
 * Structurally it is neither A nor B stacked. The rail is small-multiple sized
 * on purpose, so no figure in it can grow into B's page, and the board is
 * denser than A's so it cannot grow into A's.
 *
 * Ride-along answers:
 *   1. Only two rankings earn a place — models and harnesses — because those
 *      are the two the rail can carry at rail width. Spend distribution and
 *      cost-per-token are the board's columns already.
 *   2. The weight switch repaints the rail, and the rail states which weighting
 *      it is under, in words, above the bars.
 */

import { Link } from "@tanstack/react-router";
import type { Aggregate, Ranking, Weight } from "./aggregate";
import { weightedValue } from "./aggregate";
import { Pager } from "./bits";
import * as f from "./format";

const PAGE_SIZE = 10;

export const VARIANT_C_NAME =
	"Equal weight — sticky stats rail beside the board";

export function VariantC({
	agg,
	weight,
	page,
	onPage,
}: {
	readonly agg: Aggregate;
	readonly weight: Weight;
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
			<div className="border-b-2 border-stroke-strong px-6 py-10 md:px-12">
				<div className="mx-auto flex max-w-content flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="font-mono text-sm text-accent-lime">
							{"//"} MEASURED · LAST 30 DAYS
						</p>
						<h1 className="mt-3 text-4xl font-black uppercase leading-none tracking-tighter text-fg-primary md:text-6xl">
							What builders run
						</h1>
					</div>
					<p className="max-w-md font-mono text-xs leading-relaxed text-fg-muted">
						Counted on {agg.stackCount} builders' own machines and published by
						them. Windows offset by up to {Math.round(agg.windowSpreadDays)}{" "}
						days.
					</p>
				</div>
			</div>

			<div className="mx-auto max-w-content px-6 py-12 md:px-12">
				<div className="grid grid-cols-1 gap-10 lg:grid-cols-[19rem_minmax(0,1fr)]">
					<aside className="lg:sticky lg:top-8 lg:self-start">
						<Rail agg={agg} weight={weight} />
					</aside>

					<main>
						<div className="flex items-baseline justify-between gap-4">
							<h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
								Ranked by measured tokens
							</h2>
							<span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
								{agg.livingCount} living · {agg.stale.length} quiet
							</span>
						</div>

						{rows.length === 0 && (
							<p className="mt-4 border-t border-stroke-subtle py-6 font-mono text-sm text-fg-muted">
								Nothing to rank — every measured stack has been quiet for more
								than seven days.
							</p>
						)}
						<ol className="mt-4 border-t border-stroke-subtle">
							{rows.map((s) => (
								<li
									key={s.id}
									className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-stroke-subtle py-4 hover:bg-bg-panel"
								>
									<span className="row-span-2 font-mono text-xl font-black text-fg-muted">
										{s.rank}
									</span>
									<Link
										to="/stacks/$slug"
										params={{ slug: s.slug }}
										className="min-w-0 truncate font-mono text-sm font-bold text-fg-primary hover:text-accent-lime"
									>
										{s.name}
										<span className="ml-2 font-normal text-fg-muted">
											@{s.handle}
										</span>
									</Link>
									<span className="whitespace-nowrap text-right font-mono text-base font-black text-fg-primary">
										{f.tokens(s.tokens)}
									</span>

									<span className="min-w-0 truncate font-mono text-xs text-fg-muted">
										{s.topModel
											? `${s.topModel.name} ${f.pct(s.topModel.share)} · `
											: "no model named · "}
										{s.activeHarnesses.join(" + ")} · synced{" "}
										{f.ago(s.lastSyncMs, agg.nowMs)}
									</span>
									<span className="whitespace-nowrap text-right font-mono text-xs text-fg-secondary">
										{s.spendLowerBound === null ? (
											<span className="text-fg-muted">cost not published</span>
										) : (
											<>
												{s.spendExact ? "" : "≥ "}
												{f.usd(s.spendLowerBound)}
												<span className="text-fg-muted">
													{" "}
													· {f.pct(s.coverage, 1)} priced
												</span>
											</>
										)}
									</span>
								</li>
							))}
						</ol>

						<Pager
							page={safePage}
							totalPages={totalPages}
							onPage={onPage}
							className="mt-8"
						/>

						{agg.stale.length > 0 && (
							<section className="mt-12">
								<h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
									Quiet — no sync in 7 days, listed not ranked
								</h3>
								<ul className="mt-3 border-t border-dashed border-stroke-subtle">
									{agg.stale.slice(0, 10).map((s) => (
										<li
											key={s.id}
											className="flex items-baseline justify-between gap-4 border-b border-dashed border-stroke-subtle py-2"
										>
											<Link
												to="/stacks/$slug"
												params={{ slug: s.slug }}
												className="min-w-0 truncate font-mono text-xs text-fg-secondary hover:text-accent-lime"
											>
												{s.name}
											</Link>
											<span className="shrink-0 font-mono text-xs text-fg-muted">
												{f.tokens(s.tokens)} · {f.shortDay(s.lastSyncMs)}
											</span>
										</li>
									))}
									{agg.stale.length > 10 && (
										<li className="py-2 font-mono text-xs text-fg-muted">
											and {agg.stale.length - 10} more
										</li>
									)}
								</ul>
							</section>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}

function Rail({
	agg,
	weight,
}: {
	readonly agg: Aggregate;
	readonly weight: Weight;
}) {
	return (
		<div className="space-y-8">
			<dl className="border-2 border-stroke-strong">
				<Figure
					label="measured tokens"
					value={f.tokens(agg.totalTokens)}
					accent
				/>
				<Figure
					label={`at least · ${agg.costPublishers} of ${agg.stackCount} publish cost`}
					value={f.usd(agg.spendLowerBound)}
				/>
				<Figure label="stacks measured" value={f.count(agg.stackCount)} />
				<Figure label="sessions" value={f.count(agg.totalSessions)} last />
			</dl>

			<MiniRanking
				title="Models"
				note={
					weight === "tokens"
						? "share of attributed tokens"
						: `stacks it leads, of ${agg.stackCount}`
				}
				items={agg.models.slice(0, 6)}
				weight={weight}
				population={agg.stackCount}
			/>

			<MiniRanking
				title="Harnesses"
				note={
					weight === "tokens"
						? "share of attributed tokens"
						: `stacks it leads, of ${agg.stackCount}`
				}
				items={agg.harnesses.slice(0, 5)}
				weight={weight}
				population={agg.stackCount}
			/>

			<p className="font-mono text-[11px] leading-relaxed text-fg-muted">
				{f.pct(agg.unattributedShare, 1)} of measured tokens carry no model name
				and are left out of these shares. Spend is always a lower bound.
			</p>
		</div>
	);
}

function Figure({
	label,
	value,
	accent,
	last,
}: {
	readonly label: string;
	readonly value: string;
	readonly accent?: boolean;
	readonly last?: boolean;
}) {
	return (
		<div className={last ? "p-4" : "border-b-2 border-stroke-strong p-4"}>
			<dd
				className={`font-mono text-2xl font-black ${
					accent ? "text-accent-lime" : "text-fg-primary"
				}`}
			>
				{value}
			</dd>
			<dt className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
				{label}
			</dt>
		</div>
	);
}

function MiniRanking({
	title,
	note,
	items,
	weight,
	population,
}: {
	readonly title: string;
	readonly note: string;
	readonly items: readonly Ranking[];
	readonly weight: Weight;
	readonly population: number;
}) {
	if (items.length === 0) return null;
	const value = (r: Ranking) => weightedValue(r, weight, population);
	const max = Math.max(...items.map(value), 0.0001);

	return (
		<section>
			<h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
				{title}
			</h3>
			<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted/70">
				{note}
			</p>
			<ul className="mt-3 space-y-2">
				{items.map((r) => (
					<li key={r.key}>
						<div className="flex items-baseline justify-between gap-2">
							<span className="min-w-0 truncate font-mono text-xs text-fg-primary">
								{r.key}
							</span>
							<span className="shrink-0 font-mono text-xs text-fg-secondary">
								{weight === "tokens"
									? f.pct(r.tokenShare)
									: `${r.leadsCount}/${population}`}
							</span>
						</div>
						<div className="mt-1 h-1.5 bg-bg-panel">
							<div
								className="h-full bg-accent-lime"
								style={{ width: `${(value(r) / max) * 100}%` }}
							/>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
