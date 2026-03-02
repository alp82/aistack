import { canPublishStack, getSaveValidationError } from "@/features/stack-editor/editor-guards";
import type { StackEditorInitialValue, StackEditorMode } from "@/features/stack-editor/types";
import type { EditorState, GuestStackDraft } from "@/features/stack-editor/state/editorReducer";

function selectCanPublish(state: EditorState): boolean {
	return canPublishStack(state.oneLiner, state.toolSubscriptions.length);
}

function selectSaveValidationError(state: EditorState, publish: boolean): string | null {
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

function selectSavePayload(state: EditorState, published: boolean) {
	return {
		name: state.name.trim(),
		oneLiner: state.oneLiner.trim(),
		description: state.description.trim() || undefined,
		instructions: state.instructions.length > 0 ? state.instructions : undefined,
		teamSize: state.isTeam ? state.teamSize : undefined,
		toolSubscriptions: state.toolSubscriptions.map((tool) => ({
			toolSlug: tool.toolSlug,
			tierId: tool.tierId,
			kind: tool.kind,
			primaryUsageLabel: tool.primaryUsageLabel,
			price: tool.price,
			priceKind: tool.priceKind,
			bundleSlug: tool.bundleSlug,
			notes: tool.notes,
		})),
		bundleSubscriptions: state.bundleSubscriptions.map((bundle) => ({
			bundleSlug: bundle.bundleSlug,
			tierId: bundle.tierId,
			notes: bundle.notes,
		})),
		modelSubscriptions: state.modelSubscriptions.map((model) => ({
			modelSlug: model.modelSlug,
			role: model.role,
		})),
		avatarUrl: state.avatarUrl.trim() || undefined,
		personalPageUrl: state.personalPageUrl.trim() || undefined,
		projectPageUrl: state.projectPageUrl.trim() || undefined,
		published,
	};
}

function selectGuestDraft(state: EditorState): GuestStackDraft {
	return {
		name: state.name,
		oneLiner: state.oneLiner,
		description: state.description,
		instructions: state.instructions,
		modelSubscriptions: state.modelSubscriptions,
		isTeam: state.isTeam,
		teamSize: state.teamSize,
		toolSubscriptions: state.toolSubscriptions,
		bundleSubscriptions: state.bundleSubscriptions,
		xHandle: state.xHandle,
		personalPageUrl: state.personalPageUrl,
		projectPageUrl: state.projectPageUrl,
		avatarUrl: state.avatarUrl,
	};
}

export {
	selectCanPublish,
	selectGuestDraft,
	selectSaveDraftPublishTarget,
	selectSavePayload,
	selectSaveValidationError,
};
