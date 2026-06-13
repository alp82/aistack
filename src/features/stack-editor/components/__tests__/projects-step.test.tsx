// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
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
// Group E: ProjectsStep create mode — surviving cases
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
});

// ---------------------------------------------------------------------------
// Group C: ProjectsStep edit mode — delegation to ProjectsSection (NEW)
// ---------------------------------------------------------------------------

describe("ProjectsStep – edit mode: delegation to ProjectsSection", () => {
	const STACK_ID = "stack_abc123" as never;

	// TC-NEW-E-01: edit mode + mocked listByStack → live project name visible.
	it("TC-NEW-E-01: mode='edit' renders project name from listByStack", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: "p1" as never,
				name: "Live Project",
				description: undefined,
				url: undefined,
				tags: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} isOwner={true} />);
		expect(screen.getByText("Live Project")).toBeInTheDocument();
	});

	// TC-NEW-E-02: two projects → reorder handle present for each.
	it("TC-NEW-E-02: two projects → reorder handle with accessible name /reorder alpha/i present", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: "p1" as never,
				name: "Alpha",
				description: undefined,
				url: undefined,
				tags: [],
				createdAt: 1000,
				updatedAt: 1000,
			},
			{
				_id: "p2" as never,
				name: "Beta",
				description: undefined,
				url: undefined,
				tags: [],
				createdAt: 2000,
				updatedAt: 2000,
			},
		]);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} isOwner={true} />);
		expect(
			screen.getByRole("button", { name: /reorder alpha/i }),
		).toBeInTheDocument();
	});

	// TC-NEW-E-03: editor kicker present; standalone public // PROJECTS kicker absent.
	it("TC-NEW-E-03: editor kicker '// STEP 02: PROJECTS' present; standalone '// PROJECTS' kicker absent", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} isOwner={true} />);
		expect(screen.getByText(/\/\/ STEP 02: PROJECTS/i)).toBeInTheDocument();
		expect(screen.queryByText(/^\/\/ PROJECTS$/i)).not.toBeInTheDocument();
	});

	// TC-NEW-E-04: section anchor present in edit mode.
	it("TC-NEW-E-04: document.getElementById('section-projects') not null in edit mode", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} isOwner={true} />);
		expect(document.getElementById("section-projects")).toBeInTheDocument();
	});

	// TC-NEW-E-05: isOwner wired → "New Project" button present.
	it("TC-NEW-E-05: isOwner=true → button with accessible name /new project/i present", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsStep mode="edit" stackId={STACK_ID} isOwner={true} />);
		expect(
			screen.getByRole("button", { name: /new project/i }),
		).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group D: Create mode — dialog-based UI (targets post-decouple ProjectsManager)
// ---------------------------------------------------------------------------

describe("ProjectsStep – create mode: dialog-based ProjectsManager UI", () => {
	// TC-NEW-D-01
	it("TC-NEW-D-01: 'New Project' → dialog opens with empty name input", async () => {
		render(
			<ProjectsStep mode="create" projects={[]} onProjectsChange={vi.fn()} />,
		);
		fireEvent.click(screen.getByRole("button", { name: /new project/i }));
		const nameInput = await screen.findByLabelText(/name/i);
		expect(nameInput).toHaveValue("");
	});

	// TC-NEW-D-02
	it("TC-NEW-D-02: dialog → type name → Create → onProjectsChange called once, arg[0].name === typed name, length 1", async () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[]}
				onProjectsChange={onProjectsChange}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /new project/i }));
		const nameInput = await screen.findByLabelText(/name/i);
		fireEvent.change(nameInput, { target: { value: "Dialog Project" } });
		fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
		await waitFor(() => expect(onProjectsChange).toHaveBeenCalledOnce());
		const arg = onProjectsChange.mock.calls[0][0] as { name: string }[];
		expect(arg).toHaveLength(1);
		expect(arg[0].name).toBe("Dialog Project");
	});

	// TC-NEW-D-03
	it("TC-NEW-D-03: one staged item with description → toggle aria-expanded false → click → description visible", async () => {
		render(
			<ProjectsStep
				mode="create"
				projects={[PROJECT_A]}
				onProjectsChange={vi.fn()}
			/>,
		);
		const toggle = screen.getByRole("button", {
			name: /show details for alpha app/i,
		});
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(toggle);
		await waitFor(() =>
			expect(screen.getByText("First project")).toBeInTheDocument(),
		);
	});

	// TC-NEW-D-04
	it("TC-NEW-D-04: expand staged row → Edit → dialog seeded → change name → Save → onProjectsChange last call has updated name", async () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[PROJECT_A]}
				onProjectsChange={onProjectsChange}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha app/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /^edit$/i }),
			).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
		const nameInput = await screen.findByDisplayValue("Alpha App");
		fireEvent.change(nameInput, { target: { value: "Alpha App Renamed" } });
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
		await waitFor(() => expect(onProjectsChange).toHaveBeenCalled());
		const lastArg = onProjectsChange.mock.lastCall?.[0] as {
			name: string;
		}[];
		expect(lastArg.some((p) => p.name === "Alpha App Renamed")).toBe(true);
	});

	// TC-NEW-D-05
	it("TC-NEW-D-05: expand staged row → Delete → ConfirmDialog Delete → onProjectsChange last call arg length 0", async () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[PROJECT_A]}
				onProjectsChange={onProjectsChange}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha app/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /^delete$/i }),
			).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
		const dialog = await screen.findByRole("dialog");
		const confirmBtn = within(dialog).getByRole("button", {
			name: /^delete$/i,
		});
		fireEvent.click(confirmBtn);
		await waitFor(() => expect(onProjectsChange).toHaveBeenCalled());
		const lastArg = onProjectsChange.mock.lastCall?.[0] as unknown[];
		expect(lastArg).toHaveLength(0);
	});

	// TC-NEW-D-06
	it("TC-NEW-D-06: New Project → name filled → URL set to 'not a valid url !!!' → Create → role='alert' shown AND onProjectsChange NOT called", async () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[]}
				onProjectsChange={onProjectsChange}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /new project/i }));
		const nameInput = await screen.findByLabelText(/name/i);
		fireEvent.change(nameInput, { target: { value: "Bad URL Project" } });
		const urlInput = screen.getByLabelText(/^url$/i);
		fireEvent.change(urlInput, { target: { value: "not a valid url !!!" } });
		fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
		await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
		expect(onProjectsChange).not.toHaveBeenCalled();
	});

	// TC-NEW-D-07
	it("TC-NEW-D-07: pre-stage [Alpha, Beta] → ArrowDown reorder Alpha → onProjectsChange swapped → expand Beta → Delete → confirm → final onProjectsChange arg length 1 with name 'Alpha'; no console.error", async () => {
		const consoleError = vi.spyOn(console, "error");
		const onProjectsChange = vi.fn();

		// Start with two staged items, simulate reorder via prop update
		const ALPHA = { name: "Alpha", description: "a" };
		const BETA = { name: "Beta", description: "b" };

		const { rerender } = render(
			<ProjectsStep
				mode="create"
				projects={[ALPHA, BETA]}
				onProjectsChange={onProjectsChange}
			/>,
		);

		// ArrowDown on "Reorder Alpha" handle swaps order
		const reorderHandle = screen.getByRole("button", {
			name: /reorder alpha/i,
		});
		fireEvent.keyDown(reorderHandle, { key: "ArrowDown" });
		await waitFor(() => expect(onProjectsChange).toHaveBeenCalled());

		// Simulate parent applying the swapped list
		const swappedArg = onProjectsChange.mock.lastCall?.[0] as (typeof ALPHA)[];
		onProjectsChange.mockClear();
		rerender(
			<ProjectsStep
				mode="create"
				projects={swappedArg}
				onProjectsChange={onProjectsChange}
			/>,
		);

		// Now Beta is first — expand it
		fireEvent.click(
			screen.getByRole("button", { name: /show details for beta/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /^delete$/i }),
			).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
		const dialog = await screen.findByRole("dialog");
		fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));
		await waitFor(() => expect(onProjectsChange).toHaveBeenCalled());

		const finalArg = onProjectsChange.mock.lastCall?.[0] as (typeof ALPHA)[];
		expect(finalArg).toHaveLength(1);
		expect(finalArg[0].name).toBe("Alpha");
		expect(consoleError).not.toHaveBeenCalled();

		consoleError.mockRestore();
	});

	// TC-NEW-D-08
	// Proves the PARALLEL STABLE-ID CONTRACT: editing a staged project must NOT
	// mint a new id for that row. If editing caused a new id (the rejected WeakMap
	// behavior), Motion's key would change → the row remounts → the accordion panel
	// closes (openId no longer matches). The row staying expanded after editing its
	// own name proves the edit preserved the row's stable parallel id (no remount).
	//
	// Single-open accordion compatible: we only open ONE row (Alpha), edit Alpha
	// itself, and assert Alpha's panel is still open. No need to open a second row.
	it("TC-NEW-D-08: pre-stage [Alpha, Beta] → expand Alpha → open Alpha's own Edit → rename → Save → Alpha row still expanded (proves stable parallel-id; no row remount)", async () => {
		const onProjectsChange = vi.fn();
		const ALPHA = { name: "Alpha", description: "alpha desc" };
		const BETA = { name: "Beta", description: "beta desc" };

		const { rerender } = render(
			<ProjectsStep
				mode="create"
				projects={[ALPHA, BETA]}
				onProjectsChange={onProjectsChange}
			/>,
		);

		// Expand Alpha's row (single-open accordion)
		fireEvent.click(
			screen.getByRole("button", { name: /show details for alpha/i }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /hide details for alpha/i }),
			).toHaveAttribute("aria-expanded", "true"),
		);

		// Open Alpha's own Edit button (now visible inside the expanded panel)
		fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

		// Dialog should be seeded with Alpha's current name
		const nameInput = await screen.findByDisplayValue("Alpha");
		fireEvent.change(nameInput, { target: { value: "Alpha Renamed" } });
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		await waitFor(() => expect(onProjectsChange).toHaveBeenCalled());

		// Simulate parent applying the updated list (name changed in place)
		const updatedProjects = onProjectsChange.mock
			.lastCall?.[0] as (typeof ALPHA)[];
		rerender(
			<ProjectsStep
				mode="create"
				projects={
					updatedProjects ?? [
						{ name: "Alpha Renamed", description: "alpha desc" },
						BETA,
					]
				}
				onProjectsChange={onProjectsChange}
			/>,
		);

		// After save, Alpha's row should STILL be expanded.
		// If editing had minted a new id, the row would remount and the accordion
		// panel would close — querying by the updated name proves it stayed open.
		const updatedToggle = screen.getByRole("button", {
			name: /hide details for alpha renamed/i,
		});
		expect(updatedToggle).toHaveAttribute("aria-expanded", "true");
	});

	// TC-NEW-D-09
	it("TC-NEW-D-09: New Project dialog, empty name → Create button disabled; clicking does not call onProjectsChange", async () => {
		const onProjectsChange = vi.fn();
		render(
			<ProjectsStep
				mode="create"
				projects={[]}
				onProjectsChange={onProjectsChange}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /new project/i }));
		await screen.findByLabelText(/name/i); // dialog open
		const createBtn = screen.getByRole("button", { name: /^create$/i });
		expect(createBtn).toBeDisabled();
		fireEvent.click(createBtn);
		expect(onProjectsChange).not.toHaveBeenCalled();
	});

	// TC-NEW-D-10
	it("TC-NEW-D-10: 2 staged items → both reorder handles present; rerender 1 item → no reorder handles", () => {
		const ALPHA = { name: "Alpha" };
		const BETA = { name: "Beta" };
		const props = {
			mode: "create" as const,
			projects: [ALPHA, BETA],
			onProjectsChange: vi.fn(),
		};
		const { rerender } = render(<ProjectsStep {...props} />);
		expect(
			screen.getByRole("button", { name: /reorder alpha/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /reorder beta/i }),
		).toBeInTheDocument();
		rerender(<ProjectsStep {...props} projects={[ALPHA]} />);
		expect(
			screen.queryByRole("button", { name: /reorder alpha/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /reorder beta/i }),
		).not.toBeInTheDocument();
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
