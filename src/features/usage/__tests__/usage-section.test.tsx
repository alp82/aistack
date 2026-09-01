// @vitest-environment jsdom
/**
 * Journey section 01, Actual Usage, merged (#307, map #302).
 *
 * What these guard, rather than layout:
 *
 *   1. ONE CONTROL BAR. The range and the machine reach every read.
 *   2. THE CHIP NEEDS BOTH SIDES. No previous period, no chip; the wording
 *      names the range.
 *   3. THE LEGACY PATH (#306 rule 6, ADR-0011): a legacy figure with no days
 *      is approximate at 30d and not measured at 7d and 24h.
 *   4. NEVER MEASURED IS AN INVITATION, and the owner gets the command.
 *   5. THE TABS PACK WITH NO EMPTY CELL, and the word Workflow prints nowhere.
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
import type { UsageRead } from "../copy";
import { TOPIC } from "../items";
import { UsageSection } from "../UsageSection";
import { HOUR, legacyUsage, noDaysUsage, reading, usage } from "./fixture";

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

function setup({
	usage: usageAnswer = usage(),
	workflow = workflowView(),
	isOwner = false,
	stackToolSlugs = ["claude-code", "codex"],
}: {
	usage?: UsageRead | null | undefined | ((args: Args) => UsageRead | null);
	workflow?: WorkflowView | null | undefined | ((args: Args) => WorkflowView);
	isOwner?: boolean;
	stackToolSlugs?: string[];
} = {}) {
	const names = {
		usage: getFunctionName(api.measured.getUsageByStackSlug),
		workflow: getFunctionName(api.workflow.getWorkflowByStackSlug),
		autoSync: getFunctionName(api.autoSync.get),
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
			if (name === names.autoSync)
				return { autoSync: null, lastAutoSyncAt: null };
			return undefined;
		},
	);
	return render(
		<UsageSection
			index={1}
			slug="alp"
			stackId={"stack_1" as never}
			isOwner={isOwner}
			stackToolSlugs={stackToolSlugs}
		/>,
	);
}

const rangeButton = (label: string) =>
	within(screen.getByRole("group", { name: "Range" })).getByRole("button", {
		name: label,
	});

describe("the control bar", () => {
	it("switches the range and hands it to both reads", () => {
		setup();
		expect(rangeButton("30 days").getAttribute("aria-pressed")).toBe("true");
		fireEvent.click(rangeButton("7 days"));
		expect(queryMock).toHaveBeenCalledWith(
			api.measured.getUsageByStackSlug,
			expect.objectContaining({ slug: "alp", range: "7d" }),
		);
		expect(queryMock).toHaveBeenCalledWith(
			api.workflow.getWorkflowByStackSlug,
			expect.objectContaining({ slug: "alp", window: "7d" }),
		);
		expect(rangeButton("7 days").getAttribute("aria-pressed")).toBe("true");
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
	it("reads against the 30 days before", () => {
		setup();
		expect(screen.getAllByTestId("delta")[0]).toHaveTextContent(
			"▲ 20% vs the 30 days before",
		);
	});

	it("reads against the 7 days before and the day before", () => {
		setup({ usage: (args) => usage({}, args.range as "7d") });
		fireEvent.click(rangeButton("7 days"));
		expect(screen.getAllByTestId("delta")[0]).toHaveTextContent(
			"vs the 7 days before",
		);
		fireEvent.click(rangeButton("24 hours"));
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
				current: reading({ totalTokens: 500, sessions: 100 }),
				previous: reading({ totalTokens: 1000, sessions: 100 }),
			}),
		});
		const chips = screen.getAllByTestId("delta");
		expect(chips[0]).toHaveTextContent("▼ 50%");
		expect(chips[0]).toHaveClass("text-fg-muted");
		fireEvent.click(screen.getByRole("tab", { name: /Code/ }));
		const sessions = screen.getByText("Sessions").parentElement;
		expect(
			within(sessions as HTMLElement).getByTestId("delta"),
		).toHaveTextContent("±0% vs the 30 days before");
	});

	it("is absent when the previous period has no rows", () => {
		setup({ usage: usage({ previous: null }) });
		expect(screen.queryByTestId("delta")).not.toBeInTheDocument();
		expect(screen.getByText("1.20B")).toBeInTheDocument();
	});
});

describe("the days path", () => {
	it("leads with the fold's tokens, cost and model rows", () => {
		setup();
		expect(screen.getByText("1.20B")).toBeInTheDocument();
		expect(
			screen.getByText("tokens processed · last 30 days"),
		).toBeInTheDocument();
		expect(
			screen.getByText("300.0M fresh · 900.0M cached"),
		).toBeInTheDocument();
		expect(screen.getByText("≥$1,500")).toBeInTheDocument();
		expect(screen.getByText("Claude Opus 5")).toBeInTheDocument();
		expect(screen.getByText("claude-fable-5")).toBeInTheDocument();
		expect(screen.getByText("60.0%")).toBeInTheDocument();
	});

	it("prints no dollars when cost is not published", () => {
		setup({ usage: usage({ current: reading({ cost: null }) }) });
		expect(screen.getByText("cost not published")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("$");
	});

	it("puts the five stats and the harness rows in their tabs", () => {
		setup();
		fireEvent.click(screen.getByRole("tab", { name: /Code/ }));
		expect(screen.getByText("Sessions")).toBeInTheDocument();
		expect(screen.getByText("120")).toBeInTheDocument();
		expect(screen.getByText("Project workspaces")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("tab", { name: /Harness/ }));
		expect(screen.getByText("Cache hits")).toBeInTheDocument();
		expect(screen.getByText("81%")).toBeInTheDocument();
		const list = screen.getByRole("list", { name: "Harness token shares" });
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
		fireEvent.click(screen.getByRole("tab", { name: /Harness/ }));
		expect(screen.getByText("harness measured")).toBeInTheDocument();
		expect(screen.queryByText("harnesses measured")).not.toBeInTheDocument();
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

		fireEvent.click(screen.getByRole("tab", { name: /Harness/ }));
		const list = screen.getByRole("list", { name: "Harness token shares" });
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
	});
});

describe("the legacy path: one legacy figure, no days", () => {
	it("marks the 30d figure approximate and prints no chip", () => {
		setup({ usage: legacyUsage() });
		expect(screen.getByText("4.27B")).toBeInTheDocument();
		expect(screen.getByText("≥$5,840")).toBeInTheDocument();
		expect(screen.getByText("approximate")).toBeInTheDocument();
		expect(screen.queryByTestId("delta")).not.toBeInTheDocument();
		expect(screen.getByText("22 of 30")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("tab", { name: /Code/ }));
		expect(screen.getByText("382")).toBeInTheDocument();
		expect(screen.queryByText("Project workspaces")).not.toBeInTheDocument();
	});

	it("prints no model rows, because the figure has none", () => {
		setup({ usage: legacyUsage() });
		expect(screen.getByText("waiting for next sync")).toBeInTheDocument();
	});

	it("reads not measured at 7d and 24h, with the stats absent", () => {
		setup({ usage: legacyUsage() });
		fireEvent.click(rangeButton("7 days"));
		expect(screen.getByText("not measured")).toBeInTheDocument();
		expect(screen.queryByText("4.27B")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("tab", { name: /Code/ }));
		expect(screen.queryByText("Sessions")).not.toBeInTheDocument();
		fireEvent.click(rangeButton("24 hours"));
		expect(screen.getByText("not measured")).toBeInTheDocument();
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
		expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
	});

	it("teaches the owner the one command", () => {
		setup({ usage: noDaysUsage(), workflow: null, isOwner: true });
		expect(
			screen.getByText("Your stack has not been measured yet."),
		).toBeInTheDocument();
		expect(screen.getByText("npx @use-aistack/cli sync")).toBeInTheDocument();
		expect(screen.getByText("// auto-sync")).toBeInTheDocument();
	});

	it("says nothing while the reads are still out", () => {
		setup({ usage: undefined, workflow: undefined });
		expect(
			screen.queryByText("This stack has not been measured yet."),
		).not.toBeInTheDocument();
		expect(screen.getByText("Actual Usage")).toBeInTheDocument();
		expect(screen.queryByText("// auto-sync")).not.toBeInTheDocument();
	});

	it("promotes the switch for an owner past 48 hours", () => {
		setup({
			usage: usage({ receivedAt: Date.now() - 3 * 24 * HOUR }),
			isOwner: true,
		});
		expect(
			screen.getByText(/Auto-sync keeps this page current/),
		).toBeInTheDocument();
	});

	it("places the owner switch above section 01", () => {
		setup({ isOwner: true });
		const control = screen.getByText("// auto-sync");
		const heading = screen.getByRole("heading", { name: "Actual Usage" });
		expect(
			control.compareDocumentPosition(heading) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});
});

describe("the tabs", () => {
	it("prints each tab's count and packs every item into a cell", () => {
		setup();
		const tabs = screen.getAllByRole("tab");
		expect(tabs.map((tab) => tab.textContent)).toEqual([
			"Time3",
			"Code4",
			"Models1",
			"Harness3",
			"Skills1",
		]);
		for (const [i, group] of TOPIC.entries()) {
			fireEvent.click(tabs[i]);
			const count = Number(
				within(tabs[i]).getByTestId("tab-count").textContent,
			);
			expect(screen.getAllByTestId("usage-cell")).toHaveLength(count);
			expect(group.id).toBeTruthy();
		}
	});

	it("keeps the template lead above the Time grid", () => {
		setup();
		expect(
			screen.getByText(/Most measured time in these sessions goes to/),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("tab", { name: /Code/ }));
		expect(
			screen.queryByText(/Most measured time in these sessions goes to/),
		).not.toBeInTheDocument();
	});

	it("prints one plain line for an empty tab", () => {
		setup({ usage: usage({ current: null, previous: null }), workflow: null });
		fireEvent.click(screen.getByRole("tab", { name: /Models/ }));
		expect(screen.getByText("No rows in this range.")).toBeInTheDocument();
	});

	it("gives the owner no pin or hide control", () => {
		setup({ workflow: workflowView({ isOwner: true }), isOwner: true });
		expect(screen.queryByRole("button", { name: /pin/i })).toBeNull();
		expect(screen.queryByRole("button", { name: /hide/i })).toBeNull();
	});

	it("never prints the word Workflow", () => {
		const { container } = setup();
		for (const tab of screen.getAllByRole("tab")) {
			fireEvent.click(tab);
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
