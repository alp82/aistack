import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import type { StackResource } from "@/features/stack-editor/types";

type EditorSectionKey =
	| "profile"
	| "tools"
	| "bundles"
	| "description"
	| "settings";
type EditorSectionStatusState = "idle" | "active" | "complete" | "error";

type EditorSectionStatus = {
	state: EditorSectionStatusState;
	message?: string;
};

type EditorSectionStatuses = Record<EditorSectionKey, EditorSectionStatus>;

type EditorStatusInput = {
	oneLiner: string;
	isTeam: boolean;
	teamSize: number;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	description: string;
	stackUrl?: string;
	prompts?: boolean;
	rules?: boolean;
	skills?: boolean;
	mcps?: boolean;
	resources: StackResource[];
};

function isValidHttpUrl(value: string): boolean {
	if (!value.trim()) {
		return false;
	}

	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function getEditorSectionStatuses(
	input: EditorStatusInput,
): EditorSectionStatuses {
	const oneLiner = input.oneLiner.trim();
	const hasValidOneLiner = oneLiner.length > 0;
	const hasValidTeamSize =
		!input.isTeam || (Number.isInteger(input.teamSize) && input.teamSize >= 2);

	const hasInvalidBundle = input.bundleSubscriptions.some(
		(bundle) => !bundle.bundleSlug || !bundle.tierId,
	);

	const hasMetadataSignals =
		Boolean(input.stackUrl?.trim()) ||
		input.prompts !== undefined ||
		input.rules !== undefined ||
		input.skills !== undefined ||
		input.mcps !== undefined ||
		input.resources.length > 0;

	if (!hasValidOneLiner) {
		return {
			profile: { state: "error", message: "One-liner summary is required" },
			tools: {
				state: input.toolSubscriptions.length > 0 ? "complete" : "error",
				message:
					input.toolSubscriptions.length > 0
						? undefined
						: "Add at least one tool before publishing",
			},
			bundles: hasInvalidBundle
				? { state: "error", message: "Select a valid bundle tier" }
				: input.bundleSubscriptions.length > 0
					? { state: "complete" }
					: { state: "idle" },
			description: input.description.trim()
				? { state: "complete" }
				: { state: "idle" },
			settings: getSettingsStatus(input, hasMetadataSignals),
		};
	}

	if (!hasValidTeamSize) {
		return {
			profile: { state: "error", message: "Team size must be at least 2" },
			tools: {
				state: input.toolSubscriptions.length > 0 ? "complete" : "error",
				message:
					input.toolSubscriptions.length > 0
						? undefined
						: "Add at least one tool before publishing",
			},
			bundles: hasInvalidBundle
				? { state: "error", message: "Select a valid bundle tier" }
				: input.bundleSubscriptions.length > 0
					? { state: "complete" }
					: { state: "idle" },
			description: input.description.trim()
				? { state: "complete" }
				: { state: "idle" },
			settings: getSettingsStatus(input, hasMetadataSignals),
		};
	}

	return {
		profile: { state: "complete" },
		tools: {
			state: input.toolSubscriptions.length > 0 ? "complete" : "error",
			message:
				input.toolSubscriptions.length > 0
					? undefined
					: "Add at least one tool before publishing",
		},
		bundles: hasInvalidBundle
			? { state: "error", message: "Select a valid bundle tier" }
			: input.bundleSubscriptions.length > 0
				? { state: "complete" }
				: { state: "idle" },
		description: input.description.trim()
			? { state: "complete" }
			: { state: "idle" },
		settings: getSettingsStatus(input, hasMetadataSignals),
	};
}

function getSettingsStatus(
	input: EditorStatusInput,
	hasMetadataSignals: boolean,
): EditorSectionStatus {
	if (input.stackUrl?.trim() && !isValidHttpUrl(input.stackUrl.trim())) {
		return {
			state: "error",
			message: "Repository URL must be a valid http(s) address",
		};
	}

	const hasInvalidResource = input.resources.some(
		(resource) => !isValidHttpUrl(resource.url),
	);
	if (hasInvalidResource) {
		return {
			state: "error",
			message: "Every resource must use a valid http(s) URL",
		};
	}

	return hasMetadataSignals ? { state: "complete" } : { state: "idle" };
}

export { getEditorSectionStatuses, isValidHttpUrl };
export type {
	EditorSectionKey,
	EditorSectionStatus,
	EditorSectionStatuses,
	EditorStatusInput,
};
