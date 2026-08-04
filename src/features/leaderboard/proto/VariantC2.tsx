/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * VARIANT C2 / C3 — C, refined after the first review.
 *
 * Three changes on top of [C](./VariantC.tsx):
 *
 * 1. **A wide gutter.** The rail and the board were one gap apart and read as
 *    one table with a sidebar glued to it. They are now far enough apart to
 *    read as two things, and the rail narrows to hold the same line lengths.
 * 2. **A trend sparkline per row.** The line is the stack's rolling 30-day
 *    total as it stood on each sync — the same number the tokens column shows,
 *    over time. It is a level, so it **can fall**, and one real stack falls.
 * 3. **The quiet group, two ways.** C2 keeps the list. C3 replaces it with one
 *    line. Flip between them to settle whether the list earns its place.
 *
 * The sparkline is the only place this page can go wrong quietly, so it is
 * built to refuse rather than to guess:
 *
 *   - fewer than two readings draws **no line at all** and says so. A flat
 *     stroke through one dot claims six days nobody measured.
 *   - the trend is the change across the readings that exist, not across the
 *     window, and the row prints how many readings it had.
 *
 * That matters here: on prod one of the four stacks has exactly one reading.
 */

import { Link } from "@tanstack/react-router";
import { Sparkline } from "@/features/charts";
import type { Aggregate, RankedStack, Ranking, Weight } from "./aggregate";
import { weightedValue } from "./aggregate";
import { Pager } from "./bits";
import * as f from "./format";

const PAGE_SIZE = 10;

export const VARIANT_C2_NAME =
	"C refined — wide gutter, sparklines, quiet list";
export const VARIANT_C3_NAME = "C refined — same, quiet group as one line";

export function VariantC2({
	agg,
	weight,
	page,
	onPage,
	quietGroup,
}: {
	readonly agg: Aggregate;
	readonly weight: Weight;
	readonly page: number;
	readonly onPage: (p: number) => void;
	/** `list` shows every quiet stack. `line` states the count and stops. */
	readonly quietGroup: "list" | "line";
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

			<div className="mx-auto max-w-content px-6 py-14 md:px-12">
				{/* The gutter is the change: 5rem at lg, 7rem at xl. The rail is
				    narrower than in C so the line lengths stay the same. */}
				<div className="grid grid-cols-1 gap-14 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-20 xl:gap-28">
					<aside className="lg:sticky lg:top-8 lg:self-start">
						<Rail agg={agg} weight={weight} />
					</aside>

					<main>
						<div className="flex items-baseline justify-between gap-4">
							<h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
								Ranked by measured tokens
							</h2>
							<span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
								{agg.livingCount} ranked · {agg.stale.length} quiet
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
								<Row key={s.id} s={s} nowMs={agg.nowMs} />
							))}
						</ol>

						<Pager
							page={safePage}
							totalPages={totalPages}
							onPage={onPage}
							className="mt-10"
						/>

						{agg.stale.length > 0 &&
							(quietGroup === "list" ? (
								<QuietList agg={agg} />
							) : (
								<QuietLine agg={agg} />
							))}
					</main>
				</div>
			</div>
		</div>
	);
}

function Row({
	s,
	nowMs,
}: {
	readonly s: RankedStack;
	readonly nowMs: number;
}) {
	return (
		<li className="grid grid-cols-[2.5rem_minmax(0,1fr)_7rem_auto] items-baseline gap-x-5 gap-y-1 border-b border-stroke-subtle py-4 hover:bg-bg-panel">
			<span className="row-span-2 font-mono text-xl font-black text-fg-muted">
				{s.rank}
			</span>

			<Link
				to="/stacks/$slug"
				params={{ slug: s.slug }}
				className="min-w-0 truncate font-mono text-sm font-bold text-fg-primary hover:text-accent-lime"
			>
				{s.name}
				<span className="ml-2 font-normal text-fg-muted">@{s.handle}</span>
			</Link>

			<span className="row-span-2 self-center">
				<Trend s={s} />
			</span>

			<span className="whitespace-nowrap text-right font-mono text-base font-black text-fg-primary">
				{f.tokens(s.tokens)}
			</span>

			<span className="min-w-0 truncate font-mono text-xs text-fg-muted">
				{s.topModel
					? `${s.topModel.name} ${f.pct(s.topModel.share)} · `
					: "no model named · "}
				{s.activeHarnesses.join(" + ")} · synced {f.ago(s.lastSyncMs, nowMs)}
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
	);
}

/**
 * The sparkline cell.
 *
 * One reading is not a trend, and the row says so rather than drawing a flat
 * stroke that would claim days nobody measured.
 */
function Trend({ s }: { readonly s: RankedStack }) {
	if (s.history.length < 2 || s.trend === null) {
		return (
			<span className="block text-right font-mono text-[10px] leading-tight text-fg-muted">
				one reading
				<br />
				no trend yet
			</span>
		);
	}
	const up = s.trend >= 0;
	return (
		<span className="block">
			<Sparkline
				points={s.history}
				ariaLabel={`${s.name} measured tokens across ${s.history.length} syncs`}
				width={108}
				height={26}
			/>
			<span className="mt-0.5 block font-mono text-[10px] leading-tight text-fg-muted">
				<span className={up ? "text-accent-lime" : "text-fg-secondary"}>
					{up ? "+" : "−"}
					{f.pct(Math.abs(s.trend))}
				</span>{" "}
				over {s.history.length} syncs
			</span>
		</span>
	);
}

/** C2 — the quiet stacks, listed. */
function QuietList({ agg }: { readonly agg: Aggregate }) {
	return (
		<section className="mt-16">
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
	);
}

/**
 * C3 — the same fact, one line.
 *
 * It keeps the count, which is what makes the ranked board honest about what
 * it left out, and drops the roll call of who has been idle.
 */
function QuietLine({ agg }: { readonly agg: Aggregate }) {
	return (
		<p className="mt-16 border-t border-dashed border-stroke-subtle pt-4 font-mono text-xs leading-relaxed text-fg-muted">
			{agg.stale.length} more stack{agg.stale.length === 1 ? "" : "s"}{" "}
			{agg.stale.length === 1 ? "has" : "have"} measured history but no sync in
			the last seven days, so {agg.stale.length === 1 ? "it is" : "they are"}{" "}
			not ranked. {f.tokens(agg.stale.reduce((a, s) => a + s.tokens, 0))} tokens
			sit in that group.
		</p>
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
		<div className="space-y-10">
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
