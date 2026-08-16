// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProjectFavicon } from "@/components/projects/ProjectFavicon";

afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// Group A - ProjectFavicon shared module
// ---------------------------------------------------------------------------
// The inline ProjectFavicon in ProjectsSection.tsx builds the URL as:
//   `https://www.google.com/s2/favicons?domain=${new URL(href).hostname}&sz=64`
// width=20, height=20, className="size-5 shrink-0", loading="lazy",
// referrerPolicy="no-referrer", alt="", aria-hidden="true"
// On error: returns null (no <img> in the DOM).
// ---------------------------------------------------------------------------

describe("ProjectFavicon", () => {
	// TC-FAV-01: basic render - src shape, referrerpolicy, loading, size class.
	it("TC-FAV-01: renders one img with google s2/favicons src, domain=example.com, referrerpolicy, loading=lazy, size-5 class", () => {
		render(<ProjectFavicon href="https://example.com" />);
		const img = screen.getByTestId("project-favicon");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute(
			"src",
			expect.stringContaining("https://www.google.com/s2/favicons"),
		);
		expect(img).toHaveAttribute(
			"src",
			expect.stringContaining("domain=example.com"),
		);
		expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
		expect(img).toHaveAttribute("loading", "lazy");
		expect(img).toHaveClass("size-5");
	});

	// TC-FAV-02: src contains sz=64.
	it("TC-FAV-02: img src contains sz=64", () => {
		render(<ProjectFavicon href="https://example.com" />);
		const img = screen.getByTestId("project-favicon");
		expect(img).toHaveAttribute("src", expect.stringContaining("sz=64"));
	});

	// TC-FAV-03: firing error on the img → no img remains.
	it("TC-FAV-03: after error event on img, no img element remains", () => {
		render(<ProjectFavicon href="https://example.com" />);
		const img = screen.getByTestId("project-favicon");
		fireEvent.error(img);
		expect(screen.queryByTestId("project-favicon")).not.toBeInTheDocument();
	});

	// TC-FAV-04: img has alt="" and aria-hidden="true" (decorative).
	it("TC-FAV-04: img has alt='' and aria-hidden='true'", () => {
		render(<ProjectFavicon href="https://example.com" />);
		const img = screen.getByTestId("project-favicon");
		expect(img).toHaveAttribute("alt", "");
		expect(img).toHaveAttribute("aria-hidden", "true");
	});

	// TC-FAV-05: subdomain URL → src contains hostname only (no path).
	it("TC-FAV-05: href with subdomain and path → src contains domain=sub.example.com and does NOT contain /some/path", () => {
		render(<ProjectFavicon href="https://sub.example.com/some/path?q=1" />);
		const img = screen.getByTestId("project-favicon");
		expect(img).toHaveAttribute(
			"src",
			expect.stringContaining("domain=sub.example.com"),
		);
		expect(img).not.toHaveAttribute(
			"src",
			expect.stringContaining("/some/path"),
		);
	});
});
