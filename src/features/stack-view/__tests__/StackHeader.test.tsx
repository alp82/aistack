// @vitest-environment jsdom
/**
 * Regression tests for the upvote-popover bug fix.
 *
 * Bug 1: When hasUpvotes=true, the `absolute left-full -translate-y-1/2` classes
 *        (and the className prop) land on HoverCard's root div rather than an
 *        outer span, which breaks positioning.
 * Bug 2: onUpvoteHover is wired to UpvoteButton's onMouseEnter, so hovering the
 *        outer wrapper span does not fire it (misses the envelope area).
 *
 * TC-SH-01/02/03 are RED against the current buggy code.
 * TC-SH-04/05/06 should be GREEN now and remain GREEN after the fix.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StackHeader } from "@/features/stack-view/StackHeader";
import HoverCard from "@/components/ui/hover-card";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// CRITICAL: HoverCard is a default export in StackHeader.tsx (import HoverCard from "@/components/ui/hover-card")
// We stub it to render children and record all calls so we can inspect className.
vi.mock("@/components/ui/hover-card", () => ({
	default: vi.fn(({ children }: { children?: ReactNode }) => <>{children}</>),
}));

// Stub router — StackHeader renders a <Link> in the edit slot when isOwner=true.
// Matches the pattern in stack-editor-unpublish-confirm.test.tsx.
vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
	}: {
		children: ReactNode;
		to: string;
		params?: Record<string, string>;
		className?: string;
	}) => <a href={to}>{children}</a>,
	useNavigate: () => vi.fn(),
}));

// Stub CostBreakdownTooltip — reached by the price tile HoverCard's renderContent.
vi.mock("@/components/CostBreakdownTooltip", () => ({
	CostBreakdownTooltip: () => null,
}));

// Stub stack-view/ui exports used by StackHeader.
vi.mock("@/features/stack-view/ui", () => ({
	StackIcon: () => <div data-testid="stack-icon" />,
	categoryColor: () => "#000",
	STACK_WIDTH: "max-w-5xl",
}));

// Stub UpvotersTooltip — reached by the upvote HoverCard's renderContent.
vi.mock("@/components/UpvotersTooltip", () => ({
	UpvotersTooltip: () => null,
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_STACK = {
	creator: {
		name: "Test User",
		avatarUrl: undefined,
		xHandle: undefined,
		verified: undefined,
	},
	personalPageUrl: undefined,
	slug: "test-stack",
	name: "Test Stack",
	oneLiner: "A test stack",
	tools: [],
	models: [],
	bundles: [],
	fixedTotal: { amount: 0 },
	hasUsageComponent: false as const,
	usageTotalNotes: undefined,
	teamSize: undefined,
	isLowQuality: false as const,
};

const UPVOTE_STATUS_WITH_COUNT = {
	count: 3,
	upvoted: false,
	isOwner: false,
	currentUserId: null,
};

const UPVOTE_STATUS_ZERO = {
	count: 0,
	upvoted: false,
	isOwner: false,
	currentUserId: null,
};

function buildProps(
	upvoteStatus: typeof UPVOTE_STATUS_WITH_COUNT | typeof UPVOTE_STATUS_ZERO,
	overrides = {},
) {
	return {
		stack: BASE_STACK as never,
		upvoteStatus,
		reportStatus: undefined,
		upvotersData: undefined,
		upvoting: false,
		reporting: false,
		onUpvote: vi.fn(),
		onReport: vi.fn(),
		onUpvoteHover: vi.fn(),
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StackHeader upvote-popover regression", () => {
	// TC-SH-01 (Bug 1 guard — RED now)
	// In the buggy code, HoverCard wrapper mode applies className directly on its
	// root div, so a call to HoverCard will have className matching /absolute|left-full|-translate-y/.
	// After the fix, absolute/left-full classes move to an outer span and HoverCard
	// should receive no such className.
	it("TC-SH-01: no HoverCard call carries absolute/left-full/-translate-y classes (bug 1 guard)", () => {
		render(<StackHeader {...buildProps(UPVOTE_STATUS_WITH_COUNT)} />);

		const MockedHoverCard = vi.mocked(HoverCard);
		const allCalls = MockedHoverCard.mock.calls;

		// There should be at least one call (the upvote one and the price one).
		expect(allCalls.length).toBeGreaterThan(0);

		for (const [callProps] of allCalls) {
			const className = (callProps as { className?: string }).className ?? "";
			expect(className).not.toMatch(/absolute|left-full|-translate-y/);
		}
	});

	// TC-SH-02 (Bug 1 structural guard — RED now)
	// In the buggy code, the absolute/left-full wrapper is the HoverCard's own root div
	// (rendered by our stub as a fragment, so no element carries those classes in DOM).
	// After the fix, there will be an explicit span/div wrapping HoverCard with those classes.
	//
	// We locate the upvote button and then check its closest ancestor that carries `absolute`.
	// The locator is tag-neutral (closest("[class*='absolute']")) to tolerate div vs span.
	it("TC-SH-02: upvote button's closest absolute-positioned ancestor is a plain span/div (not HoverCard root)", () => {
		render(<StackHeader {...buildProps(UPVOTE_STATUS_WITH_COUNT)} />);

		// The upvote button aria-label is dynamic: "Upvote, 3 upvotes"
		const btn = screen.getByRole("button", { name: /upvote/i });
		expect(btn).toBeInTheDocument();

		// After the fix there must be an ancestor element carrying `absolute` AND `left-full`
		// that is NOT the HoverCard stub fragment (which renders as <>children</>).
		// In the buggy code the classes are on HoverCard's className prop which our stub
		// doesn't mount as a DOM element — so the only element carrying `absolute` is
		// the header's `relative` container, not a direct upvote-wrapper ancestor.
		// We assert the button has a direct wrapper with both `absolute` and `left-full`.
		const absoluteAncestor = btn.closest(
			"[class*='absolute'][class*='left-full']",
		);
		expect(absoluteAncestor).toBeInTheDocument();
	});

	// TC-SH-03 (Bug 2 guard — RED now)
	// In the buggy code, onUpvoteHover is only on the UpvoteButton's onMouseEnter.
	// The outer wrapper (currently HoverCard, which in the fix becomes a span) does NOT
	// fire onUpvoteHover on mouseEnter. After the fix, the span carries onMouseEnter={onUpvoteHover}.
	it("TC-SH-03: mouseEnter on the absolute wrapper span fires onUpvoteHover (bug 2 guard)", () => {
		const onUpvoteHover = vi.fn();
		render(
			<StackHeader
				{...buildProps(UPVOTE_STATUS_WITH_COUNT, { onUpvoteHover })}
			/>,
		);

		const btn = screen.getByRole("button", { name: /upvote/i });
		// Tag-neutral: locate the closest ancestor carrying absolute+left-full classes
		const wrapper = btn.closest("[class*='absolute'][class*='left-full']");
		expect(wrapper).toBeInTheDocument();

		// biome-ignore lint/style/noNonNullAssertion: asserted in preceding expect
		fireEvent.mouseEnter(wrapper!);
		expect(onUpvoteHover).toHaveBeenCalled();
	});

	// TC-SH-04 (Bug 2 completeness — GREEN now and after fix)
	// After the fix the handler is on the span and bubbles up, so mouseEnter on the
	// button itself also triggers it. We use toHaveBeenCalled (not toHaveBeenCalledOnce)
	// because bubbling may cause multiple invocations.
	it("TC-SH-04: mouseEnter on the upvote button itself also fires onUpvoteHover", () => {
		const onUpvoteHover = vi.fn();
		render(
			<StackHeader
				{...buildProps(UPVOTE_STATUS_WITH_COUNT, { onUpvoteHover })}
			/>,
		);

		const btn = screen.getByRole("button", { name: /upvote/i });
		fireEvent.mouseEnter(btn);
		expect(onUpvoteHover).toHaveBeenCalled();
	});

	// TC-SH-05 (no-upvotes branch unaffected — GREEN now and after fix)
	// When count=0, HoverCard is NOT rendered for the upvote button (plain span branch).
	// The price-tile HoverCard may still be called, but its className must not contain
	// upvote-positioning classes.
	it("TC-SH-05: count=0 renders upvote button without HoverCard wrapping it", () => {
		const onUpvoteHover = vi.fn();
		render(
			<StackHeader {...buildProps(UPVOTE_STATUS_ZERO, { onUpvoteHover })} />,
		);

		// Upvote button still in DOM
		expect(screen.getByRole("button", { name: /upvote/i })).toBeInTheDocument();

		// onUpvoteHover should not have been called during render
		expect(onUpvoteHover).not.toHaveBeenCalled();

		// No HoverCard call should have the upvote-positioning classes
		const MockedHoverCard = vi.mocked(HoverCard);
		for (const [callProps] of MockedHoverCard.mock.calls) {
			const className = (callProps as { className?: string }).className ?? "";
			// The price tile HoverCard should not carry absolute/left-full either
			expect(className).not.toMatch(/left-full/);
		}
	});

	// TC-SH-06 (no hover on render — GREEN now and after fix)
	// onUpvoteHover must never be called as a side-effect of rendering.
	it("TC-SH-06: onUpvoteHover is not called during initial render (count=0)", () => {
		const onUpvoteHover = vi.fn();
		render(
			<StackHeader {...buildProps(UPVOTE_STATUS_ZERO, { onUpvoteHover })} />,
		);
		expect(onUpvoteHover).not.toHaveBeenCalled();
	});

	// TC-SH-07 (MATERIAL — upvote HoverCard functional props guard)
	// After the className was removed from the upvote HoverCard, we must verify its
	// OTHER functional props are still present. A silently dropped `renderContent`
	// would make the upvoters tooltip never render (defeats bug-2's fix); a changed
	// `position` would mis-place it.
	//
	// Discriminator: upvote HoverCard has width=280; price tile has width=320.
	it("TC-SH-07: upvote HoverCard (width=280) receives mode/position/width/height/renderContent and no className", () => {
		render(<StackHeader {...buildProps(UPVOTE_STATUS_WITH_COUNT)} />);

		const MockedHoverCard = vi.mocked(HoverCard);
		const allCalls = MockedHoverCard.mock.calls;

		// Find the upvote HoverCard call by its unique width=280
		const upvoteCall = allCalls.find(
			([props]) => (props as { width?: number }).width === 280,
		);
		expect(upvoteCall).toBeDefined();

		// biome-ignore lint/style/noNonNullAssertion: asserted above
		const [upvoteProps] = upvoteCall!;
		const p = upvoteProps as {
			mode?: string;
			position?: string;
			width?: number;
			height?: string;
			renderContent?: unknown;
			className?: string;
		};

		expect(p.mode).toBe("wrapper");
		expect(p.position).toBe("below");
		expect(p.width).toBe(280);
		expect(p.height).toBe("auto");
		expect(typeof p.renderContent).toBe("function");
		// className must be absent (the positioning classes live on the outer span)
		expect(p.className).toBeUndefined();
	});

	// TC-SH-08 (nice-to-have — count=0 branch keeps positioning classes)
	// When count=0, the upvote button is wrapped in a plain span (no HoverCard).
	// That span must still carry the absolute/left-full positioning classes so the
	// control doesn't jump position compared with the hasUpvotes branch.
	it("TC-SH-08: count=0 upvote button's wrapper span still carries absolute/left-full positioning classes", () => {
		render(<StackHeader {...buildProps(UPVOTE_STATUS_ZERO)} />);

		const btn = screen.getByRole("button", { name: /upvote/i });
		expect(btn).toBeInTheDocument();

		// The span wrapping the zero-count UpvoteButton has absolute + left-full classes
		const positionedWrapper = btn.closest(
			"[class*='absolute'][class*='left-full']",
		);
		expect(positionedWrapper).toBeInTheDocument();
	});
});
