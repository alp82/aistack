import { afterEach, describe, expect, test, vi } from "vitest";
import { BUNDLED_SYNC_CONFIG } from "../harness/shared/allowlist.js";
import { stageSync } from "./stage.js";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("sync startup with a stalled server", () => {
	test.each([
		["/api/prices", "headers"],
		["/api/prices", "body"],
		["/api/sync-config", "headers"],
		["/api/sync-config", "body"],
		["/api/cli/sync-manifest", "headers"],
		["/api/cli/sync-manifest", "body"],
	])("leaves startup when %s stalls at %s", async (path, phase) => {
		vi.useFakeTimers();
		// Node's native AbortSignal timeout uses an internal clock. Connect it
		// to the test clock while preserving cancellation of headers and body.
		vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
			const controller = new AbortController();
			setTimeout(
				() => controller.abort(new DOMException("Timed out", "TimeoutError")),
				ms,
			);
			return controller.signal;
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string, init?: RequestInit) => {
				if (!url.endsWith(path)) {
					return new Response(
						JSON.stringify({
							...BUNDLED_SYNC_CONFIG,
							stack: { name: "Test", slug: "test" },
						}),
						{ status: url.endsWith("/api/sync-config") ? 200 : 404 },
					);
				}
				if (phase === "headers") {
					return new Promise<Response>((_, reject) => {
						init?.signal?.addEventListener(
							"abort",
							() => reject(init.signal?.reason),
							{ once: true },
						);
					});
				}
				return new Response(
					new ReadableStream({
						start(controller) {
							controller.enqueue(new TextEncoder().encode("{"));
							init?.signal?.addEventListener(
								"abort",
								() => controller.error(init.signal?.reason),
								{ once: true },
							);
						},
					}),
				);
			}),
		);
		const adapters = vi.fn(async () => []);
		const staging = stageSync({
			baseUrl: "https://sync.test",
			getTokenImpl: () => "test-token",
			getSettingsImpl: () => ({}),
			adaptersImpl: adapters,
		});
		await vi.advanceTimersByTimeAsync(5_001);
		expect(
			adapters,
			"sync must leave network startup within its read deadline",
		).toHaveBeenCalled();
		const staged = await staging;
		if (path === "/api/prices") expect(staged.prices?.origin).toBe("bundled");
		if (path === "/api/sync-config") {
			expect(staged.config.stack).toBeNull();
			expect(staged.blockedReason).not.toBeNull();
		}
	});
});
