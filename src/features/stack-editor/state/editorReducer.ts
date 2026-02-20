import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import type {
	McpItem,
	ModelItem,
	PromptItem,
	RuleItem,
	SkillItem,
	StackEditorInitialValue,
	StackMetadataUpdates,
	StackResource,
} from "@/features/stack-editor/types";

const sectionOrder = ["profile", "tools", "bundles", "description", "settings"] as const;

type EditorSection = (typeof sectionOrder)[number];

type EditorState = {
	oneLiner: string;
	description: string;
	stackUrl?: string;
	prompts: PromptItem[];
	rules: RuleItem[];
	skills: SkillItem[];
	mcps: McpItem[];
	models: ModelItem[];
	resources: StackResource[];
	isTeam: boolean;
	teamSize: number;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	xHandle: string;
	saving: boolean;
	error: string;
	activeSection: EditorSection;
	showSignInDialog: boolean;
};

type GuestStackDraft = {
	oneLiner: string;
	description: string;
	stackUrl?: string;
	prompts: PromptItem[];
	rules: RuleItem[];
	skills: SkillItem[];
	mcps: McpItem[];
	models: ModelItem[];
	resources: StackResource[];
	isTeam: boolean;
	teamSize: number;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	xHandle: string;
};

type EditorAction =
	| {
			type: "profile/updated";
			updates: Partial<
				Pick<EditorState, "oneLiner" | "xHandle" | "isTeam" | "teamSize">
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
			type: "metadata/updated";
			updates: StackMetadataUpdates;
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
	actor: { xHandle?: string };
	initialValue?: StackEditorInitialValue;
}): EditorState {
	const { actor, initialValue } = args;

	return {
		oneLiner: initialValue?.oneLiner ?? "",
		description: initialValue?.description ?? "",
		stackUrl: initialValue?.stackUrl,
		prompts: initialValue?.prompts ?? [],
		rules: initialValue?.rules ?? [],
		skills: initialValue?.skills ?? [],
		mcps: initialValue?.mcps ?? [],
		models: initialValue?.models ?? [],
		resources: initialValue?.resources ?? [],
		isTeam: (initialValue?.teamSize ?? 0) > 0,
		teamSize: initialValue?.teamSize ?? 2,
		toolSubscriptions: initialValue?.toolSubscriptions ?? [],
		bundleSubscriptions: initialValue?.bundleSubscriptions ?? [],
		xHandle: actor.xHandle ?? "",
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
		case "metadata/updated":
			return {
				...state,
				...action.updates,
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
				oneLiner: draft.oneLiner ?? state.oneLiner,
				description: draft.description ?? state.description,
				stackUrl: draft.stackUrl ?? state.stackUrl,
				prompts: draft.prompts ?? state.prompts,
				rules: draft.rules ?? state.rules,
				skills: draft.skills ?? state.skills,
				mcps: draft.mcps ?? state.mcps,
				models: draft.models ?? state.models,
				resources: draft.resources ?? state.resources,
				isTeam: draft.isTeam ?? state.isTeam,
				teamSize: draft.teamSize ?? state.teamSize,
				toolSubscriptions: draft.toolSubscriptions ?? state.toolSubscriptions,
				bundleSubscriptions: draft.bundleSubscriptions ?? state.bundleSubscriptions,
				xHandle: draft.xHandle ?? state.xHandle,
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
