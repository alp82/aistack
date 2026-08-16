// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccentPicker } from "@/features/stack-editor/components/AccentPicker";
import { ACCENT_PRESETS } from "@/features/stack-view/accentPresets";

afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// A - Closed / default state
// ---------------------------------------------------------------------------

describe("AccentPicker - closed/default", () => {
	it("TC-01: queryByRole('listbox') is null on initial render (value='')", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		expect(screen.queryByRole("listbox")).toBeNull();
	});

	it("TC-02: no input[type='color'] in DOM", () => {
		const { container } = render(<AccentPicker value="" onChange={vi.fn()} />);
		expect(container.querySelector('input[type="color"]')).toBeNull();
	});

	it("TC-03: trigger button has aria-haspopup='listbox'", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		const trigger = screen.getByRole("button", { name: /Accent color: Lime/i });
		expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
	});

	it("TC-04: trigger aria-expanded is 'false' when closed", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		const trigger = screen.getByRole("button", { name: /Accent color: Lime/i });
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("TC-05: value='' → trigger accessible name matches /Accent color: Lime/i", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		expect(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		).toBeTruthy();
	});

	it("TC-06: value='violet' → trigger accessible name matches /Accent color: Violet/i", () => {
		render(<AccentPicker value="violet" onChange={vi.fn()} />);
		expect(
			screen.getByRole("button", { name: /Accent color: Violet/i }),
		).toBeTruthy();
	});

	it("TC-07: queryAllByRole('option') length 0 when closed", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		expect(screen.queryAllByRole("option")).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// B - Open state (after clicking the trigger)
// ---------------------------------------------------------------------------

describe("AccentPicker - open state", () => {
	it("TC-08: getByRole('listbox') present after trigger click", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		const trigger = screen.getByRole("button", { name: /Accent color: Lime/i });
		fireEvent.click(trigger);
		expect(screen.getByRole("listbox")).toBeTruthy();
	});

	it("TC-09: trigger aria-expanded is 'true' after click", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		const trigger = screen.getByRole("button", { name: /Accent color: Lime/i });
		fireEvent.click(trigger);
		expect(trigger).toHaveAttribute("aria-expanded", "true");
	});

	it("TC-10: listbox has accessible name 'Accent color'", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		expect(screen.getByRole("listbox", { name: "Accent color" })).toBeTruthy();
	});

	it("TC-11: getAllByRole('option') length 12 when open", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		expect(screen.getAllByRole("option")).toHaveLength(12);
	});

	it("TC-12: each ACCENT_PRESETS entry has a matching option by name", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		for (const preset of ACCENT_PRESETS) {
			expect(screen.getByRole("option", { name: preset.name })).toBeTruthy();
		}
	});

	it("TC-13: value='violet' → Violet option has aria-selected='true'", () => {
		render(<AccentPicker value="violet" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Violet/i }),
		);
		expect(screen.getByRole("option", { name: "Violet" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});

	it("TC-14: value='violet' → Lime option has aria-selected='false'", () => {
		render(<AccentPicker value="violet" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Violet/i }),
		);
		expect(screen.getByRole("option", { name: "Lime" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});

	it("TC-15: value='' → Lime option has aria-selected='true'", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		expect(screen.getByRole("option", { name: "Lime" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});
});

// ---------------------------------------------------------------------------
// C - Selection behaviour
// ---------------------------------------------------------------------------

// Each option is a <button role="option"> (role lives on the button itself,
// which carries the onClick handler and is the focusable element). The helper
// stays tolerant of a wrapper-element structure too, so it survives a future
// markup change without breaking the selection tests.
function clickOptionButton(name: string) {
	const optionEl = screen.getByRole("option", { name });
	// role=option is on the <button> itself, so optionEl IS the button; the
	// querySelector fallback covers a wrapper-element variant.
	const btn =
		optionEl.tagName === "BUTTON" ? optionEl : optionEl.querySelector("button");
	if (!btn) throw new Error(`No button found inside option "${name}"`);
	fireEvent.click(btn as HTMLElement);
}

describe("AccentPicker - selection", () => {
	it("TC-16: value='', click Violet option → onChange called once with 'violet'", () => {
		const onChange = vi.fn();
		render(<AccentPicker value="" onChange={onChange} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		clickOptionButton("Violet");
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith("violet");
	});

	it("TC-17: value='violet', click Lime option → onChange called once with 'lime'", () => {
		const onChange = vi.fn();
		render(<AccentPicker value="violet" onChange={onChange} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Violet/i }),
		);
		clickOptionButton("Lime");
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith("lime");
	});

	it("TC-18: after selecting any option, listbox is closed", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		clickOptionButton("Violet");
		expect(screen.queryByRole("listbox")).toBeNull();
	});

	it("TC-19: after selection, trigger aria-expanded is 'false'", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		const trigger = screen.getByRole("button", { name: /Accent color: Lime/i });
		fireEvent.click(trigger);
		clickOptionButton("Violet");
		// Re-query trigger - accessible name may have changed; query by haspopup attr
		const newTrigger = screen
			.getAllByRole("button")
			.find((b) => b.getAttribute("aria-haspopup") === "listbox");
		expect(newTrigger).toHaveAttribute("aria-expanded", "false");
	});
});

// ---------------------------------------------------------------------------
// D - Escape key
// ---------------------------------------------------------------------------

describe("AccentPicker - Escape key", () => {
	it("TC-20: open, Escape → listbox removed from DOM", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		fireEvent.keyDown(document, { key: "Escape" });
		expect(screen.queryByRole("listbox")).toBeNull();
	});

	it("TC-21: after Escape, trigger aria-expanded is 'false'", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		const trigger = screen.getByRole("button", { name: /Accent color: Lime/i });
		fireEvent.click(trigger);
		fireEvent.keyDown(document, { key: "Escape" });
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("TC-22: after Escape, document.activeElement is the trigger button", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		const trigger = screen.getByRole("button", { name: /Accent color: Lime/i });
		fireEvent.click(trigger);
		fireEvent.keyDown(document, { key: "Escape" });
		expect(document.activeElement).toBe(trigger);
	});
});

// ---------------------------------------------------------------------------
// E - Arrow key navigation
// ---------------------------------------------------------------------------

describe("AccentPicker - arrow key navigation", () => {
	function getOptionButtons() {
		// Return the focusable <button> elements inside the listbox
		const listbox = screen.getByRole("listbox");
		return Array.from(listbox.querySelectorAll("button"));
	}

	it("TC-23: open, focus first option button, ArrowDown → activeElement is second option button (Green)", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		const optionButtons = getOptionButtons();
		optionButtons[0].focus();
		fireEvent.keyDown(optionButtons[0], { key: "ArrowDown" });
		expect(document.activeElement).toBe(optionButtons[1]);
	});

	it("TC-24: open, focus second option button, ArrowUp → activeElement is first option button (Lime)", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		const optionButtons = getOptionButtons();
		optionButtons[1].focus();
		fireEvent.keyDown(optionButtons[1], { key: "ArrowUp" });
		expect(document.activeElement).toBe(optionButtons[0]);
	});
});

// ---------------------------------------------------------------------------
// F - Outside click closes
// ---------------------------------------------------------------------------

describe("AccentPicker - outside mousedown closes", () => {
	it("TC-25: open, mousedown on document.body → listbox removed from DOM", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: /Accent color: Lime/i }),
		);
		fireEvent.mouseDown(document.body);
		expect(screen.queryByRole("listbox")).toBeNull();
	});

	it("TC-26: after outside mousedown, trigger aria-expanded is 'false'", () => {
		render(<AccentPicker value="" onChange={vi.fn()} />);
		const trigger = screen.getByRole("button", { name: /Accent color: Lime/i });
		fireEvent.click(trigger);
		fireEvent.mouseDown(document.body);
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});
});
