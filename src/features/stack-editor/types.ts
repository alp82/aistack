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

/** Well-known resource types. The type field accepts any string. */
type KnownResourceType =
	| "prompt"
	| "rule"
	| "skill"
	| "command"
	| "mcp"
	| "hook"
	| "subagent"
	| "config"
	| "custom"
	| "plugin"
	| "dotfile";

/** Accepts known types with autocomplete, plus any arbitrary string. */
type ResourceType = KnownResourceType | (string & {});

type Resource = {
	type: ResourceType;
	name: string;
	description?: string;
	group: string;
	stableKey: string;
	files: FileEntry[];
	source?: "authored" | "cli" | "github";
	scope?: "global" | "project";
	upstream?: {
		repoUrl: string;
		path?: string;
		license?: string;
		stars?: number;
		lastCommitSha?: string;
		mirrorMode: "link" | "preview" | "mirror";
		lastSyncAt?: number;
	};
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
	resources?: Resource[];
	teamSize?: number;
	published: boolean;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	modelSubscriptions: ModelSubscriptionEntry[];
	personalPageUrl?: string;
	stackImageUrl?: string;
};

type StackMetadataUpdates = {
	resources?: Resource[];
};

export type {
	CreatorProfile,
	FileEntry,
	KnownResourceType,
	ModelSubscriptionEntry,
	Resource,
	ResourceType,
	StackEditorInitialValue,
	StackEditorMode,
	StackMetadataUpdates,
	StackResource,
};
