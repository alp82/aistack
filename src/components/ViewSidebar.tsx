import { useMemo } from "react";
import { BundleItem, type BundleItemData } from "@/components/BundleItem";
import { ModelItem, type ModelItemData } from "@/components/ModelItem";
import { ToolItem, type ToolItemData } from "@/components/ToolItem";
import {
	UnifiedResourceList,
	type UnifiedResourceListProjectGroup,
} from "@/components/UnifiedResourceList";
import type { Resource } from "@/features/stack-editor/types";
import { sortToolsByPrice } from "@/lib/pricing";
import { getResourceTypeLabel } from "@/lib/resource-utils";
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
type ViewResource = Resource;
type ProjectSourcedResource = Resource & {
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
	resources: ViewResource[];
	projectResources?: ProjectSourcedResource[];
	onBundleClick?: (bundleSlug: string) => void;
};

export function ViewSidebar({
	stackId,
	tools,
	bundles,
	models,
	resources,
	projectResources,
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

	const projectResourcesList = useMemo(
		() => projectResources ?? [],
		[projectResources],
	);
	const totalResourceCount = resources.length + projectResourcesList.length;
	const totalFileCount = useMemo(
		() =>
			resources.reduce((sum, r) => sum + r.files.length, 0) +
			projectResourcesList.reduce((sum, r) => sum + r.files.length, 0),
		[resources, projectResourcesList],
	);
	const hasAnyResources = totalResourceCount > 0;

	const kindCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const r of [...resources, ...projectResourcesList]) {
			counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
		}
		return Array.from(counts.entries())
			.filter(([, c]) => c > 0)
			.sort(([a], [b]) => a.localeCompare(b));
	}, [resources, projectResourcesList]);

	const projectGroups = useMemo<UnifiedResourceListProjectGroup[]>(() => {
		const byProject = new Map<string, UnifiedResourceListProjectGroup>();
		for (const item of projectResourcesList) {
			if (!item.sourceProjectId) continue;
			const pid = String(item.sourceProjectId);
			const existing = byProject.get(pid);
			if (existing) {
				existing.resources.push(item);
			} else {
				byProject.set(pid, {
					sourceId: pid,
					sourceLabel: item.sourceProjectName ?? "",
					resources: [item],
				});
			}
		}
		return Array.from(byProject.values());
	}, [projectResourcesList]);

	const stackResourcesForList = useMemo(
		() =>
			stackId && resources.length > 0
				? {
						sourceId: String(stackId),
						sourceLabel: "Stack",
						resources: resources as Resource[],
					}
				: null,
		[stackId, resources],
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

					{/* Resources */}
					<section>
						<p className="mb-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
							{"// SETUP"}
							{hasAnyResources && (
								<span className="ml-2 text-fg-muted">
									· {totalResourceCount}{" "}
									{totalResourceCount === 1 ? "item" : "items"}
									{totalFileCount > 0 &&
										` · ${totalFileCount} ${totalFileCount === 1 ? "file" : "files"}`}
								</span>
							)}
						</p>
						{kindCounts.length > 0 && (
							<div className="mb-3 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] text-fg-muted">
								{kindCounts.map(([type, count], idx) => (
									<span key={type}>
										{idx > 0 && <span className="mr-2">·</span>}
										{count} {getResourceTypeLabel(type)}
									</span>
								))}
							</div>
						)}
						{hasAnyResources ? (
							<UnifiedResourceList
								mode="view"
								stackResources={stackResourcesForList}
								projectResources={projectGroups}
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
