import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
};

/**
 * Numbered pagination row with prev/next chevrons. Renders nothing when there
 * is a single page. Callers own scroll behavior inside `onPageChange` (see
 * `usePaginationScroll`).
 */
function Pagination({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="mt-12 flex items-center justify-center gap-2">
			<button
				type="button"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage <= 1}
				className="flex size-10 items-center justify-center border border-stroke-strong text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:opacity-30 disabled:cursor-not-allowed"
			>
				<ChevronLeft className="size-4" />
			</button>
			{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
				<button
					key={pageNum}
					type="button"
					onClick={() => onPageChange(pageNum)}
					className={cn(
						"flex size-10 items-center justify-center border font-mono text-sm font-bold transition-colors",
						pageNum === currentPage
							? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
							: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime",
					)}
				>
					{pageNum}
				</button>
			))}
			<button
				type="button"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage >= totalPages}
				className="flex size-10 items-center justify-center border border-stroke-strong text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:opacity-30 disabled:cursor-not-allowed"
			>
				<ChevronRight className="size-4" />
			</button>
		</div>
	);
}

export { Pagination };
export type { PaginationProps };
