// @vitest-environment jsdom
/**
 * TC-SM-INTEGRATION (AC2+AC3 real wiring).
 *
 * This file intentionally does NOT vi.mock("@/lib/useClipboard") so the real
 * hook is exercised. navigator.clipboard.writeText is stubbed via vi.stubGlobal.
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

vi.mock("@/lib/seo", () => ({
	SITE_URL: "https://aistack.to",
}));

describe("ShareMenu integration (real hook)", () => {
	let writeText: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", {
			clipboard: { writeText },
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		cleanup();
	});

	// TC-SM-INTEGRATION: Copy page link passes the exact page URL; Copy preview image passes the exact OG URL.
	it("TC-SM-INTEGRATION: Copy page link → exact page URL; Copy preview image → exact OG URL", async () => {
		render(<ShareMenu slug="my-stack" />);

		// Open the share menu
		fireEvent.click(screen.getByRole("button", { name: /share/i }));

		// Click "Copy page link"
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /copy page link/i }));
		});

		expect(writeText).toHaveBeenCalledWith(
			"https://aistack.to/stacks/my-stack",
		);

		writeText.mockClear();

		// Click "Copy preview image"
		await act(async () => {
			fireEvent.click(
				screen.getByRole("button", { name: /copy preview image/i }),
			);
		});

		expect(writeText).toHaveBeenCalledWith(
			"https://aistack.to/api/og/stack/my-stack",
		);
	});
});
