import { ExternalLink, Plus } from "lucide-react";
import { CategoryLabel } from "@/components/CategoryLabel";
import { PriceDisplay } from "@/components/PriceDisplay";
import { categoryConfig } from "@/config/categoryConfig";

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

interface FullWidthToolCardProps {
	tool: ToolData;
	onBundleClick?: (bundleSlug: string) => void;
}

export function FullWidthToolCard({ tool, onBundleClick }: FullWidthToolCardProps) {
	const config = categoryConfig[tool.category as keyof typeof categoryConfig];
	const Icon = config?.icon || Plus;

	return (
		<div className="flex items-center gap-6 bg-bg-panel border-2 border-stroke-strong p-5 lg:p-6 hover:border-accent-lime/50 transition-colors">
			{/* Icon */}
			{tool.iconUrl ? (
				<img
					src={tool.iconUrl}
					alt={tool.name}
					className="size-14 lg:size-16 shrink-0 border border-stroke-subtle bg-white object-contain p-2"
				/>
			) : (
				<div className="size-14 lg:size-16 shrink-0 border border-stroke-subtle bg-bg-panel-muted flex items-center justify-center">
					<Icon className="size-7 text-fg-muted" />
				</div>
			)}

			{/* Name & Description */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-2 flex-wrap">
					<span className="font-semibold text-fg-primary text-lg">{tool.name}</span>
					<CategoryLabel category={tool.category} />
				</div>
				<p className="text-sm text-fg-secondary">{tool.primaryUsageLabel}</p>
				{tool.notes && (
					<p className="text-xs text-fg-muted mt-2">{tool.notes}</p>
				)}
			</div>

			{/* Website Link */}
			{tool.websiteUrl && (
				<a
					href={tool.websiteUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="shrink-0 text-xs text-accent-lime hover:text-accent-lime-strong inline-flex items-center gap-1 font-mono uppercase tracking-wide"
				>
					Visit <ExternalLink className="size-3" />
				</a>
			)}

			{/* Price */}
			<div className="shrink-0 text-right min-w-[80px]">
				{tool.priceKind === "bundle" ? (
					<button
						type="button"
						onClick={() => tool.bundleSlug && onBundleClick?.(tool.bundleSlug)}
						className="font-mono text-sm text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
					>
						In Bundle ↓
					</button>
				) : (
					<>
						{tool.price.fixed ? (
							<PriceDisplay
								amount={tool.price.fixed.amount}
								period={tool.price.fixed.period === "one_time" ? "/once" : "/mo"}
								className="text-fg-primary"
							/>
						) : (
							<span className="font-mono text-2xl font-bold text-fg-primary">Usage</span>
						)}
						{tool.priceKind === "discounted" && (
							<span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-green-400 block mt-1">
								Discounted
							</span>
						)}
					</>
				)}
			</div>
		</div>
	);
}
