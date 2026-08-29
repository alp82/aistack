import { useMutation } from "convex/react";
import { Brain, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { formatShare } from "@/features/stack-view/cards";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export type MeasuredModelRow = {
	slug: string;
	name: string;
	provider: string;
	iconUrl?: string;
	tokenShare: number;
	hidden: boolean;
};

/**
 * The measured half of the model list, in the editor (#338).
 *
 * These rows come from the stack's own syncs and the picker cannot add or
 * remove them. The one control is hide: display only, so a hidden model
 * leaves the public list and keeps counting in tokens, spend and the
 * leaderboard. The rows arrive in server order (share descending) and are
 * rendered as handed.
 */
export function MeasuredModels({
	stackId,
	models,
}: {
	stackId: Id<"stacks">;
	models: MeasuredModelRow[];
}) {
	const setHidden = useMutation(api.stacks.setModelHidden);
	const [pending, setPending] = useState<string | null>(null);

	if (models.length === 0) return null;

	const toggle = async (row: MeasuredModelRow) => {
		setPending(row.slug);
		try {
			await setHidden({ stackId, modelSlug: row.slug, hidden: !row.hidden });
		} finally {
			setPending(null);
		}
	};

	return (
		<div className="mb-3 space-y-2">
			<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
				From your syncs
			</p>
			{models.map((row) => (
				<div
					key={row.slug}
					className={cn(
						"flex items-center gap-3 border border-stroke-subtle bg-bg-panel p-2",
						row.hidden && "opacity-60",
					)}
				>
					{row.iconUrl ? (
						<img
							src={row.iconUrl}
							alt={row.name}
							className="size-8 shrink-0 object-contain"
						/>
					) : (
						<div className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
							<Brain className="size-4 text-fg-muted" />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<p className="truncate font-mono text-sm font-semibold text-fg-primary">
							{row.name}
						</p>
						<p className="truncate font-mono text-[10px] uppercase tracking-wider text-fg-muted">
							{row.provider} · {formatShare(row.tokenShare)}
						</p>
					</div>
					<button
						type="button"
						onClick={() => void toggle(row)}
						disabled={pending === row.slug}
						aria-label={`${row.hidden ? "Unhide" : "Hide"} ${row.name}`}
						className="flex h-8 shrink-0 items-center gap-1 border border-stroke-subtle px-2 font-mono text-[10px] uppercase text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime disabled:opacity-50"
					>
						{row.hidden ? (
							<>
								<Eye className="size-3" /> Unhide
							</>
						) : (
							<>
								<EyeOff className="size-3" /> Hide
							</>
						)}
					</button>
				</div>
			))}
		</div>
	);
}
