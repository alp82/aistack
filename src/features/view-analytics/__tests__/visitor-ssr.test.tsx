/**
 * A visitor's server HTML carries none of it (#112).
 *
 * The profile and a stack page are PUBLIC routes, and the numbers on them are
 * strictly private. So the thing to assert on is the first HTML a visitor gets:
 * a gate that only runs after hydration has already shipped the number.
 *
 * The owner cases here are not decoration. They prove the strings these tests
 * search for are strings the surfaces really print, so a passing visitor
 * assertion means "removed" and never "renamed".
 */

import { renderToString } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { OwnerViewsPanelView } from "@/features/view-analytics/OwnerViewsPanel";
import { StackViewsLine } from "@/features/view-analytics/StackViewsLine";
import { analytics } from "./fixture";

const queryMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		params,
	}: {
		children: React.ReactNode;
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

const PROFILE = {
	name: "Alper Ortac",
	handle: "alper-ortac",
	bio: "Building AI Stack.",
	xHandle: undefined,
	personalPages: [],
	avatarUrl: undefined,
	verified: false,
	joinedAt: 1000,
};

const STACKS = [
	{
		_id: "stack_1",
		name: "Main Stack",
		slug: "main-stack",
		oneLiner: "My everyday coding setup",
		published: true,
		updatedAt: 5000,
		fixedTotal: { currency: "USD", amount: 42, period: "month" },
		hasUsageComponent: false,
		toolCount: 3,
		modelCount: 1,
		upvoteCount: 2,
	},
];

/** The route always hands the panel over. Ownership decides what is rendered. */
function profileHtml(ownProfile: { isOwner: true; draftStacks: [] } | null) {
	return renderToString(
		<ProfilePage
			profile={PROFILE}
			stacks={STACKS}
			ownProfile={ownProfile}
			ownerViewsSlot={<OwnerViewsPanelView data={analytics()} />}
		/>,
	);
}

describe("the profile panel", () => {
	test("a visitor gets no lock, no number and no labeling", () => {
		const html = profileHtml(null);
		expect(html).not.toMatch(/only you can see this/i);
		expect(html).not.toContain("deduped daily visitors");
		expect(html).not.toContain(">24<");
		expect(html).not.toContain("/settings/analytics");
	});

	test("the owner gets all of it in the first HTML", () => {
		const html = profileHtml({ isOwner: true, draftStacks: [] });
		expect(html).toMatch(/only you can see this/i);
		expect(html).toContain("deduped daily visitors");
		expect(html).toContain(">24<");
		expect(html).toContain("/settings/analytics");
	});
});

describe("the stack-page line", () => {
	test("a visitor gets nothing, even with an answer in hand", () => {
		// The mock hands the data over regardless, which is stronger than the
		// real query: signed out, `mine` returns null. Nothing renders anyway.
		queryMock.mockReturnValue(analytics());
		const html = renderToString(
			<StackViewsLine stackId="stack_1" isOwner={false} />,
		);
		expect(html).toBe("");
	});

	test("the owner gets the line in the first HTML", () => {
		queryMock.mockReturnValue(analytics());
		const html = renderToString(
			<StackViewsLine stackId="stack_1" isOwner={true} />,
		);
		expect(html).toMatch(/only you can see this/i);
		expect(html).toContain("deduped daily visitors");
		expect(html).toContain("not page loads");
	});
});
