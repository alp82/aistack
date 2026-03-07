import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Brain } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";

export interface AIModelBlockAttrs {
	modelId: string;
	name: string;
	provider: string;
	iconUrl: string | null;
}

function ModelTooltipContent({ name, iconUrl, provider, category, notes }: {
	name: string;
	iconUrl?: string;
	provider?: string;
	category?: string;
	notes?: string;
}) {
	return (
		<div className="min-w-[260px] border-[3px] border-stroke-strong bg-bg-panel-elevated p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">
				Model
			</div>
			<div className="mb-2 flex items-center gap-3">
				{iconUrl && (
					<img src={iconUrl} alt="" className="size-8 shrink-0 object-contain" />
				)}
				<div className="min-w-0">
					<div className="font-mono text-sm font-semibold text-fg-primary">{name}</div>
					{provider && (
						<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
							by {provider}
						</div>
					)}
				</div>
			</div>
			{category && (
				<div className="mb-1 inline-flex border border-stroke-subtle bg-bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
					{category}
				</div>
			)}
			{notes && (
				<div className="mt-3 border-t border-stroke-subtle pt-3 text-xs leading-6 text-fg-secondary">
					{notes}
				</div>
			)}
		</div>
	);
}

function AIModelBlockView({ node }: NodeViewProps) {
	const { name, iconUrl, provider } = node.attrs as AIModelBlockAttrs;
	const context = useOptionalEditorContext();
	const modelData = context?.modelLookup.get(name);

	const blockContent = (
		<span
			contentEditable={false}
			className="inline-flex cursor-pointer items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:border-cyan-500 hover:bg-cyan-500/20"
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
	);

	return (
		<NodeViewWrapper as="span" className="inline-flex items-center mx-1" style={{ verticalAlign: '0.05em' }}>
			{modelData ? (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={300}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<ModelTooltipContent
							name={name}
							iconUrl={modelData.iconUrl}
							provider={modelData.provider}
							category={modelData.category}
							notes={modelData.notes}
						/>
					)}
				>
					{blockContent}
				</HoverPreview>
			) : (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={300}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<ModelTooltipContent
							name={name}
							provider={provider}
						/>
					)}
				>
					{blockContent}
				</HoverPreview>
			)}
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
