import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { useState } from "react";
import { ResourceBrowserDialog } from "@/components/resources";
import type { ResourceBrowserTarget } from "@/components/resources/ResourceBrowser";
import {
	getGroupLabel,
	getResourceTypeColorsSplit,
	getResourceTypeIcon,
	getResourceTypeIconBgClass,
	getResourceTypeLabel,
} from "@/lib/resource-utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { BaseCard } from "./BaseCard";

export interface AIResourceCardAttrs {
	source: "stack";
	sourceId: string;
	stableKey: string;
	fileName: string;
	type: string;
	group: string | null;
	description: string | null;
}

function AIResourceCardView({
	node,
	editor,
	selected,
	updateAttributes,
}: NodeViewProps) {
	const { source, sourceId, stableKey, fileName, type, group, description } =
		node.attrs as AIResourceCardAttrs;
	const isEditable = editor?.isEditable ?? false;
	const [dialogOpen, setDialogOpen] = useState(false);

	const colors = getResourceTypeColorsSplit(type);
	const IconComponent = getResourceTypeIcon(type);
	const iconBgClass = getResourceTypeIconBgClass(type);
	const groupLabel = getGroupLabel(group ?? undefined);
	const typeLabel = getResourceTypeLabel(type);

	const handleDescriptionChange = (value: string) => {
		updateAttributes({ description: value });
	};

	const target: ResourceBrowserTarget = {
		kind: "stack" as const,
		id: sourceId as Id<"stacks">,
	};

	return (
		<>
			<BaseCard
				icon={<IconComponent className={`size-7 ${colors.text}`} />}
				iconBgClass={iconBgClass}
				borderClass={colors.border}
				selected={selected}
				headerContent={
					<button
						type="button"
						onClick={() => setDialogOpen(true)}
						className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
						onMouseDown={(e) => e.stopPropagation()}
					>
						<span className="truncate font-mono text-sm font-bold text-fg-primary">
							{fileName}
						</span>
						<span
							className={`shrink-0 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${colors.border} ${colors.text}`}
						>
							{typeLabel}
						</span>
						<span className="shrink-0 font-mono text-[10px] text-fg-muted">
							{groupLabel}
						</span>
					</button>
				}
				metadataSlot={
					<span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
						Stack
					</span>
				}
				description={description ?? ""}
				isEditable={isEditable}
				onDescriptionChange={handleDescriptionChange}
				cardId={`resource-card:${source}:${sourceId}:${stableKey}:${fileName}`}
			/>
			{dialogOpen && (
				<ResourceBrowserDialog
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
					target={target}
					initialSelection={{ stableKey, fileName }}
				/>
			)}
		</>
	);
}

export const AIResourceCard = Node.create({
	name: "aiResourceCard",
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
			stableKey: {
				default: "",
			},
			fileName: {
				default: "",
			},
			type: {
				default: "custom",
			},
			group: {
				default: null,
			},
			description: {
				default: null,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "div[data-ai-resource-card]",
				getAttrs: (element) => {
					if (typeof element === "string") return false;
					const el = element as HTMLElement;
					return {
						source: el.getAttribute("data-source") || "stack",
						sourceId: el.getAttribute("data-source-id") || "",
						stableKey: el.getAttribute("data-stable-key") || "",
						fileName: el.getAttribute("data-file-name") || "",
						type: el.getAttribute("data-type") || "custom",
						group: el.getAttribute("data-group") || null,
						description: el.getAttribute("data-description") || null,
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, {
				"data-ai-resource-card": "",
				"data-source": node.attrs.source,
				"data-source-id": node.attrs.sourceId,
				"data-stable-key": node.attrs.stableKey,
				"data-file-name": node.attrs.fileName,
				"data-type": node.attrs.type,
				"data-group": node.attrs.group ?? "",
				"data-description": node.attrs.description || "",
			}),
			node.attrs.fileName,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIResourceCardView);
	},
});
