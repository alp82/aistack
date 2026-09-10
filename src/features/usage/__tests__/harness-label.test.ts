import { describe, expect, it } from "vitest";
import { harnessLabel } from "../HarnessShareRows";

describe("usage harness labels", () => {
	it("names Grok Build", () => {
		expect(harnessLabel("grok-build")).toBe("Grok Build");
		expect(harnessLabel("cursor")).toBe("Cursor");
	});
});
