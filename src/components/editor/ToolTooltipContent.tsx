import { CategoryLabel } from "@/components/CategoryLabel";

export function ToolTooltipContent({
	name,
	iconUrl,
	categories,
	price,
	tierName,
	description,
}: {
	name: string;
	iconUrl?: string;
	categories?: string[];
	price?: { amount: number; period: string };
	tierName?: string;
	description?: string;
}) {
	return (
		<div className="min-w-[260px] border-[3px] border-stroke-strong bg-bg-panel-elevated p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
				Tool
			</div>
			<div className="mb-2 flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					{iconUrl && (
						<img
							src={iconUrl}
							alt=""
							className="size-8 shrink-0 object-contain"
						/>
					)}
					<div className="min-w-0">
						<div className="font-mono text-sm font-semibold text-fg-primary">
							{name}
						</div>
						{tierName && (
							<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
								{tierName}
							</div>
						)}
					</div>
				</div>
				{price && (
					<div className="shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
						${price.amount}
						<span className="ml-1 text-xs font-normal text-fg-muted">
							/{price.period === "one_time" ? "once" : "mo"}
						</span>
					</div>
				)}
			</div>
			{categories && categories.length > 0 && (
				<div className="mb-3 flex flex-wrap gap-1.5">
					{categories.map((cat) => (
						<CategoryLabel key={cat} category={cat} />
					))}
				</div>
			)}
			{description && (
				<div className="mt-3 border-t border-stroke-subtle pt-3 text-xs leading-6 text-fg-secondary">
					{description}
				</div>
			)}
		</div>
	);
}
