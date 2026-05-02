import { cn } from "@/lib/utils";

type UpvoteButtonProps = {
	count: number;
	upvoted?: boolean;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
	onClick?: (e: React.MouseEvent) => void;
	onMouseEnter?: () => void;
};

function UpvoteButton({
	count,
	upvoted = false,
	disabled = false,
	size = "lg",
	onClick,
	onMouseEnter,
}: UpvoteButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			disabled={disabled}
			aria-label={`${upvoted ? "Remove upvote" : "Upvote"}, ${count} ${count === 1 ? "upvote" : "upvotes"}`}
			aria-pressed={upvoted}
			className={cn(
				"flex flex-col items-center justify-center transition-all disabled:opacity-50 cursor-pointer",
				size === "sm" && "w-10 py-1",
				size === "md" && "w-16 py-1.5",
				size === "lg" && "w-16 sm:w-20 py-2",
				upvoted
					? "bg-accent-lime text-accent-lime-contrast"
					: "bg-bg-panel-muted text-fg-primary hover:bg-accent-lime/20 hover:text-accent-lime",
			)}
		>
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
				className={cn(
					"fill-current",
					size === "sm" && "size-3 mb-0.5",
					size === "md" && "size-4 mb-0.5",
					size === "lg" && "size-5 mb-0.5",
				)}
			>
				<path d="M12 4L3 15h18L12 4z" />
			</svg>
			<span
				aria-hidden="true"
				className={cn(
					"font-mono font-black",
					size === "sm" && "text-xs",
					size === "md" && "text-base",
					size === "lg" && "text-lg",
				)}
			>
				{count}
			</span>
		</button>
	);
}

export { UpvoteButton };
export type { UpvoteButtonProps };
