// @vitest-environment jsdom
/**
 * Journey section 04 - Workflow (#215, #286, map #200).
 *
 * The decisions these tests guard, rather than layout:
 *
 *   1. THE LEAD IS THE LOCKED WORDING (#220) OR NOTHING, with the phase mix as
 *      a bar under it and no rule id anywhere (#277).
 *   2. TWO `?` MARKERS, NO MORE.
 *   3. THE PODIUM IS THE SERVER'S PLACEMENT, in the fixed order (#284). The
 *      section ranks nothing and prints no fit, band, coverage or rule.
 *   4. A ROW HEAD READS AS A SENTENCE: name, accent figure, caption, picture.
 *      A flat row never opens; one row is open at a time.
 *   5. A HIDDEN ROW IS OFF THE PUBLIC PAGE. The owner sees it tagged, with the
 *      pin and hide as an actions column on every head.
 *   6. A WINDOW WITH NO DAY IS AN EMPTY STATE, never a row of zeroes.
 */
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
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

function setup(
	answer: WorkflowView | null | undefined,
	windowed?: (args: { window?: string }) => WorkflowView | null | undefined,
	isOwner = false,
) {
	queryMock.mockImplementation((ref: unknown, args: unknown) => {
		if (
			getFunctionName(ref as never) !==
			getFunctionName(api.workflow.getWorkflowByStackSlug)
		) {
			return undefined;
		}
		if (args === "skip") return undefined;
		const held = args as { window?: string };
		if (held.window && windowed) return windowed(held);
		return answer;
	});
	return render(
		<WorkflowSection
			index={4}
			slug="alp"
			stackId={STACK_ID}
			isOwner={isOwner}
		/>,
	);
}

describe("the section loading and empty states", () => {
	it("renders nothing before the query answers", () => {
		const { container } = setup(undefined);
		expect(container).toBeEmptyDOMElement();
	});

	it("shows visitors the Workflow header when no workflow is published", () => {
		setup(null);
		expect(screen.getByRole("heading", { name: "Workflow" })).toBeTruthy();
		expect(
			screen.getByText("No workflow has been published for this stack yet"),
		).toBeTruthy();
	});

	it("shows owners a sync action when no workflow is published", () => {
		setup(null, undefined, true);
		expect(screen.getByRole("heading", { name: "Workflow" })).toBeTruthy();
		expect(screen.getByText(/No workflow yet/)).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Sync your stack" }),
		).toHaveAttribute("href", "/sync");
		expect(
			screen.queryByText("No workflow has been published for this stack yet"),
		).toBeNull();
	});

	it("fills a published day that has no displayable workflow rows", () => {
		const empty = view({
			rows: [],
			lead: {
				...view().lead,
				sessionCount: 0,
				playbookHarnessCount: 0,
			},
		});
		setup(empty);
		expect(screen.getByRole("heading", { name: "Workflow" })).toBeTruthy();
		expect(
			screen.getByText("No workflow has been published for this stack yet"),
		).toBeTruthy();
	});

	it("gives the owner a sync action when a published day has no rows", () => {
		setup(view({ rows: [], isOwner: true }), undefined, true);
		expect(screen.getByText(/No workflow yet/)).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Sync your stack" }),
		).toHaveAttribute("href", "/sync");
		expect(
			screen.queryByText("No workflow has been published for this stack yet"),
		).toBeNull();
	});

	it("titles the section Workflow under the measured kicker", () => {
		setup(view());
		expect(screen.getByRole("heading", { name: "Workflow" })).toBeTruthy();
		expect(screen.getByText("// measured")).toBeTruthy();
	});
});

describe("the template lead", () => {
	it("prints the locked lines over the measured numbers, with the phase bar", () => {
		setup(view());
		expect(screen.getByText(/464/)).toBeTruthy();
		expect(
			screen.getByText(/Most measured time in these sessions goes to/),
		).toBeTruthy();
		expect(screen.getByText(/of sessions · most start around/)).toBeTruthy();
		expect(
			screen.getByRole("img", { name: "measured time by phase" }),
		).toBeTruthy();
	});

	it("prints no rule id anywhere on the page (#277)", () => {
		const { container } = setup(view());
		expect(container.textContent).not.toMatch(/phase-rules\/v1/);
		expect(container.textContent).not.toMatch(/metric-rules/);
		expect(container.textContent).not.toMatch(/component-rules/);
		expect(container.textContent).not.toMatch(/coverage/);
		expect(container.textContent).not.toMatch(/fit/);
		// The unknown share keeps its number and loses its rule.
		expect(screen.getByText(/of measured time unclassified$/)).toBeTruthy();
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
		expect(screen.getByText("Late-night commits")).toBeTruthy();
	});
});

describe("the podium and the thin rows, in the fixed order", () => {
	it("puts the three highlight rows in the band, each head a sentence", () => {
		setup(view());
		const band = screen.getByText("Late-night commits").closest("div");
		expect(band).toBeTruthy();
		expect(screen.getByText("42%")).toBeTruthy();
		expect(screen.getByText("of commits between 23:00 and 03:00")).toBeTruthy();
		expect(screen.getByText("2.8")).toBeTruthy();
		expect(screen.getByText("on a typical active day")).toBeTruthy();
		expect(screen.getByText("45 min")).toBeTruthy();
		expect(screen.getByText("median session")).toBeTruthy();
	});

	it("gives every head a picture, podium and list alike", () => {
		setup(view());
		expect(screen.getByRole("img", { name: "late-night share" })).toBeTruthy();
		expect(
			screen.getByRole("img", { name: "projects on a typical day" }),
		).toBeTruthy();
		expect(screen.getByRole("img", { name: "time by phase" })).toBeTruthy();
		expect(
			screen.getByRole("img", { name: "additions against removals" }),
		).toBeTruthy();
		expect(screen.getByRole("img", { name: "thinking share" })).toBeTruthy();
		expect(
			screen.getByRole("img", { name: "searches on a typical day" }),
		).toBeTruthy();
	});

	it("prints the Lines changed head as additions and removals", () => {
		setup(view());
		expect(screen.getByText("+95k")).toBeTruthy();
		expect(screen.getByText("added, 19k removed")).toBeTruthy();
	});

	it("keeps the rows in the order they arrived and offers no expander", () => {
		setup(view());
		const names = screen
			.getAllByText(/^(Lines changed|Thinking tokens|Web searches)$/)
			.map((node) => node.textContent);
		expect(names).toEqual(["Lines changed", "Thinking tokens", "Web searches"]);
		expect(
			screen.queryByRole("button", { name: /below the fit line/ }),
		).toBeNull();
		expect(screen.queryByText(/tap to extend/)).toBeNull();
	});

	it("opens one row at a time across the podium and the list", () => {
		setup(view());
		fireEvent.click(screen.getByRole("button", { name: /Session length/ }));
		expect(
			screen.getByText("Where the time goes, by session length"),
		).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: /Lines changed/ }));
		expect(screen.getByText("lines changed per commit")).toBeTruthy();
		expect(
			screen.queryByText("Where the time goes, by session length"),
		).toBeNull();
	});

	it("never opens a flat row: the head holds its whole picture", () => {
		setup(view());
		expect(screen.queryByRole("button", { name: /Web searches/ })).toBeNull();
		expect(
			screen.queryByRole("button", { name: /Late-night commits/ }),
		).toBeNull();
	});

	it("prints no kicker, footnote or provenance under a body", () => {
		const { container } = setup(view());
		fireEvent.click(screen.getByRole("button", { name: /Lines changed/ }));
		expect(container.textContent).not.toMatch(/\/\/ the git ledger/);
		expect(container.textContent).not.toMatch(/test-files\/v2/);
		expect(container.textContent).not.toMatch(/Raw transcripts/);
		expect(container.textContent).not.toMatch(/No language model/);
	});
});

describe("the window selector", () => {
	it("offers the three windows and folds the chosen one", () => {
		setup(view(), ({ window }) =>
			view({ window: { id: window as "7d", days: 3, from: "x", to: "y" } }),
		);
		const group = screen.getByRole("group", { name: "Window" });
		expect(
			within(group)
				.getByRole("button", { name: "30 days" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		fireEvent.click(within(group).getByRole("button", { name: "7 days" }));
		expect(queryMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ slug: "alp", window: "7d" }),
		);
		expect(screen.getByText("Late-night commits")).toBeTruthy();
	});

	it("shows the visitor empty state for a window with no stored day", () => {
		setup(view(), ({ window }) =>
			view({
				window: { id: window as "24h", days: 0, from: "x", to: "y" },
				rows: [],
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: "24 hours" }));
		expect(
			screen.getByText("No workflow has been published for this stack yet"),
		).toBeTruthy();
		expect(
			screen.queryByText("nothing measured in the last 24 hours"),
		).toBeNull();
		expect(screen.queryByText("Late-night commits")).toBeNull();
		expect(screen.getByRole("heading", { name: "Workflow" })).toBeTruthy();
	});

	it("shows the owner sync action for a window with no stored day", () => {
		setup(
			view({ isOwner: true }),
			({ window }) =>
				view({
					isOwner: true,
					window: { id: window as "7d", days: 0, from: "x", to: "y" },
					rows: [],
				}),
			true,
		);
		fireEvent.click(screen.getByRole("button", { name: "7 days" }));
		expect(screen.getByText(/No workflow yet/)).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Sync your stack" }),
		).toHaveAttribute("href", "/sync");
		expect(screen.queryByText("no measured day in the last 7 days")).toBeNull();
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
					name: "Parallel projects",
					unit: "count",
					value: 2.8,
					placement: "normal",
					hidden: true,
				}),
			],
		});

	it("shows a visitor no controls at all", () => {
		setup(view());
		expect(
			screen.queryByRole("button", { name: /pin to the podium/ }),
		).toBeNull();
		expect(
			screen.queryByRole("button", { name: /hide from the page/ }),
		).toBeNull();
	});

	it("puts the controls on every head, without opening the row", async () => {
		setup(owned());
		// The hidden flat row still carries its actions in the owner's view.
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /show again/ }));
		});
		expect(overrideMock).toHaveBeenCalledWith({
			stackId: STACK_ID,
			rowId: "metric:parallel-projects",
			state: null,
		});
		expect(screen.getByText("hidden")).toBeTruthy();
	});

	it("pins a podium row through the server, without opening it", async () => {
		setup(owned());
		await act(async () => {
			fireEvent.click(
				screen.getAllByRole("button", {
					name: /pin to the podium/,
				})[0] as HTMLElement,
			);
		});
		expect(overrideMock).toHaveBeenCalledWith({
			stackId: STACK_ID,
			rowId: "metric:late-night-commits",
			state: "pinned",
		});
	});

	it("prints the server's refusal when the podium is full", async () => {
		overrideMock.mockRejectedValueOnce(
			new Error(
				"[Request ID: x] Server Error Uncaught Error: The podium holds 3 rows. Unpin one before pinning another.",
			) as never,
		);
		setup(owned());
		fireEvent.click(
			screen.getAllByRole("button", {
				name: /pin to the podium/,
			})[0] as HTMLElement,
		);
		expect(await screen.findByText(/The podium holds 3 rows/)).toBeTruthy();
	});
});
