// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";

// Per-test mutable context returned by useQuery. Tests reach in and reassign
// to simulate a server push between renders.
const mockState: { context: unknown; mutation: ReturnType<typeof vi.fn> } = {
	context: undefined,
	mutation: vi.fn(),
};

vi.mock("convex/react", () => ({
	useQuery: () => mockState.context,
	useMutation: () => mockState.mutation,
}));

// Force the desktop split-pane layout so the textarea is in the DOM and we
// don't have to drive a media-query change inside the test.
vi.mock("@/lib/useMediaQuery", () => ({
	useMediaQuery: () => true,
}));

import { ResourceBrowser } from "./ResourceBrowser";

const stackId = "stack_1" as unknown as Id<"stacks">;

const twoResourceContext = {
	stackResources: [
		{
			type: "rule",
			name: "CLAUDE.md",
			group: "claude-code",
			stableKey: "claude-code:rule:CLAUDE.md",
			files: [{ name: "CLAUDE.md", content: "v1" }],
		},
		{
			type: "rule",
			name: "rules.mdc",
			group: "cursor",
			stableKey: "cursor:rule:rules.mdc",
			files: [{ name: "rules.mdc", content: "cursor-v1" }],
		},
	],
	projectResources: [],
	stackName: "My Stack",
	projectName: undefined,
	isOwner: true,
	isEditable: true,
	stackId,
};

const baseContext = {
	...twoResourceContext,
	stackResources: [twoResourceContext.stackResources[0]],
};

describe("ResourceBrowser", () => {
	beforeEach(() => {
		mockState.mutation = vi.fn().mockResolvedValue(undefined);
	});

	it("preserves an in-flight draft when the underlying server context is replaced", () => {
		mockState.context = { ...baseContext };

		const { rerender } = render(
			<ResourceBrowser
				target={{ kind: "stack", id: stackId }}
				initialSelection={{
					stableKey: "claude-code:rule:CLAUDE.md",
					fileName: "CLAUDE.md",
				}}
			/>,
		);

		const textarea = screen.getByLabelText(
			/Content of CLAUDE\.md/i,
		) as HTMLTextAreaElement;

		// User edits draft locally.
		fireEvent.change(textarea, { target: { value: "draft" } });
		expect(textarea.value).toBe("draft");

		// Simulate a server push pushing v2 into the same selected file. The
		// open-gate selection ref keeps the local draft authoritative until the
		// user changes selection.
		mockState.context = {
			...baseContext,
			stackResources: [
				{
					...baseContext.stackResources[0],
					files: [{ name: "CLAUDE.md", content: "v2" }],
				},
			],
		};

		// Re-render with the new query result.
		rerender(
			<ResourceBrowser
				target={{ kind: "stack", id: stackId }}
				initialSelection={{
					stableKey: "claude-code:rule:CLAUDE.md",
					fileName: "CLAUDE.md",
				}}
			/>,
		);

		const textareaAfter = screen.getByLabelText(
			/Content of CLAUDE\.md/i,
		) as HTMLTextAreaElement;
		expect(textareaAfter.value).toBe("draft");
	});

	it("ConfirmSwitchDialog: Discard drops the draft and switches to the new file", () => {
		mockState.context = { ...twoResourceContext };

		render(
			<ResourceBrowser
				target={{ kind: "stack", id: stackId }}
				initialSelection={{
					stableKey: "claude-code:rule:CLAUDE.md",
					fileName: "CLAUDE.md",
				}}
			/>,
		);

		// Make the current file dirty.
		const textarea = screen.getByLabelText(
			/Content of CLAUDE\.md/i,
		) as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "dirty draft" } });
		expect(textarea.value).toBe("dirty draft");

		// Try to switch to the cursor rules file — the tree shows file rows; click rules.mdc.
		fireEvent.click(screen.getByText("rules.mdc"));

		// The ConfirmSwitchDialog should now be visible with both Save and Discard.
		expect(
			screen.getByRole("heading", { name: /UNSAVED CHANGES/i }),
		).toBeInTheDocument();
		const discardButton = screen.getByRole("button", { name: /discard/i });
		fireEvent.click(discardButton);

		// After discard, the new file should be active and the dirty draft gone.
		const newTextarea = screen.getByLabelText(
			/Content of rules\.mdc/i,
		) as HTMLTextAreaElement;
		expect(newTextarea.value).toBe("cursor-v1");
		// Dialog is gone.
		expect(
			screen.queryByRole("heading", { name: /UNSAVED CHANGES/i }),
		).not.toBeInTheDocument();
		// Save mutation was NOT called.
		expect(mockState.mutation).not.toHaveBeenCalled();
	});

	it("ConfirmSwitchDialog: Save persists the draft and then switches to the new file", async () => {
		mockState.context = { ...twoResourceContext };

		render(
			<ResourceBrowser
				target={{ kind: "stack", id: stackId }}
				initialSelection={{
					stableKey: "claude-code:rule:CLAUDE.md",
					fileName: "CLAUDE.md",
				}}
			/>,
		);

		// Make the current file dirty.
		const textarea = screen.getByLabelText(
			/Content of CLAUDE\.md/i,
		) as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "saved draft" } });

		// Try to switch — confirm dialog appears.
		fireEvent.click(screen.getByText("rules.mdc"));
		expect(
			screen.getByRole("heading", { name: /UNSAVED CHANGES/i }),
		).toBeInTheDocument();

		// Click Save inside the confirm dialog. There are multiple "Save" buttons
		// (the inline viewer's footer + dialog), but the only enabled one in the
		// dialog is the dialog Save. Find it within the dialog by the label match.
		const dialogSaveButtons = screen.getAllByRole("button", { name: /save/i });
		// Use the last one — the dialog renders later in the tree.
		const dialogSave = dialogSaveButtons[dialogSaveButtons.length - 1];
		await act(async () => {
			fireEvent.click(dialogSave);
		});

		// updateResourceContent mutation was called once with the dirty draft.
		expect(mockState.mutation).toHaveBeenCalledTimes(1);
		expect(mockState.mutation).toHaveBeenCalledWith(
			expect.objectContaining({
				stableKey: "claude-code:rule:CLAUDE.md",
				fileName: "CLAUDE.md",
				content: "saved draft",
			}),
		);
		// Dialog is gone.
		expect(
			screen.queryByRole("heading", { name: /UNSAVED CHANGES/i }),
		).not.toBeInTheDocument();
		// New file is now active.
		expect(screen.getByLabelText(/Content of rules\.mdc/i)).toBeInTheDocument();
	});
});
