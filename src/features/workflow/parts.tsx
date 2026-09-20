import type { ReactNode } from "react";
import { TooltipFrame } from "@/components/TooltipFrame";
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

/** Shared with the retained design prototypes. */
export function Tip({
	label,
	children,
	className,
}: {
	label: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<HoverCard
			mode="wrapper"
			position="above"
			width={220}
			height="auto"
			maxRotation={3}
			maxOffset={4}
			offset={8}
			className={cn("flex", className)}
			triggerClassName="flex h-full w-full min-w-0 flex-1 items-end"
			renderContent={() => (
				<TooltipFrame className="px-3 py-2 font-mono text-[11px] leading-snug text-fg-primary">
					{label}
				</TooltipFrame>
			)}
		>
			{children}
		</HoverCard>
	);
}

export function heatPaint(value: number, busiest: number): string {
	if (value <= 0) return "var(--bg-panel)";
	const share = busiest > 0 ? value / busiest : 0;
	const mix = share < 0.12 ? 18 : share < 0.3 ? 38 : share < 0.6 ? 62 : 90;
	return `color-mix(in oklab, var(--accent-lime) ${mix}%, var(--bg-panel))`;
}
