import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
	tag: string;
	size?: "sm" | "md";
	onRemove?: () => void;
	className?: string;
}

export function TagBadge({
	tag,
	size = "sm",
	onRemove,
	className,
}: TagBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 border-2 border-stroke-subtle bg-bg-panel-muted font-mono font-semibold uppercase tracking-wide text-fg-muted",
				size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
				className,
			)}
		>
			{tag}
			{onRemove && (
				<button
					type="button"
					onClick={onRemove}
					className="ml-0.5 text-fg-secondary hover:text-fg-default transition-colors cursor-pointer"
				>
					<X className={size === "sm" ? "size-3" : "size-3.5"} />
				</button>
			)}
		</span>
	);
}
