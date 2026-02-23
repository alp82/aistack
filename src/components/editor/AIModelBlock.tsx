import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Brain } from "lucide-react";

export interface AIModelBlockAttrs {
	modelId: string;
	name: string;
	provider: string;
	iconUrl: string | null;
}

function AIModelBlockView({ node }: NodeViewProps) {
	const { name, iconUrl } = node.attrs as AIModelBlockAttrs;

	return (
		<NodeViewWrapper as="span" className="inline-flex flex-col items-center mx-1">
			<span
				contentEditable={false}
				className="inline-flex cursor-pointer items-center gap-2 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 align-baseline font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:border-cyan-500 hover:bg-cyan-500/20"
			>
				{iconUrl ? (
					<img
						src={iconUrl}
						alt=""
						className="size-4 shrink-0 rounded object-contain align-middle"
						style={{ margin: 0 }}
					/>
					) : (
					<span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-cyan-500/30 bg-cyan-500/10 text-cyan-500">
						<Brain className="size-3" />
					</span>
				)}
				<span>{name}</span>
			</span>
			<span className="font-mono text-[8px] uppercase tracking-wider text-cyan-500/60 mt-0.5">
				Model
			</span>
		</NodeViewWrapper>
	);
}

export const AIModelBlock = Node.create({
	name: "aiModelBlock",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			modelId: {
				default: null,
			},
			name: {
				default: "",
			},
			provider: {
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
				tag: 'span[data-ai-model-block]',
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"span",
			mergeAttributes(HTMLAttributes, { 
				"data-ai-model-block": "",
				"data-model-id": node.attrs.modelId,
				"data-model-name": node.attrs.name,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIModelBlockView);
	},
});
