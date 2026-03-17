import { FileText } from "lucide-react";
import {
	instructionTypeColors,
	instructionTypeLabels as typeLabels,
} from "@/lib/instruction-utils";

export interface InstructionItemData {
	type: "prompt" | "rule" | "skill" | "mcp" | "plugin" | "subagent";
	name: string;
	description?: string;
	content?: string;
}

interface InstructionItemProps {
	instruction: InstructionItemData;
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
					className={`flex size-8 shrink-0 items-center justify-center border ${instructionTypeColors[instruction.type] ?? "text-fg-muted border-stroke-subtle bg-bg-panel-muted"}`}
				>
					<FileText className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate font-mono text-sm font-semibold text-fg-primary">
						{instruction.name}
					</p>
					<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
						{typeLabels[instruction.type] ?? instruction.type}
					</p>
				</div>
				{instruction.content && (
					<span className="shrink-0 border border-accent-lime/30 bg-accent-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-lime">
						Show
					</span>
				)}
			</div>
		</button>
	);
}
