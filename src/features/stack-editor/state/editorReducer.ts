import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import type {
	InstructionItem,
	ModelSubscriptionEntry,
	StackEditorInitialValue,
} from "@/features/stack-editor/types";

const sectionOrder = ["profile", "tools", "bundles", "description", "settings"] as const;

function getDraftKey(slug?: string): string {
	return slug ? `stackDraft-${slug}` : "stackDraft-new";
}

type EditorSection = (typeof sectionOrder)[number];

type EditorState = {
	name: string;
	oneLiner: string;
	description: string;
	instructions: InstructionItem[];
	modelSubscriptions: ModelSubscriptionEntry[];
	isTeam: boolean;
	teamSize: number;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	xHandle: string;
	personalPageUrl: string;
	projectPageUrl: string;
	avatarUrl: string;
	saving: boolean;
	error: string;
	activeSection: EditorSection;
	showSignInDialog: boolean;
	restoredFromDraft: boolean;
};

type GuestStackDraft = {
	name: string;
	oneLiner: string;
	description: string;
	instructions: InstructionItem[];
	modelSubscriptions: ModelSubscriptionEntry[];
	isTeam: boolean;
	teamSize: number;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	xHandle: string;
	personalPageUrl: string;
	projectPageUrl: string;
	avatarUrl: string;
};

type EditorAction =
	| {
			type: "profile/updated";
			updates: Partial<
				Pick<EditorState, "name" | "oneLiner" | "xHandle" | "isTeam" | "teamSize" | "personalPageUrl" | "projectPageUrl" | "avatarUrl">
			>;
	  }
	| {
			type: "description/updated";
			description: string;
	  }
	| {
			type: "tools/updated";
			tools: ToolSubscriptionEntry[];
	  }
	| {
			type: "bundles/updated";
			bundles: BundleSubscriptionEntry[];
	  }
	| {
			type: "modelSubscriptions/updated";
			modelSubscriptions: ModelSubscriptionEntry[];
	  }
	| {
			type: "instructions/updated";
			instructions: InstructionItem[];
	  }
	| {
			type: "ui/saveStateChanged";
			saving: boolean;
	  }
	| {
			type: "ui/errorSet";
			error: string;
	  }
	| {
			type: "ui/signInDialogToggled";
			open: boolean;
	  }
	| {
			type: "navigation/activeSectionChanged";
			section: EditorSection;
	  }
	| {
			type: "guestDraft/loaded";
			draft: Partial<GuestStackDraft>;
	  }
	| {
			type: "draft/reverted";
			initialValue: StackEditorInitialValue;
	  }
	| {
			type: "draft/dismissed";
	  };

function getInitialEditorState(args: {
	actor: { xHandle?: string; name?: string; avatarUrl?: string; personalPages?: Array<{ name: string; url: string }>; projectPages?: Array<{ name: string; url: string }> };
	initialValue?: StackEditorInitialValue;
	mode?: "create" | "edit";
	guestSession?: boolean;
}): EditorState {
	const { actor, initialValue, mode } = args;

	// Extract first personal page URL (for X/portfolio)
	const personalPageUrl = actor.personalPages?.find(p => p.name !== "X")?.url ?? "";
	// Extract first project page URL
	const projectPageUrl = actor.projectPages?.[0]?.url ?? "";

	// Load from localStorage using scoped key (per-stack for edit, shared for create)
	const draftKey = getDraftKey(initialValue?.slug);
	let savedDraft: Partial<GuestStackDraft> | null = null;
	if ((mode === "create" || mode === "edit") && typeof window !== "undefined") {
		const saved = localStorage.getItem(draftKey);
		if (saved) {
			try {
				savedDraft = JSON.parse(saved);
			} catch (error) {
				console.error("Failed to load stack draft from localStorage", error);
			}
		}
	}

	// Check if the saved draft actually differs from the initial DB value
	let draftDiffers = false;
	if (savedDraft !== null && mode === "edit" && initialValue !== undefined) {
		const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
		draftDiffers =
			(savedDraft.oneLiner !== undefined && savedDraft.oneLiner !== (initialValue.oneLiner ?? "")) ||
			(savedDraft.description !== undefined && savedDraft.description !== (initialValue.description ?? "")) ||
			(savedDraft.toolSubscriptions !== undefined && !eq(savedDraft.toolSubscriptions, initialValue.toolSubscriptions ?? [])) ||
			(savedDraft.bundleSubscriptions !== undefined && !eq(savedDraft.bundleSubscriptions, initialValue.bundleSubscriptions ?? [])) ||
			(savedDraft.modelSubscriptions !== undefined && !eq(savedDraft.modelSubscriptions, initialValue.modelSubscriptions ?? [])) ||
			(savedDraft.instructions !== undefined && !eq(savedDraft.instructions, initialValue.instructions ?? []));
	}

	return {
		name: savedDraft?.name ?? initialValue?.name ?? `${actor.name ?? "My"}'s Stack`,
		oneLiner: savedDraft?.oneLiner ?? initialValue?.oneLiner ?? "",
		description: savedDraft?.description ?? initialValue?.description ?? "",
		instructions: savedDraft?.instructions ?? initialValue?.instructions ?? [],
		modelSubscriptions: savedDraft?.modelSubscriptions ?? initialValue?.modelSubscriptions ?? [],
		isTeam: savedDraft?.isTeam ?? (initialValue?.teamSize ?? 0) > 0,
		teamSize: savedDraft?.teamSize ?? initialValue?.teamSize ?? 2,
		toolSubscriptions: savedDraft?.toolSubscriptions ?? initialValue?.toolSubscriptions ?? [],
		bundleSubscriptions: savedDraft?.bundleSubscriptions ?? initialValue?.bundleSubscriptions ?? [],
		xHandle: savedDraft?.xHandle ?? actor.xHandle ?? "",
		personalPageUrl: savedDraft?.personalPageUrl ?? initialValue?.personalPageUrl ?? personalPageUrl,
		projectPageUrl: savedDraft?.projectPageUrl ?? initialValue?.projectPageUrl ?? projectPageUrl,
		avatarUrl: savedDraft?.avatarUrl ?? initialValue?.avatarUrl ?? actor.avatarUrl ?? "",
		saving: false,
		error: "",
		activeSection: "profile",
		showSignInDialog: false,
		restoredFromDraft: draftDiffers,
	};
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
	switch (action.type) {
		case "profile/updated":
			return {
				...state,
				...action.updates,
			};
		case "description/updated":
			return {
				...state,
				description: action.description,
			};
		case "tools/updated":
			return {
				...state,
				toolSubscriptions: action.tools,
			};
		case "bundles/updated":
			return {
				...state,
				bundleSubscriptions: action.bundles,
			};
		case "modelSubscriptions/updated":
			return {
				...state,
				modelSubscriptions: action.modelSubscriptions,
			};
		case "instructions/updated":
			return {
				...state,
				instructions: action.instructions,
			};
		case "ui/saveStateChanged":
			return {
				...state,
				saving: action.saving,
			};
		case "ui/errorSet":
			return {
				...state,
				error: action.error,
			};
		case "ui/signInDialogToggled":
			return {
				...state,
				showSignInDialog: action.open,
			};
		case "navigation/activeSectionChanged":
			return {
				...state,
				activeSection: action.section,
			};
		case "guestDraft/loaded": {
			const draft = action.draft;
			return {
				...state,
				name: draft.name !== undefined ? draft.name : state.name,
				oneLiner: draft.oneLiner !== undefined ? draft.oneLiner : state.oneLiner,
				description: draft.description !== undefined ? draft.description : state.description,
				instructions: draft.instructions !== undefined ? draft.instructions : state.instructions,
				modelSubscriptions: draft.modelSubscriptions !== undefined ? draft.modelSubscriptions : state.modelSubscriptions,
				isTeam: draft.isTeam !== undefined ? draft.isTeam : state.isTeam,
				teamSize: draft.teamSize !== undefined ? draft.teamSize : state.teamSize,
				toolSubscriptions: draft.toolSubscriptions !== undefined ? draft.toolSubscriptions : state.toolSubscriptions,
				bundleSubscriptions: draft.bundleSubscriptions !== undefined ? draft.bundleSubscriptions : state.bundleSubscriptions,
				xHandle: draft.xHandle !== undefined ? draft.xHandle : state.xHandle,
				personalPageUrl: draft.personalPageUrl !== undefined ? draft.personalPageUrl : state.personalPageUrl,
				projectPageUrl: draft.projectPageUrl !== undefined ? draft.projectPageUrl : state.projectPageUrl,
				avatarUrl: draft.avatarUrl !== undefined ? draft.avatarUrl : state.avatarUrl,
			};
		}
		case "draft/reverted": {
			const iv = action.initialValue;
			localStorage.removeItem(getDraftKey(iv.slug));
			return {
				...state,
				name: iv.name ?? state.name,
				oneLiner: iv.oneLiner ?? "",
				description: iv.description ?? "",
				instructions: iv.instructions ?? [],
				modelSubscriptions: iv.modelSubscriptions ?? [],
				isTeam: (iv.teamSize ?? 0) > 0,
				teamSize: iv.teamSize ?? 2,
				toolSubscriptions: iv.toolSubscriptions ?? [],
				bundleSubscriptions: iv.bundleSubscriptions ?? [],
				personalPageUrl: iv.personalPageUrl ?? "",
				projectPageUrl: iv.projectPageUrl ?? "",
				avatarUrl: iv.avatarUrl ?? "",
				restoredFromDraft: false,
			};
		}
		case "draft/dismissed":
			return {
				...state,
				restoredFromDraft: false,
			};
		default:
			return state;
	}
}

export {
	editorReducer,
	getDraftKey,
	getInitialEditorState,
	sectionOrder,
};

export type {
	EditorAction,
	EditorSection,
	EditorState,
	GuestStackDraft,
};
