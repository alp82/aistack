import {
	ArrowLeft,
	ChevronDown,
	FileText,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddFileButton } from "@/components/editor/AddFileButton";
import { ResourceViewer } from "@/components/resources/ResourceViewer";
import { Dialog } from "@/components/ui/Dialog";
import type {
	FileEntry,
	Resource,
	ResourceType,
} from "@/features/stack-editor/types";
import {
	buildManualStableKey,
	getResourceTypeColorsSplit,
	getResourceTypeLabel,
	knownResourceTypes,
	MANUAL_RESOURCE_GROUP,
} from "@/lib/resource-utils";
import { cn } from "@/lib/utils";

interface ResourcePanelProps {
	resource: Resource | null;
	onSave: (resource: Resource) => void;
	onDelete?: () => void;
	onBack: () => void;
}

export function ResourcePanel({
	resource,
	onSave,
	onDelete,
	onBack,
}: ResourcePanelProps) {
	const [name, setName] = useState(resource?.name ?? "");
	const [type, setType] = useState<ResourceType>(resource?.type ?? "prompt");
	const [description, setDescription] = useState(resource?.description ?? "");
	const [files, setFiles] = useState<FileEntry[]>(resource?.files ?? []);

	const [typeInputFocused, setTypeInputFocused] = useState(false);
	const [typeInputValue, setTypeInputValue] = useState(
		resource?.type ?? "prompt",
	);
	const typeContainerRef = useRef<HTMLDivElement>(null);
	const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const [fileDialogOpen, setFileDialogOpen] = useState(false);
	const [activeTab, setActiveTab] = useState(0);
	const [addingFile, setAddingFile] = useState(false);
	const [newFileName, setNewFileName] = useState("");

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

	const handleTypeSelect = useCallback((t: ResourceType) => {
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
		setActiveTab(index);
		setFileDialogOpen(true);
	};

	const handleAddFile = () => {
		const newFiles = [...files, { name: "untitled.md", content: "" }];
		setFiles(newFiles);
		setActiveTab(newFiles.length - 1);
		setFileDialogOpen(true);
	};

	const updateFileAt = (index: number, content: string) => {
		setFiles((prev) =>
			prev.map((f, i) => (i === index ? { ...f, content } : f)),
		);
	};

	const handleFileNameChange = (idx: number, newName: string) => {
		setFiles((prev) =>
			prev.map((f, i) => (i === idx ? { ...f, name: newName } : f)),
		);
	};

	const handleFilePathChange = (idx: number, path: string) => {
		setFiles((prev) =>
			prev.map((f, i) => (i === idx ? { ...f, path: path || undefined } : f)),
		);
	};

	const handleDeleteFile = (idx: number) => {
		const updated = files.filter((_, i) => i !== idx);
		setFiles(updated);
		if (activeTab >= updated.length) {
			setActiveTab(Math.max(0, updated.length - 1));
		}
	};

	const handleAddNewFile = () => {
		if (!newFileName.trim()) return;
		const updated = [...files, { name: newFileName.trim(), content: "" }];
		setFiles(updated);
		setActiveTab(updated.length - 1);
		setNewFileName("");
		setAddingFile(false);
	};

	const handleSave = () => {
		const trimmedName = name.trim();
		if (!trimmedName) return;
		onSave({
			type,
			name: trimmedName,
			description: description.trim() || undefined,
			group: resource?.group ?? MANUAL_RESOURCE_GROUP,
			stableKey: resource?.stableKey ?? buildManualStableKey(type, trimmedName),
			files,
		});
	};

	const isEditing = resource !== null;
	const activeFile = files[activeTab] ?? null;

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
					{isEditing ? "// EDIT RESOURCE" : "// NEW RESOURCE"}
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
							{knownResourceTypes.map((t) => {
								const colors = getResourceTypeColorsSplit(t);
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
										{getResourceTypeLabel(t)}
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
							const colors = getResourceTypeColorsSplit(type);
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

			{/* Multi-file dialog: tab strip + per-file editor */}
			<Dialog
				open={fileDialogOpen}
				onClose={() => setFileDialogOpen(false)}
				title={name || "New Resource"}
				size="lg"
				padding="p-0"
				scrollable
			>
				{/* Tab bar */}
				<div className="flex items-center overflow-x-auto border-b border-stroke-subtle">
					{files.map((file, idx) => (
						<button
							key={`tab-${file.name}-${idx}`}
							type="button"
							onClick={() => setActiveTab(idx)}
							className={`group inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 font-mono text-xs transition-colors cursor-pointer ${
								activeTab === idx
									? "border-b-2 border-accent-lime bg-accent-lime/5 text-fg-primary"
									: "text-fg-muted hover:text-fg-primary"
							}`}
						>
							<FileText className="size-3 shrink-0" />
							{file.name || "(unnamed)"}
							<span
								role="button"
								tabIndex={-1}
								onClick={(e) => {
									e.stopPropagation();
									handleDeleteFile(idx);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.stopPropagation();
										handleDeleteFile(idx);
									}
								}}
								className="ml-1 opacity-0 transition-colors hover:text-destructive group-hover:opacity-100"
							>
								<X className="size-3" />
							</span>
						</button>
					))}

					{addingFile && (
						<div className="inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5">
							<FileText className="size-3 shrink-0 text-fg-muted" />
							<input
								type="text"
								value={newFileName}
								onChange={(e) => setNewFileName(e.target.value)}
								autoFocus
								placeholder="filename.md"
								className="w-24 border-b border-stroke-subtle bg-transparent font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none"
								onKeyDown={(e) => {
									e.stopPropagation();
									if (e.key === "Enter") handleAddNewFile();
									if (e.key === "Escape") setAddingFile(false);
								}}
								onBlur={() => {
									if (!newFileName.trim()) setAddingFile(false);
								}}
							/>
						</div>
					)}

					<button
						type="button"
						onClick={() => {
							if (addingFile && newFileName.trim()) {
								handleAddNewFile();
							}
							setAddingFile(true);
						}}
						className="flex shrink-0 cursor-pointer items-center justify-center px-3 py-2.5 text-fg-muted transition-colors hover:text-accent-lime"
						title="Add file"
					>
						<Plus className="size-3.5" />
					</button>
				</div>

				{/* Active file content area: shared editable-header viewer body.
				    Save UX is handled externally by the panel's own Save button, so we
				    intentionally omit `onSave` to suppress the inner save footer. */}
				{activeFile ? (
					<ResourceViewer
						className="border-0"
						file={activeFile}
						editable
						editableHeader
						onContentChange={(content) => updateFileAt(activeTab, content)}
						onNameChange={(newName) => handleFileNameChange(activeTab, newName)}
						onPathChange={(path) => handleFilePathChange(activeTab, path)}
					/>
				) : (
					<div className="p-4 font-mono text-sm text-fg-muted">
						Click "Add file" to create your first file
					</div>
				)}

				{/* Footer */}
				<div className="flex items-center justify-end gap-2 border-t border-stroke-subtle px-4 py-3">
					<button
						type="button"
						onClick={() => setFileDialogOpen(false)}
						className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-fg-muted hover:text-fg-primary transition-colors cursor-pointer border border-stroke-subtle"
					>
						Close
					</button>
				</div>
			</Dialog>
		</div>
	);
}
