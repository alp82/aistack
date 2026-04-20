import {
	canPublishStack,
	getSaveValidationError,
} from "@/features/stack-editor/editor-guards";
import type {
	StackEditorInitialValue,
	StackEditorMode,
} from "@/features/stack-editor/types";
import type {
	EditorState,
	GuestStackDraft,
} from "@/features/stack-editor/state/editorReducer";

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

function normalizeInstructions(
	instructions: EditorState["instructions"],
): EditorState["instructions"] {
	return instructions.map((instruction) => ({
		type: instruction.type,
		name: instruction.name,
		description: instruction.description,
		group: instruction.group,
		stableKey: instruction.stableKey,
		files: instruction.files,
	}));
}

function selectSavePayload(state: EditorState, published: boolean) {
	const instructions =
		state.instructions.length > 0
			? normalizeInstructions(state.instructions)
			: undefined;
	return {
		name: state.name.trim(),
		oneLiner: state.oneLiner.trim(),
		description: state.description.trim() || undefined,
		instructions,
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
		stackImageUrl: state.stackImageUrl.trim(),
		personalPageUrl: state.personalPageUrl.trim() || undefined,
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
		stackImageUrl: state.stackImageUrl,
	};
}

export {
	selectCanPublish,
	selectGuestDraft,
	selectSaveDraftPublishTarget,
	selectSavePayload,
	selectSaveValidationError,
};
