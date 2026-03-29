import { Plus } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import { PriceDisplay } from "@/components/PriceDisplay";
import { categoryConfig } from "@/config/categoryConfig";
import type { BillingPeriod } from "@/lib/pricing";

export interface ToolItemData {
	_id: string;
	name: string;
	slug: string;
	categories: string[];
	iconUrl?: string;
	websiteUrl?: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: BillingPeriod };
	};
	kind: "main" | "misc";
	primaryUsageLabel: string;
	tierName?: string;
	priceKind: "regular" | "discounted" | "bundle" | "usage_based" | "sponsored";
	bundleSlug?: string;
	description?: string;
}

interface ToolItemProps {
	tool: ToolItemData;
	size?: "sm" | "md";
	onBundleClick?: (bundleSlug: string) => void;
}

export function ToolItem({ tool, size = "sm", onBundleClick }: ToolItemProps) {
	const firstCat = tool.categories[0];
	const config = firstCat
		? categoryConfig[firstCat as keyof typeof categoryConfig]
		: undefined;
	const Icon = config?.icon || Plus;

	return (
		<div className="flex items-center gap-3 border border-stroke-subtle p-3 hover:border-stroke-strong transition-colors">
			<ItemIcon
				src={tool.iconUrl}
				alt={tool.name}
				size={size}
				fallbackIcon={Icon}
			/>
			<div className="flex-1 min-w-0">
				<span className="font-mono text-sm font-semibold text-fg-primary block truncate">
					{tool.name}
				</span>
				<span className="font-mono text-[10px] text-fg-muted uppercase tracking-wider block mt-0.5">
					{tool.tierName ?? tool.primaryUsageLabel}
				</span>
			</div>
			<div className="shrink-0 text-right">
				{tool.priceKind === "sponsored" ? (
					<span className="inline-block border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
						Sponsored
					</span>
				) : tool.priceKind === "bundle" ? (
					<button
						type="button"
						onClick={() => tool.bundleSlug && onBundleClick?.(tool.bundleSlug)}
						className="font-mono text-xs text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
					>
						Bundle ↓
					</button>
				) : tool.price.fixed ? (
					<PriceDisplay
						amount={tool.price.fixed.amount}
						period={tool.price.fixed.period}
						size="sm"
						className="text-fg-primary"
					/>
				) : (
					<span className="font-mono text-sm font-bold text-fg-primary">
						Usage
					</span>
				)}
			</div>
		</div>
	);
}
