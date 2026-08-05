/**
 * PROTOTYPE (#98) — three designs for the owner-private view numbers.
 *
 * Throwaway. Each variant renders the whole page, so any of them is free to
 * throw out the layout. What none of them is free to throw out is the honest
 * labeling: deduped daily visitors, one visitor per page per UTC day, a browser
 * on a network and not a person, owner views excluded, not page loads.
 *
 * A — Rows only. A total, a sentence about referrers, one row per page with a
 *     sparkline. No chart section at all.
 * B — Chart led. What ships today, tightened: a total, one line per page, the
 *     referrer bars, then a plain table of pages.
 * C — Per page. No site-wide headline. One card per page carrying its own
 *     number, its own trail and its own start date. Referrers demoted to a
 *     footnote, because six buckets over eleven visits says nothing.
 */

import { Link } from "@tanstack/react-router";
import {
	BarsChart,
	type ChartBar,
	type ChartSeries,
	formatDayFull,
	formatExact,
	Sparkline,
	TimeSeriesChart,
} from "@/features/charts";
import { REFERRER_LABELS, rangeLabel } from "@/features/settings/AnalyticsPage";
import type { AnalyticsData, AnalyticsTarget } from "./fixtures";

export const VARIANTS = ["A", "B", "C"] as const;
export type VariantKey = (typeof VARIANTS)[number];

export const VARIANT_LABELS: Record<VariantKey, string> = {
	A: "A · Rows",
	B: "B · Chart",
	C: "C · Cards",
};

/* ------------------------------------------------------------------ shared */

/** The sentence every state of every variant carries. */
function HonestLabel({ className = "" }: { readonly className?: string }) {
	return (
		<p
			className={`max-w-prose text-sm leading-relaxed text-fg-muted ${className}`}
		>
			One page counts one visitor once per day. A visitor is a browser on a
			network, not a person — an office shares one number and one person on a
			phone and a laptop counts twice. Visits you make while signed in are left
			out. These are not page loads.
		</p>
	);
}

function PrivateLead({ className = "" }: { readonly className?: string }) {
	return (
		<p
			className={`max-w-prose text-sm leading-relaxed text-fg-secondary ${className}`}
		>
			How often your profile and your stacks were opened. Only you can see these
			numbers, and no view count appears anywhere else on the site.
		</p>
	);
}

function NothingCounted() {
	return (
		<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
			<p className="font-mono text-sm text-fg-primary">
				No visits counted yet.
			</p>
			<p className="mt-2 text-sm text-fg-secondary">
				Counting starts the first time somebody who is not you opens one of your
				pages. Your own visits never count while you are signed in, so reloading
				your stack will not move this number.
			</p>
		</div>
	);
}

function targetNote(t: AnalyticsTarget): string {
	if (!t.openable) return "Draft — nobody can open it yet";
	if (t.total === 0) return "Nobody has opened it yet";
	return "deduped daily visitors";
}

function toSeries(data: AnalyticsData): ChartSeries[] {
	return data.targets
		.filter((t) => t.days.length > 0)
		.map((t) => ({ key: t.targetId, label: t.label, points: t.days }));
}

/**
 * The referrer split as one sentence.
 *
 * At eleven visits a six-bar chart draws a shape that a reader will over-read.
 * The sentence carries the same four numbers and claims nothing about a
 * ranking that one extra visit would flip.
 */
function referrerSentence(data: AnalyticsData): string | null {
	if (data.referrers.length === 0) return null;
	const parts = data.referrers.map(
		(r) => `${REFERRER_LABELS[r.bucket].toLowerCase()} (${r.count})`,
	);
	const [first, ...rest] = parts;
	if (rest.length === 0) return `Every visit came from ${first}.`;
	return `Most visits came from ${first}. Then ${rest.join(", ")}.`;
}

function TargetLink({ t }: { readonly t: AnalyticsTarget }) {
	if (!t.openable) return <>{t.label}</>;
	return (
		<Link to={t.href} className="hover:text-accent">
			{t.label}
		</Link>
	);
}

/* --------------------------------------------------------------- variant A */

/** A — a total, a sentence, and one row per page. No chart section. */
export function VariantA({ data }: { readonly data: AnalyticsData }) {
	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);
	const sentence = referrerSentence(data);

	return (
		<div className="mx-auto max-w-3xl px-6 py-12">
			<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
				Views
			</h1>
			<PrivateLead className="mt-3" />

			{data.total > 0 ? (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-4xl font-black text-accent">
						{formatExact(data.total)}
					</p>
					<p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
						deduped daily visitors · {range}
					</p>
					{sentence && (
						<p className="mt-4 max-w-prose border-t border-stroke-subtle pt-4 text-sm leading-relaxed text-fg-secondary">
							{sentence} A visitor who then clicks around your pages counts as a
							link on this site.
						</p>
					)}
				</div>
			) : (
				<NothingCounted />
			)}

			<section className="mt-8">
				<h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
					Each page
				</h2>
				<ul aria-label="Views per page" className="mt-3 space-y-3">
					{data.targets.map((t) => (
						<li
							key={t.targetId}
							className="flex items-center justify-between gap-4 border-2 border-stroke-strong bg-bg-panel p-4"
						>
							<div className="min-w-0">
								<p className="truncate font-mono text-sm font-bold text-fg-primary">
									<TargetLink t={t} />
								</p>
								<p className="mt-1 font-mono text-xs text-fg-muted">
									{targetNote(t)}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-4">
								<Sparkline
									points={t.days}
									ariaLabel={`Daily visitors for ${t.label}`}
									area
								/>
								<p className="font-mono text-lg font-black text-fg-primary">
									{formatExact(t.total)}
								</p>
							</div>
						</li>
					))}
				</ul>
			</section>

			<HonestLabel className="mt-8 border-t border-stroke-subtle pt-6" />
		</div>
	);
}

/* --------------------------------------------------------------- variant B */

/** B — what ships today: total, one line per page, referrer bars, table. */
export function VariantB({ data }: { readonly data: AnalyticsData }) {
	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);
	const series = toSeries(data);
	const bars: ChartBar[] = data.referrers.map((r) => ({
		key: r.bucket,
		label: REFERRER_LABELS[r.bucket],
		value: r.count,
	}));

	return (
		<div className="mx-auto max-w-3xl px-6 py-12">
			<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
				Views
			</h1>
			<PrivateLead className="mt-3" />
			<HonestLabel className="mt-3" />

			{data.total > 0 && (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-4xl font-black text-accent">
						{formatExact(data.total)}
					</p>
					<p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
						deduped daily visitors · {range}
					</p>
				</div>
			)}

			{data.total === 0 ? (
				<NothingCounted />
			) : (
				<>
					{series.length > 0 && (
						<section className="mt-8">
							<h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
								Visitors per day
							</h2>
							<TimeSeriesChart
								className="mt-3"
								series={series}
								ariaLabel="Deduped daily visitors per page"
								ariaDescription={`One line per page, ${range}.`}
								valueLabel="Visitors"
								caption={`deduped daily visitors · ${range}`}
							/>
						</section>
					)}

					{bars.length > 0 && (
						<section className="mt-8">
							<h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
								Where they came from
							</h2>
							<p className="mt-2 max-w-prose text-sm leading-relaxed text-fg-secondary">
								Decided once per visit, from the page the visitor came off. A
								visitor who then clicks around your pages counts as a link on
								this site.
							</p>
							<BarsChart
								className="mt-3"
								bars={bars}
								ariaLabel="Deduped daily visitors by where the visit came from"
								valueLabel="Visitors"
							/>
						</section>
					)}
				</>
			)}

			<section className="mt-8">
				<h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
					Each page
				</h2>
				<ul aria-label="Views per page" className="mt-3 space-y-3">
					{data.targets.map((t) => (
						<li
							key={t.targetId}
							className="flex items-baseline justify-between gap-4 border-2 border-stroke-strong bg-bg-panel p-4"
						>
							<div className="min-w-0">
								<p className="truncate font-mono text-sm font-bold text-fg-primary">
									<TargetLink t={t} />
								</p>
								<p className="mt-1 font-mono text-xs text-fg-muted">
									{targetNote(t)}
								</p>
							</div>
							<p className="shrink-0 font-mono text-lg font-black text-fg-primary">
								{formatExact(t.total)}
							</p>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}

/* --------------------------------------------------------------- variant C */

/**
 * C — one card per page and no site-wide headline.
 *
 * The site-wide total answers a question nobody asked: an owner wants to know
 * which page is being opened, and adding a draft's zero to a stack's seven
 * makes a number that means nothing. It survives as a footnote.
 */
export function VariantC({ data }: { readonly data: AnalyticsData }) {
	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);
	const sentence = referrerSentence(data);
	const live = data.targets.filter((t) => t.openable);
	const drafts = data.targets.filter((t) => !t.openable);

	return (
		<div className="mx-auto max-w-4xl px-6 py-12">
			<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
				Views
			</h1>
			<PrivateLead className="mt-3" />
			<p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
				{live.length} live {live.length === 1 ? "page" : "pages"} · deduped
				daily visitors · {range}
			</p>

			{data.total === 0 && <NothingCounted />}

			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				{live.map((t) => (
					<article
						key={t.targetId}
						className="border-2 border-stroke-strong bg-bg-panel p-5"
					>
						<p className="truncate font-mono text-sm font-bold text-fg-primary">
							<TargetLink t={t} />
						</p>
						<p className="mt-3 font-mono text-3xl font-black text-accent">
							{formatExact(t.total)}
						</p>
						<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
							{t.total === 0
								? "nobody has opened it yet"
								: "deduped daily visitors"}
						</p>
						{t.days.length > 1 && (
							<Sparkline
								className="mt-4"
								points={t.days}
								ariaLabel={`Daily visitors for ${t.label}`}
								area
								fluid
								width={320}
								height={44}
							/>
						)}
						{t.days.length === 1 && (
							<p className="mt-4 font-mono text-xs text-fg-muted">
								One day counted so far — {formatDayFull(new Date(t.days[0].at))}
								. A trail needs a second day.
							</p>
						)}
					</article>
				))}
			</div>

			{drafts.length > 0 && (
				<section className="mt-6">
					<h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
						Not open to anyone
					</h2>
					<ul className="mt-3 space-y-2">
						{drafts.map((t) => (
							<li
								key={t.targetId}
								className="border border-dashed border-stroke-strong px-4 py-3 font-mono text-xs text-fg-muted"
							>
								{t.label} — draft, nobody can open it yet
							</li>
						))}
					</ul>
				</section>
			)}

			<footer className="mt-10 space-y-3 border-t border-stroke-subtle pt-6">
				{data.total > 0 && (
					<p className="max-w-prose text-sm leading-relaxed text-fg-secondary">
						{formatExact(data.total)} deduped daily visitors across every page,{" "}
						{range}.{sentence ? ` ${sentence}` : ""}
					</p>
				)}
				<HonestLabel />
			</footer>
		</div>
	);
}
