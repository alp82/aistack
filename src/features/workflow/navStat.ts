/**
 * The Workflow section's one line in the page nav (#217).
 *
 * THE NAV STAT IS THE SECTION'S OWN TOP ROW, never a fact the nav picked. The
 * server ranked the rows and marked the podium (#218), so the stat is the first
 * highlighted row read back in its own unit. A reading whose podium is empty
 * gets no stat rather than a fallback figure the section does not lead with.
 */

import { fmtRowValue, rowName, type WorkflowView } from "./copy";

export function workflowNavStat(
	view: WorkflowView | null | undefined,
): string | null {
	if (!view) return null;
	const top = view.rows.find(
		(row) => row.placement === "highlight" && !row.hidden,
	);
	if (!top) return null;
	return `${fmtRowValue(top)} · ${rowName(top.ruleId)}`;
}
