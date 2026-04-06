import { useMemo, useState } from "react";
import { BundleItem, type BundleItemData } from "@/components/BundleItem";
import { InstructionItem } from "@/components/InstructionItem";
import type { InstructionItem as InstructionItemType } from "@/features/stack-editor/types";
import { FileContentDialog } from "@/components/editor/FileContentDialog";
import { ModelItem, type ModelItemData } from "@/components/ModelItem";
import { ToolItem, type ToolItemData } from "@/components/ToolItem";
import { sortToolsByPrice } from "@/lib/pricing";

type ViewTool = ToolItemData & {
	tierName: string;
	originalTierPrice?: {
		currency: string;
		amount: number;
		period: "month" | "year" | "one_time";
	};
};
type ViewBundle = BundleItemData;
type ViewModel = ModelItemData;
type ViewInstruction = InstructionItemType;

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
	const mainTools = sortToolsByPrice(tools.filter((t) => t.kind === "main"));
	const miscTools = sortToolsByPrice(tools.filter((t) => t.kind === "misc"));

	const sortModelsByProviderThenName = (a: ViewModel, b: ViewModel) => {
		const providerDiff = a.provider.localeCompare(b.provider);
		if (providerDiff !== 0) return providerDiff;
		return b.name.localeCompare(a.name);
	};
	const sortedModels = [...models].sort(sortModelsByProviderThenName);

	const toolPriceTotal = useMemo(() => {
		let total = 0;
		for (const t of tools) {
			if (
				t.price.fixed &&
				t.priceKind !== "bundle" &&
				t.priceKind !== "sponsored"
			) {
				total += t.price.fixed.amount;
			}
		}
		return total;
	}, [tools]);

	const totalFileCount = useMemo(
		() => instructions.reduce((sum, inst) => sum + inst.files.length, 0),
		[instructions],
	);

	return (
		<aside className="hidden w-140 shrink-0 lg:block">
			<div className="sticky top-[58px] flex max-h-[calc(100vh-58px)] flex-col">
				<div className="flex-grow overflow-y-auto ml-6 py-12 space-y-12">
					{/* Main Tools */}
					{mainTools.length > 0 && (
						<section>
							<p className="sticky top-0 z-10 mb-3 bg-bg-canvas pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Tools"}
								<span className="ml-2 text-fg-muted">
									· {tools.length} {tools.length === 1 ? "item" : "items"}
									{toolPriceTotal > 0 && ` · $${toolPriceTotal}/mo`}
								</span>
							</p>
							<div className="space-y-2">
								{mainTools.map((tool) => (
									<div key={tool._id} className="border-l-2 border-accent-lime">
										<ToolItem
											tool={tool}
											size="md"
											onBundleClick={onBundleClick}
										/>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Other Tools */}
					{miscTools.length > 0 && (
						<section>
							<p className="sticky top-0 z-10 mb-3 bg-bg-canvas pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
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
							<p className="sticky top-0 z-10 mb-3 bg-bg-canvas pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Models"}
								<span className="ml-2 text-fg-muted">
									· {sortedModels.length}{" "}
									{sortedModels.length === 1 ? "item" : "items"}
								</span>
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
							<p className="sticky top-0 z-10 mb-3 bg-bg-canvas pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Bundles"}
								<span className="ml-2 text-fg-muted">
									· {bundles.length} {bundles.length === 1 ? "item" : "items"}
								</span>
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
							<p className="sticky top-0 z-10 mb-3 bg-bg-canvas pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
								{"// Instructions"}
								<span className="ml-2 text-fg-muted">
									· {instructions.length}{" "}
									{instructions.length === 1 ? "item" : "items"}
									{totalFileCount > 0 &&
										` · ${totalFileCount} ${totalFileCount === 1 ? "file" : "files"}`}
								</span>
							</p>
							<div className="space-y-2">
								{instructions.map((inst, i) => (
									<InstructionItem
										key={`${inst.name}-${i}`}
										instruction={inst}
										onClick={() =>
											inst.files.length > 0 && setActiveInstruction(inst)
										}
									/>
								))}
							</div>
						</section>
					)}
				</div>
			</div>
			<FileContentDialog
				open={!!activeInstruction}
				onClose={() => setActiveInstruction(null)}
				instructionName={activeInstruction?.name ?? ""}
				files={activeInstruction?.files ?? []}
				isEditable={false}
			/>
		</aside>
	);
}
