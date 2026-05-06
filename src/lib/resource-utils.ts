import type { LucideIcon } from "lucide-react";
import {
	BookOpen,
	Bot,
	Cpu,
	FileCode,
	FileText,
	Puzzle,
	Settings,
	Shield,
	Terminal,
	Wrench,
	Zap,
} from "lucide-react";
import type { KnownResourceType } from "@/features/stack-editor/types";

const knownTypeColors: Record<KnownResourceType, string> = {
	prompt: "text-blue-400 border-blue-400/30 bg-blue-400/10",
	rule: "text-purple-400 border-purple-400/30 bg-purple-400/10",
	skill: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
	command: "text-teal-400 border-teal-400/30 bg-teal-400/10",
	mcp: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
	hook: "text-pink-400 border-pink-400/30 bg-pink-400/10",
	subagent: "text-orange-400 border-orange-400/30 bg-orange-400/10",
	config: "text-amber-400 border-amber-400/30 bg-amber-400/10",
	custom: "text-stone-400 border-stone-400/30 bg-stone-400/10",
	plugin: "text-violet-400 border-violet-400/30 bg-violet-400/10",
	dotfile: "text-slate-400 border-slate-400/30 bg-slate-400/10",
};

const knownTypeColorsSplit: Record<
	KnownResourceType,
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
	command: {
		border: "border-teal-400/30",
		bg: "bg-teal-400",
		text: "text-teal-400",
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
	config: {
		border: "border-amber-400/30",
		bg: "bg-amber-400",
		text: "text-amber-400",
	},
	custom: {
		border: "border-stone-400/30",
		bg: "bg-stone-400",
		text: "text-stone-400",
	},
	plugin: {
		border: "border-violet-400/30",
		bg: "bg-violet-400",
		text: "text-violet-400",
	},
	dotfile: {
		border: "border-slate-400/30",
		bg: "bg-slate-400",
		text: "text-slate-400",
	},
};

const knownTypeLabels: Record<KnownResourceType, string> = {
	prompt: "Prompt",
	rule: "Rule",
	skill: "Skill",
	command: "Command",
	mcp: "MCP",
	hook: "Hook",
	subagent: "Subagent",
	config: "Config",
	custom: "Custom",
	plugin: "Plugin",
	dotfile: "Dotfile",
};

const defaultColors = knownTypeColors.custom;
const defaultColorsSplit = knownTypeColorsSplit.custom;

function isKnownType(type: string): type is KnownResourceType {
	return type in knownTypeColors;
}

export function getResourceTypeColors(type: string): string {
	return isKnownType(type) ? knownTypeColors[type] : defaultColors;
}

export function getResourceTypeColorsSplit(type: string): {
	border: string;
	bg: string;
	text: string;
} {
	return isKnownType(type) ? knownTypeColorsSplit[type] : defaultColorsSplit;
}

export function getResourceTypeLabel(type: string): string {
	if (isKnownType(type)) return knownTypeLabels[type];
	return type.charAt(0).toUpperCase() + type.slice(1);
}

/** All known types, useful for combobox suggestions. */
export const knownResourceTypes: KnownResourceType[] = [
	"prompt",
	"rule",
	"skill",
	"command",
	"mcp",
	"hook",
	"subagent",
	"config",
	"custom",
	"plugin",
	"dotfile",
];

/** Pill colors for inline references and card headers — dimmer than tool/model/bundle pills. */
const knownTypePillColors: Record<
	KnownResourceType,
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
	command: {
		border: "border-teal-400/20",
		bg: "bg-teal-400/5",
		hoverBg: "hover:bg-teal-400/10",
		hoverText: "hover:text-teal-400",
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
	config: {
		border: "border-amber-400/20",
		bg: "bg-amber-400/5",
		hoverBg: "hover:bg-amber-400/10",
		hoverText: "hover:text-amber-400",
	},
	custom: {
		border: "border-stone-400/20",
		bg: "bg-stone-400/5",
		hoverBg: "hover:bg-stone-400/10",
		hoverText: "hover:text-stone-400",
	},
	plugin: {
		border: "border-violet-400/20",
		bg: "bg-violet-400/5",
		hoverBg: "hover:bg-violet-400/10",
		hoverText: "hover:text-violet-400",
	},
	dotfile: {
		border: "border-slate-400/20",
		bg: "bg-slate-400/5",
		hoverBg: "hover:bg-slate-400/10",
		hoverText: "hover:text-slate-400",
	},
};

const defaultPillColors = knownTypePillColors.custom;

export function getResourceTypePillColors(type: string): {
	border: string;
	bg: string;
	hoverBg: string;
	hoverText: string;
} {
	return isKnownType(type) ? knownTypePillColors[type] : defaultPillColors;
}

const knownTypeIcons: Record<KnownResourceType, LucideIcon> = {
	subagent: Bot,
	hook: Zap,
	prompt: BookOpen,
	rule: Shield,
	mcp: Cpu,
	skill: Wrench,
	command: Terminal,
	config: Settings,
	custom: FileText,
	plugin: Puzzle,
	dotfile: FileCode,
};

export function getResourceTypeIcon(type: string): LucideIcon {
	return isKnownType(type) ? knownTypeIcons[type] : knownTypeIcons.custom;
}

const knownTypeIconBgClasses: Record<KnownResourceType, string> = {
	prompt: "bg-blue-400/15",
	rule: "bg-purple-400/15",
	skill: "bg-emerald-400/15",
	command: "bg-teal-400/15",
	mcp: "bg-cyan-400/15",
	hook: "bg-pink-400/15",
	subagent: "bg-orange-400/15",
	config: "bg-amber-400/15",
	custom: "bg-stone-400/15",
	plugin: "bg-violet-400/15",
	dotfile: "bg-slate-400/15",
};

export function getResourceTypeIconBgClass(type: string): string {
	return isKnownType(type)
		? knownTypeIconBgClasses[type]
		: knownTypeIconBgClasses.custom;
}

const groupLabels: Record<string, string> = {
	"claude-code": "Claude Code",
	cursor: "Cursor",
	windsurf: "Windsurf",
	cline: "Cline",
	copilot: "Copilot",
	aider: "Aider",
	continue: "Continue",
	"claude-desktop": "Claude Desktop",
	generic: "Other",
};

export function getGroupLabel(group: string | undefined): string {
	if (!group) return groupLabels.generic;
	return groupLabels[group] ?? group;
}

export const MANUAL_INSTRUCTION_GROUP = "manual";

export function buildManualStableKey(type: string, name: string): string {
	return `${MANUAL_INSTRUCTION_GROUP}:${type}:${name}`;
}

export { isKnownType };

import type { Id } from "../../convex/_generated/dataModel";

export type ResourceLocationKind = "stack" | "project";

export type ResourceLocation =
	| { kind: "stack"; id: Id<"stacks"> }
	| { kind: "project"; id: Id<"projects"> };

export function kindToLocation(
	source: ResourceLocationKind,
	sourceId: string,
): ResourceLocation {
	return source === "stack"
		? { kind: "stack", id: sourceId as Id<"stacks"> }
		: { kind: "project", id: sourceId as Id<"projects"> };
}
