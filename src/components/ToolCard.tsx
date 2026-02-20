import { ExternalLink, Plus } from "lucide-react";
import { CategoryLabel } from "@/components/CategoryLabel";
import { PriceDisplay } from "@/components/PriceDisplay";
import { categoryConfig } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";

interface ToolData {
	_id: string;
	name: string;
	slug: string;
	category: string;
	iconUrl?: string;
	websiteUrl?: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
	kind: "main" | "misc";
	primaryUsageLabel: string;
	priceKind: "regular" | "discounted" | "bundle" | "usage_based";
	bundleSlug?: string;
	notes?: string;
}

export function MainToolCard({ tool }: { tool: ToolData }) {
	const config = categoryConfig[tool.category as keyof typeof categoryConfig];
	const Icon = config?.icon || Plus;

	return (
		<div className="bg-slate-700/40 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
			<div className="flex items-start gap-3">
				{tool.iconUrl ? (
					<img src={tool.iconUrl} alt={tool.name} className="h-10 w-10 rounded-lg object-contain bg-white p-1 flex-shrink-0" />
				) : (
					<div className="h-10 w-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
						<Icon className="h-5 w-5 text-gray-400" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-1">
						<span className="font-semibold text-white truncate">{tool.name}</span>
						<span className="text-lg font-bold text-white ml-2 flex-shrink-0">
							{tool.priceKind === "bundle" ? (
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
						<span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", config?.bgColor || "bg-gray-700", config?.textColor || "text-gray-300")}>
							<Icon className="h-3 w-3" />
							{config?.label || tool.category}
						</span>
						{tool.priceKind === "discounted" && (
							<span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Discounted</span>
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
	const config = categoryConfig[tool.category as keyof typeof categoryConfig];
	const Icon = config?.icon || Plus;

	return (
		<div className="flex items-center gap-3 px-4 py-3 bg-bg-panel border-2 border-stroke-strong hover:border-accent-lime/50 transition-colors">
			{tool.iconUrl ? (
				<img src={tool.iconUrl} alt={tool.name} className="size-8 shrink-0 border border-stroke-subtle bg-white object-contain p-1" />
			) : (
				<div className="size-8 shrink-0 border border-stroke-subtle bg-bg-panel-muted flex items-center justify-center">
					<Icon className="size-4 text-fg-muted" />
				</div>
			)}
			<span className="text-sm font-semibold text-fg-primary truncate">{tool.name}</span>
			<CategoryLabel category={tool.category} className="ml-auto shrink-0" />
			{tool.websiteUrl && (
				<a
					href={tool.websiteUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="shrink-0 text-[10px] text-accent-lime hover:text-accent-lime-strong inline-flex items-center gap-0.5 font-mono uppercase tracking-wide"
				>
					Visit <ExternalLink className="size-2.5" />
				</a>
			)}
			{tool.priceKind === "bundle" ? (
				<button
					type="button"
					onClick={() => tool.bundleSlug && onBundleClick?.(tool.bundleSlug)}
					className="font-mono text-[10px] font-semibold uppercase tracking-wide bg-purple-500/20 text-purple-400 hover:text-purple-300 px-1.5 py-0.5 shrink-0 cursor-pointer transition-colors"
				>
					Bundle ↓
				</button>
			) : (
				tool.price.fixed ? (
					<PriceDisplay
						amount={tool.price.fixed.amount}
						period={tool.price.fixed.period === "one_time" ? "/once" : "/mo"}
						size="sm"
						className="shrink-0 text-fg-primary"
					/>
				) : (
					<span className="font-mono text-sm font-bold text-fg-primary shrink-0">Usage</span>
				)
			)}
		</div>
	);
}
