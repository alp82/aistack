import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";
import { CategoryLabel } from "@/components/CategoryLabel";

export interface AIToolBlockAttrs {
	toolId: string;
	name: string;
	iconUrl: string | null;
}

function ToolTooltipContent({ name, categories, price, tierName, notes }: {
	name: string;
	categories?: string[];
	price?: { amount: number; period: string };
	tierName?: string;
	notes?: string;
}) {
	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel shadow-[6px_6px_0_var(--stroke-strong)] p-3 min-w-[180px]">
			<div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 mb-2 border-b-2 border-stroke-strong pb-2">
				Tool
			</div>
			<div className="font-mono text-sm font-semibold text-fg-primary mb-1">{name}</div>
			{categories && categories.length > 0 && (
				<div className="mb-2 flex flex-wrap gap-1">
					{categories.map((cat) => (
						<CategoryLabel key={cat} category={cat} />
					))}
				</div>
			)}
			{price && (
				<div className="flex items-center justify-between text-sm mb-1">
					<span className="text-fg-muted">Price:</span>
					<span className="font-mono font-bold text-fg-primary">
						${price.amount}<span className="text-xs font-normal text-fg-muted">/{price.period === "one_time" ? "once" : "mo"}</span>
					</span>
				</div>
			)}
			{tierName && (
				<div className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
					{tierName}
				</div>
			)}
			{notes && (
				<div className="mt-2 text-xs text-fg-secondary border-t border-stroke-subtle pt-2">
					{notes}
				</div>
			)}
		</div>
	);
}

function AIToolBlockView({ node }: NodeViewProps) {
	const { name, iconUrl } = node.attrs as AIToolBlockAttrs;
	const context = useOptionalEditorContext();
	const setHoveredToolName = context?.setHoveredToolName ?? (() => {});
	const toolData = context?.toolLookup.get(name);

	const blockContent = (
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
	);

	return (
		<NodeViewWrapper as="span" className="inline-flex items-center mx-1">
			{toolData ? (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={220}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<ToolTooltipContent
							name={name}
							categories={toolData.categories}
							price={toolData.price}
							tierName={toolData.tierName}
							notes={toolData.notes}
						/>
					)}
				>
					{blockContent}
				</HoverPreview>
			) : (
				blockContent
			)}
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
