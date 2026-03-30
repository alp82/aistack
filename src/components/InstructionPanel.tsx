import { ArrowLeft, ChevronDown, FileText, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileContentDialog } from "@/components/editor/FileContentDialog";
import type {
	FileEntry,
	InstructionItem,
	InstructionType,
} from "@/features/stack-editor/types";
import {
	getInstructionTypeColorsSplit,
	getInstructionTypeLabel,
	knownInstructionTypes,
} from "@/lib/instruction-utils";
import { cn } from "@/lib/utils";
import { AddFileButton } from "@/components/editor/AddFileButton";

interface InstructionPanelProps {
	instruction: InstructionItem | null;
	onSave: (instruction: InstructionItem) => void;
	onDelete?: () => void;
	onBack: () => void;
}

export function InstructionPanel({
	instruction,
	onSave,
	onDelete,
	onBack,
}: InstructionPanelProps) {
	const [name, setName] = useState(instruction?.name ?? "");
	const [type, setType] = useState<InstructionType>(
		instruction?.type ?? "prompt",
	);
	const [description, setDescription] = useState(
		instruction?.description ?? "",
	);
	const [files, setFiles] = useState<FileEntry[]>(instruction?.files ?? []);

	const [typeInputFocused, setTypeInputFocused] = useState(false);
	const [typeInputValue, setTypeInputValue] = useState(
		instruction?.type ?? "prompt",
	);
	const typeContainerRef = useRef<HTMLDivElement>(null);
	const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const [fileDialogOpen, setFileDialogOpen] = useState(false);
	const [fileDialogTab, setFileDialogTab] = useState(0);

	// Close type dropdown on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				typeContainerRef.current &&
				!typeContainerRef.current.contains(e.target as Node)
			) {
				setTypeInputFocused(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => {
			document.removeEventListener("mousedown", handleClick);
			clearTimeout(blurTimeoutRef.current);
		};
	}, []);

	const handleTypeSelect = useCallback((t: InstructionType) => {
		setType(t);
		setTypeInputValue(t);
		setTypeInputFocused(false);
	}, []);

	const handleTypeInputChange = (value: string) => {
		setTypeInputValue(value);
		setType(value || "custom");
	};

	const handleTypeInputBlur = () => {
		// Small delay so click on dropdown item fires first
		blurTimeoutRef.current = setTimeout(() => {
			if (typeInputValue.trim()) {
				setType(typeInputValue.trim());
			}
		}, 150);
	};

	const handleFileClick = (index: number) => {
		setFileDialogTab(index);
		setFileDialogOpen(true);
	};

	const handleAddFile = () => {
		const newFiles = [...files, { name: "untitled.md", content: "" }];
		setFiles(newFiles);
		setFileDialogTab(newFiles.length - 1);
		setFileDialogOpen(true);
	};

	const handleFilesChange = (updated: FileEntry[]) => {
		setFiles(updated);
	};

	const handleSave = () => {
		if (!name.trim()) return;
		onSave({
			type,
			name: name.trim(),
			description: description.trim() || undefined,
			files,
		});
	};

	const isEditing = instruction !== null;

	return (
		<div className="space-y-4 p-4">
			{/* Back button */}
			<button
				type="button"
				onClick={onBack}
				className="flex items-center gap-1.5 border-2 border-stroke-strong px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
			>
				<ArrowLeft className="size-3.5" />
				Back
			</button>

			{/* Title */}
			<div className="border-b border-stroke-subtle pb-2">
				<p className="font-mono text-[10px] uppercase tracking-widest text-accent-lime">
					{isEditing ? "// EDIT INSTRUCTION" : "// NEW INSTRUCTION"}
				</p>
			</div>

			{/* Name */}
			<div className="space-y-1">
				<label className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					Name
				</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Code Review Agent"
					className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
				/>
			</div>

			{/* Type combobox */}
			<div className="space-y-1" ref={typeContainerRef}>
				<label className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					Type
				</label>
				<div className="relative">
					<input
						type="text"
						value={typeInputValue}
						onChange={(e) => handleTypeInputChange(e.target.value)}
						onFocus={() => setTypeInputFocused(true)}
						onBlur={handleTypeInputBlur}
						placeholder="prompt"
						className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 pr-7 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
					/>
					<ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted" />

					{typeInputFocused && (
						<div className="absolute top-full z-10 mt-1 w-full border-2 border-stroke-subtle bg-bg-panel">
							{knownInstructionTypes.map((t) => {
								const colors = getInstructionTypeColorsSplit(t);
								return (
									<button
										key={t}
										type="button"
										onMouseDown={(e) => {
											e.preventDefault();
											handleTypeSelect(t);
										}}
										className={cn(
											"flex w-full items-center gap-2 px-2 py-1.5 font-mono text-xs transition-colors hover:bg-accent-lime/10",
											type === t ? "text-fg-primary" : "text-fg-muted",
										)}
									>
										<span className={cn("size-2 shrink-0", colors.bg)} />
										{getInstructionTypeLabel(t)}
									</button>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Description */}
			<div className="space-y-1">
				<label className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					Description
				</label>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Add a description..."
					rows={3}
					className="w-full resize-none border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs leading-5 text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
				/>
			</div>

			{/* Files section */}
			<div className="space-y-2">
				<div className="border-b border-stroke-subtle pb-1">
					<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
						{"// FILES"}
					</p>
				</div>

				{files.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{files.map((file, index) => {
							const colors = getInstructionTypeColorsSplit(type);
							return (
								<button
									key={`${file.name}-${index}`}
									type="button"
									onClick={() => handleFileClick(index)}
									className={cn(
										"flex items-center gap-1.5 border-2 border-stroke-subtle px-2 py-1 font-mono text-[11px] text-fg-primary transition-colors hover:border-fg-muted",
										`border-l-4 ${colors.border}`,
									)}
									style={{
										borderLeftColor: `var(--tw-border-opacity, 1)`,
									}}
								>
									<FileText className="size-3 shrink-0 text-fg-muted" />
									{file.name || "(unnamed)"}
								</button>
							);
						})}
					</div>
				)}

				<AddFileButton onClick={handleAddFile} pulse={files.length === 0} />
			</div>

			{/* Action buttons */}
			<div className="flex items-center justify-end gap-2 pt-2">
				{isEditing && onDelete && (
					<button
						type="button"
						onClick={onDelete}
						className="mr-auto flex items-center gap-1.5 border-2 border-stroke-subtle px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-fg-muted transition-colors hover:border-destructive hover:text-destructive"
					>
						<Trash2 className="size-3" />
						Delete
					</button>
				)}
				<button
					type="button"
					onClick={handleSave}
					disabled={!name.trim()}
					className="border-2 border-accent-lime bg-accent-lime px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-accent-lime-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
				>
					Save
				</button>
			</div>

			{/* File Content Dialog */}
			<FileContentDialog
				open={fileDialogOpen}
				onClose={() => setFileDialogOpen(false)}
				instructionName={name || "New Instruction"}
				files={files}
				initialTab={fileDialogTab}
				isEditable
				onFilesChange={handleFilesChange}
			/>
		</div>
	);
}
