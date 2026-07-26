import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { headline, KICKER, lastCheckedLine } from "./copy";
import { MONO_LABEL } from "./parts";

/**
 * The owner's way in to "what's changed", on the stack page.
 *
 * Owner-only by construction: `getReconcileSuggestions` throws for anyone else,
 * so the query is skipped unless the caller has already established ownership.
 * It renders nothing while that is unknown, which is also every visitor's case.
 */
export function ChangesBanner({
	stackId,
	stackSlug,
	isOwner,
}: {
	stackId: Id<"stacks">;
	stackSlug: string;
	isOwner: boolean;
}) {
	const data = useQuery(
		api.measured.getReconcileSuggestions,
		isOwner ? { stackId } : "skip",
	);
	if (!isOwner || data === undefined) return null;

	const openCount = data.suggestions.length;
	return (
		<Link
			to="/stacks/$slug/changes"
			params={{ slug: stackSlug }}
			className="group mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border border-stroke-subtle bg-bg-panel/40 px-5 py-4 transition-colors hover:border-accent-lime"
		>
			<div className="min-w-0 flex-1">
				<p className={cn(MONO_LABEL, "text-accent-lime")}>{KICKER}</p>
				<p className="mt-1.5 font-semibold text-fg-primary">
					{headline({
						hasSnapshot: data.hasSnapshot,
						openCount,
						doneCount: 0,
					})}
				</p>
			</div>
			<span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-muted">
				{lastCheckedLine(
					data.hasSnapshot,
					data.receivedAt ? timeAgo(data.receivedAt) : "never",
				)}
			</span>
			<span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-secondary group-hover:text-accent-lime">
				Take a look
				<ArrowRight className="size-3" />
			</span>
		</Link>
	);
}
