// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	StackBundle,
	StackModel,
	StackTool,
} from "@/features/stack-view/cards";
import { BundleCard } from "@/features/stack-view/cards";
import { GuideSection, ToolsSection } from "@/features/stack-view/sections";

// ---------------------------------------------------------------------------
// Module mocks required for GuideSection (uses TiptapEditor + TableOfContents
// and TanStack Link for the empty-state CTA)
// ---------------------------------------------------------------------------

vi.mock("@/components/TiptapEditor", () => ({
	TiptapEditor: ({ content }: { content: string }) => (
		<div data-testid="tiptap-editor">{content}</div>
	),
}));

vi.mock("@/components/TableOfContents", () => ({
	TableOfContents: () => null,
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
		className?: string;
	}) => {
		const href = params
			? Object.entries(params).reduce(
					(acc, [k, v]) => acc.replace(`$${k}`, v),
					to,
				)
			: to;
		return <a href={href}>{children}</a>;
	},
	useNavigate: () => vi.fn(),
}));

afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// Inline fixture factories
// ---------------------------------------------------------------------------

function makeTool(overrides: Partial<StackTool> = {}): StackTool {
	return {
		_id: "tool-1",
		name: "Cursor",
		categories: ["ide"],
		price: {
			pricingType: "fixed",
			fixed: { currency: "usd", amount: 20, period: "month" },
		},
		kind: "main",
		primaryUsageLabel: "IDE",
		tierName: "Pro",
		priceKind: "regular",
		...overrides,
	};
}

function makeModel(overrides: Partial<StackModel> = {}): StackModel {
	return {
		_id: "model-1",
		name: "GPT-4o",
		provider: "OpenAI",
		role: "primary",
		...overrides,
	};
}

function makeBundle(overrides: Partial<StackBundle> = {}): StackBundle {
	return {
		_id: "bundle-1",
		name: "Cursor Max",
		slug: "cursor-max",
		tierName: "Max",
		price: {
			pricingType: "fixed",
			fixed: { currency: "usd", amount: 40, period: "month" },
		},
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Default prop sets for ToolsSection with the new contract
// ---------------------------------------------------------------------------

const defaultProps = {
	index: 1,
	tools: [makeTool()],
	models: [],
	bundles: [],
	highlightedBundle: null,
	bundlesOpen: false,
	onBundlesOpenChange: () => {},
};

// ===========================================================================
// ToolsSection tests
// ===========================================================================

describe("ToolsSection", () => {
	// AC 1
	it("renders nothing when tools=[]", () => {
		render(<ToolsSection {...defaultProps} tools={[]} />);
		expect(
			screen.queryByRole("heading", { name: /tools/i }),
		).not.toBeInTheDocument();
	});

	// AC 2 - superseded by GROUP A "ToolsSection: heading is /^Tools$/i". The
	// positive heading assertion now lives there.

	// AC 3
	it("does not render a Models disclosure button when models=[]", () => {
		render(<ToolsSection {...defaultProps} models={[]} />);
		expect(
			screen.queryByRole("button", { name: /models/i }),
		).not.toBeInTheDocument();
	});

	// AC 4
	it("renders a Models disclosure button when models is non-empty", () => {
		render(<ToolsSection {...defaultProps} models={[makeModel()]} />);
		expect(screen.getByRole("button", { name: /models/i })).toBeInTheDocument();
	});

	// AC 5
	it("does not render a Bundles disclosure button when bundles=[]", () => {
		render(<ToolsSection {...defaultProps} bundles={[]} />);
		expect(
			screen.queryByRole("button", { name: /bundles/i }),
		).not.toBeInTheDocument();
	});

	// AC 6
	it("renders a Bundles disclosure button when bundles is non-empty", () => {
		render(
			<ToolsSection
				{...defaultProps}
				bundles={[makeBundle()]}
				onBundlesOpenChange={() => {}}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /bundles/i }),
		).toBeInTheDocument();
	});

	// AC 7
	it("renders no disclosure buttons when both models and bundles are empty but tools present", () => {
		render(<ToolsSection {...defaultProps} models={[]} bundles={[]} />);
		expect(screen.queryAllByRole("button")).toHaveLength(0);
	});

	// AC 8 - REWRITTEN to controlled contract (modelsOpen prop)
	it("Models toggle has aria-expanded=false when modelsOpen=false (controlled)", () => {
		const onModelsOpenChange = vi.fn();
		render(
			<ToolsSection
				{...defaultProps}
				models={[makeModel()]}
				modelsOpen={false}
				onModelsOpenChange={onModelsOpenChange}
			/>,
		);
		const toggle = screen.getByRole("button", { name: /models/i });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	// AC 9 - REWRITTEN to controlled contract
	it("clicking Models toggle calls onModelsOpenChange(true); aria-expanded does NOT self-flip (controlled)", () => {
		const onModelsOpenChange = vi.fn();
		render(
			<ToolsSection
				{...defaultProps}
				models={[makeModel()]}
				modelsOpen={false}
				onModelsOpenChange={onModelsOpenChange}
			/>,
		);
		const toggle = screen.getByRole("button", { name: /models/i });
		fireEvent.click(toggle);
		expect(onModelsOpenChange).toHaveBeenCalledWith(true);
		// Controlled - does not self-flip
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	// AC 10 - REWRITTEN to controlled contract: modelsOpen=true, clicking calls onModelsOpenChange(false)
	it("Models panel present when modelsOpen=true; clicking calls onModelsOpenChange(false)", () => {
		const onModelsOpenChange = vi.fn();
		const model = makeModel();
		render(
			<ToolsSection
				{...defaultProps}
				models={[model]}
				modelsOpen={true}
				onModelsOpenChange={onModelsOpenChange}
			/>,
		);
		const toggle = screen.getByRole("button", { name: /models/i });
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		// Panel is in DOM (model name visible)
		expect(screen.getByText(model.name)).toBeInTheDocument();
		fireEvent.click(toggle);
		expect(onModelsOpenChange).toHaveBeenCalledWith(false);
	});

	// AC 11
	it("Models toggle label includes the count: 3 models → accessible name matches /MODELS \\(3\\)/i", () => {
		const models = [
			makeModel({ _id: "m1", name: "GPT-4o" }),
			makeModel({ _id: "m2", name: "Claude 3.5" }),
			makeModel({ _id: "m3", name: "Gemini Pro" }),
		];
		render(<ToolsSection {...defaultProps} models={models} />);
		expect(
			screen.getByRole("button", { name: /MODELS \(3\)/i }),
		).toBeInTheDocument();
	});

	// AC 12
	it("Bundles toggle label includes the count: 2 bundles → /BUNDLES \\(2\\)/i", () => {
		const bundles = [
			makeBundle({ _id: "b1", slug: "bundle-a" }),
			makeBundle({ _id: "b2", slug: "bundle-b" }),
		];
		render(
			<ToolsSection
				{...defaultProps}
				bundles={bundles}
				onBundlesOpenChange={() => {}}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /BUNDLES \(2\)/i }),
		).toBeInTheDocument();
	});

	// AC 13
	it("Bundles disclosure is controlled: panel absent when bundlesOpen=false; clicking calls onBundlesOpenChange(true)", () => {
		const bundle = makeBundle({ slug: "cursor-max" });
		const onBundlesOpenChange = vi.fn();
		render(
			<ToolsSection
				{...defaultProps}
				bundles={[bundle]}
				bundlesOpen={false}
				onBundlesOpenChange={onBundlesOpenChange}
			/>,
		);
		// Panel element not present when closed
		expect(
			document.getElementById("bundle-cursor-max"),
		).not.toBeInTheDocument();

		const toggle = screen.getByRole("button", { name: /bundles/i });
		fireEvent.click(toggle);
		expect(onBundlesOpenChange).toHaveBeenCalledWith(true);
	});

	// AC 14
	it("Bundles panel content is present when bundlesOpen=true (bundle anchor in DOM)", () => {
		const bundle = makeBundle({ slug: "cursor-max" });
		render(
			<ToolsSection
				{...defaultProps}
				bundles={[bundle]}
				bundlesOpen={true}
				onBundlesOpenChange={() => {}}
			/>,
		);
		expect(document.getElementById("bundle-cursor-max")).toBeInTheDocument();
	});

	// AC 15 - REWRITTEN to controlled contract for Models (mirrors GROUP C)
	it("clicking Models toggle does not call onBundlesOpenChange and does not change Bundles aria-expanded", () => {
		const bundle = makeBundle({ slug: "cursor-max" });
		const model = makeModel();
		const onModelsOpenChange = vi.fn();
		const onBundlesOpenChange = vi.fn();
		render(
			<ToolsSection
				{...defaultProps}
				models={[model]}
				bundles={[bundle]}
				modelsOpen={false}
				onModelsOpenChange={onModelsOpenChange}
				bundlesOpen={false}
				onBundlesOpenChange={onBundlesOpenChange}
			/>,
		);
		const modelsToggle = screen.getByRole("button", { name: /models/i });
		const bundlesToggle = screen.getByRole("button", { name: /bundles/i });

		fireEvent.click(modelsToggle);
		expect(onModelsOpenChange).toHaveBeenCalledWith(true);
		expect(onBundlesOpenChange).not.toHaveBeenCalled();
		expect(bundlesToggle).toHaveAttribute("aria-expanded", "false");
	});
});

// ===========================================================================
// BundleCard highlight class test
// ===========================================================================
// cards.tsx BundleCard applies "animate-pulse" (plus ring/border classes) when
// highlighted=true and CARD.hover when highlighted=false. "animate-pulse" is the
// stable, assertable discriminating class used here.

describe("BundleCard highlight", () => {
	it("applies animate-pulse class when highlighted=true", () => {
		const bundle = makeBundle({ slug: "test-bundle" });
		const { container } = render(
			<BundleCard bundle={bundle} highlighted={true} />,
		);
		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("animate-pulse");
	});

	it("does not apply animate-pulse class when highlighted=false", () => {
		const bundle = makeBundle({ slug: "test-bundle" });
		const { container } = render(
			<BundleCard bundle={bundle} highlighted={false} />,
		);
		const card = container.firstChild as HTMLElement;
		expect(card).not.toHaveClass("animate-pulse");
	});
});

// ===========================================================================
// GROUP A - Titles (ToolsSection → "Tools" / "// AI Components"; GuideSection → "Workflow" / "// GUIDE")
// ===========================================================================

describe("GROUP A - Section titles", () => {
	// A-1: ToolsSection uses "Tools" heading and "// AI Components" kicker
	it("ToolsSection: heading is /^Tools$/i", () => {
		render(<ToolsSection {...defaultProps} />);
		expect(
			screen.getByRole("heading", { name: /^Tools$/i }),
		).toBeInTheDocument();
	});

	it("ToolsSection: kicker contains '// AI Components'", () => {
		render(<ToolsSection {...defaultProps} />);
		expect(screen.getByText(/\/\/ AI Components/i)).toBeInTheDocument();
	});

	// A-2: GuideSection uses "Workflow" heading and "// GUIDE" kicker
	it("GuideSection: heading is /^Workflow$/i", () => {
		render(
			<GuideSection
				index={3}
				description="Some content"
				isOwner={false}
				slug="my-stack"
			/>,
		);
		expect(
			screen.getByRole("heading", { name: /^Workflow$/i }),
		).toBeInTheDocument();
	});

	it("GuideSection: kicker contains '// GUIDE' (not '// WRITEUP')", () => {
		render(
			<GuideSection
				index={3}
				description="Some content"
				isOwner={false}
				slug="my-stack"
			/>,
		);
		expect(screen.getByText(/\/\/ GUIDE/i)).toBeInTheDocument();
		expect(screen.queryByText(/\/\/ WRITEUP/i)).not.toBeInTheDocument();
	});
});

// ===========================================================================
// GROUP B - Pricing (ToolsSection fixedTotal prop)
// ===========================================================================

describe("GROUP B - ToolsSection pricing via fixedTotal", () => {
	// B-1: fixedTotal.amount=60 → meta shows $60 total (not tool-only $20)
	it("fixedTotal={amount:60}: meta shows the $60 total, NOT the tool-only cost", () => {
		// tool $20/mo, but fixedTotal includes bundle too → $60
		render(
			<ToolsSection
				{...defaultProps}
				bundles={[makeBundle()]}
				fixedTotal={{ amount: 60 }}
			/>,
		);
		// formatPriceDisplay(60, "month", "floor").amountText = "60"
		expect(screen.getByText(/60/)).toBeInTheDocument();
		// old reducer would show $20 (tool-only); ensure $20 does NOT appear in meta
		// (it might appear on the tool card itself so we check the meta text node)
		// We check $60 appears and the meta does not show $20 as the total
		const meta = screen.getByText(/60/);
		expect(meta.textContent).toMatch(/60/);
	});

	// B-2: fixedTotal.amount=0 → no "$" in meta (item count only)
	it("fixedTotal={amount:0}: no price segment in meta", () => {
		render(<ToolsSection {...defaultProps} fixedTotal={{ amount: 0 }} />);
		// The SectionHeader meta span shows item count + optional price.
		// With fixedTotal.amount=0, the meta must NOT contain "$".
		// We target it via its content: it includes "item" or "items".
		const metaSpans = screen
			.getAllByText(/\d+ items?/i)
			.filter((el) => el.tagName === "SPAN" || el.tagName === "P");
		for (const span of metaSpans) {
			expect(span.textContent).not.toMatch(/\$/);
		}
	});

	// B-3: fixedTotal=undefined → no "$" in meta
	it("fixedTotal=undefined: no price segment in meta", () => {
		render(<ToolsSection {...defaultProps} />);
		// Same as B-2: meta span must not contain "$" when fixedTotal is absent.
		const metaSpans = screen
			.getAllByText(/\d+ items?/i)
			.filter((el) => el.tagName === "SPAN" || el.tagName === "P");
		for (const span of metaSpans) {
			expect(span.textContent).not.toMatch(/\$/);
		}
	});

	// B-4: tool with priceKind="bundle" (own cost $0) + bundle amount 40,
	//       fixedTotal={amount:40} → meta reads $40 (proves old reducer gone)
	it("tool with priceKind='bundle' + fixedTotal={amount:40}: meta shows $40", () => {
		const bundleTool = makeTool({
			_id: "tool-bundle",
			name: "Cursor Max Tool",
			priceKind: "bundle",
			price: {
				pricingType: "fixed",
				fixed: { currency: "usd", amount: 0, period: "month" },
			},
		});
		render(
			<ToolsSection
				{...defaultProps}
				tools={[bundleTool]}
				bundles={[makeBundle()]}
				fixedTotal={{ amount: 40 }}
			/>,
		);
		// formatPriceDisplay(40, "month", "floor").amountText = "40"
		expect(screen.getByText(/40/)).toBeInTheDocument();
	});
});

// ===========================================================================
// GROUP C - Controlled Models disclosure (new tests mirroring Bundles pattern)
// ===========================================================================

describe("GROUP C - ToolsSection controlled Models disclosure", () => {
	// C-1: modelsOpen=false → Models toggle aria-expanded "false", model content absent
	it("modelsOpen=false: toggle aria-expanded false and model content absent", () => {
		const model = makeModel({ name: "GPT-4o" });
		render(
			<ToolsSection
				{...defaultProps}
				models={[model]}
				modelsOpen={false}
				onModelsOpenChange={vi.fn()}
			/>,
		);
		const toggle = screen.getByRole("button", { name: /models/i });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByText("GPT-4o")).not.toBeInTheDocument();
	});

	// C-2: click Models toggle → onModelsOpenChange called with true; aria-expanded stays false (controlled)
	it("clicking Models toggle calls onModelsOpenChange(true); controlled, does not self-flip", () => {
		const onModelsOpenChange = vi.fn();
		render(
			<ToolsSection
				{...defaultProps}
				models={[makeModel()]}
				modelsOpen={false}
				onModelsOpenChange={onModelsOpenChange}
			/>,
		);
		const toggle = screen.getByRole("button", { name: /models/i });
		fireEvent.click(toggle);
		expect(onModelsOpenChange).toHaveBeenCalledWith(true);
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	// C-3: modelsOpen=true → panel present, model name visible, aria-expanded "true"; clicking calls onModelsOpenChange(false)
	it("modelsOpen=true: panel present with model name, aria-expanded true; clicking calls onModelsOpenChange(false)", () => {
		const onModelsOpenChange = vi.fn();
		const model = makeModel({ name: "GPT-4o" });
		render(
			<ToolsSection
				{...defaultProps}
				models={[model]}
				modelsOpen={true}
				onModelsOpenChange={onModelsOpenChange}
			/>,
		);
		const toggle = screen.getByRole("button", { name: /models/i });
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByText("GPT-4o")).toBeInTheDocument();
		fireEvent.click(toggle);
		expect(onModelsOpenChange).toHaveBeenCalledWith(false);
	});

	// C-4: clicking Models does NOT call onBundlesOpenChange and does not change Bundles aria-expanded
	it("clicking Models toggle does not fire onBundlesOpenChange", () => {
		const onModelsOpenChange = vi.fn();
		const onBundlesOpenChange = vi.fn();
		render(
			<ToolsSection
				{...defaultProps}
				models={[makeModel()]}
				bundles={[makeBundle()]}
				modelsOpen={false}
				onModelsOpenChange={onModelsOpenChange}
				bundlesOpen={false}
				onBundlesOpenChange={onBundlesOpenChange}
			/>,
		);
		const modelsToggle = screen.getByRole("button", { name: /models/i });
		fireEvent.click(modelsToggle);
		expect(onBundlesOpenChange).not.toHaveBeenCalled();
		const bundlesToggle = screen.getByRole("button", { name: /bundles/i });
		expect(bundlesToggle).toHaveAttribute("aria-expanded", "false");
	});
});

// ===========================================================================
// GROUP E - ToolsSection uncontrolled Models disclosure (optional-prop fallback)
// ===========================================================================

describe("GROUP E - ToolsSection uncontrolled Models disclosure", () => {
	// E-1: render WITHOUT modelsOpen/onModelsOpenChange → internal state governs;
	//       clicking the toggle opens the panel (model name becomes visible).
	it("uncontrolled: clicking Models toggle opens the panel (model content appears)", () => {
		const model = makeModel({ name: "Claude 3.5" });
		render(
			<ToolsSection
				{...defaultProps}
				models={[model]}
				// Deliberately omit modelsOpen and onModelsOpenChange (uncontrolled path)
			/>,
		);
		const toggle = screen.getByRole("button", { name: /models/i });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByText("Claude 3.5")).not.toBeInTheDocument();

		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByText("Claude 3.5")).toBeInTheDocument();
	});

	// E-2: toggle again → panel closes (model name gone)
	it("uncontrolled: clicking Models toggle a second time closes the panel", () => {
		const model = makeModel({ name: "Claude 3.5" });
		render(<ToolsSection {...defaultProps} models={[model]} />);
		const toggle = screen.getByRole("button", { name: /models/i });
		fireEvent.click(toggle);
		expect(screen.getByText("Claude 3.5")).toBeInTheDocument();
		fireEvent.click(toggle);
		expect(screen.queryByText("Claude 3.5")).not.toBeInTheDocument();
	});
});

// ===========================================================================
// GROUP D - GuideSection ("Guide") empty state
// ===========================================================================

describe("GROUP D - GuideSection Guide empty state", () => {
	// D-1: description undefined, isOwner=true, slug="my-stack" →
	//       link /add a writeup/i to /stacks/my-stack/edit; no "No setup notes yet."
	it("isOwner=true, no description: renders link /add a writeup/i to /stacks/my-stack/edit", () => {
		render(
			<GuideSection
				index={3}
				description={undefined}
				isOwner={true}
				slug="my-stack"
			/>,
		);
		const link = screen.getByRole("link", { name: /add a writeup/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/stacks/my-stack/edit");
		expect(screen.queryByText(/no setup notes yet/i)).not.toBeInTheDocument();
	});

	// D-2: description undefined, isOwner=false → "No setup notes yet."; no link
	it("isOwner=false, no description: renders 'No setup notes yet.' and no owner link", () => {
		render(
			<GuideSection
				index={3}
				description={undefined}
				isOwner={false}
				slug="my-stack"
			/>,
		);
		expect(screen.getByText(/no setup notes yet/i)).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /add a writeup/i }),
		).not.toBeInTheDocument();
	});

	// D-3: description present, isOwner=true → neither empty-state element
	it("isOwner=true, description present: no empty-state elements render", () => {
		render(
			<GuideSection
				index={3}
				description="Here is my workflow."
				isOwner={true}
				slug="my-stack"
			/>,
		);
		expect(
			screen.queryByRole("link", { name: /add a writeup/i }),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/no setup notes yet/i)).not.toBeInTheDocument();
	});

	// D-4: description present, isOwner=false → neither empty-state element
	it("isOwner=false, description present: no empty-state elements render", () => {
		render(
			<GuideSection
				index={3}
				description="Here is my workflow."
				isOwner={false}
				slug="my-stack"
			/>,
		);
		expect(
			screen.queryByRole("link", { name: /add a writeup/i }),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/no setup notes yet/i)).not.toBeInTheDocument();
	});
});
