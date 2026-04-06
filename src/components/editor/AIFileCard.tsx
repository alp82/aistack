import { Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Braces, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useOptionalEditorContext } from "@/features/stack-editor/context/EditorContext";
import type { InstructionType } from "@/features/stack-editor/types";
import {
	getInstructionTypeColorsSplit,
	getInstructionTypeIcon,
	getInstructionTypeIconBgClass,
	getInstructionTypePillColors,
} from "@/lib/instruction-utils";
import { AddFileButton } from "./AddFileButton";
import { BaseCard } from "./BaseCard";
import { EntityPill } from "./EntityPill";
import { collapseCardToReference } from "./expandCollapse";
import { FileContentDialog } from "./FileContentDialog";
import { FileSlideOver } from "./FileSlideOver";
import { InlineCodeBlock } from "./InlineCodeBlock";

export interface AIFileCardAttrs {
	name: string;
	instructionType: InstructionType;
	description: string | null;
}

function AIFileCardView({
	node,
	editor,
	getPos,
	selected,
	updateAttributes,
}: NodeViewProps) {
	const { name, instructionType } = node.attrs as AIFileCardAttrs;
	const context = useOptionalEditorContext();
	const isEditable = editor?.isEditable ?? false;

	const instructionData = context?.instructionLookup.get(name);
	const files = context?.instructionFiles.get(name) ?? [];
	const colors = getInstructionTypeColorsSplit(instructionType);
	const pillColors = getInstructionTypePillColors(instructionType);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogTab, setDialogTab] = useState(0);
	const [expandedFileIndex, setExpandedFileIndex] = useState<number | null>(
		null,
	);
	const [slideOverOpen, setSlideOverOpen] = useState(false);
	const [slideOverTab, setSlideOverTab] = useState(0);

	const resolvedDescription = instructionData?.description ?? "";

	const openDialog = (tab: number) => {
		setDialogTab(tab);
		setDialogOpen(true);
	};

	const handleFileClick = (index: number) => {
		const file = files[index];
		const lineCount = file.content ? file.content.split("\n").length : 0;

		if (!isEditable && lineCount < 20) {
			setExpandedFileIndex(expandedFileIndex === index ? null : index);
		} else if (!isEditable && lineCount <= 100) {
			setSlideOverTab(index);
			setSlideOverOpen(true);
		} else {
			openDialog(index);
		}
	};

	const handleCollapse = () => {
		if (!editor || typeof getPos !== "function") return;
		collapseCardToReference(editor, getPos, node, "aiInstructionReference", {
			name,
			instructionType,
			description: resolvedDescription || null,
		});
	};

	const handleDescriptionChange = (value: string) => {
		updateAttributes({ description: value });
		context?.onInstructionUpdate?.(name, {
			name,
			type: instructionType,
			description: value,
		});
	};

	const handleFilesChange = (updatedFiles: typeof files) => {
		context?.onInstructionFilesUpdate?.(name, updatedFiles);
	};

	const IconComponent = getInstructionTypeIcon(instructionType);

	const instructionPillIcon = (
		<span
			className={`flex size-4 shrink-0 items-center justify-center border ${pillColors.border} ${pillColors.bg} ${colors.text}`}
		>
			<IconComponent className="size-3" />
		</span>
	);

	const fileLinesData = useMemo(() => {
		const data = files.map((f) => ({
			name: f.name,
			lines: f.content ? f.content.split("\n").length : 0,
		}));
		const maxLines = Math.max(1, ...data.map((d) => d.lines));
		return { data, maxLines };
	}, [files]);

	return (
		<>
			<BaseCard
				icon={<Braces className={`size-7 ${colors.text}`} />}
				iconBgClass={getInstructionTypeIconBgClass(instructionType)}
				borderClass={colors.border}
				selected={selected}
				headerContent={
					<EntityPill
						name={name}
						icon={instructionPillIcon}
						colors={pillColors}
						onNameClick={
							isEditable
								? () => context?.setEditInstructionRequest?.(name)
								: undefined
						}
						onCollapse={isEditable ? handleCollapse : undefined}
					/>
				}
				metadataSlot={
					files.length > 0 ? (
						<span className="font-mono text-[10px] text-fg-muted">
							{files.length} {files.length === 1 ? "file" : "files"}
						</span>
					) : undefined
				}
				description={resolvedDescription}
				isEditable={isEditable}
				onDescriptionChange={handleDescriptionChange}
				cardId={name}
			>
				{(files.length > 0 || isEditable) && (
					<div className="mt-1 px-3 pb-2">
						<div className="flex flex-col gap-1">
							{files.slice(0, 3).map((f, i) => {
								const lineCount = fileLinesData.data[i]?.lines ?? 0;
								const barWidth =
									fileLinesData.maxLines > 0
										? (lineCount / fileLinesData.maxLines) * 100
										: 0;
								return (
									<div key={f.name}>
										<button
											type="button"
											onClick={() => handleFileClick(i)}
											className="group/file flex w-full cursor-pointer items-center gap-2 bg-bg-panel/80 px-1 py-0.5 transition-colors hover:bg-bg-panel"
										>
											<FileText className="size-3.5 shrink-0 text-fg-muted group-hover/file:text-accent-lime" />
											<span className="font-mono text-xs text-fg-primary group-hover/file:text-accent-lime">
												{f.name}
											</span>
											<span className="flex-1" />
											<div
												className={`h-1.5 ${colors.bg} opacity-40`}
												style={{
													width: `${Math.max(2, barWidth * 0.4)}px`,
													maxWidth: "40px",
												}}
											/>
											<span className="min-w-[60px] text-right font-mono text-[10px] text-fg-muted">
												{lineCount} {lineCount === 1 ? "line" : "lines"}
											</span>
										</button>
										{expandedFileIndex === i && (
											<InlineCodeBlock
												content={f.content}
												filename={f.name}
												onClose={() => setExpandedFileIndex(null)}
											/>
										)}
									</div>
								);
							})}
							{files.length > 3 && (
								<button
									type="button"
									onClick={() => openDialog(0)}
									className="cursor-pointer px-1 py-0.5 text-left font-mono text-xs text-fg-muted transition-colors hover:text-accent-lime"
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

			<FileSlideOver
				open={slideOverOpen}
				onClose={() => setSlideOverOpen(false)}
				instructionName={name}
				files={files}
				initialFileIndex={slideOverTab}
				isEditable={isEditable}
				onOpenDialog={openDialog}
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
