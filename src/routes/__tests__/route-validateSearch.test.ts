// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ADMIN_SEARCH_DEFAULTS, Route as AdminRoute } from "@/routes/admin";
import { LANDING_SEARCH_DEFAULTS, Route as LandingRoute } from "@/routes/index";
import {
	STACKS_SEARCH_DEFAULTS,
	Route as StacksRoute,
} from "@/routes/stacks.index";
import { TOOLS_SEARCH_DEFAULTS, Route as ToolsRoute } from "@/routes/tools";

// Exercises each route's `validateSearch` directly (pure function, no router).
// Guards the per-surface coercion wiring and the default-omission alignment:
// `validateSearch({})` must deep-equal the `*_SEARCH_DEFAULTS` handed to
// `stripSearchParams`, or a default value would never be stripped from the URL.

type Validate = (search: Record<string, unknown>) => Record<string, unknown>;

const validateTools = ToolsRoute.options.validateSearch as unknown as Validate;
const validateStacks = StacksRoute.options
	.validateSearch as unknown as Validate;
const validateLanding = LandingRoute.options
	.validateSearch as unknown as Validate;
const validateAdmin = AdminRoute.options.validateSearch as unknown as Validate;

describe("tools validateSearch", () => {
	it("empty search deep-equals TOOLS_SEARCH_DEFAULTS (strip alignment)", () => {
		expect(validateTools({})).toEqual(TOOLS_SEARCH_DEFAULTS);
	});
	it("keeps valid values", () => {
		expect(
			validateTools({ sort: "most_used", page: "3", filter: "ide" }),
		).toEqual({ filter: "ide", sort: "most_used", q: "", page: 3 });
	});
	it("falls back on invalid sort / page", () => {
		const out = validateTools({ sort: "bogus", page: "abc" });
		expect(out.sort).toBe("newest");
		expect(out.page).toBe(1);
	});
	it("filter default is uppercase ALL", () => {
		expect(validateTools({}).filter).toBe("ALL");
	});
});

describe("stacks validateSearch", () => {
	it("empty search deep-equals STACKS_SEARCH_DEFAULTS (strip alignment)", () => {
		expect(validateStacks({})).toEqual(STACKS_SEARCH_DEFAULTS);
	});
	it("coerces lowQuality and falls back on unknown sort", () => {
		expect(validateStacks({ lowQuality: "true" }).lowQuality).toBe(true);
		expect(validateStacks({ lowQuality: "maybe" }).lowQuality).toBe(false);
		expect(validateStacks({ sort: "trending" }).sort).toBe("newest");
	});
	it("filter default is lowercase all", () => {
		expect(validateStacks({}).filter).toBe("all");
	});
});

describe("landing validateSearch", () => {
	it("empty search deep-equals LANDING_SEARCH_DEFAULTS (no q, strip alignment)", () => {
		expect(validateLanding({})).toEqual(LANDING_SEARCH_DEFAULTS);
		expect(validateLanding({})).not.toHaveProperty("q");
	});
	it("sort default is upvotes and bad values fall back", () => {
		expect(validateLanding({ sort: "bogus" }).sort).toBe("upvotes");
	});
});

describe("admin validateSearch", () => {
	it("empty search deep-equals ADMIN_SEARCH_DEFAULTS (strip alignment)", () => {
		expect(validateAdmin({})).toEqual(ADMIN_SEARCH_DEFAULTS);
	});
	it("keeps valid tab and view", () => {
		expect(validateAdmin({ tab: "email", view: "broadcasts" })).toEqual({
			tab: "email",
			view: "broadcasts",
		});
	});
	it("falls back on invalid tab / view", () => {
		expect(validateAdmin({ tab: "bogus" }).tab).toBe("review");
		expect(validateAdmin({ view: "nope" }).view).toBe("templates");
	});
	it("defaults are review / templates", () => {
		expect(validateAdmin({}).tab).toBe("review");
		expect(validateAdmin({}).view).toBe("templates");
	});
});

describe("filter-default divergence across surfaces", () => {
	it("tools is ALL while stacks/landing are all", () => {
		expect(validateTools({}).filter).toBe("ALL");
		expect(validateStacks({}).filter).toBe("all");
		expect(validateLanding({}).filter).toBe("all");
	});
});
