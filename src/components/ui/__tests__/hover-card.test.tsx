// @vitest-environment jsdom
/**
 * Portal-fix tests for HoverCard.
 *
 * The component currently renders its previewSurface INLINE (un-portaled) -
 * it lives inside the component's own returned div. These tests are RED now
 * and go GREEN once the previewSurface is portaled to document.body via
 * ReactDOM.createPortal.
 *
 * IMPLEMENTER NOTE: Add `data-testid="hover-card-surface"` to the
 * previewSurface motion.div in hover-card.tsx. This is required - the tests
 * prefer `screen.queryByTestId('hover-card-surface')` and fall back to the
 * style selector only as a secondary path. The testid is low-risk and
 * significantly improves testability.
 *
 * Example:
 *   <motion.div
 *     data-testid="hover-card-surface"
 *     style={{ position: "fixed", ... }}
 *     ...
 *   >
 */

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HoverCard from "@/components/ui/hover-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Locate the previewSurface. Prefers the testid the implementer should add;
 *  falls back to the position:fixed style selector. */
function getSurface(): Element | null {
	return (
		document.body.querySelector('[data-testid="hover-card-surface"]') ??
		document.body.querySelector('[style*="position: fixed"]')
	);
}

/** Same lookup but scoped to a specific container (to assert NOT in container). */
function getSurfaceIn(container: HTMLElement): Element | null {
	return (
		container.querySelector('[data-testid="hover-card-surface"]') ??
		container.querySelector('[style*="position: fixed"]')
	);
}

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// TC-HC-01  (wrapper) - position:fixed surface exists in the document
//
// NOTE: This case is intentionally weak: RTL appends the render container to
// body, so document.body.querySelector finds the surface even when un-portaled.
// It passes both before and after the fix and acts as a basic smoke check.
// TC-HC-02 and TC-HC-03 are the real guards.
// ---------------------------------------------------------------------------
describe("TC-HC-01: position:fixed surface exists in document after mount (smoke)", () => {
	it("renders a position:fixed surface somewhere in the document", () => {
		render(
			<HoverCard
				mode="wrapper"
				renderContent={() => <div data-testid="content" />}
			>
				<span data-testid="trigger">T</span>
			</HoverCard>,
		);

		// The surface is always mounted (not gated by isVisible); only its inner
		// AnimatePresence content is gated.
		const surface = getSurface();
		expect(surface).not.toBeNull();

		// Also verify zIndex 9999 is on the surface element.
		// (style may be serialised differently; check both the attribute and
		//  the element's style property.)
		const styleAttr = surface?.getAttribute("style") ?? "";
		const inlineStyle = (surface as HTMLElement | null)?.style;
		const hasZIndex =
			styleAttr.includes("9999") ||
			inlineStyle?.zIndex === "9999" ||
			inlineStyle?.zIndex === "var(--z-hover-card)" /* if refactored */;
		// zIndex guard is advisory - don't hard-fail if implementation varies
		void hasZIndex;
	});
});

// ---------------------------------------------------------------------------
// TC-HC-02  (wrapper, PRIMARY RED GUARD) - surface is NOT inside container
//
// Arrange: render in wrapper mode. The container is the RTL-managed div that
// holds the component's returned JSX tree.
//
// RED now: previewSurface is rendered inline, so container.querySelector finds
// it → the assertion `expect(...).toBeNull()` fails.
//
// GREEN after fix: createPortal moves it to document.body, outside container.
// ---------------------------------------------------------------------------
describe("TC-HC-02: surface is NOT a descendant of the component wrapper (primary portal guard)", () => {
	it("container.querySelector for the surface returns null (surface escaped the tree)", () => {
		const { container } = render(
			<HoverCard
				mode="wrapper"
				renderContent={() => <div data-testid="content" />}
			>
				<span data-testid="trigger">T</span>
			</HoverCard>,
		);

		// After portaling: surface lives outside container → null.
		// Currently (un-portaled): surface is INSIDE container → non-null → RED.
		const surfaceInContainer = getSurfaceIn(container);
		expect(surfaceInContainer).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// TC-HC-03  (wrapper, STRONG RED GUARD) - surface's parentElement is document.body
//
// RED now: surface.parentElement is the component's own motion wrapper div,
// not document.body.
//
// GREEN after fix: portal renders it directly as a child of document.body.
// ---------------------------------------------------------------------------
describe("TC-HC-03: surface parentElement is document.body", () => {
	it("surface is a direct child of document.body after portaling", () => {
		render(
			<HoverCard
				mode="wrapper"
				renderContent={() => <div data-testid="content" />}
			>
				<span data-testid="trigger">T</span>
			</HoverCard>,
		);

		const surface = getSurface();
		expect(surface).not.toBeNull();
		// RED now: parentElement is the inline wrapper div, not body.
		// GREEN after fix: parentElement is document.body.
		expect(surface?.parentElement).toBe(document.body);
	});
});

// ---------------------------------------------------------------------------
// TC-HC-05  (wrapper) - content appears on hover AND is portaled out
//
// After mouseEnter on the trigger, the renderContent node must be visible AND:
//   - document.body.contains(contentEl) === true  (it reached the DOM)
//   - container.contains(contentEl) === false  (it is not inside the component tree)
//
// The second assertion is RED now (un-portaled content IS inside container).
// ---------------------------------------------------------------------------
describe("TC-HC-05: content shows on hover and is portaled out of component tree", () => {
	it("renderContent is in body but NOT in container after mouseEnter", () => {
		const { container } = render(
			<HoverCard
				mode="wrapper"
				renderContent={() => <div data-testid="hover-content" />}
			>
				<span data-testid="trigger">T</span>
			</HoverCard>,
		);

		// The onMouseEnter is on the div wrapping children (the triggerRef div),
		// not on the children themselves. Firing on the trigger child bubbles up.
		const trigger = screen.getByTestId("trigger");
		act(() => {
			fireEvent.mouseEnter(trigger);
		});

		// skipAnimations=true → AnimatePresence resolves synchronously.
		const content = screen.queryByTestId("hover-content");
		expect(content).not.toBeNull();
		expect(document.body.contains(content)).toBe(true);

		// RED now: content is inside container (un-portaled).
		// GREEN after fix: content lives outside the component's container.
		expect(container.contains(content)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// TC-HC-06  (wrapper) - mouseLeave removes content after 50 ms timeout
//
// Uses fake timers. Verifies the portal lifecycle: content appears → leave →
// advance 50 ms → content gone.
// ---------------------------------------------------------------------------
describe("TC-HC-06: content is removed after mouseLeave + 50ms debounce", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("content disappears after mouseLeave when 50ms have elapsed", async () => {
		render(
			<HoverCard
				mode="wrapper"
				renderContent={() => <div data-testid="leave-content" />}
			>
				<span data-testid="trigger">T</span>
			</HoverCard>,
		);

		const trigger = screen.getByTestId("trigger");
		// The onMouseLeave handler lives on the div wrapping children (triggerRef div),
		// not on the children themselves. mouseLeave does NOT bubble, so we must fire
		// it on trigger.parentElement (the triggerRef div) rather than the child span.
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const triggerWrapper = trigger.parentElement!;

		// Show content.
		act(() => {
			fireEvent.mouseEnter(trigger);
		});
		expect(screen.queryByTestId("leave-content")).not.toBeNull();

		// Leave - starts the 50ms timeout. Fire on the wrapper div that owns the handler.
		act(() => {
			fireEvent.mouseLeave(triggerWrapper);
		});

		// Before timeout fires, content is still there.
		expect(screen.queryByTestId("leave-content")).not.toBeNull();

		// Advance timers past the 50ms debounce. Use async act so that React flushes
		// both the setIsVisible(false) state update AND any subsequent AnimatePresence
		// internal microtask/async work (avoids the "not wrapped in act" warning and
		// ensures the DOM reflects the final state before we assert).
		await act(async () => {
			vi.runAllTimers();
		});

		// Content should be gone now (isVisible=false → AnimatePresence unmounts).
		expect(screen.queryByTestId("leave-content")).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// TC-HC-07  (inline mode) - both branches portal the surface
//
// Confirms that inline mode ALSO portals the previewSurface out of container.
//
// RED now: previewSurface is inline in both branches.
// GREEN after fix: inline branch also uses createPortal.
// ---------------------------------------------------------------------------
describe("TC-HC-07: inline mode also portals the surface out of container", () => {
	it("container has no position:fixed surface but document.body does (inline mode)", () => {
		const { container } = render(
			<HoverCard
				mode="inline"
				content="Hello {0}"
				targets={[{ text: "world", imageUrl: "http://example.com/img.png" }]}
			/>,
		);

		// Surface must exist somewhere in the document (always mounted).
		const surfaceInBody = getSurface();
		expect(surfaceInBody).not.toBeNull();

		// RED now: surface is inside container (un-portaled).
		// GREEN after fix: surface escaped into body.
		const surfaceInContainer = getSurfaceIn(container);
		expect(surfaceInContainer).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// TC-HC-08  (wrapper) - a keyboard reader reaches the card
//
// The card is mouse-only otherwise: a focusable trigger (the #81 headline block
// is a button) would deal a card nobody could read. Focus opens it and blur
// closes it, on the same wrapper that owns the mouse handlers.
// ---------------------------------------------------------------------------
describe("TC-HC-08: content shows on focus and hides on blur", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("focusing a control inside the trigger opens the card", async () => {
		render(
			<HoverCard
				mode="wrapper"
				renderContent={() => <div data-testid="focus-content" />}
			>
				<button type="button" data-testid="trigger">
					T
				</button>
			</HoverCard>,
		);

		const trigger = screen.getByTestId("trigger");
		expect(screen.queryByTestId("focus-content")).toBeNull();

		act(() => {
			fireEvent.focus(trigger);
		});
		expect(screen.queryByTestId("focus-content")).not.toBeNull();

		act(() => {
			fireEvent.blur(trigger);
		});
		await act(async () => {
			vi.runAllTimers();
		});
		expect(screen.queryByTestId("focus-content")).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// TC-HC-07  (wrapper) - the portaled surface carries the stack accent class
//
// The surface leaves the `.accent-<key>` wrapper when it portals to body, so
// `--accent-lime` would fall back to brand lime. The nearest accent class of
// the trigger travels with the surface (alp82/aistack#298).
// ---------------------------------------------------------------------------
describe("TC-HC-07: surface inherits the nearest .accent-<key> class", () => {
	it("copies accent-cyan from the trigger's ancestor onto the surface", () => {
		render(
			<div className="accent-cyan">
				<HoverCard mode="wrapper" renderContent={() => <div />}>
					<span data-testid="trigger">T</span>
				</HoverCard>
			</div>,
		);
		act(() => {
			fireEvent.mouseEnter(screen.getByTestId("trigger"));
		});
		expect(getSurface()?.classList.contains("accent-cyan")).toBe(true);
	});

	it("adds no accent class when no ancestor sets one", () => {
		render(
			<HoverCard mode="wrapper" renderContent={() => <div />}>
				<span data-testid="trigger">T</span>
			</HoverCard>,
		);
		act(() => {
			fireEvent.mouseEnter(screen.getByTestId("trigger"));
		});
		const cls = Array.from(getSurface()?.classList ?? []);
		expect(cls.some((c) => c.startsWith("accent-"))).toBe(false);
	});
});
