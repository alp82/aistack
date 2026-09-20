import { describe, expect, it } from "vitest";
import { contextOf, waffleCells } from "../context";
import { contextReading } from "./fixture";

describe("context cells", () => {
	it("preserves the measured split and full window", () => {
		const h = contextReading().harnesses[0];
		const cells = waffleCells(h, h.window ?? 1);
		expect(cells).toHaveLength(200);
		expect(cells[0]).toBe("harness");
		const order = ["harness", "instructions", "usualChat", "longChat", "free"];
		expect(cells.map((c) => order.indexOf(c))).toEqual(
			cells.map((c) => order.indexOf(c)).sort((a, b) => a - b),
		);
	});
	it("omits absent context", () => {
		expect(contextOf(null)).toBeNull();
		expect(contextOf({ context: { harnesses: [] } })).toBeNull();
	});
});
