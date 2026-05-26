import type { LucideIcon } from "lucide-react";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

type ItemIconSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<ItemIconSize, { container: string; icon: string }> = {
	xs: { container: "size-4", icon: "size-3" },
	sm: { container: "size-8", icon: "size-4" },
	md: { container: "size-10", icon: "size-5" },
	lg: { container: "size-12", icon: "size-6" },
};

interface ItemIconProps {
	src?: string | null;
	alt: string;
	size?: ItemIconSize;
	fallbackIcon?: LucideIcon;
	className?: string;
}

export function ItemIcon({
	src,
	alt,
	size = "sm",
	fallbackIcon: FallbackIcon = Box,
	className,
}: ItemIconProps) {
	const { container, icon } = sizeClasses[size];

	if (src) {
		return (
			<img
				src={src}
				alt={alt}
				className={cn(
					container,
					"shrink-0 rounded border border-stroke-subtle object-contain p-0.5",
					className,
				)}
			/>
		);
	}

	return (
		<div
			className={cn(
				container,
				"flex shrink-0 items-center justify-center rounded border border-stroke-subtle bg-bg-panel-muted",
				className,
			)}
		>
			<FallbackIcon className={cn(icon, "text-fg-muted")} />
		</div>
	);
}
