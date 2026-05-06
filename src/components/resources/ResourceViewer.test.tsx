// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResourceViewer } from "./ResourceViewer";

describe("ResourceViewer", () => {
	it("emits onContentChange and reflects dirty state when the textarea is edited", () => {
		const onContentChange = vi.fn();
		const onSave = vi.fn().mockResolvedValue(undefined);
		const file = { name: "CLAUDE.md", content: "" };

		const { rerender } = render(
			<ResourceViewer
				file={file}
				editable
				dirty={false}
				onContentChange={onContentChange}
				onSave={onSave}
			/>,
		);

		const textarea = screen.getByLabelText(
			/Content of CLAUDE\.md/i,
		) as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "Hello world" } });

		expect(onContentChange).toHaveBeenCalledWith("Hello world");

		// Save button is disabled when not dirty
		const saveBefore = screen.getByRole("button", { name: /save/i });
		expect(saveBefore.hasAttribute("disabled")).toBe(true);

		// When parent re-renders with dirty=true, save becomes enabled
		rerender(
			<ResourceViewer
				file={{ ...file, content: "Hello world" }}
				editable
				dirty={true}
				onContentChange={onContentChange}
				onSave={onSave}
			/>,
		);
		const saveAfter = screen.getByRole("button", { name: /save/i });
		expect(saveAfter.hasAttribute("disabled")).toBe(false);
	});

	it("invokes onSave and the parent can reset dirty state after save resolves", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const file = { name: "rules.md", content: "v1" };

		const { rerender } = render(
			<ResourceViewer
				file={file}
				editable
				dirty={true}
				onSave={onSave}
				onContentChange={() => {}}
			/>,
		);

		const saveButton = screen.getByRole("button", { name: /save/i });
		fireEvent.click(saveButton);
		expect(onSave).toHaveBeenCalledTimes(1);
		await onSave.mock.results[0].value;

		// Parent flips dirty to false after onSave resolves; viewer reflects clean state.
		rerender(
			<ResourceViewer
				file={file}
				editable
				dirty={false}
				saved={true}
				onSave={onSave}
				onContentChange={() => {}}
			/>,
		);
		const saveAfter = screen.getByRole("button", { name: /save/i });
		expect(saveAfter.hasAttribute("disabled")).toBe(true);
		expect(screen.getByText(/Saved/i)).toBeInTheDocument();
	});
});
