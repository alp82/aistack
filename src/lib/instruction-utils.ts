import type { InstructionType } from "@/features/stack-editor/types";

export const instructionTypeColors: Record<InstructionType, string> = {
	prompt: "text-blue-400 border-blue-400/30 bg-blue-400/10",
	rule: "text-purple-400 border-purple-400/30 bg-purple-400/10",
	skill: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
	mcp: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
	plugin: "text-pink-400 border-pink-400/30 bg-pink-400/10",
	subagent: "text-orange-400 border-orange-400/30 bg-orange-400/10",
};

export const instructionTypeColorsSplit: Record<
	InstructionType,
	{ border: string; bg: string; text: string }
> = {
	prompt: {
		border: "border-blue-400/30",
		bg: "bg-blue-400",
		text: "text-blue-400",
	},
	rule: {
		border: "border-purple-400/30",
		bg: "bg-purple-400",
		text: "text-purple-400",
	},
	skill: {
		border: "border-emerald-400/30",
		bg: "bg-emerald-400",
		text: "text-emerald-400",
	},
	mcp: {
		border: "border-cyan-400/30",
		bg: "bg-cyan-400",
		text: "text-cyan-400",
	},
	plugin: {
		border: "border-pink-400/30",
		bg: "bg-pink-400",
		text: "text-pink-400",
	},
	subagent: {
		border: "border-orange-400/30",
		bg: "bg-orange-400",
		text: "text-orange-400",
	},
};

export const instructionTypeLabels: Record<InstructionType, string> = {
	prompt: "Prompt",
	rule: "Rule",
	skill: "Skill",
	mcp: "MCP",
	plugin: "Plugin",
	subagent: "Subagent",
};
