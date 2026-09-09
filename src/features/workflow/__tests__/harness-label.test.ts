import { describe, expect, it } from "vitest";
import { harnessLabelOf } from "../copy";

describe("workflow harness labels", () => {
	it("names Grok Build", () => {
		expect(harnessLabelOf("grok-build")).toBe("Grok Build");
	});
});
