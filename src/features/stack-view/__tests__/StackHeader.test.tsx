// @vitest-environment jsdom
/**
 * The hero (#356, prototype v43). The header takes the page's one usage read
 * as `reading` and queries nothing itself. These tests cover the contracts
 * the page relies on: the upvote hover prefetch, the owner's vote and report
 * restrictions, the report receipt and its undo, the creator link, the tool
 * row, the ShareMenu seam, the measured tile and the warning bands.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HoverCard from "@/components/ui/hover-card";
import type { HeroReading } from "@/features/stack-view/heroReading";
import { StackHeader } from "@/features/stack-view/StackHeader";
import { titleCeilingPx } from "@/features/stack-view/titleFit";
import { orderToolsForDisplay } from "@/lib/pricing";

// HoverCard is a default export. The stub renders its children and records
// every call so the tests can read the props each wrapper receives.
vi.mock("@/components/ui/hover-card", () => ({
	default: vi.fn(({ children }: { children?: ReactNode }) => <>{children}</>),
}));
vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		params,
	}: {
		children: ReactNode;
		to: string;
		params?: Record<string, string>;
	}) => (
		<a
			href={
				params
					? Object.entries(params).reduce(
							(path, [key, value]) => path.replace(`$${key}`, value),
							to,
						)
					: to
			}
		>
			{children}
		</a>
	),
	useNavigate: () => vi.fn(),
}));
vi.mock("@/components/CostBreakdownTooltip", () => ({
	CostBreakdownTooltip: () => null,
}));
vi.mock("@/components/UpvotersTooltip", () => ({
	UpvotersTooltip: () => null,
}));
vi.mock("@/components/RelativeTime", () => ({
	RelativeTime: ({ at }: { at: number }) => (
		<time dateTime={String(at)}>ago</time>
	),
}));
vi.mock("@/features/charts", () => ({
	Sparkline: ({ points }: { points: unknown[] }) => (
		<svg aria-label="Token history" data-points={points.length} />
	),
}));
vi.mock("@/features/stack-view/ShareMenu", () => ({
	ShareMenu: ({
		slug,
		triggerVariant,
	}: {
		slug: string;
		triggerVariant?: string;
	}) => (
		<div
			data-testid="share-menu"
			data-slug={slug}
			data-trigger-variant={triggerVariant}
		/>
	),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

type HeroTool = Parameters<typeof orderToolsForDisplay>[0][number];

const tool = (
	id: string,
	name: string,
	kind: "main" | "misc" = "main",
	amount = 0,
) =>
	({
		_id: id,
		name,
		kind,
		categories: ["ide"],
		price:
			amount > 0
				? {
						pricingType: "fixed",
						fixed: { currency: "USD", amount, period: "month" },
					}
				: { pricingType: "free" },
		primaryUsageLabel: amount > 0 ? "Pro" : "Free",
	}) as unknown as HeroTool & { _id: string; name: string };

const SEVEN_TOOLS = [
	tool("t1", "Claude Code", "main", 200),
	tool("t2", "Convex", "main", 25),
	tool("t3", "Linear"),
	tool("t4", "Figma", "misc", 15),
	tool("t5", "Raycast", "misc"),
	tool("t6", "GitHub"),
	tool("t7", "Warp", "misc"),
];

const BASE_STACK = {
	creator: {
		name: "Test User",
		handle: "test-user",
		avatarUrl: undefined,
		xHandle: undefined,
		verified: true,
	},
	personalPageUrl: undefined,
	slug: "test-stack",
	name: "Test Stack",
	oneLiner: "A compact stack page",
	tools: SEVEN_TOOLS,
	models: [],
	bundles: [],
	fixedTotal: { amount: 220 },
	hasUsageComponent: false,
	usageTotalNotes: undefined,
	teamSize: 3,
	isLowQuality: false,
	updatedAt: undefined,
	_creationTime: 0,
};

const READER = {
	count: 3,
	upvoted: false,
	isOwner: false,
	currentUserId: null,
};
const OWNER = { count: 3, upvoted: false, isOwner: true, currentUserId: "u1" };
const NOBODY_YET = {
	count: 0,
	upvoted: false,
	isOwner: false,
	currentUserId: null,
};

const READING: HeroReading = {
	tokens: 6_180_000_000,
	points: [
		{ at: Date.parse("2026-09-01"), value: 10 },
		{ at: Date.parse("2026-09-02"), value: 12 },
	],
	receivedAt: Date.now() - 3_600_000,
	days: 7,
};

function props(overrides: Record<string, unknown> = {}) {
	return {
		stack: BASE_STACK as never,
		reading: null,
		range: "30d" as const,
		upvoteStatus: READER,
		reportStatus: undefined,
		upvotersData: undefined,
		upvoting: false,
		reporting: false,
		onUpvote: vi.fn(),
		onReport: vi.fn(),
		onUpvoteHover: vi.fn(),
		onToolsActivate: vi.fn(),
		...overrides,
	};
}

function withStack(over: Record<string, unknown>) {
	return { ...BASE_STACK, ...over } as never;
}

const upvoteButton = () => screen.getByRole("button", { name: /upvote/i });
const toolRow = () =>
	screen.queryByRole("button", { name: "Jump to Tools section" });
const shownToolNames = () => {
	const row = toolRow();
	if (!row) throw new Error("the tool row did not render");
	return [...row.querySelectorAll<HTMLElement>(":scope > span")].map(
		(el) => el.title,
	);
};
const upvoteHoverCall = () =>
	vi
		.mocked(HoverCard)
		.mock.calls.find(([p]) => (p as { width?: number }).width === 280);

describe("identity", () => {
	it("prints the whole name, the one-liner and the byline as a profile link", () => {
		render(<StackHeader {...props()} />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Test Stack" }),
		).toBeInTheDocument();
		expect(screen.getByText("A compact stack page")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /test user\s*@test-user/i }),
		).toHaveAttribute("href", "/@test-user");
		expect(screen.getByText("verified")).toBeInTheDocument();
	});

	it("offers no external identity links in the byline", () => {
		render(
			<StackHeader
				{...props({
					stack: withStack({
						creator: { ...BASE_STACK.creator, xHandle: "someone" },
						personalPageUrl: "https://example.com",
					}),
				})}
			/>,
		);
		expect(
			screen.queryByRole("link", { name: /x\.com|example\.com/i }),
		).not.toBeInTheDocument();
	});

	it("never cuts a long name and sizes it from the viewport ceiling after layout", () => {
		const name =
			"An Unreasonably Long Stack Name That Would Never Fit On One Line";
		render(<StackHeader {...props({ stack: withStack({ name }) })} />);
		const title = screen.getByRole("heading", { level: 1 });
		expect(title).toHaveTextContent(name);
		expect(title.textContent).toBe(name);
		// jsdom lays nothing out, so the fitter lands on the ceiling for this
		// viewport width. The point is that the hook ran and wrote a px size.
		expect(title.style.fontSize).toBe(`${titleCeilingPx(window.innerWidth)}px`);
	});
});

describe("the upvote control", () => {
	it("starts the upvoters query on hover of the whole control, not on render", () => {
		const onUpvoteHover = vi.fn();
		render(<StackHeader {...props({ onUpvoteHover })} />);
		expect(onUpvoteHover).not.toHaveBeenCalled();
		const wrapper = upvoteButton().parentElement;
		expect(wrapper).not.toBeNull();
		// biome-ignore lint/style/noNonNullAssertion: asserted above
		fireEvent.mouseEnter(wrapper!);
		expect(onUpvoteHover).toHaveBeenCalledOnce();
	});

	it("also fires from the button itself, since the handler sits on the wrapper", () => {
		const onUpvoteHover = vi.fn();
		render(<StackHeader {...props({ onUpvoteHover })} />);
		fireEvent.mouseEnter(upvoteButton());
		expect(onUpvoteHover).toHaveBeenCalled();
	});

	it("hands the upvoters card its wrapper contract and a full-width root", () => {
		render(<StackHeader {...props()} />);
		const call = upvoteHoverCall();
		expect(call).toBeDefined();
		// biome-ignore lint/style/noNonNullAssertion: asserted above
		const p = call![0] as unknown as Record<string, unknown>;
		expect(p.mode).toBe("wrapper");
		expect(p.position).toBe("below");
		expect(p.height).toBe("auto");
		expect(typeof p.renderContent).toBe("function");
		// The card root is inline-block by default, which would shrink-wrap the
		// button and leave a gap before Share.
		expect(p.className).toBe("block w-full");
	});

	it("skips the upvoters card and the hover when nobody has upvoted", () => {
		const onUpvoteHover = vi.fn();
		render(
			<StackHeader {...props({ upvoteStatus: NOBODY_YET, onUpvoteHover })} />,
		);
		expect(upvoteButton()).toBeInTheDocument();
		expect(upvoteHoverCall()).toBeUndefined();
		fireEvent.mouseEnter(upvoteButton());
		// biome-ignore lint/style/noNonNullAssertion: the button has a parent
		fireEvent.mouseEnter(upvoteButton().parentElement!);
		expect(onUpvoteHover).not.toHaveBeenCalled();
	});

	it("lets a reader vote and calls onUpvote", () => {
		const onUpvote = vi.fn();
		render(<StackHeader {...props({ onUpvote })} />);
		expect(upvoteButton()).toBeEnabled();
		fireEvent.click(upvoteButton());
		expect(onUpvote).toHaveBeenCalledOnce();
	});

	it("keeps the owner from voting on their own stack and says why", () => {
		const onUpvote = vi.fn();
		render(<StackHeader {...props({ upvoteStatus: OWNER, onUpvote })} />);
		expect(upvoteButton()).toBeDisabled();
		expect(upvoteButton()).toHaveAttribute(
			"title",
			"You can't upvote your own stack",
		);
		fireEvent.click(upvoteButton());
		expect(onUpvote).not.toHaveBeenCalled();
	});

	it("disables the button while a vote is in flight", () => {
		render(<StackHeader {...props({ upvoting: true })} />);
		expect(upvoteButton()).toBeDisabled();
		expect(upvoteButton()).not.toHaveAttribute("title");
	});
});

describe("report and undo", () => {
	it("offers Report to a reader and calls onReport", () => {
		const onReport = vi.fn();
		render(<StackHeader {...props({ onReport })} />);
		fireEvent.click(screen.getByRole("button", { name: "Report" }));
		expect(onReport).toHaveBeenCalledOnce();
		expect(screen.queryByText("Report received")).not.toBeInTheDocument();
	});

	it("turns the link into an undo and raises the receipt band once reported", () => {
		const onReport = vi.fn();
		render(
			<StackHeader
				{...props({ reportStatus: { reported: true }, onReport })}
			/>,
		);
		expect(
			screen.queryByRole("button", { name: "Report" }),
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Reported · undo" }));
		expect(onReport).toHaveBeenCalledTimes(1);
		expect(screen.getByText("Report received")).toBeInTheDocument();
		expect(
			screen.getByText("You reported this stack. The report remains private."),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Undo" }));
		expect(onReport).toHaveBeenCalledTimes(2);
	});

	it("disables both the link and the band's undo while a report is in flight", () => {
		render(
			<StackHeader
				{...props({ reportStatus: { reported: true }, reporting: true })}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Reported · undo" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
	});

	it("gives the owner Edit stack instead of Report", () => {
		render(<StackHeader {...props({ upvoteStatus: OWNER })} />);
		expect(screen.getByRole("link", { name: /edit stack/i })).toHaveAttribute(
			"href",
			"/stacks/test-stack/edit",
		);
		expect(
			screen.queryByRole("button", { name: /report/i }),
		).not.toBeInTheDocument();
	});
});

describe("the grid pattern", () => {
	it("is decorative: hidden from the reader and never clickable", () => {
		render(<StackHeader {...props()} />);
		const layer = screen.getByTestId("hero-grid-pattern");
		expect(layer).toHaveAttribute("aria-hidden", "true");
		expect(layer.className).toContain("pointer-events-none");
		expect(layer.className).toContain("absolute");
		expect(layer.style.backgroundImage).toContain("var(--stroke-subtle)");
		expect(layer.style.backgroundSize).toBe("4rem 4rem");
	});

	it("covers the hero only, so a warning band keeps its own ground", () => {
		render(<StackHeader {...props({ reportStatus: { reported: true } })} />);
		const layer = screen.getByTestId("hero-grid-pattern");
		const band = screen
			.getByText("Report received")
			.closest("div")?.parentElement;
		expect(band).not.toBeNull();
		expect(layer.parentElement).not.toContainElement(band as HTMLElement);
	});
});

describe("the warning bands", () => {
	it("aligns the report receipt to the shared frame and lets it wrap", () => {
		render(<StackHeader {...props({ reportStatus: { reported: true } })} />);
		const label = screen.getByText("Report received");
		const row = label.parentElement;
		expect(row).toHaveClass("mx-auto", "max-w-7xl", "px-6", "flex-wrap");
		expect(row).toContainElement(screen.getByRole("button", { name: "Undo" }));
		expect(row).toContainElement(
			screen.getByText("You reported this stack. The report remains private."),
		);
	});

	it("prints the community warning with the same structure and no undo", () => {
		render(
			<StackHeader {...props({ stack: withStack({ isLowQuality: true }) })} />,
		);
		const label = screen.getByText("Community warning");
		expect(label.parentElement).toHaveClass("mx-auto", "max-w-7xl", "px-6");
		expect(
			screen.getByText(/flagged as low quality by the community/),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Undo" }),
		).not.toBeInTheDocument();
	});

	it("shows both bands when a reader reports a flagged stack", () => {
		render(
			<StackHeader
				{...props({
					stack: withStack({ isLowQuality: true }),
					reportStatus: { reported: true },
				})}
			/>,
		);
		expect(screen.getByText("Community warning")).toBeInTheDocument();
		expect(screen.getByText("Report received")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
	});

	it("raises no band on a clean, unreported stack", () => {
		render(<StackHeader {...props()} />);
		expect(screen.queryByText("Community warning")).not.toBeInTheDocument();
		expect(screen.queryByText("Report received")).not.toBeInTheDocument();
	});
});

describe("the tool row", () => {
	it("shows five logos in display order and folds the rest into a chip", () => {
		render(<StackHeader {...props()} />);
		const shown = shownToolNames().slice(0, 5);
		const ordered = orderToolsForDisplay(SEVEN_TOOLS).map((t) => t.name);
		expect(shown).toEqual(ordered.slice(0, 5));
		// Main tools lead, priced first, so the stored order is not the shown one.
		expect(shown.slice(0, 2)).toEqual(["Claude Code", "Convex"]);
		expect(shown).not.toContain("Raycast");
		expect(screen.getByText("+2")).toHaveAttribute(
			"title",
			ordered.slice(5).join(", "),
		);
		expect(screen.getByText("+2")).toHaveAttribute("title", "Raycast, Warp");
	});

	it("shows all six when six is all there is", () => {
		render(
			<StackHeader
				{...props({ stack: withStack({ tools: SEVEN_TOOLS.slice(0, 6) }) })}
			/>,
		);
		expect(shownToolNames()).toHaveLength(6);
		expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
	});

	it("renders no row when the stack lists no tools", () => {
		render(<StackHeader {...props({ stack: withStack({ tools: [] }) })} />);
		expect(toolRow()).toBeNull();
		expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
	});

	it("jumps to Tools on click", () => {
		const onToolsActivate = vi.fn();
		render(<StackHeader {...props({ onToolsActivate })} />);
		const row = toolRow();
		if (!row) throw new Error("the tool row did not render");
		fireEvent.click(row);
		expect(onToolsActivate).toHaveBeenCalledOnce();
	});
});

describe("ShareMenu", () => {
	it("gets the stack slug", () => {
		render(
			<StackHeader {...props({ stack: withStack({ slug: "my-stack" }) })} />,
		);
		expect(screen.getByTestId("share-menu")).toHaveAttribute(
			"data-slug",
			"my-stack",
		);
	});

	it("renders the ghost trigger beside the outline upvote button", () => {
		render(<StackHeader {...props()} />);
		expect(screen.getByTestId("share-menu")).toHaveAttribute(
			"data-trigger-variant",
			"ghost",
		);
		expect(upvoteButton()).toHaveTextContent(/^Upvote\s*3$/);
		expect(upvoteButton().className).toContain("border-accent-lime");
		expect(upvoteButton().className).toContain("w-full");
	});

	it("is there for the owner and the reader alike", () => {
		const { rerender } = render(<StackHeader {...props()} />);
		expect(screen.getByTestId("share-menu")).toBeInTheDocument();
		rerender(<StackHeader {...props({ upvoteStatus: OWNER })} />);
		expect(screen.getByTestId("share-menu")).toBeInTheDocument();
	});
});

describe("measured against authored", () => {
	it("prints the authored price and nothing measured without a reading", () => {
		render(<StackHeader {...props()} />);
		expect(screen.getByText("$220")).toBeInTheDocument();
		expect(screen.getByText(/team 3/)).toBeInTheDocument();
		expect(screen.queryByText(/tokens ·/)).not.toBeInTheDocument();
		expect(screen.queryByText(/updated/)).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Token history")).not.toBeInTheDocument();
	});

	it("adds the token tile, its series and the updated stamp with a reading", () => {
		render(<StackHeader {...props({ reading: READING, range: "7d" })} />);
		const tile = screen.getByText("6.18B").closest("a");
		expect(tile).toHaveAttribute("href", "#section-measured");
		expect(tile).toHaveTextContent("tokens · 7 days");
		expect(screen.getByLabelText("Token history")).toHaveAttribute(
			"data-points",
			"2",
		);
		expect(screen.getByText(/updated/)).toBeInTheDocument();
	});

	it("keeps dollars out of the measured tile", () => {
		render(<StackHeader {...props({ reading: READING })} />);
		const dollars = screen.getAllByText(/\$/);
		expect(dollars).toHaveLength(1);
		expect(dollars[0]).toHaveTextContent("$220");
	});

	it("prints no updated stamp when the reading carries no sync time", () => {
		render(
			<StackHeader
				{...props({ reading: { ...READING, receivedAt: null, days: 30 } })}
			/>,
		);
		expect(screen.getByText("6.18B")).toBeInTheDocument();
		expect(screen.getByText(/tokens · 30 days/)).toBeInTheDocument();
		expect(screen.queryByText(/updated/)).not.toBeInTheDocument();
	});
});
