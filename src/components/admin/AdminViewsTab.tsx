import { useQuery } from "convex/react";
import {
	BarsChart,
	type ChartBar,
	type ChartSeries,
	formatExact,
	TimeSeriesChart,
} from "@/features/charts";
import { REFERRER_LABELS, rangeLabel } from "@/features/settings/AnalyticsPage";
import { api } from "../../../convex/_generated/api";

/**
 * Views - the admin-only site-wide read surface (#132, map #121).
 *
 * The FIRST reader the `global` counter has ever had, built so a broadcast can
 * be read at all: site-wide arrivals by day, split by where the visit came
 * from. The real guard is `isAdmin(ctx)` inside `viewAnalytics.siteWide` - the
 * `/admin` route gate above this component is a convenience, never the
 * protection.
 *
 * Two honesty rules carry over from the owner-private page. The number is
 * deduped daily visitors, never people and never page loads. And a day nobody
 * was counting is a gap, not a zero - the series starts at the first counted
 * day.
 *
 * One rule is new: DO NOT QUOTE THIS FIGURE PUBLICLY. `views.record` accepts a
 * caller-supplied visitor hash, which is fine while the number is private and
 * ranks nothing. Publishing it changes that bargain.
 */
export function AdminViewsTab() {
	const data = useQuery(api.viewAnalytics.siteWide, {});

	if (data === undefined) {
		return (
			<Shell>
				<p className="mt-8 font-mono text-sm text-fg-muted">Loading...</p>
			</Shell>
		);
	}

	// The query answers null for a non-admin. The route already redirected, so
	// this renders only in the gap while auth settles.
	if (data === null) {
		return (
			<Shell>
				<p className="mt-8 font-mono text-sm text-fg-muted">Not available.</p>
			</Shell>
		);
	}

	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);
	const series: ChartSeries[] =
		data.days.length > 0
			? [{ key: "site", label: "Site-wide", points: data.days }]
			: [];
	const bars: ChartBar[] = data.referrers.map((r) => ({
		key: r.bucket,
		label: REFERRER_LABELS[r.bucket],
		value: r.count,
	}));

	return (
		<Shell>
			{data.total > 0 && (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-4xl font-black text-accent-lime">
						{formatExact(data.total)}
					</p>
					<p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
						deduped daily visitors · site-wide · {range}
					</p>
				</div>
			)}

			{data.total === 0 ? (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">
						No visits counted yet.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						The site-wide counter starts on the day this surface shipped. Days
						before that were never counted, so they are not shown as zeros.
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
								ariaLabel="Site-wide deduped daily visitors per day"
								ariaDescription={`One line for the whole site, ${range}.`}
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
								Decided once per visit, from the page the visitor came off. This
								is the campaign read: a broadcast shows up here as a jump in one
								bucket on the days after the send.
							</p>
							<BarsChart
								className="mt-3"
								bars={bars}
								ariaLabel="Site-wide deduped daily visitors by where the visit came from"
								valueLabel="Visitors"
							/>
						</section>
					)}
				</>
			)}
		</Shell>
	);
}

/** The heading and the labeling that every state of this tab shows. */
function Shell({ children }: { readonly children: React.ReactNode }) {
	return (
		<div className="mx-auto max-w-3xl px-6 py-12">
			<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
				Site-wide views
			</h1>
			<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
				One visitor counts once per UTC day across the whole site. A visitor is
				a browser on a network, not a person. Your own visits while signed in as
				admin are left out. These are not page loads.
			</p>
			<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-muted">
				Admin-only, and the figure is inflatable by anyone who wants to - do not
				quote it anywhere public.
			</p>
			{children}
		</div>
	);
}
