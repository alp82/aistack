import { Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FileText } from "lucide-react";
import { useState } from "react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import type { InstructionType } from "@/features/stack-editor/types";
import { instructionTypeColorsSplit as typeColors } from "@/lib/instruction-utils";
import { BaseCard } from "./BaseCard";
import { collapseCardToReference } from "./expandCollapse";
import { FileContentDialog } from "./FileContentDialog";
import { InstructionTooltipContent } from "./InstructionTooltipContent";

export interface AIFileCardAttrs {
	name: string;
	instructionType: InstructionType;
	description: string | null;
}

function AIFileCardView({ node, editor, getPos, selected }: NodeViewProps) {
	const { name, instructionType, description } = node.attrs as AIFileCardAttrs;
	const context = useOptionalEditorContext();
	const isEditable = editor?.isEditable ?? false;

	const instructionData = context?.instructionLookup.get(name);
	const files = context?.instructionFiles.get(name) ?? [];
	const colors = typeColors[instructionType] || typeColors.prompt;

	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogTab, setDialogTab] = useState(0);

	const resolvedDescription = instructionData?.description ?? description ?? "";

	const openDialog = (tab: number) => {
		setDialogTab(tab);
		setDialogOpen(true);
	};

	const handleCollapse = () => {
		if (!editor || typeof getPos !== "function") return;
		collapseCardToReference(editor, getPos, node, "aiInstructionReference", {
			name,
			instructionType,
		});
	};

	const handleNameChange = (newName: string) => {
		if (editor && typeof getPos === "function") {
			const pos = getPos();
			if (pos !== undefined) {
				editor.view.dispatch(
					editor.view.state.tr.setNodeMarkup(pos, undefined, {
						...node.attrs,
						name: newName,
					}),
				);
			}
		}
		context?.onInstructionUpdate?.(name, {
			name: newName,
			type: instructionType,
		});
	};

	const handleDescriptionChange = (value: string) => {
		context?.onInstructionUpdate?.(name, {
			name,
			type: instructionType,
			description: value,
		});
	};

	const handleFilesChange = (updatedFiles: typeof files) => {
		context?.onInstructionFilesUpdate?.(name, updatedFiles);
	};

	return (
		<>
			<BaseCard
				accentColorClass={`${colors.bg}`}
				selected={selected}
				icon={<FileText className={`size-3.5 ${colors.text}`} />}
				name={name}
				nameEditable={isEditable}
				onNameChange={handleNameChange}
				description={resolvedDescription}
				isEditable={isEditable}
				onDescriptionChange={handleDescriptionChange}
				onCollapse={handleCollapse}
				tooltipContent={() => (
					<InstructionTooltipContent
						name={name}
						instructionType={instructionType}
						description={instructionData?.description}
						content={files[0]?.content}
					/>
				)}
				cardId={name}
			>
				{files.length > 0 && (
					<div className="px-3 pb-2">
						<div className="flex flex-wrap items-center gap-1.5">
							{files.slice(0, 3).map((f, i) => (
								<button
									key={f.name}
									type="button"
									onClick={() => openDialog(i)}
									className="inline-flex cursor-pointer items-center gap-1.5 border border-stroke-subtle px-2 py-0.5 font-mono text-[11px] text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
								>
									<FileText className="size-2.5 shrink-0" />
									{f.name}
								</button>
							))}
							{files.length > 3 && (
								<button
									type="button"
									onClick={() => openDialog(0)}
									className="inline-flex cursor-pointer items-center gap-1 px-2 py-0.5 font-mono text-[11px] text-fg-muted transition-colors hover:text-accent-lime"
								>
									+{files.length - 3} more
								</button>
							)}
						</div>
					</div>
				)}
				{files.length === 0 && isEditable && (
					<div className="px-3 pb-2">
						<button
							type="button"
							onClick={() => {
								const newFiles = [{ name: name || "untitled.md", content: "" }];
								handleFilesChange(newFiles);
								openDialog(0);
							}}
							className="cursor-pointer font-mono text-[11px] text-fg-muted transition-colors hover:text-accent-lime"
						>
							+ Add file
						</button>
					</div>
				)}
			</BaseCard>

			<FileContentDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				instructionName={name}
				files={files}
				initialTab={dialogTab}
				isEditable={isEditable}
				onFilesChange={handleFilesChange}
			/>
		</>
	);
}

export const AIFileCard = Node.create({
	name: "aiFileCard",
	group: "block",
	atom: true,

	addAttributes() {
		return {
			name: {
				default: "",
			},
			instructionType: {
				default: "skill",
			},
			description: {
				default: null,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "div[data-ai-file-card]",
				getAttrs: (element) => {
					if (typeof element === "string") return false;
					const el = element as HTMLElement;
					return {
						name: el.getAttribute("data-file-name") || "",
						instructionType:
							el.getAttribute("data-instruction-type") || "skill",
						description: el.getAttribute("data-description") || null,
					};
				},
			},
			{
				tag: "div[data-ai-folder-card]",
				getAttrs: (element) => {
					if (typeof element === "string") return false;
					const el = element as HTMLElement;
					return {
						name: el.getAttribute("data-folder-name") || "",
						instructionType:
							el.getAttribute("data-instruction-type") || "skill",
						description: el.getAttribute("data-description") || null,
					};
				},
			},
		];
	},

	renderHTML({ node }) {
		return [
			"div",
			{
				"data-ai-file-card": "",
				"data-file-name": node.attrs.name,
				"data-instruction-type": node.attrs.instructionType,
				"data-description": node.attrs.description || "",
			},
			node.attrs.name,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AIFileCardView);
	},
});
