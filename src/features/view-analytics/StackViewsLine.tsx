/**
 * The owner-private view line on a public stack page — shape S1 (#98, built in
 * #112, map #76).
 *
 * A stack page is the page a creator screenshots and posts, so the number on it
 * is one line, fenced and labeled, and it is gone for everyone else.
 *
 * THE NUMBER FOR ONE STACK, FROM A QUERY THAT ANSWERS FOR ALL OF THEM. #112
 * offered two ways and this is the first: read `viewAnalytics.mine` and select
 * the entry whose `targetId` is this stack. The query keeps taking no target
 * argument, so the ownership guard stays server side and unchanged. The
 * selection is a second, structural gate on top of it: a caller who does not
 * own this stack never gets its id in the answer, so there is nothing to select
 * and nothing to draw. The cost is reading every counter of the owner on a page
 * that needs one. At the size of a creator's stack list that is free.
 */

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Lock } from "lucide-react";
import { formatExact } from "@/features/charts";
import { rangeLabel, targetNote } from "@/features/settings/AnalyticsPage";
import { api } from "../../../convex/_generated/api";
import type { ViewAnalytics, ViewTarget } from "./data";

function StackViewsLine({
	stackId,
	isOwner,
}: {
	readonly stackId: string;
	readonly isOwner: boolean;
}) {
	const data = useQuery(api.viewAnalytics.mine, isOwner ? {} : "skip");
	if (!isOwner || !data) return null;

	const target = data.targets.find((t) => t.targetId === stackId);
	if (!target) return null;

	return <StackViewsLineView data={data} target={target} />;
}

function StackViewsLineView({
	data,
	target,
}: {
	readonly data: ViewAnalytics;
	readonly target: ViewTarget;
}) {
	// This stack's own range, not the site-wide one. `days` is filled from the
	// first day THIS page was counted, so a stack opened yesterday does not
	// borrow the start date of a profile counted for a month.
	const range = rangeLabel(
		target.days[0]?.at ?? null,
		data.windowStartMs,
		data.windowDays,
	);

	return (
		<div className="mx-auto max-w-7xl px-6 pt-8">
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-dashed border-stroke-strong px-4 py-2">
				<Lock aria-hidden="true" className="size-3 shrink-0 text-fg-muted" />
				<span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
					Only you can see this
				</span>
				{/* A zero prints as words, never as a number beside a range. Counting
				    started on a day, and this page may not have had one yet. */}
				{target.total === 0 ? (
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
						{targetNote(target.openable, target.total)}
					</span>
				) : (
					<>
						<span className="font-mono text-sm font-black text-accent">
							{formatExact(target.total)}
						</span>
						<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
							deduped daily visitors · {range} · not page loads
						</span>
					</>
				)}
				<Link
					to="/settings/analytics"
					className="ml-auto flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-secondary hover:text-accent-lime"
				>
					All pages
					<ArrowRight aria-hidden="true" className="size-3" />
				</Link>
			</div>
		</div>
	);
}

export { StackViewsLine, StackViewsLineView };
