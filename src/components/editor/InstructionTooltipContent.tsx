import type { InstructionType } from "@/features/stack-editor/types";
import {
	getInstructionTypeColorsSplit,
	getInstructionTypeLabel,
} from "@/lib/instruction-utils";

export function InstructionTooltipContent({
	name,
	instructionType,
	description,
	content,
}: {
	name: string;
	instructionType: InstructionType;
	description?: string;
	content?: string;
}) {
	const colors = getInstructionTypeColorsSplit(instructionType);
	const previewText =
		content
			?.split(/\r?\n/)
			.filter((line: string) => line.trim().length > 0)
			.slice(0, 3)
			.join("\n") || description;

	return (
		<div className="min-w-[280px] border-[3px] border-stroke-strong bg-bg-panel-elevated p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div
				className={`mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${colors.text}`}
			>
				{getInstructionTypeLabel(instructionType)}
			</div>
			<div className="mb-2 font-mono text-sm font-semibold text-fg-primary">
				{name}
			</div>
			{previewText && (
				<div className="whitespace-pre-line text-xs leading-6 text-fg-secondary line-clamp-3">
					{previewText}
				</div>
			)}
			<div className="mt-4 inline-flex items-center border border-stroke-strong bg-bg-panel px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-fg-primary">
				Click to open full instruction
			</div>
		</div>
	);
}
