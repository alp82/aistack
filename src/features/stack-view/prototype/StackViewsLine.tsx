/**
 * PROTOTYPE (#98) — the owner-only view line on a PUBLIC stack page.
 *
 * Throwaway. This is the riskiest surface in the ticket. The profile panel sits
 * on a page whose owner region already exists. A stack page has no such region,
 * it is the page a creator screenshots and posts, and the number on it is
 * strictly private. So both shapes below are fenced and labeled, and both
 * render nothing at all for a visitor.
 *
 * S1 — one line. Lock, one number, the range, a link. Reads as a status bar.
 * S2 — a fenced box, the same shape the profile panel uses, carrying the trail.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import { formatExact, Sparkline } from "@/features/charts";
import { rangeLabel } from "@/features/settings/AnalyticsPage";
import type { AnalyticsData } from "@/features/settings/prototype/fixtures";

export const STACK_SHAPES = ["S1", "S2"] as const;
export type StackShapeKey = (typeof STACK_SHAPES)[number];

export const STACK_SHAPE_LABELS: Record<StackShapeKey, string> = {
	S1: "S1 · One line",
	S2: "S2 · Fenced box",
};

/** The stack this prototype speaks for: the busiest one in the fixture. */
function thisStack(data: AnalyticsData) {
	return data.targets.find((t) => t.targetId === "s1") ?? data.targets[0];
}

export function StackViewsS1({ data }: { readonly data: AnalyticsData }) {
	const t = thisStack(data);
	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);

	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-dashed border-stroke-strong px-4 py-2">
			<Lock aria-hidden="true" className="size-3 shrink-0 text-fg-muted" />
			<span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
				Only you can see this
			</span>
			<span className="font-mono text-sm font-black text-accent">
				{formatExact(t.total)}
			</span>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
				deduped daily visitors · {range} · not page loads
			</span>
			<Link
				to="/settings/analytics"
				className="ml-auto flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-secondary hover:text-accent-lime"
			>
				All pages
				<ArrowRight aria-hidden="true" className="size-3" />
			</Link>
		</div>
	);
}

export function StackViewsS2({ data }: { readonly data: AnalyticsData }) {
	const t = thisStack(data);
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
					Views — only you can see this
				</h2>
			</div>
			<div className="mt-3 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-3xl font-black text-accent">
						{formatExact(t.total)}
					</p>
					<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
						deduped daily visitors · {range}
					</p>
				</div>
				<Sparkline
					points={t.days}
					ariaLabel={`Daily visitors for ${t.label}`}
					width={140}
					height={36}
					area
				/>
			</div>
			<p className="mt-3 max-w-prose text-xs leading-relaxed text-fg-muted">
				One page counts one visitor once per day. A visitor is a browser on a
				network, not a person. Visits you make while signed in are left out.
				These are not page loads.
			</p>
			<Link
				to="/settings/analytics"
				className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary hover:text-accent-lime"
			>
				Every page, day by day
				<ArrowRight aria-hidden="true" className="size-3" />
			</Link>
		</section>
	);
}
