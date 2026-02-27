import { FullWidthToolCard } from "@/components/FullWidthToolCard";
import { MiscToolCard } from "@/components/ToolCard";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Package } from "lucide-react";

type ViewTool = {
	_id: string;
	name: string;
	slug: string;
	iconUrl?: string;
	categories: string[];
	websiteUrl?: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
	kind: "main" | "misc";
	primaryUsageLabel: string;
	tierName: string;
	priceKind: "regular" | "discounted" | "bundle" | "usage_based";
	bundleSlug?: string;
	notes?: string;
};

type ViewBundle = {
	_id: string;
	name: string;
	slug: string;
	description?: string;
	iconUrl?: string;
	websiteUrl?: string;
	tierId: string;
	tierName: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
	notes?: string;
};

type ViewInstruction = {
	type: "prompt" | "rule" | "skill" | "mcp" | "plugin" | "subagent";
	name: string;
	description?: string;
};

type ViewSidebarProps = {
	tools: ViewTool[];
	bundles: ViewBundle[];
	instructions: ViewInstruction[];
	onBundleClick?: (bundleSlug: string) => void;
};

export function ViewSidebar({
	tools,
	bundles,
	instructions,
	onBundleClick,
}: ViewSidebarProps) {
	const mainTools = tools.filter((t) => t.kind === "main");
	const miscTools = tools.filter((t) => t.kind === "misc");

	return (
		<aside className="hidden w-140 shrink-0 lg:block">
			<div className="sticky top-[58px] flex max-h-[calc(100vh-58px)] flex-col">
				<div className="flex-grow overflow-y-auto ml-6 py-12 space-y-12">
					{/* Main Tools */}
					{mainTools.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								// Main Tools
							</p>
							<div className="space-y-2">
								{mainTools.map((tool) => (
									<FullWidthToolCard key={tool._id} tool={tool} onBundleClick={onBundleClick} />
								))}
							</div>
						</section>
					)}

					{/* Other Tools */}
					{miscTools.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								// Other Tools
							</p>
							<div className="space-y-2">
								{miscTools.map((tool) => (
									<MiscToolCard key={tool._id} tool={tool} onBundleClick={onBundleClick} />
								))}
							</div>
						</section>
					)}

					{/* Bundles */}
					{bundles.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								// Bundles
							</p>
							<div className="space-y-2">
								{bundles.map((bundle) => (
									<div
										key={bundle._id}
										id={`bundle-${bundle.slug}`}
										className="border border-stroke-subtle rounded p-3 hover:border-stroke-strong transition-colors"
									>
										<div className="flex items-center gap-3">
											{bundle.iconUrl ? (
												<img
													src={bundle.iconUrl}
													alt={bundle.name}
													className="size-8 shrink-0 rounded border border-stroke-subtle bg-white object-contain p-1"
												/>
											) : (
												<div className="flex size-8 shrink-0 items-center justify-center rounded border border-stroke-subtle bg-bg-panel-muted">
													<Package className="size-4 text-fg-muted" />
												</div>
											)}
											<div className="flex-1 min-w-0">
												<span className="font-mono text-sm font-semibold text-fg-primary block">
													{bundle.name}
												</span>
											</div>
											<div className="shrink-0 text-right">
												{bundle.price.fixed ? (
													<PriceDisplay
														amount={bundle.price.fixed.amount}
														period={bundle.price.fixed.period === "one_time" ? "/once" : "/mo"}
														size="sm"
														className="text-fg-primary"
													/>
												) : (
													<span className="font-mono text-sm font-bold text-fg-primary">
														Usage
													</span>
												)}
											</div>
										</div>
										{bundle.description && (
											<p className="mt-2 text-xs text-fg-secondary line-clamp-2">
												{bundle.description}
											</p>
										)}
										<span className="mt-1 font-mono text-[10px] text-fg-muted uppercase tracking-wider block">
											{bundle.tierName}
										</span>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Instructions */}
					{instructions.length > 0 && (
						<section>
							<p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								// Instructions
							</p>
							<div className="space-y-1">
								{instructions.map((inst, i) => (
									<div key={`${inst.name}-${i}`} className="flex items-start gap-2 py-1">
										<div className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-stroke-subtle bg-bg-panel-muted text-[9px] font-bold text-fg-muted mt-0.5">
											{inst.type.charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate font-mono text-xs font-semibold text-fg-primary">{inst.name}</p>
											<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">{inst.type}</p>
										</div>
									</div>
								))}
							</div>
						</section>
					)}
				</div>
			</div>
		</aside>
	);
}
