import { useEffect, useReducer } from "react";
import type { InstructionItem, ModelSubscriptionEntry, StackEditorInitialValue, StackEditorMode } from "@/features/stack-editor/types";
import { editorReducer, getInitialEditorState } from "@/features/stack-editor/state/editorReducer";
import { selectGuestDraft } from "@/features/stack-editor/state/editorSelectors";
import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";

type UseEditorStateArgs = {
	mode: StackEditorMode;
	guestSession: boolean;
	actor: { xHandle?: string };
	initialValue?: StackEditorInitialValue;
};

function useEditorState({ mode, guestSession, actor, initialValue }: UseEditorStateArgs) {
	const [state, dispatch] = useReducer(editorReducer, {
		actor,
		initialValue,
	}, getInitialEditorState);

	useEffect(() => {
		if (!(guestSession && mode === "create")) {
			return;
		}

		const saved = localStorage.getItem("guestStack");
		if (!saved) {
			return;
		}

		try {
			dispatch({
				type: "guestDraft/loaded",
				draft: JSON.parse(saved),
			});
		} catch (cause) {
			console.error("Failed to load guest stack from localStorage", cause);
		}
	}, [guestSession, mode]);

	useEffect(() => {
		if (!guestSession) {
			return;
		}
		localStorage.setItem("guestStack", JSON.stringify(selectGuestDraft(state)));
	}, [guestSession, state]);

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
	};
}

export { useEditorState };
