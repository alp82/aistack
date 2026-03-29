export function BundleTooltipContent({
	name,
	iconUrl,
	price,
	tierName,
	description,
}: {
	name: string;
	iconUrl?: string;
	price?: { amount: number; period: string };
	tierName?: string;
	description?: string;
}) {
	const priceLabel = price
		? `${price.amount}/${price.period === "one_time" ? "once" : price.period === "month" ? "mo" : price.period}`
		: null;

	return (
		<div className="min-w-[260px] border-[3px] border-stroke-strong bg-bg-panel-elevated p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">
				Bundle
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
				{priceLabel && (
					<div className="shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
						${priceLabel}
					</div>
				)}
			</div>
			{description && (
				<div className="mt-3 border-t border-stroke-subtle pt-3 text-xs leading-6 text-fg-secondary">
					{description}
				</div>
			)}
		</div>
	);
}
