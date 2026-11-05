import {
	bundledPriceTable,
	isPricedModel,
	layeredPricer,
	setActivePricer,
} from "@aistack/pricing";
import { afterEach, describe, expect, it } from "vitest";

// The CLI bundles @aistack/pricing, so a lookup fix there only reaches users
// through a CLI release. These cases pin the Cursor model ids that the
// 2026-11 fix taught the pricer to read.
describe("CLI pricing of Cursor model settings", () => {
	afterEach(() => setActivePricer(null));

	it("prices a settings suffix from the bundled table", () => {
		setActivePricer(null);
		expect(isPricedModel("claude-opus-5-high")).toBe(true);
		expect(isPricedModel("claude-opus-5-thinking-high")).toBe(true);
	});

	it("prices settings and build variants from the served table", () => {
		setActivePricer(
			layeredPricer({
				id: "served",
				rows: [
					{ modelSlug: "grok-4.7", from: 0, input: 2, output: 6, source: "s" },
				],
			}),
		);
		expect(isPricedModel("grok-4.7-xhigh-fast")).toBe(true);
		expect(isPricedModel("grok-4.7-build")).toBe(true);
		expect(isPricedModel("grok-4.7-build-fast")).toBe(true);
	});

	it("leaves an unknown model unpriced", () => {
		expect(bundledPriceTable().rows.length).toBeGreaterThan(0);
		expect(isPricedModel("unknown-model-high")).toBe(false);
	});
});
