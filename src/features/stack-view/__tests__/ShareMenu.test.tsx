// @vitest-environment jsdom
/**
 * Tests for the ShareMenu component (TC-SM-01..14 + integration).
 */
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareMenu } from "@/features/stack-view/ShareMenu";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/seo", () => ({
	SITE_URL: "https://aistack.to",
}));

// useClipboard is called TWICE by ShareMenu (one per copy item).
// We use a factory that hands out distinct instances per call so
// individual tests can control/assert each independently.
type ClipboardInstance = {
	copied: boolean;
	failed: boolean;
	copy: ReturnType<typeof vi.fn>;
};

let clipboardInstances: ClipboardInstance[] = [];

vi.mock("@/lib/useClipboard", () => ({
	useClipboard: vi.fn(() => {
		const instance: ClipboardInstance = {
			copied: false,
			failed: false,
			copy: vi.fn().mockResolvedValue(true),
		};
		clipboardInstances.push(instance);
		return instance;
	}),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function openMenu() {
	const trigger = screen.getByRole("button", { name: /share/i });
	fireEvent.click(trigger);
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
	clipboardInstances = [];
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	clipboardInstances = [];
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ShareMenu", () => {
	// TC-SM-01 (AC1): Initially closed — no menu content, trigger present and collapsed.
	it("TC-SM-01: initially no share items visible and Share trigger has aria-expanded=false", () => {
		render(<ShareMenu slug="my-stack" />);

		// No fieldset/group visible
		expect(screen.queryByRole("group")).not.toBeInTheDocument();
		// No item text visible
		expect(screen.queryByText(/copy page link/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/copy preview image/i)).not.toBeInTheDocument();

		const trigger = screen.getByRole("button", { name: /share/i });
		expect(trigger).toBeInTheDocument();
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});

	// TC-SM-02 (AC1): Click Share → fieldset opens with exactly 2 buttons in order.
	it("TC-SM-02: clicking Share opens fieldset with exactly 2 action buttons in correct order", () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();

		// fieldset renders as role="group"
		expect(screen.getByRole("group")).toBeInTheDocument();

		// The two action buttons (trigger is outside the fieldset)
		const pageBtn = screen.getByRole("button", { name: /copy page link/i });
		const ogBtn = screen.getByRole("button", { name: /copy preview image/i });
		expect(pageBtn).toBeInTheDocument();
		expect(ogBtn).toBeInTheDocument();

		// Verify order via DOM position
		expect(
			pageBtn.compareDocumentPosition(ogBtn) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();

		const trigger = screen.getByRole("button", { name: /share/i });
		expect(trigger).toHaveAttribute("aria-expanded", "true");
	});

	// TC-SM-03 (AC2): "Copy page link" copies the correct page URL.
	it("TC-SM-03: clicking Copy page link calls copy with the full page URL", async () => {
		clipboardInstances = [];

		const { useClipboard } = await import("@/lib/useClipboard");
		const pageInstance: ClipboardInstance = {
			copied: false,
			failed: false,
			copy: vi.fn().mockResolvedValue(true),
		};
		const ogInstance: ClipboardInstance = {
			copied: false,
			failed: false,
			copy: vi.fn().mockResolvedValue(true),
		};
		vi.mocked(useClipboard)
			.mockReturnValueOnce(pageInstance)
			.mockReturnValueOnce(ogInstance);

		render(<ShareMenu slug="my-stack" />);
		openMenu();

		fireEvent.click(screen.getByRole("button", { name: /copy page link/i }));

		expect(pageInstance.copy).toHaveBeenCalledTimes(1);
		expect(pageInstance.copy).toHaveBeenCalledWith(
			"https://aistack.to/stacks/my-stack",
		);
	});

	// TC-SM-04 (AC3): "Copy preview image" copies the OG URL without ?v= query string.
	it("TC-SM-04: clicking Copy preview image calls copy with the OG URL (no ?v= suffix)", async () => {
		clipboardInstances = [];

		const { useClipboard } = await import("@/lib/useClipboard");
		const pageInstance: ClipboardInstance = {
			copied: false,
			failed: false,
			copy: vi.fn().mockResolvedValue(true),
		};
		const ogInstance: ClipboardInstance = {
			copied: false,
			failed: false,
			copy: vi.fn().mockResolvedValue(true),
		};
		vi.mocked(useClipboard)
			.mockReturnValueOnce(pageInstance)
			.mockReturnValueOnce(ogInstance);

		render(<ShareMenu slug="my-stack" />);
		openMenu();

		fireEvent.click(
			screen.getByRole("button", { name: /copy preview image/i }),
		);

		expect(ogInstance.copy).toHaveBeenCalledTimes(1);
		const calledWith = ogInstance.copy.mock.calls[0][0] as string;
		expect(calledWith).toBe("https://aistack.to/api/og/stack/my-stack");
		expect(calledWith).not.toMatch(/\?v=/);
	});

	// TC-SM-05 (AC4): First instance copied=true → page link item shows "Copied!", OG item does not.
	it("TC-SM-05: when first clipboard instance has copied=true, page link shows Copied!, OG link does not", async () => {
		clipboardInstances = [];

		const { useClipboard } = await import("@/lib/useClipboard");
		const pageInstance: ClipboardInstance = {
			copied: true,
			failed: false,
			copy: vi.fn().mockResolvedValue(true),
		};
		const ogInstance: ClipboardInstance = {
			copied: false,
			failed: false,
			copy: vi.fn().mockResolvedValue(true),
		};
		vi.mocked(useClipboard)
			.mockReturnValueOnce(pageInstance)
			.mockReturnValueOnce(ogInstance);

		render(<ShareMenu slug="my-stack" />);
		openMenu();

		const pageBtn = screen.getByRole("button", {
			name: /copy page link|copied/i,
		});
		const ogBtn = screen.getByRole("button", { name: /copy preview image/i });
		expect(pageBtn).toHaveTextContent(/copied/i);
		expect(ogBtn).not.toHaveTextContent(/copied/i);
	});

	// TC-SM-06 (AC4 no auto-close): After a copy the menu stays open.
	it("TC-SM-06: menu stays open after clicking a copy item", async () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();

		fireEvent.click(screen.getByRole("button", { name: /copy page link/i }));

		expect(screen.getByRole("group")).toBeInTheDocument();
	});

	// TC-SM-07 (AC6): Escape key closes the menu.
	it("TC-SM-07: pressing Escape closes the menu and sets aria-expanded=false", () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();

		expect(screen.getByRole("group")).toBeInTheDocument();

		fireEvent.keyDown(document, { key: "Escape" });

		expect(screen.queryByRole("group")).not.toBeInTheDocument();
		const trigger = screen.getByRole("button", { name: /share/i });
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});

	// TC-SM-08 (AC6): Click outside the menu closes it.
	it("TC-SM-08: mousedown on document.body closes the menu", () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();

		fireEvent.mouseDown(document.body);

		expect(screen.queryByRole("group")).not.toBeInTheDocument();
	});

	// TC-SM-09 (AC6 boundary): Click inside the fieldset does NOT close it.
	it("TC-SM-09: mousedown inside the fieldset keeps it open", () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();

		const group = screen.getByRole("group");
		fireEvent.mouseDown(group);

		expect(screen.getByRole("group")).toBeInTheDocument();
	});

	// TC-SM-10 (AC6 toggle): Click Share twice → menu closes.
	it("TC-SM-10: clicking Share twice closes the menu", () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();
		openMenu(); // second click

		expect(screen.queryByRole("group")).not.toBeInTheDocument();
		const trigger = screen.getByRole("button", { name: /share/i });
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});

	// TC-SM-11 (AC6 toggle): Click Share three times → menu reopens.
	it("TC-SM-11: clicking Share three times leaves the menu open", () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();
		openMenu(); // closes
		openMenu(); // opens again

		expect(screen.getByRole("group")).toBeInTheDocument();
		const trigger = screen.getByRole("button", { name: /share/i });
		expect(trigger).toHaveAttribute("aria-expanded", "true");
	});

	// TC-SM-12 (AC5): component-level failure state — failed=true shows "Copy failed", not "Copied!".
	it("TC-SM-12: when page clipboard failed=true, shows Copy failed text and no Copied! text", async () => {
		clipboardInstances = [];

		const { useClipboard } = await import("@/lib/useClipboard");
		const pageInstance: ClipboardInstance = {
			copied: false,
			failed: true,
			copy: vi.fn().mockResolvedValue(false),
		};
		const ogInstance: ClipboardInstance = {
			copied: false,
			failed: false,
			copy: vi.fn().mockResolvedValue(true),
		};
		vi.mocked(useClipboard)
			.mockReturnValueOnce(pageInstance)
			.mockReturnValueOnce(ogInstance);

		render(<ShareMenu slug="my-stack" />);
		openMenu();

		// The page link button should show "Copy failed" as visible text in a span.text-destructive
		// (the sr-only live region also contains "Copy failed", so we target the visible span)
		const failSpans = screen.getAllByText(/copy failed/i);
		// At least one of them must be the visible destructive span (not sr-only)
		const visibleFailSpan = failSpans.find(
			(el) =>
				el.classList.contains("text-destructive") ||
				el.closest("[class*='text-destructive']") !== null,
		);
		expect(visibleFailSpan).toBeDefined();

		// No "Copied!" text should appear for any item
		expect(screen.queryByText(/copied!/i)).not.toBeInTheDocument();
	});

	// TC-SM-13 (AC6 Escape focus-return): pressing Escape returns focus to trigger.
	it("TC-SM-13: pressing Escape returns focus to the Share trigger button", () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();

		fireEvent.keyDown(document, { key: "Escape" });

		const trigger = screen.getByRole("button", { name: /share/i });
		expect(document.activeElement).toBe(trigger);
	});

	// TC-SM-14 (AC4/F-4 focus-on-open): first action button is auto-focused on open.
	it("TC-SM-14: clicking Share auto-focuses the first action button (Copy page link)", () => {
		render(<ShareMenu slug="my-stack" />);
		openMenu();

		const firstBtn = screen.getByRole("button", { name: /copy page link/i });
		expect(document.activeElement).toBe(firstBtn);
	});
});

// TC-SM-INTEGRATION lives in ShareMenu.integration.test.tsx
// (that file does not hoist a vi.mock for useClipboard, allowing the real hook).
