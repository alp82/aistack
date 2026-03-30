import { Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Braces, FileText } from "lucide-react";
import { useState } from "react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import type { InstructionType } from "@/features/stack-editor/types";
import {
	getInstructionTypeColorsSplit,
	getInstructionTypePillColors,
} from "@/lib/instruction-utils";
import { cn } from "@/lib/utils";
import { AddFileButton } from "./AddFileButton";
import { BaseCard } from "./BaseCard";
import { EntityPill } from "./EntityPill";
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
	const colors = getInstructionTypeColorsSplit(instructionType);
	const pillColors = getInstructionTypePillColors(instructionType);
	const accentColors = getInstructionTypeColorsSplit(instructionType);

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

	const instructionIcon = (
		<span
			className={cn(
				"flex size-4 shrink-0 items-center justify-center border",
				pillColors.border,
				pillColors.bg,
				accentColors.text,
			)}
		>
			<Braces className="size-3" />
		</span>
	);

	return (
		<>
			<BaseCard
				accentColorClass={`${colors.bg}`}
				selected={selected}
				headerContent={
					<EntityPill
						name={name}
						icon={instructionIcon}
						colors={pillColors}
						onNameClick={
							isEditable
								? () => context?.setEditInstructionRequest?.(name)
								: undefined
						}
						onCollapse={isEditable ? handleCollapse : undefined}
						tooltipContent={() => (
							<InstructionTooltipContent
								name={name}
								instructionType={instructionType}
								description={instructionData?.description}
								content={files[0]?.content}
							/>
						)}
					/>
				}
				description={resolvedDescription}
				isEditable={isEditable}
				onDescriptionChange={handleDescriptionChange}
				cardId={name}
			>
				{(files.length > 0 || isEditable) && (
					<div className="mt-1 px-3 pb-2">
						<div className="flex flex-wrap items-center gap-2">
							{files.slice(0, 3).map((f, i) => (
								<button
									key={f.name}
									type="button"
									onClick={() => openDialog(i)}
									className="group/file inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong bg-bg-panel px-3 py-1.5 font-mono text-xs font-bold text-fg-primary shadow-[2px_2px_0_var(--stroke-strong)] transition-all hover:border-accent-lime hover:shadow-[2px_2px_0_var(--accent-lime)] hover:text-accent-lime"
								>
									<FileText className="size-3.5 shrink-0 text-fg-muted group-hover/file:text-accent-lime" />
									{f.name}
								</button>
							))}
							{files.length > 3 && (
								<button
									type="button"
									onClick={() => openDialog(0)}
									className="inline-flex cursor-pointer items-center border-2 border-stroke-strong bg-bg-panel px-3 py-1.5 font-mono text-xs font-bold text-fg-muted shadow-[2px_2px_0_var(--stroke-strong)] transition-all hover:border-accent-lime hover:shadow-[2px_2px_0_var(--accent-lime)] hover:text-accent-lime"
								>
									+{files.length - 3} more
								</button>
							)}
							{isEditable && (
								<AddFileButton
									onClick={() => {
										const newFiles = [
											...files,
											{ name: "untitled.md", content: "" },
										];
										handleFilesChange(newFiles);
										openDialog(newFiles.length - 1);
									}}
									pulse={files.length === 0}
								/>
							)}
						</div>
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
