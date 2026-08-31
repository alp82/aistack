import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

process.env.VITE_CONVEX_SITE_URL = "https://example.convex.site";

let pricesGet: typeof import("../api.prices")["pricesGet"];
let manifestGet: typeof import("../api.cli.sync-manifest")["manifestGet"];

beforeAll(async () => {
	pricesGet = (await import("../api.prices")).pricesGet;
	manifestGet = (await import("../api.cli.sync-manifest")).manifestGet;
});

beforeEach(() => {
	vi.restoreAllMocks();
});

describe("CLI web proxy routes", () => {
	test("prices proxies JSON from the Convex site route", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('{"id":"modelPrices/1-test","rows":[]}', {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const response = await pricesGet();
		expect(fetchMock).toHaveBeenCalledWith(
			"https://example.convex.site/api/prices",
			expect.objectContaining({ headers: { Accept: "application/json" } }),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/json");
		expect(await response.json()).toEqual({
			id: "modelPrices/1-test",
			rows: [],
		});
	});

	test("manifest forwards authorization and never caches", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(Response.json({ retentionDays: 400, days: [] }));
		vi.stubGlobal("fetch", fetchMock);
		const request = new Request("https://aistack.to/api/cli/sync-manifest", {
			headers: { Authorization: "Bearer secret" },
		});

		const response = await manifestGet({ request });
		expect(fetchMock).toHaveBeenCalledWith(
			"https://example.convex.site/api/cli/sync-manifest",
			expect.objectContaining({
				headers: {
					Accept: "application/json",
					Authorization: "Bearer secret",
				},
			}),
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(await response.json()).toEqual({ retentionDays: 400, days: [] });
	});

	test("a failed upstream returns JSON 502", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
		const response = await pricesGet();
		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({
			error: "Price proxy failed: offline",
		});
	});
});
