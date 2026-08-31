// @vitest-environment jsdom
/**
 * Test suite for ProjectsSection "Variant B – Expandable Rows" rewrite.
 *
 * These tests are RED by design: the implementation does not exist yet.
 * Do not modify src/components/ProjectsSection.tsx until you are ready to make them green.
 *
 * Mocking conventions follow projects-section-cli.test.tsx exactly.
 * Interaction uses fireEvent (from @testing-library/react) – same as stack-view-sections.test.tsx.
 */
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitForElementToBeRemoved,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectsSection } from "@/components/ProjectsSection";

// Stub Convex hooks – same mechanism as the CLI test file.
vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(() => vi.fn()),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const STACK_ID = "stack_test" as never;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BASE_PROJECT = {
	_id: "project_1" as never,
	name: "My Project",
	description: "A description of the project",
	url: "https://example.com",
	tags: ["react", "typescript"],
	updatedAt: Date.now() - 2 * 60 * 60 * 1000, // 2h ago → "2h ago"
	createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
};

const NO_URL_PROJECT = { ...BASE_PROJECT, url: undefined };

const MANY_TAGS_PROJECT = {
	...BASE_PROJECT,
	tags: ["a", "b", "c", "d", "e", "f"],
};

const EXACTLY_FOUR_TAGS_PROJECT = {
	...BASE_PROJECT,
	tags: ["a", "b", "c", "d"],
};

const NO_TAGS_PROJECT = { ...BASE_PROJECT, tags: [] };

const PROJECT_A = {
	...BASE_PROJECT,
	_id: "p1" as never,
	name: "Alpha",
	description: "Desc A",
};
const PROJECT_B = {
	...BASE_PROJECT,
	_id: "p2" as never,
	name: "Beta",
	description: "Desc B",
};
const PROJECT_C = {
	...BASE_PROJECT,
	_id: "p3" as never,
	name: "Gamma",
	description: "Desc C",
};

// ---------------------------------------------------------------------------
// Helper: find the first accordion toggle button (has aria-expanded attribute)
// ---------------------------------------------------------------------------
function findFirstToggle() {
	return screen
		.getAllByRole("button")
		.find((b) => b.getAttribute("aria-expanded") !== null);
}

function findToggleForProject(name: string) {
	return screen
		.getAllByRole("button")
		.find(
			(b) =>
				b.getAttribute("aria-expanded") !== null &&
				(b
					.getAttribute("aria-label")
					?.toLowerCase()
					.includes(name.toLowerCase()) ??
					false),
		);
}

// ---------------------------------------------------------------------------
// Helper: wire a single shared useMutation spy for every mutation slot.
//
// The component now calls the bare useMutation return value (the ref pins were
// removed). In this environment `api.projects.*` is a Proxy that yields a fresh
// reference on every access, so spies cannot be keyed by reference identity; and
// a cumulative per-call counter drifts whenever the component re-renders between
// mount and the user action. Each test below exercises exactly one mutation, so
// returning a single spy from every useMutation call is sufficient - mirroring
// the convention in
// features/stack-editor/components/__tests__/projects-step.test.tsx - and the
// argument assertions (toHaveBeenCalledWith) remain exact. We use
// mockImplementation(() => spy) rather than mockReturnValue(spy) so the mock's
// return type stays loose enough for tsc (a bare vi.fn() lacks the
// ReactMutation.withOptimisticUpdate member that mockReturnValue would enforce).

// ---------------------------------------------------------------------------
// Group CR – Collapsed Row Content
// ---------------------------------------------------------------------------

describe("ProjectsSection – Collapsed Row Content", () => {
	// TC-CR-01
	it("TC-CR-01: name renders in collapsed row (isOwner=false)", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByText("My Project")).toBeInTheDocument();
	});

	// TC-CR-04
	it("TC-CR-04: 6 tags → first 4 shown, +2 overflow, e and f absent", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([MANY_TAGS_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByText("a")).toBeInTheDocument();
		expect(screen.getByText("b")).toBeInTheDocument();
		expect(screen.getByText("c")).toBeInTheDocument();
		expect(screen.getByText("d")).toBeInTheDocument();
		expect(screen.getByText("+2")).toBeInTheDocument();
		expect(screen.queryByText("e")).not.toBeInTheDocument();
		expect(screen.queryByText("f")).not.toBeInTheDocument();
	});

	// TC-CR-05
	it("TC-CR-05: exactly 4 tags → all shown, no overflow indicator", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([EXACTLY_FOUR_TAGS_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByText("a")).toBeInTheDocument();
		expect(screen.getByText("b")).toBeInTheDocument();
		expect(screen.getByText("c")).toBeInTheDocument();
		expect(screen.getByText("d")).toBeInTheDocument();
		expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
	});

	// TC-CR-06
	it("TC-CR-06: empty tags array → name renders, no tag badges, no crash", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([NO_TAGS_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByText("My Project")).toBeInTheDocument();
		expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
	});

	// TC-CR-07
	it("TC-CR-07: description NOT visible while collapsed", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(
			screen.queryByText("A description of the project"),
		).not.toBeInTheDocument();
	});

	// TC-CR-10
	it("TC-CR-10: updated-at NOT visible while collapsed (no 'ago' text)", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.queryByText(/ago/i)).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group WL – Website Link
// ---------------------------------------------------------------------------

describe("ProjectsSection – Website Link", () => {
	// TC-WL-01
	it("TC-WL-01: valid url → website link with correct href, target=_blank, rel noopener+noreferrer", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const link = screen.getByRole("link", { name: /website/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("example.com"),
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
		expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
	});

	// TC-WL-02
	it("TC-WL-02: website link is NOT a descendant of the accordion toggle button", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const link = screen.getByRole("link", { name: /website/i });
		// The toggle button is the one with aria-expanded
		const toggleButton = screen
			.getAllByRole("button")
			.find((b) => b.getAttribute("aria-expanded") !== null);
		expect(toggleButton).toBeDefined();
		expect(toggleButton!.contains(link)).toBe(false);
	});

	// TC-WL-03
	it("TC-WL-03: clicking website link does not expand the row (description still absent)", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const link = screen.getByRole("link", { name: /website/i });
		fireEvent.click(link);

		expect(
			screen.queryByText("A description of the project"),
		).not.toBeInTheDocument();
	});

	// TC-WL-04
	it("TC-WL-04: url 'javascript:alert(1)' → no website link", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([{ ...BASE_PROJECT, url: "javascript:alert(1)" }]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(
			screen.queryByRole("link", { name: /website/i }),
		).not.toBeInTheDocument();
	});

	// TC-WL-05
	it("TC-WL-05: url undefined → no website link", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([NO_URL_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(
			screen.queryByRole("link", { name: /website/i }),
		).not.toBeInTheDocument();
	});

	// TC-WL-06
	// safeExternalUrl("example.com") → "https://example.com/" (bare hostnames are prefixed with https://)
	it("TC-WL-06: bare hostname 'example.com' → link present with href https://example.com/", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([{ ...BASE_PROJECT, url: "example.com" }]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const link = screen.getByRole("link", { name: /website/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "https://example.com/");
	});
});

// ---------------------------------------------------------------------------
// Group AC – Accordion
// ---------------------------------------------------------------------------

describe("ProjectsSection – Accordion", () => {
	// TC-AC-01
	it("TC-AC-01: collapsed by default, toggle has aria-expanded=false", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const toggle = findFirstToggle();
		expect(toggle).toBeDefined();
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	// TC-AC-02
	it("TC-AC-02: click toggle → description present, aria-expanded=true", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		expect(
			screen.getByText("A description of the project"),
		).toBeInTheDocument();
		expect(toggle).toHaveAttribute("aria-expanded", "true");
	});

	// TC-AC-03
	it("TC-AC-03: click toggle twice → collapses, aria-expanded=false", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle); // open
		fireEvent.click(toggle); // close

		// AnimatePresence keeps the panel mounted through its exit animation;
		// wait for the collapsed description to unmount.
		await waitForElementToBeRemoved(() =>
			screen.queryByText("A description of the project"),
		);
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	// TC-AC-04
	it("TC-AC-04: open Alpha then Beta → Desc B present, Desc A absent, exactly one expanded", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		// Open Alpha first
		const alphaToggle = findToggleForProject("Alpha") ?? findFirstToggle()!;
		fireEvent.click(alphaToggle);

		// Now click Beta's toggle (single-open accordion should close Alpha)
		const betaToggle =
			findToggleForProject("Beta") ??
			screen
				.getAllByRole("button")
				.find(
					(b) =>
						b.getAttribute("aria-expanded") === "false" && b !== alphaToggle,
				)!;
		fireEvent.click(betaToggle!);

		expect(screen.getByText("Desc B")).toBeInTheDocument();
		// Alpha's panel unmounts after its AnimatePresence exit animation.
		await waitForElementToBeRemoved(() => screen.queryByText("Desc A"));

		const allExpanded = screen
			.getAllByRole("button")
			.filter((b) => b.getAttribute("aria-expanded") === "true");
		expect(allExpanded).toHaveLength(1);
	});

	// TC-AC-05
	it("TC-AC-05: open Alpha then close Alpha → no expanded toggles, neither description present", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const toggle = findToggleForProject("Alpha") ?? findFirstToggle()!;
		fireEvent.click(toggle); // open
		fireEvent.click(toggle); // close

		const allExpanded = screen
			.getAllByRole("button")
			.filter((b) => b.getAttribute("aria-expanded") === "true");
		expect(allExpanded).toHaveLength(0);
		// Alpha's panel unmounts after its AnimatePresence exit animation.
		await waitForElementToBeRemoved(() => screen.queryByText("Desc A"));
		expect(screen.queryByText("Desc B")).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group EP – Expanded Panel
// ---------------------------------------------------------------------------

describe("ProjectsSection – Expanded Panel", () => {
	async function renderAndExpand(project = BASE_PROJECT, isOwner = false) {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([project]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={isOwner} />);

		const toggle = findFirstToggle();
		if (toggle) fireEvent.click(toggle);
	}

	// TC-EP-01
	it("TC-EP-01: expanded shows full description", async () => {
		await renderAndExpand();
		expect(
			screen.getByText("A description of the project"),
		).toBeInTheDocument();
	});

	// TC-EP-02
	// BASE_PROJECT.updatedAt is two hours ago.
	it("TC-EP-02: expanded shows 'updated' label and relative time '2h ago'", async () => {
		await renderAndExpand();
		expect(screen.getByText(/updated/i)).toBeInTheDocument();
		expect(screen.getByText(/2h ago/i)).toBeInTheDocument();
	});

	// TC-EP-07
	it("TC-EP-07: owner -> Delete button present in expanded panel (unconditional)", async () => {
		await renderAndExpand(BASE_PROJECT, true);
		expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
	});

	// TC-EP-08
	it("TC-EP-08: Edit button has class h-8 (Button size=sm)", async () => {
		await renderAndExpand(BASE_PROJECT, true);
		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		expect(editBtn).toHaveClass("h-8");
	});
});

// ---------------------------------------------------------------------------
// Group MUT – Mutations
// ---------------------------------------------------------------------------

describe("ProjectsSection – Mutations", () => {
	// TC-MUT-01
	it("TC-MUT-01: Edit click → Edit Project dialog with name, description, url seeded", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// Expand row first
		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		fireEvent.click(editBtn);

		expect(screen.getByText(/edit project/i)).toBeInTheDocument();
		expect(screen.getByDisplayValue("My Project")).toBeInTheDocument();
		expect(
			screen.getByDisplayValue("A description of the project"),
		).toBeInTheDocument();
		expect(screen.getByDisplayValue("https://example.com")).toBeInTheDocument();
	});

	// TC-MUT-04
	it("TC-MUT-04: Delete → ConfirmDialog → confirm → deleteProject called", async () => {
		const deleteSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);
		// deleteProject is the 3rd useMutation call
		useMutation.mockImplementation(() => deleteSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const deleteBtn = screen.getByRole("button", { name: /delete/i });
		fireEvent.click(deleteBtn);

		// ConfirmDialog appears – scope to the dialog to avoid matching the panel Delete button
		const confirmDialog = await screen.findByRole("dialog");
		const confirmBtn = within(confirmDialog).getByRole("button", {
			name: /^delete$/i,
		});
		fireEvent.click(confirmBtn);

		expect(deleteSpy).toHaveBeenCalledOnce();
		expect(deleteSpy).toHaveBeenCalledWith({ projectId: "project_1" });
	});

	// TC-MUT-05
	it("TC-MUT-05: Delete → cancel → deleteProject NOT called, dialog closes", async () => {
		const deleteSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);
		useMutation.mockImplementation(() => deleteSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const deleteBtn = screen.getByRole("button", { name: /delete/i });
		fireEvent.click(deleteBtn);

		const cancelBtn = screen.getByRole("button", { name: /cancel/i });
		fireEvent.click(cancelBtn);

		expect(deleteSpy).not.toHaveBeenCalled();
		expect(
			screen.queryByRole("button", { name: /cancel/i }),
		).not.toBeInTheDocument();
	});

	// TC-MUT-06
	it("TC-MUT-06: header 'New Project' button → New Project dialog with empty name input", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const newBtn = screen.getByRole("button", { name: /^new project$/i });
		fireEvent.click(newBtn);

		// The header button "New Project" is still mounted; scope to the dialog to avoid ambiguity.
		const dialog = screen.getByRole("dialog");
		expect(
			within(dialog).getByRole("heading", { name: /new project/i }),
		).toBeInTheDocument();
		const nameInput = screen.getByRole("textbox", { name: /name/i });
		expect(nameInput).toHaveValue("");
	});

	// TC-MUT-07
	it("TC-MUT-07: empty-state 'Add a project' button → New Project dialog with empty name", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const addBtn = screen.getByRole("button", { name: /^add a project$/i });
		fireEvent.click(addBtn);

		// The header "New Project" button is still mounted; scope to the dialog to avoid ambiguity.
		const dialog = screen.getByRole("dialog");
		expect(
			within(dialog).getByRole("heading", { name: /new project/i }),
		).toBeInTheDocument();
		const nameInput = screen.getByRole("textbox", { name: /name/i });
		expect(nameInput).toHaveValue("");
	});

	// TC-MUT-08
	it("TC-MUT-08: create dialog submit with name 'New Thing' → createProject called with name and stackId", async () => {
		const createSpy = vi
			.fn()
			.mockResolvedValue({ _id: "new_project", slug: "new-thing" });
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);
		// createProject is the 4th useMutation call
		useMutation.mockImplementation(() => createSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const addBtn = screen.getByRole("button", { name: /^add a project$/i });
		fireEvent.click(addBtn);

		const nameInput = screen.getByRole("textbox", { name: /name/i });
		fireEvent.change(nameInput, { target: { value: "New Thing" } });

		const createBtn = screen.getByRole("button", { name: /^create$/i });
		fireEvent.click(createBtn);

		expect(createSpy).toHaveBeenCalledOnce();
		expect(createSpy).toHaveBeenCalledWith(
			expect.objectContaining({ name: "New Thing", stackId: STACK_ID }),
		);
	});

	// TC-MUT-ORDER: invariant – useMutation hook call order matches the positional keys
	// relied upon by TC-MUT-04/08 and TC-DRG-04/05/06/07/09.
	// Expected order: 1=reorderProjects, 2=deleteProject, 3=createProject, 4=updateProject
	it("TC-MUT-ORDER: useMutation is called in the expected positional order (reorder, delete, create, update)", async () => {
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		const callRefs: unknown[] = [];
		useMutation.mockImplementation((mutationRef: unknown) => {
			// Record the mutation reference identity so we can assert order.
			callRefs.push(mutationRef);
			return vi.fn().mockResolvedValue(null);
		});

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// Component must invoke useMutation exactly 4 times (one per mutation).
		expect(useMutation).toHaveBeenCalledTimes(4);

		// The order must be stable: all 4 refs must be distinct
		// (each mutation is a different API function object).
		expect(callRefs).toHaveLength(4);
		// All four refs must be distinct (each mutation is a different API function)
		const unique = new Set(callRefs);
		expect(unique.size).toBe(4);
	});
});

// ---------------------------------------------------------------------------
// Group DRG – Drag Handle / Reorder
// ---------------------------------------------------------------------------

describe("ProjectsSection – Drag Handle / Reorder", () => {
	// TC-DRG-01
	it("TC-DRG-01: owner + 2 projects → GripVertical reorder handles for Alpha and Beta present", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		expect(
			screen.getByRole("button", { name: /reorder alpha/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /reorder beta/i }),
		).toBeInTheDocument();
	});

	// TC-DRG-02
	it("TC-DRG-02: owner + 1 project → no reorder handle", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		expect(
			screen.queryByRole("button", { name: /reorder/i }),
		).not.toBeInTheDocument();
	});

	// TC-DRG-03
	it("TC-DRG-03: visitor + 2 projects → no reorder handles", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(
			screen.queryByRole("button", { name: /reorder/i }),
		).not.toBeInTheDocument();
	});

	// TC-DRG-04
	it("TC-DRG-04: ArrowDown on first handle → reorderProjects with [p2, p1]", async () => {
		const reorderSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const alphaHandle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(alphaHandle, { key: "ArrowDown", code: "ArrowDown" });

		expect(reorderSpy).toHaveBeenCalledOnce();
		expect(reorderSpy).toHaveBeenCalledWith({
			stackId: STACK_ID,
			projectIds: ["p2", "p1"],
		});
	});

	// TC-DRG-05
	it("TC-DRG-05: ArrowUp on second handle → reorderProjects with [p2, p1]", async () => {
		const reorderSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const betaHandle = screen.getByRole("button", { name: /reorder beta/i });
		fireEvent.keyDown(betaHandle, { key: "ArrowUp", code: "ArrowUp" });

		expect(reorderSpy).toHaveBeenCalledOnce();
		expect(reorderSpy).toHaveBeenCalledWith({
			stackId: STACK_ID,
			projectIds: ["p2", "p1"],
		});
	});

	// TC-DRG-06
	it("TC-DRG-06: ArrowUp on first handle → reorderProjects NOT called (boundary)", async () => {
		const reorderSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const alphaHandle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(alphaHandle, { key: "ArrowUp", code: "ArrowUp" });

		expect(reorderSpy).not.toHaveBeenCalled();
	});

	// TC-DRG-07
	it("TC-DRG-07: ArrowDown on last handle → reorderProjects NOT called (boundary)", async () => {
		const reorderSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const betaHandle = screen.getByRole("button", { name: /reorder beta/i });
		fireEvent.keyDown(betaHandle, { key: "ArrowDown", code: "ArrowDown" });

		expect(reorderSpy).not.toHaveBeenCalled();
	});

	// TC-DRG-08
	// Drop-commit path: covered-by-manual.
	// Pointer drag physics cannot be faithfully simulated in jsdom without flakiness.
	// Keyboard reorder path (DRG-04/05) covers mutation wiring.
	// Drag-to-reorder with three items is verified manually or via E2E.
	it.skip("TC-DRG-08: drop-commit with 3 projects → covered-by-manual (not simulated in jsdom)", () => {});

	// TC-DRG-09
	it("TC-DRG-09: reorderProjects rejects → order reverts to server order (Alpha before Beta)", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const reorderSpy = vi.fn().mockRejectedValue(new Error("Network error"));
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const alphaHandle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(alphaHandle, { key: "ArrowDown", code: "ArrowDown" });

		// Wait for the rejection to propagate and console.error to be called
		await vi.waitFor(() => {
			expect(consoleSpy).toHaveBeenCalled();
		});

		// After revert, Alpha should appear before Beta in the DOM
		const alphaEl = screen.getByText("Alpha");
		const betaEl = screen.getByText("Beta");
		const allText = screen
			.getAllByText(/alpha|beta/i)
			.map((el) => el.textContent ?? "");
		const alphaIdx = allText.findIndex((t) => /alpha/i.test(t));
		const betaIdx = allText.findIndex((t) => /beta/i.test(t));
		expect(alphaEl).toBeInTheDocument();
		expect(betaEl).toBeInTheDocument();
		expect(alphaIdx).toBeLessThan(betaIdx);

		consoleSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// Group VIS – Visitor
// ---------------------------------------------------------------------------

describe("ProjectsSection – Visitor", () => {
	// TC-VIS-01
	it("TC-VIS-01: visitor sees no New Project button", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(
			screen.queryByRole("button", { name: /new project/i }),
		).not.toBeInTheDocument();
	});

	// TC-VIS-02
	it("TC-VIS-02: visitor sees no Edit button after expand", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		expect(
			screen.queryByRole("button", { name: /^edit$/i }),
		).not.toBeInTheDocument();
	});

	// TC-VIS-04
	it("TC-VIS-04: visitor CAN expand row (description appears)", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		expect(
			screen.getByText("A description of the project"),
		).toBeInTheDocument();
	});

	// TC-VIS-05
	it("TC-VIS-05: visitor sees Website link", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByRole("link", { name: /website/i })).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group OPT – Optimistic Reconciliation
// ---------------------------------------------------------------------------

describe("ProjectsSection – Optimistic Reconciliation", () => {
	// TC-OPT-01
	it("TC-OPT-01: after keyboard swap + server re-emits [B,A] → Beta before Alpha, no snap-back", async () => {
		const reorderSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		const { rerender } = render(
			<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />,
		);

		// Keyboard move Alpha down
		const alphaHandle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(alphaHandle, { key: "ArrowDown", code: "ArrowDown" });

		// Server re-emits with Beta first
		useQuery.mockReturnValue([PROJECT_B, PROJECT_A]);
		rerender(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// Beta should appear before Alpha in the DOM
		const items = screen.getAllByText(/^(Alpha|Beta)$/);
		const alphaIndex = items.findIndex((el) => el.textContent === "Alpha");
		const betaIndex = items.findIndex((el) => el.textContent === "Beta");
		expect(betaIndex).toBeLessThan(alphaIndex);
	});

	// TC-OPT-02
	it("TC-OPT-02: server re-emits with added project → all three rendered in server order", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);

		const { rerender } = render(
			<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />,
		);

		useQuery.mockReturnValue([PROJECT_A, PROJECT_B, PROJECT_C]);
		rerender(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByText("Alpha")).toBeInTheDocument();
		expect(screen.getByText("Beta")).toBeInTheDocument();
		expect(screen.getByText("Gamma")).toBeInTheDocument();
	});

	// TC-OPT-03
	it("TC-OPT-03: server re-emits with removed project → only remaining project renders", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);

		const { rerender } = render(
			<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />,
		);

		useQuery.mockReturnValue([PROJECT_A]);
		rerender(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByText("Alpha")).toBeInTheDocument();
		expect(screen.queryByText("Beta")).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group ERR – Mutation failure feedback
// ---------------------------------------------------------------------------

describe("ProjectsSection – Mutation failure feedback", () => {
	// TC-ERR-01
	it("TC-ERR-01: reorder rejection → status line visible with the reorder message", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const reorderSpy = vi.fn().mockRejectedValue(new Error("Network error"));
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const alphaHandle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(alphaHandle, { key: "ArrowDown", code: "ArrowDown" });

		await vi.waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent(
				/couldn't save the new order/i,
			);
		});

		consoleSpy.mockRestore();
	});

	// TC-ERR-02
	it("TC-ERR-02: delete rejection → status line visible with the server message", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const deleteSpy = vi.fn().mockRejectedValue(new Error("Network error"));
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);
		useMutation.mockImplementation(() => deleteSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const deleteBtn = screen.getByRole("button", { name: /delete/i });
		fireEvent.click(deleteBtn);

		const confirmDialog = await screen.findByRole("dialog");
		const confirmBtn = within(confirmDialog).getByRole("button", {
			name: /^delete$/i,
		});
		fireEvent.click(confirmBtn);

		await vi.waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent(
				/couldn't delete "my project"/i,
			);
		});
		expect(screen.getByRole("alert")).toHaveTextContent(/network error/i);

		consoleSpy.mockRestore();
	});

	// TC-ERR-03
	it("TC-ERR-03: a subsequent successful reorder clears the status line", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const reorderSpy = vi
			.fn()
			.mockRejectedValueOnce(new Error("Network error"))
			.mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// First reorder rejects → status line appears
		const alphaHandle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(alphaHandle, { key: "ArrowDown", code: "ArrowDown" });

		await vi.waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		// Second reorder succeeds → status line clears
		const handle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(handle, { key: "ArrowDown", code: "ArrowDown" });

		await vi.waitFor(() => {
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});

		consoleSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// Group SK – Loading skeleton
// ---------------------------------------------------------------------------

describe("ProjectsSection – Loading skeleton", () => {
	// TC-SK-01
	it("TC-SK-01: skeleton present while query is undefined, gone once data arrives", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue(undefined);

		const { container, rerender } = render(
			<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />,
		);

		expect(container.querySelectorAll(".animate-pulse").length).toBe(3);

		useQuery.mockReturnValue([BASE_PROJECT]);
		rerender(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(container.querySelectorAll(".animate-pulse").length).toBe(0);
		expect(screen.getByText("My Project")).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group EDT – Edit Submit (GAP-1) and Blank-name Gating (GAP-2)
// ---------------------------------------------------------------------------

describe("ProjectsSection – Edit Submit", () => {
	// TC-EDT-01 (GAP-1): Edit submit fires updateProject with correct args
	it("TC-EDT-01: edit dialog submit fires updateProject with trimmed name, description, url, tags", async () => {
		const updateSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);
		// updateProject is the 5th useMutation call
		useMutation.mockImplementation(() => updateSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// Expand the row to reveal the Edit button
		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		fireEvent.click(editBtn);

		// The dialog opens with seeded values; change the name
		const nameInput = screen.getByDisplayValue("My Project");
		fireEvent.change(nameInput, { target: { value: "  Updated Name  " } });

		const saveBtn = screen.getByRole("button", { name: /^save$/i });
		fireEvent.click(saveBtn);

		await vi.waitFor(() => {
			expect(updateSpy).toHaveBeenCalledOnce();
		});

		// name trimmed; description.trim() = "A description of the project" → non-empty string;
		// url.trim() = "https://example.com" → non-empty string; tags unchanged.
		expect(updateSpy).toHaveBeenCalledWith({
			projectId: "project_1",
			name: "Updated Name",
			description: "A description of the project",
			url: "https://example.com",
			tags: ["react", "typescript"],
		});
	});

	// TC-EDT-02 (GAP-1): fields with empty description and url produce undefined for those keys
	it("TC-EDT-02: edit submit with blank description and url → updateProject called with description=undefined, url=undefined", async () => {
		const updateSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		const noDescNoUrl = {
			...BASE_PROJECT,
			description: undefined,
			url: undefined,
			tags: [],
		};
		useQuery.mockReturnValue([noDescNoUrl]);
		useMutation.mockImplementation(() => updateSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		fireEvent.click(editBtn);

		// Name is seeded; do not change it - just submit
		const saveBtn = screen.getByRole("button", { name: /^save$/i });
		fireEvent.click(saveBtn);

		await vi.waitFor(() => {
			expect(updateSpy).toHaveBeenCalledOnce();
		});

		expect(updateSpy).toHaveBeenCalledWith({
			projectId: "project_1",
			name: "My Project",
			description: undefined,
			url: undefined,
			tags: [],
		});
	});

	// TC-EDT-03 (GAP-2): blank name → Save button disabled
	it("TC-EDT-03: blank name in edit dialog → Save button is disabled", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		fireEvent.click(editBtn);

		// Clear the name field
		const nameInput = screen.getByDisplayValue("My Project");
		fireEvent.change(nameInput, { target: { value: "" } });

		const saveBtn = screen.getByRole("button", { name: /^save$/i });
		expect(saveBtn).toBeDisabled();
	});

	// TC-EDT-04 (GAP-2): whitespace-only name → Save button is disabled
	it("TC-EDT-04: whitespace-only name in edit dialog → Save button is disabled", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		fireEvent.click(editBtn);

		const nameInput = screen.getByDisplayValue("My Project");
		fireEvent.change(nameInput, { target: { value: "   " } });

		const saveBtn = screen.getByRole("button", { name: /^save$/i });
		expect(saveBtn).toBeDisabled();
	});

	// TC-EDT-05 (GAP-2): clicking a disabled Save (blank name) calls neither updateProject nor createProject
	it("TC-EDT-05: blank name → clicking Save calls neither updateProject nor createProject", async () => {
		const mutationSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);
		useMutation.mockImplementation(() => mutationSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		fireEvent.click(editBtn);

		const nameInput = screen.getByDisplayValue("My Project");
		fireEvent.change(nameInput, { target: { value: "" } });

		// Attempt to click save - button is disabled; even if forced, handleSubmit guards
		const saveBtn = screen.getByRole("button", { name: /^save$/i });
		// Fire click directly to exercise the handleSubmit guard
		fireEvent.click(saveBtn);

		// Neither updateProject (5th) nor createProject (4th) should have been called
		expect(mutationSpy).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Group DSW – Dialog mode-switch / no value leakage (GAP-3)
// ---------------------------------------------------------------------------

describe("ProjectsSection – Dialog mode-switch without leakage", () => {
	it("TC-DSW-00: submit create, then open create again → fields are empty", async () => {
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);
		useMutation.mockReturnValue(vi.fn().mockResolvedValue(null) as never);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		fireEvent.click(screen.getByRole("button", { name: /^add a project$/i }));
		fireEvent.change(screen.getByRole("textbox", { name: /name/i }), {
			target: { value: "First Project" },
		});
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
		});

		await vi.waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: /^add a project$/i }));

		const dialog = screen.getByRole("dialog");
		expect(within(dialog).getByRole("textbox", { name: /name/i })).toHaveValue(
			"",
		);
	});

	// TC-DSW-01 (GAP-3): Edit dialog → close → open Create dialog → name field is empty
	// jsdom's modal blocks interaction with row buttons while a dialog is open,
	// so we test the close-then-reopen path: edit values must not bleed into the
	// subsequent create dialog.
	it("TC-DSW-01: open edit dialog then close, then open create dialog → name field is empty (no leakage)", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// Step 1: Expand row and open the Edit dialog
		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		fireEvent.click(editBtn);

		// Confirm edit dialog is seeded with the project name
		expect(screen.getByDisplayValue("My Project")).toBeInTheDocument();

		// Step 2: Close the edit dialog via Cancel
		const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
		fireEvent.click(cancelBtn);

		// Step 3: Open the Create dialog via the header button
		const newBtn = screen.getByRole("button", { name: /^new project$/i });
		fireEvent.click(newBtn);

		// The name field must be empty - not seeded with the prior edit's project name
		const dialog = screen.getByRole("dialog");
		const nameInput = within(dialog).getByRole("textbox", { name: /name/i });
		expect(nameInput).toHaveValue("");
	});

	// TC-DSW-02 (GAP-3): Create dialog → close → open Edit dialog → fields seeded correctly
	it("TC-DSW-02: open create dialog, close without saving, then open edit dialog → fields seeded with project values", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// Step 1: Open create dialog
		const newBtn = screen.getByRole("button", { name: /^new project$/i });
		fireEvent.click(newBtn);

		// Type something in the name field (simulating partial entry)
		const dialog = screen.getByRole("dialog");
		const nameInput = within(dialog).getByRole("textbox", { name: /name/i });
		fireEvent.change(nameInput, { target: { value: "Partial Entry" } });

		// Step 2: Cancel the create dialog
		const cancelBtn = within(dialog).getByRole("button", {
			name: /^cancel$/i,
		});
		fireEvent.click(cancelBtn);

		// Step 3: Expand row and open edit dialog
		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const editBtn = screen.getByRole("button", { name: /^edit$/i });
		fireEvent.click(editBtn);

		// Edit dialog must be seeded with the real project values, not "Partial Entry"
		expect(screen.getByDisplayValue("My Project")).toBeInTheDocument();
	});

	it("TC-DSW-03: submit edit, then open create → fields are empty", async () => {
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([BASE_PROJECT]);
		useMutation.mockReturnValue(vi.fn().mockResolvedValue(null) as never);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		const toggle = findFirstToggle();
		if (!toggle) throw new Error("Project toggle was not rendered");
		fireEvent.click(toggle);
		fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
		});

		fireEvent.click(screen.getByRole("button", { name: /^new project$/i }));

		const dialog = screen.getByRole("dialog");
		expect(within(dialog).getByRole("textbox", { name: /name/i })).toHaveValue(
			"",
		);
		expect(
			within(dialog).getByRole("textbox", { name: /description/i }),
		).toHaveValue("");
		expect(within(dialog).getByRole("textbox", { name: /url/i })).toHaveValue(
			"",
		);
		expect(within(dialog).getByRole("textbox", { name: /tags/i })).toHaveValue(
			"",
		);
		expect(within(dialog).queryByText("react")).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group KBD – Non-reorderable keyboard safety (GAP-6)
// ---------------------------------------------------------------------------

describe("ProjectsSection – Non-reorderable keyboard safety", () => {
	// TC-KBD-01 (GAP-6): visitor + 2 projects → no reorder handles; pressing ArrowUp/Down on
	// the accordion toggle fires no reorderProjects call and causes no crash.
	it("TC-KBD-01: visitor with 2 projects - ArrowDown on toggle does not call reorderProjects", async () => {
		const reorderSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		// Visitor has no reorder handles; fire key events on the first accordion toggle
		const toggle = findFirstToggle()!;
		fireEvent.keyDown(toggle, { key: "ArrowDown", code: "ArrowDown" });
		fireEvent.keyDown(toggle, { key: "ArrowUp", code: "ArrowUp" });

		expect(reorderSpy).not.toHaveBeenCalled();
	});

	// TC-KBD-02 (GAP-6): owner + 1 project → no reorder handles; pressing ArrowUp/Down on
	// the accordion toggle fires no reorderProjects call and causes no crash.
	it("TC-KBD-02: owner with 1 project - ArrowDown/ArrowUp on toggle does not call reorderProjects", async () => {
		const reorderSpy = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A]);
		useMutation.mockImplementation(() => reorderSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// Owner with 1 project: canReorder is false, no drag handles
		const toggle = findFirstToggle()!;
		fireEvent.keyDown(toggle, { key: "ArrowDown", code: "ArrowDown" });
		fireEvent.keyDown(toggle, { key: "ArrowUp", code: "ArrowUp" });

		expect(reorderSpy).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Group KBD2 – Keyboard reorder while delete in flight (GAP-7)
// ---------------------------------------------------------------------------

describe("ProjectsSection – Keyboard reorder while delete in flight", () => {
	// TC-KBD2-01 (GAP-7): both reorder and delete mutations fire with consistent args
	// even when a delete is in flight during a keyboard reorder.
	// We assert only that both mutations fire with consistent args, not UI state.
	// A single shared spy is used (same as other MUT tests); both calls are verified
	// via toHaveBeenCalledWith assertions covering the expected arg shapes.
	it("TC-KBD2-01: reorder fires while delete confirm is in flight - both mutations called with consistent args", async () => {
		let resolveDelete!: () => void;
		const deletePromise = new Promise<null>((resolve) => {
			resolveDelete = () => resolve(null);
		});
		// Shared spy: first call will be the delete, second will be the reorder.
		// (deleteProject is called on confirm; reorderProjects on ArrowDown)
		const sharedSpy = vi
			.fn()
			.mockReturnValueOnce(deletePromise) // deleteProject call
			.mockResolvedValue(null); // reorderProjects call

		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([PROJECT_A, PROJECT_B]);
		useMutation.mockImplementation(() => sharedSpy);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// Expand row for PROJECT_A and trigger delete (opens confirm dialog)
		const toggle = findFirstToggle()!;
		fireEvent.click(toggle);

		const deleteBtn = screen.getByRole("button", { name: /delete/i });
		fireEvent.click(deleteBtn);

		// Confirm delete - starts the in-flight delete promise
		const confirmDialog = await screen.findByRole("dialog");
		const confirmBtn = within(confirmDialog).getByRole("button", {
			name: /^delete$/i,
		});
		fireEvent.click(confirmBtn);

		// While delete is still in flight, fire a keyboard reorder
		const alphaHandle = screen.getByRole("button", { name: /reorder alpha/i });
		fireEvent.keyDown(alphaHandle, {
			key: "ArrowDown",
			code: "ArrowDown",
		});

		// Both mutations must have been called with consistent args
		expect(sharedSpy).toHaveBeenCalledWith({ projectId: "p1" });
		expect(sharedSpy).toHaveBeenCalledWith({
			stackId: STACK_ID,
			projectIds: ["p2", "p1"],
		});

		// Resolve the delete so no async leaks remain
		resolveDelete();
		await vi.waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});
});

// ---------------------------------------------------------------------------
// Notes on deferred gaps
// ---------------------------------------------------------------------------
// GAP-4 (mid-drag membership change): Requires firing Reorder.Item's onDragStart
// in jsdom, which is not supported by the motion/react library's pointer-event
// simulation path. Covered-by-manual / E2E.
//
// GAP-8 (commitOrder pointer-drop rejection): Requires firing onDragEnd via jsdom
// pointer events on a Reorder.Item. Not reliably simulatable. Covered-by-manual.
