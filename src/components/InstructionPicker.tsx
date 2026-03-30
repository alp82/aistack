import { FileText } from "lucide-react";
import { DashedAddButton } from "@/components/editor/AddFileButton";
import { cn } from "@/lib/utils";
import type { InstructionItem } from "@/features/stack-editor/types";
import { PickerEntryCard } from "@/components/picker/PickerEntryCard";
import {
	getInstructionTypeColors,
	getInstructionTypeLabel,
} from "@/lib/instruction-utils";

interface InstructionPickerProps {
	value: InstructionItem[];
	onChange: (instructions: InstructionItem[]) => void;
	onInstructionClick?: (instruction: InstructionItem) => void;
	onEditInstruction?: (instruction: InstructionItem) => void;
	onAddInstruction?: () => void;
}

export function InstructionPicker({
	value,
	onChange,
	onInstructionClick,
	onEditInstruction,
	onAddInstruction,
}: InstructionPickerProps) {
	const removeInstruction = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
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
							onEdit={() => onEditInstruction?.(instruction)}
							onClick={() => onInstructionClick?.(instruction)}
						/>
					))}
				</div>
			)}

			{/* Add Instruction Button */}
			<DashedAddButton
				onClick={onAddInstruction ?? (() => {})}
				label="Add Instruction"
				size="md"
			/>
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
				getInstructionTypeColors(instruction.type),
				"group-hover:border-accent-lime group-hover:bg-accent-lime/20",
			)}
		>
			<FileText className="size-4" />
		</div>
	);

	return (
		<PickerEntryCard
			name={instruction.name}
			subtitle={getInstructionTypeLabel(instruction.type)}
			icon={icon}
			onInsertClick={onClick}
			onRemove={onRemove}
			onEditClick={onEdit}
		/>
	);
}
