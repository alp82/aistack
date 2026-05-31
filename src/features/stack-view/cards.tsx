import { cn } from "@/lib/utils";
import {
	CARD,
	CARD_SURFACE,
	Chip,
	categoryColor,
	categoryLabel,
	PAD,
	PAD_SM,
	StackIcon,
	StackPrice,
	VisitLink,
} from "./ui";

// ---------------------------------------------------------------------------
// Data shapes — mirror convex/stacks.ts `getBySlug` so cards bind directly.
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

export type StackModel = {
	_id: string;
	name: string;
	provider: string;
	category?: string;
	iconUrl?: string;
	role: "primary" | "secondary" | "specialized";
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
		return (
			<StackPrice
				amount={tool.price.fixed.amount}
				period={tool.price.fixed.period}
				size={size}
				className="text-fg-primary"
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

// --- Tool cards -----------------------------------------------------------

export function ToolCardBig({
	tool,
	onBundleClick,
}: {
	tool: StackTool;
	onBundleClick?: (bundleSlug: string) => void;
}) {
	const color = categoryColor(tool.categories);
	return (
		<div
			className={cn(
				"group relative flex flex-col transition-all",
				CARD_SURFACE,
				PAD,
			)}
		>
			<div className="flex items-start gap-4">
				<StackIcon
					name={tool.name}
					src={tool.iconUrl}
					color={color}
					size="lg"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h3 className="truncate font-mono text-lg font-bold text-fg-primary">
								{tool.name}
							</h3>
							{tool.tierName && (
								<p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
									{tool.tierName}
								</p>
							)}
						</div>
						<div className="shrink-0 text-right">
							<PriceTag tool={tool} size="lg" onBundleClick={onBundleClick} />
						</div>
					</div>
				</div>
			</div>
			{tool.description && (
				<p className="mt-4 text-sm leading-relaxed text-fg-secondary">
					{tool.description}
				</p>
			)}
			<div className="mt-4 flex items-center justify-between pt-1">
				<Chip color={color}>{categoryLabel(tool.categories)}</Chip>
				<VisitLink href={tool.websiteUrl} />
			</div>
		</div>
	);
}

export function ToolCardMini({
	tool,
	onBundleClick,
}: {
	tool: StackTool;
	onBundleClick?: (bundleSlug: string) => void;
}) {
	const color = categoryColor(tool.categories);
	return (
		<div
			className={cn(
				"flex items-center gap-3 transition-all",
				CARD_SURFACE,
				PAD_SM,
			)}
		>
			<StackIcon name={tool.name} src={tool.iconUrl} color={color} size="sm" />
			<div className="min-w-0 flex-1">
				<p className="truncate font-mono text-sm font-semibold text-fg-primary">
					{tool.name}
				</p>
				{tool.tierName && (
					<p className="truncate font-mono text-[10px] uppercase tracking-wider text-fg-muted">
						{tool.tierName}
					</p>
				)}
			</div>
			<div className="shrink-0 text-right">
				<PriceTag tool={tool} size="sm" onBundleClick={onBundleClick} />
			</div>
		</div>
	);
}

// --- Model tile -----------------------------------------------------------

const ROLE_LABEL: Record<StackModel["role"], string> = {
	primary: "Primary",
	secondary: "Secondary",
	specialized: "Specialized",
};

export function ModelTile({ model }: { model: StackModel }) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 transition-all",
				CARD_SURFACE,
				PAD_SM,
			)}
		>
			<StackIcon
				name={model.name}
				src={model.iconUrl}
				color={{
					text: "text-accent-lime",
					bg: "bg-accent-lime/10",
					border: "border-accent-lime/40",
				}}
				size="sm"
			/>
			<div className="min-w-0 flex-1">
				<p className="truncate font-mono text-sm font-semibold text-fg-primary">
					{model.name}
				</p>
				<p className="truncate font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					{model.provider} · {ROLE_LABEL[model.role]}
				</p>
			</div>
		</div>
	);
}

// --- Bundle card (scroll target for "Bundle ↓" jumps) ---------------------

export function BundleCard({
	bundle,
	highlighted,
}: {
	bundle: StackBundle;
	highlighted?: boolean;
}) {
	return (
		<div
			id={`bundle-${bundle.slug}`}
			className={cn(
				"flex scroll-mt-24 flex-col transition-all",
				CARD.border,
				CARD.bg,
				highlighted
					? "animate-pulse border-accent-lime ring-2 ring-accent-lime/50"
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
								{bundle.name}
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
			<div className="mt-4 flex items-center justify-end pt-1">
				<VisitLink href={bundle.websiteUrl} />
			</div>
		</div>
	);
}
