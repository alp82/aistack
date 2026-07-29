// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";

// The route module instantiates `new ConvexHttpClient(process.env.VITE_CONVEX_URL)`
// at import time, so the env var and the mock must be in place before the import.
process.env.VITE_CONVEX_URL = "https://example.convex.cloud";

// Mock the convex/browser module so ConvexHttpClient is a no-op constructor
// whose instances carry vi.fn() stubs for mutation and query.
const mockMutation = vi.fn();
const mockQuery = vi.fn();

vi.mock("convex/browser", () => ({
	ConvexHttpClient: vi.fn().mockImplementation(() => ({
		mutation: mockMutation,
		query: mockQuery,
	})),
}));

// Now import the route — the module does NOT exist yet, so these tests are RED.
// biome-ignore lint: dynamic import required for post-mock load order
let Route: typeof import("../api.stacks.$slug")["Route"];
// biome-ignore lint: dynamic import required for post-mock load order
let clientIpFn: typeof import("../api.stacks.$slug")["clientIp"];

beforeAll(async () => {
	const mod = await import("../api.stacks.$slug");
	Route = mod.Route;
	clientIpFn = mod.clientIp;
});

// ---------------------------------------------------------------------------
// Pure helpers — ipFromForwardedFor
// ---------------------------------------------------------------------------

describe("ipFromForwardedFor", () => {
	// biome-ignore lint: dynamic import required for post-mock load order
	let ipFromForwardedFor: (
		header: string | Request | undefined,
	) => string | null;

	beforeAll(async () => {
		const mod = await import("../api.stacks.$slug");
		ipFromForwardedFor = mod.ipFromForwardedFor;
	});

	it("returns the RIGHTMOST IP from a comma-separated list", () => {
		expect(ipFromForwardedFor("9.9.9.9, 1.2.3.4")).toBe("1.2.3.4");
	});

	it("trims whitespace from the rightmost segment", () => {
		expect(ipFromForwardedFor("  9.9.9.9 , 1.2.3.4 ")).toBe("1.2.3.4");
	});

	it("returns a single IP unchanged", () => {
		expect(ipFromForwardedFor("1.2.3.4")).toBe("1.2.3.4");
	});

	it("returns null for undefined", () => {
		expect(ipFromForwardedFor(undefined)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(ipFromForwardedFor("")).toBeNull();
	});

	it("returns null for whitespace-only string", () => {
		expect(ipFromForwardedFor("   ")).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Pure helpers — clientIp
// ---------------------------------------------------------------------------

describe("clientIp", () => {
	it("XFF present — delegates to ipFromForwardedFor (rightmost hop)", () => {
		const req = new Request("http://x/api/stacks/s", {
			headers: { "x-forwarded-for": "9.9.9.9, 1.2.3.4" },
		});
		expect(clientIpFn(req)).toBe("1.2.3.4");
	});

	it("no XFF, request has .ip => returns .ip", () => {
		const req = Object.assign(new Request("http://x/api/stacks/s"), {
			ip: "127.0.0.1",
		});
		expect(clientIpFn(req)).toBe("127.0.0.1");
	});

	it("no XFF, no .ip, but runtime.node.req.socket.remoteAddress set => returns it", () => {
		const req = Object.assign(new Request("http://x/api/stacks/s"), {
			runtime: { node: { req: { socket: { remoteAddress: "10.0.0.5" } } } },
		});
		expect(clientIpFn(req)).toBe("10.0.0.5");
	});

	it("no XFF, no .ip, no runtime => returns null", () => {
		const req = new Request("http://x/api/stacks/s");
		expect(clientIpFn(req)).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Pure helpers — rateLimitHeaders
// ---------------------------------------------------------------------------

describe("rateLimitHeaders", () => {
	// biome-ignore lint: dynamic import required for post-mock load order
	let rateLimitHeaders: (opts: {
		limit: number;
		remaining: number;
		retryAfterSeconds: number;
	}) => Record<string, string>;

	beforeAll(async () => {
		const mod = await import("../api.stacks.$slug");
		rateLimitHeaders = mod.rateLimitHeaders;
	});

	it("maps limit/remaining/retryAfterSeconds to correct header names and string values", () => {
		const headers = rateLimitHeaders({
			limit: 60,
			remaining: 17,
			retryAfterSeconds: 42,
		});
		expect(headers["RateLimit-Limit"]).toBe("60");
		expect(headers["RateLimit-Remaining"]).toBe("17");
		expect(headers["RateLimit-Reset"]).toBe("42");
	});
});

// ---------------------------------------------------------------------------
// GET handler — allowed request with summary returned (200)
// ---------------------------------------------------------------------------

describe("GET handler — 200 on allowed + found stack", () => {
	it("returns 200 with correct headers and body JSON equal to the summary", async () => {
		const summary = {
			slug: "my-stack-abc123",
			name: "My Stack",
			monthlyCost: { currency: "USD", amount: 10, period: "month" },
			toolCount: 1,
			bundleCount: 0,
			modelCount: 0,
			upvoteCount: 5,
			tools: ["Cursor"],
			models: [],
			bundles: [],
		};

		mockMutation.mockResolvedValueOnce({
			allowed: true,
			limit: 60,
			remaining: 59,
			resetAt: Date.now() + 60_000,
			retryAfterSeconds: 0,
		});
		mockQuery.mockResolvedValueOnce(summary);

		const handler = Route.options.server.handlers.GET;
		const response = await handler({
			params: { slug: "x-abc123" },
			request: new Request("http://localhost/api/stacks/x-abc123", {
				headers: { "x-forwarded-for": "1.2.3.4" },
			}),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toMatch(/application\/json/);
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=300, stale-while-revalidate=3600",
		);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("RateLimit-Limit")).toBeTruthy();
		expect(response.headers.get("RateLimit-Remaining")).toBeTruthy();
		expect(response.headers.get("RateLimit-Reset")).toBeTruthy();

		const body = await response.json();
		expect(body).toEqual(summary);
	});
});

// ---------------------------------------------------------------------------
// GET handler — rate limited (429)
// ---------------------------------------------------------------------------

describe("GET handler — 429 when rate limited", () => {
	it("returns 429 with Retry-After + RateLimit-* headers; does NOT call query", async () => {
		const retryAfterSeconds = 37;

		mockMutation.mockResolvedValueOnce({
			allowed: false,
			limit: 60,
			remaining: 0,
			resetAt: Date.now() + retryAfterSeconds * 1000,
			retryAfterSeconds,
		});
		mockQuery.mockClear();

		const handler = Route.options.server.handlers.GET;
		const response = await handler({
			params: { slug: "x-abc123" },
			request: new Request("http://localhost/api/stacks/x-abc123", {
				headers: { "x-forwarded-for": "1.2.3.4" },
			}),
		});

		expect(response.status).toBe(429);
		expect(response.headers.get("Retry-After")).toBe(String(retryAfterSeconds));
		expect(response.headers.get("RateLimit-Limit")).toBeTruthy();
		expect(response.headers.get("RateLimit-Remaining")).toBe("0");
		expect(response.headers.get("RateLimit-Reset")).toBeTruthy();

		const body = await response.json();
		expect(body).toHaveProperty("error");

		// convex.query must NOT have been called when rate-limited
		expect(mockQuery).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// GET handler — stack not found (404)
// ---------------------------------------------------------------------------

describe("GET handler — 404 when stack not found", () => {
	it("returns 404 with jsonError body and RateLimit-* headers; query was called", async () => {
		mockMutation.mockResolvedValueOnce({
			allowed: true,
			limit: 60,
			remaining: 58,
			resetAt: Date.now() + 60_000,
			retryAfterSeconds: 0,
		});
		mockQuery.mockResolvedValueOnce(null);

		const handler = Route.options.server.handlers.GET;
		const response = await handler({
			params: { slug: "x-abc123" },
			request: new Request("http://localhost/api/stacks/x-abc123", {
				headers: { "x-forwarded-for": "1.2.3.4" },
			}),
		});

		expect(response.status).toBe(404);

		const body = await response.json();
		expect(body).toHaveProperty("error");

		// RateLimit-* headers still present on 404
		expect(response.headers.get("RateLimit-Limit")).toBeTruthy();
		expect(response.headers.get("RateLimit-Remaining")).toBeTruthy();
		expect(response.headers.get("RateLimit-Reset")).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// GET handler — fail-closed when neither XFF nor peer address is present (400)
// ---------------------------------------------------------------------------

describe("GET handler — 400 when no XFF and no peer address", () => {
	it("no XFF and no peer address => 400 and does NOT call the rate-limit mutation", async () => {
		mockMutation.mockClear();

		const handler = Route.options.server.handlers.GET;
		const response = await handler({
			params: { slug: "x-abc123" },
			// bare Request: no headers, no .ip, no .runtime
			request: new Request("http://localhost/api/stacks/x-abc123"),
		});

		expect(response.status).toBe(400);

		const body = await response.json();
		expect(body).toHaveProperty("error", "Could not determine client address");

		expect(mockMutation).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// GET handler — dev / non-proxied: peer address used when XFF absent (200)
// ---------------------------------------------------------------------------

describe("GET handler — 200 via peer address when no XFF (local dev)", () => {
	it("no XFF but .ip set => rate-limit mutation called with that ip; 200 returned", async () => {
		const summary = {
			slug: "dev-stack-abc123",
			name: "Dev Stack",
			monthlyCost: { currency: "USD", amount: 0, period: "month" },
			toolCount: 0,
			bundleCount: 0,
			modelCount: 0,
			upvoteCount: 0,
			tools: [],
			models: [],
			bundles: [],
		};

		mockMutation.mockResolvedValueOnce({
			allowed: true,
			limit: 60,
			remaining: 59,
			resetAt: Date.now() + 60_000,
			retryAfterSeconds: 0,
		});
		mockQuery.mockResolvedValueOnce(summary);

		const handler = Route.options.server.handlers.GET;
		const response = await handler({
			params: { slug: "dev-stack-abc123" },
			request: Object.assign(
				new Request("http://localhost:3019/api/stacks/dev-stack-abc123"),
				{ ip: "127.0.0.1" },
			),
		});

		expect(response.status).toBe(200);

		expect(mockMutation).toHaveBeenCalledWith(expect.anything(), {
			key: "ip:127.0.0.1",
		});

		const body = await response.json();
		expect(body).toEqual(summary);
	});
});

// ---------------------------------------------------------------------------
// OPTIONS handler — preflight (204)
// ---------------------------------------------------------------------------

describe("OPTIONS handler — 204 preflight", () => {
	it("returns 204 with CORS headers and null body", async () => {
		const handler = Route.options.server.handlers.OPTIONS;
		const response = await handler();

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toMatch(/GET/);
		expect(response.headers.get("Access-Control-Allow-Methods")).toMatch(
			/OPTIONS/,
		);
		expect(response.headers.get("Access-Control-Max-Age")).toBeTruthy();
		expect(await response.text()).toBe("");
	});
});

// ---------------------------------------------------------------------------
// GET handler — mutation rejects (500)
// ---------------------------------------------------------------------------

describe("GET handler — 500 when convex.mutation rejects", () => {
	it("returns 500 with {error:'Internal error'} when the mutation throws", async () => {
		mockMutation.mockRejectedValueOnce(new Error("Convex unreachable"));

		const handler = Route.options.server.handlers.GET;
		const response = await handler({
			params: { slug: "x-abc123" },
			request: new Request("http://localhost/api/stacks/x-abc123", {
				headers: { "x-forwarded-for": "1.2.3.4" },
			}),
		});

		expect(response.status).toBe(500);

		const body = await response.json();
		expect(body).toHaveProperty("error", "Internal error");
	});
});
