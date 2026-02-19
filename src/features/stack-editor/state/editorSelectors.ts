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
		oneLiner: state.oneLiner.trim(),
		description: state.description.trim() || undefined,
		stackUrl: state.stackUrl?.trim() || undefined,
		prompts: state.prompts,
		rules: state.rules,
		skills: state.skills,
		mcps: state.mcps,
		resources: state.resources.length > 0 ? state.resources : undefined,
		teamSize: state.isTeam ? state.teamSize : undefined,
		toolSubscriptions: state.toolSubscriptions.map((tool) => ({
			toolId: tool.toolId,
			tierId: tool.tierId,
			kind: tool.kind,
			primaryUsageLabel: tool.primaryUsageLabel,
			price: tool.price,
			priceKind: tool.priceKind,
			bundleSlug: tool.bundleSlug,
			notes: tool.notes,
		})),
		bundleSubscriptions:
			state.bundleSubscriptions.length > 0
				? state.bundleSubscriptions.map((bundle) => ({
					bundleId: bundle.bundleId,
					tierId: bundle.tierId,
					notes: bundle.notes,
				}))
				: undefined,
		published,
	};
}

function selectGuestDraft(state: EditorState): GuestStackDraft {
	return {
		oneLiner: state.oneLiner,
		description: state.description,
		stackUrl: state.stackUrl,
		prompts: state.prompts,
		rules: state.rules,
		skills: state.skills,
		mcps: state.mcps,
		resources: state.resources,
		isTeam: state.isTeam,
		teamSize: state.teamSize,
		toolSubscriptions: state.toolSubscriptions,
		bundleSubscriptions: state.bundleSubscriptions,
		xHandle: state.xHandle,
	};
}

export {
	selectCanPublish,
	selectGuestDraft,
	selectSaveDraftPublishTarget,
	selectSavePayload,
	selectSaveValidationError,
};
