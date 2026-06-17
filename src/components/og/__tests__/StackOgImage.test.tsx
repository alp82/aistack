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

	// ---------------------------------------------------------------------------
	// TC-OG-04: http iconUrl renders an <img>, not initials (RED until fix lands)
	// ---------------------------------------------------------------------------

	it("TC-OG-04: tool with http iconUrl renders img, not initials", () => {
		const HTTP_ICON = "http://localhost:3019/api/storage/abc123";
		const { container } = render(
			<StackOgImage
				{...BASE_PROPS}
				creator={{ name: "Alp" }}
				tools={[{ name: "HttpTool", iconUrl: HTTP_ICON }]}
			/>,
		);

		const img = document.querySelector(`img[src="${HTTP_ICON}"]`);
		expect(img).not.toBeNull();

		// Initials must NOT appear when the icon img is rendered
		expect(container.textContent).not.toContain(
			// getInitials("HttpTool") = "H"
			// But "H" is too common — check the full initials fallback div is absent
			// by verifying the img IS present (already asserted above) and that "HT"
			// (two-word initials aren't produced here since name is one word, so
			// initials would be "H") does not appear as the sole icon representation.
			// We assert the img presence as the primary check above.
			"HT",
		);
	});

	// ---------------------------------------------------------------------------
	// TC-OG-05: null iconUrl → no tool-icon img; initials shown (regression guard)
	// ---------------------------------------------------------------------------

	it("TC-OG-05: tool with null iconUrl renders initials, no img", () => {
		// Two-word name so getInitials() produces two-letter initials "NX"
		const { container } = render(
			<StackOgImage
				{...BASE_PROPS}
				creator={{ name: "Alp" }}
				tools={[{ name: "Null Xenon", iconUrl: null }]}
			/>,
		);

		// No img element for the tool icon
		const toolImg = container.querySelector("img[src]");
		// The only img that could appear is a creator avatar img; creator has no
		// avatarUrl here, so there should be zero imgs with a src attribute.
		expect(toolImg).toBeNull();

		// Initials "NX" must appear (getInitials("Null Xenon") = "NX")
		expect(container.textContent).toContain("NX");
	});

	// ---------------------------------------------------------------------------
	// TC-OG-06: empty-string iconUrl → no <img src="">; initials shown (edge guard)
	// ---------------------------------------------------------------------------

	it("TC-OG-06: tool with empty-string iconUrl renders initials, no img", () => {
		// Two-word name so getInitials() produces two-letter initials "EZ"
		const { container } = render(
			<StackOgImage
				{...BASE_PROPS}
				creator={{ name: "Alp" }}
				tools={[{ name: "Empty Zeta", iconUrl: "" }]}
			/>,
		);

		// Must not render an img with src=""
		const emptyImg = document.querySelector('img[src=""]');
		expect(emptyImg).toBeNull();

		// Initials "EZ" must appear (getInitials("Empty Zeta") = "EZ")
		expect(container.textContent).toContain("EZ");
	});

	// ---------------------------------------------------------------------------
	// TC-OG-07: data: iconUrl → img rendered (regression guard, currently green)
	// ---------------------------------------------------------------------------

	it("TC-OG-07: tool with data: iconUrl renders img", () => {
		const DATA_ICON = "data:image/png;base64,abc";
		render(
			<StackOgImage
				{...BASE_PROPS}
				creator={{ name: "Alp" }}
				tools={[{ name: "DataTool", iconUrl: DATA_ICON }]}
			/>,
		);

		const img = document.querySelector(`img[src="${DATA_ICON}"]`);
		expect(img).not.toBeNull();
	});
});
