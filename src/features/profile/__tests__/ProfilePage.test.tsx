// @vitest-environment jsdom
/**
 * Tests for src/features/profile/ProfilePage.tsx (plan.md Phase A — the
 * dossier-split profile surface at /@handle).
 *
 * RED until src/features/profile/ProfilePage.tsx is created.
 *
 * VALIDATION: test — profile dossier renders full and sparse profiles;
 * most-recent stack is the full-width callout; owner-only New/Edit
 * affordances gated on getOwnProfileView.
 */
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/features/profile/ProfilePage";

// ProfilePage renders real tanstack-router <Link>s for stack cards and the
// New-stack / Edit affordances — swap for plain anchors, matching the
// StackHeader.test.tsx / landing-sections.test.tsx precedent.
vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		params,
	}: {
		children: ReactNode;
		to: string;
		params?: Record<string, string>;
	}) => {
		const href = params
			? Object.entries(params).reduce(
					(acc, [key, value]) => acc.replace(`$${key}`, value),
					to,
				)
			: to;
		return <a href={href}>{children}</a>;
	},
}));

afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function stackCard(overrides: Record<string, unknown> = {}) {
	return {
		_id: "stack-1",
		name: "Daily Driver",
		slug: "daily-driver-abc123",
		oneLiner: "My everyday coding setup",
		published: true,
		updatedAt: 5000,
		fixedTotal: { currency: "USD", amount: 42, period: "month" },
		hasUsageComponent: false,
		toolCount: 3,
		modelCount: 1,
		upvoteCount: 2,
		...overrides,
	};
}

const FULL_PROFILE = {
	name: "Alper Ortac",
	handle: "alper-ortac",
	bio: "Building AI Stack.",
	xHandle: "alperortac",
	personalPages: [{ name: "example.com", url: "https://example.com" }],
	avatarUrl: "https://cdn.example.com/avatar.webp",
	verified: true,
	joinedAt: 1000,
};

const SPARSE_PROFILE = {
	name: "New Creator",
	handle: "new-creator",
	bio: undefined,
	xHandle: undefined,
	personalPages: [],
	avatarUrl: undefined,
	verified: false,
	joinedAt: 2000,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProfilePage — full profile (visitor)", () => {
	it("renders name, handle, bio, x handle, and a personal page link", () => {
		render(
			<ProfilePage
				profile={FULL_PROFILE}
				stacks={[stackCard()]}
				ownProfile={null}
			/>,
		);

		expect(screen.getByText("Alper Ortac")).toBeInTheDocument();
		expect(screen.getByText(/@alper-ortac/)).toBeInTheDocument();
		expect(screen.getByText("Building AI Stack.")).toBeInTheDocument();
		expect(screen.getByText(/alperortac/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /example\.com/i })).toHaveAttribute(
			"href",
			"https://example.com",
		);
	});

	it("renders the most-recent stack as a full-width callout with a badge", () => {
		const older = stackCard({
			_id: "stack-older",
			name: "Old Stack",
			slug: "old-stack-000",
			updatedAt: 1000,
		});
		const newer = stackCard({
			_id: "stack-newer",
			name: "New Stack",
			slug: "new-stack-000",
			updatedAt: 9000,
		});
		render(
			<ProfilePage
				profile={FULL_PROFILE}
				stacks={[newer, older]}
				ownProfile={null}
			/>,
		);

		expect(screen.getByText(/most recent/i)).toBeInTheDocument();
		// Both stacks render as cards linking to their stack page.
		expect(screen.getByRole("link", { name: /new stack/i })).toHaveAttribute(
			"href",
			"/stacks/new-stack-000",
		);
		expect(screen.getByRole("link", { name: /old stack/i })).toHaveAttribute(
			"href",
			"/stacks/old-stack-000",
		);
	});

	it("does not show New/Edit owner affordances or draft cards for a visitor", () => {
		render(
			<ProfilePage
				profile={FULL_PROFILE}
				stacks={[stackCard()]}
				ownProfile={null}
			/>,
		);

		expect(
			screen.queryByRole("link", { name: /new stack/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /edit profile/i }),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/draft/i)).not.toBeInTheDocument();
	});
});

describe("ProfilePage — sparse profile (visitor)", () => {
	it("renders presentably with no bio/links and exactly one stack", () => {
		render(
			<ProfilePage
				profile={SPARSE_PROFILE}
				stacks={[stackCard({ name: "Only Stack", slug: "only-stack-1" })]}
				ownProfile={null}
			/>,
		);

		expect(screen.getByText("New Creator")).toBeInTheDocument();
		expect(screen.getByText(/@new-creator/)).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /only stack/i }),
		).toBeInTheDocument();
	});

	it("renders presentably with zero stacks", () => {
		render(
			<ProfilePage profile={SPARSE_PROFILE} stacks={[]} ownProfile={null} />,
		);

		expect(screen.getByText("New Creator")).toBeInTheDocument();
	});
});

describe("ProfilePage — owner view", () => {
	it("shows a New-stack link and an Edit affordance when ownProfile is present", () => {
		render(
			<ProfilePage
				profile={FULL_PROFILE}
				stacks={[stackCard()]}
				ownProfile={{ isOwner: true, draftStacks: [] }}
			/>,
		);

		expect(screen.getByRole("link", { name: /new stack/i })).toHaveAttribute(
			"href",
			"/stacks/new",
		);
		expect(
			screen.getByRole("button", { name: /edit profile/i }),
		).toBeInTheDocument();
	});

	it("shows draft stacks with a Draft badge, linking to the stack's edit route", () => {
		const draft = stackCard({
			_id: "stack-draft",
			name: "Unpublished Stack",
			slug: "unpublished-stack-1",
			published: false,
		});
		render(
			<ProfilePage
				profile={FULL_PROFILE}
				stacks={[stackCard()]}
				ownProfile={{ isOwner: true, draftStacks: [draft] }}
			/>,
		);

		expect(screen.getByText(/draft/i)).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /unpublished stack/i }),
		).toHaveAttribute("href", "/stacks/unpublished-stack-1/edit");
	});
});
