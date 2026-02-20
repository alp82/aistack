import { Plus } from "lucide-react";
import { categoryConfig } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
	category: string;
	showIcon?: boolean;
	size?: "sm" | "md";
	className?: string;
}

export function CategoryBadge({ 
	category, 
	showIcon = true, 
	size = "sm",
	className 
}: CategoryBadgeProps) {
	const config = categoryConfig[category as keyof typeof categoryConfig];
	const Icon = config?.icon || Plus;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 font-mono font-semibold uppercase tracking-wide",
				size === "sm" 
					? "text-[10px] px-1.5 py-0.5" 
					: "text-xs px-2 py-0.5",
				config?.bgColor || "bg-bg-panel-muted",
				config?.textColor || "text-fg-muted",
				className
			)}
		>
			{showIcon && <Icon className={size === "sm" ? "size-3" : "size-3.5"} />}
			{config?.label || category}
		</span>
	);
}
