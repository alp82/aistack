import { FileText } from "lucide-react";

const typeLabels: Record<string, string> = {
	prompt: "Prompt",
	rule: "Rule",
	skill: "Skill",
	mcp: "MCP",
	plugin: "Plugin",
	subagent: "Subagent",
};

const instructionTypeColors: Record<string, string> = {
	prompt: "text-blue-400 border-blue-400/30 bg-blue-400/10",
	rule: "text-amber-400 border-amber-400/30 bg-amber-400/10",
	skill: "text-purple-400 border-purple-400/30 bg-purple-400/10",
	mcp: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
	plugin: "text-pink-400 border-pink-400/30 bg-pink-400/10",
	subagent: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
};

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

export function InstructionItem({ instruction, onClick }: InstructionItemProps) {
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

export { typeLabels, instructionTypeColors };
