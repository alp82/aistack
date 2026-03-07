import {
	type BillingPeriod,
	formatPriceDisplay,
	type PriceRoundingMode,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

type PriceDisplayProps = {
	amount: number;
	period?: BillingPeriod | string;
	rounding?: PriceRoundingMode;
	hasUsageComponent?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
};

function PriceDisplay({
	amount,
	period = "month",
	rounding = "round",
	hasUsageComponent = false,
	size = "md",
	className,
}: PriceDisplayProps) {
	const displayPrice = formatPriceDisplay(amount, period, rounding);

	const sizeClasses = {
		sm: "text-lg",
		md: "text-2xl",
		lg: "text-3xl",
	};

	const periodSizeClasses = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};

	return (
		<span className={cn("font-mono font-black", sizeClasses[size], className)}>
			${displayPrice.amountText}
			{hasUsageComponent && <span className="text-accent-lime">+</span>}
			<span
				className={cn("font-normal text-fg-muted", periodSizeClasses[size])}
			>
				{displayPrice.suffix}
			</span>
		</span>
	);
}

export { PriceDisplay };
export type { PriceDisplayProps };
