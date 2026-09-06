// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MeasuredModels } from "@/features/stack-editor/components/MeasuredModels";
import { formatShare } from "@/features/stack-view/cards";

const mutationMock = vi.fn();
vi.mock("convex/react", () => ({
	useMutation: () => mutationMock,
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const STACK_ID = "stack_1" as never;

describe("MeasuredModels (#338)", () => {
	it("renders rows in server order with the share and a hide control", () => {
		mutationMock.mockResolvedValue(null);
		render(
			<MeasuredModels
				stackId={STACK_ID}
				models={[
					{
						slug: "claude-opus-5",
						name: "Claude Opus 5",
						provider: "Anthropic",
						tokenShare: 0.62,
						hidden: false,
					},
					{
						slug: "gpt-5.4",
						name: "GPT-5.4",
						provider: "OpenAI",
						tokenShare: 0.004,
						hidden: true,
					},
				]}
			/>,
		);
		expect(screen.getByText("Anthropic · 62%")).toBeTruthy();
		expect(screen.getByText("OpenAI · <1%")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Hide Claude Opus 5" }));
		expect(mutationMock).toHaveBeenCalledWith({
			stackId: STACK_ID,
			modelSlug: "claude-opus-5",
			hidden: true,
		});
		fireEvent.click(screen.getByRole("button", { name: "Unhide GPT-5.4" }));
		expect(mutationMock).toHaveBeenCalledWith({
			stackId: STACK_ID,
			modelSlug: "gpt-5.4",
			hidden: false,
		});
	});

	it("renders nothing when no model is measured", () => {
		const { container } = render(
			<MeasuredModels stackId={STACK_ID} models={[]} />,
		);
		expect(container.innerHTML).toBe("");
	});
});

describe("formatShare", () => {
	it("formatShare rounds and floors tiny shares to <1%", () => {
		expect(formatShare(0.62)).toBe("62%");
		expect(formatShare(0.004)).toBe("<1%");
		expect(formatShare(0)).toBe("0%");
		expect(formatShare(1)).toBe("100%");
	});
});
