import { useQuery } from "convex/react";
import { ChevronRight } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { AutoSyncBox } from "@/features/measured/AutoSyncBox";
import { isStale } from "@/features/measured/freshness";
import { ChangesBannerView } from "@/features/reconcile/ChangesBanner";
import { StackViewsLineView } from "@/features/view-analytics/StackViewsLine";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { STACK_WIDTH } from "./ui";

/**
 * The owner drawer (#356, prototype v43): one quiet summary row between the
 * hero and the sticky navigation, on the shared content frame, that opens the
 * three owner tools on demand. Auto-sync, what's changed, and the private view
 * count. A reader renders nothing here.
 *
 * ONE SUBSCRIPTION PER QUERY. The summary row prints the suggestion count and
 * the view count, and the tools below print the same answers in full. The
 * drawer asks once and hands the answer down through the tools' view halves,
 * so opening it adds no query. The reading's own stamp (`receivedAt`) comes
 * from the route, which already holds the usage query for the hero and the
 * navigation.
 *
 * THE SUMMARY STAYS QUIET WHILE IT LOADS. A segment whose number has not
 * arrived is left out rather than replaced by a sentence, so the row never
 * reads "Checking changes · Checking views".
 *
 * PAST 48 HOURS THE DRAWER IS THE PAGE'S ONE REMEDY (#108). `staleSince` goes
 * to the auto-sync tool and nothing else on the page asks the owner for
 * anything.
 */
export function OwnerToolsDrawer({
	stackId,
	stackSlug,
	isOwner,
	receivedAt,
}: {
	stackId: Id<"stacks">;
	stackSlug: string;
	isOwner: boolean;
	/** When the last reading landed, from the route's usage query. */
	receivedAt: number | null;
}) {
	const changes = useQuery(
		api.measured.getReconcileSuggestions,
		isOwner ? { stackId } : "skip",
	);
	const analytics = useQuery(api.viewAnalytics.mine, isOwner ? {} : "skip");
	if (!isOwner) return null;

	const target = analytics?.targets.find((t) => t.targetId === stackId);
	const staleSince =
		receivedAt !== null && isStale(receivedAt) ? receivedAt : null;

	const counts = [
		changes === undefined
			? null
			: `${changes.suggestions.length} ${
					changes.suggestions.length === 1 ? "suggestion" : "suggestions"
				}`,
		target === undefined
			? null
			: `${target.total} ${target.total === 1 ? "view" : "views"}`,
	].filter((segment): segment is string => segment !== null);

	return (
		<div className={`mx-auto mb-6 px-6 ${STACK_WIDTH}`}>
			<details className="group bg-bg-shell px-4 py-3">
				<summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime [&::-webkit-details-marker]:hidden">
					<span className="font-bold uppercase tracking-[0.22em] text-accent-lime">
						Owner tools
					</span>
					{receivedAt !== null && (
						<span className="font-semibold text-fg-primary">
							Updated <RelativeTime at={receivedAt} />
						</span>
					)}
					{counts.length > 0 && (
						<span className="text-fg-muted">{counts.join(" · ")}</span>
					)}
					<ChevronRight
						aria-hidden="true"
						className="ml-auto size-3 text-fg-muted transition-transform group-open:rotate-90"
					/>
				</summary>
				<div className="mt-3 divide-y divide-stroke-subtle border-t border-stroke-subtle">
					<AutoSyncBox
						stackId={stackId}
						isOwner
						staleSince={staleSince}
						variant="compact"
					/>
					{changes !== undefined && (
						<ChangesBannerView
							data={changes}
							stackSlug={stackSlug}
							variant="compact"
						/>
					)}
					{analytics && target && (
						<StackViewsLineView
							data={analytics}
							target={target}
							variant="compact"
						/>
					)}
				</div>
			</details>
		</div>
	);
}
