// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LandingPageShell } from "@/features/landing/LandingPageShell";

// The shell's sections render real tanstack-router <Link>s, which require a
// RouterProvider. Swap them for plain anchors so the shell renders standalone.
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

// FeaturedStacksSection renders real StackCards that depend on Convex hooks;
// stub it to a stable heading so the shell-order test stays isolated.
vi.mock("@/features/landing/sections/FeaturedStacksSection", () => ({
	FeaturedStacksSection: () => (
		<section>
			<h2>Featured Stacks</h2>
		</section>
	),
}));

afterEach(() => {
	cleanup();
});

describe("landing sections", () => {
	it("renders sections in shell order", () => {
		render(<LandingPageShell stacks={[]} />);

		const hero = screen.getByRole("heading", {
			level: 1,
			name: /see exactly what/i,
		});
		const featured = screen.getByRole("heading", {
			level: 2,
			name: /featured stacks/i,
		});
		const explainer = screen.getByRole("heading", {
			level: 2,
			name: /why it works/i,
		});
		const cta = screen.getByRole("heading", {
			level: 2,
			name: /publish your/i,
		});

		expect(hero.compareDocumentPosition(featured)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(featured.compareDocumentPosition(explainer)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(explainer.compareDocumentPosition(cta)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
	});

	it("wires the me prop through to the publish CTA", () => {
		render(
			<LandingPageShell
				stacks={[]}
				me={{ handle: "my-handle", hasStack: true }}
			/>,
		);

		// Published state swaps the CTA from "publish" to a profile affordance.
		expect(
			screen.getByRole("link", { name: /view your profile/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: /publish your/i }),
		).not.toBeInTheDocument();
	});
});
