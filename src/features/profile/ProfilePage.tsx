import { Link } from "@tanstack/react-router";
import { Layers, Plus } from "lucide-react";
import {
	type ProfileData,
	ProfileIdentity,
} from "@/features/profile/ProfileIdentity";
import { formatPriceDisplay } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type ProfileStackCard = {
	_id: string;
	name: string;
	slug: string;
	oneLiner: string;
	published: boolean;
	updatedAt: number;
	fixedTotal?: { currency: string; amount: number; period: string };
	hasUsageComponent: boolean;
	toolCount: number;
	modelCount: number;
	upvoteCount: number;
};

type OwnProfileData = {
	isOwner: true;
	draftStacks: ProfileStackCard[];
};

type ProfilePageProps = {
	profile: ProfileData;
	stacks: ProfileStackCard[];
	/** Owner-only companion data (null for visitors/guests). */
	ownProfile: OwnProfileData | null;
	/**
	 * PROTOTYPE (#98) — what the owner-only view-analytics region renders.
	 *
	 * Rendered only when `ownProfile` says the reader owns this profile, so a
	 * visitor never receives it. Falls back to today's planned-seam when nothing
	 * is passed. The prototype route feeds this; #98 decides what ships here.
	 */
	ownerViewsSlot?: React.ReactNode;
};

function formatUpdatedAt(updatedAt: number): string {
	return new Date(updatedAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function StackCardBody({ stack }: { stack: ProfileStackCard }) {
	const price = formatPriceDisplay(
		stack.fixedTotal?.amount ?? 0,
		"month",
		"floor",
	);

	return (
		<>
			<h3 className="text-xl font-black uppercase tracking-tight group-hover:text-accent-lime">
				{stack.name}
			</h3>
			<p className="mt-1.5 text-sm text-fg-secondary">{stack.oneLiner}</p>
			<div className="mt-4 flex items-end justify-between gap-2 border-t border-stroke-subtle pt-3 font-mono">
				<span className="text-[10px] uppercase tracking-wider text-fg-muted">
					{stack.toolCount}T · {stack.modelCount}M · ▲{stack.upvoteCount} ·{" "}
					{formatUpdatedAt(stack.updatedAt)}
				</span>
				<span className="text-lg font-black text-fg-primary">
					${price.amountText}
					{stack.hasUsageComponent && "+"}
					<span className="text-[10px] text-fg-muted">/mo</span>
				</span>
			</div>
		</>
	);
}

function Seam({ label, note }: { label: string; note: string }) {
	return (
		<div className="border border-dashed border-stroke-strong px-4 py-3 opacity-60">
			<span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
				{label}
			</span>
			<p className="mt-1 font-mono text-xs text-fg-muted">{note}</p>
		</div>
	);
}

/**
 * Public profile surface at `/@handle` — "Dossier split" layout: a sticky
 * identity sidebar on the left, the working column (stacks grid + seams for
 * future measured surfaces) on the right. The most-recent stack renders as a
 * full-width callout. Owner affordances (New stack, Edit profile, draft
 * cards) are gated on `ownProfile`.
 */
function ProfilePage({
	profile,
	stacks,
	ownProfile,
	ownerViewsSlot,
}: ProfilePageProps) {
	const isOwner = ownProfile?.isOwner === true;
	const draftStacks = ownProfile?.draftStacks ?? [];
	const stackCount = stacks.length + draftStacks.length;

	return (
		<div className="min-h-screen bg-bg-canvas text-fg-primary">
			<div className="mx-auto grid max-w-content grid-cols-1 gap-8 px-6 py-10 md:grid-cols-[300px_1fr] md:gap-12">
				{/* Identity column */}
				<ProfileIdentity profile={profile} isOwner={isOwner} />

				{/* Working column */}
				<main>
					<div className="mb-5 flex items-baseline justify-between border-b border-stroke-strong pb-3">
						<h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
							<Layers
								aria-hidden="true"
								className="mr-1.5 inline size-3.5 align-[-2px]"
							/>
							Stacks — {stackCount}
						</h2>
						{isOwner && (
							<Link
								to="/stacks/new"
								className="inline-flex items-center gap-1.5 border border-stroke-strong px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
							>
								<Plus aria-hidden="true" className="size-3" />
								New stack
							</Link>
						)}
					</div>

					{stackCount === 0 ? (
						<p className="border border-dashed border-stroke-strong px-4 py-6 text-center font-mono text-sm text-fg-muted">
							No stacks published yet.
						</p>
					) : (
						<div className="grid gap-4 lg:grid-cols-2">
							{stacks.map((stack, i) => (
								<Link
									key={stack._id}
									to="/stacks/$slug"
									params={{ slug: stack.slug }}
									className={cn(
										"group flex flex-col border border-stroke-strong bg-bg-panel p-5 transition-all hover:shadow-[6px_6px_0_var(--stroke-strong)]",
										i === 0 && "lg:col-span-2",
									)}
								>
									{i === 0 && (
										<span className="mb-3 self-start bg-accent-lime px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent-lime-contrast">
											Most recent
										</span>
									)}
									<StackCardBody stack={stack} />
								</Link>
							))}
							{draftStacks.map((stack) => (
								<Link
									key={stack._id}
									to="/stacks/$slug/edit"
									params={{ slug: stack.slug }}
									className="group flex flex-col border border-dashed border-stroke-strong bg-bg-panel p-5 transition-all hover:shadow-[6px_6px_0_var(--stroke-strong)]"
								>
									<span className="mb-3 self-start border border-stroke-strong px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-fg-muted">
										Draft
									</span>
									<StackCardBody stack={stack} />
								</Link>
							))}
						</div>
					)}

					<div className="mt-8 space-y-4">
						<Seam
							label="Live stats"
							note="Measured usage per stack — lands with auto-sync."
						/>
						{isOwner &&
							(ownerViewsSlot ?? (
								<Seam
									label="View analytics (owner-only)"
									note="Private per-profile dashboard — planned."
								/>
							))}
					</div>
				</main>
			</div>
		</div>
	);
}

export { ProfilePage };
export type { OwnProfileData, ProfileData, ProfilePageProps, ProfileStackCard };
