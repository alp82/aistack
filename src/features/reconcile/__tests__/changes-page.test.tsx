// @vitest-environment jsdom
/**
 * The changes page - wayfinder #43, building variant J locked by #39.
 *
 * Three of these tests guard decisions rather than behaviour, and are the
 * reason this file exists at all:
 *
 *   1. `hasSnapshot: false` IS NOT AN EMPTY PAGE. Getting this wrong turns four
 *      open items into a page that claims to have nothing.
 *   2. THE VOCABULARY BINDS. "reconcile", "dismiss", "measured", "authored",
 *      "snapshot", "ledger" and "harness" must not reach the owner's eyes.
 *   3. ONE METER ACROSS BOTH VIEWS. Answering a row in the list has to move the
 *      same percentage answering the card would.
 */
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { getFunctionName } from "convex/server";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChangesPage } from "@/features/reconcile/ChangesPage";

const queryMock = vi.fn();
const mutationMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
	useMutation: (ref: unknown) => mutationMock(ref),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const STACK_ID = "stack_1" as never;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const MODEL_ITEM = {
	atomKind: "model" as const,
	atomKey: "claude-opus-5",
	label: "Claude Opus 5",
	kind: "missing_from_authored" as const,
	tokenShare: 0.62,
	apiEquivalentUSD: 3402.4,
};

const TOOL_ITEM = {
	atomKind: "tool" as const,
	atomKey: "convex",
	label: "Convex",
	kind: "missing_what_for" as const,
};

type Suggestions = {
	hasSnapshot: boolean;
	receivedAt: number | null;
	isFresh: boolean;
	suggestions: Array<typeof MODEL_ITEM | typeof TOOL_ITEM>;
	dismissedCount: number;
};

type Dismissal = {
	atomKind: "model" | "tool";
	atomKey: string;
	label: string;
	dismissedAt: number;
};

type KeptPrivate = {
	reviewEnabled: boolean;
	stagedAt: number | null;
	names: Array<{
		category: "skills" | "mcpServers";
		name: string;
		count?: number;
		group: string | null;
		published: boolean;
	}>;
};

const NO_KEPT_PRIVATE: KeptPrivate = {
	reviewEnabled: true,
	stagedAt: null,
	names: [],
};

/** Wire the three queries and hand back a spy per mutation. */
function setup(opts: {
	data?: Suggestions | undefined;
	dismissals?: Dismissal[];
	keptPrivate?: KeptPrivate;
}) {
	const spies = {
		applyWhatFor: vi.fn().mockResolvedValue(null),
		addMeasuredModel: vi.fn().mockResolvedValue(null),
		dismissSuggestion: vi.fn().mockResolvedValue(null),
		undismissSuggestion: vi.fn().mockResolvedValue(null),
		addPublishedNameOptIns: vi.fn().mockResolvedValue({ added: 1 }),
		removePublishedNameOptIns: vi.fn().mockResolvedValue({ removed: 1 }),
		setReviewKeptPrivate: vi.fn().mockResolvedValue({ deleted: 0 }),
	};
	// Route by function name: the generated `api` is a proxy that hands back a
	// fresh object per property access, so `===` on the reference never matches.
	queryMock.mockImplementation((ref: never) => {
		const name = getFunctionName(ref);
		if (name.endsWith("getReconcileSuggestions")) return opts.data;
		if (name.endsWith("listKeptPrivate"))
			return opts.keptPrivate ?? NO_KEPT_PRIVATE;
		return opts.dismissals ?? [];
	});
	mutationMock.mockImplementation((ref: never) => {
		const name = getFunctionName(ref);
		if (name.endsWith("applyWhatFor")) return spies.applyWhatFor;
		if (name.endsWith("addMeasuredModel")) return spies.addMeasuredModel;
		if (name.endsWith("addPublishedNameOptIns"))
			return spies.addPublishedNameOptIns;
		if (name.endsWith("removePublishedNameOptIns"))
			return spies.removePublishedNameOptIns;
		if (name.endsWith("setReviewKeptPrivate"))
			return spies.setReviewKeptPrivate;
		// Order matters: "undismissSuggestion" also ends with "dismissSuggestion".
		if (name.endsWith("undismissSuggestion")) return spies.undismissSuggestion;
		return spies.dismissSuggestion;
	});
	render(
		<ChangesPage
			stackId={STACK_ID}
			stackName="Alp's Stack"
			stackSlug="alps-stack-ab12"
		/>,
	);
	return spies;
}

const FRESH: Suggestions = {
	hasSnapshot: true,
	receivedAt: Date.now() - 2 * HOUR,
	isFresh: true,
	suggestions: [MODEL_ITEM, TOOL_ITEM],
	dismissedCount: 0,
};

describe("the never-checked stack", () => {
	it("still shows the work it has, and asks for a sync", () => {
		setup({
			data: {
				hasSnapshot: false,
				receivedAt: null,
				isFresh: false,
				suggestions: [TOOL_ITEM],
				dismissedCount: 0,
			},
		});

		// Not an empty page: the what-for half needs no snapshot at all.
		expect(screen.getByText("1 thing to look at")).toBeTruthy();
		expect(
			screen.getByText("You haven't said what you use this for"),
		).toBeTruthy();
		expect(screen.getByText("Convex")).toBeTruthy();
		// The banner and the teaching box both name the documented command (#58),
		// and both point at the canonical /sync page.
		expect(screen.getByText("Never checked")).toBeTruthy();
		expect(
			screen.getAllByText("npx @use-aistack/cli sync").length,
		).toBeGreaterThan(0);
		const guideLinks = screen
			.getAllByText("how syncing works")
			.map((el) => el.closest("a")?.getAttribute("href"));
		expect(guideLinks).toContain("/sync");
	});

	it("counts only the authored half in the meter", () => {
		setup({
			data: {
				hasSnapshot: false,
				receivedAt: null,
				isFresh: false,
				suggestions: [TOOL_ITEM],
				dismissedCount: 0,
			},
		});
		expect(screen.getByText("0%")).toBeTruthy();
		expect(screen.getByText("0 of 1 done")).toBeTruthy();
	});
});

describe("freshness", () => {
	it("says when the last check was, and warns once it is out of the week", () => {
		setup({
			data: { ...FRESH, receivedAt: Date.now() - 12 * DAY, isFresh: false },
		});
		expect(screen.getByText(/Checked 1w ago/)).toBeTruthy();
		expect(
			screen.getByText(/stops counting as up to date after a week/),
		).toBeTruthy();
	});
});

describe("answering", () => {
	it("adds a measured model, and shows its share and price", async () => {
		const spies = setup({ data: FRESH });

		expect(screen.getByText("62% of everything you ran")).toBeTruthy();
		// The dollar figure is never a bill.
		expect(screen.getByText("≈$3,402 at API prices")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /Add it/ }));
		expect(spies.addMeasuredModel).toHaveBeenCalledWith({
			stackId: STACK_ID,
			modelSlug: "claude-opus-5",
		});
	});

	it("hides an item the owner says is not theirs", () => {
		const spies = setup({ data: FRESH });
		fireEvent.click(screen.getByRole("button", { name: /Not mine, hide it/ }));
		expect(spies.dismissSuggestion).toHaveBeenCalledWith({
			stackId: STACK_ID,
			atomKind: "model",
			atomKey: "claude-opus-5",
		});
	});

	it("saves a note only once one is typed", () => {
		const spies = setup({
			data: { ...FRESH, suggestions: [TOOL_ITEM] },
		});

		const save = screen.getByRole("button", { name: /Save it/ });
		fireEvent.click(save);
		expect(spies.applyWhatFor).not.toHaveBeenCalled();

		fireEvent.change(screen.getByLabelText("What you use Convex for"), {
			target: { value: "  the backend  " },
		});
		fireEvent.click(screen.getByRole("button", { name: /Save it/ }));
		expect(spies.applyWhatFor).toHaveBeenCalledWith({
			stackId: STACK_ID,
			toolSlug: "convex",
			whatFor: "the backend",
		});
	});
});

describe("one meter across both views", () => {
	it("moves the same percentage whether you answer the card or a row", async () => {
		setup({ data: FRESH });
		expect(screen.getByText("0 of 2 done")).toBeTruthy();

		// Answer one on the card.
		fireEvent.click(screen.getByRole("button", { name: /Add it/ }));
		expect(await screen.findByText("1 of 2 done")).toBeTruthy();
		expect(screen.getByText("50%")).toBeTruthy();

		// Switch to the list and answer the other one there.
		fireEvent.click(screen.getByRole("button", { name: /Whole list/ }));
		fireEvent.change(screen.getByLabelText("What you use Convex for"), {
			target: { value: "the backend" },
		});
		fireEvent.click(screen.getByRole("button", { name: /Save it/ }));
		expect(await screen.findByText("100%")).toBeTruthy();
		expect(screen.getByText("All caught up")).toBeTruthy();
	});
});

describe("hidden", () => {
	it("lists what was hidden by name and brings it back", async () => {
		const spies = setup({
			data: { ...FRESH, suggestions: [], dismissedCount: 1 },
			dismissals: [
				{
					atomKind: "model",
					atomKey: "gpt-5-4",
					label: "GPT-5.4",
					dismissedAt: Date.now() - 3 * DAY,
				},
			],
		});

		fireEvent.click(screen.getByRole("button", { name: /Hidden \(1\)/ }));
		expect(screen.getByText("GPT-5.4")).toBeTruthy();
		expect(screen.getByText("3d ago")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /Bring it back/ }));
		expect(spies.undismissSuggestion).toHaveBeenCalledWith({
			stackId: STACK_ID,
			atomKind: "model",
			atomKey: "gpt-5-4",
		});
	});
});

describe("the vocabulary binds", () => {
	it("says none of the words the design ruled out", () => {
		setup({ data: FRESH });
		const text = document.body.textContent ?? "";
		for (const banned of [
			"reconcile",
			"dismiss",
			"measured",
			"authored",
			"snapshot",
			"ledger",
			"harness",
			"suggestion",
		]) {
			expect(text.toLowerCase()).not.toContain(banned);
		}
		// The two kept on purpose, because replacing them would be a lie.
		expect(text).toContain("API prices");
	});
});

describe("the Kept private view", () => {
	const STAGED: KeptPrivate = {
		reviewEnabled: true,
		stagedAt: Date.now() - HOUR,
		names: [
			{
				category: "skills",
				name: "alp-river:crossfire",
				count: 12,
				group: "alp-river",
				published: false,
			},
			{
				category: "skills",
				name: "alp-river:wayfinder",
				count: 4,
				group: "alp-river",
				published: false,
			},
			{
				category: "mcpServers",
				name: "acme-internal",
				count: 3,
				group: null,
				published: false,
			},
		],
	};

	const open = () => fireEvent.click(screen.getByText(/Kept private/));

	it("counts only what is still held back", () => {
		setup({
			data: FRESH,
			keptPrivate: {
				...STAGED,
				names: [
					...STAGED.names,
					{
						category: "skills",
						name: "already-out",
						count: 1,
						group: null,
						published: true,
					},
				],
			},
		});
		// A published name shows in the view so it can be taken back, but it is
		// not kept private - counting it would make the number contradict its own
		// label.
		expect(screen.getByText("Kept private (3)")).toBeTruthy();
	});

	it("groups by plugin and publishes every name in the group expanded", async () => {
		const spies = setup({ data: FRESH, keptPrivate: STAGED });
		open();

		expect(screen.getByText("alp-river")).toBeTruthy();
		await act(async () => {
			fireEvent.click(screen.getByText("publish all"));
		});

		// #42 decision 3: the group is a way to LOOK at the list, never a way to
		// store it. A stored `alp-river:*` would grant names nobody has thought of.
		expect(spies.addPublishedNameOptIns).toHaveBeenCalledWith({
			stackId: STACK_ID,
			names: [
				{ category: "skills", name: "alp-river:crossfire" },
				{ category: "skills", name: "alp-river:wayfinder" },
			],
		});
	});

	it("publishes one name, and says when it takes effect", async () => {
		const spies = setup({
			data: FRESH,
			keptPrivate: { ...STAGED, names: [STAGED.names[2]] },
		});
		open();

		await act(async () => {
			fireEvent.click(screen.getByText("publish"));
		});
		expect(spies.addPublishedNameOptIns).toHaveBeenCalledWith({
			stackId: STACK_ID,
			names: [{ category: "mcpServers", name: "acme-internal" }],
		});
		// Nothing is published NOW. A tick is a standing permission, and writing a
		// snapshot here would let a web checkbox fake the 7-day living bar (#48).
		expect(
			await screen.findByText("Publishes on your next sync."),
		).toBeTruthy();
	});

	it("takes a published name back", async () => {
		const spies = setup({
			data: FRESH,
			keptPrivate: {
				...STAGED,
				names: [
					{
						category: "skills",
						name: "already-out",
						count: 2,
						group: null,
						published: true,
					},
				],
			},
		});
		open();

		await act(async () => {
			fireEvent.click(screen.getByText("keep private"));
		});
		expect(spies.removePublishedNameOptIns).toHaveBeenCalledWith({
			stackId: STACK_ID,
			names: [{ category: "skills", name: "already-out" }],
		});
	});

	it("renders the switch, and flips it", async () => {
		const spies = setup({ data: FRESH, keptPrivate: STAGED });
		open();

		expect(screen.getByText("Review kept-private names here")).toBeTruthy();
		expect(
			screen.getByText(
				"Your machine sends them so you can publish them. Off means we never see them.",
			),
		).toBeTruthy();

		const box = screen.getByRole("checkbox") as HTMLInputElement;
		expect(box.checked).toBe(true);
		await act(async () => {
			fireEvent.click(box);
		});
		expect(spies.setReviewKeptPrivate).toHaveBeenCalledWith({
			stackId: STACK_ID,
			enabled: false,
		});
	});

	it("asks a never-synced stack to sync rather than calling it empty", () => {
		setup({
			data: {
				hasSnapshot: false,
				receivedAt: null,
				isFresh: false,
				suggestions: [TOOL_ITEM],
				dismissedCount: 0,
			},
			keptPrivate: NO_KEPT_PRIVATE,
		});
		open();
		expect(screen.getByText("Sync to see names.")).toBeTruthy();
	});

	it("says nothing is kept private once a sync has arrived", () => {
		setup({ data: FRESH, keptPrivate: NO_KEPT_PRIVATE });
		open();
		expect(screen.getByText("Nothing kept private.")).toBeTruthy();
	});
});
