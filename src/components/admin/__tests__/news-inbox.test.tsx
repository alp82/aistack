// @vitest-environment jsdom
/**
 * The rebuilt admin inbox (#238, over the prototype verdicts of #235).
 *
 * These tests guard the four decisions the prototype settled, plus the one the
 * owner changed while this was built:
 *
 *   1. THE WEEK IS GROUPED BY SOURCE, BIGGEST FIRST, AND EVERY BOX IS CLOSED.
 *      That is what keeps a source serving 100 items in a week from burying the
 *      next one.
 *   2. NO GROUP CARRIES A BULK VERDICT. The prototype asked for a one-tap
 *      discard of the rest of a group. The owner ruled it out while this was
 *      built: a group is for browsing, and a few items are hand-picked per
 *      issue. A bulk button reappearing here is a decision reversed by accident.
 *   3. QUICK-ADD TAKES A URL AND NOTHING ELSE.
 *   4. A FAILING SOURCE IS ONE RED LINE WITH A RETRY.
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
import { NewsInboxSection } from "@/components/admin/NewsInboxSection";

const queryMock = vi.fn();
const mutationMock = vi.fn();
const actionMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args?: unknown) => queryMock(ref, args),
	useMutation: (ref: unknown) => mutationMock(ref),
	useAction: (ref: unknown) => actionMock(ref),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

function item(over: Record<string, unknown> = {}) {
	return {
		_id: "item_1",
		url: "https://vendor.test/post",
		headline: "A post",
		collectedAt: 1_000,
		publishedAt: 1_000,
		intake: "collector",
		licenseClass: "article",
		sourceName: "Loud feed",
		state: "inbox",
		...over,
	};
}

function source(over: Record<string, unknown> = {}) {
	return {
		_id: "src_1",
		name: "Loud feed",
		url: "https://loud.test/rss",
		licenseClass: "article",
		enabled: true,
		consecutiveFailures: 0,
		lastPolledAt: Date.now(),
		lastOkAt: Date.now(),
		...over,
	};
}

interface Fixture {
	groups?: unknown;
	sources?: unknown;
	groupItems?: unknown;
	items?: unknown;
}

function setup(fixture: Fixture = {}) {
	queryMock.mockImplementation((ref: never, args: unknown) => {
		const name = getFunctionName(ref);
		if (name.endsWith("inboxGroups")) return fixture.groups ?? [];
		if (name.endsWith("listSources")) return fixture.sources ?? [];
		if (name.endsWith("countItems"))
			return { inbox: 0, approved: 0, discarded: 0 };
		if (name.endsWith("listTopics")) return [];
		if (name.endsWith("listGroupItems")) {
			if (args === "skip") return undefined;
			return fixture.groupItems ?? [];
		}
		if (name.endsWith("listItems")) return fixture.items ?? [];
		return undefined;
	});
	mutationMock.mockImplementation(() => vi.fn().mockResolvedValue(null));
	return render(<NewsInboxSection />);
}

describe("the source digest", () => {
	it("shows one closed box per source, in the order the query gives", () => {
		setup({
			groups: [
				{
					key: "source:a",
					sourceId: "a",
					name: "Loud feed",
					licenseClass: "article",
					count: 100,
				},
				{
					key: "source:b",
					sourceId: "b",
					name: "Quiet feed",
					licenseClass: "article",
					count: 3,
				},
			],
			groupItems: [item()],
		});

		const boxes = screen.getAllByRole("button", { name: /feed/ });
		expect(boxes[0]).toHaveTextContent("Loud feed");
		expect(boxes[0]).toHaveTextContent("100");
		expect(boxes[1]).toHaveTextContent("Quiet feed");
		// Closed: no row from any group is on the page yet.
		expect(screen.queryByText("A post")).toBeNull();
	});

	it("opens a group to browse its rows, and offers no bulk verdict", () => {
		setup({
			groups: [
				{
					key: "source:a",
					sourceId: "a",
					name: "Loud feed",
					licenseClass: "article",
					count: 100,
				},
			],
			groupItems: Array.from({ length: 20 }, (_, n) =>
				item({ _id: `item_${n}`, headline: `Post ${n}` }),
			),
		});

		fireEvent.click(screen.getByRole("button", { name: /Loud feed/ }));

		expect(screen.getByText("Post 0")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: /Show 20 more of 100/ }),
		).toBeTruthy();
		expect(
			screen.queryByRole("button", {
				name: /discard (all|the rest|the remaining)/i,
			}),
		).toBeNull();
		expect(screen.queryByRole("button", { name: /approve all/i })).toBeNull();
		// The verdict sits on the row itself, once per row.
		expect(
			screen.getAllByRole("button", { name: /^Approve Post/ }),
		).toHaveLength(20);
	});

	it("opens the editor under a row without moving the item", () => {
		const move = vi.fn().mockResolvedValue(null);
		setup({
			groups: [
				{
					key: "source:a",
					sourceId: "a",
					name: "Loud feed",
					licenseClass: "article",
					count: 1,
				},
			],
			groupItems: [item()],
		});
		mutationMock.mockImplementation(() => move);

		fireEvent.click(screen.getByRole("button", { name: /Loud feed/ }));
		expect(screen.queryByLabelText("Summary")).toBeNull();

		fireEvent.click(screen.getByText("A post"));

		expect(screen.getByLabelText("Summary")).toBeTruthy();
		expect(screen.getByLabelText("Topic")).toBeTruthy();
		expect(move).not.toHaveBeenCalled();
	});
});

describe("quick-add", () => {
	it("takes a URL and nothing else", () => {
		setup();

		const bar = screen.getByRole("button", { name: /add/i }).closest("form");
		expect(bar).not.toBeNull();
		const fields = within(bar as HTMLElement).getAllByRole("textbox");
		expect(fields).toHaveLength(1);
		expect(fields[0]).toHaveAttribute("type", "url");
	});
});

describe("a failing source", () => {
	it("is one red line that names the source, the error and the age", () => {
		const HOUR = 60 * 60 * 1000;
		setup({
			sources: [
				source({
					name: "Broken feed",
					consecutiveFailures: 4,
					lastError: "HTTP 503",
					lastOkAt: Date.now() - 24 * HOUR,
				}),
			],
		});

		const retry = screen.getByRole("button", { name: /retry/i });
		const banner = retry.parentElement as HTMLElement;
		expect(banner).toHaveTextContent("Broken feed");
		expect(banner).toHaveTextContent("HTTP 503");
		expect(banner).toHaveTextContent("24h");
		expect(banner).toHaveTextContent("4 polls");
	});

	it("retries that source alone", async () => {
		const poll = vi.fn().mockResolvedValue({ added: 1, error: null });
		actionMock.mockImplementation((ref: never) =>
			getFunctionName(ref).endsWith("pollSourceNow") ? poll : vi.fn(),
		);
		setup({
			sources: [
				source({
					_id: "src_broken",
					consecutiveFailures: 2,
					lastError: "HTTP 503",
				}),
			],
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /retry/i }));
		});

		expect(poll).toHaveBeenCalledWith({ sourceId: "src_broken" });
	});

	it("stays out of the way while every source is healthy", () => {
		setup({ sources: [source()] });

		expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
	});
});
