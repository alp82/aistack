import { Plus } from "lucide-react";
import { categoryConfig, type ToolCategory } from "@/config/categoryConfig";

interface ToolProps {
	logo: string;
	name: string;
	category: ToolCategory;
	avgCost: number;
	pros: string[];
	cons: string[];
	height: number;
}

export function Tool({
	logo,
	name,
	category,
	avgCost,
	pros,
	cons,
	height,
}: ToolProps) {
	const config = categoryConfig[category as keyof typeof categoryConfig];
	const Icon = config?.icon || Plus;

	return (
		<div
			className="group flex flex-col border-2 border-stroke-strong bg-bg-panel transition-all hover:border-accent-lime"
			style={{ height: `${height}px` }}
		>
			{/* Header */}
			<div className="flex items-start gap-3 border-b border-stroke-subtle px-4 py-3">
				<img
					src={logo}
					alt={name}
					className="size-10 shrink-0 border border-stroke-subtle bg-white object-contain p-1"
				/>
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-mono text-sm font-semibold text-fg-primary transition-colors group-hover:text-accent-lime">
						{name}
					</h3>
					<span className="mt-1 inline-flex items-center gap-1 border border-accent-lime/50 bg-accent-lime/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-accent-lime">
						<Icon className="size-3" />
						{config?.label || category}
					</span>
				</div>
				<div className="shrink-0 text-right">
					<span className="font-mono text-lg font-bold text-fg-primary">${avgCost}</span>
					<span className="block font-mono text-[10px] text-fg-muted">/mo</span>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 space-y-3 overflow-hidden px-4 py-3">
				{pros.length > 0 && (
					<div>
						<p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-accent-lime">Pros:</p>
						<ul className="space-y-0.5">
							{pros.slice(0, 4).map((pro, index) => (
								<li
									key={index}
									className="flex items-start text-xs text-fg-secondary"
								>
									<span className="mr-1.5 text-accent-lime">+</span>
									<span className="line-clamp-1">{pro}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{cons.length > 0 && (
					<div>
						<p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-destructive">Cons:</p>
						<ul className="space-y-0.5">
							{cons.slice(0, 4).map((con, index) => (
								<li
									key={index}
									className="flex items-start text-xs text-fg-secondary"
								>
									<span className="mr-1.5 text-destructive">-</span>
									<span className="line-clamp-1">{con}</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
