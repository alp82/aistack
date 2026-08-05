/**
 * PROTOTYPE (#98) — `/prototype/views-stack`.
 *
 * Throwaway route. A stack page is public and its owner now gets a private
 * number on it, so this route exists to answer one question: does that number
 * read as private, and does it vanish for everyone else?
 *
 * The hero here is a stand-in, not the real `StackHeader` — that component is
 * typed against live Convex return values and mocking it whole would take
 * longer than the question is worth. Its shape, weight and order match, which
 * is what placement needs. Flip "Seen as" to Visitor: the strip must be gone.
 *
 * Delete this file when #98 is decided.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import {
	DATA_STATE_LABELS,
	DATA_STATES,
	type DataState,
	fixture,
} from "@/features/settings/prototype/fixtures";
import {
	STACK_SHAPE_LABELS,
	STACK_SHAPES,
	type StackShapeKey,
	StackViewsS1,
	StackViewsS2,
} from "@/features/stack-view/prototype/StackViewsLine";

type Seen = "owner" | "visitor";

type Search = { shape: StackShapeKey; data: DataState; as: Seen };

export const Route = createFileRoute("/prototype/views-stack")({
	component: PrototypeViewsStack,
	validateSearch: (search: Record<string, unknown>): Search => ({
		shape: STACK_SHAPES.includes(search.shape as StackShapeKey)
			? (search.shape as StackShapeKey)
			: "S1",
		data: DATA_STATES.includes(search.data as DataState)
			? (search.data as DataState)
			: "thin",
		as: search.as === "visitor" ? "visitor" : "owner",
	}),
});

/** A stand-in for the hero: same weight and order, none of the wiring. */
function MockHero() {
	return (
		<header className="border-b border-stroke-strong bg-bg-panel px-6 py-10 md:px-16">
			<div className="mx-auto max-w-content">
				<p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
					Stack · by Jules Okonkwo
				</p>
				<h1 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-tighter text-fg-primary md:text-6xl">
					Terminal-first daily driver
				</h1>
				<p className="mt-4 max-w-prose text-sm leading-relaxed text-fg-secondary">
					Claude Code in a tmux split, with a cheap model on the review pass.
				</p>
				<div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-stroke-subtle pt-4">
					<span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
						7T · 3M · ▲12 · updated Aug 2, 2026
					</span>
					<span className="font-mono text-2xl font-black text-fg-primary">
						$200
						<span className="text-[10px] text-fg-muted">+/mo</span>
					</span>
				</div>
			</div>
		</header>
	);
}

/** A stand-in for the first numbered section, so the strip has a page to sit on. */
function MockSection() {
	return (
		<section className="px-6 py-12 md:px-16">
			<div className="mx-auto max-w-content">
				<p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
					01 · Actual usage
				</p>
				<p className="mt-4 border border-dashed border-stroke-strong px-4 py-10 text-center font-mono text-xs text-fg-muted">
					The measured reading renders here. Stand-in for placement only.
				</p>
			</div>
		</section>
	);
}

function PrototypeViewsStack() {
	const { shape, data: state, as } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const data = fixture(state, Date.now());
	const isOwner = as === "owner";

	return (
		<>
			<div className="min-h-screen bg-bg-canvas pb-24 text-fg-primary">
				<MockHero />
				{isOwner && (
					<div className="mx-auto max-w-content px-6 pt-6 md:px-16">
						{shape === "S1" ? (
							<StackViewsS1 data={data} />
						) : (
							<StackViewsS2 data={data} />
						)}
					</div>
				)}
				<MockSection />
			</div>
			<PrototypeSwitcher
				axes={[
					{
						name: "Shape",
						keys: STACK_SHAPES,
						labels: STACK_SHAPE_LABELS,
						current: shape,
						arrowKeys: true,
						onPick: (k) =>
							navigate({
								search: { shape: k as StackShapeKey, data: state, as },
							}),
					},
					{
						name: "Seen as",
						keys: ["owner", "visitor"],
						labels: { owner: "Owner", visitor: "Visitor" },
						current: as,
						onPick: (k) =>
							navigate({ search: { shape, data: state, as: k as Seen } }),
					},
					{
						name: "Data",
						keys: DATA_STATES,
						labels: DATA_STATE_LABELS,
						current: state,
						onPick: (k) =>
							navigate({ search: { shape, data: k as DataState, as } }),
					},
				]}
			/>
		</>
	);
}
