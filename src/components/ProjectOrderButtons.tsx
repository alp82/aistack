import { ChevronDown, ChevronUp } from "lucide-react";

interface ProjectOrderButtonsProps {
	index: number;
	total: number;
	onMove: (direction: "up" | "down") => void;
}

export function ProjectOrderButtons({
	index,
	total,
	onMove,
}: ProjectOrderButtonsProps) {
	return (
		<div className="flex flex-col">
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onMove("up");
				}}
				disabled={index === 0}
				className="flex size-6 items-center justify-center border border-stroke-subtle font-mono text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
			>
				<ChevronUp className="size-3.5" />
			</button>
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onMove("down");
				}}
				disabled={index === total - 1}
				className="flex size-6 items-center justify-center border border-t-0 border-stroke-subtle font-mono text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
			>
				<ChevronDown className="size-3.5" />
			</button>
		</div>
	);
}
