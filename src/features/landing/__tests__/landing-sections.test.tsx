// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LandingPageShell } from "@/features/landing/LandingPageShell";

vi.mock("@/features/landing/sections/FeedSection", () => ({
	FeedSection: () => (
		<section>
			<h2>Live stack feed</h2>
			<p>Open stack</p>
			<p>Open stack</p>
			<p>Open stack</p>
			<p>Open stack</p>
			<p>Open stack</p>
			<p>Open stack</p>
		</section>
	),
}));

vi.mock("@tanstack/react-router", async () => {
	return {
		Link: ({ children, to }: { children: ReactNode; to: string }) => (
			<a href={to}>{children}</a>
		),
	};
});

const sampleStacks = Array.from({ length: 7 }, (_, index) => ({
	_id: `stack-${index}`,
	_creationTime: Date.now() - index * 100000,
	name: `Stack ${index}`,
	slug: `stack-${index}`,
	oneLiner: `Stack one liner ${index}`,
	hasUsageComponent: index % 2 === 0,
	teamSize: index % 3 === 0 ? index + 1 : null,
	fixedTotal: { amount: index * 25 + 10 },
	creator: {
		name: `Creator ${index}`,
		xHandle: index % 2 === 0 ? `creator${index}` : null,
		avatarUrl: null,
	},
	tools: Array.from({ length: 5 }, (__, toolIndex) => ({
		_id: `tool-${index}-${toolIndex}`,
		name: `Tool ${toolIndex}`,
		categories: ["ide"],
		iconUrl: null,
		price: { pricingType: "fixed" as const },
		priceKind: "regular" as const,
	})),
	upvoteCount: index * 2,
}));

afterEach(() => {
	cleanup();
});

describe("landing sections", () => {
	it("renders sections in shell order", () => {
		render(<LandingPageShell stacks={sampleStacks} />);

		const heroHeading = screen.getByRole("heading", {
			level: 1,
			name: /ship faster from the command line/i,
		});
		const feedHeading = screen.getByRole("heading", {
			level: 2,
			name: /live stack feed/i,
		});
		const explainerHeading = screen.getByRole("heading", {
			level: 2,
			name: /how this works/i,
		});
		const waitlistHeading = screen.getByRole("heading", {
			level: 2,
			name: /join the private terminal log/i,
		});

		expect(heroHeading.compareDocumentPosition(feedHeading)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(feedHeading.compareDocumentPosition(explainerHeading)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(explainerHeading.compareDocumentPosition(waitlistHeading)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
	});

	it("renders only six stack cards in feed preview", () => {
		render(<LandingPageShell stacks={sampleStacks} />);

		expect(screen.getAllByText("Open stack")).toHaveLength(6);
	});
});
