import { useState } from "react";
import { BundleItem, type BundleItemData } from "@/components/BundleItem";
import {
	InstructionItem,
	type InstructionItemData,
	instructionTypeColors,
	typeLabels,
} from "@/components/InstructionItem";
import { ModelItem, type ModelItemData } from "@/components/ModelItem";
import { ToolItem, type ToolItemData } from "@/components/ToolItem";

type ViewTool = ToolItemData & { tierName: string };
type ViewBundle = BundleItemData;
type ViewModel = ModelItemData;
type ViewInstruction = InstructionItemData;

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
	const [activeInstruction, setActiveInstruction] =
		useState<ViewInstruction | null>(null);
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
	const mainTools = tools
		.filter((t) => t.kind === "main")
		.sort(sortByPriceThenName);
	const miscTools = tools
		.filter((t) => t.kind === "misc")
		.sort(sortByPriceThenName);

	const sortModelsByProviderThenName = (a: ViewModel, b: ViewModel) => {
		const providerDiff = a.provider.localeCompare(b.provider);
		if (providerDiff !== 0) return providerDiff;
		return b.name.localeCompare(a.name);
	};
	const sortedModels = models.sort(sortModelsByProviderThenName);

	return (
		<aside className="hidden w-140 shrink-0 lg:block">
			<div className="sticky top-[58px] flex max-h-[calc(100vh-58px)] flex-col">
				<div className="flex-grow overflow-y-auto ml-6 py-12 space-y-12">
					{/* Main Tools */}
					{mainTools.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Tools"}
							</p>
							<div className="space-y-2">
								{mainTools.map((tool) => (
									<ToolItem
										key={tool._id}
										tool={tool}
										size="md"
										onBundleClick={onBundleClick}
									/>
								))}
							</div>
						</section>
					)}

					{/* Other Tools */}
					{miscTools.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Secondary Tools"}
							</p>
							<div className="space-y-2">
								{miscTools.map((tool) => (
									<ToolItem
										key={tool._id}
										tool={tool}
										size="sm"
										onBundleClick={onBundleClick}
									/>
								))}
							</div>
						</section>
					)}

					{/* Models */}
					{sortedModels.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Models"}
							</p>
							<div className="space-y-2">
								{sortedModels.map((model) => (
									<ModelItem key={model._id} model={model} />
								))}
							</div>
						</section>
					)}

					{/* Bundles */}
					{bundles.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Bundles"}
							</p>
							<div className="space-y-2">
								{bundles.map((bundle) => (
									<BundleItem
										key={bundle._id}
										bundle={bundle}
										id={`bundle-${bundle.slug}`}
									/>
								))}
							</div>
						</section>
					)}

					{/* Instructions */}
					{instructions.length > 0 && (
						<section>
							<p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Instructions"}
							</p>
							<div className="space-y-2">
								{instructions.map((inst, i) => (
									<InstructionItem
										key={`${inst.name}-${i}`}
										instruction={inst}
										onClick={() => inst.content && setActiveInstruction(inst)}
									/>
								))}
							</div>
						</section>
					)}
				</div>
			</div>
			{activeInstruction && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<button
						type="button"
						aria-label="Close instruction dialog"
						className="absolute inset-0 bg-black/80"
						onClick={() => setActiveInstruction(null)}
					/>
					<div
						className="relative max-h-[80vh] w-full max-w-4xl overflow-auto border border-stroke-subtle bg-bg-panel p-6"
						role="dialog"
						aria-modal="true"
						aria-label={activeInstruction.name}
					>
						<div className="mb-4 flex items-center justify-between">
							<div>
								<h3 className="font-mono text-sm font-bold uppercase text-fg-primary">
									{activeInstruction.name}
								</h3>
								<span
									className={`font-mono text-[10px] uppercase ${(instructionTypeColors[activeInstruction.type] ?? "").split(" ")[0]}`}
								>
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
