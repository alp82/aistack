import { Check, Copy, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FileEntry } from "@/features/stack-editor/types";

interface FileSlideOverProps {
	open: boolean;
	onClose: () => void;
	instructionName: string;
	files: FileEntry[];
	initialFileIndex: number;
	isEditable: boolean;
	onOpenDialog?: (index: number) => void;
}

export function FileSlideOver({
	open,
	onClose,
	instructionName,
	files,
	initialFileIndex,
	isEditable,
	onOpenDialog,
}: FileSlideOverProps) {
	const [mounted, setMounted] = useState(false);
	const [visible, setVisible] = useState(false);
	const [activeIndex, setActiveIndex] = useState(initialFileIndex);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setActiveIndex(initialFileIndex);
	}, [initialFileIndex]);

	useEffect(() => {
		if (open) {
			setMounted(true);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setVisible(true);
				});
			});
		} else {
			setVisible(false);
			const timer = setTimeout(() => setMounted(false), 200);
			return () => clearTimeout(timer);
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	if (!mounted) return null;

	const activeFile = files[activeIndex] ?? null;
	const showSidebar = files.length > 1;

	const handleCopy = () => {
		if (!activeFile) return;
		navigator.clipboard.writeText(activeFile.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleEdit = () => {
		onClose();
		onOpenDialog?.(activeIndex);
	};

	return createPortal(
		<div className="fixed inset-0 z-50 flex justify-end">
			<div
				className={`absolute inset-0 transition-opacity duration-200 ${visible ? "bg-bg-canvas/60 backdrop-blur-sm" : "bg-transparent"}`}
				onClick={onClose}
			/>
			<div
				className={`relative flex h-full w-[480px] flex-col border-l-2 border-stroke-strong bg-bg-canvas transition-transform duration-200 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-stroke-subtle px-4 py-3">
					<span className="font-mono text-xs text-fg-muted">
						{instructionName}
						{activeFile && (
							<>
								<span className="mx-1.5 text-fg-muted/50">›</span>
								<span className="text-fg-primary">{activeFile.name}</span>
							</>
						)}
					</span>
					<button
						type="button"
						onClick={onClose}
						className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Body */}
				<div className="flex min-h-0 flex-1">
					{/* Sidebar */}
					{showSidebar && (
						<div className="w-[140px] shrink-0 overflow-y-auto border-r border-stroke-subtle">
							{files.map((f, i) => (
								<button
									key={f.name}
									type="button"
									onClick={() => setActiveIndex(i)}
									className={`flex w-full items-center gap-1.5 px-3 py-2 font-mono text-xs transition-colors cursor-pointer ${
										activeIndex === i
											? "border-l-2 border-accent-lime bg-accent-lime/5 text-fg-primary"
											: "border-l-2 border-transparent text-fg-muted hover:text-fg-primary"
									}`}
								>
									<FileText className="size-3 shrink-0" />
									<span className="truncate">{f.name}</span>
								</button>
							))}
						</div>
					)}

					{/* Content */}
					<div className="flex min-h-0 flex-1 flex-col">
						{activeFile ? (
							<pre className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-5 text-fg-primary">
								{activeFile.content}
							</pre>
						) : (
							<div className="p-4 font-mono text-sm text-fg-muted">
								(no file selected)
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-2 border-t border-stroke-subtle px-4 py-3">
					{isEditable && (
						<button
							type="button"
							onClick={handleEdit}
							className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted transition-colors hover:text-accent-lime cursor-pointer border border-stroke-subtle"
						>
							Edit
						</button>
					)}
					<button
						type="button"
						onClick={handleCopy}
						className="inline-flex items-center gap-1.5 border border-stroke-subtle px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted transition-colors hover:text-accent-lime cursor-pointer"
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
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted transition-colors hover:text-fg-primary cursor-pointer border border-stroke-subtle"
					>
						Close
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
