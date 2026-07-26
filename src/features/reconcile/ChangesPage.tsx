import { Link } from "@tanstack/react-router";
import { ArrowLeft, Rows3, Square } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { headline, KICKER } from "./copy";
import {
	AddedPane,
	FreshLine,
	HiddenPane,
	Meter,
	MONO_LABEL,
	NeverCheckedBox,
	OneItem,
	WholeList,
} from "./parts";
import { useReconcileRun } from "./useReconcileRun";

/**
 * "What's changed" — variant J, locked by prototype #39.
 *
 * Three things are load-bearing and were each chosen over an alternative:
 *
 *   1. IT IS ITS OWN PAGE. Not the stack page, not an overlay, and explicitly
 *      not the stack editor (#34).
 *   2. THE BANNER IS THE PAGE NAV. It sticks, so the meter and the freshness
 *      line are never more than a glance away while you work.
 *   3. ONE METER ACROSS BOTH VIEWS. Answering a row in the list moves exactly
 *      what answering the card moves. The per-item stepper is gone — it lost
 *      all sense of progress the moment you switched to the list.
 *
 * `hasSnapshot: false` IS NOT AN EMPTY PAGE. The what-for half is derived from
 * the authored tools with no snapshot involved, so a stack that has never
 * synced still has real work here.
 */
type View = "one" | "list" | "added" | "hidden";

export function ChangesPage({
	stackId,
	stackName,
	stackSlug,
}: {
	stackId: Id<"stacks">;
	stackName: string;
	stackSlug: string;
}) {
	const run = useReconcileRun(stackId);
	const [view, setView] = useState<View>("one");

	return (
		<div className="min-h-screen bg-bg-canvas">
			<div className="mx-auto max-w-3xl px-6 pt-8">
				<Link
					to="/stacks/$slug"
					params={{ slug: stackSlug }}
					className={cn(
						MONO_LABEL,
						"inline-flex items-center gap-2 text-fg-muted hover:text-accent-lime",
					)}
				>
					<ArrowLeft className="size-3" />
					{stackName}
				</Link>
			</div>

			<div className="sticky top-0 z-30 mt-6 border-y border-stroke-subtle bg-bg-canvas/95 backdrop-blur">
				<div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-8 gap-y-4 px-6 py-5">
					<div className="min-w-0 flex-1">
						<p className={cn(MONO_LABEL, "text-accent-lime")}>{KICKER}</p>
						<p className="mt-1.5 text-xl font-bold text-fg-primary">
							{run.loading
								? "Reading your stack…"
								: headline({
										hasSnapshot: run.hasSnapshot,
										openCount: run.open.length,
										doneCount: run.doneCount,
									})}
						</p>
						<div className="mt-1.5">
							<FreshLine run={run} />
						</div>
					</div>
					<Meter run={run} />
				</div>
			</div>

			<div className="mx-auto max-w-3xl px-6 py-8">
				<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-stretch border border-stroke-strong">
						{(
							[
								["one", Square, "One at a time"],
								["list", Rows3, "Whole list"],
							] as const
						).map(([key, Icon, label]) => (
							<button
								type="button"
								key={key}
								onClick={() => setView(key)}
								aria-pressed={view === key}
								className={cn(
									"inline-flex cursor-pointer items-center gap-2 border-stroke-strong px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors [&:not(:first-child)]:border-l",
									view === key
										? "bg-accent-lime text-accent-lime-contrast"
										: "text-fg-secondary hover:text-accent-lime",
								)}
							>
								<Icon className="size-3.5" />
								{label}
							</button>
						))}
					</div>

					<div className="flex items-center gap-4">
						{(
							[
								["added", "Added", run.added.length],
								["hidden", "Hidden", run.hidden.length],
							] as const
						).map(([key, label, count]) => (
							<button
								type="button"
								key={key}
								onClick={() => setView(key)}
								aria-pressed={view === key}
								className={cn(
									"cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
									view === key
										? "text-accent-lime underline underline-offset-4"
										: "text-fg-muted hover:text-accent-lime",
								)}
							>
								{label} ({count})
							</button>
						))}
					</div>
				</div>

				{run.error && (
					<p className="mb-6 border border-destructive/40 bg-destructive/5 px-4 py-3 font-mono text-xs text-destructive">
						{run.error}
					</p>
				)}

				{run.loading ? (
					// Never fall through to the views while loading: an empty list and
					// a list that has not arrived look identical, and one of them
					// says "nothing to look at" when there is plenty.
					<p className="border border-stroke-subtle p-6 font-mono text-sm text-fg-muted">
						Loading...
					</p>
				) : (
					<>
						{!run.hasSnapshot && (
							<div className="mb-8">
								<NeverCheckedBox />
							</div>
						)}

						{view === "one" && <OneItem run={run} item={run.open[0]} />}
						{view === "list" && <WholeList run={run} />}
						{view === "added" && <AddedPane run={run} />}
						{view === "hidden" && <HiddenPane run={run} />}
					</>
				)}
			</div>
		</div>
	);
}
