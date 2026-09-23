// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../../../../convex/_generated/api";
import type { UsageRead } from "../copy";
import type { StatsRead } from "../stats";
import { UsageSection } from "../UsageSection";
import { contextReading, noDaysUsage, reading, usage } from "./fixture";
import { stats } from "./stats-fixture";

const queryMock = vi.fn();
vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
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
function setup(
	u: UsageRead | null | undefined = usage(),
	s: StatsRead | null | undefined = stats(),
	owner = false,
) {
	queryMock.mockImplementation((ref: Parameters<typeof getFunctionName>[0]) =>
		getFunctionName(ref).startsWith("measured:") ? u : s,
	);
	return render(
		<UsageSection
			index={1}
			slug="alp"
			isOwner={owner}
			stackToolSlugs={[]}
			range="30d"
		/>,
	);
}
it("requests the fixed window and automatic scope with no machine or topic controls", () => {
	setup(
		usage({
			machines: [
				{ machine: "SECRET desktop", machineOrdinal: 1 },
				{ machine: "SECRET laptop", machineOrdinal: 2 },
			],
		}),
	);
	expect(queryMock).toHaveBeenCalledWith(api.measured.getUsageByStackSlug, {
		slug: "alp",
		range: "30d",
	});
	expect(queryMock).toHaveBeenCalledWith(api.workflow.getStatsByStackSlug, {
		slug: "alp",
	});
	expect(screen.queryByRole("combobox")).toBeNull();
	expect(document.body.textContent).not.toMatch(
		/SECRET|Workflow|Thinking|Project workspaces/,
	);
	expect(screen.queryByTestId("usage-topic")).toBeNull();
	expect(screen.getByText("8-16 min")).toBeInTheDocument();
	expect(screen.getByText("was 4-8 min")).toBeInTheDocument();
});
it("has independent additional-model, routing, hourly, and pricing disclosures", () => {
	const models = Array.from({ length: 6 }, (_, i) => ({
		...reading().models[0],
		id: `model-${i}`,
		catalogName: `Model ${i}`,
		totalTokens: 100,
		tokenShare: 1 / 6,
	}));
	setup(
		usage({ current: reading({ models }) }),
		stats({
			routing: { main: [], subagents: [{ model: "model-0", tokens: 10 }] },
			activity: [{ weekdayUtc: 1, hourUtc: 12, events: 10 }],
		}),
	);
	const more = screen.getByText("2 more models").closest("details");
	const routing = screen.getByText(/Subagent routing ·/).closest("details");
	const hourly = screen.getByText("every hour").closest("details");
	expect(more).not.toHaveAttribute("open");
	expect(routing).not.toHaveAttribute("open");
	fireEvent.click(screen.getByText("2 more models"));
	expect(more).toHaveAttribute("open");
	expect(routing).not.toHaveAttribute("open");
	fireEvent.click(screen.getByText(/Subagent routing ·/));
	expect(routing).toHaveAttribute("open");
	expect(hourly).not.toHaveAttribute("open");
	const sources = screen.getByText(/Price tables:/);
	expect(sources).toHaveTextContent("pricing/2026-08");
	expect(
		screen.getByText(/API list prices · 100.0% covered/),
	).toBeInTheDocument();
});
it("keeps context visible and suppresses unsupported sparse blocks", () => {
	setup(
		usage({ current: reading({ harnesses: [reading().harnesses[0]] }) }),
		stats({
			context: contextReading(),
			medianSession: { current: null, previous: null },
		}),
	);
	const context = screen.getByRole("region", { name: "Context per call" });
	expect(within(context).getAllByRole("img").length).toBeGreaterThan(0);
	expect(context.closest("details")).toBeNull();
	for (const title of [
		"Harnesses",
		"The week",
		"Languages",
		"Lines changed",
		"Where the time goes",
	])
		expect(screen.queryByRole("region", { name: title })).toBeNull();
	expect(screen.queryByText("median session")).toBeNull();
});
it("honors unavailable workflow and cost readings", () => {
	setup(usage({ current: reading({ cost: null }) }), null);
	expect(document.body.textContent).not.toContain("$");
	expect(screen.queryByText("median session")).toBeNull();
	expect(screen.queryByRole("region", { name: "Context per call" })).toBeNull();
});
it("renders inventory without usage and never invents counts or percentages", () => {
	setup(
		noDaysUsage(),
		stats({
			medianSession: { current: null, previous: null },
			inventory: {
				...stats().inventory,
				skills: {
					totalCalls: null,
					withheldNames: 2,
					atoms: [
						{
							name: "unknown-count",
							knownCalls: 0,
							countsComplete: false,
							callShare: null,
						},
						{
							name: "partial-count",
							knownCalls: 3,
							countsComplete: false,
							callShare: null,
						},
					],
				},
			},
		}),
	);
	const block = screen.getByRole("region", { name: "Skills" });
	expect(block.textContent).toContain("unknown-count");
	expect(block.textContent).toContain("≥3×");
	expect(block.textContent).not.toMatch(/0×|%/);
	expect(screen.queryByText(/has not been measured yet/)).toBeNull();
});
it("waits for both reads before inviting the owner or visitor", () => {
	setup(noDaysUsage(), undefined);
	expect(screen.queryByText(/has not been measured yet/)).toBeNull();
	cleanup();
	setup(noDaysUsage(), null);
	expect(
		screen.getByText("This stack has not been measured yet."),
	).toBeInTheDocument();
	cleanup();
	setup(noDaysUsage(), null, true);
	expect(
		screen.getByText("Your stack has not been measured yet."),
	).toBeInTheDocument();
});
it("keeps real zero comparisons and never turns a missing range into zero", () => {
	setup(
		usage({ previous: reading({ sessions: 0 }) }),
		stats({
			medianSession: {
				current: { low: 0, high: 1, sessions: 20 },
				previous: null,
			},
		}),
	);
	expect(screen.getByText("was 0")).toBeInTheDocument();
	expect(screen.getByText("0-1 min")).toBeInTheDocument();
	expect(screen.queryByText("was 0-1 min")).toBeNull();
});
it("renders loader readings before the live query and honors a later null", () => {
	queryMock.mockReturnValue(undefined);
	const props = {
		index: 1,
		slug: "alp",
		isOwner: false,
		stackToolSlugs: [],
		range: "30d" as const,
		initialUsage: usage(),
		initialStats: stats(),
	};
	const { rerender } = render(<UsageSection {...props} />);
	expect(screen.getByText("8-16 min")).toBeInTheDocument();
	queryMock.mockReturnValue(null);
	rerender(<UsageSection {...props} />);
	expect(screen.queryByText("8-16 min")).toBeNull();
	expect(
		screen.getByText("This stack has not been measured yet."),
	).toBeInTheDocument();
});
