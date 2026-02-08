import { ExternalLink, Plus } from "lucide-react";
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

export function MiscToolCard({ tool }: { tool: ToolData }) {
	const config = categoryConfig[tool.category as keyof typeof categoryConfig];
	const Icon = config?.icon || Plus;

	return (
		<div className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-slate-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
			{tool.iconUrl ? (
				<img src={tool.iconUrl} alt={tool.name} className="h-6 w-6 rounded object-contain bg-white p-0.5 flex-shrink-0" />
			) : (
				<div className="h-6 w-6 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
					<Icon className="h-3.5 w-3.5 text-gray-400" />
				</div>
			)}
			<span className="text-sm font-medium text-gray-300 truncate">{tool.name}</span>
			<span className={cn("inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0", config?.bgColor || "bg-gray-700", config?.textColor || "text-gray-300")}>
				{config?.label || tool.category}
			</span>
			{tool.priceKind === "bundle" ? (
				<span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full flex-shrink-0">Bundle</span>
			) : (
				<span className="text-xs text-gray-500 flex-shrink-0">
					{tool.price.fixed ? `$${tool.price.fixed.amount}/${tool.price.fixed.period === "one_time" ? "once" : "mo"}` : "Usage"}
				</span>
			)}
		</div>
	);
}
