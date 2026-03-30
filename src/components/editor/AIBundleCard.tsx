import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Package } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import { BaseCard } from "./BaseCard";
import { BundleTooltipContent } from "./BundleTooltipContent";
import { bundlePillColors, EntityPill } from "./EntityPill";
import { collapseCardToReference } from "./expandCollapse";

export interface AIBundleCardAttrs {
	shortId: string;
	name: string;
}

function AIBundleCardView({ node, editor, getPos, selected }: NodeViewProps) {
	const { shortId, name } = node.attrs as AIBundleCardAttrs;
	const context = useOptionalEditorContext();
	const bundleData =
		context?.bundleLookupByShortId?.get(shortId) ??
		context?.bundleLookup.get(name);
	const isEditable = editor?.isEditable ?? false;
	const iconUrl = bundleData?.iconUrl;

	const handleCollapse = () => {
		if (!editor || typeof getPos !== "function") return;
		collapseCardToReference(editor, getPos, node, "aiBundleReference", {
			shortId,
			name,
		});
	};

	const bundleIcon = iconUrl ? (
		<img
			src={iconUrl}
			alt=""
			className="size-4 max-h-4 shrink-0 object-contain"
		/>
	) : (
		<Package className="size-3.5 shrink-0 text-violet-500" />
	);

	return (
		<BaseCard
			accentColorClass="bg-violet-500"
			selected={selected}
			headerContent={
				<EntityPill
					name={name}
					icon={bundleIcon}
					colors={bundlePillColors}
					onCollapse={isEditable ? handleCollapse : undefined}
					tooltipContent={() => (
						<BundleTooltipContent
							name={name}
							iconUrl={bundleData?.iconUrl}
							price={bundleData?.price}
							tierName={bundleData?.tierName}
							description={bundleData?.description}
						/>
					)}
				/>
			}
			description={bundleData?.description ?? ""}
			isEditable={isEditable}
			onDescriptionChange={(value) =>
				context?.onBundleDescriptionUpdate?.(shortId || name, value)
			}
			cardId={shortId || name}
		/>
	);
}

export const AIBundleCard = Node.create({
	name: "aiBundleCard",
	group: "block",
	atom: true,

	addAttributes() {
		return {
			shortId: {
				default: null,
			},
			name: {
				default: "",
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "div[data-ai-bundle-card]",
				getAttrs: (element) => {
					const el = element as HTMLElement;
					return {
						shortId: el.getAttribute("data-short-id") || null,
						name: el.getAttribute("data-bundle-name") || "",
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, {
				"data-ai-bundle-card": "",
				"data-short-id": node.attrs.shortId,
				"data-bundle-name": node.attrs.name,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIBundleCardView);
	},
});
