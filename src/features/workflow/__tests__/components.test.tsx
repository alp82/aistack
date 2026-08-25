// @vitest-environment jsdom
/**
 * The seven component bodies (#215, map #200).
 *
 * The decisions these tests guard:
 *
 *   1. THE UNKNOWN BUCKET NEVER HIDES. It has a paint in every strip and a
 *      share in the footnote, because it ships as a real number rather than as
 *      an embarrassment.
 *   2. HOURS RENDER IN THE OWNER'S LOCAL TIME. A reader's own clock would put a
 *      stranger's habit at the wrong hour and describe nobody.
 *   3. A COMPONENT WITH NOTHING TO SHOW SAYS SO ABOUT THE READING, never about
 *      the author: positive claims only (#40).
 *   4. THE WITHHELD LINES STAY IN THE DENOMINATOR. A stack whose top language
 *      is unapproved must not read as more concentrated than it is.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ComponentBody } from "../components";
import { view } from "./fixture";

afterEach(cleanup);

const show = (componentId: string, over = {}) =>
	render(<ComponentBody componentId={componentId} view={view(over)} />);

describe("the phase playbook", () => {
	it("splits the sessions into two named tracks with median figures", () => {
		show("phase-playbook");
		expect(screen.getByText("Shorter sessions")).toBeTruthy();
		expect(screen.getByText("Longer sessions")).toBeTruthy();
		expect(screen.getAllByText(/median/).length).toBeGreaterThan(0);
	});

	it("keeps unknown in the legend and names both rule sets", () => {
		show("phase-playbook");
		expect(screen.getByText("unknown")).toBeTruthy();
		expect(screen.getByText(/playbook-rules\/v1/)).toBeTruthy();
		expect(screen.getByText(/phase-rules\/v1/)).toBeTruthy();
	});

	it("names the harness the gate held back, and why", () => {
		show("phase-playbook");
		expect(
			screen.getByText(/held back by the playbook gate: opencode/),
		).toBeTruthy();
		expect(screen.getByText(/20% or less/)).toBeTruthy();
	});

	it("pairs a habit with a figure and claims no cause", () => {
		show("phase-playbook");
		expect(
			screen.getByText("Review rounds, with and without a verify step."),
		).toBeTruthy();
		expect(
			screen.getAllByText(/measured together, no cause claimed/).length,
		).toBeGreaterThan(0);
	});
});

describe("the git ledger", () => {
	it("prints removals apart from additions, in the destructive paint", () => {
		show("git-ledger");
		const removals = screen.getByText("-19.3k");
		expect(removals.getAttribute("style")).toContain("var(--destructive)");
		expect(screen.getByText("+94.8k")).toBeTruthy();
	});

	it("draws one dot per commit on a log scale", () => {
		const { container } = show("git-ledger");
		const dots = container.querySelectorAll("[title$='changed lines']");
		expect(dots).toHaveLength(4);
		// 4 lines and 4,000 lines must not draw the same mark.
		expect(dots[0]?.getAttribute("style")).not.toBe(
			dots[3]?.getAttribute("style"),
		);
	});
});

describe("coding languages", () => {
	it("counts the withheld lines in the denominator", () => {
		show("coding-languages");
		// 80,000 of 94,000, not of 92,000.
		expect(screen.getByText("85%")).toBeTruthy();
		expect(
			screen.getByText(/2k in file types the machine withheld/),
		).toBeTruthy();
	});
});

describe("the week and time heatmap", () => {
	it("shifts the cells into the owner's local time and says so", () => {
		show("activity-heatmap");
		expect(screen.getByText("hours in the owner's local time")).toBeTruthy();
		// 21:00 UTC on Sunday, plus 120 minutes, is 23:00 on Sunday.
		expect(
			screen.getByRole("button", { name: "Sun 23:00, 120 events" }),
		).toBeTruthy();
	});

	it("stays in UTC, labeled, when the reading carries no offset", () => {
		render(
			<ComponentBody
				componentId="activity-heatmap"
				view={view({ utcOffsetMinutes: null })}
			/>,
		);
		expect(
			screen.getByText(/this reading carries no machine offset/),
		).toBeTruthy();
	});

	it("opens one cell's recorded events on a tap", () => {
		show("activity-heatmap");
		fireEvent.click(
			screen.getByRole("button", { name: "Sun 23:00, 120 events" }),
		);
		expect(screen.getByText(/recorded events/)).toBeTruthy();
	});
});

describe("model routing, the kit and delegation", () => {
	it("gives one model the same paint in both rows", () => {
		show("model-routing");
		expect(screen.getByText("main loop")).toBeTruthy();
		expect(screen.getByText("subagents")).toBeTruthy();
		expect(screen.getAllByText("claude-opus-5").length).toBeGreaterThan(0);
	});

	it("lists the kit and explains the gap under the shares", () => {
		show("kit");
		expect(screen.getByText("grilling")).toBeTruthy();
		expect(screen.getByText("curia")).toBeTruthy();
		expect(screen.getByText(/1 names withheld on the machine/)).toBeTruthy();
	});

	it("prints the delegation ratio and both records", () => {
		show("delegation");
		expect(screen.getByText("2 : 1")).toBeTruthy();
		expect(screen.getByText("11")).toBeTruthy();
		expect(screen.getByText("43")).toBeTruthy();
	});

	it("says what the reading lacks, never what the author failed to do", () => {
		const bare = view();
		render(
			<ComponentBody
				componentId="model-routing"
				view={{
					...bare,
					section: {
						...bare.section,
						harnesses: bare.section.harnesses.map((harness) => ({
							harness: harness.harness,
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
