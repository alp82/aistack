// @vitest-environment jsdom
/**
 * The row bodies (#215, #286, map #200).
 *
 * The decisions these tests guard:
 *
 *   1. THE UNKNOWN BUCKET NEVER HIDES in the session-length tracks.
 *   2. HOURS RENDER IN THE OWNER'S LOCAL TIME, and the heatmap's popup floats
 *      on hover rather than printing a static sentence.
 *   3. A BODY WITH NOTHING TO SHOW SAYS SO ABOUT THE READING, never about the
 *      author: positive claims only (#40).
 *   4. THE WITHHELD LINES STAY IN THE DENOMINATOR, and languages merge by name.
 *   5. THE THREE ROWS #285 UNLOCKED read the daily wire's own shapes.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RowBody } from "../components";
import { rowHead } from "../heads";
import { row, view } from "./fixture";

afterEach(cleanup);

const show = (rowId: string, over = {}) =>
	render(<RowBody rowId={rowId} view={view(over)} />);

describe("session length", () => {
	it("splits the sessions into two named tracks with median figures", () => {
		show("component:phase-playbook");
		expect(screen.getByText("Shorter sessions")).toBeTruthy();
		expect(screen.getByText("Longer sessions")).toBeTruthy();
		expect(screen.getAllByText(/min$/).length).toBeGreaterThan(0);
	});

	it("keeps unknown in the legend and names no rule", () => {
		const { container } = show("component:phase-playbook");
		expect(screen.getByText("unknown")).toBeTruthy();
		expect(container.textContent).not.toMatch(/playbook-rules/);
		expect(container.textContent).not.toMatch(/phase-rules/);
	});

	it("shows the merged share with and without a verify step as paired bars", () => {
		show("component:phase-playbook");
		expect(
			screen.getByText("Sessions that merged, with and without a verify step."),
		).toBeTruthy();
		expect(screen.getByText(/^\d+ and \d+ sessions$/)).toBeTruthy();
	});
});

describe("lines changed", () => {
	it("prints removals apart from additions, in the destructive paint", () => {
		show("component:git-ledger");
		const removals = screen.getByText("-19k");
		expect(removals.getAttribute("style")).toContain("var(--destructive)");
		expect(screen.getByText("+95k")).toBeTruthy();
	});

	it("draws one dot per commit on a log axis with the median labeled", () => {
		const { container } = show("component:git-ledger");
		expect(container.querySelectorAll("[title$='changed lines']")).toHaveLength(
			4,
		);
		expect(screen.getByText("median 400")).toBeTruthy();
		expect(screen.getByText("1,000")).toBeTruthy();
	});
});

describe("languages", () => {
	it("merges by name and counts the withheld lines in the denominator", () => {
		show("component:coding-languages", {
			section: {
				...view().section,
				git: {
					...view().section.git,
					changedLinesByExtension: [
						{ extension: "ts", changedLines: 60_000 },
						{ extension: "tsx", changedLines: 20_000 },
						{ extension: "css", changedLines: 12_000 },
					],
				},
			},
		});
		// 80,000 of 94,000, not of 92,000, and one TypeScript row.
		expect(screen.getByText("TypeScript")).toBeTruthy();
		expect(screen.getByText("85%")).toBeTruthy();
		expect(screen.getByText("CSS")).toBeTruthy();
	});

	it("reads the head as a sentence: figure, then the runner-up", () => {
		const head = rowHead(row({ rowId: "component:coding-languages" }), view());
		expect(head.figure).toBe("85%");
		expect(head.caption).toBe("TypeScript, then CSS at 13%");
	});
});

describe("when work happens", () => {
	it("shifts the cells into the owner's local time", () => {
		show("component:activity-heatmap");
		// 21:00 UTC on Sunday, plus 120 minutes, is 23:00 on Sunday.
		expect(
			screen.getByRole("button", { name: "Sun 23:00, 120 recorded events" }),
		).toBeTruthy();
	});

	it("floats a popup on hover and prints no static sentence", () => {
		const { container } = show("component:activity-heatmap");
		expect(screen.queryByRole("status")).toBeNull();
		expect(container.textContent).not.toMatch(/busiest hours/);
		fireEvent.mouseEnter(
			screen.getByRole("button", { name: "Sun 23:00, 120 recorded events" }),
		);
		expect(screen.getByRole("status").textContent).toBe(
			"Sun 23:00 · 120 recorded events",
		);
		fireEvent.mouseLeave(
			screen.getByRole("button", { name: "Sun 23:00, 120 recorded events" }),
		);
		expect(screen.queryByRole("status")).toBeNull();
	});

	it("switches the grid to commits, shifted by the same offset", () => {
		show("component:activity-heatmap");
		fireEvent.click(screen.getByRole("button", { name: "commits" }));
		expect(
			screen.getByRole("button", { name: "Sun 23:00, 9 commits" }),
		).toBeTruthy();
	});
});

describe("models, the kit and subagents", () => {
	it("gives one model the same paint in both rows and shortens its name", () => {
		show("component:model-routing");
		expect(screen.getByText("main loop")).toBeTruthy();
		expect(screen.getByText("subagents")).toBeTruthy();
		expect(screen.getAllByText("opus-5").length).toBeGreaterThan(0);
	});

	it("lists the kit in two columns", () => {
		show("component:kit");
		expect(screen.getByText("grilling")).toBeTruthy();
		expect(screen.getByText("curia")).toBeTruthy();
	});

	it("prints the subagent split and both records", () => {
		show("component:delegation");
		expect(screen.getByText("subagents 33%")).toBeTruthy();
		expect(screen.getByText("11")).toBeTruthy();
		expect(screen.getByText("43")).toBeTruthy();
	});

	it("says what the reading lacks, never what the author failed to do", () => {
		const bare = view();
		render(
			<RowBody
				rowId="component:model-routing"
				view={{
					...bare,
					section: {
						...bare.section,
						harnesses: bare.section.harnesses.map((harness) => ({
							harness: harness.harness,
							sessions: harness.sessions,
							startHours: harness.startHours,
							activity: harness.activity,
						})),
					},
				}}
			/>,
		);
		expect(
			screen.getByText(
				"No harness on this machine records a model per response.",
			),
		).toBeTruthy();
	});
});

describe("the three rows the daily wire unlocked", () => {
	it("reads effort levels as low, medium and high shares", () => {
		show("metric:effort-levels");
		expect(screen.getByText("high 60%")).toBeTruthy();
		expect(screen.getByText("medium 40%")).toBeTruthy();
		const head = rowHead(row({ rowId: "metric:effort-levels" }), view());
		expect(head.figure).toBe("60%");
		expect(head.caption).toBe("high, 40% medium, 0% low");
	});

	it("lists thinking tokens by harness, naming the ones that record none", () => {
		show("metric:thinking-share");
		expect(screen.getByText("Claude Code")).toBeTruthy();
		expect(screen.getByText("38%")).toBeTruthy();
		expect(screen.getByText("opencode")).toBeTruthy();
		expect(screen.getByText("not recorded")).toBeTruthy();
	});

	it("draws turn length as the log-bucket histogram with its median", () => {
		show("metric:turn-duration");
		expect(screen.getByText("median")).toBeTruthy();
		// Bucket 6 is 32 to 64 seconds; its middle quotes as ~45s.
		expect(screen.getByText("32s-1.1 min")).toBeTruthy();
		const head = rowHead(row({ rowId: "metric:turn-duration" }), view());
		expect(head.figure).toBe("~45s");
	});
});
