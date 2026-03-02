import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { FileText } from "lucide-react";
import { useState } from "react";
import type { InstructionType } from "@/features/stack-editor/types";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import HoverPreview from "@/components/ui/hover-preview";

export interface AIInstructionBlockAttrs {
	name: string;
	instructionType: InstructionType;
	content: string | null;
}

const typeColors: Record<InstructionType, { border: string; bg: string; text: string }> = {
	prompt: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-500" },
	rule: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-500" },
	skill: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-500" },
	mcp: { border: "border-pink-500/30", bg: "bg-pink-500/10", text: "text-pink-500" },
	plugin: { border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-500" },
	subagent: { border: "border-indigo-500/30", bg: "bg-indigo-500/10", text: "text-indigo-500" },
};

const typeLabels: Record<InstructionType, string> = {
	prompt: "Prompt",
	rule: "Rule",
	skill: "Skill",
	mcp: "MCP",
	plugin: "Plugin",
	subagent: "Subagent",
};

function InstructionTooltipContent({ name, instructionType, description }: {
	name: string;
	instructionType: InstructionType;
	description?: string;
}) {
	const colors = typeColors[instructionType] || typeColors.prompt;
	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel shadow-[6px_6px_0_var(--stroke-strong)] p-3 min-w-[180px]">
			<div className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${colors.text} mb-2 border-b-2 border-stroke-strong pb-2`}>
				{typeLabels[instructionType]}
			</div>
			<div className="font-mono text-sm font-semibold text-fg-primary mb-1">{name}</div>
			{description && (
				<div className="text-xs text-fg-secondary line-clamp-3">
					{description}
				</div>
			)}
			<div className="mt-2 text-[10px] text-fg-muted">
				Click to view content
			</div>
		</div>
	);
}

function AIInstructionBlockView({ node }: NodeViewProps) {
	const { name, instructionType, content } = node.attrs as AIInstructionBlockAttrs;
	const [showModal, setShowModal] = useState(false);
	const [copied, setCopied] = useState(false);
	const context = useOptionalEditorContext();
	const instructionData = context?.instructionLookup.get(name);

	const colors = typeColors[instructionType] || typeColors.prompt;

	const handleCopy = async () => {
		if (content) {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const blockContent = (
		<span
			contentEditable={false}
			onClick={() => content && setShowModal(true)}
			className={`inline-flex cursor-pointer items-center gap-2 border ${colors.border} ${colors.bg} px-2 py-1 align-baseline font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:opacity-80`}
		>
			<span className={`flex size-5 shrink-0 items-center justify-center border ${colors.border} ${colors.bg} ${colors.text}`}>
				<FileText className="size-3" />
			</span>
			<span>{name}</span>
		</span>
	);

	return (
		<NodeViewWrapper as="span" className="inline-flex items-center mx-1">
			<HoverPreview
				mode="wrapper"
				position="above"
				width={200}
				height="auto"
				offset={8}
				maxRotation={3}
				maxOffset={5}
				renderContent={() => (
					<InstructionTooltipContent
						name={name}
						instructionType={instructionType}
						description={instructionData?.description}
					/>
				)}
			>
				{blockContent}
			</HoverPreview>

			{/* Modal for viewing content */}
			{showModal && (
				<div 
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
					onClick={() => setShowModal(false)}
				>
					<div 
						className="max-h-[80vh] w-full max-w-4xl overflow-auto border border-stroke-subtle bg-bg-panel p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<div>
								<h3 className="font-mono text-sm font-bold uppercase text-fg-primary">
									{name}
								</h3>
								<span className={`font-mono text-[10px] uppercase ${colors.text}`}>
									{typeLabels[instructionType]}
								</span>
							</div>
							<button
								type="button"
								onClick={handleCopy}
								className="border border-stroke-subtle bg-bg-panel-muted px-3 py-1 font-mono text-xs uppercase text-fg-muted transition-all hover:border-accent-lime hover:text-accent-lime"
							>
								{copied ? "Copied!" : "Copy"}
							</button>
						</div>
						<pre className="whitespace-pre-wrap border border-stroke-subtle bg-bg-panel-muted p-4 font-mono text-xs text-fg-primary">
							{content || "No content"}
						</pre>
						<button
							type="button"
							onClick={() => setShowModal(false)}
							className="mt-4 w-full bg-accent-lime py-2 font-mono text-xs uppercase tracking-wider text-accent-lime-contrast transition-opacity hover:opacity-90 cursor-pointer"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</NodeViewWrapper>
	);
}

export const AIInstructionBlock = Node.create({
	name: "aiInstructionBlock",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			name: {
				default: "",
			},
			instructionType: {
				default: "prompt",
			},
			content: {
				default: null,
			},
		};
	},

	addStorage() {
		return {
			markdown: {
				serialize(state: { write: (text: string) => void }, node: { attrs: AIInstructionBlockAttrs }) {
					// Serialize as HTML span that can be parsed back
					const content = node.attrs.content ? encodeURIComponent(node.attrs.content) : '';
					state.write(`<span data-ai-instruction-block="" data-instruction-name="${node.attrs.name}" data-instruction-type="${node.attrs.instructionType}" data-instruction-content="${content}">${node.attrs.name}</span>`);
				},
				parse: {
					// No special markdown parsing needed - HTML parsing handles it
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-ai-instruction-block]',
				getAttrs: (element) => {
					if (typeof element === 'string') return false;
					const el = element as HTMLElement;
					// Try multiple attribute formats for backwards compatibility
					const name = el.getAttribute('data-instruction-name') || el.getAttribute('name') || el.textContent || '';
					const instructionType = el.getAttribute('data-instruction-type') || el.getAttribute('instructiontype') || 'prompt';
					let content = el.getAttribute('data-instruction-content') || el.getAttribute('content') || null;
					// Decode URL-encoded content
					if (content) {
						try {
							content = decodeURIComponent(content);
						} catch {
							// Keep original if decoding fails
						}
					}
					return { name, instructionType, content };
				},
			},
		];
	},

	renderHTML({ node }) {
		// Encode content to handle special characters (newlines, quotes, etc.)
		const encodedContent = node.attrs.content ? encodeURIComponent(node.attrs.content) : '';
		return [
			"span",
			{ 
				"data-ai-instruction-block": "",
				"data-instruction-name": node.attrs.name,
				"data-instruction-type": node.attrs.instructionType,
				"data-instruction-content": encodedContent,
			},
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIInstructionBlockView);
	},
});
