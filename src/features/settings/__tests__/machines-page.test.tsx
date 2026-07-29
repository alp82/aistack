// @vitest-environment jsdom
/**
 * Linked machines — wayfinder #49 (map #29).
 *
 * Two tests guard decisions rather than behaviour:
 *
 *   1. A MACHINE WITH NO STACK STILL RENDERS. It is the class that has no home
 *      under a per-stack revoke surface, and the reason this page is
 *      account-scoped at all. If it ever stops showing up, the page has quietly
 *      become the thing it was chosen over.
 *   2. REVOKE ASKS FIRST. The row is deleted and the machine stops working, so
 *      a misclick is not undoable by any surface here.
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
import {
	expiryLabel,
	MachinesPage,
	relativeDay,
	scopeLine,
} from "@/features/settings/MachinesPage";

const queryMock = vi.fn();
const mutationMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
	useMutation: (ref: unknown) => mutationMock(ref),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const DAY = 24 * 60 * 60 * 1000;

function machine(over: Record<string, unknown> = {}) {
	return {
		_id: "tok_1",
		name: "work laptop",
		createdAt: Date.now() - 30 * DAY,
		lastUsedAt: Date.now() - 2 * DAY,
		expiresAt: Date.now() + 90 * DAY,
		stack: { name: "Main Stack", slug: "main-stack" },
		scopes: ["collect", "sync"],
		...over,
	};
}

function setup(rows: unknown, revokeSpy = vi.fn().mockResolvedValue(null)) {
	queryMock.mockImplementation((ref: never) =>
		getFunctionName(ref).endsWith("listByUser") ? rows : undefined,
	);
	mutationMock.mockImplementation(() => revokeSpy);
	render(<MachinesPage />);
	return revokeSpy;
}

describe("MachinesPage", () => {
	it("names each machine and says where it publishes", () => {
		setup([machine()]);
		expect(screen.getByText("work laptop")).toBeTruthy();
		expect(screen.getByText(/Publishes to Main Stack/)).toBeTruthy();
	});

	it("renders a machine with no stack, and says it cannot publish", () => {
		setup([machine({ name: undefined, stack: null })]);
		expect(screen.getByText("Unnamed machine")).toBeTruthy();
		expect(screen.getByText(/cannot publish/)).toBeTruthy();
	});

	it("never renders a token value", () => {
		// The query cannot return one, but the page is where such a leak would
		// become visible, so the assertion lives here too.
		setup([machine()]);
		expect(document.body.textContent).not.toMatch(/Bearer|tok_[a-f0-9]{8}/);
	});

	it("asks before revoking", () => {
		const revoke = setup([machine()]);
		fireEvent.click(screen.getByRole("button", { name: /revoke/i }));
		expect(screen.getByText(/Revoke work laptop\?/)).toBeTruthy();
		expect(revoke).not.toHaveBeenCalled();
	});

	it("revokes by id once confirmed", async () => {
		const revoke = setup([machine()]);
		fireEvent.click(screen.getByRole("button", { name: /revoke/i }));
		const confirm = screen
			.getAllByRole("button", { name: /^revoke$/i })
			.at(-1) as HTMLElement;
		// The handler is async and settles state after the await, so the click has
		// to be flushed inside act or React warns.
		await act(async () => {
			fireEvent.click(confirm);
		});
		expect(revoke).toHaveBeenCalledWith({ id: "tok_1" });
	});

	it("tells a user with no machines how to link one", () => {
		setup([]);
		expect(screen.getByText(/No machines linked/)).toBeTruthy();
		expect(screen.getByText(/cli login/)).toBeTruthy();
	});

	it("shows a loading state rather than an empty one while the query answers", () => {
		// `useQuery` answers undefined first. Rendering "no machines linked" then
		// tells the user nothing is linked a beat before learning that something
		// is — the same trap #46 caught on the measured display.
		setup(undefined);
		expect(screen.getByText("Loading...")).toBeTruthy();
		expect(screen.queryByText(/No machines linked/)).toBeNull();
	});
});

describe("copy helpers", () => {
	const now = Date.now();

	it("says when a machine was last seen in plain words", () => {
		expect(relativeDay(now, now)).toBe("today");
		expect(relativeDay(now - DAY, now)).toBe("yesterday");
		expect(relativeDay(now - 5 * DAY, now)).toBe("5 days ago");
		expect(relativeDay(now - 100 * DAY, now)).toBe("3 months ago");
	});

	it("says what a machine may do in plain words, never the word scope", () => {
		// Every token is minted with both today, so this line reads the same on
		// every row — and it is still worth printing, because the page tells the
		// user what a machine can reach.
		const line = scopeLine(["collect", "sync"]);
		expect(line).toBe(
			"Can read and update your stack and publish what it measured",
		);
		expect(line).not.toMatch(/scope/i);
		expect(scopeLine(["sync"])).toBe("Can publish what it measured");
		// An empty grant is a real stored value, not a missing one — and a
		// machine that can do nothing is worth saying out loud.
		expect(scopeLine([])).toMatch(/revoke it/);
	});

	it("never promises an expiry date, because the TTL slides", () => {
		// `refreshToken` pushes `expiresAt` out on every request, so a machine in
		// weekly use never reaches it. Printing a date would be a promise the
		// system does not keep — which is the whole argument for revoke.
		const label = expiryLabel(now + 90 * DAY, now);
		expect(label).toMatch(/after its last use/);
		expect(expiryLabel(now - 1000, now)).toBe("Expired");
	});
});
