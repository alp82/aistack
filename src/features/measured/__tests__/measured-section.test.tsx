// @vitest-environment jsdom
/**
 * Journey section 01 - "Actual Usage", now living (#81, building #80's variant
 * I over the #46 section).
 *
 * The decisions these tests guard, rather than layout:
 *
 *   1. TOKENS LEAD, SPEND SITS UNDER THEM. Spend is optional by design
 *      (`publishCost`), and a page whose headline can vanish is a page that
 *      changes shape per stack.
 *   2. NO SNAPSHOT IS AN INVITATION, not a demerit. Almost every stack is in
 *      that state.
 *   3. POSITIVE CLAIMS ONLY (#40): nothing here may say a listed thing went
 *      unused.
 *   4. A DOLLAR FIGURE NEVER RENDERS WHEN NO PRICING TABLE CITES IT.
 *   5. THE PAGE RENDERS WHOLE WITHOUT ITS HISTORY. The series adds the trail,
 *      the notch and the delta; it is never what makes the section readable.
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
import { MeasuredSection } from "@/features/measured/MeasuredSection";
import { api } from "../../../../convex/_generated/api";
import type { AutoSyncFlag } from "../autoSync";
import type { MeasuredSnapshot } from "../copy";
import type { MeasuredHistory } from "../history";
import { HOUR } from "./fixture";
import { buildHistory, currentFromHistory } from "./history.fixture";

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

function setup(
	snapshot: MeasuredSnapshot | null | undefined,
	history: MeasuredHistory | null | undefined = null,
	{
		isOwner = false,
		autoSync = { autoSync: null, lastAutoSyncAt: null },
		selected,
	}: {
		isOwner?: boolean;
		autoSync?: AutoSyncFlag;
		selected?: {
			machineOrdinal: number;
			snapshot: MeasuredSnapshot;
			history: MeasuredHistory;
		};
	} = {},
) {
	const currentRef = getFunctionName(api.measured.getCurrentByStackSlug);
	const historyRef = getFunctionName(api.measured.getHistoryByStackSlug);
	const autoSyncRef = getFunctionName(api.autoSync.get);
	queryMock.mockImplementation(
		(
			ref: Parameters<typeof getFunctionName>[0],
			args: { machineOrdinal?: number },
		) => {
			const name = getFunctionName(ref);
			if (name === historyRef) {
				return selected && args.machineOrdinal === selected.machineOrdinal
					? selected.history
					: history;
			}
			if (name === autoSyncRef) return autoSync;
			if (
				selected &&
				name === currentRef &&
				args.machineOrdinal === selected.machineOrdinal
			) {
				return selected.snapshot;
			}
			return snapshot;
		},
	);
	return render(
		<MeasuredSection
			index={1}
			slug="alps-stack-ab12"
			stackId={"stack_ab12" as never}
			isOwner={isOwner}
			stackToolSlugs={["claude-code"]}
		/>,
	);
}

/** The real seven readings, and the current reading that goes with them. */
function live(options: Parameters<typeof buildHistory>[0] = {}) {
	const history = buildHistory(options);
	return { history, current: currentFromHistory(history) };
}

describe("the reading", () => {
	it("narrows the whole reading through the machine dropdown", () => {
		const all = live();
		const workstation = live({ claudeCodeOnly: true });
		const now = Date.now();
		const allCurrent = {
			...all.current,
			harnesses: all.current.harnesses.map((h, index) => ({
				...h,
				machine: index === 0 ? "workstation" : null,
				machineOrdinal: index + 1,
				receivedAt: now - (index === 0 ? HOUR : 3 * HOUR),
			})),
		};
		const workstationCurrent = {
			...workstation.current,
			harnesses: workstation.current.harnesses.map((h) => ({
				...h,
				machine: "workstation",
				machineOrdinal: 1,
				receivedAt: now - HOUR,
			})),
		};

		setup(allCurrent, all.history, {
			selected: {
				machineOrdinal: 1,
				snapshot: workstationCurrent,
				history: workstation.history,
			},
		});

		const trigger = screen.getByRole("button", { name: /machine/i });
		expect(trigger).toHaveTextContent("all machines");
		fireEvent.click(trigger);
		fireEvent.click(screen.getByRole("option", { name: /workstation/i }));

		expect(trigger).toHaveTextContent("workstation");
		expect(screen.getByText("4.70B")).toBeInTheDocument();
		expect(screen.getByText("≥$6,014")).toBeInTheDocument();
		expect(screen.queryByText("GPT-5.5")).not.toBeInTheDocument();
		expect(screen.getByText("554")).toBeInTheDocument();
		expect(
			screen.queryByRole("list", { name: "Harness token shares" }),
		).not.toBeInTheDocument();
		expect(queryMock).toHaveBeenCalledWith(api.measured.getCurrentByStackSlug, {
			slug: "alps-stack-ab12",
			machineOrdinal: 1,
		});
		expect(queryMock).toHaveBeenCalledWith(api.measured.getHistoryByStackSlug, {
			slug: "alps-stack-ab12",
			machineOrdinal: 1,
		});
	});

	it("clears the narrowed reading when navigation changes the stack", () => {
		const first = live();
		const second = live({ claudeCodeOnly: true });
		const firstCurrent = {
			...first.current,
			harnesses: first.current.harnesses.map((h, index) => ({
				...h,
				machine: `machine ${index + 1}`,
				machineOrdinal: index + 1,
			})),
		};
		const secondCurrent = {
			...second.current,
			harnesses: first.current.harnesses.map((h, index) => ({
				...h,
				machine: null,
				machineOrdinal: index + 1,
			})),
		};
		const currentRef = getFunctionName(api.measured.getCurrentByStackSlug);
		const historyRef = getFunctionName(api.measured.getHistoryByStackSlug);
		queryMock.mockImplementation(
			(ref: Parameters<typeof getFunctionName>[0], args: { slug?: string }) => {
				const name = getFunctionName(ref);
				if (name === currentRef) {
					return args.slug === "second-stack" ? secondCurrent : firstCurrent;
				}
				if (name === historyRef) {
					return args.slug === "second-stack" ? second.history : first.history;
				}
				return { autoSync: null, lastAutoSyncAt: null };
			},
		);
		const view = render(
			<MeasuredSection
				index={1}
				slug="first-stack"
				stackId={"stack_ab12" as never}
				isOwner={false}
				stackToolSlugs={["claude-code"]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /machine/i }));
		fireEvent.click(screen.getByRole("option", { name: /machine 1/i }));
		queryMock.mockClear();
		view.rerender(
			<MeasuredSection
				index={1}
				slug="second-stack"
				stackId={"stack_cd34" as never}
				isOwner={false}
				stackToolSlugs={["claude-code"]}
			/>,
		);

		expect(screen.getByRole("button", { name: /machine/i })).toHaveTextContent(
			"all machines",
		);
		expect(queryMock).not.toHaveBeenCalledWith(
			api.measured.getCurrentByStackSlug,
			{ slug: "second-stack", machineOrdinal: 1 },
		);
	});

	it("lists each machine with its gated label, tokens, and reading time", () => {
		const { current, history } = live();
		const now = Date.now();
		setup(
			{
				...current,
				harnesses: current.harnesses.map((h, index) => ({
					...h,
					machine: index === 0 ? "workstation" : null,
					machineOrdinal: index + 1,
					receivedAt: now - (index === 0 ? HOUR : 3 * HOUR),
				})),
			},
			history,
		);

		fireEvent.click(screen.getByRole("button", { name: /machine/i }));

		expect(
			screen.getByRole("option", {
				name: /workstation.*4\.70B.*read 1h ago/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", {
				name: /machine 2.*8\.4M.*read 3h ago/i,
			}),
		).toBeInTheDocument();
	});

	it("moves checked freshness to the model mix and follows the selected machine", () => {
		const { current, history } = live();
		const now = Date.now();
		const harnesses = current.harnesses.map((h, index) => ({
			...h,
			machine: null,
			machineOrdinal: index + 1,
			receivedAt: now - (index === 0 ? HOUR : 3 * HOUR),
		}));
		setup({ ...current, receivedAt: now - HOUR, harnesses }, history, {
			selected: {
				machineOrdinal: 2,
				snapshot: {
					...current,
					receivedAt: now - 3 * HOUR,
					harnesses: [harnesses[1]],
				},
				history,
			},
		});

		expect(screen.getByText("checked 1h ago")).toBeInTheDocument();
		expect(
			screen.queryByText(/the notch marks where each share stood on/),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /machine/i }));
		fireEvent.click(screen.getByRole("option", { name: /machine 2/i }));
		expect(screen.getByText("checked 3h ago")).toBeInTheDocument();
	});

	it("lists each harness share between the models and stats", () => {
		const { current, history } = live();
		setup(
			{
				...current,
				harnesses: current.harnesses.map((h) => ({
					...h,
					machineOrdinal: 1,
				})),
			},
			history,
		);

		const list = screen.getByRole("list", { name: "Harness token shares" });
		expect(
			screen.queryByRole("button", { name: /machine/i }),
		).not.toBeInTheDocument();
		expect(within(list).getByText("Claude Code")).toBeInTheDocument();
		expect(within(list).getByText("99.8%")).toBeInTheDocument();
		expect(within(list).getByText("4.70B")).toBeInTheDocument();
		expect(within(list).getByText("Codex")).toBeInTheDocument();
		expect(within(list).getByText("0.2%")).toBeInTheDocument();
		expect(within(list).getByText("8.4M")).toBeInTheDocument();
		expect(
			list.compareDocumentPosition(screen.getByText("sessions")) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("uses a neutral source ramp for machines and harnesses", () => {
		const { current, history } = live();
		setup(
			{
				...current,
				harnesses: current.harnesses.map((h, index) => ({
					...h,
					machine: null,
					machineOrdinal: index + 1,
				})),
			},
			history,
		);
		fireEvent.click(screen.getByRole("button", { name: /machine/i }));

		const paints = screen
			.getAllByTestId("source-paint")
			.map((mark) => mark.style.background);
		expect(paints).toContain("var(--source-1)");
		expect(paints).toContain("var(--source-2)");
		expect(paints.every((paint) => !paint.includes("--chart-"))).toBe(true);
		expect(paints.every((paint) => !paint.includes("--accent-"))).toBe(true);
	});

	it("keeps a single-machine, single-harness reading unchanged", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);

		expect(
			screen.queryByRole("button", { name: /machine/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("list", { name: "Harness token shares" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("checked 2h ago")).toBeInTheDocument();
		expect(
			screen.getByText(/the notch marks where each share stood on/),
		).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("(max)");
	});

	it("closes the machine list with Escape and returns focus", () => {
		const { current, history } = live();
		setup(
			{
				...current,
				harnesses: current.harnesses.map((h, index) => ({
					...h,
					machineOrdinal: index + 1,
				})),
			},
			history,
		);
		const trigger = screen.getByRole("button", { name: /machine/i });
		fireEvent.click(trigger);
		fireEvent.keyDown(trigger, { key: "Escape" });

		expect(
			screen.queryByRole("listbox", { name: /machine/i }),
		).not.toBeInTheDocument();
		expect(trigger).toHaveFocus();
	});

	it("keeps the machine control visible in a wrapping mobile header", () => {
		const { current, history } = live();
		setup(
			{
				...current,
				harnesses: current.harnesses.map((h, index) => ({
					...h,
					machineOrdinal: index + 1,
				})),
			},
			history,
		);
		const trigger = screen.getByRole("button", { name: /machine/i });
		const meta = trigger.parentElement?.parentElement;

		expect(meta).not.toHaveClass("hidden");
		expect(meta?.parentElement).toHaveClass("flex-wrap");
	});

	it("leads with tokens and puts a lower-bound spend underneath", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(screen.getByText("4.70B")).toBeInTheDocument();
		expect(screen.getByText("tokens · last 30 days")).toBeInTheDocument();
		expect(screen.getByText("≥$6,014")).toBeInTheDocument();
		expect(
			screen.getByText("at least, at api list prices"),
		).toBeInTheDocument();
	});

	it("reads as complete on a stack that publishes no cost", () => {
		const { current, history } = live({ withoutCost: true });
		setup(current, history);
		expect(screen.getByText("4.71B")).toBeInTheDocument();
		expect(screen.getByText("cost not published")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("$");
	});

	it("prints no dollars at all when no table cites them", () => {
		// The per-model column has to go too, not just the headline. A cost block
		// that names no table is the one shape that must never reach the page:
		// a price the reader cannot date is a price we do not print.
		const { current, history } = live({ claudeCodeOnly: true });
		setup(
			{
				...current,
				pricingTable: null,
				cost: current.cost && { ...current.cost, pricingTables: [] },
			},
			history,
		);
		expect(document.body.textContent).not.toContain("$");
		expect(screen.getByText("4.70B")).toBeInTheDocument();
	});

	it("shows the model split, raw vendor id and all", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(screen.getByText("claude-fable-5")).toBeInTheDocument();
		expect(screen.getByText("Claude Opus 5")).toBeInTheDocument();
		expect(screen.getByText("40.1%")).toBeInTheDocument();
	});

	it("shows the activity stats", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(screen.getByText("554")).toBeInTheDocument();
		expect(screen.getByText("23 of 30")).toBeInTheDocument();
	});

	it("shows exact activity without qualification", () => {
		const { current, history } = live();
		setup(
			{
				...current,
				activity: {
					...current.activity,
					activeDays: { ...current.activity.activeDays, precision: "exact" },
					projects: { ...current.activity.projects, precision: "exact" },
				},
			},
			history,
		);
		expect(screen.getByText("active days")).toBeInTheDocument();
		expect(screen.getByText("12")).toBeInTheDocument();
		expect(screen.getByText("project workspaces")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("(at least)");
	});

	it("qualifies activity when legacy rows make it a lower bound", () => {
		const { current, history } = live();
		setup(current, history);
		expect(screen.getByText("active days (at least)")).toBeInTheDocument();
		expect(
			screen.getByText("project workspaces (at least)"),
		).toBeInTheDocument();
	});

	it("says how long ago the machine was read, from the server clock", () => {
		const { current, history } = live();
		setup(current, history);
		expect(screen.getByText("checked 2h ago")).toBeInTheDocument();
	});
});

describe("the page moving", () => {
	it("reports a fall as a fall, in plain words", () => {
		// The window forgets its far end, so a quiet week lowers the reading. That
		// is not a fault and the page must not dress it as one.
		const { current, history } = live({ readings: 5, claudeCodeOnly: true });
		setup(current, history);
		expect(
			screen.getByText(/−177.4M since the last check/),
		).toBeInTheDocument();
	});

	it("marks where each model's share started once there are two readings", () => {
		const { current, history } = live({ claudeCodeOnly: true });
		setup(current, history);
		expect(
			screen.getByText(/the notch marks where each share stood on/),
		).toBeInTheDocument();
		expect(screen.getAllByTestId("share-notch").length).toBeGreaterThan(0);
	});

	it("draws no notch and no delta on a stack that has synced once", () => {
		const { current, history } = live({ readings: 1, claudeCodeOnly: true });
		setup(current, history);
		expect(screen.queryByTestId("share-notch")).not.toBeInTheDocument();
		expect(document.body.textContent).not.toContain("since the last check");
		// The reading itself is still the whole section.
		expect(screen.getByText("4.69B")).toBeInTheDocument();
	});

	it("renders whole while the series is still out", () => {
		const { current } = live();
		setup(current, undefined);
		expect(screen.getByText("4.71B")).toBeInTheDocument();
		expect(screen.getByText("Claude Opus 5")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("readings since");
	});
});

describe("the fun-fact deck", () => {
	it("offers another way to picture the number, without hiding the caption", () => {
		const { current, history } = live();
		setup(current, history);
		const deal = screen.getByRole("button", {
			name: /another way to picture/i,
		});
		expect(screen.getByText("tokens · last 30 days")).toBeInTheDocument();
		// Clicking deals the next framing. The card itself is a hover surface, so
		// what this asserts is that the control exists and stays quiet.
		fireEvent.click(deal);
		expect(screen.getByText("tokens · last 30 days")).toBeInTheDocument();
	});
});

/**
 * The page's age (#108, cut down again in the declutter pass). The header's
 * "checked Nh ago" is the one age claim every reader gets; past 48 hours the
 * owner's remedy is the auto-sync switch, promoted above the reading.
 */
describe("how old the reading is", () => {
	function aged(ageMs: number, options: { isOwner?: boolean } = {}) {
		const { current, history } = live({ claudeCodeOnly: true });
		const receivedAt = Date.now() - ageMs;
		setup(
			{
				...current,
				receivedAt,
				harnesses: current.harnesses.map((h) => ({ ...h, receivedAt })),
			},
			history,
			options,
		);
	}

	// The stamp under the headline number is gone: the header's "checked" line
	// already dates the reading, and two ages for one sync taught nobody
	// anything.
	it("carries no age stamp under the number", () => {
		aged(3 * 24 * HOUR);
		expect(document.body.textContent).not.toContain("-day window");
		expect(document.body.textContent).not.toContain("days ago ·");
	});

	// #107 decision 2 deleted it. Three windows for one sync taught nobody
	// anything, and the leaderboard keeps 7 days because it ranks rows (#82).
	it("carries no per-harness going-stale line any more", () => {
		aged(19 * 24 * HOUR);
		expect(document.body.textContent).not.toContain("going stale");
	});

	it("never says stale, to anyone", () => {
		aged(19 * 24 * HOUR, { isOwner: true });
		expect(document.body.textContent?.toLowerCase()).not.toContain("stale");
	});

	// The visitor reads the age in the header and no sentence about it, so the
	// page never sells them a fix they cannot apply.
	it("gives a visitor no remedy", () => {
		aged(3 * 24 * HOUR);
		expect(document.body.textContent).not.toContain("keeps this page current");
	});

	it("promotes the switch for an owner, and asks once", () => {
		aged(3 * 24 * HOUR, { isOwner: true });
		expect(
			screen.getByText(/Auto-sync keeps this page current/),
		).toBeInTheDocument();
		expect(
			screen.getAllByText("npx @use-aistack/cli sync --auto on"),
		).toHaveLength(1);
	});

	it("leaves the switch resting for an owner inside 48 hours", () => {
		aged(5 * HOUR, { isOwner: true });
		expect(screen.getByText("// auto-sync")).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("keeps this page current");
	});
});

describe("a stack that has never synced, seen by a visitor", () => {
	it("invites the reader instead of marking the author down", () => {
		setup(null);
		expect(
			screen.getByText("This stack has not been measured yet."),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Stacks can publish what actually ran/),
		).toBeInTheDocument();
		expect(screen.getByText("Actual Usage")).toBeInTheDocument();
		expect(screen.getByText("01")).toBeInTheDocument();
	});

	it("hands the reader the command for their own stack, and the guide", () => {
		setup(null);
		expect(screen.getByText(/have a stack of your own/)).toBeInTheDocument();
		expect(screen.getByText("npx @use-aistack/cli sync")).toBeInTheDocument();
		expect(
			screen.getByText("how measuring works").closest("a"),
		).toHaveAttribute("href", "/sync");
	});

	it("says nothing at all while the query is still out", () => {
		setup(undefined, undefined);
		expect(
			screen.queryByText("This stack has not been measured yet."),
		).not.toBeInTheDocument();
		expect(screen.getByText("Actual Usage")).toBeInTheDocument();
	});
});

describe("a stack that has never synced, seen by its owner", () => {
	it("teaches the one command inline", () => {
		setup(null, null, { isOwner: true });
		expect(
			screen.getByText("Your stack has not been measured yet."),
		).toBeInTheDocument();
		expect(screen.getByText("npx @use-aistack/cli sync")).toBeInTheDocument();
		expect(
			screen.queryByText("npx @use-aistack/cli login"),
		).not.toBeInTheDocument();
	});

	it("states the privacy footnote and links the guide", () => {
		setup(null, null, { isOwner: true });
		expect(
			screen.getByText(
				"runs on your machine · you see everything before it sends · cancel sends nothing",
			),
		).toBeInTheDocument();
		expect(screen.getByText("how syncing works").closest("a")).toHaveAttribute(
			"href",
			"/sync",
		);
	});

	// A stack that never synced is NOT a late stack - it may be hand-curated and
	// complete - so this box carries no age and no warning (#107 decision 3).
	it("carries no age and no warning", () => {
		setup(null, null, { isOwner: true });
		const text = (document.body.textContent ?? "").toLowerCase();
		expect(text).not.toContain("stale");
		expect(text).not.toContain("days ago");
		expect(text).not.toContain("-day window");
	});

	// It cannot offer the switch as the fix either: `enableAutoSync` refuses a
	// machine that is not linked yet. One line, and the one command above it.
	it("says what becomes possible after the first sync", () => {
		setup(null, null, { isOwner: true });
		expect(
			screen.getByText(
				"After that first sync, this stack can keep itself current on a schedule.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText("npx @use-aistack/cli sync --auto on"),
		).not.toBeInTheDocument();
	});

	it("shows the reading, not the teaching box, once a snapshot exists", () => {
		const { current, history } = live();
		setup(current, history, { isOwner: true });
		expect(
			screen.queryByText("Your stack has not been measured yet."),
		).not.toBeInTheDocument();
		expect(screen.getByText("4.71B")).toBeInTheDocument();
	});
});

/**
 * The auto-sync switch (#104) lives in the owner box, inside the section it
 * governs: automation is what keeps this reading arriving.
 */
describe("the auto-sync switch", () => {
	it("reaches the owner of a stack that has readings", () => {
		const { current, history } = live();
		setup(current, history, { isOwner: true });
		expect(screen.getByText("// auto-sync")).toBeInTheDocument();
	});

	// The switch is the fix for a stack with no readings, so it must not wait
	// for the readings it exists to produce.
	it("reaches the owner of a stack that has none", () => {
		setup(null, null, { isOwner: true });
		expect(screen.getByText("// auto-sync")).toBeInTheDocument();
	});

	it("is absent for a visitor", () => {
		const { current, history } = live();
		setup(current, history);
		expect(screen.queryByText("// auto-sync")).not.toBeInTheDocument();
	});

	// Which side of the reading it sits on is the snapshot's answer, so it waits
	// for that answer rather than drawing below and jumping above when the query
	// lands. A null snapshot IS an answer - #104 keeps the box there.
	it("waits for the snapshot query before it takes a side", () => {
		setup(undefined, undefined, { isOwner: true });
		expect(screen.queryByText("// auto-sync")).not.toBeInTheDocument();
	});
});

describe("positive claims only", () => {
	it("never says a listed thing went unused", () => {
		const { current, history } = live();
		setup(current, history);
		const text = (document.body.textContent ?? "").toLowerCase();
		for (const banned of [
			"not seen",
			"listed, but",
			"unused",
			"never used",
			"no longer",
		]) {
			expect(text).not.toContain(banned);
		}
	});
});
