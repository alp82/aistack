import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipFrame({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			data-tooltip-frame
			className={cn(
				"border-[3px] border-stroke-strong bg-bg-panel shadow-[6px_6px_0_var(--stroke-strong)]",
				className,
			)}
		>
			{children}
		</div>
	);
}
