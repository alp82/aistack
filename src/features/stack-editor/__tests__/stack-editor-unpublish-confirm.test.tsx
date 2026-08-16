// @vitest-environment jsdom
/**
 * Tests for the Unpublish confirmation gate in StackEditor.
 *
 * RED by design: the ConfirmDialog for Unpublish does not exist yet.
 * Currently clicking "Unpublish" fires handleSave(false) immediately.
 * After implementation it must open a ConfirmDialog first.
 */
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StackEditor } from "@/components/StackEditor";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Stub router - StackEditor calls useNavigate() and renders <Link>
vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
	}: {
		children: ReactNode;
		to: string;
		params?: Record<string, string>;
		target?: string;
		className?: string;
	}) => <a href={to}>{children}</a>,
	useNavigate: () => vi.fn(),
}));

// Stub Convex hooks - same mechanism as projects-section.test.tsx
vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => []),
	useMutation: vi.fn(() => vi.fn()),
}));

// Stub all heavy sub-components so only the header buttons render cleanly
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

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const ACTOR = {
	_id: "creator_test" as never,
	name: "Test User",
	slug: "test-user",
};

// A minimal tool subscription entry that satisfies the "at least one tool"
// publish validation guard (toolCount > 0).
const STUB_TOOL = {
	toolSlug: "claude-code",
	toolName: "Claude Code",
	toolShortId: "cc_01",
	toolCategories: ["coding"],
	toolIconUrl: undefined,
	tierId: "free",
	kind: "main" as const,
	primaryUsageLabel: "Free",
	price: {
		pricingType: "fixed" as const,
		fixed: { currency: "USD", amount: 0, period: "month" as const },
	},
	priceKind: "regular" as const,
	description: undefined,
};

const INITIAL_VALUE_PUBLISHED = {
	_id: "stack_test" as never,
	name: "My Stack",
	slug: "my-stack",
	oneLiner: "A test stack",
	description: "Description",
	published: true,
	toolSubscriptions: [STUB_TOOL],
	bundleSubscriptions: [],
	modelSubscriptions: [],
};

const INITIAL_VALUE_UNPUBLISHED = {
	...INITIAL_VALUE_PUBLISHED,
	published: false,
};

// ---------------------------------------------------------------------------
// afterEach cleanup
// ---------------------------------------------------------------------------

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: get the update mutation spy from useMutation mock
// ---------------------------------------------------------------------------

async function setupUpdateSpy(resolvedValue: unknown = undefined) {
	const updateSpy = vi.fn().mockResolvedValue(resolvedValue);
	const { useMutation } = vi.mocked(await import("convex/react"));
	// Return the same spy for every useMutation call (create, update, updateProfile).
	// We use mockImplementation(() => spy) rather than mockReturnValue(spy) so the
	// mock's return type stays loose enough for tsc (a bare vi.fn() lacks the
	// ReactMutation.withOptimisticUpdate member that mockReturnValue would enforce).
	(
		useMutation as unknown as {
			mockImplementation: (fn: () => typeof updateSpy) => void;
		}
	).mockImplementation(() => updateSpy);
	return updateSpy;
}

// ---------------------------------------------------------------------------
// TC-UPC-01: Unpublish click → dialog appears, mutation NOT called immediately
// ---------------------------------------------------------------------------

describe("StackEditor – Unpublish Confirmation", () => {
	it("TC-UPC-01: click Unpublish → dialog with 'Unpublish stack' appears; update mutation NOT called", async () => {
		const updateSpy = await setupUpdateSpy();

		render(
			<StackEditor
				mode="edit"
				actor={ACTOR}
				initialValue={INITIAL_VALUE_PUBLISHED}
			/>,
		);

		// The published state shows a "Published/Unpublish" toggle button
		const unpublishBtn = screen.getByRole("button", { name: /unpublish/i });
		fireEvent.click(unpublishBtn);

		// A dialog must appear
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveTextContent(/unpublish stack/i);

		// The mutation must NOT have been called at click time
		expect(updateSpy).not.toHaveBeenCalled();
	});

	// -----------------------------------------------------------------------
	// TC-UPC-02: dialog confirm → update mutation called with published:false
	// -----------------------------------------------------------------------

	it("TC-UPC-02: click Unpublish → confirm in dialog → update mutation called with published:false", async () => {
		const updateSpy = await setupUpdateSpy();

		render(
			<StackEditor
				mode="edit"
				actor={ACTOR}
				initialValue={INITIAL_VALUE_PUBLISHED}
			/>,
		);

		const unpublishBtn = screen.getByRole("button", { name: /unpublish/i });
		fireEvent.click(unpublishBtn);

		const dialog = await screen.findByRole("dialog");

		// Click the confirm button inside the dialog
		const confirmBtn = within(dialog).getByRole("button", {
			name: /^unpublish$/i,
		});
		fireEvent.click(confirmBtn);

		// The update mutation must have been called exactly once with published:false
		expect(updateSpy).toHaveBeenCalledOnce();
		expect(updateSpy).toHaveBeenCalledWith(
			expect.objectContaining({ published: false }),
		);
	});

	// -----------------------------------------------------------------------
	// TC-UPC-03: dialog cancel → mutation NOT called, dialog removed
	// -----------------------------------------------------------------------

	it("TC-UPC-03: click Unpublish → cancel in dialog → mutation NOT called; dialog removed from DOM", async () => {
		const updateSpy = await setupUpdateSpy();

		render(
			<StackEditor
				mode="edit"
				actor={ACTOR}
				initialValue={INITIAL_VALUE_PUBLISHED}
			/>,
		);

		const unpublishBtn = screen.getByRole("button", { name: /unpublish/i });
		fireEvent.click(unpublishBtn);

		const dialog = await screen.findByRole("dialog");
		const cancelBtn = within(dialog).getByRole("button", { name: /cancel/i });
		fireEvent.click(cancelBtn);

		// Mutation must NOT have been called
		expect(updateSpy).not.toHaveBeenCalled();

		// Dialog must be gone
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	// -----------------------------------------------------------------------
	// TC-UPC-06 (regression): published=false → click "Publish" → no dialog;
	//                           mutation called immediately (untouched path)
	// -----------------------------------------------------------------------

	it("TC-UPC-06: published=false → click Publish → no dialog; mutation called immediately", async () => {
		const updateSpy = await setupUpdateSpy();

		render(
			<StackEditor
				mode="edit"
				actor={ACTOR}
				initialValue={INITIAL_VALUE_UNPUBLISHED}
			/>,
		);

		// In unpublished state the primary button is "Publish"
		const publishBtn = screen.getByRole("button", { name: /^publish$/i });
		fireEvent.click(publishBtn);

		// No dialog should appear
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		// Mutation should fire immediately (create or update is called)
		expect(updateSpy).toHaveBeenCalled();
	});

	// -----------------------------------------------------------------------
	// TC-UPC-07 (regression): published=true → click "Save" → no dialog;
	//                          update mutation called with published:true
	// -----------------------------------------------------------------------

	it("TC-UPC-07: published=true → click Save → no dialog; update mutation called with published:true", async () => {
		const updateSpy = await setupUpdateSpy();

		render(
			<StackEditor
				mode="edit"
				actor={ACTOR}
				initialValue={INITIAL_VALUE_PUBLISHED}
			/>,
		);

		// In published state the lime-filled button is "Save"
		const saveBtn = screen.getByRole("button", { name: /^save$/i });
		fireEvent.click(saveBtn);

		// No dialog should appear
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		// Mutation fires immediately with published:true
		expect(updateSpy).toHaveBeenCalledOnce();
		expect(updateSpy).toHaveBeenCalledWith(
			expect.objectContaining({ published: true }),
		);
	});
});
