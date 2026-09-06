import { cn } from "@/lib/utils";

type UpvoteButtonProps = {
	count: number;
	upvoted?: boolean;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
	/**
	 * "stack" (default) is the vertical tile: triangle over the count on a
	 * panel fill. "outline" is the horizontal action row button: a lime outline
	 * that fills its row and prints "Upvote" with the count; hover inverts it to
	 * a lime fill, and an existing vote renders filled.
	 */
	variant?: "stack" | "outline";
	className?: string;
	onClick?: (e: React.MouseEvent) => void;
	onMouseEnter?: () => void;
	title?: string;
};

function UpvoteButton({
	count,
	upvoted = false,
	disabled = false,
	size = "lg",
	variant = "stack",
	className,
	onClick,
	onMouseEnter,
	title,
}: UpvoteButtonProps) {
	const ariaLabel = `${upvoted ? "Remove upvote" : "Upvote"}, ${count} ${count === 1 ? "upvote" : "upvotes"}`;

	if (variant === "outline") {
		return (
			<button
				type="button"
				onClick={onClick}
				onMouseEnter={onMouseEnter}
				disabled={disabled}
				title={title}
				aria-label={ariaLabel}
				aria-pressed={upvoted}
				className={cn(
					"inline-flex items-center justify-center gap-2 border border-accent-lime px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.1em] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
					upvoted
						? "bg-accent-lime text-accent-lime-contrast"
						: "bg-transparent text-accent-lime hover:bg-accent-lime hover:text-accent-lime-contrast",
					className,
				)}
			>
				<svg
					viewBox="0 0 24 24"
					aria-hidden="true"
					className="size-2.5 fill-current"
				>
					<path d="M12 4L3 15h18L12 4z" />
				</svg>
				<span aria-hidden="true">Upvote</span>
				<b aria-hidden="true" className="font-black">
					{count}
				</b>
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			disabled={disabled}
			title={title}
			aria-label={ariaLabel}
			aria-pressed={upvoted}
			className={cn(
				"flex flex-col items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
				size === "sm" && "w-10 py-1",
				size === "md" && "w-16 py-1.5",
				size === "lg" && "w-16 sm:w-20 py-2",
				upvoted
					? "bg-accent-lime text-accent-lime-contrast"
					: "bg-bg-panel-muted text-fg-primary hover:bg-accent-lime/20 hover:text-accent-lime",
				className,
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
