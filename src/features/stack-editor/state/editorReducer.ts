import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import type { StagedProject } from "@/components/projects/types";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import type {
	ModelSubscriptionEntry,
	PendingAvatar,
	Resource,
	StackEditorInitialValue,
} from "@/features/stack-editor/types";

const sectionOrder = [
	"profile",
	"tools",
	"bundles",
	"description",
	"settings",
] as const;

function extractShortId(compositeSlug: string): string {
	const lastHyphen = compositeSlug.lastIndexOf("-");
	if (lastHyphen === -1) return compositeSlug;
	return compositeSlug.slice(lastHyphen + 1);
}

// Create drafts are scoped by auth identity so a signed-in user's unsaved
// draft (name, avatar, tools, …) never surfaces on the guest editor after
// logout, and guest edits can't clobber the user's draft.
function getDraftKey(slug?: string, creatorId?: string): string {
	if (slug) return `stackDraft-${extractShortId(slug)}`;
	return creatorId
		? `stackDraft-new-user:${creatorId}`
		: "stackDraft-new-guest";
}

type EditorSection = (typeof sectionOrder)[number];

/** Fields shared between EditorState and the persisted GuestStackDraft. */
type ProfileFields = {
	name: string;
	oneLiner: string;
	description: string;
	resources: Resource[];
	modelSubscriptions: ModelSubscriptionEntry[];
	isTeam: boolean;
	teamSize: number;
	toolSubscriptions: ToolSubscriptionEntry[];
	bundleSubscriptions: BundleSubscriptionEntry[];
	projects: StagedProject[];
	accentPreset: string;
	pendingAvatar: PendingAvatar;
};

type EditorState = ProfileFields & {
	saving: boolean;
	error: string;
	activeSection: EditorSection;
	showSignInDialog: boolean;
	restoredFromDraft: boolean;
};

type GuestStackDraft = ProfileFields;

type EditorAction =
	| {
			type: "profile/updated";
			updates: Partial<
				Pick<
					EditorState,
					"name" | "oneLiner" | "isTeam" | "teamSize" | "accentPreset"
				>
			>;
	  }
	| {
			type: "avatar/updated";
			pending: PendingAvatar;
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
			type: "resources/updated";
			resources: Resource[];
	  }
	| {
			type: "projects/updated";
			projects: StagedProject[];
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
	actor: {
		name?: string;
	};
	initialValue?: StackEditorInitialValue;
	mode?: "create" | "edit";
	guestSession?: boolean;
	creatorId?: string;
}): EditorState {
	const { actor, initialValue, mode, creatorId } = args;

	// Load from localStorage using scoped key (per-stack for edit,
	// per-auth-identity for create)
	const draftKey = getDraftKey(initialValue?.slug, creatorId);
	let savedDraft: Partial<GuestStackDraft> | null = null;
	if ((mode === "create" || mode === "edit") && typeof window !== "undefined") {
		let saved = localStorage.getItem(draftKey);
		if (mode === "create") {
			// A signed-in user with no draft of their own adopts the guest draft -
			// this is the guest → sign-in → publish continuation. Move semantics:
			// once adopted, the guest key is cleared so the content doesn't
			// resurface for later guests.
			if (!saved && creatorId) {
				const guestKey = getDraftKey();
				saved = localStorage.getItem(guestKey);
				if (saved) {
					localStorage.setItem(draftKey, saved);
					localStorage.removeItem(guestKey);
				}
			}
			// The pre-scoping shared key can hold another identity's draft - drop it
			// rather than adopt it.
			localStorage.removeItem("stackDraft-new");
		}
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
		const eq = (a: unknown, b: unknown) =>
			JSON.stringify(a) === JSON.stringify(b);
		draftDiffers =
			(savedDraft.oneLiner !== undefined &&
				savedDraft.oneLiner !== (initialValue.oneLiner ?? "")) ||
			(savedDraft.description !== undefined &&
				savedDraft.description !== (initialValue.description ?? "")) ||
			(savedDraft.toolSubscriptions !== undefined &&
				!eq(
					savedDraft.toolSubscriptions,
					initialValue.toolSubscriptions ?? [],
				)) ||
			(savedDraft.bundleSubscriptions !== undefined &&
				!eq(
					savedDraft.bundleSubscriptions,
					initialValue.bundleSubscriptions ?? [],
				)) ||
			(savedDraft.modelSubscriptions !== undefined &&
				!eq(
					savedDraft.modelSubscriptions,
					initialValue.modelSubscriptions ?? [],
				)) ||
			(savedDraft.resources !== undefined &&
				!eq(savedDraft.resources, initialValue.resources ?? []));
	}

	return {
		name: savedDraft?.name ?? initialValue?.name ?? actor.name ?? "My Stack",
		oneLiner: savedDraft?.oneLiner ?? initialValue?.oneLiner ?? "",
		description: savedDraft?.description ?? initialValue?.description ?? "",
		resources: savedDraft?.resources ?? initialValue?.resources ?? [],
		modelSubscriptions:
			savedDraft?.modelSubscriptions ?? initialValue?.modelSubscriptions ?? [],
		isTeam: savedDraft?.isTeam ?? (initialValue?.teamSize ?? 0) > 0,
		teamSize: savedDraft?.teamSize ?? initialValue?.teamSize ?? 2,
		toolSubscriptions:
			savedDraft?.toolSubscriptions ?? initialValue?.toolSubscriptions ?? [],
		bundleSubscriptions:
			savedDraft?.bundleSubscriptions ??
			initialValue?.bundleSubscriptions ??
			[],
		projects: savedDraft?.projects ?? [],
		accentPreset: savedDraft?.accentPreset ?? initialValue?.accentPreset ?? "",
		pendingAvatar: savedDraft?.pendingAvatar ?? { kind: "none" },
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
		case "resources/updated":
			return {
				...state,
				resources: action.resources,
			};
		case "projects/updated":
			return {
				...state,
				projects: action.projects,
			};
		case "avatar/updated":
			return {
				...state,
				pendingAvatar: action.pending,
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
				oneLiner:
					draft.oneLiner !== undefined ? draft.oneLiner : state.oneLiner,
				description:
					draft.description !== undefined
						? draft.description
						: state.description,
				resources:
					draft.resources !== undefined ? draft.resources : state.resources,
				modelSubscriptions:
					draft.modelSubscriptions !== undefined
						? draft.modelSubscriptions
						: state.modelSubscriptions,
				isTeam: draft.isTeam !== undefined ? draft.isTeam : state.isTeam,
				teamSize:
					draft.teamSize !== undefined ? draft.teamSize : state.teamSize,
				toolSubscriptions:
					draft.toolSubscriptions !== undefined
						? draft.toolSubscriptions
						: state.toolSubscriptions,
				bundleSubscriptions:
					draft.bundleSubscriptions !== undefined
						? draft.bundleSubscriptions
						: state.bundleSubscriptions,
				projects:
					draft.projects !== undefined ? draft.projects : state.projects,
				accentPreset:
					draft.accentPreset !== undefined
						? draft.accentPreset
						: state.accentPreset,
				pendingAvatar:
					draft.pendingAvatar !== undefined
						? draft.pendingAvatar
						: state.pendingAvatar,
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
				resources: iv.resources ?? [],
				modelSubscriptions: iv.modelSubscriptions ?? [],
				isTeam: (iv.teamSize ?? 0) > 0,
				teamSize: iv.teamSize ?? 2,
				toolSubscriptions: iv.toolSubscriptions ?? [],
				bundleSubscriptions: iv.bundleSubscriptions ?? [],
				projects: [],
				accentPreset: iv.accentPreset ?? "",
				pendingAvatar: { kind: "none" },
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

export { editorReducer, getDraftKey, getInitialEditorState, sectionOrder };

export type { EditorAction, EditorSection, EditorState, GuestStackDraft };
