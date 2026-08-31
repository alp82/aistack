import {
	canSaveStack,
	getSaveValidationError,
} from "@/features/stack-editor/editor-guards";
import type {
	EditorState,
	GuestStackDraft,
} from "@/features/stack-editor/state/editorReducer";

function selectCanSave(state: EditorState): boolean {
	return canSaveStack(state.oneLiner);
}

function selectSaveValidationError(state: EditorState): string | null {
	return getSaveValidationError({
		oneLiner: state.oneLiner,
	});
}

function normalizeResources(
	resources: EditorState["resources"],
): EditorState["resources"] {
	return resources.map((resource) => ({
		type: resource.type,
		name: resource.name,
		description: resource.description,
		group: resource.group,
		stableKey: resource.stableKey,
		files: resource.files,
	}));
}

function normalizeProjects(
	projects: EditorState["projects"],
): EditorState["projects"] {
	return projects.map((project) => ({
		name: project.name,
		description: project.description,
		url: project.url,
		tags: project.tags,
	}));
}

function selectSavePayload(state: EditorState) {
	const resources =
		state.resources.length > 0
			? normalizeResources(state.resources)
			: undefined;
	const projects =
		state.projects.length > 0 ? normalizeProjects(state.projects) : undefined;
	return {
		name: state.name.trim(),
		oneLiner: state.oneLiner.trim(),
		description: state.description.trim() || undefined,
		resources,
		projects,
		teamSize: state.isTeam ? state.teamSize : undefined,
		toolSubscriptions: state.toolSubscriptions.map((tool) => ({
			toolSlug: tool.toolSlug,
			tierId: tool.tierId,
			kind: tool.kind,
			primaryUsageLabel: tool.primaryUsageLabel,
			price: tool.price,
			priceKind: tool.priceKind,
			bundleSlug: tool.bundleSlug,
			description: tool.description,
		})),
		bundleSubscriptions: state.bundleSubscriptions.map((bundle) => ({
			bundleSlug: bundle.bundleSlug,
			tierId: bundle.tierId,
			description: bundle.description,
		})),
		modelSubscriptions: state.modelSubscriptions.map((model) => ({
			modelSlug: model.modelSlug,
			description: model.description,
		})),
		accentPreset: state.accentPreset || undefined,
	};
}

function selectGuestDraft(state: EditorState): GuestStackDraft {
	return {
		name: state.name,
		oneLiner: state.oneLiner,
		description: state.description,
		resources: state.resources,
		modelSubscriptions: state.modelSubscriptions,
		isTeam: state.isTeam,
		teamSize: state.teamSize,
		toolSubscriptions: state.toolSubscriptions,
		bundleSubscriptions: state.bundleSubscriptions,
		projects: state.projects,
		accentPreset: state.accentPreset,
		pendingAvatar: state.pendingAvatar,
	};
}

export {
	selectCanSave,
	selectGuestDraft,
	selectSavePayload,
	selectSaveValidationError,
};
