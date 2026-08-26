/**
 * The Workflow section's one line in the page nav (#217).
 *
 * THE NAV STAT IS THE SECTION'S OWN TOP ROW, never a fact the nav picked. The
 * server placed the rows and marked the podium, so the stat is the first
 * podium row's own head: the same figure and the same name the box prints
 * (#286). A reading whose podium is empty gets no stat rather than a fallback
 * figure the section does not lead with.
 */

import type { WorkflowView } from "./copy";
import { rowHead } from "./heads";

export function workflowNavStat(
	view: WorkflowView | null | undefined,
): string | null {
	if (!view) return null;
	const top = view.rows.find(
		(row) => row.placement === "highlight" && !row.hidden,
	);
	if (!top) return null;
	return `${rowHead(top, view).figure} · ${top.name}`;
}
