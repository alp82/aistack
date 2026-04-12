import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import type { Id } from "../../../convex/_generated/dataModel";

type StackResource = {
	label: string;
	url: string;
};

type FileEntry = {
	name: string;
	content: string;
	path?: string;
	tags?: string[];
};

/** Well-known instruction types. The type field accepts any string. */
type KnownInstructionType =
	| "prompt"
	| "rule"
	| "skill"
	| "command"
	| "mcp"
	| "hook"
	| "subagent"
	| "config"
	| "custom";

/** Accepts known types with autocomplete, plus any arbitrary string. */
type InstructionType = KnownInstructionType | (string & {});

type InstructionItem = {
	type: InstructionType;
	name: string;
	description?: string;
	files: FileEntry[];
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
	KnownInstructionType,
	ModelSubscriptionEntry,
	StackEditorInitialValue,
	StackEditorMode,
	StackMetadataUpdates,
	StackResource,
};
