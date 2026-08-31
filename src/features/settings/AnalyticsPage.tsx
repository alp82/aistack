import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	BarsChart,
	type ChartBar,
	type ChartSeries,
	formatDayFull,
	formatExact,
	TimeSeriesChart,
} from "@/features/charts";
import { api } from "../../../convex/_generated/api";

/**
 * Views - the owner-private read surface over the view counters (#86, map #76).
 *
 * PRIVATE BY DECISION, not by obscurity. `viewAnalytics.mine` takes no target
 * argument and answers for the signed-in creator alone, so this page cannot be
 * pointed at anyone else even by a caller who skips it entirely. The route guard
 * below is a convenience for the reader, never the protection.
 *
 * The other decision this file carries is HONEST LABELING. The counter dedupes
 * on `IP + User-Agent` per UTC day, which merges an office behind one number and
 * splits one person across two devices. So the page says "deduped daily
 * visitors", says what the number is not, and never prints it beside the word
 * views alone.
 */

/** Where a session came from, in words a reader does not have to decode. */
export const REFERRER_LABELS = {
	direct: "Typed or bookmarked",
	search: "Search engine",
	ai: "AI assistant",
	social: "Social post",
	internal: "A link on this site",
	other: "Somewhere else",
} as const;

/**
 * The range the numbers really cover.
 *
 * Counting started on a date, so a three-day-old account has three days of data
 * and not a 30-day window with 27 zeros. Saying "last 30 days" there would be a
 * claim about days nobody was counting.
 */
export function rangeLabel(
	firstCountedDayMs: number | null,
	windowStartMs: number,
	windowDays: number,
): string {
	if (firstCountedDayMs === null || firstCountedDayMs <= windowStartMs) {
		return `last ${windowDays} days`;
	}
	return `since ${formatDayFull(new Date(firstCountedDayMs))}`;
}

export function AnalyticsPage() {
	const data = useQuery(api.viewAnalytics.mine, {});

	if (data === undefined) {
		return (
			<Shell>
				<p className="mt-8 font-mono text-sm text-fg-muted">Loading...</p>
			</Shell>
		);
	}

	// No creator row means nothing of this user is reachable yet, so there is
	// nothing to count rather than nothing counted.
	if (data === null) {
		return (
			<Shell>
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">
						Nothing to count yet.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						Create a stack and these numbers start on the day someone opens it.
					</p>
				</div>
			</Shell>
		);
	}

	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);
	const series: ChartSeries[] = data.targets
		.filter((t) => t.days.length > 0)
		.map((t) => ({ key: t.targetId, label: t.label, points: t.days }));
	const bars: ChartBar[] = data.referrers.map((r) => ({
		key: r.bucket,
		label: REFERRER_LABELS[r.bucket],
		value: r.count,
	}));

	return (
		<Shell>
			{/* No total when nothing was counted: "0 · last 30 days" would claim a
			    window that was never observed. The empty state says it instead. */}
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
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">
						No visits counted yet.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						Counting starts the first time somebody who is not you opens one of
						your pages. Your own visits never count while you are signed in, so
						reloading your stack will not move this number.
					</p>
				</div>
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
									<Link to={t.href} className="hover:text-accent">
										{t.label}
									</Link>
								</p>
								<p className="mt-1 font-mono text-xs text-fg-muted">
									{targetNote(t.total)}
								</p>
							</div>
							<p className="shrink-0 font-mono text-lg font-black text-fg-primary">
								{formatExact(t.total)}
							</p>
						</li>
					))}
				</ul>
			</section>
		</Shell>
	);
}

/**
 * The line under a page's name.
 *
 * Exported because the profile panel and the stack-page line (#112) use the
 * same wording.
 */
export function targetNote(total: number): string {
	if (total === 0) return "Nobody has opened it yet";
	return "deduped daily visitors";
}

/** The heading and the labeling that every state of this page shows. */
function Shell({ children }: { readonly children: React.ReactNode }) {
	return (
		<div className="mx-auto max-w-3xl px-6 py-12">
			<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
				Views
			</h1>
			<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
				How often your profile and your stacks were opened. Only you can see
				these numbers, and no view count appears anywhere else on the site.
			</p>
			<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-muted">
				One page counts one visitor once per day. A visitor is a browser on a
				network, not a person - an office shares one number and one person on a
				phone and a laptop counts twice. Visits you make while signed in are
				left out. These are not page loads.
			</p>
			{children}
		</div>
	);
}
