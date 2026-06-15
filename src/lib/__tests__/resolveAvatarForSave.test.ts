/**
 * Tests for the pure `resolveAvatarForSave` helper (conditional on extraction).
 *
 * Design contract:
 *   resolveAvatarForSave(
 *     pendingAvatar: PendingAvatar,
 *     deps: { uploadStagedAvatar: (dataUrl: string) => Promise<string> }
 *   ): Promise<{ kind: 'storageId'; id: string } | null>
 *
 *   - dataUrl  → calls uploadStagedAvatar → returns { kind: 'storageId', id }
 *   - storageId → no upload call          → returns { kind: 'storageId', id }
 *   - none      → no upload call          → returns null
 *
 * If the implementer does NOT extract this as a standalone export, the import
 * below fails (RED at import time) and each test is skipped with a note
 * directing the implementer to verify the dataUrl→upload path manually
 * in handleSave (TC-HS-01).
 *
 * TC-HS-01 (MANUAL): handleSave with pendingAvatar {kind:'dataUrl'} calls
 * uploadStagedAvatar, gets a storageId, then calls stacks.update with
 * avatarStorageId set to that id. Requires auth + Convex + full editor mount;
 * cannot be unit-tested here.
 */
import { describe, expect, it, vi } from "vitest";

// Will fail at import (RED) until src/lib/resolveAvatarForSave.ts is created
// and exports this function.
import { resolveAvatarForSave } from "@/lib/resolveAvatarForSave";
import type { PendingAvatar } from "@/features/stack-editor/types";

describe("resolveAvatarForSave", () => {
	// -------------------------------------------------------------------------
	// dataUrl → calls uploadStagedAvatar → returns {kind:'storageId', id}
	// -------------------------------------------------------------------------

	it("dataUrl pending: calls uploadStagedAvatar and returns storageId kind", async () => {
		const pending: PendingAvatar = {
			kind: "dataUrl",
			url: "data:image/jpeg;base64,AAAA",
		};
		const uploadStagedAvatar = vi.fn().mockResolvedValue("storage-id-xyz");

		const result = await resolveAvatarForSave(pending, { uploadStagedAvatar });

		expect(uploadStagedAvatar).toHaveBeenCalledWith(
			"data:image/jpeg;base64,AAAA",
		);
		expect(result).toEqual({ kind: "storageId", id: "storage-id-xyz" });
	});

	// -------------------------------------------------------------------------
	// storageId → no upload → returns same id
	// -------------------------------------------------------------------------

	it("storageId pending: does not call uploadStagedAvatar, returns same id", async () => {
		const pending: PendingAvatar = { kind: "storageId", id: "existing-id" };
		const uploadStagedAvatar = vi.fn();

		const result = await resolveAvatarForSave(pending, { uploadStagedAvatar });

		expect(uploadStagedAvatar).not.toHaveBeenCalled();
		expect(result).toEqual({ kind: "storageId", id: "existing-id" });
	});

	// -------------------------------------------------------------------------
	// none → no upload → returns null
	// -------------------------------------------------------------------------

	it("none pending: does not call uploadStagedAvatar, returns null", async () => {
		const pending: PendingAvatar = { kind: "none" };
		const uploadStagedAvatar = vi.fn();

		const result = await resolveAvatarForSave(pending, { uploadStagedAvatar });

		expect(uploadStagedAvatar).not.toHaveBeenCalled();
		expect(result).toBeNull();
	});
});

// -------------------------------------------------------------------------
// TC-HS-01: MANUAL — handleSave dataUrl→upload integration
// -------------------------------------------------------------------------

it.skip("TC-HS-01 (MANUAL): handleSave with pendingAvatar {kind:'dataUrl'} calls uploadStagedAvatar and passes avatarStorageId to stacks.update", () => {
	// Requires: authenticated user, mounted StackEditor, live Convex.
	// Steps:
	//   1. Mount StackEditor in edit mode with a stack that has no avatarStorageId.
	//   2. Simulate avatar selection that produces a data URL (pendingAvatar.kind='dataUrl').
	//   3. Click Save.
	//   4. Assert uploadStagedAvatar was called with the data URL.
	//   5. Assert stacks.update was called with avatarStorageId === returned storageId.
});
