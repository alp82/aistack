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
	| "plugin";

/** Accepts known types with autocomplete, plus any arbitrary string. */
type ResourceType = KnownResourceType | (string & {});

type ResourceOwner =
	| { kind: "creator"; id: Id<"creators"> }
	| { kind: "github"; handle: string }
	| { kind: "package"; registry: string; id: string };

type ResourcePackage = {
	registry: "npm" | "pypi" | "oci" | "url";
	id: string;
	version?: string;
	transport?: "stdio" | "http" | "sse";
};

type Resource = {
	type: ResourceType;
	name: string;
	description?: string;
	group: string;
	stableKey: string;
	files?: FileEntry[];
	storage?: "hosted" | "linked";
	owner?: ResourceOwner;
	addedBy?: string;
	upstream?: {
		repoUrl: string;
		path?: string;
		license?: string;
		stars?: number;
		lastCommitSha?: string;
		lastSyncAt?: number;
	};
	pkg?: ResourcePackage;
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

type PendingAvatar =
	| { kind: "storageId"; id: Id<"_storage"> }
	| { kind: "dataUrl"; url: string }
	| { kind: "none" };

type StackEditorInitialValue = {
	_id: Id<"stacks">;
	name: string;
	slug: string;
	oneLiner: string;
	description?: string;
	resources?: Resource[];
	teamSize?: number;
	/** Absent reads as opted IN - the field only ever records a refusal (#33). */
	publishCost?: boolean;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	modelSubscriptions: ModelSubscriptionEntry[];
	accentPreset?: string;
};

type StackMetadataUpdates = {
	resources?: Resource[];
};

export type {
	CreatorProfile,
	FileEntry,
	KnownResourceType,
	ModelSubscriptionEntry,
	PendingAvatar,
	Resource,
	ResourceType,
	StackEditorInitialValue,
	StackEditorMode,
	StackMetadataUpdates,
	StackResource,
};
