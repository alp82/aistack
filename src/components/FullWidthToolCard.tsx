import { Plus } from "lucide-react";
import { PriceDisplay } from "@/components/PriceDisplay";
import { categoryConfig } from "@/config/categoryConfig";

interface ToolData {
	_id: string;
	name: string;
	slug: string;
	categories: string[];
	iconUrl?: string;
	websiteUrl?: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
	kind: "main" | "misc";
	primaryUsageLabel: string;
	tierName?: string;
	priceKind: "regular" | "discounted" | "bundle" | "usage_based" | "sponsored";
	bundleSlug?: string;
	notes?: string;
}

interface FullWidthToolCardProps {
	tool: ToolData;
	onBundleClick?: (bundleSlug: string) => void;
}

export function FullWidthToolCard({ tool, onBundleClick }: FullWidthToolCardProps) {
	const firstCat = tool.categories[0];
	const config = firstCat ? categoryConfig[firstCat as keyof typeof categoryConfig] : undefined;
	const Icon = config?.icon || Plus;

	return (
		<div className="flex items-center gap-3 border border-stroke-subtle rounded p-3 hover:border-stroke-strong transition-colors">
			{/* Icon */}
			{tool.iconUrl ? (
				<img
					src={tool.iconUrl}
					alt={tool.name}
					className="size-10 shrink-0 rounded border border-stroke-subtle bg-white object-contain p-1"
				/>
			) : (
				<div className="size-10 shrink-0 rounded border border-stroke-subtle bg-bg-panel-muted flex items-center justify-center">
					<Icon className="size-5 text-fg-muted" />
				</div>
			)}

			{/* Name & Tier */}
			<div className="flex-1 min-w-0">
				<span className="font-mono text-sm font-semibold text-fg-primary block">{tool.name}</span>
				<span className="font-mono text-[10px] text-fg-muted uppercase tracking-wider block mt-0.5">
					{tool.tierName ?? tool.primaryUsageLabel}
				</span>
			</div>

			{/* Price */}
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
				) : (
					<>
						{tool.price.fixed ? (
							<PriceDisplay
								amount={tool.price.fixed.amount}
								period={tool.price.fixed.period === "one_time" ? "/once" : "/mo"}
								size="sm"
								className="text-fg-primary"
							/>
						) : (
							<span className="font-mono text-sm font-bold text-fg-primary">Usage</span>
						)}
					</>
				)}
			</div>
		</div>
	);
}
