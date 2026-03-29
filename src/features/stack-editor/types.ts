import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import type { Id } from "../../../convex/_generated/dataModel";

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

type FileEntry = {
	name: string;
	content: string;
	path?: string;
	tags?: string[];
};

type InstructionType =
	| "prompt"
	| "rule"
	| "skill"
	| "mcp"
	| "plugin"
	| "subagent";

type InstructionItem = {
	type: InstructionType;
	name: string;
	description?: string;
	content?: string;
	url?: string;
	trigger?: string;
	files?: Array<{ name: string; content: string }>;
	path?: string;
};

type ModelSubscriptionEntry = {
	modelSlug: string;
	modelName: string;
	modelShortId?: string;
	modelProvider: string;
	modelCategory:
		| "language"
		| "coding"
		| "reasoning"
		| "vision"
		| "audio"
		| "image"
		| "video"
		| "embedding"
		| "other";
	modelIconUrl?: string;
	role: "primary" | "secondary" | "specialized";
	description?: string;
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
	FileEntry,
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
