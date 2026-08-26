/**
 * The Workflow section's line in the page nav (#217).
 *
 * The nav restates, it never ranks: the stat is the server's own top podium
 * row, printed as its head prints it (#286), and a reading whose podium is
 * empty gets no stat rather than a figure the section does not lead with.
 */
import { describe, expect, it } from "vitest";
import { workflowNavStat } from "../navStat";
import { row, view } from "./fixture";

describe("the workflow nav stat", () => {
	it("is the first podium row, as its head prints it", () => {
		const reading = view({
			rows: [row({ placement: "highlight" }), row({ placement: "normal" })],
		});
		expect(workflowNavStat(reading)).toBe("42% · Late-night commits");
	});

	it("prints the Lines changed head, not the rule's share", () => {
		const reading = view({
			rows: [
				row({
					rowId: "component:git-ledger",
					name: "Lines changed",
					unit: "share",
					value: 0.17,
					placement: "highlight",
				}),
			],
		});
		expect(workflowNavStat(reading)).toBe("+95k · Lines changed");
	});

	it("skips a row the owner hid", () => {
		const reading = view({
			rows: [
				row({ placement: "highlight", hidden: true }),
				row({
					rowId: "metric:thinking-share",
					name: "Thinking tokens",
					unit: "share",
					value: 0.5,
					placement: "highlight",
				}),
			],
		});
		expect(workflowNavStat(reading)).toBe("50% · Thinking tokens");
	});

	it("is absent without a reading, and without a podium", () => {
		expect(workflowNavStat(null)).toBeNull();
		expect(workflowNavStat(undefined)).toBeNull();
		expect(
			workflowNavStat(view({ rows: [row({ placement: "normal" })] })),
		).toBeNull();
	});
});
