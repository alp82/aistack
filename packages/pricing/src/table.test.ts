import { describe, expect, it } from "vitest";
import {
	activePriceTableIds,
	apiEquivalentCost,
	BUNDLED_PRICE_TABLE_ID,
	bundledPricer,
	bundledPriceTable,
	isPricedModel,
	layeredPricer,
	PRICED_LANES,
	pricingTableFor,
	setActivePricer,
} from "./index.js";
import {
	LOCAL_PRICING_TABLE_VERSION,
	PriceIndex,
	type PriceRow,
	Pricer,
	parseMeasuredId,
	parsePriceTable,
	priceTableId,
} from "./table.js";

const MTOK = 1_000_000;
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1);
const T1 = Date.UTC(2026, 6, 1);

const row = (over: Partial<PriceRow> = {}): PriceRow => ({
	modelSlug: "m-1",
	from: 0,
	input: 1,
	output: 2,
	cacheRead: 0.1,
	cacheWrite5m: 1.25,
	cacheWrite1h: 2,
	source: "test-table",
	...over,
});

describe("parseMeasuredId (ADR-0012 decision 6)", () => {
	it("strips the provider prefix, the fast suffix and a dated suffix", () => {
		expect(parseMeasuredId("google:gemini-3-pro-preview")).toEqual({
			provider: "google",
			slug: "gemini-3-pro-preview",
			fast: false,
		});
		expect(parseMeasuredId("claude-opus-5-20260101#fast")).toEqual({
			provider: null,
			slug: "claude-opus-5",
			fast: true,
		});
	});

	it("keeps a colon inside the model part", () => {
		expect(parseMeasuredId("ollama:llama3.2:3b").slug).toBe("llama3.2:3b");
	});
});

describe("PriceIndex", () => {
	it("closes each period where the next one starts", () => {
		const idx = new PriceIndex({
			id: "t",
			rows: [
				row({ from: T1, input: 3, output: 15 }),
				row({ from: 0, input: 2, output: 10 }),
			],
		});
		expect(idx.rowsFor("m-1", null)).toMatchObject([
			{ from: null, to: T1, input: 2 },
			{ from: T1, to: null, input: 3 },
		]);
	});

	it("keeps a provider's own rows apart from the vendor's", () => {
		const idx = new PriceIndex({
			id: "t",
			rows: [row(), row({ provider: "gateway", input: 9, output: 9 })],
		});
		expect(idx.rowsFor("m-1", "gateway")[0].input).toBe(9);
		expect(idx.rowsFor("m-1", null)[0].input).toBe(1);
	});
});

describe("Pricer", () => {
	const table = {
		id: "served",
		rows: [
			row({
				modelSlug: "claude-opus-5",
				input: 7,
				output: 35,
				vendor: "anthropic",
			}),
			row({ modelSlug: "gemini-x", input: 1, output: 4, vendor: "google" }),
			row({
				modelSlug: "gemini-x",
				provider: "gateway",
				input: 0.5,
				output: 2,
			}),
		],
	};

	it("prices a bare key at the vendor rate and cites the period's source", () => {
		const p = new Pricer([new PriceIndex(table)]);
		expect(p.priceAt("claude-opus-5", T1)).toMatchObject({
			input: 7,
			source: "test-table",
		});
		expect(p.tableFor("claude-opus-5")).toBe("test-table");
	});

	it("lets a vendor provider reach the bare rate, and refuses a gateway without rows", () => {
		const p = new Pricer([new PriceIndex(table)]);
		expect(p.priceAt("google:gemini-x", T1)?.input).toBe(1);
		expect(p.priceAt("openai:gemini-x", T1)).toBeNull();
		expect(p.priceAt("github-copilot:gemini-x", T1)).toBeNull();
	});

	it("prefers a provider's own rows over the vendor's", () => {
		const p = new Pricer([new PriceIndex(table)]);
		expect(p.priceAt("gateway:gemini-x", T1)?.input).toBe(0.5);
	});

	it("takes the vendor from a hint when the table does not say", () => {
		const bare = { id: "t", rows: [row({ modelSlug: "gemini-x" })] };
		const p = new Pricer([new PriceIndex(bare)], (slug) =>
			slug === "gemini-x" ? "google" : null,
		);
		expect(p.priceAt("google:gemini-x", T1)?.input).toBe(1);
	});

	it("prices a local provider free and cites the no-charge table", () => {
		const p = new Pricer([new PriceIndex(table)]);
		expect(p.priceAt("ollama:anything", T1)).toMatchObject({
			input: 0,
			source: LOCAL_PRICING_TABLE_VERSION,
		});
		expect(p.isLocal("ollama:anything")).toBe(true);
	});

	it("answers from the first layer that holds the key", () => {
		const p = new Pricer([new PriceIndex(table), bundledIndex()]);
		expect(p.priceAt("claude-opus-5", T1)?.input).toBe(7);
		// Not in the served table, so the bundled constants answer.
		expect(p.priceAt("claude-haiku-4-5", T1)?.input).toBe(1);
		expect(p.tableIds).toEqual(["served", BUNDLED_PRICE_TABLE_ID]);
	});

	it("returns the periods a window touches, closed by the next start", () => {
		const idx = new PriceIndex({
			id: "t",
			rows: [row({ from: 0 }), row({ from: T1, input: 3, output: 15 })],
		});
		const p = new Pricer([idx]);
		expect(p.periodsInWindow("m-1", T1 - DAY, T1 + DAY)).toHaveLength(2);
		expect(p.periodsInWindow("m-1", T0, T0 + DAY)).toHaveLength(1);
		expect(p.periodsInWindow("m-1", T1 + DAY, T1 + 2 * DAY)).toHaveLength(1);
	});
});

function bundledIndex() {
	return new PriceIndex(bundledPriceTable());
}

describe("bundledPriceTable", () => {
	it("renders every constant with absolute cache rates and its own citation", () => {
		const { id, rows } = bundledPriceTable();
		expect(id).toBe(BUNDLED_PRICE_TABLE_ID);
		const opus = rows.find((r) => r.modelSlug === "claude-opus-5");
		expect(opus).toMatchObject({
			from: 0,
			input: 5,
			output: 25,
			cacheRead: 0.5,
			cacheWrite5m: 6.25,
			cacheWrite1h: 10,
			source: "anthropic-list-2026-07-25",
			vendor: "anthropic",
		});
		const sonnet = rows.filter((r) => r.modelSlug === "claude-sonnet-5");
		expect(sonnet.map((r) => r.input)).toEqual([2, 3]);
	});

	it("still holds the priced lane, which the seed skips", () => {
		expect(PRICED_LANES.has("codex-auto-review")).toBe(true);
		expect(bundledPricer().isPriced("codex-auto-review")).toBe(true);
	});
});

describe("the active pricer", () => {
	it("prices through the served table once installed, and falls back per key", () => {
		try {
			setActivePricer(
				layeredPricer({
					id: "served",
					rows: [
						row({
							modelSlug: "claude-opus-5",
							input: 7,
							output: 35,
							source: "served-src",
						}),
					],
				}),
			);
			expect(activePriceTableIds()).toEqual(["served", BUNDLED_PRICE_TABLE_ID]);
			expect(pricingTableFor("claude-opus-5")).toBe("served-src");
			const t = {
				input: MTOK,
				output: 0,
				cacheWrite5m: 0,
				cacheWrite1h: 0,
				cacheWriteUnsplit: 0,
				cacheRead: 0,
			};
			expect(apiEquivalentCost("claude-opus-5", t, T1)).toBeCloseTo(7, 9);
			expect(isPricedModel("codex-auto-review")).toBe(true);
			expect(pricingTableFor("gpt-5.4")).toBe("openai-list-2026-08-02");
		} finally {
			setActivePricer(null);
		}
		expect(activePriceTableIds()).toEqual([BUNDLED_PRICE_TABLE_ID]);
	});
});

describe("priceTableId", () => {
	it("is stable across row order and changes with any rate", () => {
		const a = [row(), row({ modelSlug: "m-2" })];
		const b = [row({ modelSlug: "m-2" }), row()];
		expect(priceTableId(a)).toBe(priceTableId(b));
		expect(priceTableId(a)).toMatch(/^modelPrices\/2-[0-9a-f]{8}$/);
		expect(
			priceTableId([row({ input: 1.5 }), row({ modelSlug: "m-2" })]),
		).not.toBe(priceTableId(a));
	});
});

describe("parsePriceTable", () => {
	it("drops malformed rows and refuses an empty table", () => {
		const t = parsePriceTable({
			id: "x",
			rows: [row(), { modelSlug: "bad", from: "no" }, { input: 1 }],
		});
		expect(t?.rows).toHaveLength(1);
		expect(parsePriceTable({ id: "x", rows: [] })).toBeNull();
		expect(parsePriceTable("nope")).toBeNull();
		expect(parsePriceTable({ rows: [row()] })).toBeNull();
	});

	it("keeps the optional fields it recognizes and nothing else", () => {
		const t = parsePriceTable({
			id: "x",
			rows: [{ ...row({ provider: "gw", vendor: "google" }), extra: 1 }],
		});
		expect(t?.rows[0]).toEqual(row({ provider: "gw", vendor: "google" }));
	});
});
