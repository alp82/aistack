import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { headline, KICKER, lastCheckedLine } from "./copy";
import { MONO_LABEL } from "./parts";

/** What `getReconcileSuggestions` answers with, named once for both halves. */
export type ReconcileSummary = FunctionReturnType<
	typeof api.measured.getReconcileSuggestions
>;

/**
 * The owner's way in to "what's changed", on the stack page.
 *
 * Owner-only by construction: `getReconcileSuggestions` throws for anyone else,
 * so the query is skipped unless the caller has already established ownership.
 * It renders nothing while that is unknown, which is also every visitor's case.
 *
 * A caller that already holds the answer (the owner drawer, #356, reads it for
 * its summary count) renders `ChangesBannerView` directly, so the page keeps
 * one subscription per query.
 */
export function ChangesBanner({
	stackId,
	stackSlug,
	isOwner,
	variant,
}: {
	stackId: Id<"stacks">;
	stackSlug: string;
	isOwner: boolean;
	variant?: "band" | "compact";
}) {
	const data = useQuery(
		api.measured.getReconcileSuggestions,
		isOwner ? { stackId } : "skip",
	);
	if (!isOwner || data === undefined) return null;
	return (
		<ChangesBannerView data={data} stackSlug={stackSlug} variant={variant} />
	);
}

/**
 * The banner itself. `band` is the standalone panel with its own border and
 * top margin. `compact` is one row on a surface the caller owns: no border,
 * no background, row padding only.
 */
export function ChangesBannerView({
	data,
	stackSlug,
	variant = "band",
}: {
	data: ReconcileSummary;
	stackSlug: string;
	variant?: "band" | "compact";
}) {
	const openCount = data.suggestions.length;
	return (
		<Link
			to="/stacks/$slug/changes"
			params={{ slug: stackSlug }}
			className={cn(
				"group flex flex-wrap items-center gap-x-6 gap-y-2 transition-colors",
				variant === "compact"
					? "py-3"
					: "mt-6 border border-stroke-subtle bg-bg-panel/40 px-5 py-4 hover:border-accent-lime",
			)}
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
				{data.hasSnapshot ? (
					<>
						Checked{" "}
						{data.receivedAt ? <RelativeTime at={data.receivedAt} /> : "never"}
					</>
				) : (
					lastCheckedLine(false, "never")
				)}
			</span>
			<span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-secondary group-hover:text-accent-lime">
				Take a look
				<ArrowRight className="size-3" />
			</span>
		</Link>
	);
}
