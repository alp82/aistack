import { beforeEach, describe, expect, it } from "vitest";
import type { StagedProject } from "@/components/projects/types";
import {
	editorReducer,
	getInitialEditorState,
} from "@/features/stack-editor/state/editorReducer";
import {
	selectCanPublish,
	selectGuestDraft,
	selectSaveDraftPublishTarget,
	selectSavePayload,
	selectSaveValidationError,
} from "@/features/stack-editor/state/editorSelectors";

// ---------------------------------------------------------------------------
// Shared helper: minimal staged project object for tests below
// ---------------------------------------------------------------------------
const STAGED_PROJECT = {
	name: "My App",
	description: "A test app",
	url: "https://example.com",
	tags: ["react", "typescript"],
};

describe("editor reducer", () => {
	it("updates profile and section state with typed transitions", () => {
		const baseState = getInitialEditorState({ actor: {} });

		const profileState = editorReducer(baseState, {
			type: "profile/updated",
			updates: {
				oneLiner: "A practical stack",
				isTeam: true,
				teamSize: 4,
			},
		});

		expect(profileState.oneLiner).toBe("A practical stack");
		expect(profileState.isTeam).toBe(true);
		expect(profileState.teamSize).toBe(4);

		const sectionState = editorReducer(profileState, {
			type: "navigation/activeSectionChanged",
			section: "tools",
		});

		expect(sectionState.activeSection).toBe("tools");
	});

	it("computes publish and save selectors from state", () => {
		const createState = editorReducer(getInitialEditorState({ actor: {} }), {
			type: "profile/updated",
			updates: { oneLiner: "Builder stack" },
		});

		expect(selectCanPublish(createState)).toBe(false);
		expect(selectSaveValidationError(createState, true)).toBe(
			"Add at least one tool before publishing",
		);
		expect(selectSaveDraftPublishTarget(createState, "create", undefined)).toBe(
			false,
		);

		const withTools = editorReducer(createState, {
			type: "tools/updated",
			tools: [
				{
					toolSlug: "tool-one",
					toolName: "Tool One",
					toolCategories: ["research"],
					tierId: "tier_1" as never,
					kind: "main",
					primaryUsageLabel: "Core",
					price: {
						pricingType: "fixed",
						fixed: { currency: "USD", amount: 20, period: "month" },
					},
					priceKind: "regular",
					bundleSlug: undefined,
					description: undefined,
				},
			],
		});

		expect(selectCanPublish(withTools)).toBe(true);
	});

	it("builds guest draft payload with parity keys", () => {
		const state = editorReducer(getInitialEditorState({ actor: {} }), {
			type: "profile/updated",
			updates: {
				oneLiner: "Draft",
				isTeam: true,
				teamSize: 3,
			},
		});

		const draft = selectGuestDraft(state);
		expect(draft.oneLiner).toBe("Draft");
		expect(draft.isTeam).toBe(true);
		expect(draft.teamSize).toBe(3);
	});

	it("builds save payload with trimmed fields and optional values", () => {
		const base = getInitialEditorState({ actor: {} });
		const withProfile = editorReducer(base, {
			type: "profile/updated",
			updates: {
				oneLiner: "  Builder stack  ",
				isTeam: false,
				teamSize: 12,
			},
		});
		const withDescription = editorReducer(withProfile, {
			type: "description/updated",
			description: "   ",
		});
		const withTools = editorReducer(withDescription, {
			type: "tools/updated",
			tools: [
				{
					toolSlug: "tool-one",
					toolName: "Tool One",
					toolCategories: ["research"],
					tierId: "tier_1" as never,
					kind: "main",
					primaryUsageLabel: "Core",
					price: {
						pricingType: "fixed",
						fixed: { currency: "USD", amount: 20, period: "month" },
					},
					priceKind: "regular",
					bundleSlug: undefined,
					description: "Note",
				},
			],
		});
		const withBundles = editorReducer(withTools, {
			type: "bundles/updated",
			bundles: [
				{
					bundleSlug: "bundle-one",
					bundleName: "Bundle One",
					tierId: "bundle_tier_1" as never,
					tierName: "Starter",
					description: "Optional",
				},
			],
		});

		const payload = selectSavePayload(withBundles, true);
		expect(payload.oneLiner).toBe("Builder stack");
		expect(payload.description).toBeUndefined();
		expect(payload.teamSize).toBeUndefined();
		expect(payload.toolSubscriptions).toHaveLength(1);
		expect(payload.bundleSubscriptions).toEqual([
			{
				bundleSlug: "bundle-one",
				tierId: "bundle_tier_1",
				description: "Optional",
			},
		]);
		expect(payload.published).toBe(true);
	});

	// -------------------------------------------------------------------------
	// Group B: projects/updated action
	// -------------------------------------------------------------------------

	// TC-B-01
	it("projects/updated with non-empty array stores staged projects", () => {
		const base = getInitialEditorState({ actor: {} });
		const next = editorReducer(base, {
			type: "projects/updated",
			projects: [STAGED_PROJECT],
		});
		expect(next.projects).toHaveLength(1);
		expect(next.projects[0].name).toBe("My App");
	});

	// TC-B-02
	it("projects/updated with [] clears staged projects", () => {
		const base = getInitialEditorState({ actor: {} });
		const withProjects = editorReducer(base, {
			type: "projects/updated",
			projects: [STAGED_PROJECT],
		});
		const cleared = editorReducer(withProjects, {
			type: "projects/updated",
			projects: [],
		});
		expect(cleared.projects).toEqual([]);
	});

	// TC-B-03
	it("projects/updated replaces (not appends) the array", () => {
		const base = getInitialEditorState({ actor: {} });
		const first = editorReducer(base, {
			type: "projects/updated",
			projects: [STAGED_PROJECT, { ...STAGED_PROJECT, name: "Second App" }],
		});
		const replaced = editorReducer(first, {
			type: "projects/updated",
			projects: [{ ...STAGED_PROJECT, name: "Only App" }],
		});
		expect(replaced.projects).toHaveLength(1);
		expect(replaced.projects[0].name).toBe("Only App");
	});

	// -------------------------------------------------------------------------
	// Group C: selectSavePayload projects
	// -------------------------------------------------------------------------

	// TC-C-01
	it("selectSavePayload includes projects when staged; entries have only name/description/url/tags", () => {
		const base = getInitialEditorState({ actor: {} });
		const withProjects = editorReducer(base, {
			type: "projects/updated",
			projects: [
				{
					...STAGED_PROJECT,
					_id: "stale_id",
					published: true,
				} as StagedProject & Record<string, unknown>,
			],
		});
		const payload = selectSavePayload(withProjects, false);
		expect(payload.projects).toHaveLength(1);
		const p = payload.projects![0] as Record<string, unknown>;
		expect(p.name).toBe("My App");
		expect(p.description).toBe("A test app");
		expect(p.url).toBe("https://example.com");
		expect(p.tags).toEqual(["react", "typescript"]);
		// non-schema keys must be stripped
		expect(p._id).toBeUndefined();
		expect(p.published).toBeUndefined();
	});

	// TC-C-02
	it("selectSavePayload omits projects (undefined) when staged array empty", () => {
		const base = getInitialEditorState({ actor: {} });
		const payload = selectSavePayload(base, false);
		expect(payload.projects).toBeUndefined();
	});

	// TC-C-03
	it("selectSavePayload strips non-schema keys (_id) if present in staged entry", () => {
		const base = getInitialEditorState({ actor: {} });
		const withProjects = editorReducer(base, {
			type: "projects/updated",
			projects: [
				{ ...STAGED_PROJECT, _id: "should_be_stripped" } as StagedProject &
					Record<string, unknown>,
			],
		});
		const payload = selectSavePayload(withProjects, false);
		const p = payload.projects![0] as Record<string, unknown>;
		expect(p._id).toBeUndefined();
	});

	// -------------------------------------------------------------------------
	// Group D: selectGuestDraft projects round-trip
	// -------------------------------------------------------------------------

	// TC-D-01
	it("selectGuestDraft includes projects array matching staged length", () => {
		const base = getInitialEditorState({ actor: {} });
		const withProjects = editorReducer(base, {
			type: "projects/updated",
			projects: [STAGED_PROJECT],
		});
		const draft = selectGuestDraft(withProjects);
		expect(draft.projects).toHaveLength(1);
	});

	// TC-D-02
	it("selectGuestDraft includes projects as [] when none staged", () => {
		const base = getInitialEditorState({ actor: {} });
		const draft = selectGuestDraft(base);
		expect(draft.projects).toEqual([]);
	});

	// TC-D-03
	it("guestDraft/loaded restores projects from saved draft", () => {
		const base = getInitialEditorState({ actor: {} });
		const restored = editorReducer(base, {
			type: "guestDraft/loaded",
			draft: { projects: [STAGED_PROJECT] },
		});
		expect(restored.projects).toHaveLength(1);
		expect(restored.projects[0].name).toBe("My App");
	});

	// TC-D-04
	it("guestDraft/loaded with no projects key leaves existing projects unchanged", () => {
		const base = getInitialEditorState({ actor: {} });
		const withProjects = editorReducer(base, {
			type: "projects/updated",
			projects: [STAGED_PROJECT],
		});
		const merged = editorReducer(withProjects, {
			type: "guestDraft/loaded",
			draft: { oneLiner: "changed" },
		});
		expect(merged.projects).toHaveLength(1);
		expect(merged.projects[0].name).toBe("My App");
	});

	it("updates ui flags and merges guest draft values", () => {
		const base = getInitialEditorState({ actor: {} });
		const saving = editorReducer(base, {
			type: "ui/saveStateChanged",
			saving: true,
		});
		const errored = editorReducer(saving, {
			type: "ui/errorSet",
			error: "Failed",
		});
		const withDialog = editorReducer(errored, {
			type: "ui/signInDialogToggled",
			open: true,
		});

		expect(withDialog.saving).toBe(true);
		expect(withDialog.error).toBe("Failed");
		expect(withDialog.showSignInDialog).toBe(true);

		const merged = editorReducer(withDialog, {
			type: "guestDraft/loaded",
			draft: {
				description: "Loaded",
				isTeam: true,
			},
		});

		expect(merged.description).toBe("Loaded");
		expect(merged.isTeam).toBe(true);
		expect(merged.oneLiner).toBe(withDialog.oneLiner);
	});

	// -------------------------------------------------------------------------
	// Group P: pendingAvatar init (guest staging only - stack rows carry no
	// avatar anymore, so initialValue never seeds one)
	// -------------------------------------------------------------------------

	// TC-P-01
	it("TC-P-01: getInitialEditorState restores a staged pendingAvatar from the saved draft", () => {
		localStorage.setItem(
			"stackDraft-new-guest",
			JSON.stringify({
				pendingAvatar: { kind: "dataUrl", url: "data:image/jpeg;base64,CCCC" },
			}),
		);

		const state = getInitialEditorState({
			actor: {},
			mode: "create",
			guestSession: true,
		});
		localStorage.removeItem("stackDraft-new-guest");

		expect((state as Record<string, unknown>).pendingAvatar).toEqual({
			kind: "dataUrl",
			url: "data:image/jpeg;base64,CCCC",
		});
	});

	// TC-P-02
	it("TC-P-02: getInitialEditorState edit-mode → pendingAvatar {kind:'none'}", () => {
		const state = getInitialEditorState({
			actor: {},
			initialValue: {
				_id: "stacks:sid" as never,
				name: "S",
				slug: "s-SLUG",
				oneLiner: "o",
				published: false,
				toolSubscriptions: [],
				bundleSubscriptions: [],
				modelSubscriptions: [],
			},
			mode: "edit",
		});

		expect((state as Record<string, unknown>).pendingAvatar).toEqual({
			kind: "none",
		});
	});

	// TC-P-03
	it("TC-P-03: getInitialEditorState create mode no initialValue → pendingAvatar {kind:'none'}", () => {
		const state = getInitialEditorState({ actor: {}, mode: "create" });

		expect((state as Record<string, unknown>).pendingAvatar).toEqual({
			kind: "none",
		});
	});

	// -------------------------------------------------------------------------
	// Group Q: selectSavePayload never emits identity fields (the staged guest
	// avatar lands on the creator via landStagedAvatar, not the stack payload)
	// -------------------------------------------------------------------------

	// TC-Q-01
	it("TC-Q-01: pendingAvatar none → selectSavePayload has no avatarStorageId/stackImageUrl keys", () => {
		const base = getInitialEditorState({ actor: {} });
		const state = editorReducer(base, {
			type: "avatar/updated",
			pending: { kind: "none" },
		} as never);

		const payload = selectSavePayload(state, false) as Record<string, unknown>;
		expect("avatarStorageId" in payload).toBe(false);
		expect("stackImageUrl" in payload).toBe(false);
	});

	// TC-Q-02
	it("TC-Q-02: pendingAvatar storageId → selectSavePayload still emits no avatarStorageId", () => {
		const base = getInitialEditorState({ actor: {} });
		const state = editorReducer(base, {
			type: "avatar/updated",
			pending: { kind: "storageId", id: "sid_x" },
		} as never);

		const payload = selectSavePayload(state, false) as Record<string, unknown>;
		expect("avatarStorageId" in payload).toBe(false);
	});

	// TC-Q-03
	it("TC-Q-03: pendingAvatar dataUrl → selectSavePayload emits neither the URL nor an id", () => {
		const base = getInitialEditorState({ actor: {} });
		const state = editorReducer(base, {
			type: "avatar/updated",
			pending: { kind: "dataUrl", url: "data:image/jpeg;base64,AAAA" },
		} as never);

		const payload = selectSavePayload(state, false) as Record<string, unknown>;
		expect("avatarStorageId" in payload).toBe(false);
		expect(JSON.stringify(payload)).not.toContain("base64,AAAA");
	});

	// TC-Q-04
	it("TC-Q-04: selectGuestDraft serializes pendingAvatar {kind:'dataUrl',url} round-trip", () => {
		const base = getInitialEditorState({ actor: {} });
		const state = editorReducer(base, {
			type: "avatar/updated",
			pending: { kind: "dataUrl", url: "data:image/jpeg;base64,BBBB" },
		} as never);

		const draft = selectGuestDraft(state) as Record<string, unknown>;
		expect(draft.pendingAvatar).toEqual({
			kind: "dataUrl",
			url: "data:image/jpeg;base64,BBBB",
		});
	});

	// TC-Q-05
	it("TC-Q-05: selectGuestDraft serializes pendingAvatar {kind:'storageId',id}", () => {
		const base = getInitialEditorState({ actor: {} });
		const state = editorReducer(base, {
			type: "avatar/updated",
			pending: { kind: "storageId", id: "sid_y" },
		} as never);

		const draft = selectGuestDraft(state) as Record<string, unknown>;
		expect(draft.pendingAvatar).toEqual({ kind: "storageId", id: "sid_y" });
	});

	// -------------------------------------------------------------------------
	// Group R: BLOCKER-2 regression - profile/updated must not clobber pendingAvatar
	// -------------------------------------------------------------------------

	// TC-R-01
	it("TC-R-01: profile/updated after avatar/updated leaves pendingAvatar unchanged", () => {
		const base = getInitialEditorState({
			actor: {},
			initialValue: {
				_id: "stacks:sid" as never,
				name: "S",
				slug: "s-SLUG",
				oneLiner: "o",
				published: false,
				toolSubscriptions: [],
				bundleSubscriptions: [],
				modelSubscriptions: [],
			},
			mode: "edit",
		});

		const withAvatar = editorReducer(base, {
			type: "avatar/updated",
			pending: { kind: "storageId", id: "sid_orig" },
		} as never);

		const afterProfileUpdate = editorReducer(withAvatar, {
			type: "profile/updated",
			updates: { oneLiner: "new one liner" },
		});

		expect(
			(afterProfileUpdate as Record<string, unknown>).pendingAvatar,
		).toEqual({ kind: "storageId", id: "sid_orig" });
	});

	// TC-R-02
	it("TC-R-02: after profile/updated, selectGuestDraft still round-trips pendingAvatar 'sid_orig'", () => {
		const base = getInitialEditorState({
			actor: {},
			initialValue: {
				_id: "stacks:sid" as never,
				name: "S",
				slug: "s-SLUG",
				oneLiner: "o",
				published: false,
				toolSubscriptions: [],
				bundleSubscriptions: [],
				modelSubscriptions: [],
			},
			mode: "edit",
		});

		const withAvatar = editorReducer(base, {
			type: "avatar/updated",
			pending: { kind: "storageId", id: "sid_orig" },
		} as never);

		const afterProfileUpdate = editorReducer(withAvatar, {
			type: "profile/updated",
			updates: { oneLiner: "new one liner" },
		});

		const draft = selectGuestDraft(afterProfileUpdate) as Record<
			string,
			unknown
		>;
		expect(draft.pendingAvatar).toEqual({ kind: "storageId", id: "sid_orig" });
	});

	// -------------------------------------------------------------------------
	// Group T: accentPreset key - reducer, selectors, round-trip
	// -------------------------------------------------------------------------

	// TC-T-01: profile/updated with accentPreset 'violet' → selectSavePayload emits it
	it("TC-T-01: profile/updated {accentPreset:'violet'} → selectSavePayload.accentPreset === 'violet'", () => {
		const base = getInitialEditorState({ actor: {} });
		const withPreset = editorReducer(base, {
			type: "profile/updated",
			updates: { accentPreset: "violet" },
		});
		const payload = selectSavePayload(withPreset, false) as Record<
			string,
			unknown
		>;
		expect(payload.accentPreset).toBe("violet");
	});

	// TC-T-02: empty-string accentPreset (lime/default selection) → selectSavePayload omits it
	it("TC-T-02: profile/updated {accentPreset:''} → selectSavePayload.accentPreset is undefined", () => {
		const base = getInitialEditorState({ actor: {} });
		const withEmpty = editorReducer(base, {
			type: "profile/updated",
			updates: { accentPreset: "" },
		});
		const payload = selectSavePayload(withEmpty, false) as Record<
			string,
			unknown
		>;
		expect(payload.accentPreset).toBeUndefined();
	});

	// TC-T-03: selectGuestDraft serializes accentPreset
	it("TC-T-03: selectGuestDraft serializes accentPreset 'pink'", () => {
		const base = getInitialEditorState({ actor: {} });
		const withPreset = editorReducer(base, {
			type: "profile/updated",
			updates: { accentPreset: "pink" },
		});
		const draft = selectGuestDraft(withPreset) as Record<string, unknown>;
		expect(draft.accentPreset).toBe("pink");
	});

	// TC-T-04: guestDraft/loaded restores accentPreset round-trip
	it("TC-T-04: guestDraft/loaded {accentPreset:'pink'} restores it", () => {
		const base = getInitialEditorState({ actor: {} });
		const restored = editorReducer(base, {
			type: "guestDraft/loaded",
			draft: { accentPreset: "pink" },
		});
		expect((restored as Record<string, unknown>).accentPreset).toBe("pink");
	});

	// TC-T-05: guestDraft/loaded without accentPreset key leaves existing unchanged
	it("TC-T-05: guestDraft/loaded without accentPreset key leaves it unchanged", () => {
		const base = getInitialEditorState({ actor: {} });
		const withPreset = editorReducer(base, {
			type: "profile/updated",
			updates: { accentPreset: "cyan" },
		});
		const merged = editorReducer(withPreset, {
			type: "guestDraft/loaded",
			draft: { oneLiner: "changed" },
		});
		expect((merged as Record<string, unknown>).accentPreset).toBe("cyan");
	});

	// TC-T-06: draft/reverted with initialValue.accentPreset restores it
	it("TC-T-06: draft/reverted with initialValue.accentPreset 'indigo' restores it", () => {
		const base = getInitialEditorState({
			actor: {},
			initialValue: {
				_id: "stacks:sid" as never,
				name: "S",
				slug: "s-SLUG",
				oneLiner: "o",
				published: false,
				toolSubscriptions: [],
				bundleSubscriptions: [],
				modelSubscriptions: [],
				accentPreset: "indigo",
			},
			mode: "edit",
		});
		const changed = editorReducer(base, {
			type: "profile/updated",
			updates: { accentPreset: "orange" },
		});
		const reverted = editorReducer(changed, {
			type: "draft/reverted",
			initialValue: {
				_id: "stacks:sid" as never,
				name: "S",
				slug: "s-SLUG",
				oneLiner: "o",
				published: false,
				toolSubscriptions: [],
				bundleSubscriptions: [],
				modelSubscriptions: [],
				accentPreset: "indigo",
			},
		});
		expect((reverted as Record<string, unknown>).accentPreset).toBe("indigo");
	});

	// TC-T-07: draft/reverted without initialValue.accentPreset resets to ''
	it("TC-T-07: draft/reverted without initialValue.accentPreset resets to ''", () => {
		const base = getInitialEditorState({ actor: {} });
		const changed = editorReducer(base, {
			type: "profile/updated",
			updates: { accentPreset: "violet" },
		});
		const reverted = editorReducer(changed, {
			type: "draft/reverted",
			initialValue: {
				_id: "stacks:sid" as never,
				name: "S",
				slug: "s-SLUG",
				oneLiner: "o",
				published: false,
				toolSubscriptions: [],
				bundleSubscriptions: [],
				modelSubscriptions: [],
			},
		});
		expect((reverted as Record<string, unknown>).accentPreset).toBe("");
	});

	// TC-T-08: getInitialEditorState with initialValue.accentPreset seeds state
	it("TC-T-08: getInitialEditorState with initialValue.accentPreset 'fuchsia' seeds it", () => {
		const state = getInitialEditorState({
			actor: {},
			initialValue: {
				_id: "stacks:sid" as never,
				name: "S",
				slug: "s-SLUG",
				oneLiner: "o",
				published: false,
				toolSubscriptions: [],
				bundleSubscriptions: [],
				modelSubscriptions: [],
				accentPreset: "fuchsia",
			},
			mode: "edit",
		});
		expect((state as Record<string, unknown>).accentPreset).toBe("fuchsia");
	});

	// TC-T-09: getInitialEditorState without initialValue.accentPreset seeds ''
	it("TC-T-09: getInitialEditorState without initialValue.accentPreset seeds ''", () => {
		const state = getInitialEditorState({
			actor: {},
			initialValue: {
				_id: "stacks:sid" as never,
				name: "S",
				slug: "s-SLUG",
				oneLiner: "o",
				published: false,
				toolSubscriptions: [],
				bundleSubscriptions: [],
				modelSubscriptions: [],
			},
			mode: "edit",
		});
		expect((state as Record<string, unknown>).accentPreset).toBe("");
	});
});

describe("auth-scoped create draft keys", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	const draft = (name: string) => JSON.stringify({ name });

	it("guest create session does not see a signed-in user's draft", () => {
		localStorage.setItem("stackDraft-new-user:creators:abc", draft("Secret"));

		const state = getInitialEditorState({
			actor: {},
			mode: "create",
			guestSession: true,
		});

		expect(state.name).not.toBe("Secret");
		expect(localStorage.getItem("stackDraft-new-user:creators:abc")).toBe(
			draft("Secret"),
		);
	});

	it("signed-in user restores their own scoped draft", () => {
		localStorage.setItem("stackDraft-new-user:creators:abc", draft("Mine"));

		const state = getInitialEditorState({
			actor: {},
			mode: "create",
			creatorId: "creators:abc",
		});

		expect(state.name).toBe("Mine");
	});

	it("signed-in user with no draft adopts the guest draft (move semantics)", () => {
		localStorage.setItem("stackDraft-new-guest", draft("Guest work"));

		const state = getInitialEditorState({
			actor: {},
			mode: "create",
			creatorId: "creators:abc",
		});

		expect(state.name).toBe("Guest work");
		expect(localStorage.getItem("stackDraft-new-guest")).toBeNull();
		expect(localStorage.getItem("stackDraft-new-user:creators:abc")).toBe(
			draft("Guest work"),
		);
	});

	it("signed-in user's own draft wins over a lingering guest draft", () => {
		localStorage.setItem("stackDraft-new-user:creators:abc", draft("Mine"));
		localStorage.setItem("stackDraft-new-guest", draft("Guest work"));

		const state = getInitialEditorState({
			actor: {},
			mode: "create",
			creatorId: "creators:abc",
		});

		expect(state.name).toBe("Mine");
		expect(localStorage.getItem("stackDraft-new-guest")).toBe(
			draft("Guest work"),
		);
	});

	it("legacy shared stackDraft-new key is dropped, never adopted", () => {
		localStorage.setItem("stackDraft-new", draft("Legacy"));

		const guestState = getInitialEditorState({
			actor: {},
			mode: "create",
			guestSession: true,
		});

		expect(guestState.name).not.toBe("Legacy");
		expect(localStorage.getItem("stackDraft-new")).toBeNull();
	});
});
