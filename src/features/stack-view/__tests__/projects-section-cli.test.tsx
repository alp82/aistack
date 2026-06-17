// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectsSection } from "@/components/ProjectsSection";

// Stub Convex hooks used inside ProjectsSection.
vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(() => vi.fn()),
}));

afterEach(() => {
	cleanup();
});

const STACK_ID = "stack_test" as never;

// ---------------------------------------------------------------------------
// Group G: ProjectsSection (view page) CLI copy removal
// ---------------------------------------------------------------------------

describe("ProjectsSection – no CLI copy command", () => {
	// TC-G-01
	it("does not render 'npx @use-aistack/cli collect' when isOwner=true and list is empty", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		// Empty list — owner sees the empty-state UI
		useQuery.mockReturnValue([]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		expect(
			screen.queryByText(/npx @use-aistack\/cli collect/i),
		).not.toBeInTheDocument();
	});

	// TC-G-02
	it("still absent when isOwner=true and a published project exists", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: "project_1" as never,
				name: "Published Project",
				slug: "published-project-ID",
				shortId: "ID",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		expect(
			screen.queryByText(/npx @use-aistack\/cli collect/i),
		).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group B — ProjectsSection `header` prop (TC-HDR-01..03)
// ---------------------------------------------------------------------------

describe("ProjectsSection – header prop", () => {
	const STACK_ID = "stack_test" as never;

	// TC-HDR-01: no header prop → default '// Showcase' kicker present.
	it("TC-HDR-01: no header prop → default '// Showcase' kicker present", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByText(/\/\/ Showcase/i)).toBeInTheDocument();
	});

	// TC-HDR-02: header override → custom text present, '// PROJECTS' absent.
	it("TC-HDR-02: header={<div>CUSTOM HEADER</div>} → 'CUSTOM HEADER' present, '// Showcase' absent", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(
			<ProjectsSection
				index={1}
				stackId={STACK_ID}
				isOwner={false}
				header={<div>CUSTOM HEADER</div>}
			/>,
		);

		expect(screen.getByText("CUSTOM HEADER")).toBeInTheDocument();
		expect(screen.queryByText(/\/\/ Showcase/i)).not.toBeInTheDocument();
	});

	// TC-HDR-03: header override + one project → project name still renders.
	it("TC-HDR-03: header override + one project → project name still renders", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: "project_1" as never,
				name: "My Project",
				description: undefined,
				url: undefined,
				tags: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);

		render(
			<ProjectsSection
				index={1}
				stackId={STACK_ID}
				isOwner={false}
				header={<div>CUSTOM HEADER</div>}
			/>,
		);

		expect(screen.getByText("My Project")).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Group AE: ProjectsSection – always renders / empty state
// ---------------------------------------------------------------------------

describe("ProjectsSection – always renders / empty state", () => {
	// TC-AE-01
	it("non-owner + loaded empty: section heading is present", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(
			screen.getByRole("heading", { name: /^projects$/i }),
		).toBeInTheDocument();
	});

	// TC-AE-02
	it("non-owner + loaded empty: non-owner empty-state copy is present", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(
			screen.getByText(/no projects have been added/i),
		).toBeInTheDocument();
	});

	// TC-AE-03
	it("non-owner + loading: empty-state copy is absent (no flash)", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue(undefined);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(
			screen.queryByText(/no projects have been added/i),
		).not.toBeInTheDocument();
	});

	// TC-AE-04
	it("non-owner + has projects: project name shown, empty-state copy absent", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([
			{
				_id: "project_1" as never,
				name: "Published Project",
				slug: "published-project-ID",
				shortId: "ID",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={false} />);

		expect(screen.getByText("Published Project")).toBeInTheDocument();
		expect(
			screen.queryByText(/no projects have been added/i),
		).not.toBeInTheDocument();
	});

	// TC-AE-05
	it("owner + loaded empty: owner 'Add a project' affordance present, non-owner copy absent", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue([]);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// The owner empty-state block contains a button with exactly "Add a project"
		expect(
			screen.getByRole("button", { name: /^add a project$/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/no projects have been added/i),
		).not.toBeInTheDocument();
	});

	// TC-AE-06
	it("owner + loading: owner empty-state card absent (no owner flash either)", async () => {
		const { useQuery } = vi.mocked(await import("convex/react"));
		useQuery.mockReturnValue(undefined);

		render(<ProjectsSection index={1} stackId={STACK_ID} isOwner={true} />);

		// The owner empty-state card contains a button with exactly "Add a project"
		expect(
			screen.queryByRole("button", { name: /^add a project$/i }),
		).not.toBeInTheDocument();
	});
});
