/**
 * The owner-private views panel on a profile page - shape E4 (#98, built in
 * #112, map #76).
 *
 * STRICTLY PRIVATE ON A PUBLIC PAGE. `/@handle` is open to anyone, so this
 * panel is guarded twice. `viewAnalytics.mine` takes no target argument and
 * answers for the signed-in creator alone, so a visitor gets nothing to render.
 * `ProfilePage` also renders the slot only for the owner, so a visitor never
 * receives the markup either.
 *
 * The panel carries, in this order: the headline total, one box per page, the
 * honest labeling, and the door to `/settings/analytics` for what does not fit
 * here. The whole thing sits in a dashed fence with a lock, the same treatment
 * the draft-stack cards on this page already use.
 */

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Lock } from "lucide-react";
import { formatExact, Sparkline } from "@/features/charts";
import { rangeLabel, targetNote } from "@/features/settings/AnalyticsPage";
import { api } from "../../../convex/_generated/api";
import type { ViewAnalytics, ViewTarget } from "./data";

/** The accessible name of the per-page list, shared with `/settings/analytics`. */
const PER_PAGE_LIST = "Views per page";

/**
 * The width the sparkline column holds whether or not a line draws.
 *
 * A target with one reading draws nothing - `Sparkline` needs two points - and
 * most targets have one or two. Holding the width keeps every total in one
 * column instead of ragging the list by how much history a page happens to have.
 */
const TRAIL_WIDTH = 72;

function OwnerViewsPanel() {
	const data = useQuery(api.viewAnalytics.mine, {});
	// Undefined while the query answers, null when the caller has no creator
	// row. Neither is a state worth a box on someone's profile.
	if (!data) return null;
	return <OwnerViewsPanelView data={data} />;
}

function OwnerViewsPanelView({ data }: { readonly data: ViewAnalytics }) {
	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);

	return (
		<section className="border border-dashed border-stroke-strong bg-bg-panel-muted p-5">
			<div className="flex items-center gap-1.5">
				<Lock aria-hidden="true" className="size-3 text-fg-muted" />
				<h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
					Views - only you can see this
				</h2>
			</div>

			{/* No total when nothing was counted: "0 · last 30 days" would claim a
			    window nobody was watching. The words say it instead. */}
			{data.total === 0 ? (
				<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
					Nobody has opened your pages yet. Counting starts the first time
					somebody who is not you opens one. Your own visits never count while
					you are signed in.
				</p>
			) : (
				<>
					<p className="mt-3 font-mono text-3xl font-black text-accent">
						{formatExact(data.total)}
					</p>
					<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
						deduped daily visitors · {range}
					</p>
				</>
			)}

			{/* Drafts stay in this list. A draft that reads zero is the number an
			    owner most needs explained, and dropping it lies by omission. */}
			<ul aria-label={PER_PAGE_LIST} className="mt-4 space-y-2">
				{data.targets.map((target) => (
					<TargetBox key={target.targetId} target={target} />
				))}
			</ul>

			<p className="mt-3 max-w-prose text-xs leading-relaxed text-fg-muted">
				One page counts one visitor once per day. A visitor is a browser on a
				network, not a person. Visits you make while signed in are left out.
				These are not page loads.
			</p>

			<Link
				to="/settings/analytics"
				className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary hover:text-accent-lime"
			>
				Day by day, and where they came from
				<ArrowRight aria-hidden="true" className="size-3" />
			</Link>
		</section>
	);
}

function TargetBox({ target }: { readonly target: ViewTarget }) {
	return (
		<li className="flex items-center justify-between gap-3 border border-stroke-subtle bg-bg-panel px-3 py-2">
			<span className="min-w-0">
				<span className="block truncate font-mono text-xs font-bold text-fg-primary">
					{target.label}
				</span>
				<span className="mt-0.5 block font-mono text-[10px] text-fg-muted">
					{targetNote(target.openable, target.total)}
				</span>
			</span>
			<span className="flex shrink-0 items-center gap-3">
				<span style={{ width: TRAIL_WIDTH }} className="shrink-0">
					<Sparkline
						points={target.days}
						ariaLabel={`Daily visitors for ${target.label}`}
						width={TRAIL_WIDTH}
						height={20}
						area
					/>
				</span>
				<span className="font-mono text-sm font-black text-fg-primary">
					{formatExact(target.total)}
				</span>
			</span>
		</li>
	);
}

export { OwnerViewsPanel, OwnerViewsPanelView };
