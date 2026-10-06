/**
 * `/leaderboard` - variant C3 of the #92 prototype, rewritten for the live
 * read model. A sticky statistics rail beside the ranked board, neither
 * dominating: a rank means nothing without the population it ranks inside, so
 * the population stays on screen next to every row.
 *
 * Layout rules the prototype proved and a rewrite must not lose (#92):
 *
 *   1. EVERY ROW COLUMN IS FIXED OR `1fr`, NEVER `auto`. Each row is its own
 *      grid, so an `auto` column sizes off that row's own content and the
 *      trend column lands somewhere different on every row.
 *   2. BELOW `md` THE TREND CELL IS `display:none` and drops out of the grid,
 *      the handle and the spend hide, and the signed trend takes the spend's
 *      place under the tokens.
 *   3. BELOW `lg` THE BOARD COMES FIRST. The header is two lines that carry
 *      the totals, the skills and the rail follow the pager, and the notes are
 *      hidden.
 *
 * The sparkline refuses rather than guesses: fewer than two readings draws no
 * line at all - a flat stroke through one dot claims days nobody measured -
 * and because the 30-day total is a level, a fall renders as a fall.
 */

import { Link } from "@tanstack/react-router";
import { Sparkline } from "@/features/charts";
import { SYNC_BOARD_NOTE, SYNC_LABEL_BOARD } from "@/features/measured/copy";
import { SyncCommand, SyncHowLink } from "@/features/measured/SyncCommand";
import type { Board, BoardRow } from "./board";
import { harnessLabel, trendOf, trendShort } from "./board";
import * as f from "./format";
import { DATA_LICENSE } from "./jsonLd";
import { Pager } from "./Pager";
import { TopSkills } from "./TopSkills";

/** The trend cell is fixed at every size, so the column reads as a column. */
const SPARK_WIDTH = 128;
const SPARK_HEIGHT = 26;
const CELL_HEIGHT = SPARK_HEIGHT + 16;

export function LeaderboardPage({
	board,
	nowMs,
	onPage,
}: {
	readonly board: Board;
	readonly nowMs: number;
	readonly onPage: (p: number) => void;
}) {
	return (
		<div className="min-h-screen bg-bg-canvas">
			<div className="border-b-2 border-stroke-strong px-4 pb-3 pt-5 lg:px-12 lg:py-10">
				<div className="mx-auto flex max-w-content items-end justify-between gap-6">
					<div>
						<p className="hidden font-mono text-sm text-accent-lime lg:block">
							{"//"} MEASURED · LAST 30 DAYS
						</p>
						<h1 className="text-2xl font-black uppercase leading-none tracking-tighter text-fg-primary lg:mt-3 lg:text-6xl">
							What builders run
						</h1>
						<p className="mt-2 font-mono text-[11px] text-fg-muted lg:hidden">
							<span className="text-accent-lime">
								{f.tokens(board.totalTokens)} tokens
							</span>
							{` · ${f.count(board.stackCount)} stacks · at least ${f.usd(board.spendLowerBoundUSD)} · 30 days`}
						</p>
					</div>
					<p className="hidden max-w-md font-mono text-xs leading-relaxed text-fg-muted lg:block">
						Counted on {board.stackCount} builders&apos; own machines and
						published by them.
						{board.windowSpreadDays >= 1 &&
							` Windows offset by up to ${Math.round(board.windowSpreadDays)} days.`}
					</p>
				</div>
			</div>

			<div className="mx-auto max-w-content px-4 pb-16 lg:px-12 lg:py-14">
				<div className="grid grid-cols-1 gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-20 xl:gap-28">
					<aside className="order-2 lg:sticky lg:top-24 lg:order-1 lg:self-start">
						<Rail board={board} />
						<div className="mt-10 border-t border-stroke-subtle pt-6">
							<SyncCommand
								stacked
								className="w-full"
								label={SYNC_LABEL_BOARD}
							/>
							<p className="mt-3 text-xs leading-relaxed text-fg-muted">
								{SYNC_BOARD_NOTE}
							</p>
							<div className="mt-2">
								<SyncHowLink />
							</div>
						</div>
					</aside>

					<main className="order-1 lg:order-2">
						<div className="hidden items-baseline justify-between gap-4 lg:flex">
							<h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
								Ranked by measured tokens
							</h2>
							<span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
								{board.livingCount} ranked · {board.quiet.count} quiet
							</span>
						</div>

						{board.rows.length === 0 && (
							<p className="mt-4 border-t border-stroke-subtle py-6 font-mono text-sm text-fg-muted">
								Nothing to rank - every measured stack has been quiet for more
								than seven days.
							</p>
						)}

						<ol className="border-stroke-subtle lg:mt-4 lg:border-t">
							{board.rows.map((row) => (
								<Row key={row.slug} row={row} nowMs={nowMs} />
							))}
						</ol>

						<Pager
							page={board.page}
							totalPages={board.totalPages}
							onPage={onPage}
							className="mt-5 lg:mt-10"
						/>

						<TopSkills board={board} />

						{board.quiet.count > 0 && (
							<div className="hidden lg:block">
								<QuietLine board={board} />
							</div>
						)}

						<p className="mt-6 hidden font-mono text-xs leading-relaxed text-fg-muted lg:block">
							These figures are free to reuse with credit to AI Stack, under{" "}
							<a
								href={DATA_LICENSE.url}
								rel="license noopener noreferrer"
								target="_blank"
								className="text-fg-secondary underline hover:text-accent-lime"
							>
								{DATA_LICENSE.name}
							</a>
							.
						</p>
					</main>
				</div>
			</div>
		</div>
	);
}

function Row({
	row,
	nowMs,
}: {
	readonly row: BoardRow;
	readonly nowMs: number;
}) {
	return (
		<li className="grid grid-cols-[1.75rem_minmax(0,1fr)_4.5rem] items-baseline gap-x-2 gap-y-0.5 border-b border-stroke-subtle py-2.5 hover:bg-bg-panel md:grid-cols-[2.5rem_minmax(0,1fr)_9rem_14rem] md:gap-x-5 md:gap-y-1 md:py-4">
			<span className="row-span-2 font-mono text-base font-black text-fg-muted md:text-xl">
				{row.rank}
			</span>

			<Link
				to="/stacks/$slug"
				params={{ slug: row.slug }}
				className="min-w-0 truncate font-mono text-sm font-bold text-fg-primary hover:text-accent-lime"
			>
				{row.name}
				{row.creatorName && (
					<span className="ml-2 hidden font-normal text-fg-muted sm:inline">
						by {row.creatorName}
					</span>
				)}
			</Link>

			<Trend row={row} />

			<span className="whitespace-nowrap text-right font-mono text-sm font-black text-fg-primary md:text-base">
				{f.tokens(row.tokens)}
			</span>

			<span className="min-w-0 truncate font-mono text-[11px] text-fg-muted md:text-xs">
				{row.topModel
					? `${row.topModel.name} ${f.pct(row.topModel.share)} · `
					: "no model named · "}
				{row.harnesses.map(harnessLabel).join(" + ")}
				<span className="hidden md:inline">
					{" "}
					· synced {f.ago(row.lastSyncMs, nowMs)}
				</span>
			</span>

			<span className="text-right font-mono text-[11px] text-accent-lime md:hidden">
				{trendShort(row.points)}
			</span>

			<span className="hidden whitespace-nowrap text-right font-mono text-xs text-fg-secondary md:block">
				{row.spend === null ? (
					<span className="text-fg-muted">cost not published</span>
				) : (
					<>
						{row.spend.exact ? "" : "≥ "}
						{f.usd(row.spend.lowerBoundUSD)}
						<span className="text-fg-muted">
							{" "}
							· {f.pct(row.spend.coverage, 1)} priced
						</span>
					</>
				)}
			</span>
		</li>
	);
}

/**
 * The sparkline cell. One reading is not a trend, and the row says so rather
 * than drawing a flat stroke that would claim days nobody measured.
 *
 * A RISE AND A FALL WEAR THE SAME COLOR (#128, built in #129). The sign carries
 * the direction. Grey is this page's muted color, so a grey fall read as "this
 * row is fading" rather than as "down" - and the feed already treats a fall as
 * a fact, not as a demotion.
 */
function Trend({ row }: { readonly row: BoardRow }) {
	const trend = trendOf(row.points);
	const drawable = trend !== null;
	const up = (trend ?? 0) >= 0;
	return (
		// row-span-2 with a fixed height and a reserved strip: the line sits on
		// the same baseline in every row, whatever the row below it does.
		// Nothing here may size itself off its own content.
		<span
			className="row-span-2 hidden flex-col items-end justify-center self-center md:flex"
			style={{ height: `${CELL_HEIGHT}px` }}
		>
			<span
				className="flex w-full items-center justify-end"
				style={{ height: `${SPARK_HEIGHT}px` }}
			>
				{drawable ? (
					<Sparkline
						points={row.points.map((p) => ({ at: p.at, value: p.tokens }))}
						ariaLabel={`${row.name} measured tokens across ${row.points.length} syncs`}
						width={SPARK_WIDTH}
						height={SPARK_HEIGHT}
					/>
				) : (
					// A rule, not a line: it says "no reading to draw" without
					// claiming a flat trend across days nobody measured.
					<span
						aria-hidden="true"
						className="w-8 border-t border-dashed border-stroke-strong"
					/>
				)}
			</span>
			<span className="mt-1 block whitespace-nowrap font-mono text-[10px] leading-none text-fg-muted">
				{drawable ? (
					<>
						<span className="text-accent-lime">
							{up ? "+" : "−"}
							{f.pct(Math.abs(trend ?? 0))}
						</span>{" "}
						· {row.points.length} syncs
					</>
				) : (
					`${row.syncCount === 1 ? "1 sync" : `${row.syncCount} syncs`} · no trend`
				)}
			</span>
		</span>
	);
}

/**
 * The quiet group is one line (#92): the count and the token mass keep the
 * ranked board honest about what it left out, without a roll call of who has
 * been idle.
 */
function QuietLine({ board }: { readonly board: Board }) {
	const n = board.quiet.count;
	return (
		<p className="mt-16 border-t border-dashed border-stroke-subtle pt-4 font-mono text-xs leading-relaxed text-fg-muted">
			{n} more stack{n === 1 ? "" : "s"} {n === 1 ? "has" : "have"} measured
			history but no sync in the last seven days, so{" "}
			{n === 1 ? "it is" : "they are"} not ranked.{" "}
			{f.tokens(board.quiet.tokens)} tokens sit in that group.
		</p>
	);
}

function Rail({ board }: { readonly board: Board }) {
	return (
		<div className="space-y-10">
			<dl className="hidden border-2 border-stroke-strong lg:block">
				<Figure
					label="measured tokens"
					value={f.tokens(board.totalTokens)}
					accent
				/>
				<Figure
					label={`at least · ${board.costPublishers} of ${board.stackCount} publish cost`}
					value={f.usd(board.spendLowerBoundUSD)}
				/>
				<Figure label="stacks measured" value={f.count(board.stackCount)} />
				<Figure label="sessions" value={f.count(board.totalSessions)} last />
			</dl>

			<MiniRanking
				title="Models"
				note="share of attributed tokens"
				items={board.models.map((m) => ({
					key: m.key,
					label: m.name,
					share: m.tokenShare,
				}))}
			/>

			<MiniRanking
				title="Harnesses"
				note="share of measured tokens"
				items={board.harnesses.map((h) => ({
					key: h.key,
					label: harnessLabel(h.key),
					share: h.tokenShare,
				}))}
			/>

			<p className="hidden font-mono text-[11px] leading-relaxed text-fg-muted lg:block">
				{f.pct(board.unattributedShare, 1)} of measured tokens carry no model
				name and are left out of these shares. Spend is always a lower bound.
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
}: {
	readonly title: string;
	readonly note: string;
	readonly items: readonly { key: string; label: string; share: number }[];
}) {
	if (items.length === 0) return null;
	const max = Math.max(...items.map((i) => i.share), 0.0001);

	return (
		<section>
			<h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
				{title}
			</h3>
			<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted/70">
				{note}
			</p>
			<ul className="mt-3 space-y-2">
				{items.map((i) => (
					<li key={i.key}>
						<div className="flex items-baseline justify-between gap-2">
							<span className="min-w-0 truncate font-mono text-xs text-fg-primary">
								{i.label}
							</span>
							<span className="shrink-0 font-mono text-xs text-fg-secondary">
								{f.pct(i.share)}
							</span>
						</div>
						<div className="mt-1 h-1.5 bg-bg-panel">
							<div
								className="h-full bg-accent-lime"
								style={{ width: `${(i.share / max) * 100}%` }}
							/>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
