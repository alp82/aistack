import { cn } from "@/lib/utils";

type UpvoteButtonProps = {
	count: number;
	upvoted?: boolean;
	disabled?: boolean;
	size?: "sm" | "lg";
	onClick?: (e: React.MouseEvent) => void;
};

function UpvoteButton({
	count,
	upvoted = false,
	disabled = false,
	size = "lg",
	onClick,
}: UpvoteButtonProps) {
	const isSmall = size === "sm";

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"flex flex-col items-center justify-center transition-all disabled:opacity-50 cursor-pointer",
				isSmall ? "w-10 py-1.5" : "w-16 sm:w-20 py-2",
				upvoted
					? "bg-accent-lime text-accent-lime-contrast"
					: "bg-bg-panel-muted text-fg-primary hover:bg-accent-lime/20 hover:text-accent-lime"
			)}
		>
			<svg
				viewBox="0 0 24 24"
				className={cn("fill-current", isSmall ? "size-3 mb-0.5" : "size-5 mb-0.5")}
			>
				<path d="M12 4L3 15h18L12 4z" />
			</svg>
			<span
				className={cn(
					"font-mono font-black",
					isSmall ? "text-xs" : "text-lg"
				)}
			>
				{count}
			</span>
		</button>
	);
}

export { UpvoteButton };
export type { UpvoteButtonProps };
