import type { Id } from "../../../convex/_generated/dataModel";
import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";

type StackResource = {
	label: string;
	url: string;
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
	prompts?: boolean;
	rules?: boolean;
	skills?: boolean;
	mcps?: boolean;
	resources?: StackResource[];
	teamSize?: number;
	published: boolean;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
};

type StackMetadataUpdates = {
	stackUrl?: string;
	prompts?: boolean;
	rules?: boolean;
	skills?: boolean;
	mcps?: boolean;
	resources?: StackResource[];
};

export type {
	CreatorProfile,
	StackEditorInitialValue,
	StackEditorMode,
	StackMetadataUpdates,
	StackResource,
};
