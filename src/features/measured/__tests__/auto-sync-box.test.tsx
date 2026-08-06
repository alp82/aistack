// @vitest-environment jsdom
/**
 * The auto-sync switch in the owner box (#104, map #76).
 *
 * The decisions these tests guard, rather than layout:
 *
 *   1. STRICTLY OWNER-ONLY. The pair says when this person's machines run — a
 *      schedule nobody else has a reason to read. A visitor's render carries no
 *      box, and the query is never even asked.
 *   2. THREE HONEST STATES, from the pair and not from the flag alone. On with
 *      no stamp says so and names the one command that closes it.
 *   3. AN UNANSWERED QUERY IS NOT OFF. Drawing "off" before the server has
 *      spoken tells the owner their automation is revoked when it is running.
 *   4. OFF IS A COMPLETE REVOKE, and the box says what that leaves behind:
 *      hooks on machines keep firing and publish nothing (#103).
 *   5. THE INTERVAL RIDES WITH THE FLAG. Editing it never turns automation off.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../convex/_generated/api";
import { AutoSyncBox } from "../AutoSyncBox";
import type { AutoSyncFlag } from "../autoSync";

type SetArgs = {
	stackId: string;
	enabled: boolean;
	frequencyHours?: number;
};

const queryMock = vi.fn();
const setMock = vi.fn((_args: SetArgs) => Promise.resolve());

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
	useMutation: () => setMock,
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

const STACK_ID = "stack_abc" as never;

function setup(
	flag: AutoSyncFlag | undefined,
	{
		isOwner = true,
		staleSince = null,
	}: { isOwner?: boolean; staleSince?: number | null } = {},
) {
	queryMock.mockReturnValue(flag);
	render(
		<AutoSyncBox
			stackId={STACK_ID}
			isOwner={isOwner}
			staleSince={staleSince}
		/>,
	);
}

const THREE_DAYS_AGO = Date.now() - 3 * 24 * 60 * 60 * 1000;

/** The last argument the switch handed `autoSync.set`. */
function lastSet(): SetArgs | undefined {
	return setMock.mock.calls.at(-1)?.[0];
}

describe("the owner gate", () => {
	it("renders nothing for a visitor", () => {
		setup(
			{ autoSync: { enabled: true, frequencyHours: 24 }, lastAutoSyncAt: 1 },
			{
				isOwner: false,
			},
		);
		expect(screen.queryByText(/auto-sync/i)).toBeNull();
	});

	it("never asks for the schedule as a visitor", () => {
		setup(undefined, { isOwner: false });
		expect(queryMock).toHaveBeenCalledWith(expect.anything(), "skip");
	});

	it("asks for this stack's schedule as the owner", () => {
		setup(undefined);
		const [ref, args] = queryMock.mock.calls[0];
		expect(getFunctionName(ref)).toBe(getFunctionName(api.autoSync.get));
		expect(args).toEqual({ stackId: STACK_ID });
	});

	it("renders nothing until the query has answered", () => {
		setup(undefined);
		expect(screen.queryByText(/auto-sync/i)).toBeNull();
	});
});

describe("the three states", () => {
	it("draws off for a stack no owner has decided on", () => {
		setup({ autoSync: null, lastAutoSyncAt: null });
		expect(screen.getByText(/auto-sync/i)).toBeTruthy();
		expect(
			screen.getByText(/only a sync you run yourself publishes/i),
		).toBeTruthy();
	});

	it("says a revoke leaves stale hooks publishing nothing", () => {
		setup({
			autoSync: { enabled: false, frequencyHours: 24 },
			lastAutoSyncAt: 1,
		});
		expect(screen.getByText(/publish nothing/i)).toBeTruthy();
	});

	it("dates the last automatic sync when one has fired", () => {
		setup({
			autoSync: { enabled: true, frequencyHours: 24 },
			lastAutoSyncAt: Date.now() - 2 * 60 * 60 * 1000,
		});
		expect(screen.getByText(/last automatic sync/i)).toBeTruthy();
		expect(screen.getByText(/2h ago/)).toBeTruthy();
	});

	it("admits when no machine has synced automatically yet", () => {
		setup({
			autoSync: { enabled: true, frequencyHours: 24 },
			lastAutoSyncAt: null,
		});
		expect(
			screen.getByText(/no machine has synced automatically yet/i),
		).toBeTruthy();
	});

	it("names the one command that closes the never-fired state", () => {
		setup({
			autoSync: { enabled: true, frequencyHours: 24 },
			lastAutoSyncAt: null,
		});
		expect(screen.getByText("npx @use-aistack/cli sync")).toBeTruthy();
	});

	it("does not name that command once automation is working", () => {
		setup({
			autoSync: { enabled: true, frequencyHours: 24 },
			lastAutoSyncAt: Date.now() - 1000,
		});
		expect(screen.queryByText("npx @use-aistack/cli sync")).toBeNull();
	});
});

describe("the switch", () => {
	it("turns automation on", () => {
		setup({ autoSync: null, lastAutoSyncAt: null });
		fireEvent.click(screen.getByRole("button", { name: /^on$/i }));
		expect(lastSet()).toMatchObject({ stackId: STACK_ID, enabled: true });
	});

	it("turns automation off", () => {
		setup({
			autoSync: { enabled: true, frequencyHours: 24 },
			lastAutoSyncAt: null,
		});
		fireEvent.click(screen.getByRole("button", { name: /^off$/i }));
		expect(lastSet()).toMatchObject({ stackId: STACK_ID, enabled: false });
	});

	// The stored interval is a schedule the owner chose. Turning automation back
	// on must not silently move a machine that chose six hours onto the default,
	// so the switch sends what it is showing.
	it("keeps the stored interval when it turns automation back on", () => {
		setup({
			autoSync: { enabled: false, frequencyHours: 6 },
			lastAutoSyncAt: null,
		});
		fireEvent.click(screen.getByRole("button", { name: /^on$/i }));
		expect(lastSet()).toMatchObject({ enabled: true, frequencyHours: 6 });
	});
});

/**
 * The switch as the page's one remedy (#108, from #107 decision 1). Past 48
 * hours the section promotes this box and it leads with the prompt — and that
 * is the ONLY thing on the page that asks for anything, which is what keeps the
 * switch and a callout from reading as two features.
 */
describe("leading, past 48 hours", () => {
	it("states the age and what auto-sync would do", () => {
		setup(
			{ autoSync: null, lastAutoSyncAt: null },
			{
				staleSince: THREE_DAYS_AGO,
			},
		);
		expect(
			screen.getByText(
				/Last synced 3 days ago\. Auto-sync keeps this page current/i,
			),
		).toBeTruthy();
	});

	it("hands over the command that writes the same flag", () => {
		setup(
			{ autoSync: null, lastAutoSyncAt: null },
			{
				staleSince: THREE_DAYS_AGO,
			},
		);
		expect(
			screen.getByText("npx @use-aistack/cli sync --auto on"),
		).toBeTruthy();
	});

	it("names the trigger, the ceiling and the revoke", () => {
		setup(
			{ autoSync: null, lastAutoSyncAt: null },
			{
				staleSince: THREE_DAYS_AGO,
			},
		);
		expect(
			screen.getByText(
				/publishes when a session starts on a machine you have linked, at most once a day/i,
			),
		).toBeTruthy();
		expect(
			screen.getByText(/npx @use-aistack\/cli sync --auto off/),
		).toBeTruthy();
	});

	// A stack that chose six hours and then turned the switch off restores six
	// hours, so the ceiling must follow the stored interval.
	it("names the stored interval, not the default", () => {
		setup(
			{ autoSync: { enabled: false, frequencyHours: 6 }, lastAutoSyncAt: null },
			{ staleSince: THREE_DAYS_AGO },
		);
		expect(screen.getByText(/at most once every 6 hours/i)).toBeTruthy();
	});

	// #107 decision 4: a page cannot know whether a machine stayed off, a hook
	// went away or no session started. Naming any of them would be a claim we
	// cannot support (#40).
	it("asks for nothing extra when automation is already on", () => {
		setup(
			{ autoSync: { enabled: true, frequencyHours: 24 }, lastAutoSyncAt: 1 },
			{ staleSince: THREE_DAYS_AGO },
		);
		expect(screen.getByText(/last automatic sync/i)).toBeTruthy();
		expect(
			screen.queryByText("npx @use-aistack/cli sync --auto on"),
		).toBeNull();
		expect(screen.queryByText(/keeps this page current/i)).toBeNull();
	});

	it("says none of it while the reading is inside 48 hours", () => {
		setup({ autoSync: null, lastAutoSyncAt: null });
		expect(screen.queryByText(/keeps this page current/i)).toBeNull();
		expect(
			screen.queryByText("npx @use-aistack/cli sync --auto on"),
		).toBeNull();
		expect(
			screen.getByText(/only a sync you run yourself publishes/i),
		).toBeTruthy();
	});

	// The word reaches no surface (#107 decision 5).
	it("never says stale", () => {
		setup(
			{ autoSync: null, lastAutoSyncAt: null },
			{
				staleSince: THREE_DAYS_AGO,
			},
		);
		expect(document.body.textContent?.toLowerCase()).not.toContain("stale");
	});
});

describe("the interval", () => {
	function openTheSelect() {
		fireEvent.click(screen.getByRole("button", { name: /every day/i }));
	}

	it("is editable while automation is on", () => {
		setup({
			autoSync: { enabled: true, frequencyHours: 24 },
			lastAutoSyncAt: null,
		});
		openTheSelect();
		fireEvent.click(screen.getByRole("button", { name: /every 6 hours/i }));
		expect(lastSet()).toMatchObject({ enabled: true, frequencyHours: 6 });
	});

	it("is not offered while automation is off", () => {
		setup({
			autoSync: { enabled: false, frequencyHours: 24 },
			lastAutoSyncAt: null,
		});
		expect(screen.queryByRole("button", { name: /every day/i })).toBeNull();
	});
});
