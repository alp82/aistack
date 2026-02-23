import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import type {
	InstructionItem,
	ModelSubscriptionEntry,
	StackEditorInitialValue,
} from "@/features/stack-editor/types";

const sectionOrder = ["profile", "tools", "bundles", "description", "settings"] as const;

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
};

type GuestStackDraft = {
	name: string;
	oneLiner: string;
	description: string;
	instructions: InstructionItem[];
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
	  };

function getInitialEditorState(args: {
	actor: { xHandle?: string; name?: string; avatarUrl?: string; personalPages?: Array<{ name: string; url: string }>; projectPages?: Array<{ name: string; url: string }> };
	initialValue?: StackEditorInitialValue;
}): EditorState {
	const { actor, initialValue } = args;

	// Extract first personal page URL (for X/portfolio)
	const personalPageUrl = actor.personalPages?.find(p => p.name !== "X")?.url ?? "";
	// Extract first project page URL
	const projectPageUrl = actor.projectPages?.[0]?.url ?? "";

	return {
		name: initialValue?.name ?? `${actor.name ?? "My"}'s Stack`,
		oneLiner: initialValue?.oneLiner ?? "",
		description: initialValue?.description ?? "",
		instructions: initialValue?.instructions ?? [],
		modelSubscriptions: [],
		isTeam: (initialValue?.teamSize ?? 0) > 0,
		teamSize: initialValue?.teamSize ?? 2,
		toolSubscriptions: initialValue?.toolSubscriptions ?? [],
		bundleSubscriptions: initialValue?.bundleSubscriptions ?? [],
		xHandle: actor.xHandle ?? "",
		personalPageUrl: initialValue?.personalPageUrl ?? personalPageUrl,
		projectPageUrl: initialValue?.projectPageUrl ?? projectPageUrl,
		avatarUrl: initialValue?.avatarUrl ?? actor.avatarUrl ?? "",
		saving: false,
		error: "",
		activeSection: "profile",
		showSignInDialog: false,
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
				name: draft.name ?? state.name,
				oneLiner: draft.oneLiner ?? state.oneLiner,
				description: draft.description ?? state.description,
				instructions: draft.instructions ?? state.instructions,
				isTeam: draft.isTeam ?? state.isTeam,
				teamSize: draft.teamSize ?? state.teamSize,
				toolSubscriptions: draft.toolSubscriptions ?? state.toolSubscriptions,
				bundleSubscriptions: draft.bundleSubscriptions ?? state.bundleSubscriptions,
				xHandle: draft.xHandle ?? state.xHandle,
				personalPageUrl: draft.personalPageUrl ?? state.personalPageUrl,
				projectPageUrl: draft.projectPageUrl ?? state.projectPageUrl,
				avatarUrl: draft.avatarUrl ?? state.avatarUrl,
			};
		}
		default:
			return state;
	}
}

export {
	editorReducer,
	getInitialEditorState,
	sectionOrder,
};

export type {
	EditorAction,
	EditorSection,
	EditorState,
	GuestStackDraft,
};
