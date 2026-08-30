import { describe, expect, test } from "vitest";
import { proposedMachineName, requestedMachineLabel } from "./login.js";

/**
 * The machine name the CLI proposes at login - wayfinder #49 (map #29).
 *
 * It is a PROPOSAL. The approval page shows it in an editable field, so the
 * user sees this string before anything is stored. That is what makes sending
 * the hostname automatically acceptable rather than a silent upload.
 */
describe("proposedMachineName", () => {
	test("uses the hostname", () => {
		expect(proposedMachineName(() => "alp-desktop")).toBe("alp-desktop");
	});

	test("strips the mDNS suffix, which carries no information for a reader", () => {
		expect(proposedMachineName(() => "alp-macbook.local")).toBe("alp-macbook");
		expect(proposedMachineName(() => "alp-macbook.LOCAL")).toBe("alp-macbook");
	});

	test("proposes nothing rather than a name the server would drop", () => {
		// The server bound is 64 characters. Sending a longer one would be
		// silently discarded there, so the field would render empty with no
		// explanation.
		expect(proposedMachineName(() => "x".repeat(65))).toBeUndefined();
		expect(proposedMachineName(() => "x".repeat(64))).toBe("x".repeat(64));
	});

	test("proposes nothing on a blank or unreadable hostname", () => {
		expect(proposedMachineName(() => "   ")).toBeUndefined();
		expect(
			proposedMachineName(() => {
				throw new Error("no hostname");
			}),
		).toBeUndefined();
	});
});

describe("requestedMachineLabel", () => {
	test("trims an explicit label", () => {
		expect(requestedMachineLabel("  build server  ")).toBe("build server");
	});

	test("refuses a label the confirmation page cannot safely render", () => {
		expect(() => requestedMachineLabel("   ")).toThrow(/Machine label/);
		expect(() => requestedMachineLabel("x".repeat(65))).toThrow(
			/Machine label/,
		);
		expect(() => requestedMachineLabel("bad\u202Ename")).toThrow(
			/Machine label/,
		);
	});
});
