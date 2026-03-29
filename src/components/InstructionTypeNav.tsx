import type { InstructionType } from "@/features/stack-editor/types";
import {
	instructionTypeColorsSplit as typeColors,
	instructionTypeLabels as typeLabels,
} from "@/lib/instruction-utils";

interface InstructionTypeNavProps {
	activeType: InstructionType;
	onTypeChange: (type: InstructionType) => void;
}

export function InstructionTypeNav({
	activeType,
	onTypeChange,
}: InstructionTypeNavProps) {
	return (
		<div className="flex gap-2">
			{(Object.entries(typeLabels) as [InstructionType, string][]).map(
				([value, label]) => {
					const tabColors = typeColors[value] || typeColors.prompt;
					const isActive = activeType === value;
					return (
						<button
							key={value}
							type="button"
							onClick={() => onTypeChange(value)}
							className={`flex-1 border-2 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
								isActive
									? `${tabColors.border} ${tabColors.bg} text-bg-canvas`
									: "border-stroke-subtle bg-bg-panel text-fg-muted hover:border-fg-muted hover:text-fg-primary"
							}`}
						>
							{label}
						</button>
					);
				},
			)}
		</div>
	);
}
