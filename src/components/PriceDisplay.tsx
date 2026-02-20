import { cn } from "@/lib/utils";

type PriceDisplayProps = {
	amount: number;
	period?: string;
	hasUsageComponent?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
};

function PriceDisplay({
	amount,
	period = "/mo",
	hasUsageComponent = false,
	size = "md",
	className,
}: PriceDisplayProps) {
	const flooredAmount = Math.floor(amount);

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
			${flooredAmount}
			{hasUsageComponent && (
				<span className="text-accent-lime">+</span>
			)}
			<span className={cn("font-normal text-fg-muted", periodSizeClasses[size])}>
				{period}
			</span>
		</span>
	);
}

export { PriceDisplay };
export type { PriceDisplayProps };
