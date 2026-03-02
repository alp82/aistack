import { useEffect, useReducer, useRef } from "react";
import type { InstructionItem, ModelSubscriptionEntry, StackEditorInitialValue, StackEditorMode } from "@/features/stack-editor/types";
import { editorReducer, getDraftKey, getInitialEditorState } from "@/features/stack-editor/state/editorReducer";
import { selectGuestDraft } from "@/features/stack-editor/state/editorSelectors";
import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";

type UseEditorStateArgs = {
	mode: StackEditorMode;
	guestSession: boolean;
	actor: { xHandle?: string };
	initialValue?: StackEditorInitialValue;
};

export type { UseEditorStateArgs };

function useEditorState({ mode, guestSession, actor, initialValue }: UseEditorStateArgs) {
	const [state, dispatch] = useReducer(editorReducer, {
		actor,
		initialValue,
		mode,
		guestSession,
	}, getInitialEditorState);
	
	const hasLoadedInitialData = useRef(false);
	const draftSavingDisabled = useRef(false);

	// Mark as loaded after first render
	useEffect(() => {
		hasLoadedInitialData.current = true;
	}, []);

	// Save draft to localStorage on every state change (for both guest and authenticated users)
	// Only save after initial data has been loaded to prevent overwriting
	// Skip if draft saving was disabled (e.g. after a successful save/publish)
	useEffect(() => {
		if (!hasLoadedInitialData.current || draftSavingDisabled.current) {
			return;
		}
		const draftKey = getDraftKey(initialValue?.slug);
		localStorage.setItem(draftKey, JSON.stringify(selectGuestDraft(state)));
	}, [state]);

	return {
		state,
		setName: (value: string) =>
			dispatch({ type: "profile/updated", updates: { name: value } }),
		setOneLiner: (value: string) =>
			dispatch({ type: "profile/updated", updates: { oneLiner: value } }),
		setXHandle: (value: string) =>
			dispatch({ type: "profile/updated", updates: { xHandle: value } }),
		setIsTeam: (value: boolean) =>
			dispatch({ type: "profile/updated", updates: { isTeam: value } }),
		setTeamSize: (value: number) =>
			dispatch({ type: "profile/updated", updates: { teamSize: value } }),
		setPersonalPageUrl: (value: string) =>
			dispatch({ type: "profile/updated", updates: { personalPageUrl: value } }),
		setProjectPageUrl: (value: string) =>
			dispatch({ type: "profile/updated", updates: { projectPageUrl: value } }),
		setAvatarUrl: (value: string) =>
			dispatch({ type: "profile/updated", updates: { avatarUrl: value } }),
		setDescription: (value: string) =>
			dispatch({ type: "description/updated", description: value }),
		setToolSubscriptions: (tools: ToolSubscriptionEntry[]) =>
			dispatch({ type: "tools/updated", tools }),
		setBundleSubscriptions: (bundles: BundleSubscriptionEntry[]) =>
			dispatch({ type: "bundles/updated", bundles }),
		setModelSubscriptions: (modelSubscriptions: ModelSubscriptionEntry[]) =>
			dispatch({ type: "modelSubscriptions/updated", modelSubscriptions }),
		setInstructions: (instructions: InstructionItem[]) =>
			dispatch({ type: "instructions/updated", instructions }),
		setSaving: (saving: boolean) => dispatch({ type: "ui/saveStateChanged", saving }),
		setError: (error: string) => dispatch({ type: "ui/errorSet", error }),
		setShowSignInDialog: (open: boolean) =>
			dispatch({ type: "ui/signInDialogToggled", open }),
		setActiveSection: (section: "profile" | "tools" | "bundles" | "description" | "settings") =>
			dispatch({ type: "navigation/activeSectionChanged", section }),
		revertDraft: () => {
			if (initialValue) {
				dispatch({ type: "draft/reverted", initialValue });
			}
		},
		dismissDraft: () => dispatch({ type: "draft/dismissed" }),
		disableDraftSaving: () => { draftSavingDisabled.current = true; },
	};
}

export { useEditorState };
