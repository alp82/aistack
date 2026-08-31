import { describe, expect, it } from "vitest";
import {
	MINIMUM_NODE_VERSION,
	supportsNodeVersion,
	unsupportedNodeMessage,
} from "./node-version.js";

describe("supportsNodeVersion", () => {
	it("rejects runtimes that cannot read OpenCode's SQLite database", () => {
		expect(supportsNodeVersion("18.20.8")).toBe(false);
		expect(supportsNodeVersion("20.20.2")).toBe(false);
		expect(supportsNodeVersion("22.4.1")).toBe(false);
	});

	it("accepts the node:sqlite floor and newer runtimes", () => {
		expect(supportsNodeVersion(MINIMUM_NODE_VERSION)).toBe(true);
		expect(supportsNodeVersion("v22.18.0")).toBe(true);
		expect(supportsNodeVersion("24.15.0")).toBe(true);
	});

	it("explains why the newer runtime is required", () => {
		expect(unsupportedNodeMessage("20.20.2")).toBe(
			"aistack requires Node.js 22.5.0 or newer. You are running 20.20.2. Upgrade Node.js so sync can read OpenCode's SQLite usage database.",
		);
	});
});
