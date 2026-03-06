import { ExternalLink, Plus } from "lucide-react";
import { PriceDisplay } from "@/components/PriceDisplay";
import { ItemIcon } from "@/components/ItemIcon";
import { categoryConfig } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";

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

export function MainToolCard({ tool }: { tool: ToolData }) {
	const firstCat = tool.categories[0];
	const config = firstCat ? categoryConfig[firstCat as keyof typeof categoryConfig] : undefined;
	const Icon = config?.icon || Plus;

	return (
		<div className="bg-slate-700/40 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
			<div className="flex items-start gap-3">
				<ItemIcon src={tool.iconUrl} alt={tool.name} size="md" fallbackIcon={Icon} />
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-1">
						<span className="font-semibold text-white truncate">{tool.name}</span>
						<span className="text-lg font-bold text-white ml-2 flex-shrink-0">
							{tool.priceKind === "sponsored" ? (
								<span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">Sponsored</span>
							) : tool.priceKind === "bundle" ? (
								<span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">Bundle</span>
							) : (
								<>
									{tool.price.fixed ? `$${tool.price.fixed.amount}` : "Usage"}
									{tool.price.fixed && (
										<span className="text-xs text-gray-500 font-normal">
											/{tool.price.fixed.period === "one_time" ? "once" : "mo"}
										</span>
									)}
								</>
							)}
						</span>
					</div>
					<div className="flex items-center gap-1.5 flex-wrap mb-1">
						{tool.categories.map((cat) => {
							const catConfig = categoryConfig[cat as keyof typeof categoryConfig];
							const CatIcon = catConfig?.icon || Plus;
							return (
								<span key={cat} className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", catConfig?.bgColor || "bg-gray-700", catConfig?.textColor || "text-gray-300")}>
									<CatIcon className="h-3 w-3" />
									{catConfig?.label || cat}
								</span>
							);
						})}
						{tool.priceKind === "discounted" && (
							<span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Discounted</span>
						)}
						{tool.priceKind === "sponsored" && (
							<span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Sponsored</span>
						)}
					</div>
					<p className="text-sm text-gray-400">{tool.primaryUsageLabel}</p>
					{tool.notes && <p className="text-xs text-gray-500 mt-1">{tool.notes}</p>}
					{tool.websiteUrl && (
						<a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-flex items-center gap-1">
							Visit site <ExternalLink className="h-3 w-3" />
						</a>
					)}
				</div>
			</div>
		</div>
	);
}

interface MiscToolCardProps {
	tool: ToolData;
	onBundleClick?: (bundleSlug: string) => void;
}

export function MiscToolCard({ tool, onBundleClick }: MiscToolCardProps) {
	const firstCat2 = tool.categories[0];
	const config2 = firstCat2 ? categoryConfig[firstCat2 as keyof typeof categoryConfig] : undefined;
	const Icon2 = config2?.icon || Plus;

	return (
		<div className="flex items-center gap-3 border border-stroke-subtle rounded p-3 hover:border-stroke-strong transition-colors">
			<ItemIcon src={tool.iconUrl} alt={tool.name} size="sm" fallbackIcon={Icon2} />
			<div className="flex-1 min-w-0">
				<span className="font-mono text-sm font-semibold text-fg-primary block truncate">{tool.name}</span>
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
				) : (
					tool.price.fixed ? (
						<PriceDisplay
							amount={tool.price.fixed.amount}
							period={tool.price.fixed.period === "one_time" ? "/once" : "/mo"}
							size="sm"
							className="text-fg-primary"
						/>
					) : (
						<span className="font-mono text-sm font-bold text-fg-primary">Usage</span>
					)
				)}
			</div>
		</div>
	);
}
