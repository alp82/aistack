import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** first · … · n-1 · n · n+1 · … · last - one line even at 50 pages. */
function pageWindow(page: number, total: number): (number | "gap")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const out: (number | "gap")[] = [1];
	const from = Math.max(2, page - 1);
	const to = Math.min(total - 1, page + 1);
	if (from > 2) out.push("gap");
	for (let i = from; i <= to; i++) out.push(i);
	if (to < total - 1) out.push("gap");
	out.push(total);
	return out;
}

export function Pager({
	page,
	totalPages,
	onPage,
	className,
}: {
	readonly page: number;
	readonly totalPages: number;
	readonly onPage: (p: number) => void;
	readonly className?: string;
}) {
	if (totalPages <= 1) return null;
	return (
		<div className={cn("flex items-center justify-center gap-2", className)}>
			<button
				type="button"
				onClick={() => onPage(Math.max(1, page - 1))}
				disabled={page <= 1}
				aria-label="previous page"
				className="flex size-9 items-center justify-center border border-stroke-strong text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:cursor-not-allowed disabled:opacity-30"
			>
				<ChevronLeft className="size-4" />
			</button>
			{pageWindow(page, totalPages).map((p, i) =>
				p === "gap" ? (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: a gap has no identity
						key={`gap-${i}`}
						className="px-1 font-mono text-sm text-fg-muted"
					>
						…
					</span>
				) : (
					<button
						key={p}
						type="button"
						onClick={() => onPage(p)}
						aria-current={p === page ? "page" : undefined}
						className={cn(
							"flex h-9 min-w-9 items-center justify-center border px-2 font-mono text-sm font-bold transition-colors",
							p === page
								? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
								: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime",
						)}
					>
						{p}
					</button>
				),
			)}
			<button
				type="button"
				onClick={() => onPage(Math.min(totalPages, page + 1))}
				disabled={page >= totalPages}
				aria-label="next page"
				className="flex size-9 items-center justify-center border border-stroke-strong text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:cursor-not-allowed disabled:opacity-30"
			>
				<ChevronRight className="size-4" />
			</button>
		</div>
	);
}
