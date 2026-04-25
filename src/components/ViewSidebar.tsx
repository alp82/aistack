import { useMemo } from "react";
import { BundleItem, type BundleItemData } from "@/components/BundleItem";
import { ModelItem, type ModelItemData } from "@/components/ModelItem";
import { ToolItem, type ToolItemData } from "@/components/ToolItem";
import {
	UnifiedFileList,
	type UnifiedFileListProjectGroup,
} from "@/components/UnifiedFileList";
import type { InstructionItem as InstructionItemType } from "@/features/stack-editor/types";
import { sortToolsByPrice } from "@/lib/pricing";
import type { Id } from "../../convex/_generated/dataModel";

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
type ProjectSourcedInstruction = InstructionItemType & {
	sourceProjectId?: Id<"projects">;
	sourceProjectName?: string;
	sourceIsOwnProject?: boolean;
	sourceStableKey?: string;
};

type ViewSidebarProps = {
	stackId?: Id<"stacks">;
	tools: ViewTool[];
	bundles: ViewBundle[];
	models: ViewModel[];
	instructions: ViewInstruction[];
	projectInstructions?: ProjectSourcedInstruction[];
	onBundleClick?: (bundleSlug: string) => void;
};

export function ViewSidebar({
	stackId,
	tools,
	bundles,
	models,
	instructions,
	projectInstructions,
	onBundleClick,
}: ViewSidebarProps) {
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

	const projectInstructionsList = useMemo(
		() => projectInstructions ?? [],
		[projectInstructions],
	);
	const totalInstructionCount =
		instructions.length + projectInstructionsList.length;
	const totalFileCount = useMemo(
		() =>
			instructions.reduce((sum, inst) => sum + inst.files.length, 0) +
			projectInstructionsList.reduce((sum, inst) => sum + inst.files.length, 0),
		[instructions, projectInstructionsList],
	);
	const hasAnyInstructions = totalInstructionCount > 0;

	const projectGroups = useMemo<UnifiedFileListProjectGroup[]>(() => {
		const byProject = new Map<string, UnifiedFileListProjectGroup>();
		for (const item of projectInstructionsList) {
			if (!item.sourceProjectId) continue;
			const pid = String(item.sourceProjectId);
			const existing = byProject.get(pid);
			if (existing) {
				existing.instructions.push(item);
			} else {
				byProject.set(pid, {
					sourceId: pid,
					sourceLabel: item.sourceProjectName ?? "",
					instructions: [item],
				});
			}
		}
		return Array.from(byProject.values());
	}, [projectInstructionsList]);

	const stackInstructionsForList = useMemo(
		() =>
			stackId && instructions.length > 0
				? {
						sourceId: String(stackId),
						sourceLabel: "Stack",
						instructions: instructions as InstructionItemType[],
					}
				: null,
		[stackId, instructions],
	);

	return (
		<aside className="hidden w-140 shrink-0 lg:block">
			<div className="sticky top-[58px] flex max-h-[calc(100vh-58px)] flex-col">
				<div className="flex-grow overflow-y-auto ml-6 py-12 space-y-12">
					{/* Main Tools */}
					{mainTools.length > 0 && (
						<section>
							<p className="mb-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
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
							<p className="mb-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
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
							<p className="mb-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
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
							<p className="mb-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
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
					<section>
						<p className="mb-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
							{"// Instructions"}
							{hasAnyInstructions && (
								<span className="ml-2 text-fg-muted">
									· {totalInstructionCount}{" "}
									{totalInstructionCount === 1 ? "item" : "items"}
									{totalFileCount > 0 &&
										` · ${totalFileCount} ${totalFileCount === 1 ? "file" : "files"}`}
								</span>
							)}
						</p>
						{hasAnyInstructions ? (
							<UnifiedFileList
								mode="view"
								stackInstructions={stackInstructionsForList}
								projectInstructions={projectGroups}
							/>
						) : (
							<div className="border border-stroke-subtle bg-bg-panel-muted/40 p-4">
								<p className="text-sm text-fg-secondary">
									Connect a project via CLI to see your setup files here
								</p>
								<code className="mt-3 inline-block border border-stroke-subtle bg-bg-panel px-2 py-1 font-mono text-xs text-accent-lime">
									npx @use-aistack/cli collect
								</code>
							</div>
						)}
					</section>
				</div>
			</div>
		</aside>
	);
}
