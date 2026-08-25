// @vitest-environment jsdom
/**
 * Journey section 04 - Workflow (#215, map #200).
 *
 * The decisions these tests guard, rather than layout:
 *
 *   1. THE LEAD IS THE LOCKED WORDING (#220) OR NOTHING. Its two floors live in
 *      the rule, and the section must honor an empty answer rather than
 *      assembling a sentence of its own.
 *   2. TWO `?` MARKERS, NO MORE. Six dashed underlines in a short paragraph
 *      read as a minefield.
 *   3. THE PODIUM IS THE SERVER'S PLACEMENT. The section ranks nothing: a
 *      second ranking here could disagree with the first.
 *   4. A HIDDEN ROW IS OFF THE PUBLIC PAGE. The owner sees it tagged; a visitor
 *      never receives it.
 *   5. EVERY FIGURE NAMES ITS RULE. A number whose band, coverage and rule id
 *      are not shown is a number the reader has to take on trust.
 *   6. NO LLM, AND RAW DATA STAYS LOCAL - the section says both.
 */
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { WorkflowView } from "../copy";
import { WorkflowSection } from "../WorkflowSection";
import { row, view } from "./fixture";

const queryMock = vi.fn();
const overrideMock = vi.fn(() => Promise.resolve({ pinned: [], hidden: [] }));

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
	useMutation: () => overrideMock,
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const STACK_ID = "stack-1" as Id<"stacks">;

function setup(answer: WorkflowView | null | undefined) {
	queryMock.mockImplementation((ref: unknown, args: unknown) => {
		if (
			getFunctionName(ref as never) !==
			getFunctionName(api.workflow.getWorkflowByStackSlug)
		) {
			return undefined;
		}
		return args === "skip" ? undefined : answer;
	});
	return render(<WorkflowSection index={4} slug="alp" stackId={STACK_ID} />);
}

describe("the section renders only a real reading", () => {
	it("renders nothing before the query answers", () => {
		const { container } = setup(undefined);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when the consent gate withholds the reading", () => {
		// `publishWorkflow` off answers null even for a reading already stored.
		const { container } = setup(null);
		expect(container).toBeEmptyDOMElement();
	});

	it("titles the section Workflow under the measured kicker", () => {
		setup(view());
		expect(screen.getByRole("heading", { name: "Workflow" })).toBeTruthy();
		expect(screen.getByText("// measured")).toBeTruthy();
	});
});

describe("the template lead", () => {
	it("prints the four locked lines over the measured numbers", () => {
		setup(view());
		expect(screen.getByText(/464/)).toBeTruthy();
		expect(
			screen.getByText(/Most measured time in these sessions goes to/),
		).toBeTruthy();
		expect(screen.getByText(/of sessions · most start around/)).toBeTruthy();
		expect(screen.getByText(/of measured time unclassified/)).toBeTruthy();
		expect(screen.getByText("phase-rules/v1")).toBeTruthy();
	});

	it("carries exactly two markers, and each opens its own card", () => {
		setup(view());
		const markers = screen.getAllByRole("button", { name: /^What / });
		expect(markers).toHaveLength(2);

		fireEvent.click(
			screen.getByRole("button", { name: "What the phases mean" }),
		);
		expect(
			screen.getByText("reading and searching before the change"),
		).toBeTruthy();

		fireEvent.click(
			screen.getByRole("button", { name: "What measured time means" }),
		);
		expect(screen.getByText(/It is not wall-clock time/)).toBeTruthy();
	});

	it("withholds itself below the session floor, and the rows still render", () => {
		const thin = view();
		setup({ ...thin, lead: { ...thin.lead, sessionCount: 4 } });
		expect(
			screen.queryByText(/Most measured time in these sessions goes to/),
		).toBeNull();
		expect(screen.getByText("late night commits")).toBeTruthy();
	});

	it("withholds itself when no harness passed the playbook gate", () => {
		const gated = view();
		setup({ ...gated, lead: { ...gated.lead, playbookHarnessCount: 0 } });
		expect(
			screen.queryByText(/Most measured time in these sessions goes to/),
		).toBeNull();
	});
});

describe("the podium, the thin rows and the expander", () => {
	it("puts the three highlight rows in the band, with their own figures", () => {
		setup(view());
		expect(screen.getByText("42%")).toBeTruthy();
		expect(screen.getByText("2.8")).toBeTruthy();
		expect(screen.getAllByText("+ tap to extend")).toHaveLength(3);
	});

	it("holds the low-fit rows behind one expander", () => {
		setup(view());
		expect(screen.queryByText("web searches per active day")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: /below the fit line/ }));
		expect(screen.getByText("web searches per active day")).toBeTruthy();
	});

	it("extends a podium box into its body on a tap", () => {
		setup(view());
		fireEvent.click(screen.getByText("late night commits"));
		expect(
			screen.getByText(/typical 0% to 15% · this window 42%/),
		).toBeTruthy();
	});

	it("renders the component's own display when a component row opens", () => {
		setup(view());
		fireEvent.click(screen.getByText("phase playbook"));
		expect(screen.getByText("Shorter sessions")).toBeTruthy();
		expect(screen.getByText("Longer sessions")).toBeTruthy();
	});
});

describe("every figure names its rule", () => {
	it("shows the band, the coverage, the fit and the rule id", () => {
		setup(view());
		fireEvent.click(screen.getByText("thinking share"));
		expect(
			screen.getByText(/metric:thinking-share · metric-rules\/v1/),
		).toBeTruthy();
		expect(
			screen.getByText(
				/50% of the machine's synced harnesses · counts: Claude Code/,
			),
		).toBeTruthy();
		expect(screen.getByText(/coverage times surprise/)).toBeTruthy();
	});

	it("says a first reading has no earlier window to compare against", () => {
		setup(view());
		fireEvent.click(screen.getByText("late night commits"));
		expect(
			screen.getByText(/no earlier window to compare against/),
		).toBeTruthy();
	});

	it("names the rules, keeps the raw data local, and claims no LLM", () => {
		setup(view());
		expect(
			screen.getByText(/Raw transcripts and repository names never leave it/),
		).toBeTruthy();
		expect(
			screen.getByText(
				/No language model reads this section or writes a word of it/,
			),
		).toBeTruthy();
	});

	it("counts the measurements it has no rule for rather than printing them bare", () => {
		setup({ ...view(), unknownMetricIds: ["future-metric"] });
		expect(
			screen.getByText(/1 measurement this site has no rule for yet/),
		).toBeTruthy();
	});
});

describe("the owner's pins and hides", () => {
	const owned = () =>
		view({
			isOwner: true,
			rows: [
				row({ placement: "highlight" }),
				row({
					rowId: "metric:parallel-projects",
					ruleId: "parallel-projects",
					label: "projects run in parallel on a median active day",
					unit: "count",
					value: 2.8,
					placement: "normal",
					hidden: true,
				}),
			],
		});

	it("shows a visitor no controls at all", () => {
		setup(view());
		fireEvent.click(screen.getByText("late night commits"));
		expect(screen.queryByText("your controls")).toBeNull();
	});

	it("pins a row through the server, which owns the override", async () => {
		setup(owned());
		fireEvent.click(screen.getByText("late night commits"));
		await act(async () => {
			fireEvent.click(
				screen.getByRole("button", { name: /pin to the podium/ }),
			);
		});
		expect(overrideMock).toHaveBeenCalledWith({
			stackId: STACK_ID,
			rowId: "metric:late-night-commits",
			state: "pinned",
		});
	});

	it("tags a hidden row in the owner's own view and offers it back", async () => {
		setup(owned());
		expect(screen.getByText("hidden")).toBeTruthy();
		fireEvent.click(screen.getByText("parallel projects"));
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /show again/ }));
		});
		expect(overrideMock).toHaveBeenCalledWith({
			stackId: STACK_ID,
			rowId: "metric:parallel-projects",
			state: null,
		});
	});

	it("prints the server's refusal when the podium is full", async () => {
		overrideMock.mockRejectedValueOnce(
			new Error(
				"[Request ID: x] Server Error Uncaught Error: The podium holds 3 rows. Unpin one before pinning another.",
			) as never,
		);
		setup(owned());
		fireEvent.click(screen.getByText("late night commits"));
		fireEvent.click(screen.getByRole("button", { name: /pin to the podium/ }));
		expect(await screen.findByText(/The podium holds 3 rows/)).toBeTruthy();
	});
});
