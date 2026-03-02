import { describe, expect, it } from "vitest";
import { editorReducer, getInitialEditorState } from "@/features/stack-editor/state/editorReducer";
import {
	selectCanPublish,
	selectGuestDraft,
	selectSaveDraftPublishTarget,
	selectSavePayload,
	selectSaveValidationError,
} from "@/features/stack-editor/state/editorSelectors";

describe("editor reducer", () => {
	it("updates profile and section state with typed transitions", () => {
		const baseState = getInitialEditorState({ actor: { xHandle: "existing" } });

		const profileState = editorReducer(baseState, {
			type: "profile/updated",
			updates: {
				oneLiner: "A practical stack",
				xHandle: "new-handle",
				isTeam: true,
				teamSize: 4,
			},
		});

		expect(profileState.oneLiner).toBe("A practical stack");
		expect(profileState.xHandle).toBe("new-handle");
		expect(profileState.isTeam).toBe(true);
		expect(profileState.teamSize).toBe(4);

		const sectionState = editorReducer(profileState, {
			type: "navigation/activeSectionChanged",
			section: "tools",
		});

		expect(sectionState.activeSection).toBe("tools");
	});

	it("computes publish and save selectors from state", () => {
		const createState = editorReducer(getInitialEditorState({ actor: { xHandle: "" } }), {
			type: "profile/updated",
			updates: { oneLiner: "Builder stack" },
		});

		expect(selectCanPublish(createState)).toBe(false);
		expect(selectSaveValidationError(createState, true)).toBe("Add at least one tool before publishing");
		expect(selectSaveDraftPublishTarget(createState, "create", undefined)).toBe(false);

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
					notes: undefined,
				},
			],
		});

		expect(selectCanPublish(withTools)).toBe(true);
	});

	it("builds guest draft payload with parity keys", () => {
		const state = editorReducer(getInitialEditorState({ actor: { xHandle: "" } }), {
			type: "profile/updated",
			updates: { oneLiner: "Draft", xHandle: "alp", isTeam: true, teamSize: 3 },
		});

		const draft = selectGuestDraft(state);
		expect(draft.oneLiner).toBe("Draft");
		expect(draft.xHandle).toBe("alp");
		expect(draft.isTeam).toBe(true);
		expect(draft.teamSize).toBe(3);
	});

	it("builds save payload with trimmed fields and optional values", () => {
		const base = getInitialEditorState({ actor: { xHandle: "" } });
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
					notes: "Note",
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
					notes: "Optional",
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
				notes: "Optional",
			},
		]);
		expect(payload.published).toBe(true);
	});

	it("updates ui flags and merges guest draft values", () => {
		const base = getInitialEditorState({ actor: { xHandle: "existing" } });
		const saving = editorReducer(base, { type: "ui/saveStateChanged", saving: true });
		const errored = editorReducer(saving, { type: "ui/errorSet", error: "Failed" });
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
				xHandle: "new-handle",
				isTeam: true,
			},
		});

		expect(merged.description).toBe("Loaded");
		expect(merged.xHandle).toBe("new-handle");
		expect(merged.isTeam).toBe(true);
		expect(merged.oneLiner).toBe(withDialog.oneLiner);
	});
});
