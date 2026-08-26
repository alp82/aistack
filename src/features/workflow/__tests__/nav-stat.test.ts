/**
 * The Workflow section's line in the page nav (#217).
 *
 * The nav restates, it never ranks: the stat is the server's own top podium row
 * (#218), and a reading whose podium is empty gets no stat rather than a figure
 * the section does not lead with.
 */
import { describe, expect, it } from "vitest";
import { workflowNavStat } from "../navStat";
import { row, view } from "./fixture";

describe("the workflow nav stat", () => {
	it("is the first podium row, in its own unit", () => {
		const reading = view({
			rows: [
				row({
					rowId: "late-night-commits",
					ruleId: "late-night-commits",
					unit: "share",
					value: 0.42,
					placement: "highlight",
				}),
				row({ rowId: "second", placement: "normal" }),
			],
		});
		expect(workflowNavStat(reading)).toBe("42% · late night commits");
	});

	it("skips a row the owner hid", () => {
		const reading = view({
			rows: [
				row({
					rowId: "hidden-one",
					ruleId: "hidden-one",
					placement: "highlight",
					hidden: true,
				}),
				row({
					rowId: "shown-one",
					ruleId: "shown-one",
					unit: "share",
					value: 0.5,
					placement: "highlight",
				}),
			],
		});
		expect(workflowNavStat(reading)).toBe("50% · shown one");
	});

	it("is absent without a reading, and without a podium", () => {
		expect(workflowNavStat(null)).toBeNull();
		expect(workflowNavStat(undefined)).toBeNull();
		expect(
			workflowNavStat(view({ rows: [row({ placement: "normal" })] })),
		).toBeNull();
	});
});
