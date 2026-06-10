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

		render(<ProjectsSection stackId={STACK_ID} isOwner={true} />);

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
				published: true,
				fileCount: 2,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		]);

		render(<ProjectsSection stackId={STACK_ID} isOwner={true} />);

		expect(
			screen.queryByText(/npx @use-aistack\/cli collect/i),
		).not.toBeInTheDocument();
	});
});
