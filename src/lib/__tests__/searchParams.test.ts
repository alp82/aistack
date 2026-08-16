/**
 * Unit tests for src/lib/searchParams.ts (coerceEnum, coerceString, coercePage,
 * coerceBool, makeSearchUpdater).
 *
 * Acceptance criteria covered HERE (pure unit):
 *   - coerceEnum: member / non-member / wrong type / case-sensitivity
 *   - coerceString: string passthrough including empty string; non-string fallback
 *   - coercePage: integer ≥1 passthrough; fractions, negatives, non-numeric → 1
 *     (PINNED: 3.7 → 1, "3.7" → 1, "  2  " → 2 - Number() trims whitespace)
 *   - coerceBool: true/"true"/false/"false" passthrough; anything else → fallback
 *   - makeSearchUpdater: navigate called with replace:true; patch merges over prev;
 *     page resets when a resetPageKey is touched (and "page" not explicit);
 *     no reset when page is explicit; no reset for non-reset keys; custom resetPageKeys;
 *     resetScroll defaults to true and passes through as false when set
 *
 * NOT covered here (integration / manual only):
 *   - URL round-trip (serialisation/deserialisation via TanStack Router)
 *   - stripSearchParams default-omission behaviour
 *   - back-button and refresh preserving params
 *   - in-component page-clamp upper bound
 */

import { describe, expect, it, vi } from "vitest";
import {
	coerceBool,
	coerceEnum,
	coercePage,
	coerceString,
	makeSearchUpdater,
} from "@/lib/searchParams";

// ---------------------------------------------------------------------------
// coerceEnum
// ---------------------------------------------------------------------------

describe("coerceEnum", () => {
	const allowed = ["newest", "most_used"] as const;

	it('returns value when it is a valid member: "newest"', () => {
		expect(coerceEnum("newest", allowed, "newest")).toBe("newest");
	});

	it('returns value when it is a valid member: "most_used"', () => {
		expect(coerceEnum("most_used", allowed, "newest")).toBe("most_used");
	});

	it("returns fallback for a value not in the allowed list", () => {
		expect(coerceEnum("trending", allowed, "newest")).toBe("newest");
	});

	it("returns fallback for empty string", () => {
		expect(coerceEnum("", allowed, "newest")).toBe("newest");
	});

	it("returns fallback for undefined", () => {
		expect(coerceEnum(undefined, allowed, "newest")).toBe("newest");
	});

	it("returns fallback for null", () => {
		expect(coerceEnum(null, allowed, "newest")).toBe("newest");
	});

	it("returns fallback for number 1", () => {
		expect(coerceEnum(1, allowed, "newest")).toBe("newest");
	});

	it("returns fallback for boolean true", () => {
		expect(coerceEnum(true, allowed, "newest")).toBe("newest");
	});

	it('is case-sensitive: "NEWEST" does not match ["newest"]', () => {
		expect(coerceEnum("NEWEST", ["newest"] as const, "newest")).toBe("newest");
	});

	it("returns fallback when value is not in a multi-value allowed list", () => {
		const sortAllowed = ["all", "upvotes", "newest"] as const;
		expect(coerceEnum("bogus", sortAllowed, "upvotes")).toBe("upvotes");
	});
});

// ---------------------------------------------------------------------------
// coerceString
// ---------------------------------------------------------------------------

describe("coerceString", () => {
	it('returns the string value "hello"', () => {
		expect(coerceString("hello", "default")).toBe("hello");
	});

	it("treats empty string as valid (returns empty string, not fallback)", () => {
		expect(coerceString("", "default")).toBe("");
	});

	it("returns fallback for undefined", () => {
		expect(coerceString(undefined, "default")).toBe("default");
	});

	it("returns fallback for null", () => {
		expect(coerceString(null, "default")).toBe("default");
	});

	it("returns fallback for number 42", () => {
		expect(coerceString(42, "default")).toBe("default");
	});

	it("returns fallback for boolean false", () => {
		expect(coerceString(false, "default")).toBe("default");
	});
});

// ---------------------------------------------------------------------------
// coercePage  (PINNED rules - assert exact values)
// ---------------------------------------------------------------------------

describe("coercePage", () => {
	it('coerces "3" (string) to 3', () => {
		expect(coercePage("3")).toBe(3);
	});

	it("coerces 5 (number) to 5", () => {
		expect(coercePage(5)).toBe(5);
	});

	it('coerces "1" to 1', () => {
		expect(coercePage("1")).toBe(1);
	});

	it('coerces "0" to 1 (below minimum)', () => {
		expect(coercePage("0")).toBe(1);
	});

	it('coerces "-5" to 1 (negative)', () => {
		expect(coercePage("-5")).toBe(1);
	});

	it('coerces "abc" to 1 (non-numeric)', () => {
		expect(coercePage("abc")).toBe(1);
	});

	it("coerces 3.7 (float) to 1 (not an integer) - PINNED", () => {
		expect(coercePage(3.7)).toBe(1);
	});

	it('coerces "3.7" (string float) to 1 - PINNED', () => {
		expect(coercePage("3.7")).toBe(1);
	});

	it('coerces "  2  " (whitespace-padded) to 2 - Number() trims - PINNED', () => {
		expect(coercePage("  2  ")).toBe(2);
	});

	it("coerces undefined to 1", () => {
		expect(coercePage(undefined)).toBe(1);
	});

	it("coerces null to 1", () => {
		expect(coercePage(null)).toBe(1);
	});

	it("coerces 0 to 1", () => {
		expect(coercePage(0)).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// coerceBool
// ---------------------------------------------------------------------------

describe("coerceBool", () => {
	it('returns true for the string "true"', () => {
		expect(coerceBool("true", false)).toBe(true);
	});

	it('returns false for the string "false"', () => {
		expect(coerceBool("false", true)).toBe(false);
	});

	it("returns true for boolean true", () => {
		expect(coerceBool(true, false)).toBe(true);
	});

	it("returns false for boolean false", () => {
		expect(coerceBool(false, true)).toBe(false);
	});

	it('returns fallback for "1" (not canonical true)', () => {
		expect(coerceBool("1", false)).toBe(false);
	});

	it('returns fallback for "TRUE" (case-sensitive)', () => {
		expect(coerceBool("TRUE", false)).toBe(false);
	});

	it('returns fallback for "yes"', () => {
		expect(coerceBool("yes", false)).toBe(false);
	});

	it("returns fallback for number 1", () => {
		expect(coerceBool(1, false)).toBe(false);
	});

	it("returns fallback for undefined", () => {
		expect(coerceBool(undefined, false)).toBe(false);
	});

	it("returns fallback (true) for null when fallback is true", () => {
		expect(coerceBool(null, true)).toBe(true);
	});

	it('returns fallback for "" (empty string)', () => {
		expect(coerceBool("", false)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// makeSearchUpdater
// ---------------------------------------------------------------------------

type FullSearch = {
	filter: string;
	sort: string;
	q: string;
	page: number;
	lowQuality: boolean;
};

const RESET_KEYS: (keyof FullSearch)[] = ["filter", "sort", "q"];

/**
 * Helper: invoke setSearch and resolve what navigate was called with by
 * executing the search updater function against `prev`.
 */
function resolveSearch(
	navigate: ReturnType<typeof vi.fn>,
	prev: FullSearch,
): FullSearch {
	const [call] = navigate.mock.calls;
	return call[0].search(prev) as FullSearch;
}

describe("makeSearchUpdater", () => {
	it("calls navigate with replace: true", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		setSearch({ sort: "upvotes" });
		expect(navigate).toHaveBeenCalledOnce();
		expect(navigate.mock.calls[0][0].replace).toBe(true);
	});

	it("merges patch over prev and resets page when sort is touched", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 2,
			lowQuality: false,
		};
		setSearch({ sort: "upvotes" });
		const result = resolveSearch(navigate, prev);
		expect(result).toEqual({
			filter: "all",
			sort: "upvotes",
			q: "",
			page: 1,
			lowQuality: false,
		});
	});

	it("resets page to 1 when patch touches 'filter'", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 5,
			lowQuality: false,
		};
		setSearch({ filter: "ide" });
		expect(resolveSearch(navigate, prev).page).toBe(1);
	});

	it("resets page to 1 when patch touches 'sort'", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 3,
			lowQuality: false,
		};
		setSearch({ sort: "most_used" });
		expect(resolveSearch(navigate, prev).page).toBe(1);
	});

	it("resets page to 1 when patch touches 'q'", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 4,
			lowQuality: false,
		};
		setSearch({ q: "cursor" });
		expect(resolveSearch(navigate, prev).page).toBe(1);
	});

	it("does NOT reset page when patch explicitly sets page", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 1,
			lowQuality: false,
		};
		setSearch({ page: 3 });
		expect(resolveSearch(navigate, prev).page).toBe(3);
	});

	it("does NOT reset page when patch touches a non-reset key", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 4,
			lowQuality: false,
		};
		setSearch({ lowQuality: true });
		expect(resolveSearch(navigate, prev).page).toBe(4);
	});

	it("uses explicit page when patch sets both a reset key and page", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 1,
			lowQuality: false,
		};
		setSearch({ sort: "upvotes", page: 2 });
		expect(resolveSearch(navigate, prev).page).toBe(2);
	});

	it("resets page when custom resetPageKeys includes 'lowQuality'", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: ["lowQuality"],
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 3,
			lowQuality: false,
		};
		setSearch({ lowQuality: true });
		expect(resolveSearch(navigate, prev).page).toBe(1);
	});

	it("resets page when patch touches multiple reset keys", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 7,
			lowQuality: false,
		};
		setSearch({ filter: "ide", sort: "upvotes", q: "" });
		expect(resolveSearch(navigate, prev).page).toBe(1);
	});

	it("handles empty patch cleanly: no page reset, replace:true still passed", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		const prev: FullSearch = {
			filter: "all",
			sort: "newest",
			q: "",
			page: 2,
			lowQuality: false,
		};
		setSearch({});
		expect(navigate.mock.calls[0][0].replace).toBe(true);
		expect(resolveSearch(navigate, prev).page).toBe(2);
	});

	it("passes resetScroll: true by default", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
		});
		setSearch({ sort: "upvotes" });
		expect(navigate.mock.calls[0][0].resetScroll).toBe(true);
	});

	it("passes resetScroll: false through when set", () => {
		const navigate = vi.fn();
		const setSearch = makeSearchUpdater<FullSearch>(navigate, {
			resetPageKeys: RESET_KEYS,
			resetScroll: false,
		});
		setSearch({ sort: "upvotes" });
		expect(navigate.mock.calls[0][0].resetScroll).toBe(false);
	});
});
