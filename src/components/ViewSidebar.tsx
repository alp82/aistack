import { useState } from "react";
import { FullWidthToolCard } from "@/components/FullWidthToolCard";
import { MiscToolCard } from "@/components/ToolCard";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Brain, FileText, Package } from "lucide-react";

const typeLabels: Record<string, string> = {
	prompt: "Prompt",
	rule: "Rule",
	skill: "Skill",
	mcp: "MCP",
	plugin: "Plugin",
	subagent: "Subagent",
};

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
	priceKind: "regular" | "discounted" | "bundle" | "usage_based" | "sponsored";
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

type ViewModel = {
	_id: string;
	name: string;
	slug: string;
	provider: string;
	category: string;
	iconUrl?: string;
	role: "primary" | "secondary" | "specialized";
};

type ViewInstruction = {
	type: "prompt" | "rule" | "skill" | "mcp" | "plugin" | "subagent";
	name: string;
	description?: string;
	content?: string;
};

const instructionTypeColors: Record<string, string> = {
	prompt: "text-blue-400 border-blue-400/30 bg-blue-400/10",
	rule: "text-amber-400 border-amber-400/30 bg-amber-400/10",
	skill: "text-purple-400 border-purple-400/30 bg-purple-400/10",
	mcp: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
	plugin: "text-pink-400 border-pink-400/30 bg-pink-400/10",
	subagent: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
};

type ViewSidebarProps = {
	tools: ViewTool[];
	bundles: ViewBundle[];
	models: ViewModel[];
	instructions: ViewInstruction[];
	onBundleClick?: (bundleSlug: string) => void;
};

export function ViewSidebar({
	tools,
	bundles,
	models,
	instructions,
	onBundleClick,
}: ViewSidebarProps) {
	const [activeInstruction, setActiveInstruction] = useState<ViewInstruction | null>(null);
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		if (activeInstruction?.content) {
			await navigator.clipboard.writeText(activeInstruction.content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};
	const sortByPriceThenName = (a: ViewTool, b: ViewTool) => {
		const groupOrder = (t: ViewTool) => {
			if (t.priceKind === "sponsored") return 0;
			const price = t.price.fixed?.amount ?? 0;
			if (price > 0) return 1;
			if (t.priceKind === "bundle") return 2;
			return 3;
		};
		const groupA = groupOrder(a);
		const groupB = groupOrder(b);
		if (groupA !== groupB) return groupA - groupB;
		if (groupA === 1) {
			const diff = (b.price.fixed?.amount ?? 0) - (a.price.fixed?.amount ?? 0);
			if (diff !== 0) return diff;
		}
		return a.name.localeCompare(b.name);
	};
	const mainTools = tools.filter((t) => t.kind === "main").sort(sortByPriceThenName);
	const miscTools = tools.filter((t) => t.kind === "misc").sort(sortByPriceThenName);

	return (
		<aside className="hidden w-140 shrink-0 lg:block">
			<div className="sticky top-[58px] flex max-h-[calc(100vh-58px)] flex-col">
				<div className="flex-grow overflow-y-auto ml-6 py-12 space-y-12">
					{/* Main Tools */}
					{mainTools.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								// Tools
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
								// Secondary Tools
							</p>
							<div className="space-y-2">
								{miscTools.map((tool) => (
									<MiscToolCard key={tool._id} tool={tool} onBundleClick={onBundleClick} />
								))}
							</div>
						</section>
					)}

					{/* Models */}
					{models.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								// Models
							</p>
							<div className="space-y-2">
								{models.map((model) => (
									<div
										key={model._id}
										className="border border-stroke-subtle rounded p-3 hover:border-stroke-strong transition-colors"
									>
										<div className="flex items-center gap-3">
											{model.iconUrl ? (
												<img
													src={model.iconUrl}
													alt={model.name}
													className="size-8 shrink-0 rounded border border-stroke-subtle bg-white object-contain p-1"
												/>
											) : (
												<div className="flex size-8 shrink-0 items-center justify-center rounded border border-stroke-subtle bg-bg-panel-muted">
													<Brain className="size-4 text-fg-muted" />
												</div>
											)}
											<div className="flex-1 min-w-0">
												<span className="font-mono text-sm font-semibold text-fg-primary block">
													{model.name}
												</span>
												<span className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
													{model.provider}
												</span>
											</div>
										</div>
									</div>
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
												<span className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
													{bundle.tierName}
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
									</div>
								))}
							</div>
						</section>
					)}

					{/* Instructions */}
					{instructions.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								// Instructions
							</p>
							<div className="space-y-2">
								{instructions.map((inst, i) => (
									<button
										type="button"
										key={`${inst.name}-${i}`}
										className="w-full text-left border border-stroke-subtle rounded p-3 hover:border-stroke-strong transition-colors cursor-pointer"
										onClick={() => inst.content && setActiveInstruction(inst)}
									>
										<div className="flex items-center gap-3">
											<div className={`flex size-8 shrink-0 items-center justify-center rounded border ${instructionTypeColors[inst.type] ?? "text-fg-muted border-stroke-subtle bg-bg-panel-muted"}`}>
												<FileText className="size-4" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate font-mono text-sm font-semibold text-fg-primary">{inst.name}</p>
												<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">{typeLabels[inst.type] ?? inst.type}</p>
											</div>
											{inst.content && (
												<span className="shrink-0 border border-accent-lime/30 bg-accent-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-lime">
													Show
												</span>
											)}
										</div>
									</button>
								))}
							</div>
						</section>
					)}
				</div>
			</div>
			{activeInstruction && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
					onClick={() => setActiveInstruction(null)}
				>
					<div
						className="max-h-[80vh] w-full max-w-4xl overflow-auto border border-stroke-subtle bg-bg-panel p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<div>
								<h3 className="font-mono text-sm font-bold uppercase text-fg-primary">
									{activeInstruction.name}
								</h3>
								<span className={`font-mono text-[10px] uppercase ${(instructionTypeColors[activeInstruction.type] ?? "").split(" ")[0]}`}>
									{typeLabels[activeInstruction.type] ?? activeInstruction.type}
								</span>
							</div>
							<button
								type="button"
								onClick={handleCopy}
								className="border border-stroke-subtle bg-bg-panel-muted px-3 py-1 font-mono text-xs uppercase text-fg-muted transition-all hover:border-accent-lime hover:text-accent-lime"
							>
								{copied ? "Copied!" : "Copy"}
							</button>
						</div>
						<pre className="whitespace-pre-wrap border border-stroke-subtle bg-bg-panel-muted p-4 font-mono text-xs text-fg-primary">
							{activeInstruction.content || "No content"}
						</pre>
						<button
							type="button"
							onClick={() => setActiveInstruction(null)}
							className="mt-4 w-full bg-accent-lime py-2 font-mono text-xs uppercase tracking-wider text-accent-lime-contrast transition-opacity hover:opacity-90 cursor-pointer"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</aside>
	);
}
