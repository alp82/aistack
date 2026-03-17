import { useState, useEffect } from "react";
import type { InstructionType } from "@/features/stack-editor/types";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import {
	instructionTypeColorsSplit as typeColors,
	instructionTypeLabels as typeLabels,
} from "@/lib/instruction-utils";

interface InstructionDialogProps {
	isOpen: boolean;
	onClose: () => void;
	name: string;
	type: InstructionType;
	content?: string;
	editMode?: boolean;
	onSave?: (updates: {
		name: string;
		type: InstructionType;
		content?: string;
	}) => void;
}

export function InstructionDialog({
	isOpen,
	onClose,
	name,
	type,
	content,
	editMode = false,
	onSave,
}: InstructionDialogProps) {
	const [copied, setCopied] = useState(false);
	const [editName, setEditName] = useState(name);
	const [editType, setEditType] = useState<InstructionType>(type);
	const [editContent, setEditContent] = useState(content ?? "");

	const colors = typeColors[editMode ? editType : type] || typeColors.prompt;

	// Prevent body scrolling when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [isOpen]);

	// Reset edit state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setEditName(name);
			setEditType(type);
			setEditContent(content ?? "");
		}
	}, [isOpen, name, type, content]);

	const handleCopy = async () => {
		if (content) {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleSave = () => {
		if (onSave) {
			onSave({
				name: editName.trim() || name,
				type: editType,
				content: editContent.trim() || undefined,
			});
		}
		onClose();
	};

	const isAddMode = editMode && !name;

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
			onClick={editMode ? undefined : onClose}
			onMouseDown={(e) => e.stopPropagation()}
			style={{ overflow: "hidden" }}
		>
			<div
				className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border border-stroke-subtle bg-bg-panel select-text"
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
			>
				{editMode ? (
					<>
						{/* Edit/Add Mode */}
						<div className="border-b border-stroke-subtle p-6 pb-4">
							{isAddMode ? (
								<div className="flex gap-2">
									{(
										Object.entries(typeLabels) as [InstructionType, string][]
									).map(([value, label]) => {
										const tabColors = typeColors[value] || typeColors.prompt;
										const isActive = editType === value;
										return (
											<button
												key={value}
												type="button"
												onClick={() => setEditType(value)}
												className={`flex-1 border-2 py-2 font-mono text-sm font-bold uppercase transition-all ${
													isActive
														? `${tabColors.border} ${tabColors.bg} ${tabColors.text}`
														: "border-stroke-subtle bg-bg-panel text-fg-muted hover:border-fg-muted hover:text-fg-primary"
												}`}
											>
												{label}
											</button>
										);
									})}
								</div>
							) : (
								<h3 className="font-mono text-sm font-bold uppercase text-fg-primary">
									Edit{" "}
									<span className={colors.text}>{typeLabels[editType]}</span>
								</h3>
							)}
						</div>

						<div className="flex-1 space-y-2 overflow-y-auto p-6">
							<FormInput
								label="Name"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
							/>

							<FormTextarea
								label="Content"
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								placeholder="Markdown content..."
								rows={24}
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-2 border-t border-stroke-subtle p-6 pt-4">
							<button
								type="button"
								onClick={handleSave}
								className="flex-1 border-2 border-accent-lime bg-accent-lime py-2 font-mono text-xs uppercase tracking-wider text-accent-lime-contrast transition-opacity hover:opacity-90"
							>
								Save Changes
							</button>
							<button
								type="button"
								onClick={onClose}
								className="flex-1 border-2 border-stroke-subtle bg-bg-panel py-2 font-mono text-xs uppercase tracking-wider text-fg-muted transition-colors hover:border-fg-muted hover:text-fg-primary"
							>
								Cancel
							</button>
						</div>
					</>
				) : (
					<>
						{/* View Mode */}
						<div className="border-b border-stroke-subtle p-6 pb-4">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<h3 className="font-mono text-sm font-bold uppercase text-fg-primary">
										<span className={colors.text}>{typeLabels[type]}:</span>{" "}
										{name}
									</h3>
								</div>
								<button
									type="button"
									onClick={handleCopy}
									className="ml-4 shrink-0 border border-stroke-subtle bg-bg-panel-muted px-3 py-1 font-mono text-xs uppercase text-fg-muted transition-all hover:border-accent-lime hover:text-accent-lime"
								>
									{copied ? "Copied!" : "Copy"}
								</button>
							</div>
						</div>
						<div className="flex-1 overflow-y-auto p-6">
							<pre className="select-text whitespace-pre-wrap border border-stroke-subtle bg-bg-panel-muted p-4 font-mono text-xs text-fg-primary">
								{content || "No content"}
							</pre>
						</div>
						<div className="border-t border-stroke-subtle p-6 pt-4">
							<button
								type="button"
								onClick={onClose}
								className="w-full bg-accent-lime py-2 font-mono text-xs uppercase tracking-wider text-accent-lime-contrast transition-opacity hover:opacity-90 cursor-pointer"
							>
								Close
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
