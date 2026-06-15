// @vitest-environment jsdom
/**
 * RED tests for the v3 StackOgImage contract.
 *
 * Design contract:
 *   - stackImageUrl prop is REMOVED from StackOgImageProps.
 *   - When creator.avatarUrl is present, render <img src={creator.avatarUrl}>.
 *   - When creator.avatarUrl is absent, render initials (no avatar img).
 *
 * TC-OG-01 and TC-OG-02 will fail until the prop is removed and the render
 * logic switches from `stackImageUrl` to `creator.avatarUrl`.
 * TC-OG-03 is a type-level check; written as it.skip with a tsc note because
 * @ts-expect-error inside a vitest file only fails the build, not the test run.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StackOgImage } from "@/components/og/StackOgImage";

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const BASE_PROPS = {
	name: "My Stack",
	oneLiner: "A practical AI stack",
	hasUsageComponent: false,
	tools: [],
	categories: [],
} as const;

// ---------------------------------------------------------------------------
// TC-OG-01: renders <img src={creator.avatarUrl}> when creator.avatarUrl present
// ---------------------------------------------------------------------------

describe("StackOgImage", () => {
	it("TC-OG-01: renders img with creator.avatarUrl when present (no stackImageUrl prop)", () => {
		render(
			<StackOgImage
				{...BASE_PROPS}
				creator={{
					name: "Alp",
					avatarUrl: "https://storage.example.com/avatar.webp",
				}}
				// stackImageUrl must NOT appear here — the prop is removed in v3.
				// If the type still includes it the implementation hasn't landed yet.
			/>,
		);

		const img = screen.getByRole("img", {
			// The avatar img has no accessible name in OG context — query by src
			hidden: true,
		});
		// There may be tool icon imgs too; find the one with the avatar src
		const avatarImg = document.querySelector(
			`img[src="https://storage.example.com/avatar.webp"]`,
		);
		expect(avatarImg).not.toBeNull();
	});

	// ---------------------------------------------------------------------------
	// TC-OG-02: renders initials (no avatar img) when creator.avatarUrl absent
	// ---------------------------------------------------------------------------

	it("TC-OG-02: renders initials fallback when creator.avatarUrl is absent", () => {
		const { container } = render(
			<StackOgImage {...BASE_PROPS} creator={{ name: "Alp Ortac" }} />,
		);

		// No img with an avatar src
		const avatarImg = container.querySelector(`img[src^="https://storage"]`);
		expect(avatarImg).toBeNull();

		// Initials "AO" must appear somewhere in the rendered output
		expect(container.textContent).toContain("AO");
	});

	// ---------------------------------------------------------------------------
	// TC-OG-03: stackImageUrl prop must NOT exist on StackOgImageProps
	// Written as it.skip because @ts-expect-error only catches this at tsc time,
	// not at vitest runtime. Verify by running: pnpm tsc --noEmit
	// and confirming the ts-expect-error line below does NOT produce a
	// "Unused '@ts-expect-error' directive" error (i.e. the prop truly doesn't exist).
	// ---------------------------------------------------------------------------

	it.skip("TC-OG-03 (type-level, verify via tsc): stackImageUrl prop must not exist on StackOgImageProps", () => {
		// To verify: uncomment the block below and run `pnpm tsc --noEmit`.
		// If stackImageUrl is still on the type, tsc will error on the usage
		// (not on the @ts-expect-error), which means the test case fails.
		// If stackImageUrl is removed, tsc will complain that @ts-expect-error
		// is unused — flip the comment direction to confirm removal.
		//
		// @ts-expect-error stackImageUrl must not exist on StackOgImageProps after v3
		// render(<StackOgImage {...BASE_PROPS} creator={{ name: "A" }} stackImageUrl="https://x.com/img.jpg" />)
	});
});
