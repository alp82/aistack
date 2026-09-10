// @vitest-environment jsdom
/**
 * The Context row (#359): the first row of the Stats accordion, open by
 * default, drawn from the reading #358 folds.
 *
 *   1. IT LEADS AND STARTS OPEN when the server hands a context reading, and
 *      it joins the exclusive set: opening Time closes it.
 *   2. THE HEAD LINE prints the median call in the accent and one share per
 *      harness with a known window.
 *   3. THE GRID IS 200 PLAIN CELLS per harness, filled in the fixed order,
 *      and it server-renders like every other chart.
 *   4. NO READING, NO ROW: the accordion starts at Time as before.
 */
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkflowView } from "@/features/workflow/copy";
import { api } from "../../../../convex/_generated/api";
import { view as workflowView } from "../../workflow/__tests__/fixture";
import { ContextBody } from "../ContextRow";
import { contextOf, waffleCells } from "../context";
import { PAGE_RANGE } from "../copy";
import { UsageSection } from "../UsageSection";
import { contextReading, usage } from "./fixture";

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

/** A workflow answer with the #358 field, typed loosely until it merges. */
function withContext(
	context: ReturnType<typeof contextReading> | null,
): WorkflowView {
	return { ...workflowView(), context } as WorkflowView;
}

function setup(workflow: WorkflowView | null = withContext(contextReading())) {
	const names = {
		usage: getFunctionName(api.measured.getUsageByStackSlug),
		workflow: getFunctionName(api.workflow.getWorkflowByStackSlug),
	};
	queryMock.mockImplementation((ref: Parameters<typeof getFunctionName>[0]) => {
		const name = getFunctionName(ref);
		if (name === names.usage) return usage();
		if (name === names.workflow) return workflow;
		return undefined;
	});
	return render(
		<UsageSection
			index={1}
			slug="alp"
			isOwner={false}
			stackToolSlugs={["claude-code", "codex"]}
			range={PAGE_RANGE}
		/>,
	);
}

const topics = () => screen.getAllByTestId("usage-topic");
const expanded = () =>
	topics().filter((row) => row.getAttribute("aria-expanded") === "true");

describe("the Context row", () => {
	it("leads the accordion and starts open", () => {
		setup();
		const first = topics()[0];
		expect(first.textContent).toMatch(/^Context/);
		expect(topics()[1].textContent).toMatch(/^Time/);
		expect(expanded()).toEqual([first]);
		const region = screen.getByRole("region", { name: /^Context/ });
		expect(region).toHaveAttribute("id", first.getAttribute("aria-controls"));
		expect(within(region).getByTestId("context-body")).toBeInTheDocument();
	});

	it("prints the median call and one share per harness on the head line", () => {
		setup();
		const summary = within(topics()[0]).getByTestId("usage-summary");
		expect(summary.textContent).toBe(
			"118K median call12% of the Claude Code window42% of the Codex window",
		);
		const figures = summary.querySelectorAll("b");
		expect(figures).toHaveLength(3);
		expect(figures[0]).toHaveClass("font-mono", "text-accent-lime");
		expect(figures[1]).toHaveClass("font-mono");
		expect(figures[1]).not.toHaveClass("text-accent-lime");
	});

	it("joins the exclusive set: opening Time closes it, a second click closes it", () => {
		setup();
		const time = topics()[1];
		fireEvent.click(time);
		expect(expanded()).toEqual([time]);
		expect(screen.queryByTestId("context-body")).toBeNull();
		fireEvent.click(topics()[0]);
		expect(expanded()).toEqual([topics()[0]]);
		fireEvent.click(topics()[0]);
		expect(expanded()).toHaveLength(0);
	});

	it("moves focus over the Context row with the arrow keys", () => {
		setup();
		const [context, time] = topics();
		context.focus();
		fireEvent.keyDown(context, { key: "ArrowDown" });
		expect(document.activeElement).toBe(time);
		fireEvent.keyDown(time, { key: "Home" });
		expect(document.activeElement).toBe(context);
		fireEvent.keyDown(context, { key: "ArrowUp" });
		expect(document.activeElement).toBe(topics()[topics().length - 1]);
	});

	it("draws one block per harness with exactly 200 cells and the legend", () => {
		setup();
		const blocks = screen.getAllByTestId("context-harness");
		expect(blocks).toHaveLength(2);
		const waffles = screen.getAllByRole("img");
		expect(waffles).toHaveLength(2);
		for (const waffle of waffles) {
			expect(waffle.querySelectorAll("span")).toHaveLength(200);
		}
		expect(waffles[0]).toHaveAttribute(
			"aria-label",
			"Claude Code: a typical call uses 118K of a 1.0M window",
		);
		expect(waffles[1]).toHaveAttribute(
			"aria-label",
			"Codex: a typical call uses 109K of a 258K window",
		);
		const claude = blocks[0];
		expect(claude.textContent).toContain("of 1.0M · 12% full · 15,683 calls");
		const legend = within(claude).getByTestId("context-legend");
		expect(legend.textContent).toBe(
			"harness19K1.9%instructions25K2.5%usual chat74K7.4%long chat217K21.7%free882K88.2%",
		);
		expect(
			within(legend).getByTitle(/system prompt and tool definitions/),
		).toBeInTheDocument();
		expect(
			within(legend).getByTitle(/CLAUDE\.md, memory, skills/),
		).toBeInTheDocument();
		expect(
			within(legend).getByTitle(/1 in 10 chats grow past this/),
		).toBeInTheDocument();
	});

	it("fills the grid in order: harness, instructions, usual chat, long chat, free", () => {
		const cells = waffleCells(contextReading().harnesses[0], 1_000_000);
		expect(cells).toHaveLength(200);
		const runs = cells.reduce<[string, number][]>((acc, cell) => {
			const last = acc[acc.length - 1];
			if (last && last[0] === cell) last[1] += 1;
			else acc.push([cell, 1]);
			return acc;
		}, []);
		expect(runs).toEqual([
			["harness", 4],
			["instructions", 5],
			["usualChat", 15],
			["longChat", 28],
			["free", 148],
		]);
		expect(waffleCells(contextReading().harnesses[1], 258_400)).toHaveLength(
			200,
		);
	});

	it("server-renders the grid as plain spans", () => {
		const html = renderToString(<ContextBody context={contextReading()} />);
		expect(html.match(/role="img"/g)).toHaveLength(2);
		expect(html.match(/data-cell="/g)).toHaveLength(400);
		expect(html).not.toContain("<svg");
	});

	it("drops the share and the grid for a harness with no known window", () => {
		const reading = contextReading();
		reading.harnesses[1].window = null;
		setup(withContext(reading));
		const summary = within(topics()[0]).getByTestId("usage-summary");
		expect(summary.textContent).toBe(
			"118K median call12% of the Claude Code window",
		);
		expect(screen.getAllByRole("img")).toHaveLength(1);
		const codex = screen.getAllByTestId("context-harness")[1];
		expect(codex.textContent).toContain("150,881 calls");
		expect(codex.textContent).not.toContain("full");
		expect(within(codex).queryByText("free")).toBeNull();
	});

	it("is absent when the reading has no context, and the accordion starts closed", () => {
		setup(withContext(null));
		expect(topics()[0].textContent).toMatch(/^Time/);
		expect(screen.queryByTestId("context-body")).toBeNull();
		expect(expanded()).toHaveLength(0);
		expect(screen.queryByRole("region")).toBeNull();
	});

	it("is absent when the field is missing or the harness list is empty", () => {
		expect(contextOf(workflowView())).toBeNull();
		expect(contextOf({ context: { harnesses: [] } })).toBeNull();
		expect(contextOf(null)).toBeNull();
		expect(contextOf(undefined)).toBeNull();
		setup({ ...workflowView(), context: { harnesses: [] } } as WorkflowView);
		expect(topics()[0].textContent).toMatch(/^Time/);
	});
});

it("renders Grok's retained-call map without claiming an unmeasured split", () => {
	const h = {
		...contextReading().harnesses[0],
		harness: "grok-build",
		window: 256000,
		breakdownAvailable: false,
		retainedCallsOnly: true,
		harnessTokens: 0,
		instructionsTokens: 0,
	};
	render(<ContextBody context={{ harnesses: [h] }} />);
	expect(screen.getByTestId("context-waffle").children).toHaveLength(200);
	expect(screen.getByText("Grok Build")).toBeTruthy();
	expect(screen.getByText(/Some calls may be missing/)).toBeTruthy();
	expect(
		screen.getByText("Harness and instructions breakdown unavailable."),
	).toBeTruthy();
	const legend = within(screen.getByTestId("context-legend"));
	expect(legend.queryByText("harness")).toBeNull();
	expect(legend.queryByText("instructions")).toBeNull();
	expect(legend.getByText("median call")).toBeTruthy();
});
