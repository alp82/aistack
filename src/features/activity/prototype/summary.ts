/**
 * PROTOTYPE — throwaway. One-line summaries of feed rows, for surfaces that
 * demote the feed to a ticker line or a chart annotation.
 */

import { type FeedRow, fmtDelta, fmtTokens, syncTokens } from "../feed";

/** `marco/shipfast-solo` — the compact identity a ticker has room for. */
export function rowHandle(row: FeedRow): string {
	return `${row.stack.creator}/${row.stack.slug}`;
}

/** The event in a few words: `+285M measured`, `joined with 7 tools`. */
export function rowSummary(row: FeedRow): string {
	const event = row.event;
	if (event.type === "sync.landed") {
		if (row.firstReading) {
			return `first reading — ${fmtTokens(syncTokens(row))}`;
		}
		const delta = row.deltaTokens;
		return delta === null
			? `${fmtTokens(syncTokens(row))} measured`
			: `${fmtDelta(delta)} measured`;
	}
	if (event.type === "stack.published") {
		return `joined with ${event.toolCount} ${
			event.toolCount === 1 ? "tool" : "tools"
		}`;
	}
	const added = event.added[0]?.name;
	const removed = event.removed[0]?.name;
	if (added && removed) return `picked up ${added} · dropped ${removed}`;
	if (added) return `picked up ${added}`;
	if (removed) return `dropped ${removed}`;
	return "changed composition";
}
