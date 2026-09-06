import { useScrollHighlight } from "@/lib/useScrollHighlight";
import { cn } from "@/lib/utils";
import {
	CARD,
	categoryColor,
	categoryLabel,
	PAD,
	StackIcon,
	StackPrice,
} from "./ui";

// ---------------------------------------------------------------------------
// Data shapes - mirror convex/stacks.ts `getBySlug` so cards bind directly.
// ---------------------------------------------------------------------------

type Money = {
	pricingType: string;
	fixed?: {
		currency: string;
		amount: number;
		period: "month" | "year" | "one_time";
	};
};

export type StackTool = {
	_id: string;
	name: string;
	slug?: string;
	categories: string[];
	iconUrl?: string;
	websiteUrl?: string;
	price: Money;
	originalTierPrice?: { amount: number; period: "month" | "year" | "one_time" };
	kind: "main" | "misc";
	primaryUsageLabel: string;
	tierName: string;
	priceKind: "regular" | "discounted" | "bundle" | "usage_based" | "sponsored";
	bundleSlug?: string;
	description?: string;
};

export type StackBundle = {
	_id: string;
	name: string;
	slug: string;
	description?: string;
	iconUrl?: string;
	websiteUrl?: string;
	tierName: string;
	price: Money;
};

// --- Tool price tag -------------------------------------------------------

export function PriceTag({
	tool,
	size = "md",
	onBundleClick,
}: {
	tool: StackTool;
	size?: "sm" | "md" | "lg";
	onBundleClick?: (bundleSlug: string) => void;
}) {
	if (tool.priceKind === "sponsored") {
		return (
			<span className="inline-block border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
				Sponsored
			</span>
		);
	}
	if (tool.priceKind === "bundle") {
		const slug = tool.bundleSlug;
		return (
			<button
				type="button"
				onClick={() => slug && onBundleClick?.(slug)}
				className="font-mono text-xs text-purple-400 transition-colors hover:text-purple-300"
			>
				Bundle ↓
			</button>
		);
	}
	if (tool.price.fixed && tool.price.fixed.amount > 0) {
		// Lime mono, right-aligned: the prototype's price column (#356).
		return (
			<StackPrice
				amount={tool.price.fixed.amount}
				period={tool.price.fixed.period}
				size={size}
				className="text-accent-lime"
			/>
		);
	}
	if (tool.price.fixed && tool.price.fixed.amount === 0) {
		return (
			<span className="font-mono text-sm font-bold text-accent-lime">Free</span>
		);
	}
	return (
		<span className="font-mono text-sm font-bold text-fg-primary">Usage</span>
	);
}

// --- Tool rows -----------------------------------------------------------

/**
 * One tool per line (#356, prototype v37): the logo, the name (a link to the
 * site where there is one), the category and tier in mono, the price at the
 * right edge in the accent. The authored note, where the owner wrote one,
 * takes a second line under the name: it is the one thing on the row the
 * catalog did not write.
 */
export function ToolRow({
	tool,
	onBundleClick,
}: {
	tool: StackTool;
	onBundleClick?: (bundleSlug: string) => void;
}) {
	const color = categoryColor(tool.categories);
	const facts = [categoryLabel(tool.categories), tool.tierName]
		.filter((fact) => fact && fact.trim().length > 0)
		.join(" · ");
	return (
		<div
			data-testid="tool-row"
			className="flex items-start gap-3 border-b border-stroke-subtle py-2.5"
		>
			<StackIcon
				name={tool.name}
				src={tool.iconUrl}
				color={color}
				size="sm"
				className="mt-0.5 size-7 p-0.5"
			/>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
					{tool.websiteUrl ? (
						<a
							href={tool.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="truncate text-sm font-semibold text-fg-primary transition-colors hover:text-accent-lime"
						>
							{tool.name}
						</a>
					) : (
						<span className="truncate text-sm font-semibold text-fg-primary">
							{tool.name}
						</span>
					)}
					{facts && (
						<span className="truncate font-mono text-[11px] text-fg-muted">
							{facts}
						</span>
					)}
				</div>
				{tool.description && (
					<p className="mt-0.5 text-xs leading-snug text-fg-secondary">
						{tool.description}
					</p>
				)}
			</div>
			<div className="shrink-0 pt-0.5 text-right">
				<PriceTag tool={tool} size="sm" onBundleClick={onBundleClick} />
			</div>
		</div>
	);
}

// --- Model share formatting ----------------------------------------------

/** "62%" from a share; below half a percent prints "<1%". Numbers only. */
export function formatShare(share: number): string {
	const pct = Math.round(share * 100);
	return pct === 0 && share > 0 ? "<1%" : `${pct}%`;
}

// --- Bundle card (scroll target for "Bundle ↓" jumps) ---------------------

export function BundleCard({
	bundle,
	highlighted,
}: {
	bundle: StackBundle;
	highlighted?: boolean;
}) {
	const { ref, reduce } = useScrollHighlight<HTMLDivElement>(highlighted, {
		block: "center",
	});

	return (
		<div
			ref={ref}
			id={`bundle-${bundle.slug}`}
			className={cn(
				"flex scroll-mt-24 flex-col transition-all",
				CARD.border,
				CARD.bg,
				highlighted
					? cn(
							"border-accent-lime ring-2 ring-accent-lime/50",
							!reduce && "animate-pulse",
						)
					: CARD.hover,
				PAD,
			)}
		>
			<div className="flex items-start gap-4">
				<StackIcon
					name={bundle.name}
					src={bundle.iconUrl}
					color={{
						text: "text-accent-lime",
						bg: "bg-accent-lime/10",
						border: "border-accent-lime/40",
					}}
					size="lg"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h3 className="font-mono text-base font-bold text-fg-primary">
								{bundle.websiteUrl ? (
									<a
										href={bundle.websiteUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="transition-colors hover:text-accent-lime"
									>
										{bundle.name}
									</a>
								) : (
									bundle.name
								)}
							</h3>
							{bundle.tierName && (
								<p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
									{bundle.tierName}
								</p>
							)}
						</div>
						{bundle.price.fixed ? (
							<StackPrice
								amount={bundle.price.fixed.amount}
								period={bundle.price.fixed.period}
								size="lg"
								className="text-fg-primary"
							/>
						) : (
							<span className="font-mono text-sm font-bold text-fg-primary">
								Usage
							</span>
						)}
					</div>
				</div>
			</div>
			{bundle.description && (
				<p className="mt-4 text-sm leading-relaxed text-fg-secondary">
					{bundle.description}
				</p>
			)}
		</div>
	);
}
