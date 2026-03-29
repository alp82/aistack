export function ModelTooltipContent({
	name,
	iconUrl,
	provider,
	category,
	description,
}: {
	name: string;
	iconUrl?: string;
	provider?: string;
	category?: string;
	description?: string;
}) {
	return (
		<div className="min-w-[260px] border-[3px] border-stroke-strong bg-bg-panel-elevated p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">
				Model
			</div>
			<div className="mb-2 flex items-center gap-3">
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
					{provider && (
						<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
							by {provider}
						</div>
					)}
				</div>
			</div>
			{category && (
				<div className="mb-1 inline-flex border border-stroke-subtle bg-bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
					{category}
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
