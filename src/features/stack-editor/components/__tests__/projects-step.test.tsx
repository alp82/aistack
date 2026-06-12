// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectsStep } from "@/features/stack-editor/components/ProjectsStep";

// Stub Convex hooks — the component uses them only in edit mode.
vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => undefined),
	useMutation: vi.fn(() => vi.fn()),
}));

afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// Minimal staged project fixture
// ---------------------------------------------------------------------------
const PROJECT_A = {
	name: "Alpha App",
	description: "First project",
	url: "https://alpha.example.com",
	tags: ["react"],
};
const PROJECT_B = {
	name: "Beta Service",
	description: "Second project",
	url: "https://beta.example.com",
	tags: ["node"],
};

// ---------------------------------------------------------------------------
// Group E: ProjectsStep create mode
// ---------------------------------------------------------------------------

describe("ProjectsStep – create mode", () => {
	const baseProps = {
		mode: "create" as const,
		projects: [] as (typeof PROJECT_A)[],
		onProjectsChange: vi.fn(),
	};

	// TC-E-03
	it("does NOT contain the text 'npx @use-aistack/cli collect'", () => {
		render(<ProjectsStep {...baseProps} />);
		expect(
			screen.queryByText(/npx @use-aistack\/cli collect/i),
		).not.toBeInTheDocument();
	});

	// TC-E-04
	it("renders section anchor with id='section-projects'", () => {
		render(<ProjectsStep {...baseProps} />);
		expect(document.getElementById("section-projects")).toBeInTheDocument();
	});

	// TC-E-05
	it("renders a list entry for each staged project passed via props", () => {
		render(
			<ProjectsStep
				{...baseProps}
				projects={[PROJECT_A, PROJECT_B]}
				onProjectsChange={vi.fn()}
			/>,
		);
		expect(screen.getByText("Alpha App")).toBeInTheDocument();
		expect(screen.getByText("Beta Service")).toBeInTheDocument();
	});

	// TC-E-01
	it("add a project -> onProjectsChange called with array length 1", () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[]}
				onProjectsChange={onProjectsChange}
			/>,
		);

		// Fill in the name field (required)
		const nameInput = screen.getByPlaceholderText(/project name/i);
		fireEvent.change(nameInput, { target: { value: "New Project" } });

		// Submit
		const addButton = screen.getByRole("button", { name: /add/i });
		fireEvent.click(addButton);

		expect(onProjectsChange).toHaveBeenCalledOnce();
		const arg = onProjectsChange.mock.calls[0][0];
		expect(arg).toHaveLength(1);
		expect(arg[0].name).toBe("New Project");
	});

	// TC-E-02
	it("remove a project -> onProjectsChange called with []", () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[PROJECT_A]}
				onProjectsChange={onProjectsChange}
			/>,
		);

		const removeButton = screen.getByRole("button", { name: /remove/i });
		fireEvent.click(removeButton);

		expect(onProjectsChange).toHaveBeenCalledOnce();
		const arg = onProjectsChange.mock.calls[0][0];
		expect(arg).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// Group F: ProjectsStep edit mode (live mutations)
// ---------------------------------------------------------------------------

describe("ProjectsStep – edit mode", () => {
	const STACK_ID = "stack_abc123" as never;
	const PROJECT_ID = "project_xyz" as never;

	// TC-F-01
	it("renders live list from mocked listByStack ('Live Project' visible)", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: PROJECT_ID,
				name: "Live Project",
				slug: "live-project-XYZ",
				shortId: "XYZ",
				fileCount: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);
		expect(screen.getByText("Live Project")).toBeInTheDocument();
	});

	// TC-F-02
	it("submit add form -> createProject mutation called with { name, stackId }", async () => {
		const createProject = vi
			.fn()
			.mockResolvedValue({ _id: PROJECT_ID, slug: "new-project-ID" });
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);
		useMutation.mockReturnValue(createProject);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);

		const nameInput = screen.getByPlaceholderText(/project name/i);
		fireEvent.change(nameInput, { target: { value: "Fresh Project" } });

		const addButton = screen.getByRole("button", { name: /add/i });
		fireEvent.click(addButton);

		expect(createProject).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Fresh Project", stackId: STACK_ID }),
		);
	});

	// TC-F-03
	it("submit edit form -> updateProject called with new name + project _id", async () => {
		const updateProject = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: PROJECT_ID,
				name: "Old Name",
				slug: "old-name-ID",
				shortId: "ID",
				fileCount: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);
		useMutation.mockReturnValue(updateProject);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);

		// Open edit form for the project
		const editButton = screen.getByRole("button", { name: /edit old name/i });
		fireEvent.click(editButton);

		const nameInput = screen.getByDisplayValue("Old Name");
		fireEvent.change(nameInput, { target: { value: "New Name" } });

		const saveButton = screen.getByRole("button", { name: /save/i });
		fireEvent.click(saveButton);

		expect(updateProject).toHaveBeenCalledWith(
			expect.objectContaining({ projectId: PROJECT_ID, name: "New Name" }),
		);
	});

	// TC-F-04
	it("confirm delete -> deleteProject called with { projectId }", async () => {
		const deleteProject = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: PROJECT_ID,
				name: "Deletable",
				slug: "deletable-ID",
				shortId: "ID",
				fileCount: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);
		useMutation.mockReturnValue(deleteProject);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);

		const deleteButton = screen.getByRole("button", {
			name: /delete deletable/i,
		});
		fireEvent.click(deleteButton);

		// Confirm in the dialog — scope to it so the row's own delete button doesn't also match.
		const dialog = screen.getByRole("dialog");
		const confirmButton = within(dialog).getByRole("button", {
			name: /confirm|delete/i,
		});
		await act(async () => {
			fireEvent.click(confirmButton);
		});

		expect(deleteProject).toHaveBeenCalledWith({ projectId: PROJECT_ID });
	});

	// TC-F-05
	it("no mutation fires on initial render", async () => {
		const mutationSpy = vi.fn();
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: PROJECT_ID,
				name: "Live One",
				slug: "live-one-ID",
				shortId: "ID",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);
		useMutation.mockReturnValue(mutationSpy);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);

		// Mounting alone must not trigger any mutation
		expect(mutationSpy).not.toHaveBeenCalled();
	});

	// TC-F-06
	it("does NOT contain the text 'npx @use-aistack/cli collect' in edit mode", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);
		expect(
			screen.queryByText(/npx @use-aistack\/cli collect/i),
		).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group F (continued): field pass-through, reorder, URL validation
// ---------------------------------------------------------------------------

describe("ProjectsStep – edit mode: add form passes all fields", () => {
	const STACK_ID = "stack_abc123" as never;
	const PROJECT_ID = "project_xyz" as never;

	// TC-F-07: createProject receives description, url, and tags in addition to name.
	it("submit add form with description/url/tags -> createProject called with all fields", async () => {
		const createProject = vi
			.fn()
			.mockResolvedValue({ _id: PROJECT_ID, slug: "full-project-ID" });
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);
		useMutation.mockReturnValue(createProject);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);

		fireEvent.change(screen.getByPlaceholderText(/project name/i), {
			target: { value: "Full Project" },
		});
		fireEvent.change(screen.getByPlaceholderText(/short description/i), {
			target: { value: "A great project" },
		});
		// URL placeholder is "https://..." — use label to avoid escaping pitfalls.
		fireEvent.change(screen.getByLabelText(/^url$/i), {
			target: { value: "https://full.example.com" },
		});
		// Add a tag via Enter key
		const tagInput = screen.getByPlaceholderText(/add tag/i);
		fireEvent.change(tagInput, { target: { value: "typescript" } });
		fireEvent.keyDown(tagInput, { key: "Enter" });

		fireEvent.click(screen.getByRole("button", { name: /add/i }));

		expect(createProject).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Full Project",
				description: "A great project",
				url: "https://full.example.com",
				tags: ["typescript"],
				stackId: STACK_ID,
			}),
		);
	});

	// TC-F-08: updateProject receives description, url, and tags in addition to name/id.
	it("submit edit form with description/url/tags -> updateProject called with all fields", async () => {
		const updateProject = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: PROJECT_ID,
				name: "Bare Project",
				slug: "bare-project-ID",
				shortId: "ID",
				description: undefined,
				url: undefined,
				tags: undefined,
				fileCount: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);
		useMutation.mockReturnValue(updateProject);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);

		fireEvent.click(screen.getByRole("button", { name: /edit bare project/i }));

		// After opening the edit form, both it and the "Add" form at the bottom are visible.
		// The edit form is rendered first; use index [0] to scope to it.
		fireEvent.change(screen.getByDisplayValue("Bare Project"), {
			target: { value: "Updated Project" },
		});
		fireEvent.change(screen.getAllByPlaceholderText(/short description/i)[0], {
			target: { value: "Now has a description" },
		});
		// URL field: use getByLabelText but there are two "URL" labels — take [0] (edit form).
		fireEvent.change(screen.getAllByLabelText(/^url$/i)[0], {
			target: { value: "https://updated.example.com" },
		});
		const tagInput = screen.getAllByPlaceholderText(/add tag/i)[0];
		fireEvent.change(tagInput, { target: { value: "react" } });
		fireEvent.keyDown(tagInput, { key: "Enter" });

		fireEvent.click(screen.getByRole("button", { name: /save/i }));

		expect(updateProject).toHaveBeenCalledWith(
			expect.objectContaining({
				projectId: PROJECT_ID,
				name: "Updated Project",
				description: "Now has a description",
				url: "https://updated.example.com",
				tags: ["react"],
			}),
		);
	});
});

describe("ProjectsStep – edit mode: reorder", () => {
	const STACK_ID = "stack_abc123" as never;
	const PROJECT_A_ID = "project_aaa" as never;
	const PROJECT_B_ID = "project_bbb" as never;

	// TC-F-09: clicking the down button on the first project calls reorderProjects with swapped order.
	it("down button on first project -> reorderProjects called with [B, A] order", async () => {
		const reorderProjects = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: PROJECT_A_ID,
				name: "Alpha",
				slug: "alpha-AAA",
				shortId: "AAA",
				fileCount: 0,
				createdAt: 1000,
				updatedAt: 1000,
			},
			{
				_id: PROJECT_B_ID,
				name: "Beta",
				slug: "beta-BBB",
				shortId: "BBB",
				fileCount: 0,
				createdAt: 2000,
				updatedAt: 2000,
			},
		]);
		useMutation.mockReturnValue(reorderProjects);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);

		// The first row's down button is the second button overall (up=disabled at index 0, down=enabled).
		// We have two rows: [upA(disabled), downA, editA, deleteA, upB, downB(disabled), editB, deleteB]
		// All buttons without role-label — query by ChevronDown icon or by finding all buttons.
		const allButtons = screen.getAllByRole("button");
		// Button order per row: up(0), down(1), edit(pencil), delete(trash)
		// Row A (index 0): up disabled, down enabled → allButtons[0]=upA, allButtons[1]=downA
		// Row B (index 1): up enabled, down disabled
		// Then edit mode "Add a project" form: Add button
		// Row A's down button is index 1
		const downButtonA = allButtons[1];
		fireEvent.click(downButtonA);

		expect(reorderProjects).toHaveBeenCalledWith({
			stackId: STACK_ID,
			projectIds: [PROJECT_B_ID, PROJECT_A_ID],
		});
	});

	// TC-F-10: clicking the up button on the second project calls reorderProjects with swapped order.
	it("up button on second project -> reorderProjects called with [B, A] order", async () => {
		const reorderProjects = vi.fn().mockResolvedValue(null);
		const { useQuery, useMutation } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: PROJECT_A_ID,
				name: "Alpha",
				slug: "alpha-AAA",
				shortId: "AAA",
				fileCount: 0,
				createdAt: 1000,
				updatedAt: 1000,
			},
			{
				_id: PROJECT_B_ID,
				name: "Beta",
				slug: "beta-BBB",
				shortId: "BBB",
				fileCount: 0,
				createdAt: 2000,
				updatedAt: 2000,
			},
		]);
		useMutation.mockReturnValue(reorderProjects);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} />);

		// Row B's up button: buttons are [upA(0), downA(1), editA(2), deleteA(3), upB(4), downB(5), editB(6), deleteB(7), Add(8)]
		const allButtons = screen.getAllByRole("button");
		const upButtonB = allButtons[4];
		fireEvent.click(upButtonB);

		expect(reorderProjects).toHaveBeenCalledWith({
			stackId: STACK_ID,
			projectIds: [PROJECT_B_ID, PROJECT_A_ID],
		});
	});
});

describe("ProjectsStep – create mode: client-side URL validation", () => {
	// TC-F-11: an unparseable URL shows an error and does NOT call onProjectsChange.
	it("submitting an invalid URL shows error and blocks onProjectsChange", () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[]}
				onProjectsChange={onProjectsChange}
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText(/project name/i), {
			target: { value: "Bad URL Project" },
		});
		// A URL with spaces cannot be parsed — safeExternalUrl returns null for it.
		fireEvent.change(screen.getByLabelText(/^url$/i), {
			target: { value: "not a valid url !!!" },
		});
		fireEvent.click(screen.getByRole("button", { name: /add/i }));

		expect(onProjectsChange).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});

	// TC-F-12: a valid https URL submits normally.
	it("submitting a valid https URL calls onProjectsChange with that url", () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[]}
				onProjectsChange={onProjectsChange}
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText(/project name/i), {
			target: { value: "Good URL Project" },
		});
		fireEvent.change(screen.getByLabelText(/^url$/i), {
			target: { value: "https://valid.example.com" },
		});
		fireEvent.click(screen.getByRole("button", { name: /add/i }));

		expect(onProjectsChange).toHaveBeenCalledOnce();
		const arg = onProjectsChange.mock.calls[0][0];
		expect(arg[0].url).toBe("https://valid.example.com");
	});

	// TC-F-13: an empty URL submits without error.
	it("submitting with an empty URL calls onProjectsChange without error", () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[]}
				onProjectsChange={onProjectsChange}
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText(/project name/i), {
			target: { value: "No URL Project" },
		});
		// Leave URL empty
		fireEvent.click(screen.getByRole("button", { name: /add/i }));

		expect(onProjectsChange).toHaveBeenCalledOnce();
		const arg = onProjectsChange.mock.calls[0][0];
		expect(arg[0].url).toBeUndefined();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});

describe("ProjectFormFields – tag input Enter-key behavior", () => {
	// TC-G-01: pressing Enter in the tag input calls onAddTag.
	it("pressing Enter in the tag input fires onAddTag", async () => {
		// Render ProjectsStep in create mode and interact with the tag input
		// indirectly via the inline form (ProjectFormFields is not exported standalone).
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[]}
				onProjectsChange={onProjectsChange}
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText(/project name/i), {
			target: { value: "Tagged Project" },
		});
		const tagInput = screen.getByPlaceholderText(/add tag/i);
		fireEvent.change(tagInput, { target: { value: "vitest" } });
		fireEvent.keyDown(tagInput, { key: "Enter" });

		// After Enter the tag badge should appear
		expect(screen.getByText("vitest")).toBeInTheDocument();

		// Submit and confirm the tag was included
		fireEvent.click(screen.getByRole("button", { name: /add/i }));
		expect(onProjectsChange).toHaveBeenCalledOnce();
		const arg = onProjectsChange.mock.calls[0][0];
		expect(arg[0].tags).toContain("vitest");
	});
});

// ---------------------------------------------------------------------------
// Group H: Editor section ordering
// TC-H-01 ProjectsStep anchor appears between section-details and section-workflow
// ---------------------------------------------------------------------------
// Note: sentinel divs are inserted via DOM API to avoid the Biome
// lint/correctness/useUniqueElementIds rule that flags static id attributes in JSX.

describe("ProjectsStep section anchor ordering", () => {
	it("section-projects anchor appears between section-details and section-workflow", () => {
		// Insert sentinel divs via DOM, outside of React, to avoid static-id lint.
		const container = document.createElement("div");
		document.body.appendChild(container);

		const detailsDiv = document.createElement("div");
		detailsDiv.id = "section-details";
		container.appendChild(detailsDiv);

		const mountPoint = document.createElement("div");
		container.appendChild(mountPoint);

		const workflowDiv = document.createElement("div");
		workflowDiv.id = "section-workflow";
		container.appendChild(workflowDiv);

		render(
			<ProjectsStep mode="create" projects={[]} onProjectsChange={() => {}} />,
			{ container: mountPoint },
		);

		const details = document.getElementById("section-details");
		const projects = document.getElementById("section-projects");
		const workflow = document.getElementById("section-workflow");

		if (!(details && projects && workflow)) {
			throw new Error(
				"Expected section-details, section-projects, and section-workflow to all be in the DOM",
			);
		}

		expect(details.compareDocumentPosition(projects)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(projects.compareDocumentPosition(workflow)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);

		document.body.removeChild(container);
	});
});
