// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StackEditor } from "@/components/StackEditor";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => vi.fn(),
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => []),
	useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("@/features/stack-editor/components/DetailsStep", () => ({
	DetailsStep: () => <div data-testid="details-step" />,
}));
vi.mock("@/features/stack-editor/components/ProjectsStep", () => ({
	ProjectsStep: () => <div data-testid="projects-step" />,
}));
vi.mock("@/features/stack-editor/components/WorkflowStep", () => ({
	WorkflowStep: () => <div data-testid="workflow-step" />,
}));
vi.mock("@/features/stack-editor/components/ToolsSidebar", () => ({
	ToolsSidebar: () => <div data-testid="tools-sidebar" />,
}));
vi.mock("@/components/GridBackground", () => ({
	GridBackground: () => <div data-testid="grid-bg" />,
}));
vi.mock("@/components/SignInDialog", () => ({
	SignInDialog: () => <div data-testid="sign-in-dialog" />,
}));

const ACTOR = {
	_id: "creator_test" as never,
	name: "Test User",
	slug: "test-user",
};

const INITIAL_VALUE = {
	_id: "stack_test" as never,
	name: "My Stack",
	slug: "my-stack",
	oneLiner: "A test stack",
	description: "Description",
	toolSubscriptions: [],
	bundleSubscriptions: [],
	modelSubscriptions: [],
};

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

async function setupUpdateSpy() {
	const updateSpy = vi.fn().mockResolvedValue(undefined);
	const { useMutation } = vi.mocked(await import("convex/react"));
	(
		useMutation as unknown as {
			mockImplementation: (fn: () => typeof updateSpy) => void;
		}
	).mockImplementation(() => updateSpy);
	return updateSpy;
}

describe("StackEditor always-public controls", () => {
	it("shows one Save action and no publish lifecycle controls", async () => {
		await setupUpdateSpy();
		render(
			<StackEditor mode="edit" actor={ACTOR} initialValue={INITIAL_VALUE} />,
		);

		expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /publish/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /unpublish/i }),
		).not.toBeInTheDocument();
	});

	it("saves a stack with no manual tools and sends no published field", async () => {
		const updateSpy = await setupUpdateSpy();
		render(
			<StackEditor mode="edit" actor={ACTOR} initialValue={INITIAL_VALUE} />,
		);

		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
		await waitFor(() => expect(updateSpy).toHaveBeenCalledOnce());
		const args = updateSpy.mock.calls[0]?.[0];
		expect(args).toMatchObject({
			stackId: "stack_test",
			toolSubscriptions: [],
		});
		expect(args).not.toHaveProperty("published");
	});
});
