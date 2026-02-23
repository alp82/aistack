import type { Id } from "../../convex/_generated/dataModel";

type Tool = {
	_id: Id<"tools">;
	name: string;
	price: {
		pricingType: "fixed" | "usage" | "mixed";
		fixed?: { currency: string; amount: number; period: "month" | "year" | "one_time" };
	};
};

type Bundle = {
	_id: Id<"bundles">;
	name: string;
	price: {
		pricingType: "fixed" | "usage" | "mixed";
		fixed?: { currency: string; amount: number; period: "month" | "year" | "one_time" };
	};
};

type CostBreakdownTooltipProps = {
	tools: Tool[];
	bundles: Bundle[];
	fixedTotal?: { amount: number } | null;
	hasUsageComponent: boolean;
	usageTotalNotes?: string;
};

export function CostBreakdownTooltip({
	tools,
	bundles,
	fixedTotal,
	hasUsageComponent,
	usageTotalNotes,
}: CostBreakdownTooltipProps) {
	const paidTools = [...tools]
		.filter((t) => t.price.fixed && t.price.fixed.amount > 0)
		.sort((a, b) => (b.price.fixed?.amount ?? 0) - (a.price.fixed?.amount ?? 0));

	const paidBundles = [...bundles]
		.filter((b) => b.price.fixed && b.price.fixed.amount > 0)
		.sort((a, b) => (b.price.fixed?.amount ?? 0) - (a.price.fixed?.amount ?? 0));

	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel shadow-[6px_6px_0_var(--stroke-strong)] p-4">
			<div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime mb-3 border-b-2 border-stroke-strong pb-2">
				Cost Breakdown
			</div>

			{/* Tools - sorted by price descending */}
			{paidTools.length > 0 && (
				<div className="mb-3">
					<div className="font-mono text-[9px] font-semibold uppercase tracking-wider text-fg-muted mb-1.5">
						Tools
					</div>
					<div className="space-y-1">
						{paidTools.map((tool) => (
							<div
								key={tool._id}
								className="flex items-center justify-between text-sm"
							>
								<span className="text-fg-secondary truncate pr-2">
									{tool.name}
								</span>
								<span className="font-mono font-bold text-fg-primary shrink-0">
									${tool.price.fixed?.amount ?? 0}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Bundles - sorted by price descending */}
			{paidBundles.length > 0 && (
				<div className="mb-3">
					<div className="font-mono text-[9px] font-semibold uppercase tracking-wider text-fg-muted mb-1.5">
						Bundles
					</div>
					<div className="space-y-1">
						{paidBundles.map((bundle) => (
							<div
								key={bundle._id}
								className="flex items-center justify-between text-sm"
							>
								<span className="text-fg-secondary truncate pr-2">
									{bundle.name}
								</span>
								<span className="font-mono font-bold text-fg-primary shrink-0">
									${bundle.price.fixed?.amount ?? 0}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Usage note */}
			{hasUsageComponent && (
				<div className="text-xs text-fg-muted border-t-2 border-dashed border-stroke-subtle pt-2 mt-2">
					<span className="text-accent-lime font-bold">+</span> Usage-based
					costs apply
					{usageTotalNotes && (
						<span className="block mt-1 text-fg-muted/80">
							{usageTotalNotes}
						</span>
					)}
				</div>
			)}

			{/* Total */}
			<div className="flex items-center justify-between border-t-2 border-stroke-strong pt-2 mt-3">
				<span className="font-mono text-xs font-bold uppercase tracking-wider text-fg-primary">
					Total
				</span>
				<span className="font-mono text-lg font-black text-fg-primary">
					${fixedTotal?.amount ?? 0}
					{hasUsageComponent && <span className="text-accent-lime">+</span>}
					<span className="text-sm font-normal text-fg-muted">/mo</span>
				</span>
			</div>
		</div>
	);
}
