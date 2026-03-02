import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Package } from "lucide-react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";

export interface AIBundleBlockAttrs {
	bundleId: string;
	name: string;
	iconUrl: string | null;
}

function BundleTooltipContent({ name, iconUrl, price, tierName, description, notes }: {
	name: string;
	iconUrl?: string;
	price?: { amount: number; period: string };
	tierName?: string;
	description?: string;
	notes?: string;
}) {
	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel shadow-[6px_6px_0_var(--stroke-strong)] p-3 min-w-[180px]">
			<div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 mb-2 border-b-2 border-stroke-strong pb-2">
				Bundle
			</div>
			<div className="flex items-center gap-2 mb-1">
				{iconUrl && (
					<img src={iconUrl} alt="" className="size-5 shrink-0 rounded object-contain" />
				)}
				<span className="font-mono text-sm font-semibold text-fg-primary">{name}</span>
			</div>
			{description && (
				<div className="text-xs text-fg-secondary mb-2 line-clamp-2">
					{description}
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

function AIBundleBlockView({ node }: NodeViewProps) {
	const { name, iconUrl } = node.attrs as AIBundleBlockAttrs;
	const context = useOptionalEditorContext();
	const bundleData = context?.bundleLookup.get(name);

	const blockContent = (
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
	);

	return (
		<NodeViewWrapper as="span" className="inline-flex items-center mx-1">
			{bundleData ? (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={220}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<BundleTooltipContent
							name={name}
							iconUrl={bundleData.iconUrl}
							price={bundleData.price}
							tierName={bundleData.tierName}
							description={bundleData.description}
							notes={bundleData.notes}
						/>
					)}
				>
					{blockContent}
				</HoverPreview>
			) : (
				<HoverPreview
					mode="wrapper"
					position="above"
					width={220}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={() => (
						<BundleTooltipContent
							name={name}
						/>
					)}
				>
					{blockContent}
				</HoverPreview>
			)}
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
