// @vitest-environment jsdom
/**
 * RED tests for the not-yet-implemented ProjectsManager component.
 * These tests MUST fail until src/components/projects/ProjectsManager.tsx exists.
 *
 * Structural proof: this file intentionally does NOT vi.mock("convex/react") and
 * imports nothing from Convex. A successful render without a Convex mock is the
 * proof that ProjectsManager is Convex-free.
 */
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	waitForElementToBeRemoved,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// This import will fail until the module exists - that is the intended RED state.
import { ProjectsManager } from "@/components/projects/ProjectsManager";

afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

type ManagerProject = {
	id: string;
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
	updatedAt?: number;
};

function makeItem(
	overrides: Partial<ManagerProject> & { id: string; name: string },
): ManagerProject {
	return {
		updatedAt: Date.now(),
		...overrides,
	};
}

const ITEM_ALPHA = makeItem({
	id: "k1",
	name: "Alpha",
	description: "Alpha desc",
});
const ITEM_BETA = makeItem({
	id: "k2",
	name: "Beta",
	description: "Beta desc",
});

function defaultProps(
	overrides?: Partial<React.ComponentProps<typeof ProjectsManager>>,
) {
	return {
		items: [] as ManagerProject[],
		keyOf: (item: ManagerProject) => item.id,
		isOwner: true,
		index: 1,
		// The groups below exercise the row presentation (what the stack editor
		// renders). The card presentation has its own group at the bottom.
		presentation: "rows" as const,
		onCreate: vi.fn().mockResolvedValue(undefined),
		onUpdate: vi.fn().mockResolvedValue(undefined),
		onDelete: vi.fn().mockResolvedValue(undefined),
		onReorder: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Group ACC: Accordion expand / collapse behaviour
// ---------------------------------------------------------------------------

describe("ProjectsManager – accordion expand/collapse", () => {
	// TC-PM-ACC-01
	it("TC-PM-ACC-01: row collapsed by default, toggle aria-expanded='false'", () => {
		render(<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA] })} />);
		const toggle = screen.getByRole("button", {
			name: /show details for alpha/i,
		});
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	// TC-PM-ACC-02
	it("TC-PM-ACC-02: click toggle → expands, description visible, aria-expanded='true'", async () => {
		render(<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA] })} />);
		const toggle = screen.getByRole("button", {
			name: /show details for alpha/i,
		});
		fireEvent.click(toggle);
		await waitFor(() =>
			expect(toggle).toHaveAttribute("aria-expanded", "true"),
		);
		expect(screen.getByText("Alpha desc")).toBeInTheDocument();
	});

	// TC-PM-ACC-03
	it("TC-PM-ACC-03: click toggle twice → collapses (description removed)", async () => {
		render(<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA] })} />);
		const toggle = screen.getByRole("button", {
			name: /show details for alpha/i,
		});
		fireEvent.click(toggle);
		await waitFor(() =>
			expect(screen.getByText("Alpha desc")).toBeInTheDocument(),
		);
		fireEvent.click(toggle);
		await waitForElementToBeRemoved(() => screen.queryByText("Alpha desc"));
	});

	// TC-PM-ACC-04
	it("TC-PM-ACC-04: two items, open A then B → only one toggle aria-expanded='true'", async () => {
		render(
			<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA, ITEM_BETA] })} />,
		);
		const toggleAlpha = screen.getByRole("button", {
			name: /show details for alpha/i,
		});
		const toggleBeta = screen.getByRole("button", {
			name: /show details for beta/i,
		});
		fireEvent.click(toggleAlpha);
		await waitFor(() =>
			expect(toggleAlpha).toHaveAttribute("aria-expanded", "true"),
		);
		fireEvent.click(toggleBeta);
		await waitFor(() =>
			expect(toggleBeta).toHaveAttribute("aria-expanded", "true"),
		);
		expect(toggleAlpha).toHaveAttribute("aria-expanded", "false");
		const expanded = screen
			.getAllByRole("button")
			.filter((b) => b.getAttribute("aria-expanded") === "true");
		expect(expanded).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// Group CB: Callback contracts
// ---------------------------------------------------------------------------

describe("ProjectsManager – callbacks", () => {
	// TC-PM-CB-01
	it("TC-PM-CB-01: New Project → dialog → type name → Create → onCreate called once with objectContaining({name}); no stackId", async () => {
		const onCreate = vi.fn().mockResolvedValue(undefined);
		render(<ProjectsManager {...defaultProps({ onCreate })} />);
		fireEvent.click(screen.getByRole("button", { name: /new project/i }));
		const nameInput = await screen.findByLabelText(/name/i);
		fireEvent.change(nameInput, { target: { value: "My New Project" } });
		fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
		await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
		const [arg] = onCreate.mock.calls[0] as [Record<string, unknown>];
		expect(arg).toMatchObject({ name: "My New Project" });
		expect(arg).not.toHaveProperty("stackId");
	});

	// TC-PM-CB-02
	it("TC-PM-CB-02: expand row → Edit → dialog seeded → change name → Save → onUpdate(id, {name:newName})", async () => {
		const onUpdate = vi.fn().mockResolvedValue(undefined);
		render(
			<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA], onUpdate })} />,
		);
		// Expand
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /hide details for alpha/i }),
			).toBeInTheDocument(),
		);
		// Click Edit
		fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
		// Seed check: name input should be "Alpha"
		const nameInput = await screen.findByDisplayValue("Alpha");
		fireEvent.change(nameInput, { target: { value: "Alpha Renamed" } });
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
		await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
		const [id, values] = onUpdate.mock.calls[0] as [
			string,
			Record<string, unknown>,
		];
		expect(id).toBe("k1");
		expect(values).toMatchObject({ name: "Alpha Renamed" });
	});

	// TC-PM-CB-03
	it("TC-PM-CB-03: expand row → Delete → ConfirmDialog → Delete → onDelete(id)", async () => {
		const onDelete = vi.fn().mockResolvedValue(undefined);
		render(
			<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA], onDelete })} />,
		);
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /^delete$/i }),
			).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
		// ConfirmDialog should appear
		const dialog = await screen.findByRole("dialog");
		const confirmInDialog = within(dialog).getByRole("button", {
			name: /^delete$/i,
		});
		fireEvent.click(confirmInDialog);
		await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
		expect(onDelete).toHaveBeenCalledWith("k1");
	});

	// TC-PM-CB-04
	it("TC-PM-CB-04: expand row → Delete → Cancel → onDelete NOT called, dialog closed", async () => {
		const onDelete = vi.fn();
		render(
			<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA], onDelete })} />,
		);
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /^delete$/i }),
			).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
		const dialog = await screen.findByRole("dialog");
		const cancelBtn = within(dialog).getByRole("button", { name: /cancel/i });
		fireEvent.click(cancelBtn);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(onDelete).not.toHaveBeenCalled();
	});

	// TC-PM-CB-05
	it("TC-PM-CB-05: ArrowDown on 'Reorder Alpha' handle → onReorder(['k2','k1'])", async () => {
		const onReorder = vi.fn().mockResolvedValue(undefined);
		render(
			<ProjectsManager
				{...defaultProps({
					items: [ITEM_ALPHA, ITEM_BETA],
					keyOf: (item) => item.id,
					onReorder,
				})}
			/>,
		);
		const handle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(handle, { key: "ArrowDown" });
		await waitFor(() => expect(onReorder).toHaveBeenCalledOnce());
		expect(onReorder).toHaveBeenCalledWith(["k2", "k1"]);
	});
});

// ---------------------------------------------------------------------------
// Group SK: Skeleton loading state
// ---------------------------------------------------------------------------

describe("ProjectsManager – skeleton / loading", () => {
	// TC-PM-SK-01
	it("TC-PM-SK-01: loading={true} → exactly 3 .animate-pulse, no row content", () => {
		const { container } = render(
			<ProjectsManager {...defaultProps({ loading: true })} />,
		);
		const pulses = container.querySelectorAll(".animate-pulse");
		expect(pulses).toHaveLength(3);
		expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
	});

	// TC-PM-SK-02
	it("TC-PM-SK-02: loading={false} + items → 0 .animate-pulse, names visible", () => {
		const { container } = render(
			<ProjectsManager
				{...defaultProps({ items: [ITEM_ALPHA, ITEM_BETA], loading: false })}
			/>,
		);
		const pulses = container.querySelectorAll(".animate-pulse");
		expect(pulses).toHaveLength(0);
		expect(screen.getByText("Alpha")).toBeInTheDocument();
		expect(screen.getByText("Beta")).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group REC: Reactive / rerender
// ---------------------------------------------------------------------------

describe("ProjectsManager – reactivity on rerender", () => {
	// TC-PM-REC-01
	it("TC-PM-REC-01: rerender with added item → new name appears", () => {
		const props = defaultProps({ items: [ITEM_ALPHA] });
		const { rerender } = render(<ProjectsManager {...props} />);
		expect(screen.queryByText("Beta")).not.toBeInTheDocument();
		rerender(<ProjectsManager {...props} items={[ITEM_ALPHA, ITEM_BETA]} />);
		expect(screen.getByText("Beta")).toBeInTheDocument();
	});

	// TC-PM-REC-02
	it("TC-PM-REC-02: rerender with item removed → removed name gone", () => {
		const props = defaultProps({ items: [ITEM_ALPHA, ITEM_BETA] });
		const { rerender } = render(<ProjectsManager {...props} />);
		expect(screen.getByText("Beta")).toBeInTheDocument();
		rerender(<ProjectsManager {...props} items={[ITEM_ALPHA]} />);
		expect(screen.queryByText("Beta")).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group VIS: Visibility gating by isOwner
// ---------------------------------------------------------------------------

describe("ProjectsManager – isOwner visibility gating", () => {
	// TC-PM-VIS-01
	it("TC-PM-VIS-01: isOwner={false} → no 'New Project', no Edit after expand, no reorder handles", async () => {
		render(
			<ProjectsManager
				{...defaultProps({ items: [ITEM_ALPHA, ITEM_BETA], isOwner: false })}
			/>,
		);
		expect(
			screen.queryByRole("button", { name: /new project/i }),
		).not.toBeInTheDocument();
		// Expand a row
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha/i }),
		);
		await waitFor(() =>
			expect(screen.getByText("Alpha desc")).toBeInTheDocument(),
		);
		expect(
			screen.queryByRole("button", { name: /^edit$/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /reorder alpha/i }),
		).not.toBeInTheDocument();
	});

	// TC-PM-VIS-02
	it("TC-PM-VIS-02: isOwner={false} → expand still shows description", async () => {
		render(
			<ProjectsManager
				{...defaultProps({ items: [ITEM_ALPHA], isOwner: false })}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha/i }),
		);
		await waitFor(() =>
			expect(screen.getByText("Alpha desc")).toBeInTheDocument(),
		);
	});
});

// ---------------------------------------------------------------------------
// Group URL: safeExternalUrl integration
// ---------------------------------------------------------------------------

describe("ProjectsManager – URL safety", () => {
	// TC-PM-URL-01
	it("TC-PM-URL-01: item url='javascript:alert(1)' → renders without throwing, no website link", () => {
		const badItem = makeItem({
			id: "k-bad",
			name: "Bad URL",
			url: "javascript:alert(1)",
		});
		expect(() =>
			render(<ProjectsManager {...defaultProps({ items: [badItem] })} />),
		).not.toThrow();
		expect(
			screen.queryByRole("link", { name: /website/i }),
		).not.toBeInTheDocument();
	});

	// TC-PM-URL-02
	it("TC-PM-URL-02: item url=undefined → renders without throwing, no website link", () => {
		const noUrlItem = makeItem({ id: "k-nourl", name: "No URL" });
		expect(() =>
			render(<ProjectsManager {...defaultProps({ items: [noUrlItem] })} />),
		).not.toThrow();
		expect(
			screen.queryByRole("link", { name: /website/i }),
		).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group DLG: Dialog state isolation (no leak between sessions)
// ---------------------------------------------------------------------------

describe("ProjectsManager – dialog state isolation", () => {
	// TC-PM-DLG-01
	it("TC-PM-DLG-01: open Edit, Cancel, open New Project → name field empty (no leak)", async () => {
		render(<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA] })} />);
		// Open Edit
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /^edit$/i }),
			).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
		// Verify seeded
		await screen.findByDisplayValue("Alpha");
		// Cancel
		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		// Open New Project
		fireEvent.click(screen.getByRole("button", { name: /new project/i }));
		const nameInput = await screen.findByLabelText(/name/i);
		expect(nameInput).toHaveValue("");
	});

	// TC-PM-DLG-02
	it("TC-PM-DLG-02: open New Project, type 'Partial', Cancel, open Edit → fields show real values not 'Partial'", async () => {
		render(<ProjectsManager {...defaultProps({ items: [ITEM_ALPHA] })} />);
		// Open New Project
		fireEvent.click(screen.getByRole("button", { name: /new project/i }));
		const nameInput = await screen.findByLabelText(/name/i);
		fireEvent.change(nameInput, { target: { value: "Partial" } });
		// Cancel
		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		// Open Edit on the real item
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /^edit$/i }),
			).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
		// Should be seeded with real values
		await screen.findByDisplayValue("Alpha");
		expect(screen.queryByDisplayValue("Partial")).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group CARD: the card presentation, which the stack page asks for
// ---------------------------------------------------------------------------

const ITEM_LINKED = makeItem({
	id: "k3",
	name: "Linked",
	description: "Linked desc",
	url: "https://example.com",
	tags: ["one", "two"],
});

describe("ProjectsManager – card presentation", () => {
	// TC-PM-CARD-01
	it("TC-PM-CARD-01: the caller picks the presentation - rows unless it asks for cards", () => {
		const { unmount } = render(
			<ProjectsManager
				{...defaultProps({ items: [ITEM_LINKED], presentation: undefined })}
			/>,
		);
		const disclosures = () =>
			screen
				.getAllByRole("button")
				.filter((b) => b.getAttribute("aria-expanded") !== null);
		expect(disclosures().length).toBeGreaterThan(0);
		unmount();

		render(
			<ProjectsManager
				{...defaultProps({ items: [ITEM_LINKED], presentation: "cards" })}
			/>,
		);
		expect(disclosures()).toHaveLength(0);
		expect(screen.getByText("Linked")).toBeInTheDocument();
		expect(screen.getByText("Linked desc")).toBeInTheDocument();
		expect(screen.getByText("one")).toBeInTheDocument();
		expect(screen.getByText("two")).toBeInTheDocument();
	});

	// TC-PM-CARD-02
	it("TC-PM-CARD-02: the name is the external link when the url is safe", () => {
		render(
			<ProjectsManager
				{...defaultProps({ items: [ITEM_LINKED], presentation: "cards" })}
			/>,
		);
		const link = screen.getByRole("link", { name: /linked/i });
		expect(link).toHaveAttribute("href", "https://example.com/");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link.getAttribute("rel")).toContain("noopener");
		expect(link.getAttribute("rel")).toContain("noreferrer");
	});

	// TC-PM-CARD-03
	it("TC-PM-CARD-03: unsafe url → the name renders as plain text, no link", () => {
		const badItem = makeItem({
			id: "k-bad",
			name: "Bad URL",
			url: "javascript:alert(1)",
		});
		render(
			<ProjectsManager
				{...defaultProps({ items: [badItem], presentation: "cards" })}
			/>,
		);
		expect(screen.getByText("Bad URL")).toBeInTheDocument();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	// TC-PM-CARD-04
	it("TC-PM-CARD-04: owner sees Edit and Delete on the card without expanding", async () => {
		const onDelete = vi.fn().mockResolvedValue(undefined);
		render(
			<ProjectsManager
				{...defaultProps({
					items: [ITEM_ALPHA],
					presentation: "cards",
					onDelete,
				})}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
		const dialog = await screen.findByRole("dialog");
		fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));
		await waitFor(() => expect(onDelete).toHaveBeenCalledWith("k1"));
	});

	// TC-PM-CARD-05
	it("TC-PM-CARD-05: visitor sees no owner actions and no reorder handle", () => {
		render(
			<ProjectsManager
				{...defaultProps({
					items: [ITEM_ALPHA, ITEM_BETA],
					isOwner: false,
					presentation: "cards",
				})}
			/>,
		);
		expect(
			screen.queryByRole("button", { name: /^edit$/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /reorder alpha/i }),
		).not.toBeInTheDocument();
	});

	// TC-PM-CARD-06
	it("TC-PM-CARD-06: cards carry no drag handle even for the owner", () => {
		render(
			<ProjectsManager
				{...defaultProps({
					items: [ITEM_ALPHA, ITEM_BETA],
					presentation: "cards",
				})}
			/>,
		);
		expect(
			screen.queryByRole("button", { name: /reorder alpha/i }),
		).not.toBeInTheDocument();
	});

	// TC-PM-CARD-07
	it("TC-PM-CARD-07: loading → 3 pulses and an aria-busy list, no card content", () => {
		const { container } = render(
			<ProjectsManager
				{...defaultProps({ loading: true, presentation: "cards" })}
			/>,
		);
		expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
		expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
		expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
	});

	// TC-PM-CARD-08
	it("TC-PM-CARD-08: owner + empty → the 'Add a project' empty state", () => {
		render(
			<ProjectsManager
				{...defaultProps({ items: [], presentation: "cards" })}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /^add a project$/i }),
		).toBeInTheDocument();
	});

	// TC-PM-CARD-09
	it("TC-PM-CARD-09: visitor + empty → the visitor empty-state copy", () => {
		render(
			<ProjectsManager
				{...defaultProps({ items: [], isOwner: false, presentation: "cards" })}
			/>,
		);
		expect(
			screen.getByText(/no projects have been added/i),
		).toBeInTheDocument();
	});
});
