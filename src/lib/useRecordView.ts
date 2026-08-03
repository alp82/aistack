// The client half of view counting (#78, map #76).

import { useEffect, useRef } from "react";
import { recordView, type ViewTargetKind } from "../server/record-view";
import { sessionReferrerBucket } from "./referrer";

/**
 * Count one view of `targetId` when this component mounts.
 *
 * A MOUNT EFFECT, deliberately, and not a route loader: `defaultPreload:
 * "viewport"` runs loaders for cards merely scrolled into view, and a preloaded
 * route that is then clicked does not re-run its loader. Mount is the only
 * event that means a person is looking at the page.
 *
 * Pass `null` while the target id is still loading — the effect waits for it.
 * Fires ONCE per target: React remounts the tree on refocus-driven auth
 * transitions, and a remount is not a second visit.
 */
export function useRecordView(
	targetKind: ViewTargetKind,
	targetId: string | null | undefined,
): void {
	const sent = useRef<string | null>(null);

	useEffect(() => {
		if (!targetId) return;
		const key = `${targetKind}:${targetId}`;
		if (sent.current === key) return;
		sent.current = key;

		// Fire and forget. The server function never rejects, and a view that
		// fails to count must not reach the reader.
		void recordView({
			data: {
				targetKind,
				targetId,
				referrerBucket: sessionReferrerBucket(),
			},
		});
	}, [targetKind, targetId]);
}
