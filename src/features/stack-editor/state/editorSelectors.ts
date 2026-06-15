import type { Id } from "../../../../convex/_generated/dataModel";
import {
	canPublishStack,
	getSaveValidationError,
} from "@/features/stack-editor/editor-guards";
import type {
	EditorState,
	GuestStackDraft,
} from "@/features/stack-editor/state/editorReducer";
import type {
	StackEditorInitialValue,
	StackEditorMode,
} from "@/features/stack-editor/types";

function selectCanPublish(state: EditorState): boolean {
	return canPublishStack(state.oneLiner, state.toolSubscriptions.length);
}

function selectSaveValidationError(
	state: EditorState,
	publish: boolean,
): string | null {
	return getSaveValidationError({
		oneLiner: state.oneLiner,
		publish,
		toolCount: state.toolSubscriptions.length,
	});
}

function selectSaveDraftPublishTarget(
	state: EditorState,
	mode: StackEditorMode,
	initialValue?: StackEditorInitialValue,
): boolean {
	void state;
	if (mode === "edit") {
		return initialValue?.published ?? false;
	}
	return false;
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

function selectSavePayload(state: EditorState, published: boolean) {
	const resources =
		state.resources.length > 0
			? normalizeResources(state.resources)
			: undefined;
	const projects =
		state.projects.length > 0 ? normalizeProjects(state.projects) : undefined;
	// dataUrl avatars are uploaded to a storage id in handleSave before the
	// mutation runs — the selector emits undefined for dataUrl (to be filled
	// in by handleSave after the upload), null for none (clear), or the id.
	const avatarStorageId: Id<"_storage"> | null | undefined =
		state.pendingAvatar.kind === "none"
			? null
			: state.pendingAvatar.kind === "storageId"
				? (state.pendingAvatar.id as Id<"_storage">)
				: undefined;
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
			role: model.role,
			description: model.description,
		})),
		avatarStorageId,
		personalPageUrl: state.personalPageUrl.trim() || undefined,
		published,
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
		xHandle: state.xHandle,
		personalPageUrl: state.personalPageUrl,
		pendingAvatar: state.pendingAvatar,
	};
}

export {
	selectCanPublish,
	selectGuestDraft,
	selectSaveDraftPublishTarget,
	selectSavePayload,
	selectSaveValidationError,
};
