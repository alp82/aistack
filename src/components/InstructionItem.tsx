import { FileText } from "lucide-react";
import {
	getInstructionTypeColors,
	getInstructionTypeLabel,
} from "@/lib/instruction-utils";
import type { InstructionItem as InstructionItemType } from "@/features/stack-editor/types";

interface InstructionItemProps {
	instruction: InstructionItemType;
	onClick?: () => void;
}

export function InstructionItem({
	instruction,
	onClick,
}: InstructionItemProps) {
	return (
		<button
			type="button"
			className="w-full text-left border border-stroke-subtle p-3 hover:border-stroke-strong transition-colors cursor-pointer"
			onClick={onClick}
		>
			<div className="flex items-center gap-3">
				<div
					className={`flex size-8 shrink-0 items-center justify-center border ${getInstructionTypeColors(instruction.type)}`}
				>
					<FileText className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate font-mono text-sm font-semibold text-fg-primary">
						{instruction.name}
					</p>
					{instruction.description && (
						<p className="truncate text-xs text-fg-muted mt-0.5">
							{instruction.description}
						</p>
					)}
					<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
						{getInstructionTypeLabel(instruction.type)}
					</p>
				</div>
				{instruction.files.length > 0 && (
					<span className="shrink-0 border border-accent-lime/30 bg-accent-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-lime">
						Show
					</span>
				)}
			</div>
		</button>
	);
}
