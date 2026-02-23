import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";

export interface AIToolBlockAttrs {
	toolId: string;
	name: string;
	iconUrl: string | null;
}

function AIToolBlockView({ node }: NodeViewProps) {
	const { name, iconUrl } = node.attrs as AIToolBlockAttrs;
	const context = useOptionalEditorContext();
	const setHoveredToolName = context?.setHoveredToolName ?? (() => {});

	return (
		<NodeViewWrapper as="span" className="inline-flex flex-col items-center mx-1">
			<span
				contentEditable={false}
				onMouseEnter={() => setHoveredToolName(name)}
				onMouseLeave={() => setHoveredToolName(null)}
				className="inline-flex cursor-pointer items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 align-baseline font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:border-amber-500 hover:bg-amber-500/20"
			>
				{iconUrl ? (
					<img
						src={iconUrl}
						alt=""
						className="size-4 shrink-0 rounded object-contain align-middle"
						style={{ margin: 0 }}
					/>
					) : (
					<span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-stroke-subtle bg-bg-panel-muted text-[9px] font-bold text-fg-muted">
						{name.charAt(0).toUpperCase()}
					</span>
				)}
				<span>{name}</span>
			</span>
			<span className="font-mono text-[8px] uppercase tracking-wider text-amber-500/60 mt-0.5">
				Tool
			</span>
		</NodeViewWrapper>
	);
}

export const AIToolBlock = Node.create({
	name: "aiToolBlock",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			toolId: {
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
				tag: 'span[data-ai-tool-block]',
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		return [
			"span",
			mergeAttributes(HTMLAttributes, { 
				"data-ai-tool-block": "",
				"data-tool-id": node.attrs.toolId,
				"data-tool-name": node.attrs.name,
			}),
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIToolBlockView);
	},
});
