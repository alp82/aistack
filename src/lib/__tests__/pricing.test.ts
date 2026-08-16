/**
 * RED tests for the new `orderToolsForDisplay` export (TC-PRICE-01..09).
 * The implementation does not exist yet - these tests are expected to fail
 * until `orderToolsForDisplay` is added to src/lib/pricing.ts.
 */
import { describe, expect, it } from "vitest";
import { orderToolsForDisplay, type SortableTool } from "@/lib/pricing";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

type DisplayTool = SortableTool & { kind: "main" | "misc" };

function makeTool(
	name: string,
	kind: "main" | "misc",
	amount: number | null,
	period: "month" | "year" | "one_time" = "month",
): DisplayTool {
	return {
		name,
		kind,
		priceKind: "regular",
		price: {
			fixed: amount !== null ? { amount, period } : null,
		},
	};
}

// ---------------------------------------------------------------------------
// TC-PRICE-01: orderToolsForDisplay is a named export of @/lib/pricing
// ---------------------------------------------------------------------------

describe("orderToolsForDisplay", () => {
	it("TC-PRICE-01: is a named function export of @/lib/pricing", () => {
		expect(typeof orderToolsForDisplay).toBe("function");
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-02: main group precedes misc group regardless of price magnitude
	// ---------------------------------------------------------------------------

	it("TC-PRICE-02: main tools appear before misc tools regardless of price", () => {
		const tools: DisplayTool[] = [
			makeTool("Pricey Misc", "misc", 100),
			makeTool("Cheap Main", "main", 5),
		];
		const result = orderToolsForDisplay(tools);
		expect(result.map((t) => t.name)).toEqual(["Cheap Main", "Pricey Misc"]);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-03: within main group, higher price sorts first
	// ---------------------------------------------------------------------------

	it("TC-PRICE-03: within main group, higher price first", () => {
		const tools: DisplayTool[] = [
			makeTool("Low", "main", 5),
			makeTool("High", "main", 100),
		];
		const result = orderToolsForDisplay(tools);
		expect(result.map((t) => t.name)).toEqual(["High", "Low"]);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-04: within misc group, higher price sorts first
	// ---------------------------------------------------------------------------

	it("TC-PRICE-04: within misc group, higher price first", () => {
		const tools: DisplayTool[] = [
			makeTool("Low", "misc", 5),
			makeTool("High", "misc", 100),
		];
		const result = orderToolsForDisplay(tools);
		expect(result.map((t) => t.name)).toEqual(["High", "Low"]);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-05: name tie-break within group at equal price
	// ---------------------------------------------------------------------------

	it("TC-PRICE-05: equal price within group → alphabetical name tie-break", () => {
		const tools: DisplayTool[] = [
			makeTool("Beta", "main", 50),
			makeTool("Alpha", "main", 50),
		];
		const result = orderToolsForDisplay(tools);
		expect(result.map((t) => t.name)).toEqual(["Alpha", "Beta"]);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-06: free/null-price main precedes free misc
	// ---------------------------------------------------------------------------

	it("TC-PRICE-06: free main precedes free misc", () => {
		const tools: DisplayTool[] = [
			makeTool("Free Misc", "misc", null),
			makeTool("Free Main", "main", null),
		];
		const result = orderToolsForDisplay(tools);
		expect(result.map((t) => t.name)).toEqual(["Free Main", "Free Misc"]);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-07: does not mutate the input array
	// ---------------------------------------------------------------------------

	it("TC-PRICE-07: does not mutate input array order", () => {
		const tools: DisplayTool[] = [
			makeTool("Pricey Misc", "misc", 100),
			makeTool("Cheap Main", "main", 5),
		];
		const originalOrder = tools.map((t) => t.name);
		orderToolsForDisplay(tools);
		expect(tools.map((t) => t.name)).toEqual(originalOrder);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-08: empty input → empty output
	// ---------------------------------------------------------------------------

	it("TC-PRICE-08: empty input returns empty array", () => {
		expect(orderToolsForDisplay([])).toHaveLength(0);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-09: yearly billing normalized - $240/year ($20/mo) loses to $30/month
	// ---------------------------------------------------------------------------

	it("TC-PRICE-09: yearly price normalized to monthly for sorting ($240/year < $30/month)", () => {
		// $240/year normalizes to $20/month; $30/month stays $30/month.
		// Higher normalized price → comes first within misc group.
		const tools: DisplayTool[] = [
			makeTool("Annual", "misc", 240, "year"),
			makeTool("Monthly", "misc", 30, "month"),
		];
		const result = orderToolsForDisplay(tools);
		expect(result.map((t) => t.name)).toEqual(["Monthly", "Annual"]);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-10: interleaved main+misc with >2 elements proves partition AND
	//              within-group price sort together
	// ---------------------------------------------------------------------------

	it("TC-PRICE-10: >2 interleaved tools - main-before-misc partition AND within-group price desc", () => {
		// Passed shuffled: misc-high, main-low, misc-mid, main-high
		const input: DisplayTool[] = [
			makeTool("Pricey Misc", "misc", 100, "month"),
			makeTool("Cheap Main", "main", 5, "month"),
			makeTool("Mid Misc", "misc", 20, "month"),
			makeTool("Top Main", "main", 80, "month"),
		];
		const result = orderToolsForDisplay(input);
		// Both main tools (price desc: $80 then $5) before both misc tools
		// (price desc: $100 then $20), proving both the partition and
		// within-group highest-first under real cardinality.
		expect(result.map((t) => t.name)).toEqual([
			"Top Main",
			"Cheap Main",
			"Pricey Misc",
			"Mid Misc",
		]);
	});

	// ---------------------------------------------------------------------------
	// TC-PRICE-11: the OG handler's orderToolsForDisplay(...).slice(0,6)
	//              composition keeps the correct top-6 in main-first, price-desc
	//              order when a stack has more than 6 tools
	// ---------------------------------------------------------------------------

	it("TC-PRICE-11: order-then-slice(0,6) mirrors OG handler - correct top-6 from 8 tools", () => {
		// 4 main tools and 4 misc tools, passed shuffled
		const input: DisplayTool[] = [
			makeTool("Misc15", "misc", 15, "month"),
			makeTool("Main10", "main", 10, "month"),
			makeTool("Misc60", "misc", 60, "month"),
			makeTool("Main50", "main", 50, "month"),
			makeTool("Misc5", "misc", 5, "month"),
			makeTool("Main30", "main", 30, "month"),
			makeTool("Misc40", "misc", 40, "month"),
			makeTool("Main20", "main", 20, "month"),
		];
		// This mirrors exactly what src/routes/api.og.stack.$slug.tsx does
		// before .map - the helper is the unit under test; slice is the
		// std-lib cap the handler applies.
		const top6 = orderToolsForDisplay(input).slice(0, 6);
		// All 4 main tools first (price desc), then top-2 misc by price;
		// the two cheapest misc ($15, $5) are dropped by the slice.
		expect(top6.map((t) => t.name)).toEqual([
			"Main50",
			"Main30",
			"Main20",
			"Main10",
			"Misc60",
			"Misc40",
		]);
	});
});
