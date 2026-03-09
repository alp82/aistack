import { Package } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import { PriceDisplay } from "@/components/PriceDisplay";

export interface BundleItemData {
	_id: string;
	name: string;
	slug: string;
	description?: string;
	iconUrl?: string;
	websiteUrl?: string;
	tierId: string;
	tierName: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
	notes?: string;
}

interface BundleItemProps {
	bundle: BundleItemData;
	id?: string;
}

export function BundleItem({ bundle, id }: BundleItemProps) {
	return (
		<div
			id={id}
			className="border border-stroke-subtle p-3 hover:border-stroke-strong transition-colors"
		>
			<div className="flex items-center gap-3">
				<ItemIcon
					src={bundle.iconUrl}
					alt={bundle.name}
					size="sm"
					fallbackIcon={Package}
				/>
				<div className="flex-1 min-w-0">
					<span className="font-mono text-sm font-semibold text-fg-primary block">
						{bundle.name}
					</span>
					<span className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
						{bundle.tierName}
					</span>
				</div>
				<div className="shrink-0 text-right">
					{bundle.price.fixed ? (
						<PriceDisplay
							amount={bundle.price.fixed.amount}
							period={bundle.price.fixed.period}
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
			{bundle.description && (
				<p className="mt-2 text-xs text-fg-secondary line-clamp-2">
					{bundle.description}
				</p>
			)}
		</div>
	);
}
