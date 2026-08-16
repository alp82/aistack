import type { PendingAvatar } from "@/features/stack-editor/types";

/**
 * Resolve a pending avatar selection into the storage id the stack mutation
 * persists.
 *
 *  - `dataUrl` (a staged guest avatar): upload it to Convex storage now via the
 *    injected `uploadStagedAvatar`, then return the resulting storage id. The
 *    DB never stores the data URL.
 *  - `storageId` (an already-uploaded avatar): return it unchanged - no upload.
 *  - `none`: the avatar was cleared - return null.
 *
 * Pure aside from the injected upload dependency, so the dataUrl→upload path is
 * unit-testable without a mounted editor or live Convex.
 */
export async function resolveAvatarForSave(
	pending: PendingAvatar,
	deps: { uploadStagedAvatar: (dataUrl: string) => Promise<string> },
): Promise<{ kind: "storageId"; id: string } | null> {
	switch (pending.kind) {
		case "dataUrl": {
			const id = await deps.uploadStagedAvatar(pending.url);
			return { kind: "storageId", id };
		}
		case "storageId":
			return { kind: "storageId", id: pending.id };
		case "none":
			return null;
	}
}
