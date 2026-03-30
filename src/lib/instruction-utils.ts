import type { KnownInstructionType } from "@/features/stack-editor/types";

const knownTypeColors: Record<KnownInstructionType, string> = {
	prompt: "text-blue-400 border-blue-400/30 bg-blue-400/10",
	rule: "text-purple-400 border-purple-400/30 bg-purple-400/10",
	skill: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
	mcp: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
	hook: "text-pink-400 border-pink-400/30 bg-pink-400/10",
	subagent: "text-orange-400 border-orange-400/30 bg-orange-400/10",
	custom: "text-stone-400 border-stone-400/30 bg-stone-400/10",
};

const knownTypeColorsSplit: Record<
	KnownInstructionType,
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
	hook: {
		border: "border-pink-400/30",
		bg: "bg-pink-400",
		text: "text-pink-400",
	},
	subagent: {
		border: "border-orange-400/30",
		bg: "bg-orange-400",
		text: "text-orange-400",
	},
	custom: {
		border: "border-stone-400/30",
		bg: "bg-stone-400",
		text: "text-stone-400",
	},
};

const knownTypeLabels: Record<KnownInstructionType, string> = {
	prompt: "Prompt",
	rule: "Rule",
	skill: "Skill",
	mcp: "MCP",
	hook: "Hook",
	subagent: "Subagent",
	custom: "Custom",
};

const defaultColors = knownTypeColors.custom;
const defaultColorsSplit = knownTypeColorsSplit.custom;

function isKnownType(type: string): type is KnownInstructionType {
	return type in knownTypeColors;
}

export function getInstructionTypeColors(type: string): string {
	return isKnownType(type) ? knownTypeColors[type] : defaultColors;
}

export function getInstructionTypeColorsSplit(type: string): {
	border: string;
	bg: string;
	text: string;
} {
	return isKnownType(type) ? knownTypeColorsSplit[type] : defaultColorsSplit;
}

export function getInstructionTypeLabel(type: string): string {
	if (isKnownType(type)) return knownTypeLabels[type];
	return type.charAt(0).toUpperCase() + type.slice(1);
}

/** All known types, useful for combobox suggestions. */
export const knownInstructionTypes: KnownInstructionType[] = [
	"prompt",
	"rule",
	"skill",
	"mcp",
	"hook",
	"subagent",
	"custom",
];

/** Pill colors for inline references and card headers — dimmer than tool/model/bundle pills. */
const knownTypePillColors: Record<
	KnownInstructionType,
	{ border: string; bg: string; hoverBg: string; hoverText: string }
> = {
	prompt: {
		border: "border-blue-400/20",
		bg: "bg-blue-400/5",
		hoverBg: "hover:bg-blue-400/10",
		hoverText: "hover:text-blue-400",
	},
	rule: {
		border: "border-purple-400/20",
		bg: "bg-purple-400/5",
		hoverBg: "hover:bg-purple-400/10",
		hoverText: "hover:text-purple-400",
	},
	skill: {
		border: "border-emerald-400/20",
		bg: "bg-emerald-400/5",
		hoverBg: "hover:bg-emerald-400/10",
		hoverText: "hover:text-emerald-400",
	},
	mcp: {
		border: "border-cyan-400/20",
		bg: "bg-cyan-400/5",
		hoverBg: "hover:bg-cyan-400/10",
		hoverText: "hover:text-cyan-400",
	},
	hook: {
		border: "border-pink-400/20",
		bg: "bg-pink-400/5",
		hoverBg: "hover:bg-pink-400/10",
		hoverText: "hover:text-pink-400",
	},
	subagent: {
		border: "border-orange-400/20",
		bg: "bg-orange-400/5",
		hoverBg: "hover:bg-orange-400/10",
		hoverText: "hover:text-orange-400",
	},
	custom: {
		border: "border-stone-400/20",
		bg: "bg-stone-400/5",
		hoverBg: "hover:bg-stone-400/10",
		hoverText: "hover:text-stone-400",
	},
};

const defaultPillColors = knownTypePillColors.custom;

export function getInstructionTypePillColors(type: string): {
	border: string;
	bg: string;
	hoverBg: string;
	hoverText: string;
} {
	return isKnownType(type) ? knownTypePillColors[type] : defaultPillColors;
}

export { isKnownType };
