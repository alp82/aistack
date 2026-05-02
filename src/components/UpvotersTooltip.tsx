import { cn } from "@/lib/utils";

type Upvoter = { userId: string; name: string; avatarUrl: string | null };

type Props = {
	upvoters: Upvoter[];
	totalCount: number;
	currentUserId: string | null;
	loading: boolean;
};

export function UpvotersTooltip({
	upvoters,
	totalCount,
	currentUserId,
	loading,
}: Props) {
	const remaining = totalCount - upvoters.length;

	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel shadow-[6px_6px_0_var(--stroke-strong)] p-4 w-[280px]">
			<div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime mb-3 border-b-2 border-stroke-strong pb-2">
				Upvoted by
			</div>

			{loading ? (
				<div className="space-y-1.5">
					<div className="h-7 bg-bg-panel-muted animate-pulse" />
					<div className="h-7 bg-bg-panel-muted animate-pulse" />
					<div className="h-7 bg-bg-panel-muted animate-pulse" />
				</div>
			) : (
				<div className="space-y-1.5">
					{upvoters.map((u) => {
						const isCurrentUser = u.userId === currentUserId;
						return (
							<div key={u.userId} className="flex items-center gap-2">
								{u.avatarUrl ? (
									<img
										src={u.avatarUrl}
										alt={u.name}
										className="size-6 shrink-0 border border-stroke-subtle object-cover"
									/>
								) : (
									<div
										aria-hidden="true"
										className="size-6 shrink-0 border border-stroke-subtle bg-bg-panel-muted flex items-center justify-center font-mono text-[10px] font-bold uppercase text-fg-muted"
									>
										{u.name.charAt(0)}
									</div>
								)}
								<span
									className={cn(
										"font-mono text-sm truncate",
										isCurrentUser ? "text-accent-lime" : "text-fg-secondary",
									)}
								>
									{u.name}
									{isCurrentUser && (
										<span className="ml-1 font-mono text-accent-lime">
											(You)
										</span>
									)}
								</span>
							</div>
						);
					})}
				</div>
			)}

			{!loading && remaining > 0 && (
				<div className="mt-2 pt-2 border-t-2 border-dashed border-stroke-subtle font-mono text-xs text-fg-muted">
					+{remaining} more
				</div>
			)}
		</div>
	);
}
