import { Check, Copy, FileText, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import type { FileEntry } from "@/features/stack-editor/types";

interface FileContentDialogProps {
	open: boolean;
	onClose: () => void;
	instructionName: string;
	files: FileEntry[];
	initialTab?: number;
	isEditable: boolean;
	onFilesChange?: (files: FileEntry[]) => void;
}

export function FileContentDialog({
	open,
	onClose,
	instructionName,
	files: externalFiles,
	initialTab = 0,
	isEditable,
	onFilesChange,
}: FileContentDialogProps) {
	const [files, setFiles] = useState<FileEntry[]>(externalFiles);
	const [activeTab, setActiveTab] = useState(initialTab);
	const [addingFile, setAddingFile] = useState(false);
	const [newFileName, setNewFileName] = useState("");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setFiles(externalFiles);
	}, [externalFiles]);

	useEffect(() => {
		setActiveTab(initialTab);
	}, [initialTab]);

	const updateFiles = (updated: FileEntry[]) => {
		setFiles(updated);
		onFilesChange?.(updated);
	};

	const handleFileContentChange = (idx: number, content: string) => {
		const updated = files.map((f, i) => (i === idx ? { ...f, content } : f));
		updateFiles(updated);
	};

	const handleFileNameChange = (idx: number, newName: string) => {
		const updated = files.map((f, i) =>
			i === idx ? { ...f, name: newName } : f,
		);
		updateFiles(updated);
	};

	const handleFilePathChange = (idx: number, path: string) => {
		const updated = files.map((f, i) =>
			i === idx ? { ...f, path: path || undefined } : f,
		);
		updateFiles(updated);
	};

	const handleDeleteFile = (idx: number) => {
		const updated = files.filter((_, i) => i !== idx);
		updateFiles(updated);
		if (activeTab >= updated.length) {
			setActiveTab(Math.max(0, updated.length - 1));
		}
	};

	const handleAddFile = () => {
		if (!newFileName.trim()) return;
		const updated = [...files, { name: newFileName.trim(), content: "" }];
		updateFiles(updated);
		setActiveTab(updated.length - 1);
		setNewFileName("");
		setAddingFile(false);
	};

	const handleCopy = () => {
		if (!activeFile) return;
		navigator.clipboard.writeText(activeFile.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const activeFile = files[activeTab] ?? null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={instructionName}
			size="lg"
			padding="p-0"
			scrollable
		>
			{/* Tab bar — hidden for single-file, non-editable items */}
			{(files.length > 1 || isEditable) && (
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
							{isEditable && (
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
							)}
						</button>
					))}

					{isEditable && addingFile && (
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
									if (e.key === "Enter") handleAddFile();
									if (e.key === "Escape") setAddingFile(false);
								}}
								onBlur={() => {
									if (!newFileName.trim()) setAddingFile(false);
								}}
							/>
						</div>
					)}

					{isEditable && (
						<button
							type="button"
							onClick={() => {
								if (addingFile && newFileName.trim()) {
									handleAddFile();
								}
								setAddingFile(true);
							}}
							className="flex shrink-0 cursor-pointer items-center justify-center px-3 py-2.5 text-fg-muted transition-colors hover:text-accent-lime"
							title="Add file"
						>
							<Plus className="size-3.5" />
						</button>
					)}
				</div>
			)}

			{/* Active file content */}
			{activeFile ? (
				<div className="flex flex-col">
					{/* Path + Filename row */}
					{isEditable ? (
						<div className="flex items-center gap-0 border-b border-stroke-subtle">
							<div className="shrink-0 border-r border-stroke-subtle px-4 py-2.5">
								<input
									type="text"
									value={activeFile.path ?? ""}
									onChange={(e) =>
										handleFilePathChange(activeTab, e.target.value)
									}
									onKeyDown={(e) => {
										e.stopPropagation();
										if (e.key === "Enter") e.currentTarget.blur();
									}}
									placeholder="path/"
									className="w-32 border-0 bg-transparent font-mono text-xs text-fg-muted placeholder:text-fg-muted/30 focus:outline-none focus:ring-0"
								/>
							</div>
							<div className="min-w-0 flex-1 px-4 py-2.5">
								<input
									type="text"
									value={activeFile.name}
									onChange={(e) =>
										handleFileNameChange(activeTab, e.target.value)
									}
									onKeyDown={(e) => {
										e.stopPropagation();
										if (e.key === "Enter") e.currentTarget.blur();
									}}
									placeholder="filename.md"
									className="w-full border-0 bg-transparent font-mono text-sm font-bold text-fg-primary placeholder:text-fg-muted/40 focus:outline-none focus:ring-0"
								/>
							</div>
						</div>
					) : activeFile.path &&
						activeFile.path !== activeFile.name &&
						activeFile.path !== instructionName ? (
						<div className="border-b border-stroke-subtle px-4 py-2.5">
							<span className="font-mono text-xs text-fg-muted">
								{activeFile.path}
							</span>
						</div>
					) : null}

					{/* Tags display */}
					{activeFile.tags && activeFile.tags.length > 0 && (
						<div className="flex items-center gap-1 border-b border-stroke-subtle px-4 py-1.5">
							{activeFile.tags.map((tag) => (
								<span
									key={tag}
									className="font-mono text-[10px] text-fg-muted border border-stroke-subtle px-1.5 py-0.5"
								>
									{tag}
								</span>
							))}
						</div>
					)}

					{/* Content area with copy button */}
					<div className="relative">
						<button
							type="button"
							onClick={handleCopy}
							className="absolute right-7 top-4 z-10 inline-flex items-center gap-1.5 border-2 border-accent-lime/50 bg-bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-lime transition-colors hover:border-accent-lime hover:bg-accent-lime/10 cursor-pointer"
						>
							{copied ? (
								<>
									<Check className="size-3" />
									Copied
								</>
							) : (
								<>
									<Copy className="size-3" />
									Copy
								</>
							)}
						</button>
						<textarea
							value={activeFile.content}
							onChange={(e) =>
								handleFileContentChange(activeTab, e.target.value)
							}
							onKeyDown={(e) => e.stopPropagation()}
							placeholder={isEditable ? "File content..." : ""}
							readOnly={!isEditable}
							rows={Math.min(
								Math.max(activeFile.content.split("\n").length + 1, 10),
								30,
							)}
							className="w-full resize-none overflow-y-scroll border-0 bg-bg-canvas p-4 font-mono text-xs leading-5 text-fg-primary placeholder:text-fg-muted/40 focus:outline-none focus:ring-0"
						/>
					</div>
				</div>
			) : (
				<div className="p-4 font-mono text-sm text-fg-muted">
					{isEditable
						? 'Click "Add file" to create your first file'
						: "(no files)"}
				</div>
			)}

			{/* Footer */}
			<div className="flex items-center justify-end border-t border-stroke-subtle px-4 py-3">
				<button
					type="button"
					onClick={onClose}
					className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-fg-muted hover:text-fg-primary transition-colors cursor-pointer border border-stroke-subtle"
				>
					Close
				</button>
			</div>
		</Dialog>
	);
}
