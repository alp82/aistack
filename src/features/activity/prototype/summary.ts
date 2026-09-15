/**
 * PROTOTYPE - the one-line row grammar graduated into the shared read model
 * at fold-in (#147). Re-exported here so the archived variants keep running.
 * `rowHandle` left the read model when the hero switched to the stack name
 * (2026-09-15); the archived variants keep the old `creator/slug` form here.
 */

import type { FeedRow } from "../feed";

export { rowSummary } from "../feed";

export function rowHandle(row: FeedRow): string {
	return `${row.stack.creator}/${row.stack.slug}`;
}
