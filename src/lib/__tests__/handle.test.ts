/**
 * Tests for the pure handle-validation helper shared by client + Convex.
 *
 * Design contract (plan.md Phase A, `src/lib/handle.ts`):
 *   HANDLE_PATTERN = /^[a-z0-9-]+$/, length 3-40, no leading/trailing `-`
 *   RESERVED_HANDLES = every root route segment + infra words
 *   validateHandle(handle): string | null — human-readable error, or null when valid
 *
 * Will fail at import (RED) until src/lib/handle.ts is created and exports
 * these three members.
 */
import { describe, expect, it } from "vitest";
import {
	HANDLE_PATTERN,
	RESERVED_HANDLES,
	validateHandle,
} from "@/lib/handle";

describe("validateHandle", () => {
	// -------------------------------------------------------------------------
	// Happy path
	// -------------------------------------------------------------------------

	it("accepts a lowercase alphanumeric-with-hyphens handle", () => {
		expect(validateHandle("alper-ortac")).toBeNull();
	});

	it("accepts the minimum length (3 chars)", () => {
		expect(validateHandle("abc")).toBeNull();
	});

	it("accepts the maximum length (40 chars)", () => {
		expect(validateHandle("a".repeat(40))).toBeNull();
	});

	it("accepts digits-only handles", () => {
		expect(validateHandle("123456")).toBeNull();
	});

	// -------------------------------------------------------------------------
	// Format rejections
	// -------------------------------------------------------------------------

	it("rejects uppercase characters", () => {
		expect(validateHandle("Alper")).not.toBeNull();
	});

	it("rejects underscores", () => {
		expect(validateHandle("al_per")).not.toBeNull();
	});

	it("rejects spaces", () => {
		expect(validateHandle("al per")).not.toBeNull();
	});

	it("rejects a leading hyphen", () => {
		expect(validateHandle("-alper")).not.toBeNull();
	});

	it("rejects a trailing hyphen", () => {
		expect(validateHandle("alper-")).not.toBeNull();
	});

	it("rejects handles with unicode/emoji characters", () => {
		expect(validateHandle("alpér")).not.toBeNull();
	});

	// -------------------------------------------------------------------------
	// Length rejections
	// -------------------------------------------------------------------------

	it("rejects a handle shorter than 3 chars", () => {
		expect(validateHandle("ab")).not.toBeNull();
	});

	it("rejects a handle longer than 40 chars", () => {
		expect(validateHandle("a".repeat(41))).not.toBeNull();
	});

	it("rejects an empty string", () => {
		expect(validateHandle("")).not.toBeNull();
	});

	// -------------------------------------------------------------------------
	// Reserved words
	// -------------------------------------------------------------------------

	it("rejects every entry in RESERVED_HANDLES", () => {
		for (const reserved of RESERVED_HANDLES) {
			expect(validateHandle(reserved)).not.toBeNull();
		}
	});

	it("rejects 'stacks' as a reserved root route segment", () => {
		expect(validateHandle("stacks")).not.toBeNull();
	});

	it("rejects 'admin' as a reserved infra word", () => {
		expect(validateHandle("admin")).not.toBeNull();
	});

	it("rejects 'api' as a reserved infra word", () => {
		expect(validateHandle("api")).not.toBeNull();
	});

	it("rejects 'new' as a reserved root route segment", () => {
		expect(validateHandle("new")).not.toBeNull();
	});
});

describe("HANDLE_PATTERN", () => {
	it("matches the documented shape /^[a-z0-9-]+$/", () => {
		expect(HANDLE_PATTERN.test("alper-ortac-2")).toBe(true);
		expect(HANDLE_PATTERN.test("Alper")).toBe(false);
	});
});

describe("RESERVED_HANDLES", () => {
	it("contains the core infra words called out in the plan", () => {
		for (const word of ["admin", "api", "stacks", "tools", "signin", "new"]) {
			expect(RESERVED_HANDLES).toContain(word);
		}
	});
});
