/**
 * PROTOTYPE (#107) — `/prototype/freshness`.
 *
 * Throwaway route. It answers one question: when a stack has not synced for
 * more than 48 hours, or has never synced at all, where does the page say so,
 * and does the owner read one element or two?
 *
 * Three axes, so every case is one click away:
 *
 *   Variant — A (header line) · B (band above) · C (stamp + switch)
 *   Seen as — Visitor · Owner with auto-sync off · Owner with auto-sync on
 *   State   — Fresh 5h · Stale 3d · Quiet 19d · No sync ever
 *
 * The hero and the reading are stand-ins with the real weight and order, not
 * the live components: those are typed against Convex return values, and the
 * question is about placement. Delete this file when #107 is decided.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import {
	FreshnessSection,
	VARIANT_LABELS,
	VARIANTS,
	type VariantKey,
} from "@/features/measured/prototype/FreshnessVariants";
import {
	FRESHNESS_LABELS,
	FRESHNESS_STATES,
	type FreshnessKey,
	freshness,
	STALE_AFTER_HOURS,
	VIEWER_LABELS,
	VIEWERS,
	type ViewerKey,
} from "@/features/measured/prototype/freshness";

type Search = { variant: VariantKey; as: ViewerKey; state: FreshnessKey };

export const Route = createFileRoute("/prototype/freshness")({
	component: PrototypeFreshness,
	validateSearch: (search: Record<string, unknown>): Search => ({
		variant: VARIANTS.includes(search.variant as VariantKey)
			? (search.variant as VariantKey)
			: "A",
		as: VIEWERS.includes(search.as as ViewerKey)
			? (search.as as ViewerKey)
			: "visitor",
		state: FRESHNESS_STATES.includes(search.state as FreshnessKey)
			? (search.state as FreshnessKey)
			: "stale",
	}),
});

/** A stand-in for the stack hero: same weight and order, none of the wiring. */
function MockHero() {
	return (
		<header className="border-b border-stroke-strong bg-bg-panel px-6 py-10 md:px-16">
			<div className="mx-auto max-w-content">
				<p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
					Stack · by Alper
				</p>
				<h1 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-tighter text-fg-primary md:text-6xl">
					Alper's Agent Stack
				</h1>
				<p className="mt-4 max-w-prose text-sm leading-relaxed text-fg-secondary">
					Claude Code and Codex side by side, with the cheap model on review.
				</p>
				<div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-stroke-subtle pt-4">
					<span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
						9T · 4M · ▲21 · updated Aug 3, 2026
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

/** A stand-in for the section that follows, so the state has a page below it. */
function MockNextSection() {
	return (
		<section className="border-t border-stroke-subtle px-6 py-12 md:px-16">
			<div className="mx-auto max-w-content">
				<p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
					02 · Projects
				</p>
				<p className="mt-4 border border-dashed border-stroke-strong px-4 py-10 text-center font-mono text-xs text-fg-muted">
					The rest of the journey renders here. Stand-in for placement only.
				</p>
			</div>
		</section>
	);
}

function PrototypeFreshness() {
	const { variant, as, state } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const f = freshness(state, Date.now());

	return (
		<>
			<div className="min-h-screen bg-bg-canvas pb-28 text-fg-primary">
				<MockHero />
				<FreshnessSection variant={variant} viewer={as} f={f} />
				<MockNextSection />
				<div className="mx-auto max-w-content px-6 pb-6 md:px-16">
					<p className="border border-dashed border-stroke-subtle px-4 py-3 font-mono text-[11px] leading-relaxed text-fg-muted">
						reading the prototype — the state shows past {STALE_AFTER_HOURS}{" "}
						hours, so “Fresh · 5h” draws nothing beyond the “checked 5 hours
						ago” meta that already ships. “No sync ever” draws the empty box
						that already ships, with no age and no warning, in every variant.
					</p>
				</div>
			</div>
			<PrototypeSwitcher
				label="Prototype #107"
				axes={[
					{
						name: "Variant",
						keys: VARIANTS,
						labels: VARIANT_LABELS,
						current: variant,
						arrowKeys: true,
						onPick: (k) =>
							navigate({ search: { variant: k as VariantKey, as, state } }),
					},
					{
						name: "Seen as",
						keys: VIEWERS,
						labels: VIEWER_LABELS,
						current: as,
						onPick: (k) =>
							navigate({ search: { variant, as: k as ViewerKey, state } }),
					},
					{
						name: "State",
						keys: FRESHNESS_STATES,
						labels: FRESHNESS_LABELS,
						current: state,
						onPick: (k) =>
							navigate({ search: { variant, as, state: k as FreshnessKey } }),
					},
				]}
			/>
		</>
	);
}
