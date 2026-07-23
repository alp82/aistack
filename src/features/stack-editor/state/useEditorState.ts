import { useEffect, useReducer, useRef } from "react";
import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { StagedProject } from "@/components/projects/types";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import {
	editorReducer,
	getDraftKey,
	getInitialEditorState,
} from "@/features/stack-editor/state/editorReducer";
import { selectGuestDraft } from "@/features/stack-editor/state/editorSelectors";
import type {
	ModelSubscriptionEntry,
	PendingAvatar,
	Resource,
	StackEditorInitialValue,
	StackEditorMode,
} from "@/features/stack-editor/types";

type UseEditorStateArgs = {
	mode: StackEditorMode;
	guestSession: boolean;
	actor: { name?: string };
	initialValue?: StackEditorInitialValue;
	/** Auth-scopes the create draft key; undefined for guest sessions. */
	creatorId?: string;
};

export type { UseEditorStateArgs };

function useEditorState({
	mode,
	guestSession,
	actor,
	initialValue,
	creatorId,
}: UseEditorStateArgs) {
	const [state, dispatch] = useReducer(
		editorReducer,
		{
			actor,
			initialValue,
			mode,
			guestSession,
			creatorId,
		},
		getInitialEditorState,
	);

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
		const draftKey = getDraftKey(initialValue?.slug, creatorId);
		localStorage.setItem(draftKey, JSON.stringify(selectGuestDraft(state)));
	}, [state, initialValue?.slug, creatorId]);

	return {
		state,
		setName: (value: string) =>
			dispatch({ type: "profile/updated", updates: { name: value } }),
		setOneLiner: (value: string) =>
			dispatch({ type: "profile/updated", updates: { oneLiner: value } }),
		setIsTeam: (value: boolean) =>
			dispatch({ type: "profile/updated", updates: { isTeam: value } }),
		setTeamSize: (value: number) =>
			dispatch({ type: "profile/updated", updates: { teamSize: value } }),
		setAccentPreset: (value: string) =>
			dispatch({
				type: "profile/updated",
				updates: { accentPreset: value },
			}),
		setAvatar: (pending: PendingAvatar) =>
			dispatch({ type: "avatar/updated", pending }),
		setDescription: (value: string) =>
			dispatch({ type: "description/updated", description: value }),
		setToolSubscriptions: (tools: ToolSubscriptionEntry[]) =>
			dispatch({ type: "tools/updated", tools }),
		setBundleSubscriptions: (bundles: BundleSubscriptionEntry[]) =>
			dispatch({ type: "bundles/updated", bundles }),
		setModelSubscriptions: (modelSubscriptions: ModelSubscriptionEntry[]) =>
			dispatch({ type: "modelSubscriptions/updated", modelSubscriptions }),
		setResources: (resources: Resource[]) =>
			dispatch({ type: "resources/updated", resources }),
		setProjects: (projects: StagedProject[]) =>
			dispatch({ type: "projects/updated", projects }),
		setSaving: (saving: boolean) =>
			dispatch({ type: "ui/saveStateChanged", saving }),
		setError: (error: string) => dispatch({ type: "ui/errorSet", error }),
		setShowSignInDialog: (open: boolean) =>
			dispatch({ type: "ui/signInDialogToggled", open }),
		setActiveSection: (
			section: "profile" | "tools" | "bundles" | "description" | "settings",
		) => dispatch({ type: "navigation/activeSectionChanged", section }),
		revertDraft: () => {
			if (initialValue) {
				dispatch({ type: "draft/reverted", initialValue });
			}
		},
		dismissDraft: () => dispatch({ type: "draft/dismissed" }),
		disableDraftSaving: () => {
			draftSavingDisabled.current = true;
		},
	};
}

export { useEditorState };
