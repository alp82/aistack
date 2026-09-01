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

	it("rejects the versions where node:sqlite is still behind a flag", () => {
		// 22.5.0 to 22.12.x ship node:sqlite behind --experimental-sqlite.
		expect(supportsNodeVersion("22.5.0")).toBe(false);
		expect(supportsNodeVersion("22.12.0")).toBe(false);
		// The 23 line unflagged it in 23.4.0.
		expect(supportsNodeVersion("23.0.0")).toBe(false);
		expect(supportsNodeVersion("23.3.0")).toBe(false);
	});

	it("accepts the node:sqlite unflagged floor and newer runtimes", () => {
		expect(supportsNodeVersion(MINIMUM_NODE_VERSION)).toBe(true);
		expect(supportsNodeVersion("v22.18.0")).toBe(true);
		expect(supportsNodeVersion("23.4.0")).toBe(true);
		expect(supportsNodeVersion("24.15.0")).toBe(true);
	});

	it("explains why the newer runtime is required", () => {
		expect(unsupportedNodeMessage("20.20.2")).toBe(
			"aistack requires Node.js 22.13.0 or newer (23.x needs 23.4.0). You are running 20.20.2. Upgrade Node.js so sync can read OpenCode's SQLite usage database.",
		);
	});
});
