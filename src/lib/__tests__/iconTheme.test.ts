import { describe, expect, it } from "vitest";
import { isMonochromeLogo, monochromeLogoClass } from "../iconTheme";

describe("monochromeLogoClass", () => {
	it("inverts models.dev logos in dark mode and restores them under .light", () => {
		expect(monochromeLogoClass("https://models.dev/logos/anthropic.svg")).toBe(
			"invert [.light_&]:invert-0",
		);
	});
	it("leaves every other icon source alone", () => {
		expect(monochromeLogoClass("https://example.com/icon.png")).toBeUndefined();
		expect(monochromeLogoClass(undefined)).toBeUndefined();
		expect(isMonochromeLogo(null)).toBe(false);
	});
});
