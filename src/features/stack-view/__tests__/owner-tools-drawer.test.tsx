// @vitest-environment jsdom
/**
 * The owner drawer (#356, prototype v43).
 *
 * The children are the real tools. Only the Convex hooks and the router link
 * are mocked, so a change to how a tool renders is caught here as well as in
 * its own tests.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analytics } from "@/features/view-analytics/__tests__/fixture";
import { api } from "../../../../convex/_generated/api";
import { OwnerToolsDrawer } from "../OwnerToolsDrawer";

const queryMock = vi.fn();
const setMock = vi.fn(() => Promise.resolve());

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
	useMutation: () => setMock,
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		params,
		className,
	}: {
		children: ReactNode;
		to: string;
		params?: Record<string, string>;
		className?: string;
	}) => {
		const href = params
			? Object.entries(params).reduce(
					(acc, [key, value]) => acc.replace(`$${key}`, value),
					to,
				)
			: to;
		return (
			<a href={href} className={className}>
				{children}
			</a>
		);
	},
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const HOUR = 60 * 60 * 1000;
const STACK_ID = "stack_1" as never;

type Answers = {
	changes?: unknown;
	analytics?: unknown;
	autoSync?: unknown;
};

/** Answers each query by name; an unlisted query stays unanswered. */
function answer(answers: Answers) {
	const byName: Record<string, unknown> = {
		[getFunctionName(api.measured.getReconcileSuggestions)]: answers.changes,
		[getFunctionName(api.viewAnalytics.mine)]: answers.analytics,
		[getFunctionName(api.autoSync.get)]: answers.autoSync,
	};
	queryMock.mockImplementation((ref: unknown, args: unknown) =>
		args === "skip" ? undefined : byName[getFunctionName(ref as never)],
	);
}

const CHANGES = {
	hasSnapshot: true,
	receivedAt: Date.now() - 2 * HOUR,
	suggestions: [
		{ atomKind: "tool", atomKey: "a", label: "A", kind: "missing_what_for" },
		{ atomKind: "tool", atomKey: "b", label: "B", kind: "missing_what_for" },
		{ atomKind: "tool", atomKey: "c", label: "C", kind: "missing_what_for" },
	],
};

const AUTO_SYNC_OFF = { autoSync: null, lastAutoSyncAt: null };

function setup({
	isOwner = true,
	receivedAt = Date.now() - 23 * 60 * 1000,
	...answers
}: Answers & { isOwner?: boolean; receivedAt?: number | null } = {}) {
	answer({
		changes: CHANGES,
		analytics: analytics(),
		autoSync: AUTO_SYNC_OFF,
		...answers,
	});
	return render(
		<OwnerToolsDrawer
			stackId={STACK_ID}
			stackSlug="night-shift"
			isOwner={isOwner}
			receivedAt={receivedAt}
		/>,
	);
}

describe("the reader", () => {
	it("renders nothing and asks for nothing", () => {
		const { container } = setup({ isOwner: false });
		expect(container).toBeEmptyDOMElement();
		for (const call of queryMock.mock.calls) {
			expect(call[1]).toBe("skip");
		}
	});
});

describe("the summary row", () => {
	it("sits on the shared frame with 24px below it", () => {
		const { container } = setup();
		expect(container.firstElementChild).toHaveClass(
			"mx-auto",
			"max-w-7xl",
			"px-6",
			"mb-6",
		);
		expect(container.querySelector("details")).toBeInTheDocument();
	});

	it("prints the stamp, the suggestion count and the view count", () => {
		setup();
		const summary = screen.getByText("Owner tools").closest("summary");
		expect(summary).toHaveTextContent(/Updated 23 min ago/);
		expect(summary).toHaveTextContent("3 suggestions · 15 views");
	});

	it("leaves a segment out until its number has arrived", () => {
		setup({ changes: undefined, analytics: undefined, receivedAt: null });
		const summary = screen.getByText("Owner tools").closest("summary");
		expect(summary).not.toHaveTextContent(/Checking/);
		expect(summary).not.toHaveTextContent(/suggestions|views|Updated/);
	});

	it("keeps the chevron decorative and the summary as the toggle", () => {
		const { container } = setup();
		const chevron = container.querySelector("summary svg");
		expect(chevron).toHaveAttribute("aria-hidden", "true");
		const details = container.querySelector("details");
		expect(details).not.toHaveAttribute("open");
		const summary = screen.getByText("Owner tools").closest("summary");
		expect(summary).not.toBeNull();
		if (summary) fireEvent.click(summary);
		expect(details).toHaveAttribute("open");
	});
});

describe("the open drawer", () => {
	it("holds the three tools, each fed by the drawer's own answers", () => {
		const { container } = setup();
		const body = container.querySelector("details > div");
		expect(body).toHaveTextContent("// auto-sync");
		expect(body).toHaveTextContent("3 things to look at");
		expect(body).toHaveTextContent(/only you can see this/i);
		expect(body).toHaveTextContent("15");
		expect(screen.getByRole("link", { name: /take a look/i })).toHaveAttribute(
			"href",
			"/stacks/night-shift/changes",
		);
		expect(screen.getByRole("link", { name: /all pages/i })).toHaveAttribute(
			"href",
			"/settings/analytics",
		);
	});

	it("asks each query once, from the drawer", () => {
		setup();
		const asked = queryMock.mock.calls
			.filter(([, args]) => args !== "skip")
			.map(([ref]) => getFunctionName(ref as never));
		expect(new Set(asked)).toEqual(
			new Set([
				getFunctionName(api.measured.getReconcileSuggestions),
				getFunctionName(api.viewAnalytics.mine),
				getFunctionName(api.autoSync.get),
			]),
		);
		expect(
			asked.filter((n) => n === getFunctionName(api.viewAnalytics.mine)),
		).toHaveLength(1);
	});

	it("promotes the auto-sync switch for a reading past 48 hours", () => {
		setup({ receivedAt: Date.now() - 3 * 24 * HOUR });
		expect(
			screen.getByText(/Auto-sync keeps this page current/),
		).toBeInTheDocument();
	});

	it("leaves the switch resting for a current reading", () => {
		setup();
		expect(
			screen.queryByText(/Auto-sync keeps this page current/),
		).not.toBeInTheDocument();
	});

	it("does not draw the view line for a stack the answer does not hold", () => {
		setup({ analytics: analytics({ targets: [] }) });
		expect(screen.queryByText(/only you can see this/i)).toBeNull();
		expect(
			screen.getByText("Owner tools").closest("summary"),
		).not.toHaveTextContent(/views/);
	});
});
