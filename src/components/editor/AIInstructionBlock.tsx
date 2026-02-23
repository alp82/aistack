import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { FileText } from "lucide-react";
import { useState } from "react";
import type { InstructionType } from "@/features/stack-editor/types";

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

function AIInstructionBlockView({ node }: NodeViewProps) {
	const { name, instructionType, content } = node.attrs as AIInstructionBlockAttrs;
	const [showModal, setShowModal] = useState(false);
	const [copied, setCopied] = useState(false);

	const colors = typeColors[instructionType] || typeColors.prompt;

	const handleCopy = async () => {
		if (content) {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<NodeViewWrapper as="span" className="inline-flex flex-col items-center mx-1">
			<span
				contentEditable={false}
				onClick={() => content && setShowModal(true)}
				className={`inline-flex cursor-pointer items-center gap-2 rounded border ${colors.border} ${colors.bg} px-2 py-1 align-baseline font-mono text-xs font-semibold uppercase text-fg-primary transition-all hover:opacity-80`}
			>
				<span className={`flex size-5 shrink-0 items-center justify-center rounded-sm border ${colors.border} ${colors.bg} ${colors.text}`}>
					<FileText className="size-3" />
				</span>
				<span>{name}</span>
			</span>
			<span className={`font-mono text-[8px] uppercase tracking-wider ${colors.text} opacity-60 mt-0.5`}>
				{typeLabels[instructionType]}
			</span>

			{/* Modal for viewing content */}
			{showModal && (
				<div 
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
					onClick={() => setShowModal(false)}
				>
					<div 
						className="max-h-[80vh] w-full max-w-2xl overflow-auto border border-stroke-subtle bg-bg-panel p-6"
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
							className="mt-4 w-full bg-accent-lime py-2 font-mono text-xs uppercase tracking-wider text-bg-primary transition-opacity hover:opacity-90"
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
