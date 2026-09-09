import { describe, expect, it } from "vitest";
import { harnessLabel } from "./types.js";

describe("harnessLabel", () => {
	it("provides the Grok Build label used by Discord", () => {
		expect(harnessLabel("grok-build")).toBe("Grok Build");
	});
});
