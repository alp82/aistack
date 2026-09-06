// @vitest-environment jsdom
/**
 * Journey section 01, Stats, merged (#307, map #302), compact (#356).
 *
 * What these guard, rather than layout:
 *
 *   1. THE RANGE BELONGS TO THE PAGE. The section takes it as a prop and hands
 *      it to both reads with the machine. The page offers no control over it,
 *      so the meta line holds the machine selector and the checked stamp only.
 *   2. THE CHIP NEEDS BOTH SIDES. No previous period, no chip; the wording
 *      names the range.
 *   3. THE LEGACY PATH (#306 rule 6, ADR-0011): a legacy figure with no days
 *      is approximate at 30d and not measured in a shorter window.
 *   4. NEVER MEASURED IS AN INVITATION, and the owner gets the command.
 *   5. THE ACCORDION IS EXCLUSIVE and accessible: zero or one topic open, a
 *      real button in a heading over a labelled region, arrow keys between
 *      topics, no figure printed twice on the accessible tree, and the word
 *      Workflow prints nowhere.
 *   6. ONE VISIBLE COST LINE. The price-table ids stay in the hover card.
 */
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkflowView } from "@/features/workflow/copy";
import { api } from "../../../../convex/_generated/api";
import { view as workflowView } from "../../workflow/__tests__/fixture";
import { topicKeyTarget } from "../Accordion";
import { PAGE_RANGE, type RangeId, type UsageRead } from "../copy";
import { TOPIC } from "../items";
import { UsageSection } from "../UsageSection";
import { legacyUsage, noDaysUsage, reading, usage } from "./fixture";

const queryMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
	useMutation: () => vi.fn(() => Promise.resolve()),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

type Args = { range?: string; window?: string; machineOrdinal?: number };

/**
 * The page's part of the contract: the route hands the section its window, and
 * that window is fixed (`PAGE_RANGE`). Nothing on the page changes it, so a
 * shorter window is a different SERVER RESPONSE rendered at that window, never
 * a click. `range` names the window the answer covers.
 */
function setup({
	usage: usageAnswer = usage(),
	workflow = workflowView(),
	isOwner = false,
	stackToolSlugs = ["claude-code", "codex"],
	range = PAGE_RANGE,
}: {
	usage?: UsageRead | null | undefined | ((args: Args) => UsageRead | null);
	workflow?: WorkflowView | null | undefined | ((args: Args) => WorkflowView);
	isOwner?: boolean;
	stackToolSlugs?: string[];
	range?: RangeId;
} = {}) {
	const names = {
		usage: getFunctionName(api.measured.getUsageByStackSlug),
		workflow: getFunctionName(api.workflow.getWorkflowByStackSlug),
	};
	queryMock.mockImplementation(
		(ref: Parameters<typeof getFunctionName>[0], args: Args | "skip") => {
			if (args === "skip") return undefined;
			const name = getFunctionName(ref);
			if (name === names.usage)
				return typeof usageAnswer === "function"
					? usageAnswer(args)
					: usageAnswer;
			if (name === names.workflow)
				return typeof workflow === "function" ? workflow(args) : workflow;
			return undefined;
		},
	);
	return render(
		<UsageSection
			index={1}
			slug="alp"
			isOwner={isOwner}
			stackToolSlugs={stackToolSlugs}
			range={range}
		/>,
	);
}

/** The topic's button, by its label. */
const topic = (label: string) =>
	screen
		.getAllByTestId("usage-topic")
		.find((button) => button.textContent?.startsWith(label)) as HTMLElement;

/** The topic's summary row, the part of the button after the label. */
const summary = (label: string) =>
	within(topic(label)).getByTestId("usage-summary");

/** The one open panel. */
const panel = () => screen.getByRole("region");

const open = (label: string) => {
	fireEvent.click(topic(label));
	return panel();
};

describe("the range and the meta line", () => {
	it("reads both sides at the page's window", () => {
		setup();
		expect(queryMock).toHaveBeenCalledWith(
			api.measured.getUsageByStackSlug,
			expect.objectContaining({ slug: "alp", range: "30d" }),
		);
		expect(queryMock).toHaveBeenCalledWith(
			api.workflow.getWorkflowByStackSlug,
			expect.objectContaining({ slug: "alp", window: "30d" }),
		);
	});

	it("offers no control over the window", () => {
		setup();
		expect(screen.queryByRole("group", { name: "Range" })).toBeNull();
		expect(screen.queryByRole("combobox", { name: "Range" })).toBeNull();
		for (const label of ["30 days", "7 days", "24 hours"]) {
			expect(screen.queryByRole("button", { name: label })).toBeNull();
		}
	});

	it("offers the machines when there is more than one, with all machines first", () => {
		setup({
			usage: usage({
				machines: [
					{ machine: "workstation", machineOrdinal: 1 },
					{ machine: null, machineOrdinal: 2 },
				],
			}),
		});
		const select = screen.getByRole("combobox", { name: "Machine" });
		const options = within(select)
			.getAllByRole("option")
			.map((o) => o.textContent);
		expect(options).toEqual(["all machines", "workstation", "machine 2"]);
		fireEvent.change(select, { target: { value: "2" } });
		expect(queryMock).toHaveBeenCalledWith(
			api.measured.getUsageByStackSlug,
			expect.objectContaining({ machineOrdinal: 2 }),
		);
		expect(queryMock).toHaveBeenCalledWith(
			api.workflow.getWorkflowByStackSlug,
			expect.objectContaining({ machineOrdinal: 2 }),
		);
	});

	it("hides the machine selector for one machine and says when it was checked", () => {
		setup();
		expect(
			screen.queryByRole("combobox", { name: "Machine" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("2h ago")).toBeInTheDocument();
	});
});

describe("the previous-period chip", () => {
	it("reads against the 30 days before, and prints no chip on the headline", () => {
		setup();
		// The headline's change chip lives in the hero tile (heroReading), not in
		// the block, which splits the tokens instead.
		expect(
			within(
				screen.getByTestId("token-split").closest("button") as HTMLElement,
			).queryByTestId("delta"),
		).toBeNull();
		open("Time");
		expect(screen.getAllByTestId("delta")[0]).toHaveTextContent(
			"vs the 30 days before",
		);
	});

	it("reads against the 7 days before on a 7-day answer", () => {
		setup({ usage: usage({}, "7d"), range: "7d" });
		open("Time");
		expect(screen.getAllByTestId("delta")[0]).toHaveTextContent(
			"vs the 7 days before",
		);
	});

	it("reads against the day before on a 24-hour answer", () => {
		setup({ usage: usage({}, "24h"), range: "24h" });
		open("Time");
		expect(screen.getAllByTestId("delta")[0]).toHaveTextContent(
			"vs the day before",
		);
		expect(
			screen.getByText("tokens processed · last 24 hours"),
		).toBeInTheDocument();
	});

	it("prints a fall muted and an unchanged figure as ±0%", () => {
		setup({
			usage: usage({
				current: reading({ sessions: 50, projects: 4 }),
				previous: reading({ sessions: 100, projects: 4 }),
			}),
		});
		const code = open("Code");
		const sessions = within(code).getByText("Sessions").parentElement;
		const fall = within(sessions as HTMLElement).getByTestId("delta");
		expect(fall).toHaveTextContent("▼ 50%");
		expect(fall).toHaveClass("text-fg-muted");
		const projects = within(code).getByText("Project workspaces").parentElement;
		expect(
			within(projects as HTMLElement).getByTestId("delta"),
		).toHaveTextContent("±0% vs the 30 days before");
	});

	it("is absent when the previous period has no rows", () => {
		setup({ usage: usage({ previous: null }) });
		expect(screen.queryByTestId("delta")).not.toBeInTheDocument();
		expect(screen.getByTestId("token-split")).toBeInTheDocument();
	});
});

describe("the days path", () => {
	it("leads with the fold's tokens, cost and model rows", () => {
		setup();
		// The total prints in the hero, not here: the block splits it three ways.
		expect(screen.queryByText("1.20B")).toBeNull();
		expect(
			screen.getByText("tokens processed · last 30 days"),
		).toBeInTheDocument();
		const split = screen.getByTestId("token-split");
		expect(split.textContent).toBe(
			"200.0Min · 17%100.0Mout · 8%900.0Mcached · 75%",
		);
		expect(screen.getByText("≈$1,500")).toBeInTheDocument();
		expect(screen.getByText("Claude Opus 5")).toBeInTheDocument();
		expect(screen.getByText("claude-fable-5")).toBeInTheDocument();
		expect(screen.getByText("60.0%")).toBeInTheDocument();
	});

	it("prints one visible cost line and keeps the table ids off the page", () => {
		const { container } = setup();
		for (const button of screen.getAllByTestId("usage-topic")) {
			fireEvent.click(button);
		}
		expect(screen.getAllByText(/list prices/)).toHaveLength(1);
		expect(screen.getByText("at api list prices")).toBeInTheDocument();
		expect(container.textContent).not.toContain("pricing/2026-08");
		expect(container.textContent).not.toContain("of tokens priced");
	});

	it("prints no dollars when cost is not published", () => {
		setup({ usage: usage({ current: reading({ cost: null }) }) });
		expect(screen.getByText("cost not published")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("$");
	});

	it("puts the five stats and the harness rows in their topics", () => {
		setup();
		expect(summary("Code")).toHaveTextContent("120 sessions");
		const code = open("Code");
		expect(within(code).getByText("Sessions")).toBeInTheDocument();
		expect(within(code).getByText("120")).toBeInTheDocument();
		expect(within(code).getByText("Project workspaces")).toBeInTheDocument();
		expect(summary("Harness")).toHaveTextContent("81% cache hits");
		const harness = open("Harness");
		expect(within(harness).getByText("Cache hits")).toBeInTheDocument();
		expect(within(harness).getByText("81%")).toBeInTheDocument();
		const list = within(harness).getByRole("list", {
			name: "Harness token shares",
		});
		expect(within(list).getByText("Claude Code")).toBeInTheDocument();
		expect(within(list).getByText("Codex")).toBeInTheDocument();
	});

	it("does not count a harness with no tokens in the range as measured", () => {
		const current = reading();
		setup({
			usage: usage({
				current: {
					...current,
					harnesses: [
						{
							harness: "claude-code",
							sessions: 0,
							totalTokens: 0,
							tokenShare: 0,
						},
						{
							harness: "codex",
							sessions: 20,
							totalTokens: 100_000_000,
							tokenShare: 1,
						},
					],
				},
			}),
		});
		const harness = open("Harness");
		expect(within(harness).getByText("harness measured")).toBeInTheDocument();
		expect(
			within(harness).queryByText("harnesses measured"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("list", { name: "Harness token shares" }),
		).not.toBeInTheDocument();
	});

	it("hides harnesses that display as 0.0% and orders the rest by usage", () => {
		const current = reading();
		setup({
			usage: usage({
				current: {
					...current,
					harnesses: [
						{
							harness: "claude-code",
							sessions: 20,
							totalTokens: 10_000,
							tokenShare: 0.1,
						},
						{
							harness: "codex",
							sessions: 80,
							totalTokens: 89_960,
							tokenShare: 0.8996,
						},
						{
							harness: "opencode",
							sessions: 1,
							totalTokens: 40,
							tokenShare: 0.0004,
						},
					],
				},
			}),
		});

		const harness = open("Harness");
		const list = within(harness).getByRole("list", {
			name: "Harness token shares",
		});
		const rows = within(list).getAllByRole("listitem");
		expect(rows).toHaveLength(2);
		expect(rows[0]).toHaveTextContent("Codex");
		expect(rows[1]).toHaveTextContent("Claude Code");
		expect(within(list).queryByText("opencode")).not.toBeInTheDocument();
		expect(within(list).queryByText("0.0%")).not.toBeInTheDocument();
	});

	it("says when the range holds no day", () => {
		setup({ usage: usage({ current: null, previous: null }) });
		expect(
			screen.getByText("Nothing measured in the last 30 days."),
		).toBeInTheDocument();
		expect(screen.queryByText("where the tokens went")).not.toBeInTheDocument();
	});
});

describe("the legacy path: one legacy figure, no days", () => {
	it("marks the 30d figure approximate and prints no chip", () => {
		setup({ usage: legacyUsage() });
		expect(screen.getByText("4.27B")).toBeInTheDocument();
		expect(screen.getByText("≈$5,840")).toBeInTheDocument();
		expect(screen.getByText("approximate")).toBeInTheDocument();
		expect(screen.queryByTestId("delta")).not.toBeInTheDocument();
		expect(summary("Time")).toHaveTextContent("22 of 30 active days");
		expect(within(open("Time")).getByText("22 of 30")).toBeInTheDocument();
		expect(summary("Code")).toHaveTextContent("382 sessions");
		const code = open("Code");
		expect(within(code).getByText("382")).toBeInTheDocument();
		expect(screen.queryByText("Project workspaces")).not.toBeInTheDocument();
	});

	it("prints no model rows, because the figure has none", () => {
		setup({ usage: legacyUsage() });
		expect(screen.getByText("waiting for next sync")).toBeInTheDocument();
	});

	it("reads not measured on a 7-day answer, with the stats absent", () => {
		setup({ usage: legacyUsage({ range: "7d" }), range: "7d" });
		expect(screen.getByText("not measured")).toBeInTheDocument();
		expect(screen.queryByText("4.27B")).not.toBeInTheDocument();
		open("Code");
		expect(screen.queryByText("Sessions")).not.toBeInTheDocument();
	});

	it("reads not measured on a 24-hour answer", () => {
		setup({ usage: legacyUsage({ range: "24h" }), range: "24h" });
		expect(screen.getByText("not measured")).toBeInTheDocument();
		expect(screen.queryByText("4.27B")).not.toBeInTheDocument();
	});

	it("narrows the figure through the machine selector", () => {
		setup({
			usage: legacyUsage({
				machines: [
					{ machine: "workstation", machineOrdinal: 1 },
					{ machine: "laptop", machineOrdinal: 2 },
				],
			}),
		});
		fireEvent.change(screen.getByRole("combobox", { name: "Machine" }), {
			target: { value: "1" },
		});
		expect(queryMock).toHaveBeenCalledWith(
			api.measured.getUsageByStackSlug,
			expect.objectContaining({ slug: "alp", machineOrdinal: 1 }),
		);
	});
});

describe("a stack that has never been measured", () => {
	it("invites a visitor instead of marking the author down", () => {
		setup({ usage: noDaysUsage(), workflow: null });
		expect(
			screen.getByText("This stack has not been measured yet."),
		).toBeInTheDocument();
		expect(screen.getByText("npx @use-aistack/cli sync")).toBeInTheDocument();
		expect(
			screen.getByText("how measuring works").closest("a"),
		).toHaveAttribute("href", "/sync");
		expect(screen.queryByTestId("usage-topic")).not.toBeInTheDocument();
	});

	it("teaches the owner the one command", () => {
		setup({ usage: noDaysUsage(), workflow: null, isOwner: true });
		expect(
			screen.getByText("Your stack has not been measured yet."),
		).toBeInTheDocument();
		expect(screen.getByText("npx @use-aistack/cli sync")).toBeInTheDocument();
		expect(screen.queryByText("// auto-sync")).not.toBeInTheDocument();
	});

	it("says nothing while the reads are still out", () => {
		setup({ usage: undefined, workflow: undefined });
		expect(
			screen.queryByText("This stack has not been measured yet."),
		).not.toBeInTheDocument();
		expect(screen.getByText("Stats")).toBeInTheDocument();
		expect(screen.queryByText("// auto-sync")).not.toBeInTheDocument();
	});
});

describe("the accordion", () => {
	const expanded = () =>
		screen
			.getAllByTestId("usage-topic")
			.filter((row) => row.getAttribute("aria-expanded") === "true");

	it("prints every topic in order and opens one topic at a time", () => {
		setup();
		const topics = screen.getAllByTestId("usage-topic");
		expect(
			topics.map((button) => button.textContent?.match(/^[A-Za-z]+/)?.[0]),
		).toEqual(TOPIC.map((group) => group.label));
		// Every topic starts closed; the first click opens one.
		expect(expanded()).toHaveLength(0);
		expect(screen.queryByRole("region")).not.toBeInTheDocument();
		for (const group of TOPIC) {
			fireEvent.click(topic(group.label));
			expect(expanded()).toEqual([topic(group.label)]);
			expect(screen.getAllByRole("region")).toHaveLength(1);
			expect(
				screen.getByRole("region", { name: new RegExp(`^${group.label}`) }),
			).toBeInTheDocument();
		}
	});

	it("collapses to none when the open topic is clicked again", () => {
		setup();
		fireEvent.click(topic("Time"));
		expect(expanded()).toEqual([topic("Time")]);
		fireEvent.click(topic("Time"));
		expect(expanded()).toHaveLength(0);
		expect(screen.queryByRole("region")).not.toBeInTheDocument();
	});

	it("wires each topic as a button in a heading over a labelled region", () => {
		setup();
		for (const group of TOPIC) {
			const button = topic(group.label);
			expect(button.tagName).toBe("BUTTON");
			expect(button.closest("h3")).not.toBeNull();
			expect(button).toHaveAttribute("aria-controls");
		}
		const button = topic("Time");
		const region = open("Time");
		expect(region).toHaveAttribute("id", button.getAttribute("aria-controls"));
		expect(region).toHaveAttribute("aria-labelledby", button.id);
	});

	it("moves focus between topics with the arrow keys, Home and End", () => {
		setup();
		open("Time");
		topic("Time").focus();
		fireEvent.keyDown(topic("Time"), { key: "ArrowDown" });
		expect(document.activeElement).toBe(topic("Code"));
		fireEvent.keyDown(topic("Code"), { key: "ArrowUp" });
		expect(document.activeElement).toBe(topic("Time"));
		fireEvent.keyDown(topic("Time"), { key: "ArrowUp" });
		expect(document.activeElement).toBe(topic("Skills"));
		fireEvent.keyDown(topic("Skills"), { key: "Home" });
		expect(document.activeElement).toBe(topic("Time"));
		fireEvent.keyDown(topic("Time"), { key: "End" });
		expect(document.activeElement).toBe(topic("Skills"));
		// Arrow keys move focus and open nothing.
		expect(expanded()).toEqual([topic("Time")]);
	});

	it("maps the keys and ignores the rest", () => {
		expect(topicKeyTarget("ArrowDown", 4, 5)).toBe(0);
		expect(topicKeyTarget("ArrowUp", 0, 5)).toBe(4);
		expect(topicKeyTarget("Home", 3, 5)).toBe(0);
		expect(topicKeyTarget("End", 0, 5)).toBe(4);
		expect(topicKeyTarget("Enter", 2, 5)).toBeNull();
		expect(topicKeyTarget("ArrowDown", 0, 0)).toBeNull();
	});

	it("hides the watermark from the accessible tree and prints no figure in it", () => {
		setup();
		const marks = screen.getAllByTestId("usage-watermark");
		expect(marks.length).toBeGreaterThan(0);
		for (const mark of marks) {
			expect(mark).toHaveAttribute("aria-hidden", "true");
			expect(mark.textContent).toBe("");
			expect(mark.closest("h3")).not.toBeNull();
		}
		for (const button of screen.getAllByTestId("usage-topic")) {
			expect(within(button).queryByRole("img")).toBeNull();
		}
	});

	it("leads Time with the first row that has a body and prints its rows once", () => {
		setup();
		const time = open("Time");
		const lead = time.querySelector('[data-lead="true"]');
		expect(lead).not.toBeNull();
		// The fixture has no activity heatmap, Time's named lead, so the first
		// row with a body (session length) stands in. The template sentence is
		// gone: the lead is a chart.
		expect(lead?.textContent).toMatch(/Session length/);
		expect(
			within(time).queryByText(/Most measured time in these sessions goes to/),
		).toBeNull();
		expect(within(time).getAllByText("Active days")).toHaveLength(1);
		// The fixture answers three of the six Time rows: one lead, two scan rows.
		expect(within(time).getAllByTestId("usage-cell")).toHaveLength(3);
		expect(time.querySelectorAll('[data-lead="true"]')).toHaveLength(1);
		open("Code");
		expect(screen.queryByText(/Session length/)).not.toBeInTheDocument();
	});

	it("prints a scan row as figure, name and caption with no picture", () => {
		setup();
		const time = open("Time");
		const rows = within(time)
			.getAllByTestId("usage-cell")
			.filter((cell) => cell.getAttribute("data-lead") !== "true");
		expect(rows.length).toBeGreaterThan(0);
		for (const row of rows) {
			expect(within(row).queryByRole("img")).toBeNull();
		}
		const activeDays = rows.find((row) =>
			/Active days/.test(row.textContent ?? ""),
		);
		expect(activeDays?.textContent).toMatch(
			/3 of 30.*Active days.*days with at least one session/,
		);
	});

	it("draws one watermark per topic that has a picture, hidden from the tree", () => {
		setup();
		const marks = screen.getAllByTestId("usage-watermark");
		expect(marks.length).toBeGreaterThan(0);
		for (const mark of marks) {
			expect(mark.getAttribute("aria-hidden")).toBe("true");
		}
	});

	it("leads with the first chart when a topic has no lead, once", () => {
		setup();
		const code = open("Code");
		const cells = within(code).getAllByTestId("usage-cell");
		// The fixture answers four of the five Code rows.
		expect(cells).toHaveLength(4);
		expect(within(code).getAllByText("Project workspaces")).toHaveLength(1);
		expect(within(code).getAllByText("Sessions")).toHaveLength(1);
		const names = cells.map((cell) => cell.querySelector("p")?.textContent);
		expect(new Set(names).size).toBe(names.length);
	});

	it("renders an empty topic with no figures and one plain line", () => {
		setup({ usage: usage({ current: null, previous: null }), workflow: null });
		expect(summary("Models").textContent).toBe("");
		const models = open("Models");
		expect(
			within(models).getByText("No rows in this range."),
		).toBeInTheDocument();
		expect(within(models).queryByTestId("usage-cell")).toBeNull();
	});

	it("gives the owner no pin or hide control", () => {
		setup({ workflow: workflowView({ isOwner: true }), isOwner: true });
		expect(screen.queryByRole("button", { name: /pin/i })).toBeNull();
		expect(screen.queryByRole("button", { name: /hide/i })).toBeNull();
	});

	it("never prints the word Workflow", () => {
		const { container } = setup();
		for (const button of screen.getAllByTestId("usage-topic")) {
			fireEvent.click(button);
			expect(container.textContent).not.toMatch(/workflow/i);
		}
		cleanup();
		const legacy = setup({ usage: legacyUsage() });
		expect(legacy.container.textContent).not.toMatch(/workflow/i);
		cleanup();
		const never = setup({ usage: noDaysUsage(), workflow: null });
		expect(never.container.textContent).not.toMatch(/workflow/i);
	});
});
