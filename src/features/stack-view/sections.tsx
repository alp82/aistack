import { useMemo } from "react";
import { TableOfContents } from "@/components/TableOfContents";
import { TiptapEditor } from "@/components/TiptapEditor";
import { UnifiedResourceList } from "@/components/UnifiedResourceList";
import type { Resource } from "@/features/stack-editor/types";
import { sortToolsByPrice } from "@/lib/pricing";
import { getResourceTypeLabel } from "@/lib/resource-utils";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import {
	BundleCard,
	ModelTile,
	type StackBundle,
	type StackModel,
	type StackTool,
	ToolCardBig,
	ToolCardMini,
} from "./cards";
import { GAP, Section, SectionHeader } from "./ui";

// ===========================================================================
// 02 — TOOLS
// ===========================================================================

export function ToolsSection({
	index,
	tools,
	onBundleClick,
}: {
	index: number;
	tools: StackTool[];
	onBundleClick?: (bundleSlug: string) => void;
}) {
	const primary = sortToolsByPrice(tools.filter((t) => t.kind === "main"));
	const secondary = sortToolsByPrice(tools.filter((t) => t.kind === "misc"));

	const toolCost = tools.reduce(
		(sum, t) =>
			t.price.fixed && t.priceKind !== "bundle" && t.priceKind !== "sponsored"
				? sum + t.price.fixed.amount
				: sum,
		0,
	);

	if (tools.length === 0) return null;

	return (
		<Section index={index}>
			<SectionHeader
				index="02"
				kicker="// TOOLS"
				title="Tools"
				meta={`${tools.length} ${tools.length === 1 ? "item" : "items"}${
					toolCost > 0 ? ` · $${toolCost}/mo` : ""
				}`}
			/>
			{primary.length > 0 && (
				<div className={cn("grid grid-cols-1 lg:grid-cols-2", GAP)}>
					{primary.map((t) => (
						<ToolCardBig key={t._id} tool={t} onBundleClick={onBundleClick} />
					))}
				</div>
			)}

			{secondary.length > 0 && (
				<div className={primary.length > 0 ? "mt-12" : ""}>
					<p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-fg-muted">
						{"// Also running"}
					</p>
					<div
						className={cn(
							"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
							GAP,
						)}
					>
						{secondary.map((t) => (
							<ToolCardMini
								key={t._id}
								tool={t}
								onBundleClick={onBundleClick}
							/>
						))}
					</div>
				</div>
			)}
		</Section>
	);
}

// ===========================================================================
// 03 — SETUP (CLI-collected files + linked GitHub resources)
// ===========================================================================

export function SetupSection({
	index,
	stackId,
	resources,
}: {
	index: number;
	stackId: Id<"stacks">;
	resources: Resource[];
}) {
	const totalResourceCount = resources.length;

	const totalFileCount = useMemo(
		() => resources.reduce((sum, r) => sum + (r.files?.length ?? 0), 0),
		[resources],
	);

	const kindCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const r of resources) {
			counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
		}
		return Array.from(counts.entries())
			.filter(([, c]) => c > 0)
			.sort(([a], [b]) => a.localeCompare(b));
	}, [resources]);

	const stackResourcesForList = useMemo(
		() =>
			resources.length > 0
				? {
						sourceId: String(stackId),
						sourceLabel: "Stack",
						resources,
					}
				: null,
		[stackId, resources],
	);

	const hasAnyResources = totalResourceCount > 0;

	return (
		<Section index={index}>
			<SectionHeader
				index="03"
				kicker="// SETUP"
				title="Setup"
				meta={
					hasAnyResources
						? `${totalResourceCount} ${totalResourceCount === 1 ? "item" : "items"}${
								totalFileCount > 0
									? ` · ${totalFileCount} ${totalFileCount === 1 ? "file" : "files"}`
									: ""
							}`
						: undefined
				}
			/>

			{kindCounts.length > 0 && (
				<div className="mb-6 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					{kindCounts.map(([type, count], idx) => (
						<span key={type}>
							{idx > 0 && <span className="mr-2">·</span>}
							{count} {getResourceTypeLabel(type)}
						</span>
					))}
				</div>
			)}

			{hasAnyResources ? (
				<div className="max-w-3xl">
					<UnifiedResourceList
						mode="view"
						stackResources={stackResourcesForList}
					/>
				</div>
			) : (
				<div className="max-w-2xl border border-stroke-subtle bg-bg-panel-muted/40 p-5">
					<p className="text-sm text-fg-secondary">
						Connect a project via CLI to see your setup files here
					</p>
					<code className="mt-3 inline-block border border-stroke-subtle bg-bg-panel px-2 py-1 font-mono text-xs text-accent-lime">
						npx @use-aistack/cli collect
					</code>
				</div>
			)}
		</Section>
	);
}

// ===========================================================================
// 04 — MODELS & BUNDLES
// ===========================================================================

export function ModelsBundlesSection({
	index,
	models,
	bundles,
	highlightedBundle,
}: {
	index: number;
	models: StackModel[];
	bundles: StackBundle[];
	highlightedBundle: string | null;
}) {
	const sortedModels = useMemo(
		() =>
			[...models].sort((a, b) => {
				const p = a.provider.localeCompare(b.provider);
				return p !== 0 ? p : b.name.localeCompare(a.name);
			}),
		[models],
	);

	if (models.length === 0 && bundles.length === 0) return null;

	return (
		<Section index={index}>
			<SectionHeader
				index="04"
				kicker="// MODELS & BUNDLES"
				title="Models & Bundles"
				meta={`${models.length} ${models.length === 1 ? "model" : "models"} · ${
					bundles.length
				} ${bundles.length === 1 ? "bundle" : "bundles"}`}
			/>

			<div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
				{/* Models */}
				{sortedModels.length > 0 && (
					<div>
						<p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-lime">
							{"// Models"}
						</p>
						<div className={cn("grid grid-cols-1 sm:grid-cols-2", GAP)}>
							{sortedModels.map((m) => (
								<ModelTile key={m._id} model={m} />
							))}
						</div>
					</div>
				)}

				{/* Bundles */}
				{bundles.length > 0 && (
					<div>
						<p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-lime">
							{"// Bundles"}
						</p>
						<div className="space-y-4">
							{bundles.map((b) => (
								<BundleCard
									key={b._id}
									bundle={b}
									highlighted={highlightedBundle === b.slug}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</Section>
	);
}

// ===========================================================================
// 05 — THE DETAILS (writeup)
// ===========================================================================

export function DescriptionSection({
	index,
	description,
}: {
	index: number;
	description: string;
}) {
	return (
		<Section index={index}>
			<SectionHeader index="05" kicker="// WRITEUP" title="The Details" />
			{/* biome-ignore lint/correctness/useUniqueElementIds: stable anchor for the in-page TOC selector; scopes the heading-scrape to the prose, not the section title */}
			<div id="stack-description" className="max-w-3xl">
				<TableOfContents
					containerSelector="#stack-description"
					contentLength={description.length}
				/>
				<TiptapEditor content={description} editable={false} />
			</div>
		</Section>
	);
}
