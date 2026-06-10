// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BundleCard } from "@/features/stack-view/cards";
import { ToolsSection } from "@/features/stack-view/sections";
import type {
	StackBundle,
	StackModel,
	StackTool,
} from "@/features/stack-view/cards";

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

	// AC 2
	it("renders the section heading 'Tools' when at least one tool is present", () => {
		render(<ToolsSection {...defaultProps} />);
		expect(
			screen.getByRole("heading", { name: /^tools$/i }),
		).toBeInTheDocument();
	});

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

	// AC 8
	it("Models toggle has aria-expanded=false on first render (collapsed by default)", () => {
		render(<ToolsSection {...defaultProps} models={[makeModel()]} />);
		const toggle = screen.getByRole("button", { name: /models/i });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	// AC 9
	it("clicking the Models toggle flips aria-expanded to true and mounts the panel", () => {
		render(<ToolsSection {...defaultProps} models={[makeModel()]} />);
		const toggle = screen.getByRole("button", { name: /models/i });
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		const panelId = toggle.getAttribute("aria-controls");
		expect(panelId).toBeTruthy();
		// biome-ignore lint/style/noNonNullAssertion: asserted truthy above
		expect(document.getElementById(panelId!)).toBeInTheDocument();
	});

	// AC 10
	it("clicking an open Models toggle closes it (aria-expanded false, panel gone)", () => {
		render(<ToolsSection {...defaultProps} models={[makeModel()]} />);
		const toggle = screen.getByRole("button", { name: /models/i });
		fireEvent.click(toggle); // open
		fireEvent.click(toggle); // close
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		const panelId = toggle.getAttribute("aria-controls");
		expect(panelId).toBeTruthy();
		// biome-ignore lint/style/noNonNullAssertion: asserted truthy above
		expect(document.getElementById(panelId!)).not.toBeInTheDocument();
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

	// AC 15
	it("clicking Models toggle does not change Bundles toggle aria-expanded", () => {
		const bundle = makeBundle({ slug: "cursor-max" });
		const model = makeModel();
		render(
			<ToolsSection
				{...defaultProps}
				models={[model]}
				bundles={[bundle]}
				bundlesOpen={false}
				onBundlesOpenChange={() => {}}
			/>,
		);
		const modelsToggle = screen.getByRole("button", { name: /models/i });
		const bundlesToggle = screen.getByRole("button", { name: /bundles/i });

		fireEvent.click(modelsToggle);
		expect(modelsToggle).toHaveAttribute("aria-expanded", "true");
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
