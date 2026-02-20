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

type CreatorProfile = {
	_id: Id<"creators">;
	name: string;
	slug: string;
	xHandle?: string;
};

type StackEditorMode = "create" | "edit";

type StackEditorInitialValue = {
	_id: Id<"stacks">;
	slug: string;
	oneLiner: string;
	description?: string;
	stackUrl?: string;
	prompts?: PromptItem[];
	rules?: RuleItem[];
	skills?: SkillItem[];
	mcps?: McpItem[];
	models?: ModelItem[];
	resources?: StackResource[];
	teamSize?: number;
	published: boolean;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
};

type StackMetadataUpdates = {
	stackUrl?: string;
	prompts?: PromptItem[];
	rules?: RuleItem[];
	skills?: SkillItem[];
	mcps?: McpItem[];
	models?: ModelItem[];
	resources?: StackResource[];
};

export type {
	CreatorProfile,
	McpItem,
	ModelItem,
	PromptItem,
	RuleItem,
	SkillItem,
	StackEditorInitialValue,
	StackEditorMode,
	StackMetadataUpdates,
	StackResource,
};
