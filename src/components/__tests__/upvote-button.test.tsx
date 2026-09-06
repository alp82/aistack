// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpvoteButton } from "@/components/UpvoteButton";

afterEach(cleanup);

const button = () => screen.getByRole("button");

describe("the stack variant (default)", () => {
	it("prints the count alone under the triangle and no word", () => {
		render(<UpvoteButton count={7} />);
		expect(button()).toHaveTextContent(/^7$/);
		expect(button()).toHaveAttribute("aria-label", "Upvote, 7 upvotes");
		expect(button()).toHaveAttribute("aria-pressed", "false");
		expect(button().className).toContain("flex-col");
		expect(button().className).toContain("bg-bg-panel-muted");
	});

	it("keeps the size widths", () => {
		const { rerender } = render(<UpvoteButton count={1} size="sm" />);
		expect(button().className).toContain("w-10");
		rerender(<UpvoteButton count={1} size="md" />);
		expect(button().className).toContain("w-16");
	});
});

describe("the outline variant", () => {
	it("prints the word Upvote and the count on one row in a lime outline", () => {
		render(<UpvoteButton count={12} variant="outline" />);
		expect(button()).toHaveTextContent(/^Upvote\s*12$/);
		expect(button()).toHaveAttribute("aria-label", "Upvote, 12 upvotes");
		expect(button()).toHaveAttribute("aria-pressed", "false");
		expect(button().className).toContain("border-accent-lime");
		expect(button().className).toContain("bg-transparent");
		expect(button().className).not.toContain("flex-col");
		expect(button().className).toContain("font-mono");
		expect(button().className).toContain("uppercase");
	});

	it("renders filled lime once upvoted and offers to remove the vote", () => {
		render(<UpvoteButton count={1} variant="outline" upvoted />);
		expect(button()).toHaveAttribute("aria-label", "Remove upvote, 1 upvote");
		expect(button()).toHaveAttribute("aria-pressed", "true");
		expect(button().className).toContain("bg-accent-lime ");
		expect(button().className).toContain("text-accent-lime-contrast");
		expect(button().className).not.toContain("bg-transparent");
	});

	it("passes the className through so the row can stretch it", () => {
		render(<UpvoteButton count={0} variant="outline" className="w-full" />);
		expect(button().className).toContain("w-full");
	});

	it("stays disabled with its title and swallows the click", () => {
		const onClick = vi.fn();
		render(
			<UpvoteButton
				count={3}
				variant="outline"
				disabled
				title="You can't upvote your own stack"
				onClick={onClick}
			/>,
		);
		expect(button()).toBeDisabled();
		expect(button()).toHaveAttribute(
			"title",
			"You can't upvote your own stack",
		);
		fireEvent.click(button());
		expect(onClick).not.toHaveBeenCalled();
	});

	it("calls onClick and onMouseEnter when enabled", () => {
		const onClick = vi.fn();
		const onMouseEnter = vi.fn();
		render(
			<UpvoteButton
				count={3}
				variant="outline"
				onClick={onClick}
				onMouseEnter={onMouseEnter}
			/>,
		);
		fireEvent.mouseEnter(button());
		fireEvent.click(button());
		expect(onMouseEnter).toHaveBeenCalledOnce();
		expect(onClick).toHaveBeenCalledOnce();
	});
});
