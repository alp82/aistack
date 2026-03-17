import { FileText } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { InstructionItem } from "@/features/stack-editor/types";
import type { InstructionType } from "@/features/stack-editor/types";
import { PickerEntryCard } from "@/components/picker/PickerEntryCard";
import { InstructionDialog } from "@/components/InstructionDialog";
import {
	instructionTypeColors as typeColors,
	instructionTypeLabels as typeLabels,
} from "@/lib/instruction-utils";

export type { InstructionItem, InstructionType };

interface InstructionPickerProps {
	value: InstructionItem[];
	onChange: (instructions: InstructionItem[]) => void;
	onInstructionClick?: (instruction: InstructionItem) => void;
}

export function InstructionPicker({
	value,
	onChange,
	onInstructionClick,
}: InstructionPickerProps) {
	const [showDialog, setShowDialog] = useState(false);
	const [editingInstruction, setEditingInstruction] =
		useState<InstructionItem | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);

	const removeInstruction = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const handleAddNew = () => {
		setEditingInstruction({
			type: "prompt",
			name: "",
			description: "",
			content: "",
		});
		setIsEditMode(true);
		setShowDialog(true);
	};

	const handleEdit = (instruction: InstructionItem) => {
		setEditingInstruction(instruction);
		setIsEditMode(true);
		setShowDialog(true);
	};

	const handleSave = (updates: {
		name: string;
		type: InstructionType;
		description?: string;
		content?: string;
	}) => {
		if (!editingInstruction) return;

		const instruction: InstructionItem = {
			...editingInstruction,
			...updates,
		};

		const existingIndex = value.findIndex(
			(i) =>
				i.name === editingInstruction.name &&
				i.type === editingInstruction.type,
		);

		if (existingIndex >= 0) {
			// Update existing
			const updated = [...value];
			updated[existingIndex] = instruction;
			onChange(updated);
		} else {
			// Add new
			onChange([...value, instruction]);
		}
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
		setEditingInstruction(null);
		setIsEditMode(false);
	};

	return (
		<div className="space-y-2">
			{/* Existing Instructions */}
			{value.length > 0 && (
				<div className="space-y-2">
					{value.map((instruction, index) => (
						<InstructionEntry
							key={`${instruction.type}-${instruction.name}-${index}`}
							instruction={instruction}
							onRemove={() => removeInstruction(index)}
							onEdit={() => handleEdit(instruction)}
							onClick={() => onInstructionClick?.(instruction)}
						/>
					))}
				</div>
			)}

			{/* Add Instruction Button */}
			<button
				type="button"
				onClick={handleAddNew}
				className="w-full border-2 border-dashed border-stroke-subtle bg-bg-panel py-3 font-mono text-xs uppercase tracking-wider text-fg-muted transition-all hover:border-accent-lime hover:text-accent-lime"
			>
				+ Add Instruction
			</button>

			{/* Instruction Dialog */}
			{editingInstruction &&
				createPortal(
					<InstructionDialog
						isOpen={showDialog}
						onClose={handleCloseDialog}
						name={editingInstruction.name}
						type={editingInstruction.type}
						content={editingInstruction.content}
						editMode={isEditMode}
						onSave={handleSave}
					/>,
					document.body,
				)}
		</div>
	);
}

interface InstructionEntryProps {
	instruction: InstructionItem;
	onRemove: () => void;
	onEdit: () => void;
	onClick?: () => void;
}

function InstructionEntry({
	instruction,
	onRemove,
	onEdit,
	onClick,
}: InstructionEntryProps) {
	const icon = (
		<div
			className={cn(
				"flex size-8 shrink-0 items-center justify-center border transition-colors",
				typeColors[instruction.type],
				"group-hover:border-accent-lime group-hover:bg-accent-lime/20",
			)}
		>
			<FileText className="size-4" />
		</div>
	);

	return (
		<PickerEntryCard
			name={instruction.name}
			subtitle={typeLabels[instruction.type]}
			icon={icon}
			onInsertClick={onClick}
			onRemove={onRemove}
			onEditClick={onEdit}
		/>
	);
}
