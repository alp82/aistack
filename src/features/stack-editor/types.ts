import type { Id } from "../../../convex/_generated/dataModel";
import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";

type StackResource = {
	label: string;
	url: string;
};

type PromptItem = {
	name: string;
	description: string;
	content?: string;
};

type RuleItem = {
	name: string;
	description: string;
};

type SkillItem = {
	name: string;
	description: string;
	trigger?: string;
};

type McpItem = {
	name: string;
	purpose: string;
	url?: string;
};

type ModelItem = {
	name: string;
	role: string;
};

type InstructionType = 'prompt' | 'rule' | 'skill' | 'mcp' | 'plugin' | 'subagent';

type InstructionItem = {
	type: InstructionType;
	name: string;
	description?: string;
	content?: string;
	url?: string;
	trigger?: string;
};

type ModelSubscriptionEntry = {
	modelSlug: string;
	modelName: string;
	modelProvider: string;
	modelCategory: 'language' | 'coding' | 'reasoning' | 'vision' | 'audio' | 'image' | 'video' | 'embedding' | 'other';
	modelIconUrl?: string;
	role: "primary" | "secondary" | "specialized";
};

type CreatorProfile = {
	_id: Id<"creators">;
	name: string;
	slug: string;
	xHandle?: string;
	avatarUrl?: string;
	personalPages?: Array<{ name: string; url: string }>;
	projectPages?: Array<{ name: string; url: string }>;
};

type StackEditorMode = "create" | "edit";

type StackEditorInitialValue = {
	_id: Id<"stacks">;
	name: string;
	slug: string;
	oneLiner: string;
	description?: string;
	instructions?: InstructionItem[];
	teamSize?: number;
	published: boolean;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	modelSubscriptions: ModelSubscriptionEntry[];
	personalPageUrl?: string;
	projectPageUrl?: string;
	stackImageUrl?: string;
};

type StackMetadataUpdates = {
	instructions?: InstructionItem[];
};

export type {
	CreatorProfile,
	InstructionItem,
	InstructionType,
	McpItem,
	ModelItem,
	ModelSubscriptionEntry,
	PromptItem,
	RuleItem,
	SkillItem,
	StackEditorInitialValue,
	StackEditorMode,
	StackMetadataUpdates,
	StackResource,
};
