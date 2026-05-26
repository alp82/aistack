import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FolderTree } from "lucide-react";
import { useState } from "react";
import { ResourceBrowserDialog } from "@/components/resources";
import type { ResourceLocationKind } from "@/lib/resource-utils";
import { getGroupLabel, kindToLocation } from "@/lib/resource-utils";
import { BaseCard } from "./BaseCard";

export interface AIResourceGroupAttrs {
	source: ResourceLocationKind;
	sourceId: string;
	group: string;
	description: string | null;
	// Snapshot at insert time — avoids per-card live queries. Accepts staleness
	// if files are added after the group card is inserted.
	fileCount: number;
	typeBreakdown: Array<{ type: string; count: number }>;
}

function AIResourceGroupView({
	node,
	editor,
	selected,
	updateAttributes,
}: NodeViewProps) {
	const { source, sourceId, group, description, fileCount, typeBreakdown } =
		node.attrs as AIResourceGroupAttrs;
	const isEditable = editor?.isEditable ?? false;
	const [dialogOpen, setDialogOpen] = useState(false);

	const target = kindToLocation(source, sourceId);

	const groupLabel = getGroupLabel(group);

	const handleDescriptionChange = (value: string) => {
		updateAttributes({ description: value });
	};

	const breakdownLabels = (
		Array.isArray(typeBreakdown) ? typeBreakdown : []
	).map(
		({ type, count }) =>
			`${count} ${type.toLowerCase()}${count === 1 ? "" : "s"}`,
	);

	return (
		<>
			<BaseCard
				icon={<FolderTree className="size-7 text-accent-lime" />}
				iconBgClass="bg-accent-lime/15"
				borderClass="border-accent-lime/30"
				selected={selected}
				headerContent={
					<button
						type="button"
						onClick={() => setDialogOpen(true)}
						className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
						onMouseDown={(e) => e.stopPropagation()}
					>
						<span className="truncate font-mono text-sm font-bold uppercase tracking-wider text-fg-primary">
							{groupLabel}
						</span>
						<span className="shrink-0 border border-accent-lime/30 bg-accent-lime/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent-lime">
							Group
						</span>
					</button>
				}
				metadataSlot={
					<span className="font-mono text-[10px] text-fg-muted">
						{fileCount} {fileCount === 1 ? "file" : "files"}
					</span>
				}
				description={description ?? ""}
				isEditable={isEditable}
				onDescriptionChange={handleDescriptionChange}
				cardId={`resource-group:${source}:${sourceId}:${group}`}
			>
				{breakdownLabels.length > 0 && (
					<div className="mt-1 px-3 pb-2">
						<span className="font-mono text-[10px] text-fg-muted">
							{breakdownLabels.join(" · ")}
						</span>
					</div>
				)}
			</BaseCard>
			{dialogOpen && (
				<ResourceBrowserDialog
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
					target={target}
					groupFilter={group}
				/>
			)}
		</>
	);
}

export const AIResourceGroup = Node.create({
	name: "aiResourceGroup",
	group: "block",
	atom: true,

	addAttributes() {
		return {
			source: {
				default: "stack",
			},
			sourceId: {
				default: "",
			},
			group: {
				default: "",
			},
			description: {
				default: null,
			},
			fileCount: {
				default: 0,
			},
			typeBreakdown: {
				default: [],
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "div[data-ai-resource-group]",
				getAttrs: (element) => {
					if (typeof element === "string") return false;
					const el = element as HTMLElement;

					return {
						source: el.getAttribute("data-source") || "stack",
						sourceId: el.getAttribute("data-source-id") || "",
						group: el.getAttribute("data-group") || "",
						description: el.getAttribute("data-description") || null,
						fileCount: Number(el.getAttribute("data-file-count") ?? 0),
						typeBreakdown: JSON.parse(
							el.getAttribute("data-type-breakdown") || "[]",
						),
					};
				},
			},
			// Legacy compat: existing serialized descriptions still use the old data attr.
			{
				tag: "div[data-ai-instruction-group]",
				getAttrs: (element) => {
					if (typeof element === "string") return false;
					const el = element as HTMLElement;

					return {
						source: el.getAttribute("data-source") || "stack",
						sourceId: el.getAttribute("data-source-id") || "",
						group: el.getAttribute("data-group") || "",
						description: el.getAttribute("data-description") || null,
						fileCount: Number(el.getAttribute("data-file-count") ?? 0),
						typeBreakdown: JSON.parse(
							el.getAttribute("data-type-breakdown") || "[]",
						),
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, {
				"data-ai-resource-group": "",
				"data-source": node.attrs.source,
				"data-source-id": node.attrs.sourceId,
				"data-group": node.attrs.group,
				"data-description": node.attrs.description || "",
				"data-file-count": String(node.attrs.fileCount ?? 0),
				"data-type-breakdown": JSON.stringify(node.attrs.typeBreakdown ?? []),
			}),
			node.attrs.group,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIResourceGroupView);
	},
});
