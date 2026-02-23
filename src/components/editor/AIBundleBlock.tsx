import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Package } from "lucide-react";

export interface AIBundleBlockAttrs {
	bundleId: string;
	name: string;
	iconUrl: string | null;
}

function AIBundleBlockView({ node }: NodeViewProps) {
	const { name, iconUrl } = node.attrs as AIBundleBlockAttrs;

	return (
		<NodeViewWrapper as="span" className="inline-flex flex-col items-center mx-1">
			<span
				contentEditable={false}
				className="inline-flex cursor-pointer items-center gap-2 rounded border border-violet-500/30 bg-violet-500/10 px-2 py-1 align-baseline font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:border-violet-500 hover:bg-violet-500/20"
			>
				{iconUrl ? (
					<img
						src={iconUrl}
						alt=""
						className="size-5 shrink-0 rounded object-contain align-middle"
						style={{ margin: 0 }}
					/>
				) : (
					<span className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-violet-500/30 bg-violet-500/10 text-violet-500">
						<Package className="size-3" />
					</span>
				)}
				<span>{name}</span>
			</span>
			<span className="font-mono text-[8px] uppercase tracking-wider text-violet-500/60 mt-0.5">
				Bundle
			</span>
		</NodeViewWrapper>
	);
}

export const AIBundleBlock = Node.create({
	name: "aiBundleBlock",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			bundleId: {
				default: null,
			},
			name: {
				default: "",
			},
			iconUrl: {
				default: null,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-ai-bundle-block]',
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"span",
			mergeAttributes(HTMLAttributes, { 
				"data-ai-bundle-block": "",
				"data-bundle-id": node.attrs.bundleId,
				"data-bundle-name": node.attrs.name,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIBundleBlockView);
	},
});
