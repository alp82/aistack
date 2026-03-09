import { motion } from "framer-motion";
import { ExternalLink, Pencil, Terminal } from "lucide-react";
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";

interface ToolCardTier {
	tierId: string;
	name: string;
	pricing: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
		usage?: { unit: string; pricePerUnit: number; currency: string; notes?: string };
	};
	isDefault?: boolean;
	updatedAt?: number;
}

export interface ToolCardData<TId = string> {
	_id: TId;
	name: string;
	slug: string;
	shortId?: string;
	aliases?: string[];
	categories: string[];
	iconUrl?: string;
	websiteUrl?: string;
	tiers: ToolCardTier[];
	createdAt: number;
}

interface ToolCardProps<TId = string> {
	tool: ToolCardData<TId>;
	onSuggestEdit?: (tool: ToolCardData<TId>) => void;
}

function formatPrice(tier: ToolCardTier) {
	if (tier.pricing.pricingType === "usage") return "Usage";
	if (!tier.pricing.fixed) return "—";
	const { amount, period } = tier.pricing.fixed;
	if (amount === 0) return "Free";
	const periodLabel =
		period === "one_time" ? "" : `/${period === "month" ? "mo" : "yr"}`;
	return `$${amount}${periodLabel}`;
}

export function ToolCard<TId = string>({ tool, onSuggestEdit }: ToolCardProps<TId>) {
	const maxVisible = tool.categories.length > 3 ? 2 : 3;
	const visibleCats = tool.categories.slice(0, maxVisible);
	const hiddenCats = tool.categories.slice(maxVisible);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="group bg-bg-canvas border border-stroke-strong p-6 flex flex-col h-full"
		>
			{/* Header: logo + name + website */}
			<div className="flex items-start gap-4 mb-5">
				<div className="w-12 h-12 bg-bg-panel border border-stroke-strong flex items-center justify-center text-fg-primary overflow-hidden shrink-0">
					{tool.iconUrl ? (
						<img
							src={tool.iconUrl}
							alt={tool.name}
							className="w-8 h-8 object-contain"
						/>
					) : (
						<Terminal size={20} />
					)}
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="text-lg font-bold text-fg-primary leading-tight">
						{tool.name}
					</h3>
					{tool.websiteUrl && (
						<a
							href={tool.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-lime hover:text-accent-lime/80 transition-colors mt-1"
						>
							<ExternalLink size={12} />
							{new URL(tool.websiteUrl).hostname.replace("www.", "")}
						</a>
					)}
				</div>
			</div>

			{/* Body: tiers list */}
			<div className="flex-1 mb-5">
				<div className="text-[10px] font-mono text-fg-muted uppercase tracking-widest mb-2">
					Pricing Tiers
				</div>
				<ul className="space-y-1.5">
					{tool.tiers.map((tier) => (
						<li
							key={tier.tierId}
							className="flex items-center justify-between text-xs font-mono"
						>
							<span className="text-fg-muted">{tier.name}</span>
							<span
								className={cn(
									"font-bold",
									tier.pricing.fixed?.amount === 0 ||
										tier.pricing.pricingType === "usage"
										? "text-accent-lime"
										: "text-fg-primary",
								)}
							>
								{formatPrice(tier)}
							</span>
						</li>
					))}
				</ul>
			</div>

			{/* Footer: category tags + website link */}
			<div className="pt-4 border-t border-stroke-strong">
				<div className="flex flex-wrap items-center gap-1.5">
					{visibleCats.map((cat) => {
						const config = categoryConfig[cat as ToolCategory];
						if (!config) return null;
						return (
							<span
								key={cat}
								className={cn(
									"inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border",
									config.bgColor,
									config.textColor,
									config.borderColor,
								)}
							>
								{config.label}
							</span>
						);
					})}
					{hiddenCats.length > 0 && (
						<span className="relative group/more">
							<span className="inline-flex items-center px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-stroke-strong text-fg-muted hover:text-fg-primary hover:border-fg-muted transition-colors cursor-default">
								+{hiddenCats.length} more
							</span>
							<span className="absolute bottom-full left-0 mb-1.5 hidden group-hover/more:flex flex-wrap gap-1 bg-bg-panel border border-stroke-strong p-2 shadow-lg z-10 min-w-max">
								{hiddenCats.map((cat) => {
									const cfg = categoryConfig[cat as ToolCategory];
									if (!cfg) return null;
									return (
										<span
											key={cat}
											className={cn(
												"inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border",
												cfg.bgColor,
												cfg.textColor,
												cfg.borderColor,
											)}
										>
											{cfg.label}
										</span>
									);
								})}
							</span>
						</span>
					)}
				{onSuggestEdit && (
						<button
							type="button"
							onClick={() => onSuggestEdit(tool)}
							className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-mono text-fg-muted hover:text-accent-lime transition-colors cursor-pointer"
						>
							<Pencil size={12} />
							Edit
						</button>
					)}
				</div>
			</div>
		</motion.div>
	);
}
